'use strict';

/**
 * Tests for the repository layer:
 *   repositories/shops.repository.js
 *   repositories/audit.repository.js
 *
 * These tests exercise the file backend (STORAGE_BACKEND=file / default).
 * Run with:  npm test
 *
 * NOTE: The test suite uses --test-concurrency=1 (see package.json) because
 * multiple test files share the same data/*.json files for isolation via
 * backup/restore.  Concurrent execution would cause data races between files.
 */

const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs   = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Isolate tests from real data by redirecting the JSON files
// ---------------------------------------------------------------------------

const REAL_SHOPS_FILE = path.join(__dirname, '../data/shops-data.json');
const REAL_AUDIT_FILE = path.join(__dirname, '../data/audit-logs.json');

let _shopsBackup;
let _auditBackup;

before(() => {
    // Ensure STORAGE_BACKEND is not set to 'supabase' during tests
    delete process.env.STORAGE_BACKEND;

    // Back up and reset shops file
    if (fs.existsSync(REAL_SHOPS_FILE)) _shopsBackup = fs.readFileSync(REAL_SHOPS_FILE);
    fs.mkdirSync(path.dirname(REAL_SHOPS_FILE), { recursive: true });
    fs.writeFileSync(REAL_SHOPS_FILE, JSON.stringify([]));

    // Back up and reset audit file
    if (fs.existsSync(REAL_AUDIT_FILE)) _auditBackup = fs.readFileSync(REAL_AUDIT_FILE);
    fs.mkdirSync(path.dirname(REAL_AUDIT_FILE), { recursive: true });
    fs.writeFileSync(REAL_AUDIT_FILE, JSON.stringify([]));
});

after(() => {
    // Restore shops file
    if (_shopsBackup) {
        fs.writeFileSync(REAL_SHOPS_FILE, _shopsBackup);
    } else if (fs.existsSync(REAL_SHOPS_FILE)) {
        fs.unlinkSync(REAL_SHOPS_FILE);
    }

    // Restore audit file
    if (_auditBackup) {
        fs.writeFileSync(REAL_AUDIT_FILE, _auditBackup);
    } else if (fs.existsSync(REAL_AUDIT_FILE)) {
        fs.unlinkSync(REAL_AUDIT_FILE);
    }
});

const shopsRepo = require('../repositories/shops.repository');
const auditRepo = require('../repositories/audit.repository');

// ===========================================================================
// shops.repository
// ===========================================================================

describe('shopsRepo.insert + getAll', () => {
    test('inserts a shop and retrieves it', async () => {
        const shop = { id: 'repo_shop_1', name: 'Repo Gold', city: 'Dubai', country: 'UAE', verified: false };
        await shopsRepo.insert(shop);
        const all = await shopsRepo.getAll();
        assert.ok(Array.isArray(all));
        assert.ok(all.some(s => s.id === 'repo_shop_1'));
    });

    test('getAll returns an array', async () => {
        const all = await shopsRepo.getAll();
        assert.ok(Array.isArray(all));
    });
});

describe('shopsRepo.getById', () => {
    test('returns the shop with the matching id', async () => {
        await shopsRepo.insert({ id: 'repo_shop_2', name: 'Find Me', city: 'Riyadh' });
        const found = await shopsRepo.getById('repo_shop_2');
        assert.ok(found);
        assert.equal(found.name, 'Find Me');
    });

    test('returns null for an unknown id', async () => {
        const result = await shopsRepo.getById('nonexistent_id_xyz');
        assert.equal(result, null);
    });
});

describe('shopsRepo.update', () => {
    test('merges updates into an existing shop', async () => {
        await shopsRepo.insert({ id: 'repo_shop_3', name: 'Update Me', city: 'Cairo' });
        const updated = await shopsRepo.update('repo_shop_3', { city: 'Alexandria', verified: true });
        assert.ok(updated);
        assert.equal(updated.city, 'Alexandria');
        assert.equal(updated.verified, true);
        assert.equal(updated.name, 'Update Me'); // unchanged field preserved
    });

    test('returns null for an unknown id', async () => {
        const result = await shopsRepo.update('ghost_id', { city: 'X' });
        assert.equal(result, null);
    });
});

describe('shopsRepo.remove', () => {
    test('removes an existing shop and returns true', async () => {
        await shopsRepo.insert({ id: 'repo_shop_del', name: 'Delete Me' });
        const ok = await shopsRepo.remove('repo_shop_del');
        assert.equal(ok, true);
        const found = await shopsRepo.getById('repo_shop_del');
        assert.equal(found, null);
    });

    test('returns false for an unknown id', async () => {
        const ok = await shopsRepo.remove('no_such_shop');
        assert.equal(ok, false);
    });
});

