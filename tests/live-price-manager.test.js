'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

test('validateLiveQuote recalculates age from the provider timestamp', async () => {
  const { validateLiveQuote } = await import('../src/lib/live-price-manager.js');
  const now = Date.parse('2026-08-08T10:00:00.000Z');
  const result = validateLiveQuote(
    { price: 4712, providerTimestamp: '2026-08-08T09:59:30.000Z' },
    now
  );
  assert.equal(result.valid, true);
  assert.equal(result.ageMs, 30_000);
});
test('newest valid fallback wins while invalid future values are rejected', async () => {
  const { selectNewestValidQuote } = await import('../src/lib/live-price-manager.js');
  const now = Date.parse('2026-08-08T10:00:00.000Z');
  const selected = selectNewestValidQuote(
    [
      { price: 4700, providerTimestamp: '2026-08-08T09:59:00.000Z' },
      { price: 4710, providerTimestamp: '2026-08-08T09:59:45.000Z' },
      { price: 999, providerTimestamp: '2026-08-08T09:59:59.000Z' },
    ],
    now
  );
  assert.equal(selected.price, 4710);
});

test('manager publishes one browser-live quote through the shared lifecycle', async () => {
  const { createLivePriceManager } = await import('../src/lib/live-price-manager.js');
  const previousFetch = global.fetch;
  global.fetch = async () => ({
    ok: true,
    status: 200,
    async json() {
      return { price: 4712.1, updatedAt: new Date().toISOString() };
    },
  });
  const manager = createLivePriceManager({ logger: { error() {}, warn() {}, info() {} } });
  const snapshots = [];
  const unsubscribe = manager.subscribe((snapshot) => snapshots.push(snapshot));
  await manager.refreshNow('test');
  const latest = manager.getSnapshot();
  assert.equal(latest.quote.providerId, 'gold_api_com');
  assert.equal(latest.quote.sourceType, 'browser-live');
  assert.equal(latest.quote.providerPathSuccessful, true);
  assert.ok(snapshots.length >= 1);
  unsubscribe();
  manager.destroy();
  global.fetch = previousFetch;
});
