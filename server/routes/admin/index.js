/**
 * Admin API Routes
 * RESTful endpoints for admin operations
 */

const express = require('express');
const router = express.Router();
const { authenticate, authMiddleware } = require('../../../lib/auth');
const shopManager = require('../../../lib/admin/shop-manager');
const auditLog = require('../../../lib/audit-log');

// ---------------------------------------------------------------------------
// Simple in-memory rate limiter for the login endpoint
// Tracks failed attempts per IP; blocks after MAX_ATTEMPTS within WINDOW_MS.
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

// Login endpoint
router.post('/auth/login', loginRateLimiter, async (req, res) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and password required' 
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
            success: true 
        });
        
        res.json(result);
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Authentication failed' 
        });
    }
});

// Verify token endpoint
router.get('/auth/verify', authMiddleware(), (req, res) => {
    res.json({ 
        success: true, 
        user: req.user 
    });
});

// ===== SHOP ROUTES =====

// Get all shops with filters
router.get('/shops', authMiddleware(), (req, res) => {
    try {
        const options = {
            search: req.query.search,
            status: req.query.status,
            type: req.query.type,
            city: req.query.city,
            country: req.query.country,
            minConfidence: req.query.minConfidence ? parseInt(req.query.minConfidence) : null,
            sortBy: req.query.sortBy,
            sortDesc: req.query.sortDesc === 'true',
            page: req.query.page ? parseInt(req.query.page) : 1,
            limit: req.query.limit ? parseInt(req.query.limit) : 50
        };
        
        const result = shopManager.getFilteredShops(options);
        res.json(result);
    } catch (err) {
        console.error('Error fetching shops:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch shops' 
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
                message: 'Shop not found' 
            });
        }
        
        res.json({ success: true, shop });
    } catch (err) {
        console.error('Error fetching shop:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch shop' 
        });
    }
});

// Create shop
router.post('/shops', authMiddleware('editor'), (req, res) => {
    try {
        const result = shopManager.createShop(req.body, req.user.email);
        
        if (!result.success) {
            return res.status(400).json(result);
        }
        
        res.status(201).json(result);
    } catch (err) {
        console.error('Error creating shop:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create shop' 
        });
    }
});

// Update shop
router.put('/shops/:id', authMiddleware('editor'), (req, res) => {
    try {
        const result = shopManager.updateShop(req.params.id, req.body, req.user.email);
        
        if (!result.success) {
            return res.status(404).json(result);
        }
        
        res.json(result);
    } catch (err) {
        console.error('Error updating shop:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update shop' 
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
            message: 'Failed to delete shop' 
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
                message: 'Shops must be an array' 
            });
        }
        
        const result = shopManager.batchImportShops(shops, req.user.email);
        res.json(result);
    } catch (err) {
        console.error('Error importing shops:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to import shops' 
        });
    }
});

// ===== AUDIT LOG ROUTES =====

// Get audit logs
router.get('/audit-logs', authMiddleware(), (req, res) => {
    try {
        const options = {
            action: req.query.action,
            entityType: req.query.entityType,
            actor: req.query.actor,
            startDate: req.query.startDate,
            endDate: req.query.endDate,
            page: req.query.page ? parseInt(req.query.page) : 1,
            limit: req.query.limit ? parseInt(req.query.limit) : 50
        };
        
        const result = auditLog.getFilteredLogs(options);
        res.json(result);
    } catch (err) {
        console.error('Error fetching audit logs:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch audit logs' 
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
            message: 'Failed to export audit logs' 
        });
    }
});

module.exports = router;
