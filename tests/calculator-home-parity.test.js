'use strict';

/**
 * Homepage ↔ Calculator pricing parity (F-1 regression lock).
 *
 * The homepage derives every karat price through the canonical resolver
 * (`spot-resolver.deriveFromSpot`); the calculator derives them through
 * `price-calculator.usdPerGram(spot, purity) * CONSTANTS.AED_PEG`. Both read the
 * SAME committed spot via the SAME resolver at runtime, so for any given spot the
 * two derivations must be byte-identical — otherwise the two surfaces could show
 * different prices. This test fails if either derivation drifts, or if an
 * invariant (peg 3.6725, troy 31.1035 g, purity = code/24) changes.
 *
 * ESM modules under test are loaded via dynamic import (package is CommonJS).
 */
const { test, before } = require('node:test');
const assert = require('node:assert/strict');

let calc, R, CONSTANTS, KARATS;
before(async () => {
  calc = await import('../src/lib/price-calculator.js');
  R = await import('../src/lib/spot-resolver.js');
  ({ CONSTANTS } = await import('../src/config/constants.js'));
  ({ KARATS } = await import('../src/config/karats.js'));
});

// A spread of spots: the committed sample, round numbers, decimals, very large,
// and a tiny positive value — the calculator must stay in lock-step at all of them.
const SPOTS = [4107.2002, 1800, 2500.5, 3333.33, 9999.99, 100, 0.01];

test('AED/g parity: calculator (usdPerGram×peg) === homepage resolver for every karat/spot', () => {
  for (const spot of SPOTS) {
    const derived = R.deriveFromSpot(spot);
    assert.ok(derived, `resolver derives for spot ${spot}`);
    for (const k of KARATS) {
      const calcAed = calc.usdPerGram(spot, k.purity) * CONSTANTS.AED_PEG;
      const row = derived.karats.find((r) => r.code === k.code);
      assert.ok(row, `resolver has karat ${k.code}`);
      assert.ok(
        Math.abs(calcAed - row.aedPerGram) < 1e-9,
        `karat ${k.code} @ spot ${spot}: calc ${calcAed} !== home ${row.aedPerGram}`
      );
      // …and both equal the closed-form invariant spot/31.1035 × code/24 × 3.6725
      const invariant =
        (spot / CONSTANTS.TROY_OZ_GRAMS) * (Number(k.code) / 24) * CONSTANTS.AED_PEG;
      assert.ok(
        Math.abs(calcAed - invariant) < 1e-9,
        `karat ${k.code} @ spot ${spot}: not equal to closed-form invariant`
      );
    }
  }
});

test('USD/g parity: calculator === homepage resolver for every karat/spot', () => {
  for (const spot of SPOTS) {
    const derived = R.deriveFromSpot(spot);
    for (const k of KARATS) {
      const calcUsd = calc.usdPerGram(spot, k.purity);
      const row = derived.karats.find((r) => r.code === k.code);
      assert.ok(
        Math.abs(calcUsd - row.usdPerGram) < 1e-9,
        `usd/g karat ${k.code} @ spot ${spot}: calc ${calcUsd} !== home ${row.usdPerGram}`
      );
    }
  }
});

test('invariants are exact: peg 3.6725, troy 31.1035, purity = code/24', () => {
  assert.equal(CONSTANTS.AED_PEG, 3.6725);
  assert.equal(CONSTANTS.TROY_OZ_GRAMS, 31.1035);
  for (const k of KARATS) {
    const expected = Number(k.code) / 24; // 24 → 1.0
    assert.ok(Math.abs(k.purity - expected) < 1e-12, `karat ${k.code} purity must be code/24`);
  }
});

test('edge cases: zero / negative / NaN / empty stay safe and parity-preserving', () => {
  // Calculator: usdPerGram guards falsy spot/purity → 0 (no NaN leak into a price).
  assert.equal(calc.usdPerGram(0, 1.0), 0);
  assert.equal(calc.usdPerGram(-5, 1.0), 0);
  assert.equal(calc.usdPerGram(3100, 0), 0);
  assert.equal(calc.usdPerGram(null, null), 0);
  // Resolver: non-positive / non-finite spot → null (surfaces render the em-dash
  // placeholder + honest "unavailable", never a fabricated number).
  assert.equal(R.deriveFromSpot(0), null);
  assert.equal(R.deriveFromSpot(-5), null);
  assert.equal(R.deriveFromSpot(NaN), null);
  assert.equal(R.deriveFromSpot('not-a-number'), null);
});

test('a large realistic move keeps 24K parity to the fils', () => {
  // Simulate a big intraday move; both surfaces must still agree exactly.
  for (const spot of [5000, 4200.75, 3899.99]) {
    const calcAed = calc.usdPerGram(spot, 1.0) * CONSTANTS.AED_PEG;
    const homeAed = R.deriveFromSpot(spot).aedPerGram24k;
    assert.ok(Math.abs(calcAed - homeAed) < 1e-9, `24K parity @ ${spot}`);
  }
});
