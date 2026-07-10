/**
 * Guard tests for the site-wide banner landmark added around the injected nav.
 *
 * The JS-injected nav (src/components/nav.js) wraps its <nav role="navigation">
 * in a <header class="site-header" role="banner"> landmark. The wrapper is made
 * `display: contents` (in components.css + critical.css) so it generates no box
 * and the sticky nav keeps <body> as its containing block.
 *
 * These assertions are source-level (the node:test runner has no DOM, so we can
 * not call injectNav()). They guard against a future nav refactor silently
 * dropping the landmark, un-nesting the nav, or removing the `display: contents`
 * rule that keeps the sticky layout intact.
 */

'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

test('nav.js wraps the nav in a single <header role="banner"> landmark', () => {
  const src = read('src/components/nav.js');

  const headerOpen = src.indexOf('<header class="site-header" role="banner">');
  assert.ok(
    headerOpen !== -1,
    'expected <header class="site-header" role="banner"> in the nav template'
  );

  const navOpen = src.indexOf('<nav class="site-nav', headerOpen);
  const headerClose = src.indexOf('</header>', headerOpen);
  assert.ok(
    navOpen !== -1 && headerClose !== -1,
    'expected a <nav class="site-nav"> and a </header>'
  );
  assert.ok(
    headerOpen < navOpen && navOpen < headerClose,
    'the <nav class="site-nav"> must be nested inside the <header role="banner"> landmark'
  );

  // Exactly one banner landmark element per injected nav (no duplicate-banner
  // risk). Match the full element so an inline code comment mentioning the role
  // does not inflate the count.
  const bannerCount = (src.match(/<header class="site-header" role="banner">/g) || []).length;
  assert.equal(
    bannerCount,
    1,
    'expected exactly one <header role="banner"> element in the nav template'
  );
});

test('.site-header is display:contents in both components.css and critical.css', () => {
  for (const rel of ['styles/partials/components.css', 'styles/critical.css']) {
    const css = read(rel);
    assert.match(
      css,
      /\.site-header\s*\{[^}]*display:\s*contents/,
      `${rel} must keep .site-header { display: contents } so the banner wrapper generates no box`
    );
  }
});

test('nav skip-link text is sourced from NAV_DATA (no hard-coded inline string)', async () => {
  const navSrc = read('src/components/nav.js');
  assert.doesNotMatch(
    navSrc,
    /تخطي إلى المحتوى/,
    'the AR skip-link must not be a hard-coded inline literal in nav.js'
  );

  const url = new URL('file://' + path.join(ROOT, 'src', 'components', 'nav-data.js'));
  const { NAV_DATA } = await import(url.href);
  for (const lang of ['en', 'ar']) {
    assert.equal(
      typeof NAV_DATA[lang].skipLink,
      'string',
      `NAV_DATA.${lang}.skipLink must be a string`
    );
    assert.ok(
      NAV_DATA[lang].skipLink.trim().length > 0,
      `NAV_DATA.${lang}.skipLink must be non-empty`
    );
  }
  assert.equal(NAV_DATA.en.skipLink, 'Skip to main content');
});
