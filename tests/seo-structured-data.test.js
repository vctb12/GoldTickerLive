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

// ── Site-wide JSON-LD integrity + Directive-4 (no retail Offer/Product) guard ──
//
// Walks every indexable HTML page the schema injector touches and asserts:
//   • every JSON-LD block parses;
//   • every top-level block declares an @type;
//   • Directive 4 — a reference price is NEVER expressed as a retail sale:
//       - no object anywhere is a Product / AggregateOffer / product-model type;
//       - the only permitted Offer is the zero-price "this tool is free" offer on
//         a WebApplication (price === '0'); no other object may carry `price` or
//         `priceCurrency`. This is what stops a gold reference price from ever
//         being marked up as a monetary Offer/Product.
{
  const SKIP_DIRS = new Set(['node_modules', 'dist', '.git', 'server', 'tests', 'admin', 'embed']);

  function walkHtml(dir, acc) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) walkHtml(full, acc);
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        acc.push(full);
      }
    }
    return acc;
  }

  function isNoindex(html) {
    return /<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(html);
  }

  // Recursively collect every nested object that carries an @type, plus a flat
  // list of every object (typed or not) so we can scan for stray price fields.
  function collectObjects(node, all) {
    if (Array.isArray(node)) {
      for (const item of node) collectObjects(item, all);
    } else if (node && typeof node === 'object') {
      all.push(node);
      for (const key of Object.keys(node)) collectObjects(node[key], all);
    }
    return all;
  }

  const FORBIDDEN_TYPES = new Set([
    'Product',
    'AggregateOffer',
    'IndividualProduct',
    'ProductModel',
    'ProductGroup',
    'ProductCollection',
  ]);

  const indexablePages = walkHtml(ROOT, [])
    .filter((f) => !isNoindex(fs.readFileSync(f, 'utf8')))
    .map((f) => path.relative(ROOT, f));

  test('site-wide: every indexable page has only valid, parseable JSON-LD', () => {
    for (const rel of indexablePages) {
      const blocks = jsonLdBlocks(read(rel));
      for (const block of blocks) {
        let parsed;
        assert.doesNotThrow(() => {
          parsed = JSON.parse(block);
        }, `${rel}: invalid JSON-LD block`);
        const roots = Array.isArray(parsed) ? parsed : [parsed];
        for (const r of roots) {
          assert.ok(r && r['@type'], `${rel}: JSON-LD block missing @type`);
        }
      }
    }
  });

  test('site-wide Directive-4: no reference price is expressed as a retail Offer/Product', () => {
    for (const rel of indexablePages) {
      const objs = jsonLdObjects(read(rel));
      const all = collectObjects(objs, []);
      for (const obj of all) {
        const type = obj['@type'];
        assert.ok(
          !FORBIDDEN_TYPES.has(type),
          `${rel}: forbidden retail type "${type}" — reference prices must never be a Product/Offer`
        );
        if (type === 'Offer') {
          // The only sanctioned Offer is the free-tool marker: price "0".
          assert.equal(
            obj.price,
            '0',
            `${rel}: the only permitted Offer is a zero-price free-tool offer (found price=${JSON.stringify(obj.price)})`
          );
        } else {
          // No non-Offer object may carry a monetary price — that would imply a
          // priced reference/gold quote (Directive 4 violation).
          assert.ok(
            !('price' in obj),
            `${rel}: "${type}" carries a price field — reference data must not be priced`
          );
          assert.ok(
            !('priceCurrency' in obj),
            `${rel}: "${type}" carries priceCurrency — reference data must not be priced`
          );
        }
      }
    }
  });

  test('index.html: FAQPage JSON-LD is present and matches the visible microdata FAQ', () => {
    const html = read('index.html');
    const faq = jsonLdObjects(html).find((o) => o['@type'] === 'FAQPage');
    assert.ok(faq, 'index.html: missing FAQPage JSON-LD');
    assert.ok(
      Array.isArray(faq.mainEntity) && faq.mainEntity.length >= 1,
      'index.html: FAQPage must have a non-empty mainEntity'
    );
    // Parity with the visible microdata FAQ: one JSON-LD Question per rendered
    // Question item, so the schema can't silently drift from the page copy.
    const visibleQuestions = (html.match(/itemtype="https:\/\/schema\.org\/Question"/gi) || [])
      .length;
    assert.equal(
      faq.mainEntity.length,
      visibleQuestions,
      `index.html: FAQPage has ${faq.mainEntity.length} questions but the page renders ${visibleQuestions}`
    );
    for (const q of faq.mainEntity) {
      assert.equal(q['@type'], 'Question', 'each FAQ entry must be a Question');
      assert.ok(q.name && q.name.trim(), 'each Question needs a name');
      assert.ok(
        q.acceptedAnswer && q.acceptedAnswer['@type'] === 'Answer' && q.acceptedAnswer.text,
        'each Question needs an Answer with text'
      );
    }
  });
}

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
