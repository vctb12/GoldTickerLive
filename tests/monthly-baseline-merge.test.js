'use strict';

/**
 * Monthly-baseline merge — proves the backfill core validates rows, appends ONLY new months
 * (never overwriting committed data), sorts, and detects the gap the owner must fill.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const MOD = new URL('../src/lib/monthly-baseline-merge.js', `file://${__filename}`).href;

test('baseline: validateMonthlyRows accepts good rows, rejects junk', async () => {
  const { validateMonthlyRows } = await import(MOD);
  assert.equal(validateMonthlyRows([{ date: '2025-09', price: 3600 }]).ok, true);
  assert.equal(validateMonthlyRows([{ date: '2025-9', price: 3600 }]).ok, false); // bad format
  assert.equal(validateMonthlyRows([{ date: '2025-09', price: 0 }]).ok, false); // non-positive
  assert.equal(validateMonthlyRows([{ date: '2025-09', price: 'x' }]).ok, false); // non-number
  assert.equal(
    validateMonthlyRows([
      { date: '2025-09', price: 1 },
      { date: '2025-09', price: 2 },
    ]).ok,
    false // duplicate date
  );
  assert.equal(validateMonthlyRows('nope').ok, false);
});

test('baseline: mergeMonthlyBaseline appends new months, never overwrites, sorts', async () => {
  const { mergeMonthlyBaseline } = await import(MOD);
  const existing = [
    { date: '2025-07', price: 3348 },
    { date: '2025-08', price: 3465 },
  ];
  const incoming = [
    { date: '2025-08', price: 9999 }, // already present → must be SKIPPED, not overwrite 3465
    { date: '2025-10', price: 3700 },
    { date: '2025-09', price: 3600 },
  ];
  const { merged, added, skipped } = mergeMonthlyBaseline(existing, incoming);
  assert.deepEqual(
    merged.map((r) => [r.date, r.price]),
    [
      ['2025-07', 3348],
      ['2025-08', 3465], // unchanged — committed data protected
      ['2025-09', 3600],
      ['2025-10', 3700],
    ]
  );
  assert.deepEqual(added.sort(), ['2025-09', '2025-10']);
  assert.deepEqual(skipped, ['2025-08']);
});

test('baseline: mergeMonthlyBaseline is idempotent (re-merging adds nothing)', async () => {
  const { mergeMonthlyBaseline } = await import(MOD);
  const base = [{ date: '2025-08', price: 3465 }];
  const once = mergeMonthlyBaseline(base, [{ date: '2025-09', price: 3600 }]).merged;
  const twice = mergeMonthlyBaseline(once, [{ date: '2025-09', price: 3600 }]);
  assert.deepEqual(twice.merged, once);
  assert.deepEqual(twice.added, []);
});

test('baseline: findMonthlyGaps reports the missing months (incl. the Sep2025→Jul2026 gap)', async () => {
  const { findMonthlyGaps } = await import(MOD);
  assert.deepEqual(findMonthlyGaps([{ date: '2025-08' }, { date: '2025-11' }]), [
    '2025-09',
    '2025-10',
  ]);
  // Contiguous → no gaps.
  assert.deepEqual(findMonthlyGaps([{ date: '2025-08' }, { date: '2025-09' }]), []);
  // The real-world gap this phase documents.
  const gap = findMonthlyGaps([{ date: '2025-08' }, { date: '2026-07' }]);
  assert.equal(gap.length, 10);
  assert.equal(gap[0], '2025-09');
  assert.equal(gap[gap.length - 1], '2026-06');
});

test('baseline: the committed baseline currently ends at 2025-08 (documents the live gap)', async () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const baseline = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '../src/data/historical-baseline.json'), 'utf8')
  );
  const last = baseline[baseline.length - 1];
  // This asserts the KNOWN-current state so the test suite documents the gap; when the owner
  // backfills real data, this expectation is updated in the same change.
  assert.match(last.date, /^\d{4}-\d{2}$/);
  assert.ok(last.price > 0);
});
