'use strict';

const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function loadProvider() {
  const url = new URL(
    'file://' +
      path.resolve(
        __dirname,
        '..',
        'src',
        'lib',
        'quote-providers',
        'gold-api-com-metal-provider.js'
      )
  );
  return import(url.href + `?v=${Date.now()}`);
}

const originalFetch = global.fetch;
let requestedUrl;

beforeEach(() => {
  requestedUrl = '';
  global.fetch = async (url) => {
    requestedUrl = String(url);
    return {
      ok: true,
      status: 200,
      async json() {
        return { price: 36.25, updatedAt: new Date().toISOString(), symbol: 'XAG' };
      },
    };
  };
});

afterEach(() => {
  global.fetch = originalFetch;
});

test('fetches and labels the selected metal without entering the gold provider chain', async () => {
  const { GoldApiComMetalQuoteProvider } = await loadProvider();
  const quote = await new GoldApiComMetalQuoteProvider({ metalKey: 'silver' }).fetchQuote();
  assert.equal(requestedUrl, 'https://api.gold-api.com/price/XAG');
  assert.equal(quote.price, 36.25);
  assert.equal(quote.metalKey, 'silver');
  assert.equal(quote.symbol, 'XAG');
  assert.equal(quote.providerId, 'gold_api_com_xag');
  assert.equal(quote.source, 'Gold-API.com');
  assert.equal(quote.sourceId, 'gold_api_com_xag');
});

test('rejects unsupported metals before any request', async () => {
  const { GoldApiComMetalQuoteProvider } = await loadProvider();
  assert.throws(
    () => new GoldApiComMetalQuoteProvider({ metalKey: 'copper' }),
    /Unsupported metal/
  );
});

test('rejects provider symbol mismatches and per-metal sanity failures', async () => {
  global.fetch = async () => ({
    ok: true,
    status: 200,
    async json() {
      return { price: 3500, updatedAt: new Date().toISOString(), symbol: 'XAU' };
    },
  });
  const { GoldApiComMetalQuoteProvider } = await loadProvider();
  await assert.rejects(
    () => new GoldApiComMetalQuoteProvider({ metalKey: 'silver' }).fetchQuote(),
    (error) => error.code === 'sanity_range_failed' || error.code === 'symbol_mismatch'
  );
});
