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
