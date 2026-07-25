'use strict';

/**
 * Dedicated anomaly-detector regression tests.
 *
 * ai-drafts.test.js covers stale/fallback flags but raises
 * ANOMALY_SPIKE_THRESHOLD_PCT to 999 so spike/extreme paths never fire.
 * This file reloads the module with production-like thresholds and pins
 * the price-movement rules that gate AI draft generation.
 */

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const MODULE_PATH = path.resolve(__dirname, '../server/lib/anomaly-detector');

const PREV_ENV = {
  ANOMALY_SPIKE_THRESHOLD_PCT: process.env.ANOMALY_SPIKE_THRESHOLD_PCT,
  ANOMALY_DRIFT_THRESHOLD_PCT: process.env.ANOMALY_DRIFT_THRESHOLD_PCT,
  ANOMALY_EXTREME_THRESHOLD_PCT: process.env.ANOMALY_EXTREME_THRESHOLD_PCT,
};

let detectAnomaly;
let _extractPriceUsdOz;
let _pctChange;
let SPIKE_THRESHOLD_PCT;
let EXTREME_THRESHOLD_PCT;

function restoreEnv() {
  for (const [key, value] of Object.entries(PREV_ENV)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

before(() => {
  process.env.ANOMALY_SPIKE_THRESHOLD_PCT = '3';
  process.env.ANOMALY_DRIFT_THRESHOLD_PCT = '8';
  process.env.ANOMALY_EXTREME_THRESHOLD_PCT = '15';
  delete require.cache[MODULE_PATH];
  ({
    detectAnomaly,
    _extractPriceUsdOz,
    _pctChange,
    SPIKE_THRESHOLD_PCT,
    EXTREME_THRESHOLD_PCT,
  } = require(MODULE_PATH));
});

after(() => {
  restoreEnv();
  delete require.cache[MODULE_PATH];
});

describe('anomaly-detector thresholds (dedicated reload)', () => {
  test('loads production-like spike and extreme thresholds', () => {
    assert.equal(SPIKE_THRESHOLD_PCT, 3);
    assert.equal(EXTREME_THRESHOLD_PCT, 15);
  });

  test('_extractPriceUsdOz prefers xau_usd_per_oz then gold.ask_usd / bid_usd', () => {
    assert.equal(_extractPriceUsdOz({ xau_usd_per_oz: 2100 }), 2100);
    assert.equal(_extractPriceUsdOz({ gold: { ask_usd: 2111 } }), 2111);
    assert.equal(_extractPriceUsdOz({ gold: { bid_usd: 2099 } }), 2099);
    assert.equal(_extractPriceUsdOz({ gold: { ask_usd: 0, bid_usd: 2050 } }), 2050);
    assert.equal(_extractPriceUsdOz({ gold: { ask_usd: -1, bid_usd: 'nope' } }), null);
  });

  test('_pctChange handles zero-to-zero and invalid inputs', () => {
    assert.equal(_pctChange(0, 0), 0);
    assert.equal(_pctChange(0, 100), null);
    assert.equal(_pctChange(NaN, 100), null);
    assert.equal(_pctChange(1000, 1100), 10);
  });

  test('detectAnomaly: clean fresh move under spike threshold is not flagged', () => {
    const result = detectAnomaly(
      { xau_usd_per_oz: 2020, is_fresh: true, is_fallback: false },
      { xau_usd_per_oz: 2000 }
    );
    // 1% move — below 3% spike threshold
    assert.equal(result.anomaly_flag, false);
    assert.equal(result.anomaly_detail, null);
    assert.deepEqual(result.anomaly_reasons, []);
    assert.equal(result.current_price_usd_oz, 2020);
    assert.equal(result.prev_price_usd_oz, 2000);
    assert.ok(Math.abs(result.pct_change - 1) < 0.0001);
    assert.equal(result.is_fresh, true);
    assert.equal(result.provider_fallback, false);
  });

  test('detectAnomaly: flags single-step spike at/above SPIKE threshold', () => {
    const result = detectAnomaly(
      { xau_usd_per_oz: 2060, is_fresh: true, is_fallback: false },
      { xau_usd_per_oz: 2000 }
    );
    // 3% exactly — must flag
    assert.equal(result.anomaly_flag, true);
    assert.ok(
      result.anomaly_reasons.some((r) => /changed 3\.00%/.test(r)),
      `expected spike reason, got: ${result.anomaly_reasons.join(' | ')}`
    );
    assert.ok(!result.anomaly_reasons.some((r) => /Extreme move/.test(r)));
  });

  test('detectAnomaly: flags extreme move separately from spike', () => {
    const result = detectAnomaly(
      { xau_usd_per_oz: 2320, is_fresh: true, is_fallback: false },
      { xau_usd_per_oz: 2000 }
    );
    // 16% — both spike and extreme
    assert.equal(result.anomaly_flag, true);
    assert.ok(result.anomaly_reasons.some((r) => /threshold: ±3%/.test(r)));
    assert.ok(result.anomaly_reasons.some((r) => /Extreme move detected: 16\.00%/.test(r)));
    assert.equal(result.anomaly_reasons.length >= 2, true);
  });

  test('detectAnomaly: downward spike is flagged the same as upward', () => {
    const result = detectAnomaly(
      { xau_usd_per_oz: 1940, is_fresh: true, is_fallback: false },
      { xau_usd_per_oz: 2000 }
    );
    // -3%
    assert.equal(result.anomaly_flag, true);
    assert.ok(result.anomaly_reasons.some((r) => /changed -3\.00%/.test(r)));
  });

  test('detectAnomaly: combines stale + fallback reasons when both set', () => {
    const result = detectAnomaly(
      { xau_usd_per_oz: 2000, is_fresh: false, is_fallback: true },
      { xau_usd_per_oz: 2000 }
    );
    assert.equal(result.anomaly_flag, true);
    assert.equal(result.is_fresh, false);
    assert.equal(result.provider_fallback, true);
    assert.ok(result.anomaly_reasons.some((r) => /stale/i.test(r)));
    assert.ok(result.anomaly_reasons.some((r) => /fallback provider/i.test(r)));
  });
});