describe('shopsRepo.insertMany', () => {
    test('inserts multiple shops at once', async () => {
        // Start from a known state to avoid races between describe blocks
        await shopsRepo.replaceAll([]);
        const batch = [
            { id: 'repo_batch_1', name: 'Batch One', city: 'Doha' },
            { id: 'repo_batch_2', name: 'Batch Two', city: 'Manama' },
        ];
        const saved = await shopsRepo.insertMany(batch);
        assert.equal(saved.length, 2);

        const one = await shopsRepo.getById('repo_batch_1');
        const two = await shopsRepo.getById('repo_batch_2');
        assert.ok(one && one.name === 'Batch One');
        assert.ok(two && two.name === 'Batch Two');
    });
});

describe('shopsRepo.getStats', () => {
    test('returns total, verified, featured, and byCountry', async () => {
        // Use a clean slate to make assertions deterministic
        await shopsRepo.replaceAll([
            { id: 'stat_1', name: 'S1', country: 'UAE',          verified: true,  featured: false },
            { id: 'stat_2', name: 'S2', country: 'UAE',          verified: false, featured: true  },
            { id: 'stat_3', name: 'S3', country: 'Saudi Arabia', verified: true,  featured: false },
        ]);

        const stats = await shopsRepo.getStats();

        assert.equal(stats.total,    3);
        assert.equal(stats.verified, 2);
        assert.equal(stats.featured, 1);
        assert.ok(stats.byCountry && typeof stats.byCountry === 'object');
        assert.equal(stats.byCountry['UAE'],          2);
        assert.equal(stats.byCountry['Saudi Arabia'], 1);
    });
});

describe('shopsRepo.replaceAll', () => {
    test('replaces the entire shop list', async () => {
        await shopsRepo.replaceAll([{ id: 'only_1', name: 'Only Shop' }]);
        const all = await shopsRepo.getAll();
        assert.equal(all.length, 1);
        assert.equal(all[0].id, 'only_1');
    });
});

// ===========================================================================
// audit.repository
// ===========================================================================

describe('auditRepo.append + getAll', () => {
    test('appends an entry with an id and timestamp', async () => {
        const entry = await auditRepo.append({
            actor: 'admin@example.com',
            action: 'create',
            entityType: 'shop',
            entityId: 'shop_x',
            changes: { name: 'New Shop' },
        });

        assert.ok(entry.id);
        assert.ok(entry.timestamp);
        assert.equal(entry.actor, 'admin@example.com');
    });

    test('getAll returns an array', async () => {
        const all = await auditRepo.getAll();
        assert.ok(Array.isArray(all));
    });
});

describe('auditRepo.query', () => {
    // Use unique actor names so these seeded entries can be filtered precisely
    const ACTOR_A = 'alice_qtest@x.com';
    const ACTOR_B = 'bob_qtest@x.com';

    before(async () => {
        await auditRepo.append({ actor: ACTOR_A, action: 'create', entityType: 'shop', entityId: 's1' });
        await auditRepo.append({ actor: ACTOR_B, action: 'delete', entityType: 'shop', entityId: 's2' });
        await auditRepo.append({ actor: ACTOR_A, action: 'login',  entityType: 'user', entityId: ACTOR_A });
    });

    test('filters by action', async () => {
        const result = await auditRepo.query({ action: 'delete', actor: ACTOR_B });
        assert.ok(result.logs.every(l => l.action === 'delete'));
        assert.ok(result.total >= 1);
    });

    test('filters by actor', async () => {
        const result = await auditRepo.query({ actor: ACTOR_A });
        assert.ok(result.logs.every(l => l.actor === ACTOR_A));
        assert.ok(result.total >= 2);
    });

    test('filters by entityType', async () => {
        const result = await auditRepo.query({ entityType: 'user', actor: ACTOR_A });
        assert.ok(result.logs.every(l => l.entityType === 'user'));
    });

    test('returns total count for seeded entries', async () => {
        const result = await auditRepo.query({ actor: ACTOR_A });
        assert.ok(result.total >= 2); // create + login
    });

    test('paginates correctly', async () => {
        const result = await auditRepo.query({ page: 1, limit: 2 });
        assert.equal(result.logs.length, Math.min(2, result.total));
        assert.equal(result.page, 1);
        assert.equal(result.limit, 2);
    });

    test('sorts descending by timestamp', async () => {
        const result = await auditRepo.query({});
        const ts = result.logs.map(l => new Date(l.timestamp).getTime());
        for (let i = 1; i < ts.length; i++) {
            assert.ok(ts[i - 1] >= ts[i], 'should be sorted newest first');
        }
    });
});

describe('auditRepo.pruneOldEntries', () => {
    test('removes entries older than the cutoff', async () => {
        // Inject an old-dated entry directly into the file
        const AUDIT_FILE = path.join(__dirname, '../data/audit-logs.json');
        const logs = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf8'));
        logs.push({
            id: 'prune_test_old',
            timestamp: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
            actor: 'system',
            action: 'noop',
            entityType: 'shop',
        });
        fs.writeFileSync(AUDIT_FILE, JSON.stringify(logs));

        const removed = await auditRepo.pruneOldEntries(90);
        assert.ok(removed >= 1, `Expected at least 1 removed, got ${removed}`);

        const remaining = await auditRepo.getAll();
        assert.ok(!remaining.some(l => l.id === 'prune_test_old'));
    });
});
