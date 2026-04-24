'use strict';

/**
 * Tests for the JWT tokenVersion invalidation contract added by PR A-1.
 * See docs/plans/2026-04-24_security-performance-deps-audit.md Track A #3.
 *
 * Invariants under test:
 *   1. A token generated before a password change is rejected by
 *      authMiddleware after the change (tokenVersion mismatch).
 *   2. A fresh token minted after the change is accepted.
 *   3. Tokens for deleted users are rejected (user-not-found branch).
 */

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

process.env.JWT_SECRET = 'test-secret-for-unit-tests-only-32chars';
process.env.ADMIN_PASSWORD = 'TestPass123!';

const AUTH_DATA_DIR = path.join(__dirname, '../data');
const REAL_USERS_FILE = path.join(AUTH_DATA_DIR, 'users.json');
let _savedUsers;

before(() => {
  if (fs.existsSync(REAL_USERS_FILE)) {
    _savedUsers = fs.readFileSync(REAL_USERS_FILE);
    fs.unlinkSync(REAL_USERS_FILE);
  }
});

after(() => {
  if (_savedUsers) {
    fs.writeFileSync(REAL_USERS_FILE, _savedUsers, { mode: 0o600 });
  } else if (fs.existsSync(REAL_USERS_FILE)) {
    fs.unlinkSync(REAL_USERS_FILE);
  }
});

// Import after env is set.
const auth = require('../server/lib/auth');

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

function runMiddleware(token, role = null) {
  const middleware = auth.authMiddleware(role);
  const req = { headers: { authorization: `Bearer ${token}` } };
  const res = makeRes();
  let nextCalled = false;
  middleware(req, res, () => {
    nextCalled = true;
  });
  return { req, res, nextCalled };
}

test('tokenVersion: token issued before a password change is rejected after the change', async () => {
  const email = `tv-user-${Date.now()}@example.com`;
  const created = await auth.createUser(
    { email, password: 'correcthorse12', role: 'admin', name: 'tv-user' },
    'test'
  );
  assert.ok(created.success, created.message);

  // Token 1, stamped with the current tokenVersion (1).
  const rec1 = auth.getUserById(created.user.id);
  const token1 = auth.generateToken({
    id: created.user.id,
    email,
    role: 'admin',
    tokenVersion: rec1.tokenVersion,
  });
  const first = runMiddleware(token1);
  assert.equal(first.res._status, 200, 'fresh token should pass');
  assert.equal(first.nextCalled, true);

  // Rotate password — tokenVersion bumps to 2.
  const updated = await auth.updateUser(created.user.id, { password: 'newpassword456' }, 'test');
  assert.ok(updated.success);
  const rec2 = auth.getUserById(created.user.id);
  assert.equal(rec2.tokenVersion, rec1.tokenVersion + 1);

  // Token 1 must now be rejected.
  const second = runMiddleware(token1);
  assert.equal(second.res._status, 401);
  assert.equal(second.nextCalled, false);

  // A newly-minted token with the new tokenVersion must pass.
  const token2 = auth.generateToken({
    id: created.user.id,
    email,
    role: 'admin',
    tokenVersion: rec2.tokenVersion,
  });
  const third = runMiddleware(token2);
  assert.equal(third.res._status, 200);
  assert.equal(third.nextCalled, true);
});

test('tokenVersion: token for a deleted user is rejected', async () => {
  const email = `tv-del-${Date.now()}@example.com`;
  const created = await auth.createUser(
    { email, password: 'correcthorse12', role: 'editor', name: 'tv-del' },
    'test'
  );
  assert.ok(created.success);
  const rec = auth.getUserById(created.user.id);
  const token = auth.generateToken({
    id: created.user.id,
    email,
    role: 'editor',
    tokenVersion: rec.tokenVersion,
  });

  const del = auth.deleteUser(created.user.id, 'test');
  assert.ok(del.success, del.message);

  const { res, nextCalled } = runMiddleware(token);
  assert.equal(res._status, 401);
  assert.equal(nextCalled, false);
});

test('tokenVersion: legacy token without tv claim is rejected against a bumped user', async () => {
  const email = `tv-legacy-${Date.now()}@example.com`;
  const created = await auth.createUser(
    { email, password: 'correcthorse12', role: 'viewer', name: 'tv-legacy' },
    'test'
  );
  assert.ok(created.success);

  // Mint a legacy token without the `tv` claim by calling jwt.sign directly.
  // The middleware treats a missing `tv` as 1.
  const jwt = require('jsonwebtoken');
  const legacy = jwt.sign({ id: created.user.id, email, role: 'viewer' }, process.env.JWT_SECRET, {
    expiresIn: '1h',
  });

  // Bump tokenVersion to 2 via password change.
  await auth.updateUser(created.user.id, { password: 'newpassword789' }, 'test');

  const { res } = runMiddleware(legacy);
  assert.equal(res._status, 401, 'legacy tv=1 token must not pass against tv=2 user');
});
