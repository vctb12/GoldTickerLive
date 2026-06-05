'use strict';

const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function loadProvider() {
  const url = new URL(
    'file://' +
      path.resolve(__dirname, '..', 'src', 'lib', 'quote-providers', 'last-gold-price-provider.js')
  );
  return import(url.href + `?v=${Date.now()}`);
}

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = async () => ({
    ok: true,
    status: 200,
    async json() {
      return {
        price: 4448,
        posted_at_utc: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      };
    },
  });
});

afterEach(() => {
  global.fetch = originalFetch;
});

test('LastGoldPriceQuoteProvider reads recent canonical snapshot', async () => {
  const { LastGoldPriceQuoteProvider } = await loadProvider();
  const provider = new LastGoldPriceQuoteProvider();
  const quote = await provider.fetchQuote({ timeoutMs: 3000 });

  assert.equal(quote.price, 4448);
  assert.equal(quote.providerId, 'last-gold-price');
  assert.equal(quote.isFallback, false);
  assert.equal(quote.providerPathSuccessful, true);
});

test('LastGoldPriceQuoteProvider rejects stale snapshot', async () => {
  global.fetch = async () => ({
    ok: true,
    status: 200,
    async json() {
      return {
        price: 4448,
        posted_at_utc: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
    },
  });

  const { LastGoldPriceQuoteProvider } = await loadProvider();
  const provider = new LastGoldPriceQuoteProvider();

  await assert.rejects(() => provider.fetchQuote({ timeoutMs: 3000 }));
});
