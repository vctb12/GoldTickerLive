'use strict';

const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function loadProvider() {
  const url = new URL(
    'file://' +
      path.resolve(__dirname, '..', 'src', 'lib', 'quote-providers', 'gold-api-com-provider.js')
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
        price: 4446.2,
        updatedAt: '2026-06-05T12:43:23Z',
        symbol: 'XAU',
      };
    },
  });
});

afterEach(() => {
  global.fetch = originalFetch;
});

test('GoldApiComQuoteProvider parses live API response', async () => {
  const { GoldApiComQuoteProvider } = await loadProvider();
  const provider = new GoldApiComQuoteProvider();

  const quote = await provider.fetchQuote({ timeoutMs: 3000 });

  assert.equal(quote.providerId, 'gold_api_com');
  assert.equal(quote.price, 4446.2);
  assert.equal(quote.providerTimestamp, '2026-06-05T12:43:23Z');
  assert.equal(quote.providerPathSuccessful, true);
  assert.equal(quote.isFallback, false);
});

test('GoldApiComQuoteProvider rejects out-of-range prices', async () => {
  global.fetch = async () => ({
    ok: true,
    status: 200,
    async json() {
      return { price: 50, updatedAt: new Date().toISOString() };
    },
  });

  const { GoldApiComQuoteProvider } = await loadProvider();
  const provider = new GoldApiComQuoteProvider();

  await assert.rejects(() => provider.fetchQuote({ timeoutMs: 3000 }));
});
