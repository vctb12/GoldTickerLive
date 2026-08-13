'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const { assessHealth } = require('../scripts/node/production-health-check.js');

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
      body: { xau_usd_per_oz: 4300, timestamp_utc: '2026-08-13T15:30:00Z' },
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
