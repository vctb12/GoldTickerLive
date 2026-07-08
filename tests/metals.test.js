'use strict';

/**
 * Metals data-layer foundation — guards the "gold math stays byte-identical" invariant.
 *
 * The metals registry generalises pricing to silver/platinum/palladium. This test proves that doing
 * so changes NOTHING about gold: the generalised formula reproduces the existing gold expression
 * exactly, gold's purities are the karat table verbatim, and the shared constants are untouched.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const METALS_MOD = new URL('../src/config/metals.js', `file://${__filename}`).href;
const KARATS_MOD = new URL('../src/config/karats.js', `file://${__filename}`).href;
const CONST_MOD = new URL('../src/config/constants.js', `file://${__filename}`).href;

test('metals: registry exposes gold/silver/platinum/palladium with correct spot symbols', async () => {
  const { METALS } = await import(METALS_MOD);
  assert.deepEqual(Object.fromEntries(Object.values(METALS).map((m) => [m.key, m.symbol])), {
    gold: 'XAU',
    silver: 'XAG',
    platinum: 'XPT',
    palladium: 'XPD',
  });
  for (const m of Object.values(METALS)) {
    assert.equal(typeof m.nameEn, 'string');
    assert.equal(typeof m.nameAr, 'string');
    assert.ok(Array.isArray(m.purities) && m.purities.length > 0, `${m.key} needs purities`);
    assert.ok(
      m.purities.some((p) => p.code === m.defaultPurity),
      `${m.key} defaultPurity must exist in purities`
    );
  }
});

test('metals: only gold is primary', async () => {
  const { METALS, PRIMARY_METAL } = await import(METALS_MOD);
  assert.equal(PRIMARY_METAL, 'gold');
  const primaries = Object.values(METALS).filter((m) => m.primary);
  assert.deepEqual(
    primaries.map((m) => m.key),
    ['gold']
  );
});

test('metals: gold purities are the karat table verbatim (no drift)', async () => {
  const { METALS } = await import(METALS_MOD);
  const { KARATS } = await import(KARATS_MOD);
  assert.deepEqual(
    METALS.gold.purities.map((p) => [p.code, p.purity]),
    KARATS.map((k) => [k.code, k.purity])
  );
});

test('metals: metalUsdPerGram is byte-identical to the existing gold formula', async () => {
  const { metalUsdPerGram } = await import(METALS_MOD);
  const { CONSTANTS } = await import(CONST_MOD);
  const TROY = CONSTANTS.TROY_OZ_GRAMS;
  // The exact expression used across the gold code (e.g. src/lib/export.js): (spot * purity) / TROY.
  const goldFormula = (spot, purity) => (spot * purity) / TROY;
  const spots = [0.5, 1, 25.4, 1980.75, 2500, 3333.33, 4149.0, 99999.99];
  const purities = [1.0, 22 / 24, 21 / 24, 18 / 24, 0.999, 0.925, 0.95, 0.9];
  for (const spot of spots) {
    for (const purity of purities) {
      assert.equal(
        metalUsdPerGram(spot, purity),
        goldFormula(spot, purity),
        `mismatch at spot=${spot} purity=${purity}`
      );
    }
  }
});

test('metals: gold 24K via the registry equals the direct gold gram value', async () => {
  const { METALS, metalUsdPerGram } = await import(METALS_MOD);
  const { CONSTANTS } = await import(CONST_MOD);
  const spot = 4149.0; // matches a committed data/gold_price.json snapshot
  const k24 = METALS.gold.purities.find((p) => p.code === '24');
  assert.equal(metalUsdPerGram(spot, k24.purity), (spot * 1.0) / CONSTANTS.TROY_OZ_GRAMS);
});

test('metals: immutable constants are untouched', async () => {
  const { CONSTANTS } = await import(CONST_MOD);
  assert.equal(CONSTANTS.AED_PEG, 3.6725);
  assert.equal(CONSTANTS.TROY_OZ_GRAMS, 31.1035);
});

test('metals: usdToAedPerGram applies the fixed peg', async () => {
  const { usdToAedPerGram } = await import(METALS_MOD);
  const { CONSTANTS } = await import(CONST_MOD);
  assert.equal(usdToAedPerGram(100), 100 * CONSTANTS.AED_PEG);
  assert.equal(usdToAedPerGram(Number.NaN), null);
});

test('metals: metalUsdPerGram rejects non-finite input', async () => {
  const { metalUsdPerGram } = await import(METALS_MOD);
  assert.equal(metalUsdPerGram(Number.NaN, 1), null);
  assert.equal(metalUsdPerGram(2000, Number.NaN), null);
  assert.equal(metalUsdPerGram(Infinity, 1), null);
});
