'use strict';

const { describe, test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const repoPath = path.resolve(__dirname, '../server/lib/billing-repository');
const supabaseClientPath = path.resolve(__dirname, '../server/lib/supabase-client');

let tmpDir;
let previousEnv;

function clearBillingModules() {
  delete require.cache[require.resolve(repoPath)];
  delete require.cache[require.resolve(supabaseClientPath)];
}

function restoreEnv() {
  for (const [key, value] of Object.entries(previousEnv)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

describe('billing-repository API key hashing', () => {
  beforeEach(() => {
    previousEnv = {
      BILLING_DATA_FILE: process.env.BILLING_DATA_FILE,
      API_KEY_HASH_SALT: process.env.API_KEY_HASH_SALT,
      API_KEY_HASH_ITERATIONS: process.env.API_KEY_HASH_ITERATIONS,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    };

    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gtl-billing-key-hash-'));
    process.env.BILLING_DATA_FILE = path.join(tmpDir, 'billing.json');
    process.env.API_KEY_HASH_SALT = 'unit-test-api-key-salt';
    process.env.API_KEY_HASH_ITERATIONS = '2';
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    clearBillingModules();
  });

  afterEach(() => {
    clearBillingModules();
    restoreEnv();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('stores PBKDF2 hashes and resolves the generated raw key', async () => {
    const repo = require(repoPath);

    const created = await repo.createApiKey({ userId: 'user-api-hash', label: 'Regression key' });
    assert.ok(created.key.startsWith('gtl_'));
    assert.equal(created.keyPrefix, created.key.slice(0, 12));

    const store = JSON.parse(fs.readFileSync(process.env.BILLING_DATA_FILE, 'utf8'));
    assert.equal(store.api_keys.length, 1);
    const stored = store.api_keys[0];
    const expectedPbkdf2 = crypto
      .pbkdf2Sync(created.key, process.env.API_KEY_HASH_SALT, 2, 32, 'sha512')
      .toString('hex');
    const legacyPbkdf2 = crypto
      .pbkdf2Sync(created.key, process.env.API_KEY_HASH_SALT, 2, 32, 'sha256')
      .toString('hex');

    assert.equal(stored.keyHash, expectedPbkdf2);
    assert.equal(stored.keyHash.length, 64);
    assert.notEqual(stored.keyHash, created.key, 'raw key must never be stored as the hash');
    assert.notEqual(
      stored.keyHash,
      legacyPbkdf2,
      'legacy non-sha512 PBKDF2 hashes must not be written'
    );

    const resolved = await repo.resolveApiKey(created.key);
    assert.deepEqual(resolved, {
      id: created.id,
      userId: 'user-api-hash',
      label: 'Regression key',
      createdAt: created.createdAt,
    });

    const badKey = await repo.resolveApiKey(`${created.key}x`);
    assert.equal(badKey, null);
  });

  test('does not resolve a revoked PBKDF2-hashed key', async () => {
    const repo = require(repoPath);

    const created = await repo.createApiKey({ userId: 'user-revoke-hash', label: 'Rotate me' });
    assert.equal(await repo.revokeApiKey(created.id, 'user-revoke-hash'), true);

    const resolved = await repo.resolveApiKey(created.key);
    assert.equal(resolved, null);
  });

  test('requires an explicit API key hash salt before hashing keys', async () => {
    delete process.env.API_KEY_HASH_SALT;
    clearBillingModules();
    const repo = require(repoPath);

    await assert.rejects(
      () => repo.createApiKey({ userId: 'user-missing-salt', label: 'No salt' }),
      /API_KEY_HASH_SALT must be configured/
    );
    assert.equal(fs.existsSync(process.env.BILLING_DATA_FILE), false);

    await assert.rejects(
      () => repo.resolveApiKey('gtl_missing_salt_regression'),
      /API_KEY_HASH_SALT must be configured/
    );
  });
});
