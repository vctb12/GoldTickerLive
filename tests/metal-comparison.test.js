'use strict';

/**
 * Multi-metal comparison view-model (Phase 56, Theme B). Proves the model is honest about which
 * metals have a feed (ok / pending-data / disabled), never fabricates a non-gold price, keeps gold's
 * numbers byte-identical to the live pricing path, and mounts nothing while the pilot is OFF.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const MOD = new URL('../src/lib/metal-comparison.js', `file://${__filename}`).href;
const PRICING = new URL('../src/lib/metal-pricing.js', `file://${__filename}`).href;
const CFG = new URL('../src/config/index.js', `file://${__filename}`).href;

const GOLD_SPOT = 4053.7;

test('comparison: pilot OFF → only gold prices; non-gold are disabled (no fabricated prices)', async () => {
  const { buildMetalComparison } = await import(MOD);
  const model = buildMetalComparison({ gold: GOLD_SPOT }, { pilotEnabled: false });
  assert.equal(model.pilotEnabled, false);
  const byKey = Object.fromEntries(model.rows.map((r) => [r.key, r]));
  assert.equal(byKey.gold.state, 'ok');
  assert.ok(byKey.gold.usdPerGram > 0);
  for (const key of ['silver', 'platinum', 'palladium']) {
    assert.equal(byKey[key].state, 'disabled');
    assert.equal(byKey[key].usdPerGram, null);
    assert.equal(byKey[key].aedPerGram, null);
  }
});

test('comparison: pilot ON → metals with a feed price; metals without one are pending-data', async () => {
  const { buildMetalComparison } = await import(MOD);
  const model = buildMetalComparison(
    { gold: GOLD_SPOT, silver: 48.2 }, // platinum/palladium have no feed
    { pilotEnabled: true }
  );
  assert.equal(model.pilotEnabled, true);
  const byKey = Object.fromEntries(model.rows.map((r) => [r.key, r]));
  assert.equal(byKey.gold.state, 'ok');
  assert.equal(byKey.silver.state, 'ok');
  assert.ok(byKey.silver.usdPerGram > 0);
  assert.equal(byKey.platinum.state, 'pending-data');
  assert.equal(byKey.platinum.usdPerGram, null);
  assert.equal(byKey.palladium.state, 'pending-data');
  assert.equal(byKey.palladium.aedPerGram, null);
});

test("comparison: gold row is byte-identical to resolveMetalGramPrice (gold's numbers never drift)", async () => {
  const { buildMetalComparison } = await import(MOD);
  const { resolveMetalGramPrice } = await import(PRICING);
  const gold = buildMetalComparison({ gold: GOLD_SPOT }, { pilotEnabled: true }).rows.find(
    (r) => r.key === 'gold'
  );
  const direct = resolveMetalGramPrice('gold', '24', { gold: GOLD_SPOT });
  assert.equal(gold.usdPerGram, direct.usdPerGram);
  assert.equal(gold.aedPerGram, direct.aedPerGram);
});

test('comparison: constants untouched; rows are gold-first', async () => {
  const { buildMetalComparison } = await import(MOD);
  const { CONSTANTS } = await import(CFG);
  assert.equal(CONSTANTS.TROY_OZ_GRAMS, 31.1035);
  assert.equal(CONSTANTS.AED_PEG, 3.6725);
  const model = buildMetalComparison({ gold: GOLD_SPOT }, { pilotEnabled: true });
  assert.equal(model.rows[0].key, 'gold');
  assert.equal(model.rows[0].primary, true);
});

test('comparison: normalizeSpotMap drops non-finite / non-positive feeds', async () => {
  const { normalizeSpotMap } = await import(MOD);
  assert.deepEqual(
    normalizeSpotMap({ gold: 4000, silver: 0, platinum: -5, palladium: NaN, x: 'abc' }),
    {
      gold: 4000,
    }
  );
  // A corrupt gold feed → pending-data downstream, never a fabricated price.
  const { buildMetalComparison } = await import(MOD);
  const model = buildMetalComparison({ gold: 'bad' }, { pilotEnabled: true });
  assert.equal(model.rows.find((r) => r.key === 'gold').state, 'pending-data');
});

test('comparison: render is empty while pilot OFF, non-empty and framed when ON', async () => {
  const { buildMetalComparison, renderMetalComparison } = await import(MOD);
  const off = buildMetalComparison({ gold: GOLD_SPOT }, { pilotEnabled: false });
  assert.equal(renderMetalComparison(off), '');
  const on = buildMetalComparison({ gold: GOLD_SPOT, silver: 48.2 }, { pilotEnabled: true });
  const text = renderMetalComparison(on);
  assert.match(text, /Gold/);
  assert.match(text, /awaiting data/i); // platinum/palladium without a feed
  assert.match(text, /not financial advice/i);
});

test('comparison: Arabic localisation + reference-estimate framing', async () => {
  const { buildMetalComparison } = await import(MOD);
  const model = buildMetalComparison({ gold: GOLD_SPOT }, { pilotEnabled: true, lang: 'ar' });
  assert.equal(model.rows[0].name, 'الذهب');
  assert.match(model.disclaimer, /نصيحة مالية/);
});

test('comparison: isMetalComparisonEnabled reflects the pilot flag (default OFF)', async () => {
  const { isMetalComparisonEnabled } = await import(MOD);
  assert.equal(isMetalComparisonEnabled(), false); // METALS_PILOT_ENABLED default
  assert.equal(isMetalComparisonEnabled({ pilotEnabled: true }), true);
});
