'use strict';

/**
 * Tests for lib/formatter.js — price/date/label formatting (pure functions).
 *
 * Because formatter.js uses ES module syntax we inline the functions here
 * (same approach as price-calculator.test.js) to keep tests runnable with
 * plain `node --test` without a transpile step.
 *
 * Run with:  npm test
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// ---------------------------------------------------------------------------
// Inline the pure functions from formatter.js
// ---------------------------------------------------------------------------

const CURRENCY_SYMBOLS = {
  USD: '$',
  AED: 'د.إ',
  SAR: 'ر.س',
  KWD: 'د.ك',
  QAR: 'ر.ق',
  BHD: '.د.ب',
  OMR: 'ر.ع',
  JOD: 'د.أ',
  LBP: 'ل.ل',
  EGP: 'ج.م',
  INR: '₹',
  GBP: '£',
  EUR: '€',
};

function formatPrice(amount, currency, decimals = 2) {
  if (amount === null || amount === undefined || isNaN(amount)) return '—';
  const sym = CURRENCY_SYMBOLS[currency] || currency;
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
  return `${formatted} ${sym}`;
}

function formatCountdown(ms) {
  if (!ms || ms <= 0) return '0s';
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min > 0) return `${min}m ${sec}s`;
  return `${sec}s`;
}

function formatPercentChange(change, base) {
  if (!change || !base || base === 0) return { text: '—', direction: 'neutral' };
  const pct = (change / base) * 100;
  const sign = change > 0 ? '+' : '';
  const arrow = change > 0 ? '↑' : change < 0 ? '↓' : '—';
  const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
  return {
    text: `${arrow} ${sign}${pct.toFixed(2)}%`,
    value: `${sign}${change.toFixed(2)}`,
    direction,
  };
}

function formatFreshness(updatedAt) {
  if (!updatedAt) return { label: 'Unable to fetch prices', state: 'error', ageMs: Infinity };
  const ageMs = Date.now() - new Date(updatedAt).getTime();
  if (isNaN(ageMs) || ageMs < 0) return { label: 'Live', state: 'live', ageMs: 0 };
  const ageMins = ageMs / 60000;
  if (ageMins < 2) return { label: 'Live', state: 'live', ageMs };
  if (ageMins < 10) return { label: `${Math.floor(ageMins)} min ago`, state: 'recent', ageMs };
  if (ageMins < 60)
    return { label: `Updated ${Math.floor(ageMins)} min ago`, state: 'stale', ageMs };
  const timeStr = new Date(updatedAt).toLocaleTimeString('en-AE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Dubai',
  });
  return { label: `Cached data from ${timeStr}`, state: 'cached', ageMs };
}

function formatKarat(karat, lang) {
  return lang === 'ar' ? karat.labelAr : karat.labelEn;
}

function formatCountryName(country, lang) {
  return lang === 'ar' ? country.nameAr : country.nameEn;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('formatPrice', () => {
  test('formats USD with symbol', () => {
    assert.equal(formatPrice(1234.5, 'USD'), '1,234.50 $');
  });

  test('formats AED with Arabic symbol', () => {
    assert.equal(formatPrice(100, 'AED'), '100.00 د.إ');
  });

  test('respects custom decimals', () => {
    assert.equal(formatPrice(99.999, 'USD', 3), '99.999 $');
  });

  test('returns — for null', () => {
    assert.equal(formatPrice(null, 'USD'), '—');
  });

  test('returns — for undefined', () => {
    assert.equal(formatPrice(undefined, 'USD'), '—');
  });

  test('returns — for NaN', () => {
    assert.equal(formatPrice(NaN, 'USD'), '—');
  });

  test('uses currency code as fallback symbol', () => {
    const result = formatPrice(42, 'XYZ');
    assert.ok(result.includes('XYZ'));
  });

  test('formats zero correctly', () => {
    assert.equal(formatPrice(0, 'USD'), '0.00 $');
  });
});

describe('formatCountdown', () => {
  test('returns 0s for zero', () => {
    assert.equal(formatCountdown(0), '0s');
  });

  test('returns 0s for negative', () => {
    assert.equal(formatCountdown(-5000), '0s');
  });

  test('returns seconds only for < 60s', () => {
    assert.equal(formatCountdown(45000), '45s');
  });

  test('returns minutes and seconds', () => {
    assert.equal(formatCountdown(90000), '1m 30s');
  });

  test('returns 0s for null', () => {
    assert.equal(formatCountdown(null), '0s');
  });
});

describe('formatPercentChange', () => {
  test('positive change shows up arrow', () => {
    const result = formatPercentChange(50, 1000);
    assert.equal(result.direction, 'up');
    assert.ok(result.text.includes('↑'));
    assert.ok(result.text.includes('+'));
  });

  test('negative change shows down arrow', () => {
    const result = formatPercentChange(-30, 1000);
    assert.equal(result.direction, 'down');
    assert.ok(result.text.includes('↓'));
  });

  test('returns neutral for zero change', () => {
    const result = formatPercentChange(0, 1000);
    assert.equal(result.direction, 'neutral');
    assert.equal(result.text, '—');
  });

  test('returns neutral for zero base', () => {
    const result = formatPercentChange(50, 0);
    assert.equal(result.direction, 'neutral');
  });

  test('returns neutral for null inputs', () => {
    assert.equal(formatPercentChange(null, 100).direction, 'neutral');
    assert.equal(formatPercentChange(10, null).direction, 'neutral');
  });
});

describe('formatFreshness', () => {
  test('returns error for null input', () => {
    const result = formatFreshness(null);
    assert.equal(result.state, 'error');
    assert.equal(result.ageMs, Infinity);
  });

  test('returns live for very recent timestamp', () => {
    const result = formatFreshness(new Date().toISOString());
    assert.equal(result.state, 'live');
    assert.equal(result.label, 'Live');
  });

  test('returns recent for 5 minutes ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const result = formatFreshness(fiveMinAgo);
    assert.equal(result.state, 'recent');
    assert.ok(result.label.includes('min ago'));
  });

  test('returns stale for 30 minutes ago', () => {
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const result = formatFreshness(thirtyMinAgo);
    assert.equal(result.state, 'stale');
    assert.ok(result.label.includes('Updated'));
  });

  test('returns cached for 2 hours ago', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const result = formatFreshness(twoHoursAgo);
    assert.equal(result.state, 'cached');
    assert.ok(result.label.includes('Cached data from'));
  });

  test('returns live for future timestamp (negative age)', () => {
    const future = new Date(Date.now() + 60000).toISOString();
    const result = formatFreshness(future);
    assert.equal(result.state, 'live');
  });
});

describe('formatKarat', () => {
  test('returns English label for en', () => {
    assert.equal(formatKarat({ labelEn: '24K', labelAr: '24 قيراط' }, 'en'), '24K');
  });

  test('returns Arabic label for ar', () => {
    assert.equal(formatKarat({ labelEn: '24K', labelAr: '24 قيراط' }, 'ar'), '24 قيراط');
  });
});

describe('formatCountryName', () => {
  test('returns English name for en', () => {
    assert.equal(formatCountryName({ nameEn: 'UAE', nameAr: 'الإمارات' }, 'en'), 'UAE');
  });

  test('returns Arabic name for ar', () => {
    assert.equal(formatCountryName({ nameEn: 'UAE', nameAr: 'الإمارات' }, 'ar'), 'الإمارات');
  });
});
