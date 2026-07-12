/**
 * Tests for the "Vs. cost" card null-gain cause classification
 * (`gainUnavailableReason` in src/pages/portfolio/portfolio-core.js) and the
 * EN/AR parity of the three honest strings it maps to.
 *
 * Previously one string ("Add costs to see this") covered three unrelated
 * causes: live price still pending, cost currency differing from the display
 * currency, and a genuinely missing cost. These tests pin the classification
 * so the UI can never again claim costs are missing when they are not.
 *
 * Follows the tests/formatter-locale.test.js dynamic-import pattern so the
 * shipped ES modules are exercised directly.
 */

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function loadCore() {
  const url = new URL(
    'file://' + path.resolve(__dirname, '..', 'src', 'pages', 'portfolio', 'portfolio-core.js')
  );
  return import(url.href);
}

async function loadTranslations() {
  const url = new URL(
    'file://' + path.resolve(__dirname, '..', 'src', 'config', 'translations.js')
  );
  return import(url.href);
}

function holding(overrides = {}) {
  return {
    id: 'h1',
    label: 'Test bangle',
    weightGrams: 10,
    karat: '22',
    purchaseDate: '2026-01-15',
    costTotal: 1000,
    costCurrency: 'AED',
    createdAt: '2026-01-15T00:00:00.000Z',
    ...overrides,
  };
}

const SPOT = 2400; // USD per troy oz — any positive value; no assertions on math.
const RATES = {}; // AED and USD resolve without live FX (peg / identity).

describe('gainUnavailableReason()', () => {
  test('price pending: cost entered + matching currency but no spot price yet', async () => {
    const { summarizePortfolio, gainUnavailableReason } = await loadCore();
    const summary = summarizePortfolio([holding()], 0, RATES, 'AED');
    assert.equal(summary.gain, null);
    assert.equal(gainUnavailableReason(summary, 'AED'), 'price-pending');
  });

  test('price pending: spot loaded but display-currency FX rate missing', async () => {
    const { summarizePortfolio, gainUnavailableReason } = await loadCore();
    // SAR costs, SAR display, but no SAR rate loaded → currentDisplay is null.
    const summary = summarizePortfolio([holding({ costCurrency: 'SAR' })], SPOT, {}, 'SAR');
    assert.equal(summary.gain, null);
    assert.equal(gainUnavailableReason(summary, 'SAR'), 'price-pending');
  });

  test('cost currency differs from display currency', async () => {
    const { summarizePortfolio, gainUnavailableReason } = await loadCore();
    const summary = summarizePortfolio([holding({ costCurrency: 'USD' })], SPOT, RATES, 'AED');
    assert.equal(summary.gain, null);
    assert.equal(summary.mixedCostCurrencies, false);
    assert.equal(gainUnavailableReason(summary, 'AED'), 'cost-currency-differs');
  });

  test('currency mismatch wins over pending price (durable cause first)', async () => {
    const { summarizePortfolio, gainUnavailableReason } = await loadCore();
    const summary = summarizePortfolio([holding({ costCurrency: 'USD' })], 0, RATES, 'AED');
    assert.equal(gainUnavailableReason(summary, 'AED'), 'cost-currency-differs');
  });

  test('genuinely missing cost', async () => {
    const { summarizePortfolio, gainUnavailableReason } = await loadCore();
    const summary = summarizePortfolio([holding({ costTotal: 0 })], SPOT, RATES, 'AED');
    assert.equal(summary.gain, null);
    assert.equal(gainUnavailableReason(summary, 'AED'), 'no-cost');
  });

  test('missing cost reported even while price is pending (user action first)', async () => {
    const { summarizePortfolio, gainUnavailableReason } = await loadCore();
    const summary = summarizePortfolio([holding({ costTotal: 0 })], 0, RATES, 'AED');
    assert.equal(gainUnavailableReason(summary, 'AED'), 'no-cost');
  });

  test('mixed cost currencies keep their dedicated cause', async () => {
    const { summarizePortfolio, gainUnavailableReason } = await loadCore();
    const summary = summarizePortfolio(
      [holding(), holding({ id: 'h2', costCurrency: 'USD' })],
      SPOT,
      RATES,
      'AED'
    );
    assert.equal(summary.gain, null);
    assert.equal(summary.mixedCostCurrencies, true);
    assert.equal(gainUnavailableReason(summary, 'AED'), 'mixed-cost-currencies');
  });

  test('returns null when a gain figure exists', async () => {
    const { summarizePortfolio, gainUnavailableReason } = await loadCore();
    const summary = summarizePortfolio([holding()], SPOT, RATES, 'AED');
    assert.ok(summary.gain, 'gain must be computed for the happy path');
    assert.equal(gainUnavailableReason(summary, 'AED'), null);
  });

  test('returns null for an empty portfolio (nothing to explain)', async () => {
    const { summarizePortfolio, gainUnavailableReason } = await loadCore();
    const summary = summarizePortfolio([], SPOT, RATES, 'AED');
    assert.equal(gainUnavailableReason(summary, 'AED'), null);
  });
});

describe('vs-cost card translations', () => {
  const KEYS = [
    'portfolio.gainAwaitingPrice',
    'portfolio.gainCostCurrencyDiffers',
    'portfolio.gainAddCosts',
  ];

  test('EN and AR both define all three cause strings', async () => {
    const { TRANSLATIONS } = await loadTranslations();
    for (const lang of ['en', 'ar']) {
      for (const key of KEYS) {
        const value = TRANSLATIONS[lang][key];
        assert.equal(typeof value, 'string', `${lang} ${key} must exist`);
        assert.ok(value.trim().length > 0, `${lang} ${key} must not be empty`);
      }
    }
  });

  test('the three causes read as three distinct messages in each language', async () => {
    const { TRANSLATIONS } = await loadTranslations();
    for (const lang of ['en', 'ar']) {
      const values = KEYS.map((key) => TRANSLATIONS[lang][key]);
      assert.equal(new Set(values).size, KEYS.length, `${lang} strings must be distinct`);
    }
  });

  test('Arabic strings are actually Arabic', async () => {
    const { TRANSLATIONS } = await loadTranslations();
    for (const key of KEYS) {
      assert.match(TRANSLATIONS.ar[key], /[؀-ۿ]/, `${key} must contain Arabic script`);
    }
  });
});
