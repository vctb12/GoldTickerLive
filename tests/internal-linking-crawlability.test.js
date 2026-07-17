'use strict';

/**
 * Internal-linking crawlability guard (Operation Midas phase 23).
 *
 * The country/market experience lives inside the real ~14-page set
 * (compare / market / heatmap / dubai-gold-price + config) — there are no
 * dedicated per-country page files. Country/market navigation therefore uses
 * `compare.html#compare=ae,sa&k=22` style links: a *real* crawlable base URL
 * (`compare.html`) with a hash fragment as a progressive-enhancement deep-link.
 *
 * These assertions lock in the crawlability contract so a future edit can't
 * silently regress it:
 *   1. No orphans — every page listed in the sitemap is reachable from at least
 *      one static in-page `<a href>` crawl path (fragment stripped).
 *   2. Country/market tiles resolve to a real 200 URL — every homepage tile's
 *      href base (before `#`/`?`) is a real HTML file on disk. No hash-only
 *      crawl link to a country view.
 *   3. Document prefetch/preload hints point at real files — guards against a
 *      hashed `assets/compare-*.html` duplicate being prefetched.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SITE_ORIGIN = 'https://goldtickerlive.com/';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Strip fragment + query, normalise a leading slash, map bare/`/` to index.html. */
function hrefToFile(href) {
  let h = String(href || '')
    .split('#')[0]
    .split('?')[0]
    .trim();
  h = h.replace(/^\.\//, '').replace(/^\//, '');
  if (h === '' || h === '.') h = 'index.html';
  return h;
}

/** Map a sitemap <loc> URL to the repo-relative HTML file it should serve. */
function locToFile(loc) {
  const p = loc.replace(SITE_ORIGIN, '');
  if (p === '' || p === '/') return 'index.html';
  if (p.endsWith('/')) return `${p}index.html`;
  return p;
}

function rootHtmlFiles() {
  return fs
    .readdirSync(ROOT, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith('.html'))
    .map((e) => e.name);
}

/** All static page-navigation link targets (files) found across root HTML. */
function staticLinkTargets() {
  const targets = new Set();
  for (const file of rootHtmlFiles()) {
    const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
    for (const m of html.matchAll(/<a\s[^>]*\bhref="([^"]+)"/g)) {
      const raw = m[1].trim();
      if (
        raw.startsWith('http') ||
        raw.startsWith('//') ||
        raw.startsWith('mailto:') ||
        raw.startsWith('tel:') ||
        raw.startsWith('javascript:') ||
        raw.includes('${') ||
        raw.startsWith('#')
      ) {
        continue;
      }
      targets.add(hrefToFile(raw));
    }
  }
  return targets;
}

function sitemapLocs() {
  const xml = fs.readFileSync(path.join(ROOT, 'public', 'sitemap.xml'), 'utf8');
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
}

// ── 1. No orphans ─────────────────────────────────────────────────────────────

test('every sitemap page is reachable from at least one static <a href> (no orphans)', () => {
  const reachable = staticLinkTargets();
  const orphans = [];
  for (const loc of sitemapLocs()) {
    const file = locToFile(loc);
    // Sanity: the sitemap URL must map to a real file on disk.
    assert.ok(
      fs.existsSync(path.join(ROOT, file)),
      `sitemap lists ${loc} but ${file} does not exist on disk`
    );
    if (!reachable.has(file)) orphans.push(`${loc} (${file})`);
  }
  assert.deepEqual(
    orphans,
    [],
    `sitemap pages with no crawlable in-page <a href> link:\n  ${orphans.join('\n  ')}`
  );
});

// ── 2. Country/market tiles resolve to a real crawlable URL ───────────────────

test('homepage country/market tiles link to a real page base, never a hash-only URL', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const tileClasses = ['country-tile', 'market-card', 'market-strip-tile'];
  const tileHref = new RegExp(
    `<a\\s[^>]*\\bhref="([^"]+)"[^>]*\\bclass="[^"]*\\b(?:${tileClasses.join('|')})\\b`,
    'g'
  );
  const tiles = [...html.matchAll(tileHref)].map((m) => m[1]);

  assert.ok(tiles.length > 0, 'expected to find country/market tiles on the homepage');

  const badTiles = [];
  for (const href of tiles) {
    // A crawl path must not be a bare fragment (#...) — it would collapse to the
    // current page and expose no real URL to a non-JS crawler.
    if (href.startsWith('#')) {
      badTiles.push(`${href} (hash-only, no real base URL)`);
      continue;
    }
    const file = hrefToFile(href);
    if (!fs.existsSync(path.join(ROOT, file))) {
      badTiles.push(`${href} -> ${file} (base file missing)`);
    }
  }

  assert.deepEqual(
    badTiles,
    [],
    `tiles whose crawl target is not a real 200 URL:\n  ${badTiles.join('\n  ')}`
  );
});

// ── 3. Document prefetch/preload hints point at real files ────────────────────

test('index.html document prefetch/preload hints point at real files (no hashed-asset duplicate)', () => {
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const docHints = [
    ...html.matchAll(
      /<link\s[^>]*rel="(?:prefetch|preload|prerender)"[^>]*href="([^"]+)"[^>]*as="document"[^>]*>/g
    ),
    ...html.matchAll(
      /<link\s[^>]*rel="(?:prefetch|preload|prerender)"[^>]*as="document"[^>]*href="([^"]+)"[^>]*>/g
    ),
  ].map((m) => m[1]);

  const bad = [];
  for (const href of docHints) {
    if (href.startsWith('http') || href.startsWith('//')) continue;
    const file = hrefToFile(href);
    if (!fs.existsSync(path.join(ROOT, file))) bad.push(`${href} -> ${file}`);
  }

  assert.deepEqual(
    bad,
    [],
    `document prefetch/preload hints pointing at missing files:\n  ${bad.join('\n  ')}`
  );
});
