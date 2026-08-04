'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const { generateBreadcrumbs } = require('../scripts/node/inject-schema.js');

test('breadcrumb schema preserves the UAE acronym for the UAE route segment', () => {
  const breadcrumbs = generateBreadcrumbs('/uae', 'https://goldtickerlive.com/compare.html');

  assert.deepEqual(breadcrumbs, [
    { name: 'Home', url: 'https://goldtickerlive.com' },
    { name: 'UAE', url: 'https://goldtickerlive.com/compare.html' },
  ]);
});

test('breadcrumb schema keeps existing hyphen humanization behavior', () => {
  const breadcrumbs = generateBreadcrumbs('/gold-price', 'https://goldtickerlive.com/tracker.html');

  assert.equal(breadcrumbs.at(-1).name, 'Gold Price');
  assert.equal(breadcrumbs.at(-1).url, 'https://goldtickerlive.com/tracker.html');
});
