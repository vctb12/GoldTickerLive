'use strict';

/**
 * White-label branding spike — proves it is a non-functional design spike: the flag ships OFF, the
 * resolver is inert (always default) while off, the default brand carries the real palette, demo
 * brands are flagged, token → CSS-var mapping works, and no brand carries tenant/billing scope.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const MOD = new URL('../src/branding/brand-config.js', `file://${__filename}`).href;

test('brand: white-label ships OFF and the resolver is inert while off', async () => {
  const { WHITE_LABEL_ENABLED, resolveBrandKey, DEFAULT_BRAND_KEY } = await import(MOD);
  assert.equal(WHITE_LABEL_ENABLED, false);
  assert.equal(DEFAULT_BRAND_KEY, 'gold-ticker-live');
  // While off, EVERY request resolves to the default — nothing re-skins at runtime.
  assert.equal(resolveBrandKey('demo-silver-souk'), 'gold-ticker-live');
  assert.equal(resolveBrandKey('demo-bourse-dor'), 'gold-ticker-live');
  assert.equal(resolveBrandKey('anything'), 'gold-ticker-live');
});

test('brand: default brand carries the real product palette', async () => {
  const { getBrand } = await import(MOD);
  const b = getBrand('gold-ticker-live');
  assert.equal(b.demo, false);
  assert.equal(b.name, 'Gold Ticker Live');
  assert.equal(b.tokens.primary, '#b07d1f'); // from tokens.css
  assert.equal(b.tokens.bg, '#fdfbf5');
  // Unknown key falls back to the default brand.
  assert.equal(getBrand('nope').key, 'gold-ticker-live');
});

test('brand: demo brands exist and are flagged demo', async () => {
  const { BRANDS, brandKeys } = await import(MOD);
  const demos = brandKeys().filter((k) => BRANDS[k].demo);
  assert.deepEqual(demos.sort(), ['demo-bourse-dor', 'demo-silver-souk']);
  assert.ok(BRANDS['demo-silver-souk'].name.includes('demo'));
});

test('brand: every brand has a complete, identical token key set', async () => {
  const { BRANDS } = await import(MOD);
  const expected = ['primary', 'primaryLight', 'bg', 'surface', 'ink', 'onPrimary'].sort();
  for (const brand of Object.values(BRANDS)) {
    assert.deepEqual(Object.keys(brand.tokens).sort(), expected, `${brand.key} tokens`);
    for (const v of Object.values(brand.tokens)) assert.match(v, /^#[0-9a-f]{6}$/i);
    assert.ok(brand.tagline.en && brand.tagline.ar, `${brand.key} bilingual tagline`);
  }
});

test('brand: brandToCssVars maps tokens to a --brand-* namespace (not live --color-*)', async () => {
  const { brandToCssVars, getBrand } = await import(MOD);
  const vars = brandToCssVars(getBrand('demo-silver-souk'));
  assert.equal(vars['--brand-primary'], '#6b7a8f');
  assert.equal(vars['--brand-bg'], '#f6f8fa');
  // Spike namespace only — it must not emit any live --color-* token.
  assert.ok(Object.keys(vars).every((k) => k.startsWith('--brand-')));
  assert.ok(!Object.keys(vars).some((k) => k.startsWith('--color-')));
});

test('brand: no brand carries tenant/billing/plan scope (spike stays a spike)', async () => {
  const { BRANDS } = await import(MOD);
  const FORBIDDEN = /tenant|billing|plan|price|subscription|stripe|invoice|seat/i;
  for (const brand of Object.values(BRANDS)) {
    for (const key of Object.keys(brand)) {
      assert.ok(!FORBIDDEN.test(key), `brand ${brand.key} must not have field ${key}`);
    }
  }
});
