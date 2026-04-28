/**
 * Authentication Middleware
 * JWT-based authentication and role-based access control
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// JWT_SECRET is required in all environments — no insecure default.
const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRY = '24h';

if (!JWT_SECRET) {
  throw new Error(
    '[auth] FATAL: JWT_SECRET environment variable is not set. ' +
      'Set a strong, random JWT_SECRET before starting the server.'
  );
}

// ADMIN_PASSWORD is required in all environments — no insecure default.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  throw new Error(
    '[auth] FATAL: ADMIN_PASSWORD environment variable is not set. ' +
      'Set a strong ADMIN_PASSWORD before starting the server.'
  );
}

// In-memory user store (replace with database in production).
// `tokenVersion` defaults to 1 and is bumped on password change or delete;
// authMiddleware rejects tokens whose embedded version is behind the user
// record, so stolen tokens stop being valid the moment credentials change.
let users = [
  {
    id: 'admin_1',
    email: 'admin@goldprices.com',
    password: bcrypt.hashSync(ADMIN_PASSWORD, 12),
    name: 'Administrator',
    role: 'admin',
    tokenVersion: 1,
    createdAt: new Date().toISOString(),
  },
];

// Load users from file if exists
const fs = require('fs');
const path = require('path');
const { atomicWriteJSON } = require('./fs-atomic.js');
const USERS_FILE = path.join(__dirname, '../../data/users.json');

// Validate a single user record loaded from disk. Each persisted record must
// have a non-empty string `email`, a `role` from the allowed set, and a
// `password` that is shaped like a bcrypt hash (`$2[aby]$<cost>$<rest>`).
// See docs/plans/2026-04-24_security-performance-deps-audit.md Track A.A.2 #13.
const ALLOWED_ROLES = new Set(['admin', 'editor', 'viewer']);
const BCRYPT_HASH_RX = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

function isValidUserRecord(u) {
  if (!u || typeof u !== 'object') return false;
  if (typeof u.email !== 'string' || u.email.length === 0) return false;
  if (typeof u.role !== 'string' || !ALLOWED_ROLES.has(u.role)) return false;
  if (typeof u.password !== 'string' || !BCRYPT_HASH_RX.test(u.password)) return false;
  return true;
}

function loadUsers() {
  if (fs.existsSync(USERS_FILE)) {
    try {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      const loaded = JSON.parse(data);
      if (!Array.isArray(loaded)) throw new Error('users.json is not an array');
      // Drop records that fail schema validation — a corrupted on-disk record
      // must not be trusted as an authenticated user. The seeded in-memory
      // admin below ensures the admin can still log in.
      const valid = [];
      for (const u of loaded) {
        if (!isValidUserRecord(u)) {
          console.error(
            '[auth] Dropping malformed user record on load (id=%s).',
            u && typeof u === 'object' ? u.id || '<unknown>' : '<non-object>'
          );
          continue;
        }
        // Backfill tokenVersion for records persisted before the field existed,
        // so authMiddleware can always compare a number against a number.
        if (typeof u.tokenVersion !== 'number') u.tokenVersion = 1;
        valid.push(u);
      }
      // Ensure the seeded admin is always present, even if the persisted file
      // was written before the admin existed or became corrupt.
      const hasAdmin = valid.some((u) => u.id === 'admin_1');
      users = hasAdmin ? valid : [users[0], ...valid];
    } catch (err) {
      console.error('Error loading users — keeping defaults:', err);
    }
  }
}

function saveUsers() {
  const dataDir = path.dirname(USERS_FILE);
  // 0o700 on the parent dir + 0o600 on the file keeps the bcrypt hashes out
  // of reach of other local users on multi-tenant hosts. See
  // docs/plans/2026-04-24_security-performance-deps-audit.md Track A #4.
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  } else {
    // Best-effort tighten of an existing directory; ignore failures on
    // platforms (e.g. Windows) where chmod is a no-op.
    try {
      fs.chmodSync(dataDir, 0o700);
    } catch {
      /* non-POSIX filesystem — best effort */
    }
  }
  // Atomic write-to-temp → rename (W-4). Prevents torn writes under concurrent requests.
  atomicWriteJSON(USERS_FILE, users, { mode: 0o600 });
}

loadUsers();

// Generate JWT token
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      // `tokenVersion` binds the JWT to a specific generation of the user
      // record. Bumping `users[i].tokenVersion` on password change / delete
      // causes authMiddleware to reject every token issued before the bump.
      // See docs/plans/2026-04-24_security-performance-deps-audit.md Track A #3.
      tv: typeof user.tokenVersion === 'number' ? user.tokenVersion : 1,
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

// Verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (_err) {
    return null;
  }
}

// Email validation — linear check to avoid regex backtracking (ReDoS-safe)
function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const at = email.indexOf('@');
  if (at < 1) return false; // nothing before @
  const dot = email.lastIndexOf('.');
  return dot > at + 1 && dot < email.length - 1; // dot after @, not at end
}

// Authenticate user
async function authenticate(email, password) {
  if (!isValidEmail(email)) {
    return { success: false, message: 'Invalid credentials' };
  }
  const user = users.find((u) => u.email === email);
  if (!user) {
    return { success: false, message: 'Invalid credentials' };
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return { success: false, message: 'Invalid credentials' };
  }

  const token = generateToken(user);
  return {
    success: true,
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}

// Get user by ID
function getUserById(id) {
  const user = users.find((u) => u.id === id);
  if (user) {
    const { password: _password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  return null;
}

// Get all users (without passwords)
function getAllUsers() {
  return users.map(({ password: _password, ...user }) => user);
}

// Create new user
async function createUser(userData, createdBy) {
  if (!isValidEmail(userData.email)) {
    return { success: false, message: 'Invalid email address' };
  }
  if (!userData.password || userData.password.length < 8) {
    return { success: false, message: 'Password must be at least 8 characters' };
  }
  const existingUser = users.find((u) => u.email === userData.email);
  if (existingUser) {
    return { success: false, message: 'Email already exists' };
  }

  const hashedPassword = await bcrypt.hash(userData.password, 12);
  const newUser = {
    id: 'user_' + Date.now(),
    email: userData.email,
    password: hashedPassword,
    name: userData.name || userData.email,
    role: userData.role || 'viewer',
    tokenVersion: 1,
    createdAt: new Date().toISOString(),
    createdBy,
  };

  users.push(newUser);
  saveUsers();

  const { password: _password, ...userWithoutPassword } = newUser;
  return { success: true, user: userWithoutPassword };
}

// Update user
async function updateUser(userId, updates, updatedBy) {
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) {
    return { success: false, message: 'User not found' };
  }

  if (updates.password) {
    updates.password = await bcrypt.hash(updates.password, 12);
    // Invalidate every JWT issued before this password change. The new
    // `tokenVersion` is stamped into the user record; authMiddleware rejects
    // any token whose `tv` claim does not match the persisted version.
    const prev = typeof users[index].tokenVersion === 'number' ? users[index].tokenVersion : 1;
    updates.tokenVersion = prev + 1;
  }

  users[index] = {
    ...users[index],
    ...updates,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };

  saveUsers();

  const { password: _password, ...userWithoutPassword } = users[index];
  return { success: true, user: userWithoutPassword };
}

// Delete user
function deleteUser(userId, _deletedBy) {
  const index = users.findIndex((u) => u.id === userId);
  if (index === -1) {
    return { success: false, message: 'User not found' };
  }

  // Prevent deleting last admin
  const adminCount = users.filter((u) => u.role === 'admin').length;
  if (users[index].role === 'admin' && adminCount <= 1) {
    return { success: false, message: 'Cannot delete the last admin user' };
  }

  users.splice(index, 1);
  saveUsers();

  return { success: true, message: 'User deleted' };
}

// Middleware to protect routes
function authMiddleware(requiredRole = null) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    // tokenVersion check: reject tokens that predate the user's current
    // generation (issued before a password change / role revocation).
    // Missing user → 401; missing `tv` claim on an older token → treat as 1.
    const currentUser = users.find((u) => u.id === decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }
    const tokenTv = typeof decoded.tv === 'number' ? decoded.tv : 1;
    const userTv = typeof currentUser.tokenVersion === 'number' ? currentUser.tokenVersion : 1;
    if (tokenTv !== userTv) {
      return res.status(401).json({
        success: false,
        message: 'Session has been invalidated. Please log in again.',
      });
    }

    req.user = decoded;

    if (requiredRole) {
      const roleHierarchy = { viewer: 1, editor: 2, admin: 3 };
      if (roleHierarchy[decoded.role] < roleHierarchy[requiredRole]) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
        });
      }
    }

    next();
  };
}

module.exports = {
  authenticate,
  generateToken,
  verifyToken,
  getUserById,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  authMiddleware,
};
