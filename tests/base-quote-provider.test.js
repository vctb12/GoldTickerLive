'use strict';

/**
 * Regression coverage for src/lib/quote-providers/base-provider.js.
 *
 * Every browser quote adapter extends BaseQuoteProvider.normalizeQuote — gaps
 * here would silently drop latency, invent provider ids, or leave timestamps
 * undefined on every live path.
 */

const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function load() {
  const url = new URL(
    'file://' + path.resolve(__dirname, '..', 'src', 'lib', 'quote-providers', 'base-provider.js')
  );
  return import(url.href + `?v=${Date.now()}-${Math.random()}`);
}

describe('BaseQuoteProvider', () => {
  test('requires providerId at construction', async () => {
    const { BaseQuoteProvider } = await load();
    assert.throws(() => new BaseQuoteProvider({}), /providerId is required/);
    assert.throws(() => new BaseQuoteProvider(), /providerId is required/);
  });

  test('fetchQuote rejects until a subclass implements it', async () => {
    const { BaseQuoteProvider } = await load();
    const provider = new BaseQuoteProvider({ providerId: 'stub', timeoutMs: 2500 });
    assert.equal(provider.providerId, 'stub');
    assert.equal(provider.timeoutMs, 2500);
    await assert.rejects(() => provider.fetchQuote(), /fetchQuote not implemented for stub/);
  });

  test('normalizeQuote fills timestamps, providerId, and success defaults', async () => {
    const { BaseQuoteProvider } = await load();
    const provider = new BaseQuoteProvider({ providerId: 'gold_api_com' });
    const fixed = '2026-07-27T10:00:00.000Z';

    const quote = provider.normalizeQuote({
      price: '4446.2',
      fetchedAt: fixed,
      updatedAt: '2026-07-27T09:59:30.000Z',
      latencyMs: 42,
      isFresh: true,
      isFallback: false,
    });

    assert.equal(quote.price, 4446.2);
    assert.equal(quote.fetchedAt, fixed);
    assert.equal(quote.providerTimestamp, '2026-07-27T09:59:30.000Z');
    assert.equal(quote.providerId, 'gold_api_com');
    assert.equal(quote.source, 'gold_api_com');
    assert.equal(quote.providerPathSuccessful, true);
    assert.equal(quote.latencyMs, 42);
    assert.equal(quote.isFresh, true);
    assert.equal(quote.isFallback, false);
    assert.equal(quote.forcedState, null);
    assert.equal(quote.providerRaw, null);
  });

  test('normalizeQuote prefers explicit providerTimestamp and keeps failure flags', async () => {
    const { BaseQuoteProvider } = await load();
    const provider = new BaseQuoteProvider({ providerId: 'primary' });

    const quote = provider.normalizeQuote({
      price: 4100,
      providerTimestamp: '2026-07-27T08:00:00.000Z',
      updatedAt: '2026-07-27T07:00:00.000Z',
      providerId: 'override-id',
      source: 'override-source',
      providerPathSuccessful: false,
      forcedState: 'fallback',
      providerRaw: { note: 'kept' },
      latencyMs: 'not-a-number',
    });

    assert.equal(quote.providerTimestamp, '2026-07-27T08:00:00.000Z');
    assert.equal(quote.providerId, 'override-id');
    assert.equal(quote.source, 'override-source');
    assert.equal(quote.providerPathSuccessful, false);
    assert.equal(quote.forcedState, 'fallback');
    assert.deepEqual(quote.providerRaw, { note: 'kept' });
    assert.equal(quote.latencyMs, null);
  });
});
