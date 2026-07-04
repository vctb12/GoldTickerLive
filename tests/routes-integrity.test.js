'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const redirectsPath = path.resolve(__dirname, '..', '_redirects');

function readRedirects() {
  return fs.readFileSync(redirectsPath, 'utf8');
}

test('_redirects keeps consolidated landing routes and index.html variants', () => {
  const redirects = readRedirects();
  const required = [
    ['/content/compare-countries/', '/tracker.html#mode=compare'],
    ['/content/compare-countries/index.html', '/tracker.html#mode=compare'],
    ['/content/todays-best-rates/', '/tracker.html#mode=compare'],
    ['/content/todays-best-rates/index.html', '/tracker.html#mode=compare'],
    ['/content/premium-watch/', '/learn.html#insights'],
    ['/content/premium-watch/index.html', '/learn.html#insights'],
    ['/content/news/', '/learn.html#insights'],
    ['/content/news/index.html', '/learn.html#insights'],
    ['/content/changelog/', '/learn.html#insights'],
    ['/content/changelog/index.html', '/learn.html#insights'],
    ['/content/22k-gold-price-guide/', '/learn.html#karats'],
    ['/content/22k-gold-price-guide/index.html', '/learn.html#karats'],
    ['/content/24k-gold-price-guide/', '/learn.html#karats'],
    ['/content/24k-gold-price-guide/index.html', '/learn.html#karats'],
  ];

  required.forEach(([from, to]) => {
    assert.match(
      redirects,
      new RegExp(
        `^${from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+${to.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+301$`,
        'm'
      ),
      `Missing redirect mapping: ${from} -> ${to}`
    );
  });
});

test('_redirects sweeps every removed page tree to a surviving surface', () => {
  const redirects = readRedirects();
  // 2026-07-04 radical page reduction — deep URLs under each removed tree, and
  // the removed root pages, must retarget to a kept surface (not 404).
  const required = [
    ['/countries/*', '/compare.html'],
    ['/content/*', '/learn.html'],
    ['/ar/*', '/?lang=ar'],
    ['/chart/*', '/tracker.html'],
    ['/gold-price/*', '/tracker.html'],
    ['/methodology/*', '/methodology.html'],
    ['/account.html', '/'],
    ['/dashboard.html', '/'],
    ['/pricing.html', '/'],
    ['/developer.html', '/'],
    ['/design-lab.html', '/'],
    // Country shorthand aliases now resolve to the compare tool.
    ['/uae', '/compare.html'],
    ['/dubai', '/compare.html'],
  ];

  required.forEach(([from, to]) => {
    assert.match(
      redirects,
      new RegExp(
        `^${from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+${to.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+301$`,
        'm'
      ),
      `Missing redirect mapping: ${from} -> ${to}`
    );
  });

  // Tree sweeps must precede the SPA-free 404 catch-all, and no soft-404
  // catch-all to index.html may exist.
  assert.match(redirects, /^\/\*\s+\/404\.html\s+404$/m, 'missing /* -> /404.html 404 fallback');
  assert.doesNotMatch(redirects, /^\/\*\s+\/index\.html\s+200$/m, 'must not add a SPA catch-all');
  const countriesSweepIdx = redirects.indexOf('/countries/*');
  const catchAllIdx = redirects.search(/^\/\*\s+\/404\.html/m);
  assert.ok(
    countriesSweepIdx !== -1 && countriesSweepIdx < catchAllIdx,
    'tree sweeps must appear before the /* 404 fallback'
  );
});
