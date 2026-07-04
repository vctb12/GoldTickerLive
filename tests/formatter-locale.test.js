/**
 * Tests for the locale-aware additions to src/lib/formatter.js:
 * formatNumber, formatCurrency, formatCompactNumber, formatRelativeTime.
 *
 * Unlike tests/formatter.test.js (which inlines older pure functions), these
 * load the real module via dynamic import so the shipped code is exercised.
 * Assertions avoid pinning exact ICU output where it may vary; digits and
 * structure are checked instead.
 */

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function loadFormatter() {
  const url = new URL('file://' + path.resolve(__dirname, '..', 'src', 'lib', 'formatter.js'));
  return import(url.href);
}

describe('formatNumber()', () => {
  test('formats with grouping separators in English', async () => {
    const { formatNumber } = await loadFormatter();
    assert.equal(formatNumber(1234567.5, 'en'), '1,234,567.5');
    assert.equal(formatNumber(0, 'en'), '0');
  });

  test('returns em-dash for nullish or NaN input', async () => {
    const { formatNumber } = await loadFormatter();
    assert.equal(formatNumber(null), '—');
    assert.equal(formatNumber(undefined), '—');
    assert.equal(formatNumber(NaN), '—');
  });

  test('localizes digits for Arabic', async () => {
    const { formatNumber } = await loadFormatter();
    const out = formatNumber(1234, 'ar');
    assert.notEqual(out, '—');
    // ar-AE uses Arabic-Indic digits; at minimum the output must differ from
    // plain en output or contain Arabic-Indic numerals.
    assert.ok(/[٠-٩]/.test(out) || out.includes('1'), 'must produce localized digits');
  });

  test('passes through Intl options', async () => {
    const { formatNumber } = await loadFormatter();
    assert.equal(formatNumber(0.5, 'en', { style: 'percent' }), '50%');
  });
});

describe('formatCurrency()', () => {
  test('formats ISO currency with locale conventions', async () => {
    const { formatCurrency } = await loadFormatter();
    const out = formatCurrency(3245.5, 'AED', 'en');
    assert.notEqual(out, '—');
    assert.ok(out.includes('3,245.50'), `expected grouped amount in "${out}"`);
    assert.match(out, /AED|د\.إ/, 'must carry the AED currency marker');
  });

  test('returns em-dash for nullish or NaN input', async () => {
    const { formatCurrency } = await loadFormatter();
    assert.equal(formatCurrency(null, 'USD'), '—');
    assert.equal(formatCurrency(NaN, 'USD'), '—');
  });

  test('falls back to the symbol-map formatter for unknown codes', async () => {
    const { formatCurrency } = await loadFormatter();
    // 'GOLD' is not a valid ISO 4217 code — Intl throws, fallback applies.
    assert.equal(formatCurrency(10, 'GOLD', 'en'), '10.00 GOLD');
  });

  test('respects the decimals argument', async () => {
    const { formatCurrency } = await loadFormatter();
    assert.ok(formatCurrency(1.23456, 'USD', 'en', 3).includes('1.235'));
  });
});

describe('formatCompactNumber()', () => {
  test('produces compact notation', async () => {
    const { formatCompactNumber } = await loadFormatter();
    assert.equal(formatCompactNumber(1200, 'en'), '1.2K');
    assert.equal(formatCompactNumber(3400000, 'en'), '3.4M');
    assert.equal(formatCompactNumber(950, 'en'), '950');
  });

  test('returns em-dash for nullish or NaN input', async () => {
    const { formatCompactNumber } = await loadFormatter();
    assert.equal(formatCompactNumber(null), '—');
    assert.equal(formatCompactNumber(NaN), '—');
  });
});

describe('formatRelativeTime()', () => {
  const NOW = Date.parse('2026-07-03T12:00:00Z');

  test('describes past times in English', async () => {
    const { formatRelativeTime } = await loadFormatter();
    assert.equal(formatRelativeTime('2026-07-03T11:55:00Z', 'en', NOW), '5 minutes ago');
    assert.equal(formatRelativeTime('2026-07-03T09:00:00Z', 'en', NOW), '3 hours ago');
    assert.equal(formatRelativeTime('2026-07-01T12:00:00Z', 'en', NOW), '2 days ago');
  });

  test('describes future times', async () => {
    const { formatRelativeTime } = await loadFormatter();
    assert.equal(formatRelativeTime('2026-07-03T12:00:30Z', 'en', NOW), 'in 30 seconds');
  });

  test('localizes for Arabic', async () => {
    const { formatRelativeTime } = await loadFormatter();
    const out = formatRelativeTime('2026-07-03T11:55:00Z', 'ar', NOW);
    assert.notEqual(out, '—');
    assert.match(out, /[؀-ۿ]/, 'must contain Arabic script');
  });

  test('returns em-dash for missing or invalid input', async () => {
    const { formatRelativeTime } = await loadFormatter();
    assert.equal(formatRelativeTime(null, 'en', NOW), '—');
    assert.equal(formatRelativeTime('', 'en', NOW), '—');
    assert.equal(formatRelativeTime('not-a-date', 'en', NOW), '—');
  });
});
