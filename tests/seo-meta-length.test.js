'use strict';

/**
 * seo-meta-length.test.js
 *
 * SERP-truncation guard for the primary indexable pages.
 *
 * `scripts/node/check-seo-meta.js` (in `npm run validate`) already proves that
 * every public page HAS a canonical, a non-empty <title>, and a description of
 * at least 10 chars. What it does NOT check is the UPPER bound: a title over
 * ~60 displayed chars or a description over ~160 gets truncated with an ellipsis
 * in Google/Bing results, and a too-thin description reads as low quality. Those
 * regressions shipped silently on several pages (compare/heatmap/portfolio each
 * had 168–185-char descriptions and 63–74-char titles) until this guard.
 *
 * Lengths are measured on the DISPLAYED string — HTML entities are decoded and
 * runs of whitespace collapsed — because that is what a search engine renders
 * and counts, not the raw source with `&amp;`/newlines.
 *
 * Scope is the curated set of primary marketing/reference surfaces. Generated
 * index stubs, legal boilerplate beyond the two included here, and noindex
 * scaffolding are intentionally out of scope — this guards the pages that
 * actually compete in search.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

// Displayed-length bounds. Titles: ~60 chars is the common pixel-safe target
// before Google truncates. Descriptions: ~160 chars before the snippet clips;
// a floor keeps them from reading as thin.
const TITLE_MIN = 15;
const TITLE_MAX = 60;
const DESC_MIN = 70;
const DESC_MAX = 160;

// Primary indexable surfaces that compete in search. Keep this list curated —
// it is the contract, not an auto-crawl.
const PAGES = [
  'index.html',
  'tracker.html',
  'calculator.html',
  'compare.html',
  'heatmap.html',
  'portfolio.html',
  'shops.html',
  'learn.html',
  'methodology.html',
  'market.html',
  'glossary.html',
  'dubai-gold-price.html',
  'privacy.html',
  'terms.html',
];

// Minimal HTML-entity decode — enough for the entities our head markup uses
// (&amp;, quotes, angle brackets, non-breaking space, em/en dashes).
//
// Single-pass by design: one regex matches every supported entity and each
// match is replaced exactly once via the lookup, so substitution output is
// never re-scanned. A sequential `.replace()` chain that unescaped `&amp;`
// first would double-unescape inputs like `&amp;lt;` (CodeQL js/double-escaping);
// the single pass makes that impossible.
const ENTITY_MAP = {
  '&amp;': '&',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&lt;': '<',
  '&gt;': '>',
  '&nbsp;': ' ',
  '&mdash;': '—',
  '&#8212;': '—',
  '&ndash;': '–',
  '&#8211;': '–',
};

function decodeEntities(s) {
  return s.replace(
    /&(?:amp|quot|#39|apos|lt|gt|nbsp|mdash|#8212|ndash|#8211);/g,
    (m) => ENTITY_MAP[m] || m
  );
}

// Collapse whitespace + decode entities → the string a SERP actually shows.
function displayed(s) {
  return decodeEntities(s.replace(/\s+/g, ' ').trim());
}

function readHead(rel) {
  const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const descTag = html.match(/<meta[^>]*name=["']description["'][^>]*>/i);
  let desc = '';
  if (descTag) {
    const c = descTag[0].match(/content=["']([\s\S]*?)["']/i);
    desc = c ? c[1] : '';
  }
  return {
    title: titleMatch ? displayed(titleMatch[1]) : '',
    desc: displayed(desc),
  };
}

for (const rel of PAGES) {
  test(`SEO meta length: ${rel} title within ${TITLE_MIN}–${TITLE_MAX} displayed chars`, () => {
    const { title } = readHead(rel);
    assert.ok(title.length > 0, `${rel}: no <title> found`);
    assert.ok(
      title.length >= TITLE_MIN,
      `${rel}: title too short (${title.length} < ${TITLE_MIN}): "${title}"`
    );
    assert.ok(
      title.length <= TITLE_MAX,
      `${rel}: title too long (${title.length} > ${TITLE_MAX}, truncates in SERPs): "${title}"`
    );
  });

  test(`SEO meta length: ${rel} description within ${DESC_MIN}–${DESC_MAX} displayed chars`, () => {
    const { desc } = readHead(rel);
    assert.ok(desc.length > 0, `${rel}: no <meta name="description"> found`);
    assert.ok(
      desc.length >= DESC_MIN,
      `${rel}: description too thin (${desc.length} < ${DESC_MIN}): "${desc}"`
    );
    assert.ok(
      desc.length <= DESC_MAX,
      `${rel}: description too long (${desc.length} > ${DESC_MAX}, truncates in SERPs): "${desc}"`
    );
  });
}
