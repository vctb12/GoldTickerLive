'use strict';

/**
 * Data-source health dashboard (Phase 48) — proves the view model is a pure, defensive transform of
 * provider-health snapshots + freshness: it ships gated OFF, classifies healthy/degraded, formats
 * rates/latency, is forward-compatible with older snapshots (missing Phase-47 diagnostics → 0), and
 * localises. The render is empty while the flag is off.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const MOD = new URL('../src/lib/datasource-health-dashboard.js', `file://${__filename}`).href;

const RICH = {
  providerId: 'gold-api-com',
  healthy: true,
  attempts: 20,
  successRate: 0.95,
  medianLatencyMs: 120,
  p95LatencyMs: 400,
  failureCount: 1,
  timeoutCount: 1,
  rateLimitedCount: 0,
  consecutiveFailures: 0,
  consecutiveSuccesses: 5,
  lastSuccessAt: 1000,
  lastFailureAt: 500,
};
// Pre-Phase-47 snapshot shape — lacks timeoutCount/rateLimitedCount/failureCount/consecutiveSuccesses.
const OLD = {
  providerId: 'legacy',
  healthy: false,
  attempts: 4,
  successRate: 0.5,
  medianLatencyMs: 90,
  p95LatencyMs: 200,
  consecutiveFailures: 2,
};

test('dashboard: ships gated OFF (flag default false)', async () => {
  const { isDashboardEnabled, buildDatasourceHealthModel, renderDatasourceHealthDashboard } =
    await import(MOD);
  assert.equal(isDashboardEnabled(), false);
  const model = buildDatasourceHealthModel({ providers: [RICH] });
  assert.equal(model.enabled, false);
  assert.equal(renderDatasourceHealthDashboard(model), ''); // render is empty while OFF
});

test('dashboard: builds rows with formatted rate + latency', async () => {
  const { buildDatasourceHealthModel } = await import(MOD);
  const model = buildDatasourceHealthModel({
    providers: [RICH],
    freshness: { state: 'live' },
    activeProviderId: 'gold-api-com',
  });
  const row = model.rows[0];
  assert.equal(row.providerId, 'gold-api-com');
  assert.equal(row.healthy, true);
  assert.equal(row.statusKey, 'healthy');
  assert.equal(row.successRatePct, 95);
  assert.equal(row.timeoutCount, 1);
  assert.equal(model.overall.allHealthy, true);
  assert.equal(model.overall.activeProviderId, 'gold-api-com');
  assert.equal(model.freshness.state, 'live');
});

test('dashboard: forward-compatible with pre-Phase-47 snapshots (missing fields → 0)', async () => {
  const { buildDatasourceHealthModel } = await import(MOD);
  const row = buildDatasourceHealthModel({ providers: [OLD] }).rows[0];
  assert.equal(row.healthy, false);
  assert.equal(row.statusKey, 'unhealthy');
  assert.equal(row.timeoutCount, 0); // absent in OLD → defaulted, no crash
  assert.equal(row.rateLimitedCount, 0);
  assert.equal(row.failureCount, 0);
  assert.equal(row.consecutiveSuccesses, 0);
  assert.equal(row.successRatePct, 50);
});

test('dashboard: no attempts → success rate is null (no misleading 100%)', async () => {
  const { buildDatasourceHealthModel, renderDatasourceHealthDashboard } = await import(MOD);
  // Minimal stub used elsewhere in the pricing engine: degraded, zero attempts.
  const model = buildDatasourceHealthModel({ providers: [{ providerId: 'x', healthy: false }] });
  const row = model.rows[0];
  assert.equal(row.attempts, 0);
  assert.equal(row.successRatePct, null); // NOT 100
  assert.equal(row.statusKey, 'unhealthy');
  // Render (forced on) shows an em dash, not "100%".
  const html = renderDatasourceHealthDashboard({ ...model, enabled: true });
  assert.match(html, /—/);
  assert.doesNotMatch(html, /100%/);
});

test('dashboard: overall degraded when any provider is unhealthy', async () => {
  const { buildDatasourceHealthModel } = await import(MOD);
  const model = buildDatasourceHealthModel({ providers: [RICH, OLD] });
  assert.equal(model.overall.allHealthy, false);
  assert.equal(model.overall.anyDegraded, true);
  assert.equal(model.overall.providerCount, 2);
});

test('dashboard: Arabic localisation of status + disclaimer', async () => {
  const { buildDatasourceHealthModel } = await import(MOD);
  const model = buildDatasourceHealthModel({ providers: [RICH, OLD] }, { lang: 'ar' });
  assert.equal(model.rows[0].statusLabel, 'سليم'); // healthy
  assert.equal(model.rows[1].statusLabel, 'متدهور'); // degraded
  assert.match(model.disclaimer, /تشخيصات تشغيلية/);
});

test('dashboard: empty providers → no rows, not-all-healthy', async () => {
  const { buildDatasourceHealthModel } = await import(MOD);
  const model = buildDatasourceHealthModel({ providers: [] });
  assert.deepEqual(model.rows, []);
  assert.equal(model.overall.allHealthy, false);
  assert.equal(model.freshness.state, 'unknown');
});
