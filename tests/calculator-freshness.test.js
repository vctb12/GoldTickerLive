'use strict';

const { test, before } = require('node:test');
const assert = require('node:assert/strict');

let getCalculatorFreshness;
let GOLD_MARKET;

before(async () => {
  ({ getCalculatorFreshness } = await import('../src/pages/calculator/freshness.js'));
  ({ GOLD_MARKET } = await import('../src/lib/live-status.js'));
});

test('calculator freshness uses shared policy for live, stale, and fallback data in EN and AR', () => {
  const now = Date.now();
  for (const lang of ['en', 'ar']) {
    assert.equal(
      getCalculatorFreshness({
        updatedAt: new Date(now - 1_000).toISOString(),
        isFresh: true,
        lang,
        now: new Date('2026-08-18T12:00:00Z'),
      }).state,
      'live',
      `${lang}: recent provider data is live when the market is open`
    );
    assert.equal(
      getCalculatorFreshness({
        updatedAt: new Date(now - (GOLD_MARKET.STALE_AFTER_MS + 1_000)).toISOString(),
        isFresh: true,
        lang,
        now: new Date('2026-08-18T12:00:00Z'),
      }).state,
      'stale',
      `${lang}: old is_fresh data cannot be live`
    );
    assert.equal(
      getCalculatorFreshness({
        updatedAt: new Date(now - 1_000).toISOString(),
        isFallback: true,
        lang,
        now: new Date('2026-08-18T12:00:00Z'),
      }).state,
      'fallback',
      `${lang}: provider fallback cannot be live`
    );
  }
});

test('calculator freshness applies the canonical market-closed overlay after data classification', () => {
  const freshness = getCalculatorFreshness({
    updatedAt: new Date().toISOString(),
    isFresh: true,
    now: new Date('2026-08-15T22:00:00Z'),
  });
  assert.equal(freshness.key, 'live');
  assert.equal(freshness.state, 'closed');
});
