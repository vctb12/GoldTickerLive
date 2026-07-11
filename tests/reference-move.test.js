'use strict';

/**
 * Unit tests for the shared reference-movement observation helper
 * (src/lib/reference-move.js), used by market.html's worked example (3.1) and
 * reused by the wider price-change explainability pass (3.2).
 *
 * The helper must NEVER report a change without an honest window (a timestamp),
 * must treat rounding-noise deltas as neutral rather than drawing a misleading
 * arrow, and must reject non-finite / non-positive inputs.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

function importModule(relPath) {
  const url = new URL('file://' + path.resolve(__dirname, '..', relPath));
  return import(url.href + `?v=${Date.now()}`);
}

const TS = '2026-07-06T12:06:20Z';

test('reports a downward move with signed change, pct and window', async () => {
  const { referenceMove } = await importModule('src/lib/reference-move.js');
  const m = referenceMove(4121.4, 4157.7, TS);
  assert.ok(m, 'expected a move object');
  assert.equal(m.direction, 'down');
  assert.equal(m.ts, TS);
  assert.ok(m.change < 0);
  // (4121.4 - 4157.7) / 4157.7 * 100 ≈ -0.873%
  assert.ok(Math.abs(m.pct - -0.8730) < 0.01, `pct was ${m.pct}`);
  assert.equal(m.current, 4121.4);
  assert.equal(m.prior, 4157.7);
});

test('reports an upward move', async () => {
  const { referenceMove } = await importModule('src/lib/reference-move.js');
  const m = referenceMove(4200, 4100, TS);
  assert.equal(m.direction, 'up');
  assert.ok(m.change > 0 && m.pct > 0);
});

test('treats sub-threshold deltas as neutral (no misleading arrow)', async () => {
  const { referenceMove, MOVE_FLAT_PCT } = await importModule('src/lib/reference-move.js');
  assert.equal(MOVE_FLAT_PCT, 0.05);
  // 0.02% move — below the flat band.
  const m = referenceMove(4000.8, 4000, TS);
  assert.ok(m);
  assert.equal(m.direction, 'neutral');
});

test('returns null without a timestamp — never a change without an honest window', async () => {
  const { referenceMove } = await importModule('src/lib/reference-move.js');
  assert.equal(referenceMove(4121.4, 4157.7, null), null);
  assert.equal(referenceMove(4121.4, 4157.7, ''), null);
  assert.equal(referenceMove(4121.4, 4157.7, undefined), null);
  assert.equal(referenceMove(4121.4, 4157.7, 1720000000000), null, 'non-string ts rejected');
});

test('returns null for non-finite / non-positive inputs', async () => {
  const { referenceMove } = await importModule('src/lib/reference-move.js');
  assert.equal(referenceMove(null, 4157.7, TS), null);
  assert.equal(referenceMove(4121.4, null, TS), null);
  assert.equal(referenceMove(NaN, 4157.7, TS), null);
  assert.equal(referenceMove(4121.4, 0, TS), null);
  assert.equal(referenceMove(-1, 4157.7, TS), null);
  assert.equal(referenceMove(4121.4, -5, TS), null);
});
