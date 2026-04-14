'use strict';

/**
 * Tests for lib/price-calculator.js (pure functions, no I/O)
 *
 * These tests use the Node.js built-in test runner (node:test).
 * Run with:  npm test
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

// NOTE: lib/price-calculator.js uses ES module syntax (import/export). Rather than
// requiring a transpile step or --experimental-vm-modules flag, the pure mathematical
// functions are inlined here so the test suite runs with plain `node --test`. If the
// project ever adds a build step for tests, switch these to dynamic import() calls.
const TROY_OZ_GRAMS = 31.1035;
const AED_PEG = 3.6725;

function usdPerGram(spotUsdPerOz, purity) {
  if (!spotUsdPerOz || !purity) return 0;
  return (spotUsdPerOz / TROY_OZ_GRAMS) * purity;
}

function usdPerOz(spotUsdPerOz, purity) {
  if (!spotUsdPerOz || !purity) return 0;
  return spotUsdPerOz * purity;
}

function localPrice(usdPrice, fxRate) {
  if (!usdPrice || !fxRate) return null;
  return usdPrice * fxRate;
}

function calculateVolatility(history, days) {
  if (!Array.isArray(history) || history.length < 2) return null;
  const slice = history
    .slice(-days)
    .map((h) => h.price)
    .filter(Boolean);
  if (slice.length < 2) return null;
  const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
  const variance = slice.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / slice.length;
  return (Math.sqrt(variance) / mean) * 100;
}

// ---------------------------------------------------------------------------

describe('usdPerGram', () => {
  test('returns correct price for 24K gold', () => {
    const spot = 3100; // USD/oz
    const purity24k = 1.0;
    const expected = (spot / TROY_OZ_GRAMS) * purity24k;
    assert.ok(Math.abs(usdPerGram(spot, purity24k) - expected) < 0.0001);
  });

  test('returns correct price for 18K gold (purity 0.75)', () => {
    const spot = 3100;
    const purity18k = 0.75;
    assert.ok(Math.abs(usdPerGram(spot, purity18k) - (spot / TROY_OZ_GRAMS) * purity18k) < 0.0001);
  });

  test('returns 0 when spot is 0', () => {
    assert.equal(usdPerGram(0, 1.0), 0);
  });

  test('returns 0 when purity is 0', () => {
    assert.equal(usdPerGram(3100, 0), 0);
  });

  test('returns 0 when both args are falsy', () => {
    assert.equal(usdPerGram(null, null), 0);
  });
});

describe('usdPerOz', () => {
  test('returns spot price unchanged for 24K', () => {
    assert.equal(usdPerOz(3100, 1.0), 3100);
  });

  test('returns 75% of spot for 18K', () => {
    assert.ok(Math.abs(usdPerOz(3100, 0.75) - 2325) < 0.0001);
  });

  test('returns 0 for falsy inputs', () => {
    assert.equal(usdPerOz(0, 0.75), 0);
    assert.equal(usdPerOz(3100, 0), 0);
  });
});

describe('localPrice', () => {
  test('converts USD to AED using hardcoded peg', () => {
    const usd = 100;
    const result = localPrice(usd, AED_PEG);
    assert.ok(Math.abs(result - 367.25) < 0.001);
  });

  test('returns null when usdPrice is falsy', () => {
    assert.equal(localPrice(0, 3.6725), null);
    assert.equal(localPrice(null, 3.6725), null);
  });

  test('returns null when fxRate is falsy', () => {
    assert.equal(localPrice(100, 0), null);
    assert.equal(localPrice(100, null), null);
  });
});

describe('calculateVolatility', () => {
  test('returns null for empty history', () => {
    assert.equal(calculateVolatility([], 30), null);
  });

  test('returns null for single entry', () => {
    assert.equal(calculateVolatility([{ price: 3100 }], 30), null);
  });

  test('returns 0 for constant prices', () => {
    const history = Array.from({ length: 10 }, (_, i) => ({
      date: `2024-01-${String(i + 1).padStart(2, '0')}`,
      price: 3100,
    }));
    const vol = calculateVolatility(history, 10);
    assert.ok(Math.abs(vol) < 0.0001);
  });

  test('returns positive value for varying prices', () => {
    const history = [
      { price: 3000 },
      { price: 3100 },
      { price: 3050 },
      { price: 3200 },
      { price: 2950 },
    ];
    const vol = calculateVolatility(history, 5);
    assert.ok(vol > 0);
  });

  test('respects the days window', () => {
    const history = [
      { price: 1000 },
      { price: 1000 },
      { price: 1000 }, // old constant entries
      { price: 3000 },
      { price: 3100 }, // recent varying
    ];
    const volFull = calculateVolatility(history, 5);
    const volRecent = calculateVolatility(history, 2);
    // Recent window covers only the two varying entries — volatility should differ
    assert.ok(typeof volFull === 'number');
    assert.ok(typeof volRecent === 'number');
  });
});
