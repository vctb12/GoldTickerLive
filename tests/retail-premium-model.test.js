'use strict';

/**
 * Country/local retail-premium model (Phase 53). Proves the illustrative retail band is transparent
 * and reproduces the existing ShopVsReferencePanel math by default (reference × 1.05 .. × 1.25, no
 * VAT), layers VAT honestly when supplied, and always carries the "illustrative, not retail pricing,
 * not financial advice" framing. Pure; no fabricated per-country numbers.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const MOD = new URL('../src/lib/retail-premium-model.js', `file://${__filename}`).href;

const round2 = (v) => Math.round(v * 100) / 100;

test('premium: default band reproduces the 5–25% making-charge panel math (no VAT)', async () => {
  const { buildRetailPremiumBand, DEFAULT_MAKING_LOW, DEFAULT_MAKING_HIGH } = await import(MOD);
  assert.equal(DEFAULT_MAKING_LOW, 0.05);
  assert.equal(DEFAULT_MAKING_HIGH, 0.25);
  const ref = 250.75;
  const m = buildRetailPremiumBand({ referenceLocal: ref, currency: 'AED' });
  assert.equal(m.status, 'ok');
  assert.equal(m.low, round2(ref * 1.05));
  assert.equal(m.high, round2(ref * 1.25));
  assert.deepEqual(m.band, [m.low, m.high]);
  assert.equal(m.vatRatePct, 0);
});

test('premium: low never exceeds high', async () => {
  const { buildRetailPremiumBand } = await import(MOD);
  const m = buildRetailPremiumBand({ referenceLocal: 1000 });
  assert.ok(m.low <= m.high);
});

test('premium: VAT on full retail adds the rate on reference+making', async () => {
  const { buildRetailPremiumBand } = await import(MOD);
  const ref = 200;
  const m = buildRetailPremiumBand({ referenceLocal: ref, vatRatePct: 5 });
  // low = ref*1.05 * 1.05 ; high = ref*1.25 * 1.05
  assert.equal(m.low, round2(ref * 1.05 * 1.05));
  assert.equal(m.high, round2(ref * 1.25 * 1.05));
});

test('premium: VAT on the making charge only taxes the making amount', async () => {
  const { buildRetailPremiumBand } = await import(MOD);
  const ref = 200;
  const m = buildRetailPremiumBand({ referenceLocal: ref, vatRatePct: 5, vatOnMakingOnly: true });
  // low = ref + ref*0.05 + (ref*0.05)*0.05
  assert.equal(m.low, round2(ref + ref * 0.05 + ref * 0.05 * 0.05));
  assert.equal(m.high, round2(ref + ref * 0.25 + ref * 0.25 * 0.05));
});

test('premium: custom making band is honoured', async () => {
  const { buildRetailPremiumBand } = await import(MOD);
  const m = buildRetailPremiumBand({ referenceLocal: 100, makingLow: 0.1, makingHigh: 0.4 });
  assert.equal(m.low, 110);
  assert.equal(m.high, 140);
  assert.equal(m.makingLow, 0.1);
  assert.equal(m.makingHigh, 0.4);
});

test('premium: invalid inputs → unavailable (no fabricated band)', async () => {
  const { buildRetailPremiumBand } = await import(MOD);
  assert.equal(buildRetailPremiumBand({ referenceLocal: 0 }).status, 'unavailable');
  assert.equal(buildRetailPremiumBand({ referenceLocal: -5 }).status, 'unavailable');
  assert.equal(
    buildRetailPremiumBand({ referenceLocal: 100, makingLow: 0.3, makingHigh: 0.1 }).status,
    'unavailable'
  ); // low > high
  assert.equal(
    buildRetailPremiumBand({ referenceLocal: 100, vatRatePct: 150 }).status,
    'unavailable'
  ); // VAT > 100%
  // Even unavailable carries the framing.
  assert.match(buildRetailPremiumBand({}).disclaimer, /not financial advice/i);
});

test('premium: framing is always present (EN + AR); render is human-readable', async () => {
  const { buildRetailPremiumBand, renderRetailPremiumBand } = await import(MOD);
  const en = buildRetailPremiumBand({ referenceLocal: 300, currency: 'AED' });
  assert.match(en.disclaimer, /illustrative/i);
  assert.match(en.disclaimer, /not retail pricing/i);
  const ar = buildRetailPremiumBand({ referenceLocal: 300 }, { lang: 'ar' });
  assert.match(ar.disclaimer, /نصيحة مالية/);
  const text = renderRetailPremiumBand(en);
  assert.match(text, /Reference: 300 AED/);
  assert.match(text, /Illustrative shop range: /);
  // Unavailable render still carries the framing.
  assert.match(renderRetailPremiumBand(buildRetailPremiumBand({})), /not financial advice/i);
});
