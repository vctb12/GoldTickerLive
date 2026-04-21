'use strict';

/**
 * Tests for lib/admin/shop-manager.js
 * Run with:  npm test
 */

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

// Point shop-manager at a temporary file
const _TMP_SHOPS_FILE = path.join(require('os').tmpdir(), 'gp_test_shops_data.json');

// Patch before requiring the module
const REAL_SHOPS_FILE = path.join(__dirname, '../data/shops-data.json');
let _backup;

before(() => {
  if (fs.existsSync(REAL_SHOPS_FILE)) {
    _backup = fs.readFileSync(REAL_SHOPS_FILE);
  }
  // Start with empty shop list
  fs.mkdirSync(path.dirname(REAL_SHOPS_FILE), { recursive: true });
  fs.writeFileSync(REAL_SHOPS_FILE, JSON.stringify([]));
});

after(() => {
  if (_backup) {
    fs.writeFileSync(REAL_SHOPS_FILE, _backup);
  } else if (fs.existsSync(REAL_SHOPS_FILE)) {
    fs.unlinkSync(REAL_SHOPS_FILE);
  }
});

const shopManager = require('../server/lib/admin/shop-manager');

describe('createShop', () => {
  test('creates a valid shop', () => {
    const result = shopManager.createShop(
      {
        name: 'Gold Palace',
        city: 'Dubai',
        country: 'UAE',
        phone: '+971501234567',
        website: 'https://goldpalace.ae',
      },
      'admin@goldprices.com'
    );
    assert.equal(result.success, true);
    assert.equal(result.shop.name, 'Gold Palace');
    assert.ok(result.shop.id.startsWith('shop_'));
    assert.ok(result.shop.confidence >= 0 && result.shop.confidence <= 100);
  });

  test('rejects shop without a name', () => {
    const result = shopManager.createShop({ city: 'Dubai' }, 'admin@goldprices.com');
    assert.equal(result.success, false);
    assert.match(result.message, /name/i);
  });

  test('trims whitespace from name and city', () => {
    const result = shopManager.createShop(
      { name: '  Silver Star  ', city: '  Abu Dhabi  ' },
      'admin@goldprices.com'
    );
    assert.equal(result.shop.name, 'Silver Star');
    assert.equal(result.shop.city, 'Abu Dhabi');
  });
});

describe('getShopById', () => {
  test('retrieves an existing shop', () => {
    const created = shopManager.createShop({ name: 'FindMe' }, 'admin@goldprices.com');
    const found = shopManager.getShopById(created.shop.id);
    assert.equal(found.name, 'FindMe');
  });

  test('returns undefined for unknown id', () => {
    const result = shopManager.getShopById('nonexistent_id');
    assert.equal(result, undefined);
  });
});

describe('updateShop', () => {
  test('updates allowed fields', () => {
    const created = shopManager.createShop(
      { name: 'UpdateMe', city: 'Dubai' },
      'admin@goldprices.com'
    );
    const result = shopManager.updateShop(
      created.shop.id,
      { city: 'Sharjah', phone: '+971501111111' },
      'admin@goldprices.com'
    );
    assert.equal(result.success, true);
    assert.equal(result.shop.city, 'Sharjah');
    assert.equal(result.shop.phone, '+971501111111');
  });

  test('returns failure for unknown id', () => {
    const result = shopManager.updateShop('bad_id', { city: 'X' }, 'admin@goldprices.com');
    assert.equal(result.success, false);
    assert.match(result.message, /not found/i);
  });

  test('recalculates confidence after update', () => {
    const created = shopManager.createShop({ name: 'ConfidenceCheck' }, 'admin@goldprices.com');
    const before = created.shop.confidence;
    const updated = shopManager.updateShop(
      created.shop.id,
      {
        phone: '+97150000000',
        website: 'https://test.com',
        address: '123 Gold St',
        hours: '9am-9pm',
      },
      'admin@goldprices.com'
    );
    assert.ok(updated.shop.confidence >= before);
  });
});

