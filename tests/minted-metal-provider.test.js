'use strict';

const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function loadProvider() {
  const url = new URL(
    'file://' +
      path.resolve(__dirname, '..', 'src', 'lib', 'quote-providers', 'minted-metal-provider.js')
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
        updatedAt: new Date().toISOString(),
        metals: {
          gold: {
            price: 4496.95,
            fixedAt: new Date().toISOString(),
            currency: 'USD',
            unit: 'troy oz',
          },
        },
      };
    },
  });
});

afterEach(() => {
  global.fetch = originalFetch;
});

test('MintedMetalQuoteProvider parses LBMA reference JSON', async () => {
  const { MintedMetalQuoteProvider } = await loadProvider();
  const provider = new MintedMetalQuoteProvider();
  const quote = await provider.fetchQuote({ timeoutMs: 3000 });

  assert.equal(quote.providerId, 'minted_metal');
  assert.equal(quote.price, 4496.95);
  assert.ok(quote.providerTimestamp);
  assert.equal(quote.providerPathSuccessful, true);
  assert.equal(quote.isFallback, false);
  assert.equal(quote.isFresh, null);
});
