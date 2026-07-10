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
  const freegold = await import('file://' + path.join(base, 'freegoldapi.js'));
  return { check, api, xval, freegold };
}

const NOW = Date.parse('2026-07-08T12:00:00Z');

// Seed freegoldapi's 24 h localStorage cache so `ensureFreeGoldReference()` resolves from cache
// (no network) with a chosen newest reference row.
function seedFreeGoldCache(records) {
  const store = new Map([
    ['gtl_freegoldapi_reference_v1', JSON.stringify({ fetchedAt: Date.now(), records })],
  ]);
  global.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, v),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}

beforeEach(async () => {
  const { check, api, freegold } = await loadModules();
  check.__resetSecondarySpotCheckForTests();
  freegold.__resetFreeGoldCacheForTests();
  api.setSimulateGoldFail(false);
  delete global.location;
  delete global.localStorage;
});

afterEach(async () => {
  const { api, freegold } = await loadModules();
  api.setSimulateGoldFail(false);
  freegold.__resetFreeGoldCacheForTests();
  delete global.location;
  delete global.localStorage;
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

test('async result flips divergence → onResolved fires so one-shot surfaces re-render', async () => {
  const { check } = await loadModules();
  // Newest reference (4100) diverges from primary (4000) by ~2.47% > 0.75% → under-review.
  seedFreeGoldCache([{ date: '2026-07-08', price: 4100 }]);

  let fired = 0;
  let seen = null;
  const evaluation = await check.maybeRunSecondarySpotCheck({
    primaryUsd: 4000,
    enabled: true,
    now: NOW,
    onResolved: (e) => {
      fired += 1;
      seen = e;
    },
  });

  assert.equal(evaluation.status, 'under-review');
  assert.equal(evaluation.underReview, true);
  assert.equal(fired, 1, 'onResolved fires once when under-review flips on');
  assert.equal(seen.underReview, true);
});

test('async result agrees → onResolved does NOT fire (no needless re-render, no loop)', async () => {
  const { check } = await loadModules();
  // Newest reference (4010) is within 0.75% of primary (4000) → agree, underReview stays false.
  seedFreeGoldCache([{ date: '2026-07-08', price: 4010 }]);

  let fired = 0;
  const evaluation = await check.maybeRunSecondarySpotCheck({
    primaryUsd: 4000,
    enabled: true,
    now: NOW,
    onResolved: () => {
      fired += 1;
    },
  });

  assert.equal(evaluation.status, 'agree');
  assert.equal(evaluation.underReview, false);
  assert.equal(fired, 0, 'no state change from the idle default → no re-render');
});
