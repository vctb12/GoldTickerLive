/**
 * Admin API Routes
 * RESTful endpoints for admin operations
 */

const express = require('express');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const auth = require('../../lib/auth');
const { authenticate, authMiddleware } = auth;
const shopManager = require('../../lib/admin/shop-manager');
const auditLog = require('../../lib/audit-log');
const shopsRepo = require('../../repositories/shops.repository');
const auditRepo = require('../../repositories/audit.repository');
const { ValidationError, NotFoundError } = require('../../lib/errors');

// ---------------------------------------------------------------------------
// Simple in-memory rate limiter for the login endpoint
// Tracks *failed* attempts per IP; blocks after MAX_ATTEMPTS within WINDOW_MS.
// Uses a custom implementation so it only counts failures, not all requests.
// ---------------------------------------------------------------------------
const LOGIN_MAX_ATTEMPTS = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const loginAttempts = new Map(); // ip -> { count, firstAttemptAt }

function loginRateLimiter(req, res, next) {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (record) {
    if (now - record.firstAttemptAt > LOGIN_WINDOW_MS) {
      loginAttempts.delete(ip);
    } else if (record.count >= LOGIN_MAX_ATTEMPTS) {
      const retryAfterSec = Math.ceil((LOGIN_WINDOW_MS - (now - record.firstAttemptAt)) / 1000);
      res.set('Retry-After', retryAfterSec);
      return res.status(429).json({
        success: false,
        message: 'Too many login attempts. Please try again later.',
      });
    }
  }
  next();
}

function recordFailedLogin(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || now - record.firstAttemptAt > LOGIN_WINDOW_MS) {
    loginAttempts.set(ip, { count: 1, firstAttemptAt: now });
  } else {
    record.count += 1;
  }
}

function clearLoginAttempts(ip) {
  loginAttempts.delete(ip);
}

// ---------------------------------------------------------------------------
// Rate limiter for authenticated admin routes (user management, stats).
// 100 requests per IP per 15-minute window.
// Using express-rate-limit so static analysis tools can recognise the pattern.
// ---------------------------------------------------------------------------
const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

// ---------------------------------------------------------------------------
// Input validation helpers
// ---------------------------------------------------------------------------

/** Sanitise a string: trim, collapse whitespace, limit length. Returns undefined for non-string values. */
function sanitizeString(val, maxLen = 500) {
  if (val === undefined || val === null) return undefined;
  if (typeof val !== 'string') return undefined;
  const cleaned = val.trim().replace(/\s+/g, ' ').slice(0, maxLen);
  return cleaned || undefined;
}

/** Validate integer query param (returns parsed int or default). */
function parseIntParam(val, defaultVal, min = 1, max = 1000) {
  if (val === undefined || val === null) return defaultVal;
  const n = parseInt(val, 10);
  if (isNaN(n) || n < min) return defaultVal;
  return Math.min(n, max);
}

/** Validate shop data fields. Returns sanitised object or throws ValidationError. */
function validateShopInput(body) {
  const cleaned = {};
  const stringFields = [
    'name',
    'city',
    'country',
    'phone',
    'email',
    'website',
    'address',
    'hours',
    'type',
    'status',
    'description',
  ];
  const booleanFields = ['verified', 'featured'];
  const numberFields = ['latitude', 'longitude'];

  for (const field of stringFields) {
    if (body[field] !== undefined) {
      const val = sanitizeString(body[field]);
      if (val !== undefined) cleaned[field] = val;
    }
  }

  for (const field of booleanFields) {
    if (body[field] !== undefined) {
      if (typeof body[field] === 'boolean') {
        cleaned[field] = body[field];
      } else if (body[field] === 'true' || body[field] === 'false') {
        cleaned[field] = body[field] === 'true';
      }
      // Silently ignore invalid boolean values
    }
  }

  for (const field of numberFields) {
    if (body[field] !== undefined) {
      const num = Number(body[field]);
      if (!isNaN(num) && isFinite(num)) {
        cleaned[field] = num;
      }
    }
  }

  return cleaned;
}

// Login endpoint
router.post('/auth/login', loginRateLimiter, async (req, res) => {
  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password required',
      });
    }

    const result = await authenticate(email, password);

    if (!result.success) {
      recordFailedLogin(ip);
      return res.status(401).json(result);
    }

    clearLoginAttempts(ip);

    // Log login
    auditLog.logAction(result.user.email, 'login', 'user', result.user.id, {
      success: true,
    });

    res.json(result);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
    });
  }
});

// Verify token endpoint
router.get('/auth/verify', authMiddleware(), (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});

// ---------------------------------------------------------------------------
// PIN verification endpoint (server-side check).
// The ADMIN_ACCESS_PIN env var controls the quick-access PIN.
// If not set, PIN access is disabled and the endpoint tells the client.
// Rate-limited to prevent brute-force attacks on the 6-digit PIN.
// ---------------------------------------------------------------------------
const PIN_MAX_ATTEMPTS = 5;
const PIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const pinAttempts = new Map(); // ip -> { count, firstAttemptAt }

