'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  assessHealth,
  fetchJsonWithRetry,
  isTransientFetchFailure,
} = require('../scripts/node/production-health-check.js');

const NOW = Date.parse('2026-08-13T16:00:00Z');
const healthySite = { ok: true, status: 200, latencyMs: 10, body: {} };
const healthyBrowser = {
  ok: true,
  status: 200,
  latencyMs: 20,
  body: { price: 4300, updatedAt: '2026-08-13T15:59:50Z' },
};

test('a stale Pages fallback is a warning when the browser-live quote is fresh', () => {
  const report = assessHealth({
    site: healthySite,
    staticSnapshot: {
      ok: true,
      status: 200,
      latencyMs: 15,
      body: { xau_usd_per_oz: 4300, timestamp_utc: '2026-08-13T15:20:00Z' },
    },
    browserProvider: healthyBrowser,
    now: NOW,
  });

  assert.equal(report.status, 'warning');
  assert.deepEqual(report.critical, []);
  assert.deepEqual(report.warnings, ['actions_snapshot_stale_or_invalid']);
});

test('a stale Pages fallback remains critical when the browser-live path is also unhealthy', () => {
  const report = assessHealth({
    site: healthySite,
    staticSnapshot: { ok: false, status: 503, latencyMs: 15, body: null },
    browserProvider: { ok: false, status: 0, latencyMs: 20, body: null },
    now: NOW,
  });

  assert.equal(report.status, 'degraded');
  assert.deepEqual(report.critical, [
    'browser_live_provider_unhealthy',
    'actions_snapshot_stale_or_invalid',
  ]);
});

test('a fresh static fallback and browser-live quote remain healthy', () => {
  const report = assessHealth({
    site: healthySite,
    staticSnapshot: {
      ok: true,
      status: 200,
      latencyMs: 15,
      body: { xau_usd_per_oz: 4300, fetched_at_utc: '2026-08-13T15:59:50Z' },
    },
    browserProvider: healthyBrowser,
    now: NOW,
  });

  assert.equal(report.status, 'healthy');
  assert.deepEqual(report.critical, []);
  assert.deepEqual(report.warnings, []);
});

test('fetchJsonWithRetry succeeds after a transient network failure', async () => {
  let calls = 0;
  const fetchJsonImpl = async () => {
    calls += 1;
    if (calls === 1) return { ok: false, status: 0, body: null, latencyMs: 5, error: 'network_error' };
    return {
      ok: true,
      status: 200,
      body: { price: 4300, updatedAt: '2026-08-13T15:59:50Z' },
      latencyMs: 10,
    };
  };

  const result = await fetchJsonWithRetry('https://api.gold-api.com/price/XAU', {
    fetchJsonImpl,
    maxAttempts: 3,
  });

  assert.equal(calls, 2);
  assert.equal(result.ok, true);
  assert.equal(result.status, 200);
});

test('isTransientFetchFailure only matches network-style failures', () => {
  assert.equal(isTransientFetchFailure({ status: 0 }), true);
  assert.equal(isTransientFetchFailure({ status: 503, error: 'timeout' }), true);
  assert.equal(isTransientFetchFailure({ status: 503 }), false);
  assert.equal(isTransientFetchFailure({ status: 200 }), false);
});
