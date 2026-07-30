'use strict';

/**
 * Regression coverage for src/lib/provider-labels.js.
 *
 * Freshness / provenance UI on home + tracker shows these labels next to
 * reference prices. Wrong mapping (e.g. cache → "Live") would mislead users
 * about data freshness — a trust-priority regression.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function load() {
  const url = new URL(
    'file://' + path.resolve(__dirname, '..', 'src', 'lib', 'provider-labels.js')
  );
  return import(url.href + `?v=${Date.now()}`);
}

describe('formatProviderLabel', () => {
  test('maps known provider IDs to stable display names', async () => {
    const { formatProviderLabel } = await load();

    assert.equal(formatProviderLabel('primary-provider'), 'PrimaryProvider');
    assert.equal(formatProviderLabel('live-primary'), 'Live');
    assert.equal(formatProviderLabel('gold_api_com'), 'Gold-API.com');
    assert.equal(formatProviderLabel('minted_metal'), 'Minted Metal');
    assert.equal(formatProviderLabel('last-gold-price'), 'Last Snapshot');
    assert.equal(formatProviderLabel('secondary-provider-cache'), 'SecondaryProvider');
    assert.equal(formatProviderLabel('goldpricez'), 'GoldPriceZ');
    assert.equal(formatProviderLabel('gold_api_com_file'), 'Gold-API.com');
  });

  test('never labels cache / fallback sources as Live', async () => {
    const { formatProviderLabel } = await load();

    assert.equal(formatProviderLabel('cache-fallback'), 'SecondaryProvider');
    assert.equal(formatProviderLabel('cache'), 'SecondaryProvider');
    assert.notEqual(formatProviderLabel('cache-fallback'), 'Live');
    assert.notEqual(formatProviderLabel('cache'), 'Live');
    assert.notEqual(formatProviderLabel('last-gold-price'), 'Live');
  });

  test('returns UnknownProvider for empty / falsy ids', async () => {
    const { formatProviderLabel } = await load();

    assert.equal(formatProviderLabel(null), 'UnknownProvider');
    assert.equal(formatProviderLabel(undefined), 'UnknownProvider');
    assert.equal(formatProviderLabel(''), 'UnknownProvider');
    assert.equal(formatProviderLabel(0), 'UnknownProvider');
  });

  test('passes through unknown provider ids as strings', async () => {
    const { formatProviderLabel } = await load();

    assert.equal(formatProviderLabel('twelvedata_xauusd'), 'twelvedata_xauusd');
    assert.equal(formatProviderLabel('custom-adapter'), 'custom-adapter');
  });
});
