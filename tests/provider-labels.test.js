'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function loadModule() {
  const url = new URL(
    'file://' + path.resolve(__dirname, '..', 'src', 'lib', 'provider-labels.js')
  );
  return import(url.href + `?v=${Date.now()}`);
}

// Regression (D1): internal class-style tokens must never reach the user-facing
// source label. Before the fix these ids mapped to "PrimaryProvider" /
// "SecondaryProvider", leaking implementation identifiers into the home status
// line, home freshness badge, and tracker source badge.
test('provider labels never expose internal class-style identifiers', async () => {
  const { formatProviderLabel } = await loadModule();

  const internalPathIds = [
    'primary-provider',
    'secondary-provider-cache',
    'cache-fallback',
    'cache',
  ];

  for (const id of internalPathIds) {
    const label = formatProviderLabel(id);
    assert.notEqual(label, 'PrimaryProvider', `${id} must not render "PrimaryProvider"`);
    assert.notEqual(label, 'SecondaryProvider', `${id} must not render "SecondaryProvider"`);
    // No internal token should survive as a user-facing label.
    assert.equal(
      /Provider$/.test(label) && label !== 'UnknownProvider',
      false,
      `${id} leaks token`
    );
  }
});

test('all quote-path ids resolve to the honest upstream source name', async () => {
  const { formatProviderLabel } = await loadModule();

  // The primary provider, the committed snapshot, and the cache/fallback path
  // all resolve to the same upstream: gold-api.com.
  for (const id of [
    'primary-provider',
    'secondary-provider-cache',
    'cache-fallback',
    'cache',
    'gold_api_com',
    'gold_api_com_file',
  ]) {
    assert.equal(formatProviderLabel(id), 'Gold-API.com');
  }
});

test('formatProviderLabel handles falsy and unknown ids without leaking', async () => {
  const { formatProviderLabel } = await loadModule();

  assert.equal(formatProviderLabel(''), 'UnknownProvider');
  assert.equal(formatProviderLabel(null), 'UnknownProvider');
  assert.equal(formatProviderLabel(undefined), 'UnknownProvider');
  // Unknown ids pass through as-is (caller-supplied), not coerced to a token.
  assert.equal(formatProviderLabel('goldpricez'), 'GoldPriceZ');
  assert.equal(formatProviderLabel('minted_metal'), 'Minted Metal');
});
