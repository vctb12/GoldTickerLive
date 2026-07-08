'use strict';

/**
 * Per-metal freshness view-model (Phase 58, Theme B). Proves each metal's freshness is judged by the
 * SAME canonical policy as gold (live≤5s / cached≤60s / delayed≤300s), a metal with no feed timestamp
 * is honestly `unavailable` (never a faked freshness), and the overall badge is the stalest metal.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const MOD = new URL('../src/lib/metal-freshness.js', `file://${__filename}`).href;
const POLICY = new URL('../src/lib/freshness-policy.js', `file://${__filename}`).href;

const NOW = 1_800_000_000_000; // fixed epoch ms; the module never calls Date.now()

test('freshness: age maps to the canonical budgets (live / cached / delayed / estimated)', async () => {
  const { assessMetalFreshness } = await import(MOD);
  const at = (ageMs) => assessMetalFreshness({ updatedAt: NOW - ageMs, observedAtMs: NOW }).state;
  assert.equal(at(2_000), 'live'); // ≤ 5s
  assert.equal(at(30_000), 'cached'); // ≤ 60s
  assert.equal(at(120_000), 'delayed'); // ≤ 300s
  assert.equal(at(400_000), 'estimated'); // > 300s
});

test('freshness: matches evaluateFreshnessState exactly (no second source of truth)', async () => {
  const { assessMetalFreshness } = await import(MOD);
  const { evaluateFreshnessState } = await import(POLICY);
  const ageMs = 42_000;
  const mine = assessMetalFreshness({ updatedAt: NOW - ageMs, observedAtMs: NOW });
  const canonical = evaluateFreshnessState({ ageMs });
  assert.equal(mine.state, canonical.state);
  assert.equal(mine.ageMs, canonical.ageMs);
});

test('freshness: ISO timestamps parse; age is clamped to ≥ 0', async () => {
  const { assessMetalFreshness } = await import(MOD);
  const iso = new Date(NOW - 90_000).toISOString();
  assert.equal(assessMetalFreshness({ updatedAt: iso, observedAtMs: NOW }).state, 'delayed');
  // A future timestamp clamps to age 0 → live (not negative).
  const future = assessMetalFreshness({ updatedAt: NOW + 10_000, observedAtMs: NOW });
  assert.equal(future.ageMs, 0);
  assert.equal(future.state, 'live');
});

test('freshness: no / invalid timestamp → unavailable (never a faked freshness)', async () => {
  const { assessMetalFreshness } = await import(MOD);
  for (const updatedAt of [null, undefined, '', 'not-a-date', 0]) {
    const f = assessMetalFreshness({ updatedAt, observedAtMs: NOW });
    assert.equal(f.state, 'unavailable');
    assert.equal(f.reason, 'no-timestamp');
    assert.equal(f.ageMs, Number.POSITIVE_INFINITY);
  }
  // Missing observation time is also unavailable.
  assert.equal(assessMetalFreshness({ updatedAt: NOW - 1000 }).state, 'unavailable');
});

test('freshness: market closed → closed', async () => {
  const { assessMetalFreshness } = await import(MOD);
  const f = assessMetalFreshness({ updatedAt: NOW - 1000, observedAtMs: NOW, marketOpen: false });
  assert.equal(f.state, 'closed');
});

test('freshness: buildMetalFreshness maps every metal', async () => {
  const { buildMetalFreshness } = await import(MOD);
  const out = buildMetalFreshness(
    {
      gold: { updatedAt: NOW - 2_000 }, // live
      silver: { updatedAt: NOW - 400_000 }, // estimated
      platinum: { updatedAt: null }, // no feed → unavailable
    },
    { observedAtMs: NOW }
  );
  assert.equal(out.gold.state, 'live');
  assert.equal(out.silver.state, 'estimated');
  assert.equal(out.platinum.state, 'unavailable');
});

test('freshness: overallMetalFreshness is the stalest metal', async () => {
  const { overallMetalFreshness } = await import(MOD);
  assert.equal(
    overallMetalFreshness({ gold: { state: 'live' }, silver: { state: 'delayed' } }),
    'delayed'
  );
  assert.equal(
    overallMetalFreshness({ gold: { state: 'live' }, silver: { state: 'cached' } }),
    'cached'
  );
  assert.equal(overallMetalFreshness({}), 'unavailable');
  // An unavailable metal is the stalest of all.
  assert.equal(
    overallMetalFreshness({ gold: { state: 'live' }, platinum: { state: 'unavailable' } }),
    'unavailable'
  );
});
