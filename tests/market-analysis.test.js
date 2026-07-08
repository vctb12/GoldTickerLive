'use strict';

/**
 * Descriptive market-analysis — proves the generator is deterministic and descriptive-only: it
 * states change/range factually, classifies magnitude without predicting, always carries the
 * reference-estimate disclaimer, and never emits forecast/advice or invented-cause language.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const MOD = new URL('../src/analysis/market-analysis.js', `file://${__filename}`).href;

test('market-analysis: unavailable when price is missing or invalid', async () => {
  const { buildMarketAnalysis } = await import(MOD);
  assert.equal(buildMarketAnalysis({}).status, 'unavailable');
  assert.equal(buildMarketAnalysis({ price: 0 }).status, 'unavailable');
  assert.equal(buildMarketAnalysis({ price: -5 }).status, 'unavailable');
  // Even unavailable carries the disclaimer.
  assert.match(buildMarketAnalysis({}).disclaimer, /not financial advice/i);
});

test('market-analysis: an up move is described factually with correct magnitude', async () => {
  const { buildMarketAnalysis } = await import(MOD);
  const r = buildMarketAnalysis({ price: 4149, previous: 4100 });
  assert.equal(r.status, 'ok');
  assert.equal(r.movement.direction, 'up');
  assert.equal(r.movement.key, 'notable'); // 1.20% → notable band
  assert.ok(r.sentences.some((s) => /higher than/.test(s)));
  assert.ok(r.sentences.some((s) => /\$4,149\.00/.test(s)));
});

test('market-analysis: a down move and an unchanged reading', async () => {
  const { buildMarketAnalysis } = await import(MOD);
  const down = buildMarketAnalysis({ price: 4000, previous: 4200 });
  assert.equal(down.movement.direction, 'down');
  assert.ok(down.sentences.some((s) => /lower than/.test(s)));

  const flat = buildMarketAnalysis({ price: 4100, previous: 4100 });
  assert.equal(flat.movement.direction, 'flat');
  assert.equal(flat.movement.key, 'unchanged');
  assert.ok(flat.sentences.some((s) => /unchanged/.test(s)));
});

test('market-analysis: magnitude bands classify by |pct| only', async () => {
  const { buildMarketAnalysis } = await import(MOD);
  assert.equal(buildMarketAnalysis({ price: 4105, previous: 4100 }).movement.key, 'little-changed');
  assert.equal(buildMarketAnalysis({ price: 4120, previous: 4100 }).movement.key, 'modest');
  assert.equal(buildMarketAnalysis({ price: 4180, previous: 4100 }).movement.key, 'notable');
  assert.equal(buildMarketAnalysis({ price: 4305, previous: 4100 }).movement.key, 'sharp');
});

test('market-analysis: day-open and range sentences appear when data is present', async () => {
  const { buildMarketAnalysis } = await import(MOD);
  const r = buildMarketAnalysis({
    price: 4149,
    previous: 4100,
    dayOpen: 4120,
    high: 4200,
    low: 4050,
    rangeDays: 30,
  });
  assert.ok(r.sentences.some((s) => /session open/.test(s)));
  assert.ok(
    r.sentences.some((s) => /the last 30 days/.test(s) && /\$4,050\.00 to \$4,200\.00/.test(s))
  );
});

test('market-analysis: generated output is descriptive-only (no forecast/advice/cause)', async () => {
  const { buildMarketAnalysis, assertDescriptiveOnly } = await import(MOD);
  const r = buildMarketAnalysis({
    price: 4149,
    previous: 4000,
    dayOpen: 4120,
    high: 4200,
    low: 3900,
    rangeDays: 90,
  });
  // Never throws → no forbidden vocabulary in any sentence.
  assert.equal(assertDescriptiveOnly(r.sentences), true);
});

test('market-analysis: assertDescriptiveOnly rejects forecasts and invented causes', async () => {
  const { assertDescriptiveOnly } = await import(MOD);
  assert.throws(() => assertDescriptiveOnly('Gold will rise next week.'), /forecast\/advice/);
  assert.throws(() => assertDescriptiveOnly('A good time to buy gold.'), /forecast\/advice/);
  assert.throws(() => assertDescriptiveOnly('Analysts are bullish on gold.'), /forecast\/advice/);
  assert.throws(() => assertDescriptiveOnly('Gold rose because of inflation.'), /invented-cause/);
});

test('market-analysis: optional reason is labelled unconfirmed, not asserted as cause', async () => {
  const { buildMarketAnalysis } = await import(MOD);
  const r = buildMarketAnalysis({
    price: 4149,
    previous: 4100,
    reason: 'a stronger US dollar session',
  });
  const reasonLine = r.sentences.find((s) => /Unconfirmed context/.test(s));
  assert.ok(reasonLine, 'reason should render with an unconfirmed label');
  assert.ok(!/\bbecause\b|\bdue to\b/.test(reasonLine));
});

test('market-analysis: Arabic output localises and echoes the timestamp', async () => {
  const { buildMarketAnalysis } = await import(MOD);
  const r = buildMarketAnalysis(
    { price: 4149, previous: 4100, timestamp: '2026-07-07T10:00:00Z' },
    { lang: 'ar' }
  );
  assert.equal(r.status, 'ok');
  assert.match(r.headline, /السعر المرجعي للذهب/);
  assert.match(r.disclaimer, /ليس.*نصيحة مالية|نصيحة مالية/);
  assert.equal(r.dataTimestamp, '2026-07-07T10:00:00Z');
});
