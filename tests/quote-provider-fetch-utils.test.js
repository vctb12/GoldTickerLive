'use strict';

/**
 * Regression coverage for src/lib/quote-providers/fetch-utils.js.
 *
 * Shared by gold_api_com / minted-metal / last-gold-price / freegoldapi / api.js.
 * Wrong AbortError mapping or a loosened sanity band would either hide timeouts
 * as generic network errors or let impossible XAU/USD spots reach the UI.
 */

const { describe, test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function load() {
  const url = new URL(
    'file://' + path.resolve(__dirname, '..', 'src', 'lib', 'quote-providers', 'fetch-utils.js')
  );
  return import(url.href + `?v=${Date.now()}-${Math.random()}`);
}

describe('isSaneGoldSpotUsd', () => {
  test('accepts finite spots inside the browser band [1000, 10000]', async () => {
    const { isSaneGoldSpotUsd } = await load();
    assert.equal(isSaneGoldSpotUsd(1000), true);
    assert.equal(isSaneGoldSpotUsd(4446.2), true);
    assert.equal(isSaneGoldSpotUsd(10000), true);
  });

  test('rejects below floor, above ceiling, and non-finite values', async () => {
    const { isSaneGoldSpotUsd } = await load();
    assert.equal(isSaneGoldSpotUsd(999.99), false);
    assert.equal(isSaneGoldSpotUsd(50), false);
    assert.equal(isSaneGoldSpotUsd(10000.01), false);
    assert.equal(isSaneGoldSpotUsd(NaN), false);
    assert.equal(isSaneGoldSpotUsd(Infinity), false);
    assert.equal(isSaneGoldSpotUsd(undefined), false);
    assert.equal(isSaneGoldSpotUsd(null), false);
    assert.equal(isSaneGoldSpotUsd('4446'), false);
  });
});

describe('fetchWithProviderTimeout', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = originalFetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('returns the response on a successful fetch', async () => {
    const { fetchWithProviderTimeout } = await load();
    const fakeResponse = { ok: true, status: 200 };
    global.fetch = async (url, init) => {
      assert.equal(url, 'https://example.test/xau');
      assert.equal(init.cache, 'no-store');
      assert.ok(init.signal);
      return fakeResponse;
    };

    const response = await fetchWithProviderTimeout('https://example.test/xau', {
      timeoutMs: 1000,
    });
    assert.equal(response, fakeResponse);
  });

  test('maps AbortError to ProviderFetchError with code timeout', async () => {
    const { fetchWithProviderTimeout, ProviderFetchError } = await load();
    global.fetch = async (_url, init) => {
      // Simulate the controller aborting before settle.
      const err = new Error('The operation was aborted');
      err.name = 'AbortError';
      // Ensure the provided signal is present (timeout path).
      assert.ok(init.signal);
      throw err;
    };

    await assert.rejects(
      () => fetchWithProviderTimeout('https://example.test/slow', { timeoutMs: 50 }),
      (error) => {
        assert.ok(error instanceof ProviderFetchError);
        assert.equal(error.code, 'timeout');
        assert.match(error.message, /Timeout fetching/);
        return true;
      }
    );
  });

  test('maps non-abort failures to ProviderFetchError with code network_error', async () => {
    const { fetchWithProviderTimeout, ProviderFetchError } = await load();
    global.fetch = async () => {
      throw new Error('ECONNREFUSED');
    };

    await assert.rejects(
      () => fetchWithProviderTimeout('https://example.test/down', { timeoutMs: 1000 }),
      (error) => {
        assert.ok(error instanceof ProviderFetchError);
        assert.equal(error.code, 'network_error');
        assert.match(error.message, /ECONNREFUSED/);
        return true;
      }
    );
  });

  test('aborts immediately when the external signal is already aborted', async () => {
    const { fetchWithProviderTimeout, ProviderFetchError } = await load();
    const external = new AbortController();
    external.abort();

    let fetchCalled = false;
    global.fetch = async (_url, init) => {
      fetchCalled = true;
      if (init.signal?.aborted) {
        const err = new Error('aborted');
        err.name = 'AbortError';
        throw err;
      }
      return { ok: true };
    };

    await assert.rejects(
      () =>
        fetchWithProviderTimeout('https://example.test/preaborted', {
          signal: external.signal,
          timeoutMs: 5000,
        }),
      (error) => {
        assert.ok(error instanceof ProviderFetchError);
        assert.equal(error.code, 'timeout');
        return true;
      }
    );
    assert.equal(fetchCalled, true);
  });

  test('forwards custom headers to fetch', async () => {
    const { fetchWithProviderTimeout } = await load();
    let seenHeaders;
    global.fetch = async (_url, init) => {
      seenHeaders = init.headers;
      return { ok: true };
    };

    await fetchWithProviderTimeout('https://example.test/hdr', {
      headers: { Accept: 'application/json', 'X-Test': '1' },
      timeoutMs: 1000,
    });
    assert.deepEqual(seenHeaders, { Accept: 'application/json', 'X-Test': '1' });
  });
});
