/**
 * D6 regression guard — semantic landmarks + heading levels in the shared chrome.
 *
 * The site nav and footer are injected on every page by `src/components/nav.js`
 * and `src/components/footer.js`. Two accessibility defects lived here:
 *
 *   1. The footer used <h4>/<h5> column headings. Page content ends at <h2>, so
 *      the footer produced an h2→h4 "skipped heading level" on every page.
 *   2. The masthead nav had no banner landmark (it was a bare <nav> child of
 *      <body>), so pages exposed only a `main` landmark — no `banner`.
 *
 * Fixes verified in-browser with the S1 accessible-name harness (Playwright):
 * h1 count = 1, banner landmark present, zero skipped heading levels on
 * index.html and tracker.html. These static assertions lock the source so the
 * shared components can't silently reintroduce either defect in CI (which has no
 * browser). The nav <header> uses `display: contents` so the banner landmark is
 * added without breaking the inner .site-nav `position: sticky`.
 */

'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(REPO_ROOT, rel), 'utf8');

test('footer component emits no skip-inducing h4/h5 headings', () => {
  const footer = read('src/components/footer.js');
  const h4 = footer.match(/<h4\b/g) || [];
  const h5 = footer.match(/<h5\b/g) || [];
  assert.deepEqual(
    { h4: h4.length, h5: h5.length },
    { h4: 0, h5: 0 },
    'footer.js must not emit <h4>/<h5> — page content ends at <h2>, so deeper ' +
      'footer headings create an h2→h4 skipped-level. Use <h2> columns + <h3> sections.'
  );
});

test('footer column/section headings use the correct levels (h2 / h3)', () => {
  const footer = read('src/components/footer.js');
  assert.match(
    footer,
    /<h2 class="footer-col-heading"/,
    'footer column heading must be an <h2 class="footer-col-heading">'
  );
  assert.match(
    footer,
    /<h3 class="footer-section-heading"/,
    'footer section heading must be an <h3 class="footer-section-heading">'
  );
});

test('nav wraps the masthead in a <header role="banner"> landmark', () => {
  const nav = read('src/components/nav.js');
  assert.match(
    nav,
    /<header class="site-header" role="banner">/,
    'nav.js must wrap the masthead nav in <header class="site-header" role="banner">'
  );
  // The <nav class="site-nav"> must still exist inside the rendered chrome.
  assert.match(nav, /<nav class="site-nav/, 'nav.js must still render <nav class="site-nav">');
});

test('.site-header is display:contents so the banner does not break sticky nav', () => {
  const css = read('styles/partials/components.css');
  assert.match(
    css,
    /\.site-header\s*\{[^}]*display:\s*contents/,
    '.site-header must be display:contents so the banner landmark does not clamp ' +
      'the inner .site-nav position:sticky to the header box height'
  );
});
