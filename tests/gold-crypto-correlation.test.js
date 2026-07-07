'use strict';

/**
 * Gold-crypto correlation view model. Proves the pilot ships gated OFF, that the flag-independent
 * core assembles ok / insufficient-data / unknown-asset states from real records, that the strength
 * and direction bands classify correctly, and that the descriptive-only disclaimer always travels.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const MOD = new URL('../src/lib/gold-crypto-correlation.js', `file://${__filename}`).href;

const NOT_A_PREDICTION = /not a prediction/i;

// A small pair of series with a known-positive relationship.
const GOLD = [
  { date: '2026-01-01', price: 4000 },
  { date: '2026-02-01', price: 4100 },
  { date: '2026-03-01', price: 4200 },
  { date: '2026-04-01', price: 4300 },
];
const CRYPTO_UP = [
  { date: '2026-01-01', price: 40000 },
  { date: '2026-02-01', price: 44000 },
  { date: '2026-03-01', price: 48000 },
  { date: '2026-04-01', price: 52000 },
];

test('correlation: pilot ships gated OFF (buildCorrelationView → disabled)', async () => {
  const { buildCorrelationView } = await import(MOD);
  const view = buildCorrelationView(GOLD, CRYPTO_UP);
  assert.equal(view.status, 'disabled');
  assert.equal(view.reason, 'pilot-disabled');
  assert.match(view.disclaimer, NOT_A_PREDICTION);
});

test('correlation: core builds an ok model with a perfect positive coefficient', async () => {
  const { computeCorrelationModel } = await import(MOD);
  const model = computeCorrelationModel(GOLD, CRYPTO_UP, { assetKey: 'btc' });
  assert.equal(model.status, 'ok');
  assert.equal(model.assetKey, 'btc');
  assert.equal(model.sampleSize, 4);
  assert.equal(model.coefficient, 1);
  assert.equal(model.strength.key, 'very-strong');
  assert.equal(model.direction.key, 'positive');
  assert.match(model.framing, /Bitcoin/);
  assert.match(model.disclaimer, NOT_A_PREDICTION);
});

test('correlation: inverse series classify as inverse direction', async () => {
  const { computeCorrelationModel } = await import(MOD);
  const cryptoDown = [
    { date: '2026-01-01', price: 52000 },
    { date: '2026-02-01', price: 48000 },
    { date: '2026-03-01', price: 44000 },
    { date: '2026-04-01', price: 40000 },
  ];
  const model = computeCorrelationModel(GOLD, cryptoDown, { assetKey: 'btc' });
  assert.equal(model.coefficient, -1);
  assert.equal(model.direction.key, 'inverse');
  assert.equal(model.strength.key, 'very-strong');
});

test('correlation: too few shared dates → insufficient-data', async () => {
  const { computeCorrelationModel } = await import(MOD);
  const model = computeCorrelationModel(
    GOLD,
    [{ date: '2026-01-01', price: 40000 }], // only 1 shared date
    { assetKey: 'btc' }
  );
  assert.equal(model.status, 'insufficient-data');
  assert.equal(model.sampleSize, 1);
  assert.match(model.disclaimer, NOT_A_PREDICTION);
});

test('correlation: flat crypto series (no variance) → insufficient-data, not r=0', async () => {
  const { computeCorrelationModel } = await import(MOD);
  const flat = GOLD.map((g) => ({ date: g.date, price: 45000 }));
  const model = computeCorrelationModel(GOLD, flat, { assetKey: 'btc' });
  assert.equal(model.status, 'insufficient-data');
});

test('correlation: unknown asset → unavailable', async () => {
  const { computeCorrelationModel } = await import(MOD);
  const model = computeCorrelationModel(GOLD, CRYPTO_UP, { assetKey: 'doge' });
  assert.equal(model.status, 'unavailable');
  assert.equal(model.reason, 'unknown-asset');
});

test('correlation: Arabic model localises strength, direction, and disclaimer', async () => {
  const { computeCorrelationModel } = await import(MOD);
  const model = computeCorrelationModel(GOLD, CRYPTO_UP, { assetKey: 'btc', lang: 'ar' });
  assert.equal(model.status, 'ok');
  assert.equal(model.strength.label, 'قوية جدًا');
  assert.equal(model.direction.label, 'يتحركان معًا');
  assert.match(model.framing, /بيتكوين/);
  assert.match(model.disclaimer, /الارتباط لا يعني السببية/);
});

test('correlation: rolling series present and defaults to a 12-point window', async () => {
  const { computeCorrelationModel, DEFAULT_ROLLING_WINDOW } = await import(MOD);
  assert.equal(DEFAULT_ROLLING_WINDOW, 12);
  const model = computeCorrelationModel(GOLD, CRYPTO_UP, { assetKey: 'btc', window: 3 });
  assert.ok(Array.isArray(model.rolling));
  // 4 aligned points, window 3 → 2 rolling entries, both perfectly correlated.
  assert.equal(model.rolling.length, 2);
  assert.ok(model.rolling.every((r) => r.coefficient === 1));
});
