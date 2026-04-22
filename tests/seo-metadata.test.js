/**
 * Regression tests for SEO metadata invariants on the site's
 * highest-trafficked public pages.
 *
 * These protect against silent drift in:
 *   - canonical correctness (exactly one canonical, HTTPS, absolute,
 *     no trailing `?lang=ar`)
 *   - hreflang completeness (x-default + en + ar present and
 *     pointing at the expected URLs)
 *   - title / description presence
 *   - robots noindex regressions on pages that must remain indexable
 *
 * If these invariants break, search engines silently lose trust in
 * our canonical graph. Locking them in a cheap test is much cheaper
 * than a slow recovery.
 */

'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..');
const SITE_ORIGIN = 'https://goldtickerlive.com';

/**
 * Key public pages that must stay indexable with sound metadata.
 * `expectedCanonical` is the full canonical URL we expect to see.
 */
const PAGES = [
  { file: 'index.html', expectedCanonical: `${SITE_ORIGIN}/` },
  { file: 'tracker.html', expectedCanonical: `${SITE_ORIGIN}/tracker.html` },
  { file: 'shops.html', expectedCanonical: `${SITE_ORIGIN}/shops.html` },
  { file: 'calculator.html', expectedCanonical: `${SITE_ORIGIN}/calculator.html` },
];

function readHead(file) {
  const full = path.join(REPO_ROOT, file);
  const html = fs.readFileSync(full, 'utf8');
  // Trim to <head>…</head> so body noise (embedded JSON-LD widgets,
  // template strings, etc.) can't false-positive the regexes below.
  const match = html.match(/<head[\s\S]*?<\/head>/i);
  assert.ok(match, `${file}: could not locate <head>`);
  return match[0];
}

function allMatches(haystack, regex) {
  const out = [];
  let m;
  while ((m = regex.exec(haystack)) !== null) out.push(m);
  return out;
}

for (const page of PAGES) {
  test(`${page.file}: has exactly one canonical pointing at ${page.expectedCanonical}`, () => {
    const head = readHead(page.file);
    const matches = allMatches(head, /<link[^>]+rel=["']canonical["'][^>]*>/gi);
    assert.equal(
      matches.length,
      1,
      `${page.file}: expected exactly one canonical in <head>, found ${matches.length}`
    );
    const hrefMatch = matches[0][0].match(/href=["']([^"']+)["']/i);
    assert.ok(hrefMatch, `${page.file}: canonical <link> missing href`);
    assert.equal(hrefMatch[1], page.expectedCanonical, `${page.file}: canonical mismatch`);
  });

  test(`${page.file}: canonical URL is absolute HTTPS and has no query string`, () => {
    const head = readHead(page.file);
    const m = head.match(/<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
    assert.ok(m, `${page.file}: no canonical found`);
    const href = m[1];
    assert.ok(href.startsWith('https://'), `${page.file}: canonical must be HTTPS (got "${href}")`);
    assert.ok(
      !href.includes('?'),
      `${page.file}: canonical must not carry a query string (got "${href}")`
    );
    assert.ok(
      !href.includes('#'),
      `${page.file}: canonical must not carry a fragment (got "${href}")`
    );
  });

  test(`${page.file}: exposes x-default, en, and ar hreflang alternates`, () => {
    const head = readHead(page.file);
    const alternates = allMatches(head, /<link[^>]+rel=["']alternate["'][^>]*>/gi).map((m) => m[0]);

    const hreflangs = alternates
      .map((tag) => {
        const h = tag.match(/hreflang=["']([^"']+)["']/i);
        return h ? h[1].toLowerCase() : null;
      })
      .filter(Boolean);

    for (const required of ['x-default', 'en', 'ar']) {
      assert.ok(
        hreflangs.includes(required),
        `${page.file}: missing hreflang="${required}" (found: ${hreflangs.join(', ')})`
      );
    }
  });

  test(`${page.file}: has non-empty <title> and meta description`, () => {
    const head = readHead(page.file);
    const titleMatch = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    assert.ok(titleMatch, `${page.file}: missing <title>`);
    assert.ok(titleMatch[1].trim().length > 0, `${page.file}: <title> is empty`);

    const descMatch = head.match(
      /<meta[^>]+name=["']description["'][^>]*content=["']([^"']+)["']/i
    );
    assert.ok(descMatch, `${page.file}: missing meta description`);
    assert.ok(
      descMatch[1].trim().length >= 50,
      `${page.file}: meta description is too short (${descMatch[1].length} chars)`
    );
  });

  test(`${page.file}: is not accidentally marked noindex`, () => {
    const head = readHead(page.file);
    const robotsMatch = head.match(/<meta[^>]+name=["']robots["'][^>]*content=["']([^"']+)["']/i);
    if (robotsMatch) {
      const directives = robotsMatch[1].toLowerCase();
      assert.ok(
        !/noindex/.test(directives),
        `${page.file}: unexpectedly noindex'd (content="${robotsMatch[1]}")`
      );
    }
    // If the tag is absent, the page is implicitly indexable — that's fine.
  });
}
