'use strict';

const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function loadCache() {
  const url = new URL('file://' + path.resolve(__dirname, '..', 'src', 'lib', 'cache.js'));
  return import(url.href + `?v=${Date.now()}`);
}

function installLocalStorage() {
  const store = new Map();
  global.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };
  return store;
}

beforeEach(() => {
  installLocalStorage();
});

afterEach(() => {
  delete global.localStorage;
});

test('getFallbackGoldPrice returns the newest entry between primary and fallback slots', async () => {
  const constantsUrl = 'file://' + path.resolve(__dirname, '..', 'src', 'config', 'constants.js');
  const { CONSTANTS } = await import(constantsUrl + `?v=${Date.now()}`);
  const { getFallbackGoldPrice } = await loadCache();

  const old = {
    price: 2000,
    updatedAt: '2026-05-28T10:00:00.000Z',
    fetchedAt: Date.parse('2026-05-28T10:00:00.000Z'),
  };
  const recent = {
    price: 4448,
    updatedAt: '2026-06-05T12:00:00.000Z',
    fetchedAt: Date.parse('2026-06-05T12:00:00.000Z'),
  };

  localStorage.setItem(CONSTANTS.CACHE_KEYS.goldFallback, JSON.stringify(old));
  localStorage.setItem(CONSTANTS.CACHE_KEYS.goldPrice, JSON.stringify(recent));

  const picked = getFallbackGoldPrice();
  assert.equal(picked.price, 4448);
});

test('getFreshBootGoldPrice rejects cache older than stale threshold', async () => {
  const constantsUrl = 'file://' + path.resolve(__dirname, '..', 'src', 'config', 'constants.js');
  const { CONSTANTS } = await import(constantsUrl + `?v=${Date.now()}`);
  const { getFreshBootGoldPrice } = await loadCache();

  const stale = {
    price: 2000,
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    fetchedAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
  };
  localStorage.setItem(CONSTANTS.CACHE_KEYS.goldPrice, JSON.stringify(stale));

  assert.equal(getFreshBootGoldPrice(), null);
});

test('getFreshBootGoldPrice accepts recent cache for instant boot paint', async () => {
  const constantsUrl = 'file://' + path.resolve(__dirname, '..', 'src', 'config', 'constants.js');
  const { CONSTANTS } = await import(constantsUrl + `?v=${Date.now()}`);
  const { getFreshBootGoldPrice } = await loadCache();

  const fresh = {
    price: 4448,
    updatedAt: new Date(Date.now() - 60_000).toISOString(),
    fetchedAt: Date.now() - 60_000,
  };
  localStorage.setItem(CONSTANTS.CACHE_KEYS.goldPrice, JSON.stringify(fresh));

  const boot = getFreshBootGoldPrice();
  assert.equal(boot.price, 4448);
});
