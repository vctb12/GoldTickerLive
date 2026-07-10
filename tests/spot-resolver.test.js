'use strict';

/**
 * Canonical spot-resolver regression lock (F-1). Proves the single-source
 * derivation is deterministic and invariant-correct: every karat value flows
 * from ONE spot via peg 3.6725, troy 31.1035 g, purity = code/24 — so every
 * homepage surface that reads the resolver shows the same number.
 *
 * ESM module under test is loaded via dynamic import (package is CommonJS).
 */
const { test, before } = require('node:test');
const assert = require('node:assert/strict');

let R;
before(async () => {
  R = await import('../src/lib/spot-resolver.js');
});

const SPOT = 4107.2002; // matches data/gold_price.json sample
const TROY = 31.1035;
const PEG = 3.6725;

test('deriveFromSpot: 24K derivation uses troy 31.1035 and peg 3.6725 exactly', () => {
  const d = R.deriveFromSpot(SPOT);
  assert.ok(d, 'derivation should succeed for a valid spot');
  const expectedUsd = SPOT / TROY;
  const expectedAed = expectedUsd * PEG;
  assert.ok(Math.abs(d.usdPerGram24k - expectedUsd) < 1e-9, 'usd/g 24k = spot / 31.1035');
  assert.ok(Math.abs(d.aedPerGram24k - expectedAed) < 1e-9, 'aed/g 24k = usd/g * 3.6725');
  // sanity against the committed data file value (484.952)
  assert.ok(Math.abs(d.aedPerGram24k - 484.952) < 0.01, 'matches committed aed_per_gram_24k');
});

test('deriveFromSpot: every karat purity is exactly code/24 and scales linearly', () => {
  const d = R.deriveFromSpot(SPOT);
  for (const k of d.karats) {
    const expectedPurity = Number(k.code) / 24;
    assert.ok(Math.abs(k.purity - expectedPurity) < 1e-12, `${k.code}K purity = ${k.code}/24`);
    assert.ok(
      Math.abs(k.aedPerGram - d.aedPerGram24k * expectedPurity) < 1e-9,
      `${k.code}K aed/g = 24K * purity`
    );
    assert.ok(
      Math.abs(k.usdPerGram - d.usdPerGram24k * expectedPurity) < 1e-9,
      `${k.code}K usd/g = 24K * purity`
    );
  }
});

test('deriveFromSpot: rejects non-finite / non-positive spot', () => {
  assert.equal(R.deriveFromSpot(0), null);
  assert.equal(R.deriveFromSpot(-5), null);
  assert.equal(R.deriveFromSpot(NaN), null);
  assert.equal(R.deriveFromSpot('abc'), null);
  assert.equal(R.deriveFromSpot(undefined), null);
});

test('karatPerGram: looks up a specific karat in AED and USD', () => {
  const d = R.deriveFromSpot(SPOT);
  const aed22 = R.karatPerGram(d, '22', 'aed');
  assert.ok(Math.abs(aed22 - d.aedPerGram24k * (22 / 24)) < 1e-9);
  const usd18 = R.karatPerGram(d, 18, 'usd');
  assert.ok(Math.abs(usd18 - d.usdPerGram24k * (18 / 24)) < 1e-9);
  assert.equal(R.karatPerGram(d, '99', 'aed'), null, 'unknown karat → null');
  assert.equal(R.karatPerGram(null, '24'), null, 'null snapshot → null');
});

test('classifyFreshness: fresh committed file → live', () => {
  const f = R.classifyFreshness({
    price: SPOT,
    source: 'gold_api_com',
    isFresh: true,
    isFallback: false,
    freshnessSeconds: 27,
    maxFreshnessSeconds: 900,
    updatedAt: '2026-07-10T11:06:54Z',
  });
  assert.equal(f.state, 'live');
  assert.equal(f.isFallback, false);
});

test('classifyFreshness: never mislabels — fallback / delayed / cached / unavailable', () => {
  assert.equal(
    R.classifyFreshness({ price: SPOT, isFallback: true, source: 'gold_api_com' }).state,
    'fallback'
  );
  assert.equal(
    R.classifyFreshness({ price: SPOT, source: 'cache-fallback' }).state,
    'cached',
    'localStorage cache fallback → cached'
  );
  assert.equal(
    R.classifyFreshness({
      price: SPOT,
      isFresh: false,
      freshnessSeconds: 1200,
      maxFreshnessSeconds: 900,
    }).state,
    'delayed',
    'explicit is_fresh:false downgrades'
  );
  assert.equal(
    R.classifyFreshness({ price: SPOT, freshnessSeconds: 5000, maxFreshnessSeconds: 900 }).state,
    'cached',
    'well beyond max age → cached'
  );
  assert.equal(R.classifyFreshness(null).state, 'unavailable');
  assert.equal(R.classifyFreshness({ price: NaN }).state, 'unavailable');
});

test('buildSnapshot: ok snapshot carries derivation + freshness; bad price → not ok', () => {
  const ok = R.buildSnapshot({
    price: SPOT,
    source: 'gold_api_com',
    isFresh: true,
    isFallback: false,
    freshnessSeconds: 27,
    maxFreshnessSeconds: 900,
  });
  assert.equal(ok.ok, true);
  assert.equal(ok.karats.length, 7);
  assert.equal(ok.freshness.state, 'live');

  const bad = R.buildSnapshot({ price: null });
  assert.equal(bad.ok, false);
  assert.deepEqual(bad.karats, []);
});
