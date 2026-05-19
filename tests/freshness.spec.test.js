'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function loadFreshness() {
  const url = new URL('file://' + path.resolve(__dirname, '..', 'src', 'lib', 'freshness.js'));
  return import(url.href);
}

test('normalizeFreshnessState preserves canonical states and maps unknown to estimated', async () => {
  const { normalizeFreshnessState } = await loadFreshness();
  assert.equal(normalizeFreshnessState('live'), 'live');
  assert.equal(normalizeFreshnessState('cached'), 'cached');
  assert.equal(normalizeFreshnessState('delayed'), 'delayed');
  assert.equal(normalizeFreshnessState('estimated'), 'estimated');
  assert.equal(normalizeFreshnessState('fallback'), 'fallback');
  assert.equal(normalizeFreshnessState('closed'), 'closed');
  assert.equal(normalizeFreshnessState('mystery'), 'estimated');
});

test('normalizeFreshnessState forces closed when market is closed', async () => {
  const { normalizeFreshnessState } = await loadFreshness();
  assert.equal(normalizeFreshnessState('live', { marketOpen: false }), 'closed');
  assert.equal(normalizeFreshnessState('cached', { marketOpen: false }), 'closed');
});

test('getFreshnessMeta includes tone, translation key, source, and timestamp passthrough', async () => {
  const { getFreshnessMeta } = await loadFreshness();
  const updatedAt = '2026-05-19T10:00:00Z';
  const meta = getFreshnessMeta({
    state: 'delayed',
    source: 'GoldPriceZ',
    updatedAt,
    marketOpen: true,
  });
  assert.equal(meta.state, 'delayed');
  assert.equal(meta.tone, 'delayed');
  assert.equal(meta.translationKey, 'freshness.badge.delayed');
  assert.equal(meta.source, 'GoldPriceZ');
  assert.equal(meta.updatedAt, updatedAt);
});
