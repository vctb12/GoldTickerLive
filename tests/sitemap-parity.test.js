'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const parity = require(path.resolve(__dirname, '../scripts/node/check-sitemap-parity.js'));

test('toCanonicalUrl maps index and directory paths', () => {
  assert.equal(parity.toCanonicalUrl('index.html'), 'https://goldtickerlive.com/');
  assert.equal(parity.toCanonicalUrl('tracker.html'), 'https://goldtickerlive.com/tracker.html');
  assert.equal(
    parity.toCanonicalUrl('content/guides/index.html'),
    'https://goldtickerlive.com/content/guides/'
  );
});

test('city hub stubs are sitemap exempt', () => {
  assert.ok(
    parity.isExempt('countries/uae/dubai/index.html'),
    'city navigation stubs should not require sitemap entries'
  );
});
