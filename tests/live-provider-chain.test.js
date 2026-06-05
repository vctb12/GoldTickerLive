'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function loadFactory() {
  const url = new URL(
    'file://' +
      path.resolve(__dirname, '..', 'src', 'lib', 'quote-providers', 'create-providers.js')
  );
  return import(url.href + `?v=${Date.now()}`);
}

test('createPrimaryQuoteProvider chains four live/file sources', async () => {
  const { createPrimaryQuoteProvider } = await loadFactory();
  const chain = createPrimaryQuoteProvider();
  assert.equal(chain.providerId, 'live-primary');
  assert.equal(chain.providers.length, 4);
  assert.equal(chain.providers[0].providerId, 'gold_api_com');
  assert.equal(chain.providers[1].providerId, 'minted_metal');
  assert.equal(chain.providers[2].providerId, 'primary-provider');
  assert.equal(chain.providers[3].providerId, 'last-gold-price');
});

test('createPrimaryQuoteProvider fails over through the chain', async () => {
  const { createPrimaryQuoteProvider } = await loadFactory();
  const chain = createPrimaryQuoteProvider();

  chain.providers[0].fetchQuote = async () => {
    throw new Error('gold-api down');
  };
  chain.providers[1].fetchQuote = async () => ({
    price: 4496.95,
    providerTimestamp: new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    providerId: 'minted_metal',
    source: 'minted_metal',
    providerPathSuccessful: true,
    isFresh: null,
    isFallback: false,
  });

  const quote = await chain.fetchQuote();
  assert.equal(quote.price, 4496.95);
  assert.equal(quote.providerId, 'minted_metal');
});
