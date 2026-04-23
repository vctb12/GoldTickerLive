'use strict';

/**
 * Unit tests for scripts/node/inventory-seo.js
 *
 * Locks the detection surface so heuristic regressions (missed attribute
 * order, multi-line tags, JSON-LD @graph shape, etc.) fail loudly.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  extractHtmlLangDir,
  extractTitle,
  extractMetaByName,
  extractMetaByProperty,
  extractCanonical,
  extractHreflang,
  extractJsonLdTypes,
  summarize,
} = require('../scripts/node/inventory-seo.js');

test('extractHtmlLangDir reads both attributes regardless of order', () => {
  assert.deepEqual(extractHtmlLangDir('<html lang="en" dir="ltr">'), { lang: 'en', dir: 'ltr' });
  assert.deepEqual(extractHtmlLangDir('<html dir="rtl" lang="ar">'), { lang: 'ar', dir: 'rtl' });
  assert.deepEqual(extractHtmlLangDir('<html>'), { lang: null, dir: null });
});

test('extractTitle normalizes whitespace and decodes entities', () => {
  assert.equal(extractTitle('<title>  Hello   World  </title>'), 'Hello World');
  assert.equal(extractTitle('<title>A &amp; B</title>'), 'A & B');
  assert.equal(extractTitle('<title></title>'), null);
  assert.equal(extractTitle('no title here'), null);
});

test('extractMetaByName handles attribute order variance', () => {
  const html = `
    <meta name="description" content="First">
    <meta content="Second" name="twitter:card">
  `;
  assert.equal(extractMetaByName(html, 'description'), 'First');
  assert.equal(extractMetaByName(html, 'twitter:card'), 'Second');
  assert.equal(extractMetaByName(html, 'missing'), null);
});

test('extractMetaByProperty handles og:* with colons', () => {
  const html = `<meta property="og:url" content="https://example.com/">`;
  assert.equal(extractMetaByProperty(html, 'og:url'), 'https://example.com/');
  assert.equal(extractMetaByProperty(html, 'og:image'), null);
});

test('extractCanonical captures exactly one canonical href', () => {
  const html = `
    <link rel="stylesheet" href="/foo.css">
    <link rel="canonical" href="https://goldtickerlive.com/">
  `;
  assert.equal(extractCanonical(html), 'https://goldtickerlive.com/');
  assert.equal(extractCanonical('<link rel="stylesheet" href="/x">'), null);
});

test('extractHreflang returns sorted {lang, href} pairs', () => {
  const html = `
    <link rel="alternate" hreflang="ar" href="/ar/">
    <link rel="alternate" hreflang="x-default" href="/">
    <link rel="alternate" hreflang="en" href="/">
  `;
  const result = extractHreflang(html);
  assert.deepEqual(
    result.map((r) => r.lang),
    ['ar', 'en', 'x-default']
  );
  assert.equal(result.find((r) => r.lang === 'ar').href, '/ar/');
});

test('extractJsonLdTypes flattens arrays and @graph', () => {
  const html = `
    <script type="application/ld+json">
      { "@type": "Organization", "name": "A" }
    </script>
    <script type="application/ld+json">
      { "@graph": [{ "@type": "WebSite" }, { "@type": ["Article", "NewsArticle"] }] }
    </script>
  `;
  const { types, parseFailures } = extractJsonLdTypes(html);
  assert.deepEqual(types, ['Article', 'NewsArticle', 'Organization', 'WebSite']);
  assert.equal(parseFailures, 0);
});

test('extractJsonLdTypes tallies invalid JSON instead of throwing', () => {
  const html = `
    <script type="application/ld+json">{ "@type": "Valid" }</script>
    <script type="application/ld+json">{ not json }</script>
  `;
  const { types, parseFailures } = extractJsonLdTypes(html);
  assert.deepEqual(types, ['Valid']);
  assert.equal(parseFailures, 1);
});

test('extractJsonLdTypes tolerates multi-line tags and RTL pages', () => {
  const html = `<html dir="rtl" lang="ar">
    <script
      type="application/ld+json"
      data-x="1"
    >
      {"@type":"FAQPage"}
    </script>
  `;
  const { types } = extractJsonLdTypes(html);
  assert.deepEqual(types, ['FAQPage']);
  assert.equal(extractHtmlLangDir(html).dir, 'rtl');
});

test('summarize reports counts and en↔ar hreflang pair completeness', () => {
  const records = [
    {
      canonical: 'x',
      ogImage: 'x',
      hasStructuredData: true,
      hreflang: [{ lang: 'en' }, { lang: 'ar' }],
      robots: 'index,follow',
    },
    {
      canonical: null,
      ogImage: null,
      hasStructuredData: false,
      hreflang: [{ lang: 'en' }],
      robots: 'noindex',
    },
  ];
  const s = summarize(records);
  assert.equal(s.totalHtmlFiles, 2);
  assert.equal(s.withCanonical, 1);
  assert.equal(s.withoutCanonical, 1);
  assert.equal(s.hreflangEnArPairs, 1);
  assert.equal(s.noindexCount, 1);
});
