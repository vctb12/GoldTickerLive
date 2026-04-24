'use strict';

/**
 * Tests for lib/auth.js
 * Run with:  npm test
 */

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

// Use a temp users file to avoid touching real data
const TMP_USERS_FILE = path.join(require('os').tmpdir(), 'gp_test_users.json');
process.env.JWT_SECRET = 'test-secret-for-unit-tests-only-32chars';
process.env.ADMIN_PASSWORD = 'TestPass123!';

// Remove temp file before loading the module so it initialises fresh
if (fs.existsSync(TMP_USERS_FILE)) fs.unlinkSync(TMP_USERS_FILE);

// Patch USERS_FILE path before requiring auth
// We do this by writing a users file at the path auth.js reads
const AUTH_DATA_DIR = path.join(__dirname, '../data');
const REAL_USERS_FILE = path.join(AUTH_DATA_DIR, 'users.json');
let _savedUsers;

before(() => {
  // Back up existing users.json if present
  if (fs.existsSync(REAL_USERS_FILE)) {
    _savedUsers = fs.readFileSync(REAL_USERS_FILE);
  }
  // Remove so auth.js starts fresh
  if (fs.existsSync(REAL_USERS_FILE)) fs.unlinkSync(REAL_USERS_FILE);
});

after(() => {
  if (_savedUsers) {
    fs.writeFileSync(REAL_USERS_FILE, _savedUsers);
  } else if (fs.existsSync(REAL_USERS_FILE)) {
    fs.unlinkSync(REAL_USERS_FILE);
  }
});

const auth = require('../server/lib/auth');

describe('authenticate', () => {
  test('succeeds with correct default admin credentials', async () => {
    const result = await auth.authenticate('admin@goldprices.com', 'TestPass123!');
    assert.equal(result.success, true);
    assert.ok(result.token);
    assert.equal(result.user.role, 'admin');
  });

  test('fails with wrong password', async () => {
    const result = await auth.authenticate('admin@goldprices.com', 'wrongpassword');
    assert.equal(result.success, false);
  });

  test('fails with unknown email', async () => {
    const result = await auth.authenticate('nobody@example.com', 'TestPass123!');
    assert.equal(result.success, false);
  });

  test('fails with invalid email format', async () => {
    const result = await auth.authenticate('not-an-email', 'TestPass123!');
    assert.equal(result.success, false);
  });

  test('fails with empty email', async () => {
    const result = await auth.authenticate('', 'TestPass123!');
    assert.equal(result.success, false);
  });
});

describe('generateToken / verifyToken', () => {
  test('generates a verifiable JWT', () => {
    const fakeUser = { id: 'u1', email: 'test@test.com', role: 'viewer' };
    const token = auth.generateToken(fakeUser);
    assert.ok(typeof token === 'string' && token.length > 0);

    const decoded = auth.verifyToken(token);
    assert.equal(decoded.id, 'u1');
    assert.equal(decoded.email, 'test@test.com');
    assert.equal(decoded.role, 'viewer');
  });

  test('verifyToken returns null for a tampered token', () => {
    const result = auth.verifyToken('totally.invalid.token');
    assert.equal(result, null);
  });
});

describe('createUser / getUserById / deleteUser', () => {
  test('creates a new user with valid data', async () => {
    const result = await auth.createUser(
      { email: 'newuser@example.com', password: 'Password1!', name: 'New User', role: 'editor' },
      'admin@goldprices.com'
    );
    assert.equal(result.success, true);
    assert.equal(result.user.email, 'newuser@example.com');
    assert.equal(result.user.role, 'editor');
    assert.ok(!result.user.password, 'password should not be returned');
  });

  test('rejects duplicate email', async () => {
    const result = await auth.createUser(
      { email: 'newuser@example.com', password: 'Password2!', name: 'Dup User', role: 'viewer' },
      'admin@goldprices.com'
    );
    assert.equal(result.success, false);
    assert.match(result.message, /already exists/i);
  });

  test('rejects invalid email format', async () => {
    const result = await auth.createUser(
      { email: 'bad-email', password: 'Password3!', name: 'Bad Email' },
      'admin@goldprices.com'
    );
    assert.equal(result.success, false);
    assert.match(result.message, /invalid email/i);
  });

  test('rejects short password (< 8 chars)', async () => {
    const result = await auth.createUser(
      { email: 'short@example.com', password: 'abc', name: 'Short' },
      'admin@goldprices.com'
    );
    assert.equal(result.success, false);
    assert.match(result.message, /password/i);
  });

  test('getUserById returns user without password', () => {
    const users = auth.getAllUsers();
    const first = users[0];
    const found = auth.getUserById(first.id);
    assert.equal(found.id, first.id);
    assert.ok(!found.password, 'should not expose password hash');
  });

  test('prevents deleting the last admin user', () => {
    const adminUser = auth.getAllUsers().find((u) => u.role === 'admin');
    assert.ok(adminUser, 'admin user should exist');
    const result = auth.deleteUser(adminUser.id, 'system');
    assert.equal(result.success, false);
    assert.match(result.message, /last admin/i);
  });
});

describe('authMiddleware', () => {
  function makeRes() {
    const res = { _status: 200, _body: null };
    res.status = (code) => {
      res._status = code;
      return res;
    };
    res.json = (body) => {
      res._body = body;
      return res;
    };
    return res;
  }

  test('rejects missing Authorization header', () => {
    const middleware = auth.authMiddleware();
    const req = { headers: {} };
    const res = makeRes();
    middleware(req, res, () => {});
    assert.equal(res._status, 401);
  });

  test('rejects malformed token', () => {
    const middleware = auth.authMiddleware();
    const req = { headers: { authorization: 'Bearer badtoken' } };
    const res = makeRes();
    middleware(req, res, () => {});
    assert.equal(res._status, 401);
  });

  test('accepts a valid token and calls next', async () => {
    // Seed a real user so the tokenVersion check in authMiddleware finds a
    // matching record. See Track A #3 in
    // docs/plans/2026-04-24_security-performance-deps-audit.md.
    const email = `mw-admin-${Date.now()}@b.com`;
    const created = await auth.createUser(
      { email, password: 'password12345', role: 'admin', name: 'mw-admin' },
      'test'
    );
    assert.ok(created.success, created.message);
    const userRecord = auth.getUserById(created.user.id);
    const middleware = auth.authMiddleware();
    const token = auth.generateToken({
      id: created.user.id,
      email,
      role: 'admin',
      tokenVersion: userRecord.tokenVersion,
    });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = makeRes();
    let nextCalled = false;
    middleware(req, res, () => {
      nextCalled = true;
    });
    assert.ok(nextCalled);
    assert.equal(req.user.role, 'admin');
  });

  test('rejects insufficient role (viewer trying editor route)', async () => {
    const email = `mw-viewer-${Date.now()}@b.com`;
    const created = await auth.createUser(
      { email, password: 'password12345', role: 'viewer', name: 'mw-viewer' },
      'test'
    );
    assert.ok(created.success, created.message);
    const userRecord = auth.getUserById(created.user.id);
    const middleware = auth.authMiddleware('editor');
    const token = auth.generateToken({
      id: created.user.id,
      email,
      role: 'viewer',
      tokenVersion: userRecord.tokenVersion,
    });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = makeRes();
    middleware(req, res, () => {});
    assert.equal(res._status, 403);
  });
});
