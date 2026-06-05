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

test('SecondaryQuoteProvider aborts slow last snapshot fetch within timeoutMs', async () => {
  global.fetch = (_url, options) =>
    new Promise((resolve, reject) => {
      const onAbort = () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
      if (options?.signal?.aborted) onAbort();
      else options?.signal?.addEventListener('abort', onAbort, { once: true });
    });

  const { SecondaryQuoteProvider } = await loadSecondary();
  const provider = new SecondaryQuoteProvider();

  const started = Date.now();
  await assert.rejects(() => provider.fetchQuote({ timeoutMs: 50 }));
  const elapsed = Date.now() - started;
  assert.ok(elapsed < 500, `expected abort near timeout, took ${elapsed}ms`);
});

test('parseLastGoldPriceSnapshot reads canonical last_gold_price.json schema', async () => {
  const { parseLastGoldPriceSnapshot } = await loadSecondary();
  const parsed = parseLastGoldPriceSnapshot({
    price: 4448,
    posted_at_utc: '2026-06-05T12:42:19Z',
    content_hash: 'abc',
  });
  assert.equal(parsed.price, 4448);
  assert.equal(parsed.providerTimestamp, '2026-06-05T12:42:19Z');
});

test('parseLastGoldPriceSnapshot reads legacy nested gold.ounce_usd schema', async () => {
  const { parseLastGoldPriceSnapshot } = await loadSecondary();
  const parsed = parseLastGoldPriceSnapshot({
    gold: { ounce_usd: 2300 },
    timestamp_utc: '2026-06-01T10:00:00Z',
  });
  assert.equal(parsed.price, 2300);
  assert.equal(parsed.providerTimestamp, '2026-06-01T10:00:00Z');
});

test('SecondaryQuoteProvider accepts recent last_gold_price.json file fallback', async () => {
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

  const { SecondaryQuoteProvider } = await loadSecondary();
  const provider = new SecondaryQuoteProvider();
  const quote = await provider.fetchQuote();

  assert.equal(quote.price, 4448);
  assert.equal(quote.isFallback, true);
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
