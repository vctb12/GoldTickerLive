/**
 * Tests for src/lib/supabase-data.js (W-7)
 *
 * Since fetchShops() calls the real Supabase API via fetch(), tests run
 * against a mock by patching globalThis.fetch. The mapRow() logic is
 * tested indirectly through fetchShops().
 */

'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

// supabase-data.js is ESM; load via dynamic import
async function load() {
  return import(
    pathToFileURL(path.resolve(__dirname, '..', 'src', 'lib', 'supabase-data.js')).href
  );
}

function mockFetch(status, body) {
  return async () => ({
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => body,
  });
}

test('fetchShops() returns null when fetch throws (network error)', async () => {
  const orig = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error('Network error');
  };
  try {
    const { fetchShops } = await load();
    const result = await fetchShops();
    assert.equal(result, null, 'should return null on network error');
  } finally {
    globalThis.fetch = orig;
  }
});

test('fetchShops() returns null when response is not ok (e.g. 401)', async () => {
  const orig = globalThis.fetch;
  globalThis.fetch = mockFetch(401, { message: 'Unauthorized' });
  try {
    const { fetchShops } = await load();
    const result = await fetchShops();
    assert.equal(result, null, 'should return null on non-ok response');
  } finally {
    globalThis.fetch = orig;
  }
});

test('fetchShops() returns null when rows array is empty', async () => {
  const orig = globalThis.fetch;
  globalThis.fetch = mockFetch(200, []);
  try {
    const { fetchShops } = await load();
    const result = await fetchShops();
    assert.equal(result, null, 'should return null for empty result');
  } finally {
    globalThis.fetch = orig;
  }
});

test('fetchShops() maps Supabase rows to camelCase client objects', async () => {
  const orig = globalThis.fetch;
  globalThis.fetch = mockFetch(200, [
    {
      id: 'shop_1',
      name: 'Gold Souq Dubai',
      country_code: 'AE',
      city: 'Dubai',
      market: 'Gold Souk',
      category: 'retail',
      specialties: ['22K', '21K'],
      phone: '+971-4-123456',
      website: 'https://example.com',
      details_availability: 'full',
      featured: true,
      verified: true,
      notes: 'Popular',
    },
  ]);
  try {
    const { fetchShops } = await load();
    const result = await fetchShops();
    assert.ok(Array.isArray(result), 'should return an array');
    assert.equal(result.length, 1);
    const shop = result[0];
    assert.equal(shop.id, 'shop_1');
    assert.equal(shop.name, 'Gold Souq Dubai');
    assert.equal(shop.countryCode, 'AE', 'country_code → countryCode');
    assert.equal(shop.city, 'Dubai');
    assert.equal(shop.market, 'Gold Souk');
    assert.equal(shop.category, 'retail');
    assert.deepEqual(shop.specialties, ['22K', '21K']);
    assert.equal(shop.phone, '+971-4-123456');
    assert.equal(shop.website, 'https://example.com');
    assert.equal(shop.detailsAvailability, 'full', 'details_availability → detailsAvailability');
    assert.equal(shop.featured, true);
    assert.equal(shop.verified, true);
    assert.equal(shop.notes, 'Popular');
  } finally {
    globalThis.fetch = orig;
  }
});

test('fetchShops() applies safe defaults for missing optional fields', async () => {
  const orig = globalThis.fetch;
  globalThis.fetch = mockFetch(200, [
    {
      id: 'shop_2',
      name: 'Simple Shop',
      // intentionally omit all optional fields
    },
  ]);
  try {
    const { fetchShops } = await load();
    const result = await fetchShops();
    const shop = result[0];
    assert.equal(shop.countryCode, '', 'missing country_code → empty string');
    assert.equal(shop.city, '', 'missing city → empty string');
    assert.deepEqual(shop.specialties, [], 'missing specialties → empty array');
    assert.equal(shop.featured, false, 'missing featured → false');
    assert.equal(shop.verified, false, 'missing verified → false');
    assert.equal(shop.detailsAvailability, 'limited', 'missing details_availability → "limited"');
  } finally {
    globalThis.fetch = orig;
  }
});

test('fetchShops() returns null when rows is not an array', async () => {
  const orig = globalThis.fetch;
  globalThis.fetch = mockFetch(200, { error: 'unexpected' });
  try {
    const { fetchShops } = await load();
    const result = await fetchShops();
    assert.equal(result, null, 'non-array response should return null');
  } finally {
    globalThis.fetch = orig;
  }
});
