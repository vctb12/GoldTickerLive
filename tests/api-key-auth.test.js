'use strict';

/**
 * Unit tests for server/lib/api-key-auth.js middleware.
 *
 * developer-api.test.js covers happy-path HTTP routes; this file pins the
 * auth edge cases that protect quota and key extraction (Bearer vs X-API-Key,
 * reject non-gtl_ tokens, anonymous IP quota, per-key daily quota).
 */

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-api-key-auth-32chars!!';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test-password-1234';
process.env.ADMIN_ACCESS_PIN = process.env.ADMIN_ACCESS_PIN || '123456';
process.env.API_KEY_HASH_SALT = process.env.API_KEY_HASH_SALT || 'test-api-key-hash-salt';
process.env.API_KEY_HASH_ITERATIONS = process.env.API_KEY_HASH_ITERATIONS || '2';
process.env.NODE_ENV = process.env.NODE_ENV || 'test';

const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const billingRepoPath = path.resolve(__dirname, '../server/lib/billing-repository');
const supabaseClientPath = path.resolve(__dirname, '../server/lib/supabase-client');
const apiKeyAuthPath = path.resolve(__dirname, '../server/lib/api-key-auth');
const entitlementsPath = path.resolve(__dirname, '../server/lib/entitlements');

let tmpDir;
let prevBillingDataFile;
let prevSupabaseUrl;
let prevSupabaseKey;
let requireApiKey;
let optionalApiKey;
let billingRepo;

function clearModules() {
  for (const p of [apiKeyAuthPath, billingRepoPath, supabaseClientPath, entitlementsPath]) {
    try {
      delete require.cache[require.resolve(p)];
    } catch {
      /* not loaded yet */
    }
  }
}

