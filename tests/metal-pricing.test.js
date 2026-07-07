'use strict';

/**
 * Metal pricing-resolution layer — proves gold is unaffected and the silver pilot is safely gated.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const PRICING = new URL('../src/lib/metal-pricing.js', `file://${__filename}`).href;
const METALS = new URL('../src/config/metals.js', `file://${__filename}`).href;
const CONST = new URL('../src/config/constants.js', `file://${__filename}`).href;
const FLAGS = new URL('../src/config/metals-flags.js', `file://${__filename}`).href;

test('metal-pricing: pilot flag ships OFF', async () => {
  const { METALS_PILOT_ENABLED } = await import(FLAGS);
  assert.equal(METALS_PILOT_ENABLED, false);
});

test('metal-pricing: only gold is offered while the pilot is off', async () => {
  const { availableMetalKeys } = await import(PRICING);
  assert.deepEqual(availableMetalKeys(), ['gold']);
  assert.deepEqual(availableMetalKeys({ pilotEnabled: true }), [
    'gold',
    'silver',
    'platinum',
    'palladium',
  ]);
});

test('metal-pricing: gold prices identically to the registry formula', async () => {
  const { resolveMetalGramPrice } = await import(PRICING);
  const { metalUsdPerGram, usdToAedPerGram } = await import(METALS);
  const spot = 4149.0;
  const r = resolveMetalGramPrice('gold', '22', { gold: spot });
  assert.equal(r.state, 'ok');
  assert.equal(r.metal, 'gold');
  assert.equal(r.purity, '22');
  assert.equal(r.usdPerGram, metalUsdPerGram(spot, 22 / 24));
  assert.equal(r.aedPerGram, usdToAedPerGram(metalUsdPerGram(spot, 22 / 24)));
});

test('metal-pricing: gold 24K matches the direct value (byte-identical)', async () => {
  const { resolveMetalGramPrice } = await import(PRICING);
  const { CONSTANTS } = await import(CONST);
  const spot = 3333.33;
  const r = resolveMetalGramPrice('gold', '24', { gold: spot });
  assert.equal(r.usdPerGram, (spot * 1.0) / CONSTANTS.TROY_OZ_GRAMS);
});

test('metal-pricing: silver is disabled while the pilot is off', async () => {
  const { resolveMetalGramPrice } = await import(PRICING);
  const r = resolveMetalGramPrice('silver', '999', { gold: 4149, silver: 33 });
  assert.equal(r.state, 'disabled');
  assert.equal(r.metal, 'silver');
});

test('metal-pricing: silver prices when the pilot is on and data exists', async () => {
  const { resolveMetalGramPrice } = await import(PRICING);
  const { metalUsdPerGram } = await import(METALS);
  const r = resolveMetalGramPrice('silver', '925', { silver: 33.0 }, { pilotEnabled: true });
  assert.equal(r.state, 'ok');
  assert.equal(r.usdPerGram, metalUsdPerGram(33.0, 0.925));
});

test('metal-pricing: enabled metal with no spot feed is pending-data (not a fake price)', async () => {
  const { resolveMetalGramPrice } = await import(PRICING);
  const r = resolveMetalGramPrice('platinum', '999', { gold: 4149 }, { pilotEnabled: true });
  assert.equal(r.state, 'pending-data');
  assert.equal(r.usdPerGram, undefined);
});

test('metal-pricing: gold with no spot feed is pending-data', async () => {
  const { resolveMetalGramPrice } = await import(PRICING);
  const r = resolveMetalGramPrice('gold', '24', {});
  assert.equal(r.state, 'pending-data');
});
