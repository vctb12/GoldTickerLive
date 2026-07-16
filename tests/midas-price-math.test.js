'use strict';

/**
 * Operation Midas — Phase 5 price-math verification fortress.
 *
 * Directive locks for the immutable pricing facts:
 *   - AED peg is exactly 3.6725 and no fetched FX rate can override it
 *     (fx-integrity `sanitizeFxRates` always forces AED to the peg).
 *   - Every karat purity is exactly code/24 (the fraction, not a rounded decimal)
 *     and derived per-gram prices scale linearly with purity.
 *   - Weight-unit conversions are exact identities (oz↔g round trip, kg = g*1000,
 *     tola and the other units exposed by src/lib/weight-units.js).
 *   - The committed data/gold_price.json honors the pipeline contract:
 *     usd_per_gram_24k = xau_usd_per_oz / 31.1034768 (pipeline-exact troy value),
 *     aed = usd * 3.6725, and each karat AED/g = 24k AED/g * code/24.
 *
 * NOTE on troy values: the Python pipeline writes with 31.1034768
 * (scripts/python/gold_providers/base.py); the client constants.js carries the
 * rounded 31.1035 pending owner decision Q4 (docs/plans/midas/RISK_REGISTER.md).
 * Both facts are asserted here so any silent change trips a test.
 */

const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const AED_PEG = 3.6725;
const PIPELINE_TROY_OZ_GRAMS = 31.1034768; // pipeline writers (gold_providers/base.py)
const CLIENT_TROY_OZ_GRAMS = 31.1035; // client constants.js — owner-gated Q4, must stay

let CONSTANTS, KARATS, spotResolver, fxIntegrity, weightUnits;
before(async () => {
  ({ CONSTANTS } = await import('../src/config/constants.js'));
  ({ KARATS } = await import('../src/config/karats.js'));
  spotResolver = await import('../src/lib/spot-resolver.js');
  fxIntegrity = await import('../src/lib/fx-integrity.js');
  weightUnits = await import('../src/lib/weight-units.js');
});

// ── Peg exactness ───────────────────────────────────────────────────────────

test('peg: CONSTANTS.AED_PEG is exactly 3.6725 (strict equality, no tolerance)', () => {
  assert.strictEqual(CONSTANTS.AED_PEG, 3.6725);
});

test('peg: node script tier constants module carries the exact peg and pipeline troy value', () => {
  const scriptConstants = require('../scripts/node/lib/price-constants.js');
  assert.strictEqual(scriptConstants.AED_PEG, 3.6725);
  assert.strictEqual(scriptConstants.TROY_OZ_GRAMS, PIPELINE_TROY_OZ_GRAMS);
});

test('peg: client troy constant stays at 31.1035 until owner decision Q4', () => {
  assert.strictEqual(CONSTANTS.TROY_OZ_GRAMS, CLIENT_TROY_OZ_GRAMS);
});

test('peg: spot-resolver USD→AED path multiplies by exactly 3.6725', () => {
  const spot = 4002.7;
  const d = spotResolver.deriveFromSpot(spot);
  assert.ok(d, 'derivation should succeed');
  // Exact double arithmetic — no tolerance: aed = usd * peg, verbatim.
  assert.strictEqual(d.aedPerGram24k, d.usdPerGram24k * 3.6725);
});

test('peg: no fetched FX rate can override AED — sanitizeFxRates always forces the peg', () => {
  // A feed that tries to carry its own (drifted) AED rate.
  const { safe, rejected, aed } = fxIntegrity.sanitizeFxRates({ AED: 4.2, SAR: 3.75, EUR: 0.92 });
  assert.strictEqual(safe.AED, 3.6725, 'AED must be the fixed peg, never the feed value');
  assert.ok(aed.present && !aed.matchesPeg, 'drifted feed AED must be flagged');
  assert.ok(
    rejected.some((r) => r.currency === 'AED' && r.reason === 'aed-peg-drift'),
    'drifted feed AED must be recorded as rejected'
  );

  // Even a "correct-looking" feed AED is replaced by the peg constant itself.
  const okFeed = fxIntegrity.sanitizeFxRates({ AED: 3.6725 });
  assert.strictEqual(okFeed.safe.AED, 3.6725);

  // No rates at all: AED is still present at the peg (peg is policy, not feed data).
  const empty = fxIntegrity.sanitizeFxRates(null);
  assert.strictEqual(empty.safe.AED, 3.6725);
});

// ── Karat scaling ───────────────────────────────────────────────────────────

test('karats: every configured purity is exactly code/24 (fraction, not rounded decimal)', () => {
  assert.ok(Array.isArray(KARATS) && KARATS.length >= 4, 'karat table present');
  for (const k of KARATS) {
    const expected = Number(k.code) / 24;
    // Strict equality: 22/24 in the config must be the same double as Number('22')/24.
    assert.strictEqual(k.purity, expected, `${k.code}K purity must be exactly ${k.code}/24`);
  }
});

