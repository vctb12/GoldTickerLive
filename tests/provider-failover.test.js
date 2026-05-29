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

/**
 * Return a nowFn pinned to a Wednesday 12:00 UTC so market is always open.
 * Advances 1ms per call to avoid zero-age edge cases.
 */
function marketOpenNowFn() {
  // Wednesday 2026-01-07 12:00:00 UTC (mid-week, mid-session)
  let ts = new Date('2026-01-07T12:00:00Z').getTime();
  return () => ts++;
}

test('provider failover switches to secondary when primary keeps failing', async () => {
  const { createRealtimePricingEngine } = await loadEngine();
  const nowFn = marketOpenNowFn();
  const primaryProvider = {
    providerId: 'primary-provider',
    async fetchQuote() {
      throw new Error('primary down');
    },
  };
  const secondaryProvider = {
    providerId: 'secondary-provider-cache',
    async fetchQuote() {
      return {
        price: 3001,
        providerTimestamp: new Date(nowFn()).toISOString(),
        fetchedAt: new Date(nowFn()).toISOString(),
        providerId: 'secondary-provider-cache',
        source: 'secondary-provider-cache',
        providerPathSuccessful: false,
        forcedState: 'fallback',
      };
    },
  };

  const engine = createRealtimePricingEngine({
    primaryProvider,
    secondaryProvider,
    nowFn,
    config: { activePollMs: 999999, hiddenPollMs: 999999, jitterMs: 0 },
  });

  engine.start();
  await engine.refreshNow('failover-test');
  const snapshot = engine.getSnapshot();
  engine.stop();

  assert.equal(snapshot.activeProviderId, 'secondary-provider-cache');
  assert.equal(snapshot.freshness.state, 'fallback');
  assert.equal(
    snapshot.metrics.failoverP95Ms <= 10000 || snapshot.metrics.failoverP95Ms === null,
    true
  );
});