function mockRes() {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

function loadAuthWithBillingFile(filePath) {
  clearModules();
  process.env.BILLING_DATA_FILE = filePath;
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  billingRepo = require(billingRepoPath);
  ({ requireApiKey, optionalApiKey } = require(apiKeyAuthPath));
}

before(() => {
  prevBillingDataFile = process.env.BILLING_DATA_FILE;
  prevSupabaseUrl = process.env.SUPABASE_URL;
  prevSupabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gtl-api-key-auth-'));
  loadAuthWithBillingFile(path.join(tmpDir, 'billing.json'));
});

after(() => {
  clearModules();
  if (prevBillingDataFile === undefined) delete process.env.BILLING_DATA_FILE;
  else process.env.BILLING_DATA_FILE = prevBillingDataFile;
  if (prevSupabaseUrl === undefined) delete process.env.SUPABASE_URL;
  else process.env.SUPABASE_URL = prevSupabaseUrl;
  if (prevSupabaseKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = prevSupabaseKey;
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

beforeEach(() => {
  // Fresh store per test so usage counters / keys do not leak.
  const file = path.join(tmpDir, `billing-${Date.now()}-${Math.random().toString(16).slice(2)}.json`);
  loadAuthWithBillingFile(file);
});

describe('requireApiKey', () => {
  test('rejects missing key with API_KEY_REQUIRED', async () => {
    const req = { headers: {}, ip: '203.0.113.10' };
    const res = mockRes();
    let nextCalled = false;
    await requireApiKey(req, res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.error.code, 'API_KEY_REQUIRED');
  });

  test('rejects Authorization Bearer tokens that are not gtl_ API keys', async () => {
    const req = {
      headers: { authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.fake.jwt' },
      ip: '203.0.113.11',
    };
    const res = mockRes();
    await requireApiKey(req, res, () => {
      assert.fail('next must not run for non-gtl_ Bearer token');
    });
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.error.code, 'API_KEY_REQUIRED');
  });

  test('accepts X-API-Key and Authorization: Bearer gtl_ keys', async () => {
    const created = await billingRepo.createApiKey({
      userId: 'user-auth-x',
      label: 'x-header',
    });
    const reqX = { headers: { 'x-api-key': created.key }, ip: '203.0.113.12' };
    const resX = mockRes();
    let nextX = false;
    await requireApiKey(reqX, resX, () => {
      nextX = true;
    });
    assert.equal(nextX, true);
    assert.equal(reqX.apiKeyContext.userId, 'user-auth-x');
    assert.equal(reqX.apiKeyContext.keyId, created.id);

    const created2 = await billingRepo.createApiKey({
      userId: 'user-auth-bearer',
      label: 'bearer',
    });
    const reqB = {
      headers: { authorization: `Bearer ${created2.key}` },
      ip: '203.0.113.13',
    };
    const resB = mockRes();
    let nextB = false;
    await requireApiKey(reqB, resB, () => {
      nextB = true;
    });
    assert.equal(nextB, true);
    assert.equal(reqB.apiKeyContext.userId, 'user-auth-bearer');
  });

  test('does not accept API keys from query strings', async () => {
    const created = await billingRepo.createApiKey({
      userId: 'user-auth-query',
      label: 'query-leak',
    });
    const req = {
      headers: {},
      query: { api_key: created.key, key: created.key },
      ip: '203.0.113.14',
    };
    const res = mockRes();
    await requireApiKey(req, res, () => {
      assert.fail('query-string keys must not authenticate');
    });
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.error.code, 'API_KEY_REQUIRED');
  });

  test('returns 401 INVALID_API_KEY for unknown gtl_ key', async () => {
    const req = {
      headers: { 'x-api-key': 'gtl_not_a_real_key_0123456789abcdef' },
      ip: '203.0.113.15',
    };
    const res = mockRes();
    await requireApiKey(req, res, () => {
      assert.fail('invalid key must not call next');
    });
    assert.equal(res.statusCode, 401);
    assert.equal(res.body.error.code, 'INVALID_API_KEY');
  });

  test('returns 429 QUOTA_EXCEEDED when daily usage is already at the free limit', async () => {
    const created = await billingRepo.createApiKey({
      userId: 'user-auth-quota',
      label: 'quota',
    });
    const today = new Date().toISOString().slice(0, 10);
    const store = JSON.parse(fs.readFileSync(process.env.BILLING_DATA_FILE, 'utf8'));
    store.api_usage.push({
      id: 'usage-seed',
      keyId: created.id,
      date: today,
      count: 100, // free tier apiCallsPerDay
    });
    fs.writeFileSync(process.env.BILLING_DATA_FILE, JSON.stringify(store));

    const req = { headers: { 'x-api-key': created.key }, ip: '203.0.113.16' };
    const res = mockRes();
    await requireApiKey(req, res, () => {
      assert.fail('quota exceeded must not call next');
    });
    assert.equal(res.statusCode, 429);
    assert.equal(res.body.error.code, 'QUOTA_EXCEEDED');
    assert.equal(res.body.error.details.quota, 100);
    assert.ok(res.body.error.details.used > 100);
  });
});

describe('optionalApiKey', () => {
  test('allows anonymous requests within the free IP daily limit', async () => {
    const req = { headers: {}, ip: '198.51.100.1' };
    const res = mockRes();
    let nextCalled = false;
    await optionalApiKey(req, res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
    assert.equal(req.apiKeyContext, null);
  });

  test('returns 429 ANON_QUOTA_EXCEEDED after 10 anonymous calls from the same IP', async () => {
    const ip = '198.51.100.99';
    for (let i = 0; i < 10; i++) {
      const req = { headers: {}, ip };
      const res = mockRes();
      let ok = false;
      await optionalApiKey(req, res, () => {
        ok = true;
      });
      assert.equal(ok, true, `anon call ${i + 1} should succeed`);
    }
    const blocked = mockRes();
    let nextBlocked = false;
    await optionalApiKey({ headers: {}, ip }, blocked, () => {
      nextBlocked = true;
    });
    assert.equal(nextBlocked, false);
    assert.equal(blocked.statusCode, 429);
    assert.equal(blocked.body.error.code, 'ANON_QUOTA_EXCEEDED');
    assert.equal(blocked.body.error.details.limit, 10);
  });

  test('uses the first X-Forwarded-For hop as the anon quota key', async () => {
    const fwdIp = '198.51.100.50';
    for (let i = 0; i < 10; i++) {
      const req = {
        headers: { 'x-forwarded-for': `${fwdIp}, 10.0.0.1` },
        ip: '10.0.0.1',
      };
      const res = mockRes();
      await optionalApiKey(req, res, () => {});
    }
    const blocked = mockRes();
    await optionalApiKey(
      { headers: { 'x-forwarded-for': `${fwdIp}, 10.0.0.2` }, ip: '10.0.0.2' },
      blocked,
      () => {
        assert.fail('forwarded IP must share the anon quota');
      }
    );
    assert.equal(blocked.statusCode, 429);
    assert.equal(blocked.body.error.code, 'ANON_QUOTA_EXCEEDED');
  });

  test('valid API key bypasses anon IP quota', async () => {
    const created = await billingRepo.createApiKey({
      userId: 'user-auth-bypass',
      label: 'bypass',
    });
    const ip = '198.51.100.77';
    // Exhaust anon quota for this IP first
    for (let i = 0; i < 11; i++) {
      await optionalApiKey({ headers: {}, ip }, mockRes(), () => {});
    }
    const req = { headers: { 'x-api-key': created.key }, ip };
    const res = mockRes();
    let nextCalled = false;
    await optionalApiKey(req, res, () => {
      nextCalled = true;
    });
    assert.equal(nextCalled, true);
    assert.equal(req.apiKeyContext.userId, 'user-auth-bypass');
  });
});
