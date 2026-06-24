'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadModule() {
  const url = pathToFileURL(path.resolve(__dirname, '..', 'src', 'lib', 'cross-page-links.js'));
  return import(url.href);
}

test('buildShopsHref returns plain shops.html without country', async () => {
  const { buildShopsHref } = await loadModule();
  assert.equal(buildShopsHref(), 'shops.html');
  assert.equal(buildShopsHref({ lang: 'en' }), 'shops.html');
});

test('buildShopsHref adds country filter from calculator context', async () => {
  const { buildShopsHref } = await loadModule();
  assert.equal(buildShopsHref({ countryCode: 'AE' }), 'shops.html?country=AE');
  assert.equal(buildShopsHref({ countryCode: 'ae', lang: 'ar' }), 'shops.html?country=AE&lang=ar');
});
