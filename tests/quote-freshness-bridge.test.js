'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function loadBridge() {
  const url = new URL(
    'file://' + path.resolve(__dirname, '..', 'src', 'lib', 'quote-freshness-bridge.js')
  );
  return import(url.href + `?v=${Date.now()}`);
}

async function loadLiveStatus() {
  const url = new URL('file://' + path.resolve(__dirname, '..', 'src', 'lib', 'live-status.js'));
  return import(url.href + `?v=${Date.now()}`);
}

test('resolveGoldIsFresh returns null for normal live API quote (age classification deferred)', async () => {
  const { resolveGoldIsFresh } = await loadBridge();
  assert.equal(resolveGoldIsFresh({ isFresh: true, isFallback: false }), true);
  assert.equal(resolveGoldIsFresh({ isFresh: null, isFallback: false }), null);
  assert.equal(resolveGoldIsFresh({ isFallback: true }), false);
  assert.equal(resolveGoldIsFresh({ isFresh: false }), false);
});

test('3s live API quote shows Live via getLiveFreshness', async () => {
  const { resolveGoldIsFresh } = await loadBridge();
  const { getLiveFreshness } = await loadLiveStatus();

  const updatedAt = new Date(Date.now() - 3000).toISOString();
  const quote = { isFallback: false, isFresh: true };
  const isFresh = resolveGoldIsFresh(quote);
  const freshness = getLiveFreshness({
    updatedAt,
    isFresh,
    isFallback: quote.isFallback,
    hasLiveFailure: false,
  });

  assert.equal(isFresh, true);
  assert.equal(freshness.key, 'live');
});

test('15s live API quote downgrades to cached (5s live budget)', async () => {
  const { resolveGoldIsFresh } = await loadBridge();
  const { getLiveFreshness } = await loadLiveStatus();

  const updatedAt = new Date(Date.now() - 15_000).toISOString();
  const quote = { isFallback: false, isFresh: true };
  const isFresh = resolveGoldIsFresh(quote);
  const freshness = getLiveFreshness({
    updatedAt,
    isFresh,
    isFallback: quote.isFallback,
    hasLiveFailure: false,
  });

  assert.equal(isFresh, true);
  assert.equal(freshness.key, 'cached');
  assert.equal(freshness.reason, 'live-budget-exceeded');
});

test('hourly cron path still shows Live at 15s when isFresh is null', async () => {
  const { resolveGoldIsFresh } = await loadBridge();
  const { getLiveFreshness } = await loadLiveStatus();

  const updatedAt = new Date(Date.now() - 15_000).toISOString();
  const isFresh = resolveGoldIsFresh({ isFresh: null, isFallback: false });
  const freshness = getLiveFreshness({ updatedAt, isFresh, isFallback: false });

  assert.equal(freshness.key, 'live');
});