describe('deleteShop', () => {
  test('deletes an existing shop', () => {
    const created = shopManager.createShop({ name: 'DeleteMe' }, 'admin@goldprices.com');
    const result = shopManager.deleteShop(created.shop.id, 'admin@goldprices.com');
    assert.equal(result.success, true);
    assert.equal(shopManager.getShopById(created.shop.id), undefined);
  });

  test('returns failure for unknown id', () => {
    const result = shopManager.deleteShop('ghost_id', 'admin@goldprices.com');
    assert.equal(result.success, false);
  });
});

describe('getFilteredShops', () => {
  before(() => {
    // Seed a few known shops
    shopManager.createShop({ name: 'Alpha Gold', city: 'Dubai', country: 'UAE' }, 'seed');
    shopManager.createShop(
      { name: 'Beta Jewels', city: 'Riyadh', country: 'Saudi Arabia' },
      'seed'
    );
    shopManager.createShop(
      { name: 'Gamma Exchange', city: 'Dubai', country: 'UAE', verified: true },
      'seed'
    );
  });

  test('filters by city', () => {
    const result = shopManager.getFilteredShops({ city: 'Dubai' });
    assert.ok(result.shops.every((s) => s.city === 'Dubai'));
  });

  test('filters by country', () => {
    const result = shopManager.getFilteredShops({ country: 'Saudi Arabia' });
    assert.ok(result.shops.every((s) => s.country === 'Saudi Arabia'));
  });

  test('filters by verified status', () => {
    const result = shopManager.getFilteredShops({ status: 'verified' });
    assert.ok(result.shops.every((s) => s.verified === true));
  });

  test('searches by name', () => {
    const result = shopManager.getFilteredShops({ search: 'gamma' });
    assert.ok(result.shops.some((s) => s.name.toLowerCase().includes('gamma')));
  });

  test('pagination: page 1 returns limit results', () => {
    const all = shopManager.getFilteredShops({});
    const page1 = shopManager.getFilteredShops({ page: 1, limit: 2 });
    assert.equal(page1.shops.length, Math.min(2, all.total));
  });
});

describe('batchImportShops', () => {
  test('imports multiple shops and generates unique IDs', () => {
    const batch = [
      { name: 'Batch Shop A', city: 'Dubai' },
      { name: 'Batch Shop B', city: 'Cairo' },
      { name: 'Batch Shop C', city: 'Doha' },
    ];
    const result = shopManager.batchImportShops(batch, 'admin@goldprices.com');
    assert.equal(result.imported, 3);
    assert.equal(result.errors, 0);

    const ids = result.details.imported.map((s) => s.id);
    const uniqueIds = new Set(ids);
    assert.equal(uniqueIds.size, 3, 'All IDs should be unique');
  });

  test('reports errors for shops missing a name', () => {
    const batch = [
      { name: 'Good Shop' },
      { city: 'No Name City' }, // invalid
    ];
    const result = shopManager.batchImportShops(batch, 'admin@goldprices.com');
    assert.equal(result.imported, 1);
    assert.equal(result.errors, 1);
  });
});

describe('calculateConfidenceScore', () => {
  test('returns 0 for empty shop', () => {
    const score = shopManager.calculateConfidenceScore({});
    assert.ok(score >= 0 && score <= 100);
  });

  test('returns 100 for fully-populated verified shop', () => {
    const shop = {
      name: 'Full Shop',
      city: 'Dubai',
      country: 'UAE',
      phone: '+97150000000',
      email: 'shop@example.com',
      website: 'https://example.com',
      address: '123 Gold St',
      latitude: 25.2,
      longitude: 55.3,
      hours: '9am-9pm',
      verified: true,
    };
    const score = shopManager.calculateConfidenceScore(shop);
    assert.equal(score, 100);
  });
});
