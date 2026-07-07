'use strict';

/**
 * Correlation math — deterministic proofs (no live data): perfect +/- correlation, zero-variance
 * guard, date alignment on the shared intersection, and rolling windows.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const CORR = new URL('../src/lib/correlation.js', `file://${__filename}`).href;

test('pearson: perfectly correlated series → +1', async () => {
  const { pearson } = await import(CORR);
  assert.equal(pearson([1, 2, 3, 4], [2, 4, 6, 8]), 1);
});

test('pearson: perfectly anti-correlated series → -1', async () => {
  const { pearson } = await import(CORR);
  assert.equal(pearson([1, 2, 3, 4], [8, 6, 4, 2]), -1);
});

test('pearson: known value matches hand calculation', async () => {
  const { pearson } = await import(CORR);
  // xs=[1,2,3,5], ys=[2,1,4,3]: cov=3.5, varX=8.75, varY=5 → r = 3.5/sqrt(43.75) = 0.5292.
  assert.equal(Number(pearson([1, 2, 3, 5], [2, 1, 4, 3]).toFixed(4)), 0.5292);
});

test('pearson: undefined cases return null (not 0)', async () => {
  const { pearson } = await import(CORR);
  assert.equal(pearson([1], [1]), null); // too few points
  assert.equal(pearson([1, 2, 3], [1, 2]), null); // length mismatch
  assert.equal(pearson([5, 5, 5], [1, 2, 3]), null); // zero variance in x
  assert.equal(pearson([1, 2, 3], [7, 7, 7]), null); // zero variance in y
});

test('pearson: result is clamped into [-1, 1]', async () => {
  const { pearson } = await import(CORR);
  const r = pearson([0.1, 0.2, 0.3, 0.4, 0.5], [10, 20, 30, 40, 50]);
  assert.ok(r <= 1 && r >= -1);
  assert.equal(r, 1);
});

test('alignSeriesByDate: keeps only shared dates, ascending, drops junk', async () => {
  const { alignSeriesByDate } = await import(CORR);
  const gold = [
    { date: '2026-03-01', price: 4200 },
    { date: '2026-01-01', price: 4000 },
    { date: '2026-02-01', price: 4100 },
    { date: '2026-04-01', price: 0 }, // dropped (non-positive)
  ];
  const crypto = [
    { date: '2026-01-01', price: 42000 },
    { date: '2026-02-01', price: 50000 },
    { date: '2026-04-01', price: 60000 }, // no gold match
  ];
  const { dates, a, b } = alignSeriesByDate(gold, crypto);
  assert.deepEqual(dates, ['2026-01-01', '2026-02-01']);
  assert.deepEqual(a, [4000, 4100]);
  assert.deepEqual(b, [42000, 50000]);
});

test('rollingCorrelation: one entry per full window, anchored to window end', async () => {
  const { rollingCorrelation } = await import(CORR);
  const dates = ['d1', 'd2', 'd3', 'd4'];
  const a = [1, 2, 3, 4];
  const b = [1, 2, 3, 4];
  const rolling = rollingCorrelation(dates, a, b, 3);
  assert.deepEqual(
    rolling.map((r) => r.date),
    ['d3', 'd4']
  );
  assert.ok(rolling.every((r) => r.coefficient === 1));
});

test('rollingCorrelation: skips zero-variance windows instead of reporting 0', async () => {
  const { rollingCorrelation } = await import(CORR);
  const dates = ['d1', 'd2', 'd3'];
  const rolling = rollingCorrelation(dates, [5, 5, 5], [1, 2, 3], 2);
  assert.deepEqual(rolling, []);
});
