'use strict';

/**
 * Registry-driven per-metal SEO / JSON-LD (Phase 61, Theme B). Proves SEO is generated from the
 * metals registry, is bilingual, carries the reference-estimate framing, uses "live" only for gold,
 * and emits NO Offer/price (the site publishes reference estimates, not offers to sell).
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const MOD = new URL('../src/lib/metal-seo.js', `file://${__filename}`).href;
const METALS = new URL('../src/config/metals.js', `file://${__filename}`).href;

test('seo: gold uses "live" and includes symbol + grades from the registry', async () => {
  const { buildMetalSeo } = await import(MOD);
  const s = buildMetalSeo('gold');
  assert.equal(s.metal, 'gold');
  assert.match(s.title, /Gold/);
  assert.match(s.title, /Live/);
  assert.match(s.title, /XAU/);
  assert.match(s.description, /reference estimate/i);
  assert.match(s.description, /not retail pricing and not financial advice/i);
  assert.match(s.description, /24/); // a gold grade
});

test('seo: non-gold metals are NOT described as "live" (no live feed yet)', async () => {
  const { buildMetalSeo } = await import(MOD);
  for (const key of ['silver', 'platinum', 'palladium']) {
    const s = buildMetalSeo(key);
    assert.doesNotMatch(s.title, /Live/);
    assert.doesNotMatch(s.description, /^Live/);
    assert.match(s.description, /reference estimate/i);
  }
});

test('seo: JSON-LD is a WebPage about the metal with NO Offer/price', async () => {
  const { buildMetalSeo, renderMetalJsonLd } = await import(MOD);
  const s = buildMetalSeo('silver');
  assert.equal(s.jsonLd['@type'], 'WebPage');
  assert.equal(s.jsonLd.about['@type'], 'Thing');
  assert.equal(s.jsonLd.about.alternateName, 'XAG');
  // Honesty: nothing in the JSON-LD implies a purchasable offer or a price.
  const json = renderMetalJsonLd(s);
  assert.doesNotMatch(json, /"@type"\s*:\s*"(Offer|Product|AggregateOffer)"/);
  assert.doesNotMatch(json, /"price"/);
  assert.ok(json.length > 0);
});

test('seo: Arabic localisation + framing', async () => {
  const { buildMetalSeo } = await import(MOD);
  const s = buildMetalSeo('gold', { lang: 'ar' });
  assert.equal(s.lang, 'ar');
  assert.match(s.title, /الذهب/);
  assert.equal(s.jsonLd.inLanguage, 'ar');
  assert.match(s.description, /نصيحة مالية/);
});

test('seo: buildAllMetalSeo covers every registry metal, gold first', async () => {
  const { buildAllMetalSeo } = await import(MOD);
  const { metalKeys } = await import(METALS);
  const all = buildAllMetalSeo();
  assert.deepEqual(
    all.map((s) => s.metal),
    metalKeys()
  );
  assert.equal(all[0].metal, 'gold');
});

test('seo: optional siteName adds isPartOf; renderMetalJsonLd handles empty', async () => {
  const { buildMetalSeo, renderMetalJsonLd } = await import(MOD);
  const s = buildMetalSeo('platinum', { siteName: 'GoldTickerLive' });
  assert.equal(s.jsonLd.isPartOf['@type'], 'WebSite');
  assert.equal(s.jsonLd.isPartOf.name, 'GoldTickerLive');
  assert.equal(renderMetalJsonLd(null), '');
  assert.equal(renderMetalJsonLd({}), '');
});
