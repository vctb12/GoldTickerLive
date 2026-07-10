'use strict';

/**
 * Stale-price protection (Phase 50). Proves the guard derives a TRUSTWORTHY age from the provider's
 * own data timestamp and is strictly downgrade-only — a quote whose freshness cannot be proven
 * (missing timestamp, future timestamp) can never be shown as `live`, closing the gap where the
 * engine's `Math.max(0, now - (providerTimestamp || fetchedAt || 0))` reads a stale quote as current.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const MOD = new URL('../src/lib/stale-price-guard.js', `file://${__filename}`).href;
const POLICY = new URL('../src/lib/freshness-policy.js', `file://${__filename}`).href;

const NOW = 1_800_000_000_000; // fixed epoch ms; Date.now() is never used by the module

test('guard: a recent provider timestamp is trusted and may be live', async () => {
  const { assessQuoteFreshness } = await import(MOD);
  const g = assessQuoteFreshness({ providerTimestamp: NOW - 2000, observedAtMs: NOW });
  assert.equal(g.trusted, true);
  assert.equal(g.stale, false);
  assert.equal(g.dataAgeMs, 2000);
  assert.equal(g.maxState, 'live');
});

test('guard: age maps to the freshness budgets (cached / delayed / estimated)', async () => {
  const { assessQuoteFreshness } = await import(MOD);
  const at = (ageMs) => assessQuoteFreshness({ providerTimestamp: NOW - ageMs, observedAtMs: NOW });
  assert.equal(at(30_000).maxState, 'cached'); // 30s
  assert.equal(at(120_000).maxState, 'delayed'); // 2m
  assert.equal(at(120_000).stale, false); // delayed is old but still within budget
  const old = at(400_000); // > 5m
  assert.equal(old.maxState, 'estimated');
  assert.equal(old.stale, true);
});

test('guard: NO provider timestamp is untrusted → cannot claim live (the core fix)', async () => {
  const { assessQuoteFreshness } = await import(MOD);
  const g = assessQuoteFreshness({ providerTimestamp: null, observedAtMs: NOW });
  assert.equal(g.trusted, false);
  assert.equal(g.stale, true);
  assert.equal(g.maxState, 'estimated');
  assert.equal(g.dataAgeMs, Number.POSITIVE_INFINITY);
  assert.equal(g.reason, 'no-provider-timestamp');
});

test('guard: a future timestamp beyond skew tolerance is untrusted (not clamped to age 0)', async () => {
  const { assessQuoteFreshness } = await import(MOD);
  const g = assessQuoteFreshness({ providerTimestamp: NOW + 60_000, observedAtMs: NOW });
  assert.equal(g.trusted, false);
  assert.equal(g.maxState, 'estimated');
  assert.equal(g.reason, 'timestamp-in-future');
});

test('guard: a small future lead within tolerance is accepted as age 0', async () => {
  const { assessQuoteFreshness, DEFAULT_CLOCK_SKEW_TOLERANCE_MS } = await import(MOD);
  assert.equal(DEFAULT_CLOCK_SKEW_TOLERANCE_MS, 2000);
  const g = assessQuoteFreshness({ providerTimestamp: NOW + 1000, observedAtMs: NOW });
  assert.equal(g.trusted, true);
  assert.equal(g.dataAgeMs, 0);
  assert.equal(g.maxState, 'live');
});

test('guard: ISO string provider timestamps parse', async () => {
  const { assessQuoteFreshness } = await import(MOD);
  const iso = new Date(NOW - 90_000).toISOString();
  const g = assessQuoteFreshness({ providerTimestamp: iso, observedAtMs: NOW });
  assert.equal(g.trusted, true);
  assert.equal(g.dataAgeMs, 90_000);
  assert.equal(g.maxState, 'delayed');
});

test('guard: no observation time is untrusted', async () => {
  const { assessQuoteFreshness } = await import(MOD);
  const g = assessQuoteFreshness({ providerTimestamp: NOW - 1000, observedAtMs: null });
  assert.equal(g.trusted, false);
  assert.equal(g.reason, 'no-observation-time');
});

test('guard: clampStateToGuard is downgrade-only (never upgrades)', async () => {
  const { clampStateToGuard } = await import(MOD);
  // Downgrade a too-fresh policy state to what the guard permits.
  assert.equal(clampStateToGuard('live', { maxState: 'estimated' }), 'estimated');
  assert.equal(clampStateToGuard('live', { maxState: 'cached' }), 'cached');
  // Never upgrade: a staler policy state wins over a fresher guard ceiling.
  assert.equal(clampStateToGuard('delayed', { maxState: 'live' }), 'delayed');
  assert.equal(clampStateToGuard('estimated', { maxState: 'live' }), 'estimated');
  // Non-ladder states are already non-live and pass through unchanged.
  assert.equal(clampStateToGuard('fallback', { maxState: 'estimated' }), 'fallback');
  assert.equal(clampStateToGuard('closed', { maxState: 'estimated' }), 'closed');
  // Missing guard → unchanged.
  assert.equal(clampStateToGuard('live', null), 'live');
});

test('guard: closes the freshness-policy blind spot for a timestamp-less quote', async () => {
  const { assessQuoteFreshness, clampStateToGuard } = await import(MOD);
  const { evaluateFreshnessState } = await import(POLICY);
  // Reproduce the engine gap: no provider timestamp → age computed as ~0 from the fetch time.
  const policyState = evaluateFreshnessState({
    ageMs: 0,
    providerHealthy: true,
    providerPathSuccessful: true,
    marketOpen: true,
  });
  assert.equal(policyState.state, 'live'); // policy alone would show it live
  const guard = assessQuoteFreshness({ providerTimestamp: null, observedAtMs: NOW });
  assert.equal(clampStateToGuard(policyState.state, guard), 'estimated'); // guard blocks the claim
});

test('guard: feature flag defaults OFF (owner-gated)', async () => {
  const { isStalePriceGuardEnabled } = await import(MOD);
  assert.equal(isStalePriceGuardEnabled(), false);
});
