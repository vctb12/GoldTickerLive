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

// In-memory user store (replace with database in production)
let users = [
  {
    id: 'admin_1',
    email: 'admin@goldprices.com',
    password: bcrypt.hashSync(ADMIN_PASSWORD, 12),
    name: 'Administrator',
    role: 'admin',
    createdAt: new Date().toISOString(),
  },
];

// Load users from file if exists
const fs = require('fs');
const path = require('path');
const USERS_FILE = path.join(__dirname, '../../data/users.json');

function loadUsers() {
  if (fs.existsSync(USERS_FILE)) {
    try {
      const data = fs.readFileSync(USERS_FILE, 'utf8');
      users = JSON.parse(data);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  }
}

function saveUsers() {
  const dataDir = path.dirname(USERS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

loadUsers();

// Generate JWT token
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
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
