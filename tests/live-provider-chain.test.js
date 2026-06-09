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

test('createPrimaryQuoteProvider chains live race + file fallbacks', async () => {
  const { createPrimaryQuoteProvider } = await loadFactory();
  const chain = createPrimaryQuoteProvider();
  assert.equal(chain.providerId, 'live-primary');
  assert.equal(chain.providers.length, 3);
  assert.equal(chain.providers[0].providerId, 'live-race');
  assert.equal(chain.providers[0].providers.length, 2);
  assert.equal(chain.providers[0].providers[0].providerId, 'gold_api_com');
  assert.equal(chain.providers[0].providers[1].providerId, 'minted_metal');
  assert.equal(chain.providers[1].providerId, 'primary-provider');
  assert.equal(chain.providers[2].providerId, 'last-gold-price');
});

test('createPrimaryQuoteProvider fails over through the chain', async () => {
  const { createPrimaryQuoteProvider } = await loadFactory();
  const chain = createPrimaryQuoteProvider();

  chain.providers[0].fetchQuote = async () => {
    throw new Error('live race down');
  };
  chain.providers[1].fetchQuote = async () => ({
    price: 4496.95,
    providerTimestamp: new Date().toISOString(),
    fetchedAt: new Date().toISOString(),
    providerId: 'primary-provider',
    source: 'primary-provider',
    providerPathSuccessful: true,
    isFresh: null,
    isFallback: false,
  });

  const quote = await chain.fetchQuote();
  assert.equal(quote.price, 4496.95);
  assert.equal(quote.providerId, 'primary-provider');
});
