'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function loadEngine() {
  const url = new URL(
    'file://' + path.resolve(__dirname, '..', 'src', 'lib', 'realtime-pricing-engine.js')
  );
  return import(url.href + `?v=${Date.now()}`);
}

function makeProvider(id, price = 2500) {
  return {
    providerId: id,
    async fetchQuote() {
      return {
        price,
        providerTimestamp: new Date().toISOString(),
        fetchedAt: new Date().toISOString(),
        providerId: id,
        source: id,
        providerPathSuccessful: true,
        isFresh: true,
        isFallback: false,
      };
    },
  };
}

test('engine flags refresh_interval_p95_over_5s when rolling p95 exceeds SLO', async () => {
  const { createRealtimePricingEngine } = await loadEngine();
  let now = Date.now();
  const engine = createRealtimePricingEngine({
    primaryProvider: makeProvider('gold_api_com'),
    config: {
      activePollMs: 1000,
      livePollMs: 1000,
      backoffMs: [1000, 2000, 3000, 5000],
      jitterMs: 0,
    },
    nowFn: () => now,
    setTimeoutFn: (fn, ms) => {
      now += ms;
      fn();
      return 1;
    },
    clearTimeoutFn: () => {},
  });

  engine.start();
  for (let i = 0; i < 12; i++) {
    now += 7000;
    await engine.refreshNow();
  }

  const snap = engine.getSnapshot();
  assert.ok(
    snap.metrics.warningFlags.includes('refresh_interval_p95_over_5s'),
    `expected p95>5s warning, got ${JSON.stringify(snap.metrics.warningFlags)}`
  );
});

test('REALTIME_POLLING_DEFAULTS backoff caps at 5s', async () => {
  const url = new URL(
    'file://' + path.resolve(__dirname, '..', 'src', 'lib', 'realtime-config.js')
  );
  const { REALTIME_POLLING_DEFAULTS } = await import(url.href + `?v=${Date.now()}`);
  assert.deepEqual(REALTIME_POLLING_DEFAULTS.backoffMs, [1000, 2000, 3000, 5000]);
  assert.equal(REALTIME_POLLING_DEFAULTS.hiddenPollMs, 5000);
});
