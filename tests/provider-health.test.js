'use strict';

/**
 * Provider-health hysteresis (Phase 47) — proves the Schmitt-trigger health signal absorbs single
 * transient failures (the old single-failure trip caused the Live/Cached/Fallback/SecondaryProvider
 * flapping): it takes 2 consecutive failures to go unhealthy and 2 consecutive successes to recover,
 * and holds its state in between. Also checks the diagnostics counters used for logging.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const MOD = new URL('../src/lib/provider-health.js', `file://${__filename}`).href;

function monitor(ProviderHealthMonitor) {
  let t = 0;
  const m = new ProviderHealthMonitor(() => (t += 1000));
  return m;
}
const ok = (m, id, latencyMs = 20) => m.recordAttempt(id, { success: true, latencyMs });
const fail = (m, id, errorType = 'AbortError') =>
  m.recordAttempt(id, { success: false, errorType });

test('health: a provider starts healthy', async () => {
  const { ProviderHealthMonitor } = await import(MOD);
  const m = monitor(ProviderHealthMonitor);
  assert.equal(m.getSnapshot('p').healthy, true);
});

test('health: a SINGLE transient failure does not flip to unhealthy', async () => {
  const { ProviderHealthMonitor } = await import(MOD);
  const m = monitor(ProviderHealthMonitor);
  ok(m, 'p');
  assert.equal(fail(m, 'p').healthy, true, 'one blip must be absorbed'); // the old bug flipped here
});

test('health: two consecutive failures trip unhealthy', async () => {
  const { ProviderHealthMonitor } = await import(MOD);
  const m = monitor(ProviderHealthMonitor);
  fail(m, 'p');
  assert.equal(fail(m, 'p').healthy, false);
  assert.equal(m.getSnapshot('p').failureDetectionBreached, true); // back-compat alias
});

test('health: recovery needs TWO sustained successes, not one', async () => {
  const { ProviderHealthMonitor } = await import(MOD);
  const m = monitor(ProviderHealthMonitor);
  fail(m, 'p');
  fail(m, 'p'); // unhealthy
  assert.equal(ok(m, 'p').healthy, false, 'one good poll must NOT instantly restore health');
  assert.equal(ok(m, 'p').healthy, true, 'second sustained success recovers');
});

test('health: alternating fail/success never flaps once healthy', async () => {
  const { ProviderHealthMonitor } = await import(MOD);
  const m = monitor(ProviderHealthMonitor);
  for (let i = 0; i < 6; i += 1) {
    ok(m, 'p');
    assert.equal(fail(m, 'p').healthy, true, 'single interleaved failures stay healthy');
  }
});

test('health: while unhealthy, interleaved successes do not recover without a sustained run', async () => {
  const { ProviderHealthMonitor } = await import(MOD);
  const m = monitor(ProviderHealthMonitor);
  fail(m, 'p');
  fail(m, 'p'); // unhealthy
  for (let i = 0; i < 5; i += 1) {
    ok(m, 'p'); // 1 success...
    assert.equal(fail(m, 'p').healthy, false, 'success then failure never reaches 2-in-a-row');
  }
});

test('health: diagnostics count timeouts and rate-limits for logging', async () => {
  const { ProviderHealthMonitor } = await import(MOD);
  const m = monitor(ProviderHealthMonitor);
  m.recordAttempt('p', { success: false, errorType: 'AbortError' }); // timeout
  m.recordAttempt('p', { success: false, errorType: 'http_429' }); // rate limited
  m.recordAttempt('p', { success: true, latencyMs: 30 });
  const s = m.getSnapshot('p');
  assert.equal(s.timeoutCount, 1);
  assert.equal(s.rateLimitedCount, 1);
  assert.equal(s.failureCount, 2);
  assert.ok(s.successRate > 0 && s.successRate < 1);
});
