/**
 * Structured-data + metadata-quality guards for the content pages whose
 * non-visual SEO layer is owned by the JSON-LD injector and the head metadata:
 *   - shops.html        → ItemList of JewelryStore listings (no fabricated data)
 *   - calculator.html   → WebApplication with a featureList
 *
 * The per-country hubs (countries/<slug>/) were removed in the 2026-07-04
 * radical page reduction, so their Dataset/BreadcrumbList assertions are gone.
 *
 * Enforced invariants:
 *   1. <title> <= 60 chars, <meta name="description"> <= 155 chars.
 *   2. Exactly one canonical, and og:url === canonical.
 *   3. Every <script type="application/ld+json"> block is valid JSON.
 *   4. shops.html ItemList exists, every item is a JewelryStore with
 *      name + addressLocality + addressCountry, and NO fabricated fields
 *      (telephone, openingHours, aggregateRating, review, geo, priceRange).
 *   5. calculator.html WebApplication exists with a non-empty featureList.
 */

'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

const TITLE_MAX = 60;
const DESCRIPTION_MAX = 155;

const PAGES = ['shops.html', 'calculator.html'];

function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8');
}
function head(html) {
  const m = html.match(/<head[\s\S]*?<\/head>/i);
  return m ? m[0] : html;
}
function getTitle(h) {
  const m = h.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].trim() : null;
}
function getMeta(h, attr, name) {
  const m = h.match(
    new RegExp(`<meta[^>]+${attr}=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i')
  );
  return m ? m[1] : null;
}
function jsonLdBlocks(html) {
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const out = [];
  let m;
  while ((m = re.exec(html)) !== null) out.push(m[1].trim());
  return out;
}
function jsonLdObjects(html) {
  return jsonLdBlocks(html).map((b) => JSON.parse(b));
}

for (const file of PAGES) {
  test(`${file}: title <= ${TITLE_MAX} chars`, () => {
    const title = getTitle(head(read(file)));
    assert.ok(title, `${file}: missing <title>`);
    assert.ok(
      title.length <= TITLE_MAX,
      `${file}: title is ${title.length} chars (> ${TITLE_MAX}): "${title}"`
    );
  });

  test(`${file}: meta description <= ${DESCRIPTION_MAX} chars`, () => {
    const desc = getMeta(head(read(file)), 'name', 'description');
    assert.ok(desc, `${file}: missing meta description`);
    assert.ok(
      desc.length <= DESCRIPTION_MAX,
      `${file}: description is ${desc.length} chars (> ${DESCRIPTION_MAX})`
    );
  });

  test(`${file}: exactly one canonical and og:url === canonical`, () => {
    const h = head(read(file));
    const canonicals = h.match(/rel=["']canonical["']/gi) || [];
    assert.equal(canonicals.length, 1, `${file}: expected 1 canonical, found ${canonicals.length}`);
    const canonical = (h.match(/rel=["']canonical["'][^>]*href=["']([^"']+)["']/i) || [])[1];
    const ogUrl = getMeta(h, 'property', 'og:url');
    assert.ok(canonical, `${file}: missing canonical href`);
    assert.equal(ogUrl, canonical, `${file}: og:url (${ogUrl}) !== canonical (${canonical})`);
  });

  test(`${file}: every JSON-LD block is valid JSON`, () => {
    const blocks = jsonLdBlocks(read(file));
    assert.ok(blocks.length >= 1, `${file}: expected at least one JSON-LD block`);
    for (const block of blocks) {
      assert.doesNotThrow(() => JSON.parse(block), `${file}: invalid JSON-LD block`);
    }
  });
}

test('shops.html: emits an ItemList of JewelryStore listings with no fabricated fields', () => {
  const objs = jsonLdObjects(read('shops.html'));
  const itemList = objs.find((o) => o['@type'] === 'ItemList');
  assert.ok(itemList, 'shops.html: missing ItemList JSON-LD');
  assert.ok(Array.isArray(itemList.itemListElement), 'ItemList: itemListElement must be an array');
  assert.ok(itemList.itemListElement.length >= 1, 'ItemList: expected at least one listing');
  assert.equal(
    itemList.numberOfItems,
    itemList.itemListElement.length,
    'ItemList: numberOfItems must match itemListElement length'
  );

  // Fabrication guard — these fields are NOT in data/shops.js and must never
  // be invented (Google policy + AGENTS.md trust rules).
  const forbidden = [
    'telephone',
    'openingHours',
    'aggregateRating',
    'review',
    'geo',
    'priceRange',
    'latitude',
    'longitude',
  ];
  const blob = JSON.stringify(itemList);
  for (const field of forbidden) {
    assert.ok(!blob.includes(field), `ItemList must not contain fabricated field "${field}"`);
  }

  for (const entry of itemList.itemListElement) {
    const store = entry.item;
    assert.equal(store['@type'], 'JewelryStore', 'each listing must be a JewelryStore');
    assert.ok(store.name, 'each store must have a name');
    assert.ok(store.address && store.address.addressLocality, 'each store needs addressLocality');
    assert.ok(store.address && store.address.addressCountry, 'each store needs addressCountry');
  }
});

test('calculator.html: emits a WebApplication with a featureList', () => {
  const objs = jsonLdObjects(read('calculator.html'));
  const app = objs.find((o) => o['@type'] === 'WebApplication');
  assert.ok(app, 'calculator.html: missing WebApplication JSON-LD');
  assert.ok(app.name, 'WebApplication: missing name');
  assert.ok(
    Array.isArray(app.featureList) && app.featureList.length >= 1,
    'WebApplication: featureList must be a non-empty array'
  );
  assert.ok(
    app.offers && app.offers.price === '0',
    'WebApplication: free calculator should advertise a zero-price offer'
  );
});

test('calculator.html: reference framing across description, WebApplication, and social tags', () => {
  const html = read('calculator.html');
  const h = head(html);
  const surfaces = [
    ['meta description', getMeta(h, 'name', 'description') || ''],
    ['og:description', getMeta(h, 'property', 'og:description') || ''],
    ['twitter:description', getMeta(h, 'name', 'twitter:description') || ''],
  ];
  for (const [label, value] of surfaces) {
    assert.match(value, /reference/i, `calculator ${label} must state reference rates`);
    assert.doesNotMatch(
      value,
      /live gold rates/i,
      `calculator ${label} must not claim "live gold rates"`
    );
  }
  const app = jsonLdObjects(html).find((o) => o['@type'] === 'WebApplication');
  assert.match(
    app.description,
    /reference/i,
    'WebApplication.description must state reference rates'
  );
});