test('karats: derived AED/g scales linearly with purity from one 24K base', () => {
  const d = spotResolver.deriveFromSpot(3333.33);
  assert.ok(d, 'derivation should succeed');
  for (const k of d.karats) {
    const purity = Number(k.code) / 24;
    assert.ok(
      Math.abs(k.aedPerGram - d.aedPerGram24k * purity) < 1e-9,
      `${k.code}K AED/g = 24K AED/g * ${k.code}/24`
    );
    assert.ok(
      Math.abs(k.usdPerGram - d.usdPerGram24k * purity) < 1e-9,
      `${k.code}K USD/g = 24K USD/g * ${k.code}/24`
    );
  }
});

// ── Conversion identities (property-style sweep) ────────────────────────────

/** >= 25 spot values including extremes and awkward decimals. */
function sweepValues() {
  const values = [100, 99999, 0.01, 1, 2.5, 333.33, 1999.99, 4002.7, 4107.2002, 65432.1];
  // Deterministic pseudo-random fill (no Math.random — reproducible failures).
  let seed = 42;
  while (values.length < 30) {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    const v = 100 + (seed % 900000) / 9.07; // ~100 .. ~99300, awkward decimals
    values.push(Number(v.toFixed(4)));
  }
  return values;
}

test('conversions: oz→g→oz round trip is an identity across the sweep', () => {
  const { toGrams, gramsToUnit } = weightUnits;
  for (const spot of sweepValues()) {
    const grams = toGrams(spot, 'oz');
    const back = gramsToUnit(grams, 'oz');
    assert.ok(Math.abs(back - spot) < 1e-9 * Math.max(1, spot), `oz round trip for ${spot}`);
  }
});

test('conversions: per-kg is exactly per-gram * 1000 across the sweep', () => {
  const { toGrams } = weightUnits;
  assert.strictEqual(weightUnits.UNIT_TO_GRAMS.kg, 1000);
  for (const spot of sweepValues()) {
    const perGram = spot / CONSTANTS.TROY_OZ_GRAMS;
    const perKg = perGram * toGrams(1, 'kg');
    assert.ok(Math.abs(perKg - perGram * 1000) < 1e-9 * Math.max(1, perKg), `kg for ${spot}`);
  }
});

test('conversions: every exposed weight unit round-trips through grams', () => {
  const { UNIT_TO_GRAMS, toGrams, gramsToUnit } = weightUnits;
  const units = Object.keys(UNIT_TO_GRAMS);
  assert.ok(units.includes('tola'), 'tola supported by weight-units');
  assert.strictEqual(UNIT_TO_GRAMS.tola, 11.6638);
  assert.strictEqual(UNIT_TO_GRAMS.oz, CONSTANTS.TROY_OZ_GRAMS, 'oz uses the shared client troy');
  for (const unit of units) {
    for (const amount of sweepValues()) {
      const back = gramsToUnit(toGrams(amount, unit), unit);
      assert.ok(Math.abs(back - amount) < 1e-9 * Math.max(1, amount), `${unit} for ${amount}`);
    }
  }
});

test('conversions: derived per-gram price scales linearly with spot (homogeneity)', () => {
  for (const spot of sweepValues()) {
    const d1 = spotResolver.deriveFromSpot(spot);
    const d2 = spotResolver.deriveFromSpot(spot * 2);
    assert.ok(d1 && d2, `derivations succeed for ${spot}`);
    assert.ok(
      Math.abs(d2.aedPerGram24k - 2 * d1.aedPerGram24k) < 1e-9 * Math.max(1, d2.aedPerGram24k),
      `doubling spot doubles AED/g (${spot})`
    );
  }
});

// ── data/gold_price.json pipeline contract ──────────────────────────────────

test('data contract: committed gold_price.json honors pipeline math within 0.005', () => {
  const file = path.resolve(__dirname, '..', 'data', 'gold_price.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));

  const xau = data.xau_usd_per_oz;
  assert.ok(Number.isFinite(xau) && xau > 0, 'xau_usd_per_oz present and positive');
  assert.strictEqual(data.aed_peg, 3.6725, 'committed aed_peg field is exactly the peg');

  // Pipeline troy value — NOT the client rounded 31.1035.
  const usdPerGram24k = xau / PIPELINE_TROY_OZ_GRAMS;
  const aedPerGram24k = usdPerGram24k * AED_PEG;

  assert.ok(
    Math.abs(data.usd_per_gram_24k - usdPerGram24k) < 0.005,
    `usd_per_gram_24k: file=${data.usd_per_gram_24k} recomputed=${usdPerGram24k}`
  );
  assert.ok(
    Math.abs(data.aed_per_gram_24k - aedPerGram24k) < 0.005,
    `aed_per_gram_24k: file=${data.aed_per_gram_24k} recomputed=${aedPerGram24k}`
  );

  const karats = data.karats_aed_per_gram;
  assert.ok(karats && typeof karats === 'object', 'karats_aed_per_gram present');
  const entries = Object.entries(karats);
  assert.ok(entries.length >= 4, 'at least 24k/22k/21k/18k present');
  for (const [key, value] of entries) {
    const code = Number(String(key).replace(/k$/i, ''));
    assert.ok(Number.isFinite(code) && code > 0 && code <= 24, `karat key parses: ${key}`);
    const expected = aedPerGram24k * (code / 24);
    assert.ok(
      Math.abs(value - expected) < 0.005,
      `${key}: file=${value} recomputed=${expected} (purity ${code}/24)`
    );
  }
});
