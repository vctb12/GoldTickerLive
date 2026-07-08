'use strict';

const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// Shared singletons (no cache-busting query) so `setSimulateGoldFail` mutates the same `api.js`
// instance that `secondary-spot-check.js` closes over. Module state is reset per test instead.
async function loadModules() {
  const base = path.resolve(__dirname, '..', 'src', 'lib');
  const check = await import(
    'file://' + path.join(base, 'quote-providers', 'secondary-spot-check.js')
  );
  const api = await import('file://' + path.join(base, 'api.js'));
  const xval = await import('file://' + path.join(base, 'quote-providers', 'cross-validation.js'));
  return { check, api, xval };
}

const NOW = Date.parse('2026-07-08T12:00:00Z');

beforeEach(async () => {
  const { check, api } = await loadModules();
  check.__resetSecondarySpotCheckForTests();
  api.setSimulateGoldFail(false);
  delete global.location;
});

afterEach(async () => {
  const { api } = await loadModules();
  api.setSimulateGoldFail(false);
  delete global.location;
});

test('getSecondaryReferenceSpotUsd: newest same-day-fresh row is the reference (ascending rows)', async () => {
  const { check } = await loadModules();
  const records = [
    { date: '2026-07-06', price: 3980, source: 'freegoldapi-reference' },
    { date: '2026-07-08', price: 4025, source: 'freegoldapi-reference' },
  ];
  const ref = check.getSecondaryReferenceSpotUsd(records, NOW);
  assert.equal(ref.price, 4025);
  assert.equal(ref.derived, true);
  assert.equal(ref.source, 'freegoldapi-reference');
});

test('getSecondaryReferenceSpotUsd: stale / empty / insane → null (never a false second opinion)', async () => {
  const { check } = await loadModules();
  // Older than REFERENCE_MAX_AGE_MS (26 h) — a daily close, not today's price.
  assert.equal(
    check.getSecondaryReferenceSpotUsd([{ date: '2026-07-01', price: 4000 }], NOW),
    null
  );
  assert.equal(check.getSecondaryReferenceSpotUsd([], NOW), null);
  // Out of the sane XAU/USD band.
  assert.equal(check.getSecondaryReferenceSpotUsd([{ date: '2026-07-08', price: 50 }], NOW), null);
});

test('flag OFF (default) + no debug → cross-validation inert, no downgrade', async () => {
  const { check, xval } = await loadModules();
  assert.equal(check.isCrossValidationActive(), false);
  const evaluation = await check.maybeRunSecondarySpotCheck({ primaryUsd: 4000, now: NOW });
  assert.equal(evaluation.underReview, false);
  assert.equal(evaluation.status, 'idle');
  // A live number stays live when the feature is dormant.
  assert.equal(xval.downgradeFreshnessForDivergence('live', evaluation), 'live');
});

test('?debug=true forces the divergence display without fetching, and downgrades live → delayed', async () => {
  const { check, xval } = await loadModules();
  global.location = { search: '?debug=true' };
  assert.equal(check.isCrossValidationDebugForced(), true);
  assert.equal(check.isCrossValidationActive(), true);

  const evaluation = await check.maybeRunSecondarySpotCheck({ primaryUsd: 4000, now: NOW });
  assert.equal(evaluation.underReview, true);
  assert.equal(evaluation.status, 'debug-forced');
  assert.equal(check.getLastCrossValidationEvaluation().underReview, true);
  assert.equal(xval.downgradeFreshnessForDivergence('live', evaluation), 'delayed');
});

test('forced primary failure via setSimulateGoldFail → insufficient-data, never a fabricated live', async () => {
  const { check, api, xval } = await loadModules();
  api.setSimulateGoldFail(true);

  const result = await check.crossValidatePrimary({ now: NOW });
  assert.equal(result.primaryFailed, true);
  assert.equal(result.status, 'insufficient-data');
  assert.equal(result.underReview, false);
  // With no primary price, a "live" label must never be invented or downgraded off a phantom compare.
  assert.equal(xval.downgradeFreshnessForDivergence('live', result), 'live');
});