router.post('/auth/verify-pin', (req, res) => {
  const pin = process.env.ADMIN_ACCESS_PIN;

  // If PIN not configured, tell client to skip to OAuth login
  if (!pin) {
    return res.json({ success: false, redirect: true, message: 'PIN access is disabled.' });
  }

  const ip = req.ip || req.socket?.remoteAddress || 'unknown';
  const now = Date.now();
  const record = pinAttempts.get(ip);

  // Check rate limit
  if (record) {
    if (now - record.firstAttemptAt > PIN_WINDOW_MS) {
      pinAttempts.delete(ip);
    } else if (record.count >= PIN_MAX_ATTEMPTS) {
      const retryAfterSec = Math.ceil((PIN_WINDOW_MS - (now - record.firstAttemptAt)) / 1000);
      res.set('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        success: false,
        message: 'Too many PIN attempts. Please use GitHub login.',
      });
    }
  }

  const { pin: submittedPin } = req.body;
  if (!submittedPin || typeof submittedPin !== 'string' || !/^\d{6}$/.test(submittedPin)) {
    return res.status(400).json({ success: false, message: 'Invalid PIN format.' });
  }

  // Constant-time comparison using Node.js crypto to prevent timing attacks
  const expectedBuf = Buffer.from(String(pin).padEnd(6, '0').slice(0, 6), 'utf8');
  const submittedBuf = Buffer.from(submittedPin.padEnd(6, '0').slice(0, 6), 'utf8');
  const match = crypto.timingSafeEqual(expectedBuf, submittedBuf);

  if (match) {
    pinAttempts.delete(ip);
    return res.json({ success: true });
  }

  // Record failed attempt
  const rec = pinAttempts.get(ip);
  if (!rec || now - rec.firstAttemptAt > PIN_WINDOW_MS) {
    pinAttempts.set(ip, { count: 1, firstAttemptAt: now });
  } else {
    rec.count += 1;
  }

  const remaining = PIN_MAX_ATTEMPTS - (pinAttempts.get(ip)?.count || 0);
  return res.status(401).json({
    success: false,
    message: 'Incorrect PIN.',
    remaining: Math.max(0, remaining),
  });
});

// ===== SHOP ROUTES =====

// Get all shops with filters
router.get('/shops', authMiddleware(), (req, res) => {
  try {
    const options = {
      search: sanitizeString(req.query.search, 200),
      status: sanitizeString(req.query.status, 50),
      type: sanitizeString(req.query.type, 50),
      city: sanitizeString(req.query.city, 100),
      country: sanitizeString(req.query.country, 100),
      minConfidence: parseIntParam(req.query.minConfidence, null, 0, 100),
      sortBy: sanitizeString(req.query.sortBy, 50),
      sortDesc: req.query.sortDesc === 'true',
      page: parseIntParam(req.query.page, 1, 1, 10000),
      limit: parseIntParam(req.query.limit, 50, 1, 200),
    };

    const result = shopManager.getFilteredShops(options);
    res.json(result);
  } catch (err) {
    console.error('Error fetching shops:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shops',
    });
  }
});

// Get single shop
router.get('/shops/:id', authMiddleware(), (req, res) => {
  try {
    const shop = shopManager.getShopById(req.params.id);

    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Shop not found',
      });
    }

    res.json({ success: true, shop });
  } catch (err) {
    console.error('Error fetching shop:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch shop',
    });
  }
});

// Create shop
router.post('/shops', authMiddleware('editor'), (req, res) => {
  try {
    const shopData = validateShopInput(req.body);
    const result = shopManager.createShop(shopData, req.user.email);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(err.statusCode).json(err.toJSON());
    }
    console.error('Error creating shop:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to create shop',
    });
  }
});

// Update shop
router.put('/shops/:id', authMiddleware('editor'), (req, res) => {
  try {
    const shopData = validateShopInput(req.body);
    const result = shopManager.updateShop(req.params.id, shopData, req.user.email);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (err) {
    if (err instanceof ValidationError) {
      return res.status(err.statusCode).json(err.toJSON());
    }
    console.error('Error updating shop:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update shop',
    });
  }
});

// Delete shop
router.delete('/shops/:id', authMiddleware('admin'), (req, res) => {
  try {
    const result = shopManager.deleteShop(req.params.id, req.user.email);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (err) {
    console.error('Error deleting shop:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to delete shop',
    });
  }
});

