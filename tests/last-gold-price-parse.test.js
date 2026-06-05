'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function loadParse() {
  const url = new URL(
    'file://' +
      path.resolve(__dirname, '..', 'src', 'lib', 'quote-providers', 'last-gold-price-parse.js')
  );
  return import(url.href + `?v=${Date.now()}`);
}

test('parseLastGoldPriceSnapshot reads canonical schema', async () => {
  const { parseLastGoldPriceSnapshot } = await loadParse();
  const parsed = parseLastGoldPriceSnapshot({
    price: 4448,
    posted_at_utc: '2026-06-05T12:42:19Z',
  });
  assert.equal(parsed.price, 4448);
  assert.equal(parsed.providerTimestamp, '2026-06-05T12:42:19Z');
});

test('parseLastGoldPriceSnapshot reads legacy nested schema', async () => {
  const { parseLastGoldPriceSnapshot } = await loadParse();
  const parsed = parseLastGoldPriceSnapshot({
    gold: { ounce_usd: 2300 },
    timestamp_utc: '2026-06-01T10:00:00Z',
  });
  assert.equal(parsed.price, 2300);
});
