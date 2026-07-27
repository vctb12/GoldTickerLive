'use strict';

/**
 * Regression coverage for server/lib/admin/rate-limiters.js.
 *
 * Login and PIN attempt maps are the brute-force gate for admin auth. A silent
 * regression (wrong threshold, missing Retry-After, window never resetting)
 * would either lock out legitimate admins or allow unlimited guessing.
 */

const { describe, test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const MOD = path.resolve(__dirname, '..', 'server', 'lib', 'admin', 'rate-limiters.js');

function loadRateLimiters() {
  delete require.cache[require.resolve(MOD)];
  return require(MOD);
}

function mockReq(ip) {
  return { ip, socket: { remoteAddress: ip } };
}

function mockRes() {
  return {
    statusCode: null,
    body: null,
    headers: Object.create(null),
    set(key, value) {
      this.headers[key] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe('admin rate-limiters — login', () => {
  let rl;
  let originalNow;
  const IP = '203.0.113.10';

  beforeEach(() => {
    rl = loadRateLimiters();
    originalNow = Date.now;
    Date.now = () => 1_700_000_000_000;
  });

  afterEach(() => {
    Date.now = originalNow;
    rl.clearLoginAttempts(IP);
  });

  test('allows requests under the attempt ceiling', () => {
    for (let i = 0; i < 9; i++) rl.recordFailedLogin(IP);

    let nextCalled = false;
    const res = mockRes();
    rl.loginRateLimiter(mockReq(IP), res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, null);
  });

  test('returns 429 with Retry-After once login attempts hit the ceiling', () => {
    for (let i = 0; i < 10; i++) rl.recordFailedLogin(IP);

    let nextCalled = false;
    const res = mockRes();
    rl.loginRateLimiter(mockReq(IP), res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 429);
    assert.equal(res.body?.success, false);
    assert.match(String(res.body?.message || ''), /too many login attempts/i);
    assert.ok(Number(res.headers['Retry-After']) > 0);
  });

  test('clearLoginAttempts restores access before the window expires', () => {
    for (let i = 0; i < 10; i++) rl.recordFailedLogin(IP);
    rl.clearLoginAttempts(IP);

    let nextCalled = false;
    rl.loginRateLimiter(mockReq(IP), mockRes(), () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
  });

  test('expired login window is cleared and allows a fresh attempt', () => {
    for (let i = 0; i < 10; i++) rl.recordFailedLogin(IP);

    // Advance past the 15-minute window.
    Date.now = () => 1_700_000_000_000 + 15 * 60 * 1000 + 1;

    let nextCalled = false;
    const res = mockRes();
    rl.loginRateLimiter(mockReq(IP), res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, null);
  });

  test('falls back to socket.remoteAddress when req.ip is missing', () => {
    const ip = '198.51.100.7';
    for (let i = 0; i < 10; i++) rl.recordFailedLogin(ip);

    let nextCalled = false;
    const res = mockRes();
    rl.loginRateLimiter({ socket: { remoteAddress: ip } }, res, () => {
      nextCalled = true;
    });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 429);
    rl.clearLoginAttempts(ip);
  });
});

describe('admin rate-limiters — PIN', () => {
  let rl;
  let originalNow;
  const IP = '203.0.113.20';

  beforeEach(() => {
    rl = loadRateLimiters();
    originalNow = Date.now;
    Date.now = () => 1_700_000_000_000;
  });

  afterEach(() => {
    Date.now = originalNow;
    rl.clearPinAttempts(IP);
  });

  test('tracks PIN failures up to PIN_MAX_ATTEMPTS then rate-limits', () => {
    assert.equal(rl.getPinAttemptCount(IP), 0);
    assert.equal(rl.isPinRateLimited(IP).limited, false);

    for (let i = 0; i < rl.PIN_MAX_ATTEMPTS - 1; i++) {
      rl.recordFailedPinAttempt(IP);
      assert.equal(rl.isPinRateLimited(IP).limited, false);
    }

    rl.recordFailedPinAttempt(IP);
    assert.equal(rl.getPinAttemptCount(IP), rl.PIN_MAX_ATTEMPTS);

    const limited = rl.isPinRateLimited(IP);
    assert.equal(limited.limited, true);
    assert.ok(limited.retryAfterSec > 0);
  });

  test('clearPinAttempts removes the limit', () => {
    for (let i = 0; i < rl.PIN_MAX_ATTEMPTS; i++) rl.recordFailedPinAttempt(IP);
    assert.equal(rl.isPinRateLimited(IP).limited, true);

    rl.clearPinAttempts(IP);
    assert.equal(rl.getPinAttemptCount(IP), 0);
    assert.equal(rl.isPinRateLimited(IP).limited, false);
  });

  test('expired PIN window deletes the record and reports not limited', () => {
    for (let i = 0; i < rl.PIN_MAX_ATTEMPTS; i++) rl.recordFailedPinAttempt(IP);
    assert.equal(rl.isPinRateLimited(IP).limited, true);

    Date.now = () => 1_700_000_000_000 + 15 * 60 * 1000 + 1;
    assert.equal(rl.isPinRateLimited(IP).limited, false);
    assert.equal(rl.getPinAttemptCount(IP), 0);
  });
});