// Batch import shops
router.post('/shops/batch-import', authMiddleware('admin'), (req, res) => {
  try {
    const { shops } = req.body;

    if (!Array.isArray(shops)) {
      return res.status(400).json({
        success: false,
        message: 'Shops must be an array',
      });
    }

    if (shops.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Batch import limited to 500 shops per request',
      });
    }

    const sanitisedShops = shops.map((s) => validateShopInput(s));
    const result = shopManager.batchImportShops(sanitisedShops, req.user.email);
    res.json(result);
  } catch (err) {
    console.error('Error importing shops:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to import shops',
    });
  }
});

// ===== AUDIT LOG ROUTES =====

// Get audit logs
router.get('/audit-logs', authMiddleware(), (req, res) => {
  try {
    const options = {
      action: sanitizeString(req.query.action, 50),
      entityType: sanitizeString(req.query.entityType, 50),
      actor: sanitizeString(req.query.actor, 200),
      startDate: sanitizeString(req.query.startDate, 30),
      endDate: sanitizeString(req.query.endDate, 30),
      page: parseIntParam(req.query.page, 1, 1, 10000),
      limit: parseIntParam(req.query.limit, 50, 1, 200),
    };

    const result = auditLog.getFilteredLogs(options);
    res.json(result);
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
    });
  }
});

// Export audit logs as CSV
router.get('/audit-logs/export', authMiddleware('admin'), (req, res) => {
  try {
    const csv = auditLog.exportToCSV();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv"');
    res.send(csv);
  } catch (err) {
    console.error('Error exporting audit logs:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to export audit logs',
    });
  }
});

// ===== USER MANAGEMENT ROUTES =====
// All routes require admin role and are rate-limited.

// List all users (no passwords)
router.get('/users', adminRateLimiter, authMiddleware('admin'), (req, res) => {
  try {
    const users = auth.getAllUsers();
    res.json({ success: true, users });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// Create a new user
router.post('/users', adminRateLimiter, authMiddleware('admin'), async (req, res) => {
  try {
    const email = sanitizeString(req.body.email, 254);
    const name = sanitizeString(req.body.name, 200);
    const role = sanitizeString(req.body.role, 20);
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const allowedRoles = ['viewer', 'editor', 'admin'];
    if (role && !allowedRoles.includes(role)) {
      return res
        .status(400)
        .json({ success: false, message: `Role must be one of: ${allowedRoles.join(', ')}` });
    }

    const result = await auth.createUser({ email, password, name, role }, req.user.email);

    if (!result.success) {
      return res.status(400).json(result);
    }

    auditLog.logAction(req.user.email, 'create', 'user', result.user.id, {
      email: result.user.email,
      role: result.user.role,
    });
    res.status(201).json(result);
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ success: false, message: 'Failed to create user' });
  }
});

// Update a user (name, role, or password)
router.put('/users/:id', adminRateLimiter, authMiddleware('admin'), async (req, res) => {
  try {
    const { name, role, password } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = sanitizeString(name, 200);
    if (role !== undefined) {
      const allowedRoles = ['viewer', 'editor', 'admin'];
      const cleanRole = sanitizeString(role, 20);
      if (!allowedRoles.includes(cleanRole)) {
        return res
          .status(400)
          .json({ success: false, message: `Role must be one of: ${allowedRoles.join(', ')}` });
      }
      updates.role = cleanRole;
    }
    // Require password to be a non-empty string of at least 8 chars if provided
    if (password !== undefined) {
      if (typeof password !== 'string' || password.length < 8) {
        return res
          .status(400)
          .json({ success: false, message: 'Password must be at least 8 characters' });
      }
      updates.password = password;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update' });
    }

    const result = await auth.updateUser(req.params.id, updates, req.user.email);

    if (!result.success) {
      return res.status(404).json(result);
    }

    const auditUpdates = { ...updates };
    if (auditUpdates.password) auditUpdates.password = '[redacted]';
    auditLog.logAction(req.user.email, 'update', 'user', req.params.id, auditUpdates);
    res.json(result);
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ success: false, message: 'Failed to update user' });
  }
});

// Delete a user
router.delete('/users/:id', adminRateLimiter, authMiddleware('admin'), (req, res) => {
  try {
    const result = auth.deleteUser(req.params.id, req.user.email);

    if (!result.success) {
      return res.status(400).json(result);
    }

    auditLog.logAction(req.user.email, 'delete', 'user', req.params.id, {});
    res.json(result);
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
});

// ===== DASHBOARD STATS =====

// GET /stats — aggregate metrics for the admin dashboard
router.get('/stats', adminRateLimiter, authMiddleware(), async (req, res) => {
  try {
    const shopStats = await shopsRepo.getStats();
    const recentLogs = await auditRepo.query({ page: 1, limit: 10 });
    const users = auth.getAllUsers();

    res.json({
      success: true,
      stats: {
        shops: shopStats,
        users: {
          total: users.length,
          admins: users.filter((u) => u.role === 'admin').length,
        },
        auditLog: {
          recentEntries: recentLogs.logs,
          total: recentLogs.total,
        },
        storageBackend: 'configured',
      },
    });
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

module.exports = router;
