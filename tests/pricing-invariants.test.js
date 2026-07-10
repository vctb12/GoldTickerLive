'use strict';

/**
 * Pricing-invariant regression lock — pins the immutable trust constants at their single source of
 * truth AND proves the user-facing methodology/disclaimer copy stays in sync with them.
 *
 * Why this is separate from `pricing-engine.test.js`: that suite hard-codes its OWN local copies of
 * the peg / troy-ounce constants to exercise the formula, so it would NOT catch a wrong value edited
 * into `src/config/constants.js`. This suite asserts the real exported constants, the karat purity
 * derivation, and — critically — that no translation string can quote a peg/troy number that has
 * drifted away from the constant (the "methodology must match the actual calculation" trust rule).
 *
 * Immutable per the operating contract: AED/USD peg = 3.6725 (fixed, not a live rate); troy ounce =
 * 31.1035 g as used site-wide. Karat purity is derived (code/24), never a magic literal.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const CONSTANTS_URL = new URL('../src/config/constants.js', `file://${__filename}`).href;
const KARATS_URL = new URL('../src/config/karats.js', `file://${__filename}`).href;
const CFG_URL = new URL('../src/config/index.js', `file://${__filename}`).href;

test('constants: AED/USD peg is exactly 3.6725 (fixed central-bank peg, not a live rate)', async () => {
  const { CONSTANTS } = await import(CONSTANTS_URL);
  assert.equal(CONSTANTS.AED_PEG, 3.6725);
  // String form guards against a value that is numerically-close but printed differently in copy.
  assert.equal(String(CONSTANTS.AED_PEG), '3.6725');
});

test('constants: troy ounce is exactly 31.1035 g (as used site-wide)', async () => {
  const { CONSTANTS } = await import(CONSTANTS_URL);
  assert.equal(CONSTANTS.TROY_OZ_GRAMS, 31.1035);
  assert.equal(String(CONSTANTS.TROY_OZ_GRAMS), '31.1035');
});

test('karats: purity is derived from the karat code (code/24), never a drifted literal', async () => {
  const { KARATS } = await import(KARATS_URL);
  assert.ok(Array.isArray(KARATS) && KARATS.length > 0);
  for (const k of KARATS) {
    const expected = Number(k.code) / 24;
    assert.equal(k.purity, expected, `purity for ${k.code}K must equal ${k.code}/24`);
    assert.ok(k.purity > 0 && k.purity <= 1, `purity for ${k.code}K out of (0,1]`);
  }
  // 24K is pure gold — purity exactly 1.0.
  const k24 = KARATS.find((k) => k.code === '24');
  assert.ok(k24, '24K must exist');
  assert.equal(k24.purity, 1.0);
});

test('trust copy: every peg number quoted in EN/AR copy matches the AED_PEG constant', async () => {
  const { CONSTANTS } = await import(CONSTANTS_URL);
  const { TRANSLATIONS } = await import(CFG_URL);
  const pegStr = String(CONSTANTS.AED_PEG); // '3.6725'

  for (const loc of ['en', 'ar']) {
    const values = Object.values(TRANSLATIONS[loc] || {}).filter((v) => typeof v === 'string');
    // Any 3.67xx-shaped token anywhere in the copy must be exactly the peg — no typo'd variants.
    const variants = [...new Set(values.flatMap((v) => v.match(/3\.67\d\d/g) || []))];
    assert.deepEqual(
      variants,
      [pegStr],
      `${loc}: peg copy drifted from constant ${pegStr} (found ${JSON.stringify(variants)})`
    );
    // The peg must actually be cited somewhere (disclaimer can't silently drop it).
    assert.ok(variants.length === 1, `${loc}: peg 3.6725 must be cited in trust copy`);
  }
});

test('trust copy: every troy-gram number quoted in EN/AR copy matches the TROY_OZ_GRAMS constant', async () => {
  const { CONSTANTS } = await import(CONSTANTS_URL);
  const { TRANSLATIONS } = await import(CFG_URL);
  const gramStr = String(CONSTANTS.TROY_OZ_GRAMS); // '31.1035'

  for (const loc of ['en', 'ar']) {
    const values = Object.values(TRANSLATIONS[loc] || {}).filter((v) => typeof v === 'string');
    const variants = [...new Set(values.flatMap((v) => v.match(/31\.10\d\d?/g) || []))];
    assert.deepEqual(
      variants,
      [gramStr],
      `${loc}: gram-conversion copy drifted from constant ${gramStr} (found ${JSON.stringify(
        variants
      )})`
    );
  }
});
