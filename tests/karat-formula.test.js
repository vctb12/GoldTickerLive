'use strict';

/**
 * Karat pricing-formula regression lock (Phase 54).
 *
 * The existing `price-calculator.test.js` re-declares the constants and formulas *inline*, so it
 * validates its own copies — not the real source. This suite imports the ACTUAL modules
 * (`price-calculator.js`, `karats.js`, `constants.js`, `metal-pricing.js` → `metals.js`) and pins the
 * whole chain across EVERY karat, so a change to the real formula, the troy-oz divisor, the AED peg,
 * a karat purity, or the coupling between the two purity sources fails a test.
 *
 *   usdPerGram = (spot ÷ 31.1035) × purity      purity = karat / 24
 *   usdPerOz   = spot × purity
 *   AED        = usd × 3.6725 (fixed peg)
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const PC = new URL('../src/lib/price-calculator.js', `file://${__filename}`).href;
const KAR = new URL('../src/config/karats.js', `file://${__filename}`).href;
const CFG = new URL('../src/config/index.js', `file://${__filename}`).href;
const MP = new URL('../src/lib/metal-pricing.js', `file://${__filename}`).href;

const SPOTS = [4053.7, 3200, 1810.55, 950];
const near = (a, b, eps = 1e-9) => Math.abs(a - b) <= eps;

test('formula: the immutable constants are unchanged (real source)', async () => {
  const { CONSTANTS } = await import(CFG);
  assert.equal(CONSTANTS.TROY_OZ_GRAMS, 31.1035);
  assert.equal(CONSTANTS.AED_PEG, 3.6725);
});

test('formula: every KARATS purity is exactly karat/24 (24K = 1.0)', async () => {
  const { KARATS } = await import(KAR);
  assert.ok(KARATS.length >= 5, 'expected the full karat set');
  for (const k of KARATS) {
    assert.equal(k.purity, Number(k.code) / 24, `purity drift for ${k.code}K`);
  }
  // 24K is pure gold.
  assert.equal(KARATS.find((k) => k.code === '24').purity, 1.0);
});

test('formula: real usdPerGram / usdPerOz match the derivation for every karat & spot', async () => {
  const { usdPerGram, usdPerOz } = await import(PC);
  const { KARATS } = await import(KAR);
  const { CONSTANTS } = await import(CFG);
  const TROY = CONSTANTS.TROY_OZ_GRAMS;
  for (const spot of SPOTS) {
    for (const k of KARATS) {
      // Same multiplication order as the source → exact equality.
      assert.equal(usdPerGram(spot, k.purity), (spot / TROY) * k.purity, `g ${k.code}K @ ${spot}`);
      assert.equal(usdPerOz(spot, k.purity), spot * k.purity, `oz ${k.code}K @ ${spot}`);
      // Per-oz is exactly troy-oz-grams heavier than per-gram.
      assert.ok(
        near(usdPerOz(spot, k.purity) / usdPerGram(spot, k.purity), TROY),
        `ratio ${k.code}K`
      );
    }
  }
});

test('formula: 24K per-oz equals spot, and AED = USD × peg', async () => {
  const { usdPerGram, usdPerOz, localPrice } = await import(PC);
  const { CONSTANTS } = await import(CFG);
  const spot = 4053.7;
  assert.equal(usdPerOz(spot, 1.0), spot);
  const g24 = usdPerGram(spot, 1.0);
  assert.equal(localPrice(g24, CONSTANTS.AED_PEG), g24 * CONSTANTS.AED_PEG);
  assert.ok(near(localPrice(100, CONSTANTS.AED_PEG), 367.25));
});

test('formula: price is strictly monotonic in purity', async () => {
  const { usdPerGram } = await import(PC);
  const { KARATS } = await import(KAR);
  const spot = 3200;
  const ordered = [...KARATS].sort((a, b) => a.purity - b.purity);
  for (let i = 1; i < ordered.length; i += 1) {
    assert.ok(
      usdPerGram(spot, ordered[i].purity) > usdPerGram(spot, ordered[i - 1].purity),
      `not increasing at ${ordered[i].code}K`
    );
  }
});

test('formula: falsy guards return 0 / null', async () => {
  const { usdPerGram, usdPerOz, localPrice } = await import(PC);
  assert.equal(usdPerGram(0, 1.0), 0);
  assert.equal(usdPerGram(3100, 0), 0);
  assert.equal(usdPerOz(0, 0.75), 0);
  assert.equal(localPrice(0, 3.6725), null);
  assert.equal(localPrice(100, 0), null);
});

test('formula: calculateAllPrices — AED from the peg (never the feed), USD passthrough, missing rate → null', async () => {
  const { calculateAllPrices, usdPerGram } = await import(PC);
  const { KARATS } = await import(KAR);
  const { CONSTANTS } = await import(CFG);
  const spot = 4053.7;
  const rates = { EUR: 0.92, AED: 999 }; // bogus AED must be ignored
  const countries = [{ currency: 'AED' }, { currency: 'EUR' }, { currency: 'GBP' }];
  const prices = calculateAllPrices(spot, rates, KARATS, countries);

  for (const k of KARATS) {
    const g = usdPerGram(spot, k.purity);
    const cell = prices[k.code];
    assert.equal(cell.USD.gram, g); // USD passthrough
    assert.equal(cell.AED.gram, g * CONSTANTS.AED_PEG); // peg, NOT rates.AED=999
    assert.notEqual(cell.AED.gram, g * 999);
    assert.equal(cell.EUR.gram, g * 0.92); // from the feed
    assert.equal(cell.GBP, null); // rate missing → honest null, not a fabricated price
  }
});

test('formula: calculateAllPrices returns {} for falsy spot or rates', async () => {
  const { calculateAllPrices } = await import(PC);
  const { KARATS } = await import(KAR);
  assert.deepEqual(calculateAllPrices(0, { EUR: 0.9 }, KARATS, []), {});
  assert.deepEqual(calculateAllPrices(3200, null, KARATS, []), {});
});

test('formula: price-calculator and metal-pricing agree for gold across all karats (coupling lock)', async () => {
  const { usdPerGram } = await import(PC);
  const { KARATS } = await import(KAR);
  const { CONSTANTS } = await import(CFG);
  const { resolveMetalGramPrice } = await import(MP);
  const spot = 4053.7;
  for (const k of KARATS) {
    const resolved = resolveMetalGramPrice('gold', k.code, { gold: spot });
    assert.equal(resolved.state, 'ok', `gold ${k.code}K should price`);
    // Different multiplication order between the two modules → compare within epsilon.
    assert.ok(near(resolved.usdPerGram, usdPerGram(spot, k.purity)), `usd/g drift ${k.code}K`);
    assert.ok(
      near(resolved.aedPerGram, usdPerGram(spot, k.purity) * CONSTANTS.AED_PEG),
      `aed/g drift ${k.code}K`
    );
  }
});
