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

// ── Midas phase 6 — malformed payload guards (NaN / negative / absurd) ──────

function mmPayload(price, fixedAt = new Date().toISOString()) {
  return {
    updatedAt: new Date().toISOString(),
    metals: { gold: { price, fixedAt, currency: 'USD', unit: 'troy oz' } },
  };
}

for (const [label, badPrice] of [
  ['negative price', -4000],
  ['string price', 'four thousand'],
  ['zero price', 0],
  ['absurd price (1e9)', 1e9],
  ['missing price', undefined],
]) {
  test(`MintedMetalQuoteProvider rejects ${label}`, async () => {
    global.fetch = async () => ({
      ok: true,
      status: 200,
      async json() {
        return mmPayload(badPrice);
      },
    });

    const { MintedMetalQuoteProvider } = await loadProvider();
    const provider = new MintedMetalQuoteProvider();

    await assert.rejects(
      () => provider.fetchQuote({ timeoutMs: 3000 }),
      (err) => err.code === 'sanity_range_failed'
    );
  });
}

test('MintedMetalQuoteProvider rejects missing metals block entirely', async () => {
  global.fetch = async () => ({
    ok: true,
    status: 200,
    async json() {
      return { updatedAt: new Date().toISOString() };
    },
  });

  const { MintedMetalQuoteProvider } = await loadProvider();
  const provider = new MintedMetalQuoteProvider();

  await assert.rejects(
    () => provider.fetchQuote({ timeoutMs: 3000 }),
    (err) => err.code === 'sanity_range_failed'
  );
});

test('MintedMetalQuoteProvider rejects missing or unparseable timestamps', async () => {
  const { MintedMetalQuoteProvider } = await loadProvider();
  const provider = new MintedMetalQuoteProvider();

  for (const fixedAt of [null, 'not-a-date']) {
    global.fetch = async () => ({
      ok: true,
      status: 200,
      async json() {
        const payload = mmPayload(4496.95, fixedAt);
        delete payload.updatedAt; // no fallback timestamp either
        return payload;
      },
    });
    await assert.rejects(
      () => provider.fetchQuote({ timeoutMs: 3000 }),
      (err) => err.code === 'missing_timestamp',
      `fixedAt=${JSON.stringify(fixedAt)} must be rejected`
    );
  }
});

test('MintedMetalQuoteProvider rejects stale reference data (>4 h)', async () => {
  global.fetch = async () => ({
    ok: true,
    status: 200,
    async json() {
      return mmPayload(4496.95, new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString());
    },
  });

  const { MintedMetalQuoteProvider } = await loadProvider();
  const provider = new MintedMetalQuoteProvider();

  await assert.rejects(
    () => provider.fetchQuote({ timeoutMs: 3000 }),
    (err) => err.code === 'stale_data'
  );
});
