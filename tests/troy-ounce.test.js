'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');

const BROWSER_CONFIG = new URL('../src/config/index.js', `file://${__filename}`).href;
const BROWSER_PRICING = new URL('../src/lib/price-calculator.js', `file://${__filename}`).href;
const BROWSER_FORMATTER = new URL('../src/lib/formatter.js', `file://${__filename}`).href;
const SERVER_CONSTANT = require('../server/lib/troy-ounce.js');
const EN_TRANSLATIONS = new URL('../src/config/translations.en.js', `file://${__filename}`);
const AR_TRANSLATIONS = new URL('../src/config/translations.ar.js', `file://${__filename}`);

const TROY_OZ_GRAMS = 31.1034768;
const AED_PEG = 3.6725;
const SPOT_USD_PER_OZ = 3100;
const KARATS = { 24: 1, 22: 22 / 24, 21: 21 / 24, 18: 18 / 24 };
const near = (actual, expected, epsilon = 1e-12) =>
  assert.ok(Math.abs(actual - expected) <= epsilon, `${actual} ≠ ${expected}`);

test('troy-ounce constant is authoritative and shared by browser and server', async () => {
  const { CONSTANTS } = await import(BROWSER_CONFIG);
  assert.equal(CONSTANTS.TROY_OZ_GRAMS, TROY_OZ_GRAMS);
  assert.equal(SERVER_CONSTANT.TROY_OZ_GRAMS, TROY_OZ_GRAMS);
  assert.equal(CONSTANTS.TROY_OZ_GRAMS, SERVER_CONSTANT.TROY_OZ_GRAMS);
});

test('browser ounce conversion preserves precision for 1, 0.5, and 10 troy ounces', async () => {
  const { toGrams, gramsToUnit } = await import(
    new URL('../src/lib/weight-units.js', `file://${__filename}`).href
  );
  for (const ounces of [1, 0.5, 10]) {
    const grams = toGrams(ounces, 'oz');
    assert.equal(grams, ounces * TROY_OZ_GRAMS);
    near(gramsToUnit(grams, 'oz'), ounces);
  }
});

test('browser and server pricing cover USD/g, AED/g, USD/oz, and 24K/22K/21K/18K', async () => {
  const { usdPerGram, usdPerOz } = await import(BROWSER_PRICING);
  const { CONSTANTS } = await import(BROWSER_CONFIG);

  for (const purity of Object.values(KARATS)) {
    const usdPerGramExpected = (SPOT_USD_PER_OZ / TROY_OZ_GRAMS) * purity;
    const usdPerOzExpected = SPOT_USD_PER_OZ * purity;
    near(usdPerGram(SPOT_USD_PER_OZ, purity), usdPerGramExpected);
    near(usdPerOz(SPOT_USD_PER_OZ, purity), usdPerOzExpected);
    near(usdPerGramExpected * CONSTANTS.AED_PEG, usdPerGramExpected * AED_PEG);
    near(usdPerOzExpected / SERVER_CONSTANT.TROY_OZ_GRAMS, usdPerGramExpected);
  }
});

test('calculation precision remains separate from display rounding', async () => {
  const { usdPerGram } = await import(BROWSER_PRICING);
  const { formatPrice } = await import(BROWSER_FORMATTER);
  const raw = usdPerGram(SPOT_USD_PER_OZ, KARATS[22]);
  assert.notEqual(raw, Number(raw.toFixed(2)));
  assert.match(formatPrice(raw, 'USD', 2), /\d+\.\d{2}/);
  assert.match(formatPrice(raw, 'USD', 6), new RegExp(raw.toFixed(6)));
});

test('EN and AR methodology copy documents the same conversion precision and display rule', async () => {
  const [{ EN }, { AR }] = await Promise.all([
    import(EN_TRANSLATIONS.href),
    import(AR_TRANSLATIONS.href),
  ]);
  const expectedExamples = ['31.1034768', '15.5517384', '311.034768'];
  const precisionRule = {
    en: /Keep full calculation precision; round only at the display boundary/,
    ar: /نحافظ على دقة الحساب كاملة، ونقرّب فقط عند العرض/,
  };

  for (const [locale, translations] of [
    ['en', EN],
    ['ar', AR],
  ]) {
    const copy = translations['methodology.stepGram'];
    assert.ok(copy.includes('31.1034768'), `${locale} copy must name the authoritative constant`);
    for (const example of expectedExamples) {
      assert.ok(copy.includes(example), `${locale} copy must document ${example}`);
    }
    assert.match(copy, precisionRule[locale]);
    assert.ok(translations['methodology.formula'].includes('31.1034768'));
  }
});

test('Python provider constant matches browser and server precision', () => {
  const script = [
    'import json',
    'from gold_providers.base import TROY_OUNCE_GRAMS',
    'from gold_providers.normalize import aed_per_gram_24k, usd_per_gram_24k',
    'spot = 3100.0',
    'print(json.dumps({"constant": TROY_OUNCE_GRAMS, "usdPerGram": usd_per_gram_24k(spot), "aedPerGram": aed_per_gram_24k(spot)}))',
  ].join('; ');
  const output = execFileSync('python3', ['-c', script], {
    cwd: new URL('..', `file://${__filename}`).pathname,
    encoding: 'utf8',
    env: { ...process.env, PYTHONPATH: 'scripts/python' },
  }).trim();
  const result = JSON.parse(output);
  assert.equal(result.constant, TROY_OZ_GRAMS);
  near(result.usdPerGram, SPOT_USD_PER_OZ / TROY_OZ_GRAMS);
  near(result.aedPerGram, (SPOT_USD_PER_OZ / TROY_OZ_GRAMS) * AED_PEG);
});

test('Python history recorder uses the same full-precision constant for all required karats', () => {
  const script = [
    'import importlib.util, json',
    "spec = importlib.util.spec_from_file_location('record_price_history', 'scripts/python/record_price_history.py')",
    'module = importlib.util.module_from_spec(spec)',
    'spec.loader.exec_module(module)',
    'rows = module.compute_karat_prices(3100.0)',
    "print(json.dumps({str(row['karat']): row['price_usd'] for row in rows}))",
  ].join('; ');
  const output = execFileSync('python3', ['-c', script], {
    cwd: new URL('..', `file://${__filename}`).pathname,
    encoding: 'utf8',
    env: { ...process.env, PYTHONPATH: 'scripts/python' },
  }).trim();
  const prices = JSON.parse(output);

  for (const [karat, purity] of Object.entries(KARATS)) {
    near(prices[karat], Number(((SPOT_USD_PER_OZ / TROY_OZ_GRAMS) * purity).toFixed(4)), 1e-12);
  }
});
