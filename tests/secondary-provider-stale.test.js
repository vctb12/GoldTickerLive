'use strict';

const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function loadSecondary() {
  const url = new URL(
    'file://' +
      path.resolve(__dirname, '..', 'src', 'lib', 'quote-providers', 'secondary-provider.js')
  );
  return import(url.href + `?v=${Date.now()}`);
}

const originalFetch = global.fetch;

function installLocalStorage(payload) {
  const store = new Map();
  if (payload) {
    store.set('gold_price_cache', JSON.stringify(payload));
  }
  global.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };
}

beforeEach(() => {
  global.fetch = async () => ({ ok: false, status: 404 });
});

afterEach(() => {
  global.fetch = originalFetch;
  delete global.localStorage;
});

test('SecondaryQuoteProvider rejects multi-day-old localStorage cache', async () => {
  installLocalStorage({
    price: 2000,
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    fetchedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
  });

  const { SecondaryQuoteProvider } = await loadSecondary();
  const provider = new SecondaryQuoteProvider();

  await assert.rejects(() => provider.fetchQuote());
});

test('SecondaryQuoteProvider accepts recent localStorage cache as fallback', async () => {
  installLocalStorage({
    price: 4448,
    updatedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    fetchedAt: Date.now() - 5 * 60 * 1000,
  });

  const { SecondaryQuoteProvider } = await loadSecondary();
  const provider = new SecondaryQuoteProvider();

  const quote = await provider.fetchQuote();
  assert.equal(quote.price, 4448);
  assert.equal(quote.isFallback, true);
  assert.equal(quote.providerPathSuccessful, false);
});
