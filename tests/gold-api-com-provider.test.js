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
        updatedAt: new Date().toISOString(),
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
  assert.ok(quote.providerTimestamp);
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

// ── Midas phase 6 — malformed payload guards (NaN / negative / absurd) ──────

for (const [label, badPrice] of [
  ['negative price', -4000],
  ['string price', 'four thousand'],
  ['zero price', 0],
  ['absurd price (1e9)', 1e9],
  ['missing price', undefined],
]) {
  test(`GoldApiComQuoteProvider rejects ${label}`, async () => {
    global.fetch = async () => ({
      ok: true,
      status: 200,
      async json() {
        return { price: badPrice, updatedAt: new Date().toISOString() };
      },
    });

    const { GoldApiComQuoteProvider } = await loadProvider();
    const provider = new GoldApiComQuoteProvider();

    await assert.rejects(
      () => provider.fetchQuote({ timeoutMs: 3000 }),
      (err) => err.code === 'sanity_range_failed'
    );
  });
}

test('GoldApiComQuoteProvider rejects missing or unparseable updatedAt', async () => {
  const { GoldApiComQuoteProvider } = await loadProvider();
  const provider = new GoldApiComQuoteProvider();

  for (const updatedAt of [undefined, null, '', 'not-a-date']) {
    global.fetch = async () => ({
      ok: true,
      status: 200,
      async json() {
        return { price: 4002.7, updatedAt };
      },
    });
    await assert.rejects(
      () => provider.fetchQuote({ timeoutMs: 3000 }),
      (err) => err.code === 'missing_timestamp',
      `updatedAt=${JSON.stringify(updatedAt)} must be rejected`
    );
  }
});

test('GoldApiComQuoteProvider rejects stale provider timestamps (>15 min)', async () => {
  global.fetch = async () => ({
    ok: true,
    status: 200,
    async json() {
      return {
        price: 4002.7,
        updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      };
    },
  });

  const { GoldApiComQuoteProvider } = await loadProvider();
  const provider = new GoldApiComQuoteProvider();

  await assert.rejects(
    () => provider.fetchQuote({ timeoutMs: 3000 }),
    (err) => err.code === 'stale_data'
  );
});
