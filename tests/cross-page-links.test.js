'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadModule() {
  const url = pathToFileURL(path.resolve(__dirname, '..', 'src', 'lib', 'cross-page-links.js'));
  return import(url.href);
}

test('buildTrackerHashHref encodes mode/cur/k/u/lang', async () => {
  const mod = await loadModule();
  const href = mod.buildTrackerHashHref({
    mode: 'live',
    cur: 'AED',
    k: '22',
    u: 'tola',
    lang: 'ar',
    range: '30D',
  });
  assert.equal(href, 'tracker.html#mode=live&cur=AED&k=22&u=tola&lang=ar&r=30D');
});

test('buildTrackerHashHref falls back for invalid karat/mode', async () => {
  const mod = await loadModule();
  const href = mod.buildTrackerHashHref({ mode: 'bogus', k: '99', u: 'stone' });
  assert.match(href, /mode=live/);
  assert.match(href, /k=24/);
  assert.match(href, /u=gram/);
});

test('buildHomeTrackerHref uses selected karat and unit', async () => {
  const mod = await loadModule();
  const href = mod.buildHomeTrackerHref('21', 'oz', 'en');
  assert.equal(href, 'tracker.html#mode=live&cur=AED&k=21&u=oz&lang=en');
});

test('buildShopsHref adds country query when code present', async () => {
  const mod = await loadModule();
  assert.equal(mod.buildShopsHref(), 'shops.html');
  assert.equal(mod.buildShopsHref({ countryCode: 'AE' }), 'shops.html?country=AE');
  assert.equal(
    mod.buildShopsHref({ countryCode: 'ae', lang: 'ar' }),
    'shops.html?country=AE&lang=ar'
  );
  assert.equal(
    mod.buildShopsHref({ countryCode: 'AE', lang: 'en' }),
    'shops.html?country=AE&lang=en'
  );
});

test('countryForCurrency returns first matching country', async () => {
  const mod = await loadModule();
  const countries = [
    { code: 'AE', currency: 'AED' },
    { code: 'SA', currency: 'SAR' },
  ];
  assert.equal(mod.countryForCurrency('SAR', countries)?.code, 'SA');
  assert.equal(mod.countryForCurrency('USD', countries), null);
});

test('buildTrackerHashHref allowlists currency and language', async () => {
  const mod = await loadModule();
  const href = mod.buildTrackerHashHref({
    cur: 'javascript:alert(1)',
    lang: 'fr',
    range: 'bogus',
  });
  assert.match(href, /cur=AED/);
  assert.match(href, /lang=en/);
  assert.doesNotMatch(href, /[&?#]r=/);
});

test('buildShopsHref rejects invalid country codes', async () => {
  const mod = await loadModule();
  assert.equal(mod.buildShopsHref({ countryCode: 'javascript:' }), 'shops.html');
  assert.equal(mod.buildShopsHref({ countryCode: 'AE' }), 'shops.html?country=AE');
});

test('buildMethodologyHref supports fragment and lang', async () => {
  const mod = await loadModule();
  assert.equal(mod.buildMethodologyHref(), 'methodology.html');
  assert.equal(
    mod.buildMethodologyHref({ fragment: 'spot-vs-retail', lang: 'ar' }),
    'methodology.html?lang=ar#spot-vs-retail'
  );
  assert.equal(mod.buildMethodologyHref({ fragment: 'bogus' }), 'methodology.html');
});

test('buildCalculatorHref encodes karat country and tab', async () => {
  const mod = await loadModule();
  assert.equal(
    mod.buildCalculatorHref({ karat: '22', countryCode: 'AE', lang: 'ar', tab: 'value' }),
    'calculator.html?k=22&country=AE&lang=ar&tab=value'
  );
  assert.equal(mod.buildCalculatorHref({ karat: '99' }), 'calculator.html');
});
