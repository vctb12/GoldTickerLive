'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

// ES modules — load dynamically.
let mod;
async function load() {
  if (!mod) mod = await import('../src/lib/quote-providers/cross-validation.js');
  return mod;
}

test('defaults to disabled (feature flag OFF) — dormant in production', async () => {
  const { evaluateCrossValidation } = await load();
  const r = evaluateCrossValidation({ primaryUsd: 4000, secondaryUsd: 4500 });
  assert.equal(r.status, 'disabled');
  assert.equal(r.underReview, false);
  assert.equal(r.divergencePct, null);
});

test('computeDivergencePct: symmetric percentage vs the mean', async () => {
  const { computeDivergencePct } = await load();
  assert.equal(computeDivergencePct(4000, 4000), 0);
  // 4000 vs 4040 → |40| / 4020 * 100 ≈ 0.995%
  assert.ok(Math.abs(computeDivergencePct(4000, 4040) - 0.995) < 0.01);
});

test('computeDivergencePct: invalid inputs → null', async () => {
  const { computeDivergencePct } = await load();
  assert.equal(computeDivergencePct(0, 4000), null);
  assert.equal(computeDivergencePct(4000, -1), null);
  assert.equal(computeDivergencePct(NaN, 4000), null);
  assert.equal(computeDivergencePct(undefined, 4000), null);
});

test('enabled + within threshold → agree', async () => {
  const { evaluateCrossValidation } = await load();
  const r = evaluateCrossValidation({ primaryUsd: 4000, secondaryUsd: 4010, enabled: true });
  assert.equal(r.status, 'agree');
  assert.equal(r.underReview, false);
  assert.ok(r.divergencePct > 0 && r.divergencePct < 0.75);
});

test('enabled + beyond threshold → under-review', async () => {
  const { evaluateCrossValidation } = await load();
  const r = evaluateCrossValidation({ primaryUsd: 4000, secondaryUsd: 4100, enabled: true });
  assert.equal(r.status, 'under-review');
  assert.equal(r.underReview, true);
  assert.ok(r.divergencePct > 0.75);
});

test('enabled + missing/invalid secondary → insufficient-data (never false-positive)', async () => {
  const { evaluateCrossValidation } = await load();
  assert.equal(
    evaluateCrossValidation({ primaryUsd: 4000, enabled: true }).status,
    'insufficient-data'
  );
  assert.equal(
    evaluateCrossValidation({ primaryUsd: 4000, secondaryUsd: 0, enabled: true }).status,
    'insufficient-data'
  );
});

test('custom threshold is honoured; invalid threshold falls back to default', async () => {
  const { evaluateCrossValidation, DEFAULT_DIVERGENCE_THRESHOLD_PCT } = await load();
  // ~0.995% divergence: under-review at 0.5% threshold, agree at 2%.
  assert.equal(
    evaluateCrossValidation({
      primaryUsd: 4000,
      secondaryUsd: 4040,
      thresholdPct: 0.5,
      enabled: true,
    }).status,
    'under-review'
  );
  assert.equal(
    evaluateCrossValidation({
      primaryUsd: 4000,
      secondaryUsd: 4040,
      thresholdPct: 2,
      enabled: true,
    }).status,
    'agree'
  );
  // Invalid threshold → default (0.75%).
  const r = evaluateCrossValidation({
    primaryUsd: 4000,
    secondaryUsd: 4040,
    thresholdPct: -1,
    enabled: true,
  });
  assert.equal(r.status, 'under-review');
  assert.equal(DEFAULT_DIVERGENCE_THRESHOLD_PCT, 0.75);
});

test('isCrossValidationEnabled reflects the (default OFF) flag', async () => {
  const { isCrossValidationEnabled } = await load();
  assert.equal(isCrossValidationEnabled(), false);
});

test('threshold boundary: just-under 0.75% agrees, just-over flags under-review', async () => {
  const { evaluateCrossValidation, computeDivergencePct } = await load();
  // 4000 vs 4030 → 0.7472% (just under the 0.75% default) → agree.
  const under = evaluateCrossValidation({ primaryUsd: 4000, secondaryUsd: 4030, enabled: true });
  assert.ok(computeDivergencePct(4000, 4030) < 0.75);
  assert.equal(under.status, 'agree');
  assert.equal(under.underReview, false);
  // 4000 vs 4031 → 0.7720% (just over the 0.75% default) → under-review.
  const over = evaluateCrossValidation({ primaryUsd: 4000, secondaryUsd: 4031, enabled: true });
  assert.ok(computeDivergencePct(4000, 4031) > 0.75);
  assert.equal(over.status, 'under-review');
  assert.equal(over.underReview, true);
});

test('downgradeFreshnessForDivergence: under-review downgrades live → delayed only', async () => {
  const { downgradeFreshnessForDivergence } = await load();
  const underReview = { underReview: true };
  // The one state that claims real-time accuracy is walked back.
  assert.equal(downgradeFreshnessForDivergence('live', underReview), 'delayed');
  // Every already-non-live key passes through unchanged (nothing to walk back).
  for (const key of ['delayed', 'cached', 'stale', 'fallback', 'unavailable', 'closed']) {
    assert.equal(downgradeFreshnessForDivergence(key, underReview), key);
  }
});

test('downgradeFreshnessForDivergence: agree / insufficient / missing never downgrade', async () => {
  const { downgradeFreshnessForDivergence } = await load();
  assert.equal(downgradeFreshnessForDivergence('live', { underReview: false }), 'live');
  assert.equal(downgradeFreshnessForDivergence('live', { status: 'agree' }), 'live');
  assert.equal(downgradeFreshnessForDivergence('live', {}), 'live');
  assert.equal(downgradeFreshnessForDivergence('live'), 'live');
});
