'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function load() {
  const url = new URL('file://' + path.resolve(__dirname, '..', 'src', 'lib', 'live-status.js'));
  return import(url.href);
}

test('getMarketStatus() reports weekend closures correctly', async () => {
  const { getMarketStatus } = await load();

  assert.equal(getMarketStatus('2026-04-24T20:59:00Z').isOpen, true);
  assert.equal(getMarketStatus('2026-04-24T21:00:00Z').isOpen, false);
  assert.equal(getMarketStatus('2026-04-26T21:59:00Z').isOpen, false);
  assert.equal(getMarketStatus('2026-04-26T22:00:00Z').isOpen, true);
});

test('getAgeMs() returns infinity for invalid timestamps', async () => {
  const { getAgeMs } = await load();

  assert.equal(getAgeMs(null), Infinity);
  assert.equal(getAgeMs('not-a-date'), Infinity);
});

test('formatRelativeAge() returns a readable localized label', async () => {
  const { formatRelativeAge } = await load();

  assert.match(formatRelativeAge(45_000, 'en'), /sec|second|s ago|45/);
  assert.notEqual(formatRelativeAge(120_000, 'ar'), '—');
});

test('getLiveFreshness() classifies live, cached, stale, and unavailable states', async () => {
  const { getLiveFreshness } = await load();
  const now = Date.now();

  const live = getLiveFreshness({
    updatedAt: new Date(now - 30_000).toISOString(),
    hasLiveFailure: false,
  });
  assert.equal(live.key, 'live');

  const cached = getLiveFreshness({
    updatedAt: new Date(now - 30_000).toISOString(),
    hasLiveFailure: true,
  });
  assert.equal(cached.key, 'cached');

  const stale = getLiveFreshness({
    updatedAt: new Date(now - 20 * 60 * 1000).toISOString(),
    hasLiveFailure: true,
  });
  assert.equal(stale.key, 'stale');

  const unavailable = getLiveFreshness({ updatedAt: null, hasLiveFailure: true });
  assert.equal(unavailable.key, 'unavailable');
});
