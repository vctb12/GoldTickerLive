'use strict';

/**
 * search/query-match.test.js — bilingual search normalisation + scoring.
 *
 * PR #654 shipped Arabic orthographic folding and city index entries with no
 * dedicated unit coverage. Silent misses ("دبى" vs "دبي", tatweel, hamza
 * carriers) break discovery for GCC users; scoring/boost regressions can bury
 * country/city hits under shops.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');

const MOD = new URL('../src/search/query-match.js', `file://${__filename}`).href;

const dubaiCity = {
  type: 'city',
  label: 'Dubai Gold Price',
  labelAr: 'سعر الذهب في دبي',
  keywords: ['Dubai', 'دبي', 'UAE', 'الإمارات'],
};

const uaeCountry = {
  type: 'country',
  label: 'United Arab Emirates',
  labelAr: 'الإمارات العربية المتحدة',
  keywords: ['UAE', 'الإمارات', 'Dirham'],
};

test('normalizeSearchQuery: folds Arabic orthographic variants', async () => {
  const { normalizeSearchQuery } = await import(MOD);

  // alef maqsura → yeh ("دبى" typed with ى must match "دبي")
  assert.equal(normalizeSearchQuery('دبى'), normalizeSearchQuery('دبي'));

  // alef forms collapse
  assert.equal(normalizeSearchQuery('أحمد'), normalizeSearchQuery('احمد'));
  assert.equal(normalizeSearchQuery('آمن'), normalizeSearchQuery('امن'));
  assert.equal(normalizeSearchQuery('إمارات'), normalizeSearchQuery('امارات'));

  // taa marbuta → heh
  assert.equal(normalizeSearchQuery('مكة'), normalizeSearchQuery('مكه'));

  // hamza carriers
  assert.equal(normalizeSearchQuery('مسؤول'), normalizeSearchQuery('مسوول'));
  assert.equal(normalizeSearchQuery('شئون'), normalizeSearchQuery('شيون'));

  // tatweel + harakat stripped
  assert.equal(normalizeSearchQuery('ذَهَــب'), normalizeSearchQuery('ذهب'));
});

test('normalizeSearchQuery: Latin is lowercased/trimmed; empty-ish → empty', async () => {
  const { normalizeSearchQuery } = await import(MOD);
  assert.equal(normalizeSearchQuery('  Dubai  '), 'dubai');
  assert.equal(normalizeSearchQuery(null), '');
  assert.equal(normalizeSearchQuery(undefined), '');
});

test('scoreSearchEntry: exact / starts-with / contains / keyword ladder', async () => {
  const { normalizeSearchQuery, scoreSearchEntry } = await import(MOD);

  const exact = scoreSearchEntry(normalizeSearchQuery('dubai gold price'), dubaiCity);
  assert.equal(exact, 100 + 3); // city boost

  const starts = scoreSearchEntry(normalizeSearchQuery('dubai'), dubaiCity);
  assert.equal(starts, 80 + 3);

  const contains = scoreSearchEntry(normalizeSearchQuery('gold price'), dubaiCity);
  assert.equal(contains, 50 + 3);

  const kwExact = scoreSearchEntry(normalizeSearchQuery('uae'), dubaiCity);
  assert.equal(kwExact, 35 + 3);

  const none = scoreSearchEntry(normalizeSearchQuery('zzzz'), dubaiCity);
  assert.equal(none, 0);
});

test('scoreSearchEntry: Arabic query matches folded labelAr (دبى → دبي)', async () => {
  const { normalizeSearchQuery, scoreSearchEntry } = await import(MOD);
  const q = normalizeSearchQuery('دبى');
  const score = scoreSearchEntry(q, dubaiCity);
  assert.ok(score >= 50 + 3, `expected contains-or-better for folded Arabic city, got ${score}`);
});

test('scoreSearchEntry: country type outranks city for the same match tier', async () => {
  const { normalizeSearchQuery, scoreSearchEntry } = await import(MOD);
  const q = normalizeSearchQuery('uae');
  const countryScore = scoreSearchEntry(q, uaeCountry);
  const cityScore = scoreSearchEntry(q, dubaiCity);
  assert.ok(
    countryScore > cityScore,
    `country (${countryScore}) should outrank city (${cityScore}) for keyword "uae"`
  );
});

test('scoreSearchEntry: short queries do not take the fuzzy path; typos can', async () => {
  const { normalizeSearchQuery, scoreSearchEntry, levenshtein } = await import(MOD);

  assert.equal(levenshtein('dubai', 'dubai'), 0);
  assert.equal(levenshtein('dubai', 'dubay'), 1);
  assert.ok(levenshtein('dubai', 'xxxxxx') > 2);

  // 2-char query: below fuzzy min length → 0 when not otherwise matched
  assert.equal(scoreSearchEntry(normalizeSearchQuery('zz'), dubaiCity), 0);

  // 1-edit typo against the English label ("Dubai Gold Price")
  const fuzzy = scoreSearchEntry(normalizeSearchQuery('dubay'), dubaiCity);
  assert.equal(fuzzy, 8 + 3);
});
