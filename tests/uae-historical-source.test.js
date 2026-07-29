/**
 * Tests for UAE historical daily source loader.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

async function loadModule(relPath) {
  const url = new URL('file://' + path.resolve(__dirname, '..', relPath));
  return import(url.href + `?v=${Date.now()}`);
}

describe('uae-historical-source', async () => {
  const {
    fetchDailyHistoryDocument,
    loadUaeDailyKaratHistory,
    dailyRecordsToUnifiedRows,
    aedPerGramFromDailyAvg,
    getDailySourceAttribution,
  } = await loadModule('src/lib/uae-historical-source.js');

  const { CONSTANTS } = await loadModule('src/config/constants.js');
  const liveFixture = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, 'fixtures/gold-api-history/xau-usd-daily.live-fixture.json'),
      'utf8'
    )
  );
  const fixtureOnly = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, 'fixtures/gold-api-history/xau-usd-daily.fixture.json'),
      'utf8'
    )
  );

  test('fetchDailyHistoryDocument accepts live-provenance document', async () => {
    const fetchFn = async () => ({
      ok: true,
      json: async () => liveFixture,
    });
    const result = await fetchDailyHistoryDocument('/test.json', fetchFn);
    assert.equal(result.ok, true);
    assert.equal(result.meta.provider, 'gold-api.com');
    assert.equal(result.meta.freshness, 'current');
  });

  test('fetchDailyHistoryDocument rejects fixture dataOrigin', async () => {
    const fetchFn = async () => ({
      ok: true,
      json: async () => fixtureOnly,
    });
    const result = await fetchDailyHistoryDocument('/test.json', fetchFn);
    assert.equal(result.ok, false);
    assert.ok(result.errors.includes('data_origin_not_live'));
  });

  test('fetchDailyHistoryDocument rejects missing provenance', async () => {
    const fetchFn = async () => ({
      ok: true,
      json: async () => ({ schemaVersion: 1, provider: 'gold-api.com', records: [] }),
    });
    const result = await fetchDailyHistoryDocument('/test.json', fetchFn);
    assert.equal(result.ok, false);
  });

  test('loadUaeDailyKaratHistory maintains karat ordering', async () => {
    const fetchFn = async () => ({
      ok: true,
      json: async () => liveFixture,
    });
    const { points, errors } = await loadUaeDailyKaratHistory({ fetchFn });
    assert.equal(errors.length, 0);
    assert.ok(points.length > 0);
    for (const p of points) {
      const v = p.values;
      assert.ok(v['24'] > v['22'] && v['22'] > v['21'] && v['21'] > v['18']);
    }
  });

  test('aedPerGramFromDailyAvg uses canonical formula', () => {
    const spot = 2400;
    const v24 = aedPerGramFromDailyAvg(spot, '24');
    const expected = (spot / CONSTANTS.TROY_OZ_GRAMS) * CONSTANTS.AED_PEG;
    assert.ok(Math.abs(v24 - expected) < 0.01);
  });

  test('dailyRecordsToUnifiedRows tags gold-api source', () => {
    const rows = dailyRecordsToUnifiedRows([{ date: '2026-07-01', avgUsdOz: 2400 }]);
    assert.equal(rows[0].source, 'gold-api-daily');
    assert.equal(rows[0].granularity, 'daily');
  });

  test('unavailable fetch returns errors', async () => {
    const fetchFn = async () => ({ ok: false, status: 404 });
    const result = await loadUaeDailyKaratHistory({ fetchFn });
    assert.equal(result.points.length, 0);
    assert.ok(result.errors.includes('http_404'));
  });

  test('getDailySourceAttribution exposes peg', () => {
    const attr = getDailySourceAttribution({ provider: 'gold-api.com' });
    assert.equal(attr.peg, String(CONSTANTS.AED_PEG));
  });
});
