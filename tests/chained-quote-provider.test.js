'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function loadChained() {
  const url = new URL(
    'file://' +
      path.resolve(__dirname, '..', 'src', 'lib', 'quote-providers', 'chained-provider.js')
  );
  return import(url.href + `?v=${Date.now()}`);
}

test('ChainedQuoteProvider fails over to the second provider', async () => {
  const { ChainedQuoteProvider } = await loadChained();

  const primary = {
    providerId: 'failing',
    async fetchQuote() {
      throw new Error('primary down');
    },
  };
  const secondary = {
    providerId: 'gold_api_com',
    async fetchQuote() {
      return {
        price: 4448,
        providerTimestamp: new Date().toISOString(),
        fetchedAt: new Date().toISOString(),
        providerId: 'gold_api_com',
        source: 'gold_api_com',
        providerPathSuccessful: true,
      };
    },
  };

  const chain = new ChainedQuoteProvider({
    providerId: 'live-primary',
    providers: [primary, secondary],
  });

  const quote = await chain.fetchQuote();
  assert.equal(quote.price, 4448);
  assert.equal(quote.providerId, 'gold_api_com');
});

test('ChainedQuoteProvider throws when every provider fails', async () => {
  const { ChainedQuoteProvider } = await loadChained();

  const chain = new ChainedQuoteProvider({
    providers: [
      {
        providerId: 'a',
        async fetchQuote() {
          throw new Error('a down');
        },
      },
      {
        providerId: 'b',
        async fetchQuote() {
          throw new Error('b down');
        },
      },
    ],
  });

  await assert.rejects(() => chain.fetchQuote());
});
