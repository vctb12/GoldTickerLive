'use strict';

/**
 * Tests for the pending-shops submission lifecycle:
 *   - pending-shops.repository.js (insert / getById / update / remove / getCounts)
 *   - Admin approve / reject flows via the repository helpers
 *
 * Run with: npm test
 */

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Swap the data file to a temp path before requiring the module
// ---------------------------------------------------------------------------
const REAL_FILE = path.join(__dirname, '../data/pending_shops.json');
let _backup = null;

before(() => {
  if (fs.existsSync(REAL_FILE)) {
    _backup = fs.readFileSync(REAL_FILE);
  }
  fs.mkdirSync(path.dirname(REAL_FILE), { recursive: true });
  fs.writeFileSync(REAL_FILE, JSON.stringify([], null, 2));
});

after(() => {
  if (_backup !== null) {
    fs.writeFileSync(REAL_FILE, _backup);
  } else if (fs.existsSync(REAL_FILE)) {
    fs.unlinkSync(REAL_FILE);
  }
});

const repo = require('../server/repositories/pending-shops.repository');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeSubmission(overrides = {}) {
  return {
    id: `psub_test_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    status: 'pending',
    shop_name: 'Test Gold Shop',
    owner_name: 'Ahmed Test',
    contact_email: 'test@example.com',
    contact_phone: '+971501234567',
    country_code: 'AE',
    city: 'Dubai',
    market: 'Gold Souk',
    website: null,
    specialty: '22K Jewellery',
    notes: 'Integration test shop',
    source: 'test',
    submitted_at: new Date().toISOString(),
    reviewed_at: null,
    reviewed_by: null,
    rejection_reason: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// insert / getById
// ---------------------------------------------------------------------------
describe('insert and getById', () => {
  test('inserts a new submission and retrieves it by id', () => {
    const sub = makeSubmission();
    repo.insert(sub);
    const found = repo.getById(sub.id);
    assert.ok(found, 'submission should be found');
    assert.equal(found.shop_name, 'Test Gold Shop');
    assert.equal(found.status, 'pending');
  });

  test('returns null for an unknown id', () => {
    const result = repo.getById('nonexistent_psub_id');
    assert.equal(result, null);
  });
});

// ---------------------------------------------------------------------------
// getPending
// ---------------------------------------------------------------------------
describe('getPending', () => {
  test('returns only pending submissions', () => {
    const p = makeSubmission({ id: 'p_pending_1', status: 'pending' });
    const r = makeSubmission({ id: 'p_rejected_1', status: 'rejected' });
    repo.insert(p);
    repo.insert(r);
    const pending = repo.getPending();
    assert.ok(
      pending.every((s) => s.status === 'pending'),
      'all returned entries should be pending'
    );
    assert.ok(
      pending.some((s) => s.id === 'p_pending_1'),
      'should include the pending submission we inserted'
    );
    assert.ok(
      !pending.some((s) => s.id === 'p_rejected_1'),
      'should not include rejected submission'
    );
  });
});

// ---------------------------------------------------------------------------
// update (approve lifecycle)
// ---------------------------------------------------------------------------
describe('update — approve lifecycle', () => {
  test('marks a submission as approved with reviewer metadata', () => {
    const sub = makeSubmission({ id: 'p_approve_test' });
    repo.insert(sub);

    const now = new Date().toISOString();
    const updated = repo.update('p_approve_test', {
      status: 'approved',
      reviewed_at: now,
      reviewed_by: 'admin@goldtickerlive.com',
      approved_shop_id: 'shop_approved_001',
    });

    assert.ok(updated, 'update should return the updated record');
    assert.equal(updated.status, 'approved');
    assert.equal(updated.reviewed_by, 'admin@goldtickerlive.com');
    assert.equal(updated.approved_shop_id, 'shop_approved_001');

    const fetched = repo.getById('p_approve_test');
    assert.equal(fetched.status, 'approved');
  });

  test('returns null when updating a non-existent id', () => {
    const result = repo.update('ghost_id_999', { status: 'approved' });
    assert.equal(result, null);
  });
});

// ---------------------------------------------------------------------------
// update (reject lifecycle)
// ---------------------------------------------------------------------------
describe('update — reject lifecycle', () => {
  test('marks a submission as rejected with a reason', () => {
    const sub = makeSubmission({ id: 'p_reject_test' });
    repo.insert(sub);

    const now = new Date().toISOString();
    const updated = repo.update('p_reject_test', {
      status: 'rejected',
      reviewed_at: now,
      reviewed_by: 'editor@goldtickerlive.com',
      rejection_reason: 'Duplicate listing',
    });

    assert.equal(updated.status, 'rejected');
    assert.equal(updated.rejection_reason, 'Duplicate listing');

    const fetched = repo.getById('p_reject_test');
    assert.equal(fetched.status, 'rejected');
    assert.equal(fetched.rejection_reason, 'Duplicate listing');
  });
});

// ---------------------------------------------------------------------------
// remove
// ---------------------------------------------------------------------------
describe('remove', () => {
  test('deletes an existing submission', () => {
    const sub = makeSubmission({ id: 'p_delete_test' });
    repo.insert(sub);
    const deleted = repo.remove('p_delete_test');
    assert.equal(deleted, true);
    assert.equal(repo.getById('p_delete_test'), null);
  });

  test('returns false when trying to delete a non-existent id', () => {
    const result = repo.remove('p_ghost_delete');
    assert.equal(result, false);
  });
});

// ---------------------------------------------------------------------------
// getCounts
// ---------------------------------------------------------------------------
describe('getCounts', () => {
  test('returns correct counts for pending / approved / rejected', () => {
    // Reset file for clean count test
    fs.writeFileSync(REAL_FILE, JSON.stringify([], null, 2));

    repo.insert(makeSubmission({ id: 'cnt_p1', status: 'pending' }));
    repo.insert(makeSubmission({ id: 'cnt_p2', status: 'pending' }));
    repo.insert(makeSubmission({ id: 'cnt_a1', status: 'approved' }));
    repo.insert(makeSubmission({ id: 'cnt_r1', status: 'rejected' }));

    const counts = repo.getCounts();
    assert.equal(counts.pending, 2);
    assert.equal(counts.approved, 1);
    assert.equal(counts.rejected, 1);
    assert.equal(counts.total, 4);
  });
});

// ---------------------------------------------------------------------------
// getAll
// ---------------------------------------------------------------------------
describe('getAll', () => {
  test('returns all submissions regardless of status', () => {
    const all = repo.getAll();
    assert.ok(Array.isArray(all), 'should return an array');
    assert.ok(all.length >= 4, 'should include all statuses from previous test');
  });
});
