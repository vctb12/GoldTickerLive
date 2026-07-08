'use strict';

/**
 * Price audit trail (Phase 49) — proves the derivation is transparent, reproducible, and IDENTICAL to
 * the live pricing layer: spot ÷ 31.1035 × purity × FX, AED via the 3.6725 peg. Cross-checked against
 * both the raw formula and `resolveMetalGramPrice` so the audited number is the displayed number.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const MOD = new URL('../src/lib/price-audit-trail.js', `file://${__filename}`).href;
const PRICING = new URL('../src/lib/metal-pricing.js', `file://${__filename}`).href;
const CFG = new URL('../src/config/index.js', `file://${__filename}`).href;

const round4 = (v) => Math.round(v * 1e4) / 1e4;

test('audit: constants are the immutable peg + troy-oz (unchanged)', async () => {
  const { CONSTANTS } = await import(CFG);
  assert.equal(CONSTANTS.TROY_OZ_GRAMS, 31.1035);
  assert.equal(CONSTANTS.AED_PEG, 3.6725);
});

test('audit: 24K AED trail reproduces the raw formula step-by-step', async () => {
  const { buildPriceAuditTrail } = await import(MOD);
  const spot = 4053.7;
  const trail = buildPriceAuditTrail({ spotUsdPerOz: spot, purity: 1, karatCode: '24' });
  assert.equal(trail.status, 'ok');
  assert.equal(trail.currency, 'AED');
  assert.equal(trail.isAedPeg, true);
  assert.equal(trail.fxRate, 3.6725);
  // Steps: spot → per-gram(÷31.1035) → purity(×1) → fx(×3.6725)
  assert.deepEqual(
    trail.steps.map((s) => s.key),
    ['spot', 'per-gram', 'purity', 'fx']
  );
  assert.match(trail.steps[1].operation, /÷ 31\.1035/);
  assert.match(trail.steps[3].operation, /× 3\.6725/);
  assert.match(trail.steps[3].operation, /fixed peg/i);
  // Final equals the raw formula.
  assert.equal(trail.finalPerGram, round4((spot / 31.1035) * 1 * 3.6725));
});

test('audit: final matches the LIVE pricing layer (resolveMetalGramPrice)', async () => {
  const { buildPriceAuditTrail } = await import(MOD);
  const { resolveMetalGramPrice } = await import(PRICING);
  const spot = 4053.7;
  const live = resolveMetalGramPrice('gold', '24', { gold: spot });
  assert.equal(live.state, 'ok');
  const trail = buildPriceAuditTrail({ spotUsdPerOz: spot, purity: 1, karatCode: '24' });
  assert.equal(trail.finalPerGram, round4(live.aedPerGram)); // audited == displayed AED/g
  assert.equal(trail.steps[2].output, round4(live.usdPerGram)); // purity step == displayed USD/g
});

test('audit: 22K in USD (fxRate 1) — no peg note, correct purity', async () => {
  const { buildPriceAuditTrail } = await import(MOD);
  const spot = 4000;
  const trail = buildPriceAuditTrail({
    spotUsdPerOz: spot,
    purity: 22 / 24,
    karatCode: '22',
    currency: 'USD',
    fxRate: 1,
  });
  assert.equal(trail.currency, 'USD');
  assert.equal(trail.isAedPeg, false);
  assert.doesNotMatch(trail.steps[3].operation, /peg/i);
  assert.equal(trail.finalPerGram, round4((spot / 31.1035) * (22 / 24) * 1));
});

test('audit: reproducible — chaining the step outputs lands on the final', async () => {
  const { buildPriceAuditTrail } = await import(MOD);
  const trail = buildPriceAuditTrail({ spotUsdPerOz: 4149, purity: 21 / 24, karatCode: '21' });
  // Recompute from the raw spot through each documented operation.
  const chained = round4((4149 / 31.1035) * (21 / 24) * 3.6725);
  assert.equal(trail.finalPerGram, chained);
});

test('audit: AED defaults to the fixed peg when no fxRate is given', async () => {
  const { buildPriceAuditTrail } = await import(MOD);
  const trail = buildPriceAuditTrail({ spotUsdPerOz: 4000, purity: 1 });
  assert.equal(trail.fxRate, 3.6725);
});

test('audit: invalid inputs → unavailable (no fabricated numbers)', async () => {
  const { buildPriceAuditTrail } = await import(MOD);
  assert.equal(buildPriceAuditTrail({ spotUsdPerOz: 0, purity: 1 }).status, 'unavailable');
  assert.equal(buildPriceAuditTrail({ spotUsdPerOz: 4000, purity: 0 }).status, 'unavailable');
  assert.equal(buildPriceAuditTrail({ spotUsdPerOz: 4000, purity: 1.5 }).status, 'unavailable'); // >1
  assert.equal(
    buildPriceAuditTrail({ spotUsdPerOz: 4000, purity: 1, currency: 'EUR', fxRate: 0 }).status,
    'unavailable'
  );
  // Even unavailable carries the framing.
  assert.match(buildPriceAuditTrail({}).disclaimer, /not financial advice/i);
});

test('audit: Arabic localisation + reference-estimate framing; render is human-readable', async () => {
  const { buildPriceAuditTrail, renderPriceAuditTrail } = await import(MOD);
  const trail = buildPriceAuditTrail(
    { spotUsdPerOz: 4053.7, purity: 1, karatCode: '24' },
    { lang: 'ar' }
  );
  assert.match(trail.disclaimer, /نصيحة مالية/);
  assert.equal(trail.steps[0].label, 'السعر الفوري المباشر');
  const text = renderPriceAuditTrail(trail, { lang: 'ar' });
  assert.match(text, /÷ 31\.1035/);
  assert.match(text, /= /);
});
