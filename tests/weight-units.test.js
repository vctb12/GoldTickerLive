'use strict';

/**
 * Weight-unit conversion + localized numeric input (Phase 55). Imports the REAL
 * `src/lib/weight-units.js` (not an inline copy) and covers the calculator's edge cases: unit
 * conversions, the unknown-unit fallback, and `parseLocalizedNumber` — which fixes Arabic-UI visitors
 * getting no result when they type native Arabic-Indic / Persian numerals or a thousands separator.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const MOD = new URL('../src/lib/weight-units.js', `file://${__filename}`).href;
const CFG = new URL('../src/config/index.js', `file://${__filename}`).href;

test('units: UNIT_TO_GRAMS uses the shared troy-oz constant and known factors', async () => {
  const { UNIT_TO_GRAMS } = await import(MOD);
  const { CONSTANTS } = await import(CFG);
  assert.equal(UNIT_TO_GRAMS.gram, 1);
  assert.equal(UNIT_TO_GRAMS.oz, CONSTANTS.TROY_OZ_GRAMS); // 31.1035, not a duplicate literal
  assert.equal(UNIT_TO_GRAMS.kg, 1000);
  assert.equal(UNIT_TO_GRAMS.tola, 11.6638);
  assert.equal(UNIT_TO_GRAMS.masha, 0.972);
  assert.equal(UNIT_TO_GRAMS.baht, 15.244);
  assert.equal(UNIT_TO_GRAMS.taels, 37.429);
});

test('units: toGrams converts and falls back to grams for unknown units', async () => {
  const { toGrams } = await import(MOD);
  const { CONSTANTS } = await import(CFG);
  assert.equal(toGrams(1, 'gram'), 1);
  assert.equal(toGrams(1, 'oz'), CONSTANTS.TROY_OZ_GRAMS);
  assert.equal(toGrams(2, 'tola'), 2 * 11.6638);
  assert.equal(toGrams(0, 'oz'), 0);
  assert.equal(toGrams(5, 'unknown'), 5); // unknown → grams (1:1), matching the UI
});

test('units: gramsToUnit is the inverse of toGrams', async () => {
  const { toGrams, gramsToUnit } = await import(MOD);
  for (const unit of ['gram', 'oz', 'kg', 'tola', 'masha', 'baht', 'taels']) {
    const back = gramsToUnit(toGrams(7, unit), unit);
    assert.ok(Math.abs(back - 7) < 1e-9, `round-trip drift for ${unit}`);
  }
});

test('parse: ASCII input matches parseFloat for typical numbers', async () => {
  const { parseLocalizedNumber } = await import(MOD);
  assert.equal(parseLocalizedNumber('12.5'), 12.5);
  assert.equal(parseLocalizedNumber('100'), 100);
  assert.equal(parseLocalizedNumber('0.75'), 0.75);
  assert.equal(parseLocalizedNumber('.5'), 0.5);
  assert.equal(parseLocalizedNumber('+3'), 3);
  assert.equal(parseLocalizedNumber('12.5kg'), 12.5); // leading numeric prefix, like parseFloat
});

test('parse: empty / invalid input → NaN', async () => {
  const { parseLocalizedNumber } = await import(MOD);
  assert.ok(Number.isNaN(parseLocalizedNumber('')));
  assert.ok(Number.isNaN(parseLocalizedNumber('   ')));
  assert.ok(Number.isNaN(parseLocalizedNumber('abc')));
  assert.ok(Number.isNaN(parseLocalizedNumber(null)));
  assert.ok(Number.isNaN(parseLocalizedNumber(undefined)));
});

test('parse: Arabic-Indic numerals (the bug parseFloat cannot handle)', async () => {
  const { parseLocalizedNumber } = await import(MOD);
  assert.ok(Number.isNaN(parseFloat('١٢')), 'precondition: parseFloat fails on Arabic digits');
  assert.equal(parseLocalizedNumber('١٢'), 12);
  assert.equal(parseLocalizedNumber('١٢٣٤٥٦'), 123456);
  assert.equal(parseLocalizedNumber('١٢٫٥'), 12.5); // Arabic decimal separator ٫
  assert.equal(parseLocalizedNumber('٠٫٧٥'), 0.75);
});

test('parse: Persian / Urdu (extended Arabic-Indic) numerals', async () => {
  const { parseLocalizedNumber } = await import(MOD);
  assert.equal(parseLocalizedNumber('۱۲۳'), 123);
  assert.equal(parseLocalizedNumber('۹۹۹'), 999);
});

test('parse: thousands separators are stripped (ASCII, Arabic, and space)', async () => {
  const { parseLocalizedNumber } = await import(MOD);
  assert.equal(parseLocalizedNumber('1,000'), 1000); // parseFloat would give 1
  assert.equal(parseLocalizedNumber('1٬000'), 1000); // Arabic thousands separator ٬
  assert.equal(parseLocalizedNumber('1 000'), 1000);
  assert.equal(parseLocalizedNumber('١٬٠٠٠'), 1000); // Arabic digits + Arabic thousands
});

test('parse: isPositiveNumber guards weight/amount', async () => {
  const { isPositiveNumber } = await import(MOD);
  assert.equal(isPositiveNumber(5), true);
  assert.equal(isPositiveNumber(0), false);
  assert.equal(isPositiveNumber(-1), false);
  assert.equal(isPositiveNumber(NaN), false);
  assert.equal(isPositiveNumber(Infinity), false);
});
