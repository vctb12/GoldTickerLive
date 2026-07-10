'use strict';

/**
 * Karat purity-map regression lock (Phase 64, shippable-now).
 *
 * `src/lib/karatPurity.js` re-exports `KARATS` and derives `KARAT_PURITY_MAP` (karat code → purity),
 * a pricing-critical lookup — and it was untested. This suite pins that the map stays the single
 * source of truth: one entry per karat, each purity exactly `code / 24`, coupled to the canonical
 * `config/karats.js`, with no stray keys. Imports the REAL modules (no inline copy).
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const MOD = new URL('../src/lib/karatPurity.js', `file://${__filename}`).href;
const KARATS_CFG = new URL('../src/config/karats.js', `file://${__filename}`).href;

test('karatPurity: map has one entry per KARATS code, each purity = code/24', async () => {
  const { KARAT_PURITY_MAP, KARATS } = await import(MOD);
  assert.ok(KARATS.length >= 5, 'expected the full karat set');
  assert.equal(Object.keys(KARAT_PURITY_MAP).length, KARATS.length);
  for (const k of KARATS) {
    assert.equal(KARAT_PURITY_MAP[k.code], k.purity, `map value drift for ${k.code}`);
    assert.equal(KARAT_PURITY_MAP[k.code], Number(k.code) / 24, `purity != code/24 for ${k.code}`);
  }
});

test('karatPurity: 24K is pure gold (1.0) and every purity is in (0, 1]', async () => {
  const { KARAT_PURITY_MAP } = await import(MOD);
  assert.equal(KARAT_PURITY_MAP['24'], 1.0);
  for (const [code, purity] of Object.entries(KARAT_PURITY_MAP)) {
    assert.equal(typeof code, 'string');
    assert.ok(purity > 0 && purity <= 1, `purity out of range for ${code}: ${purity}`);
  }
});

test('karatPurity: re-exported KARATS is the canonical config array (coupling lock)', async () => {
  const { KARATS } = await import(MOD);
  const { KARATS: CANONICAL } = await import(KARATS_CFG);
  assert.equal(KARATS, CANONICAL); // same reference — re-export, not a copy
});

test('karatPurity: no stray keys beyond the canonical karat codes', async () => {
  const { KARAT_PURITY_MAP } = await import(MOD);
  const { KARATS: CANONICAL } = await import(KARATS_CFG);
  const canonicalCodes = new Set(CANONICAL.map((k) => k.code));
  for (const code of Object.keys(KARAT_PURITY_MAP)) {
    assert.ok(canonicalCodes.has(code), `unexpected key in purity map: ${code}`);
  }
});
