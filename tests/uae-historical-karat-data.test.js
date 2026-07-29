/**
 * Tests for UAE historical karat data transforms.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function loadModule(relPath) {
  const url = new URL('file://' + path.resolve(__dirname, '..', relPath));
  return import(url.href + `?v=${Date.now()}`);
}

describe('uae-historical-karat-data', async () => {
  const {
    UAE_HISTORY_KARATS,
    HIST_COVERAGE_FRESH_DAYS,
    HIST_COVERAGE_DELAYED_DAYS,
    aedPerGramFromSpot,
    buildUaeKaratHistoryPoints,
    filterUaeHistoryByRange,
    toChartSeriesData,
    toTableRows,
    normalizeHistoryDateKey,
    normalizeDisplayAed,
    formatAedPerGram,
    formatAedPerGramWithUnit,
    classifyCoverageFreshness,
    computeCoverageMeta,
    describeRangeResolution,
    daysBetweenDates,
    buildDisplayValues,
  } = await loadModule('src/lib/uae-historical-karat-data.js');

  const { CONSTANTS } = await loadModule('src/config/constants.js');

  const SAMPLE_SPOT = 2000;

  test('aedPerGramFromSpot uses canonical peg and purity ordering', () => {
    const v24 = aedPerGramFromSpot(SAMPLE_SPOT, '24');
    const v22 = aedPerGramFromSpot(SAMPLE_SPOT, '22');
    const v21 = aedPerGramFromSpot(SAMPLE_SPOT, '21');
    const v18 = aedPerGramFromSpot(SAMPLE_SPOT, '18');

    assert.ok(v24 > v22 && v22 > v21 && v21 > v18);
    const expected24 =
      (SAMPLE_SPOT / CONSTANTS.TROY_OZ_GRAMS) * 1.0 * CONSTANTS.AED_PEG;
    assert.ok(Math.abs(v24 - expected24) < 0.01);
  });

  test('rejects invalid spot values', () => {
    assert.equal(aedPerGramFromSpot(0, '24'), 0);
    assert.equal(aedPerGramFromSpot(-100, '24'), 0);
  });

  test('normalizeHistoryDateKey coerces monthly to first of month', () => {
    assert.equal(normalizeHistoryDateKey('2024-06'), '2024-06-01');
    assert.equal(normalizeHistoryDateKey('2024-06-15'), '2024-06-15');
  });

  test('normalizeDisplayAed rounds to two decimals', () => {
    assert.equal(normalizeDisplayAed(123.456), 123.46);
    assert.equal(normalizeDisplayAed(0), null);
  });

  test('buildUaeKaratHistoryPoints dedupes by date', () => {
    const records = [
      { date: '2024-01-01', price: 1900, source: 'monthly-baseline-embedded', granularity: 'monthly' },
      { date: '2024-02-01', price: 1950, source: 'monthly-baseline-embedded', granularity: 'monthly' },
      { date: '2024-02-01', price: 1960, source: 'local-snapshot', granularity: 'daily' },
    ];
    const points = buildUaeKaratHistoryPoints(records);
    assert.equal(points.length, 2);
    assert.equal(points[1].spotUsdOz, 1960);
  });

  test('every valid point maintains 24K > 22K > 21K > 18K', () => {
    const points = buildUaeKaratHistoryPoints([
      { date: '2024-01-01', price: 2000, source: 'test' },
      { date: '2024-02-01', price: 2100, source: 'test' },
    ]);
    for (const p of points) {
      assert.ok(p.values['24'] > p.values['22']);
      assert.ok(p.values['22'] > p.values['21']);
      assert.ok(p.values['21'] > p.values['18']);
    }
  });

  test('filterUaeHistoryByRange anchors on latest record', () => {
    const records = [];
    for (let i = 0; i < 400; i++) {
      const d = new Date('2023-01-01');
      d.setDate(d.getDate() + i);
      records.push({
        date: d.toISOString().slice(0, 10),
        price: 1900 + i,
        source: 'test',
      });
    }
    const points = buildUaeKaratHistoryPoints(records);
    const filtered = filterUaeHistoryByRange(points, '1M');
    assert.ok(filtered.length >= 28 && filtered.length <= 32);
    assert.equal(filtered[filtered.length - 1].date, points[points.length - 1].date);
  });

  test('chart, table, and formatAedPerGram use identical display values', () => {
    const points = buildUaeKaratHistoryPoints([
      { date: '2024-01-01', price: 2000.123, source: 'test' },
      { date: '2024-02-01', price: 2100.789, source: 'test' },
    ]);
    const chart24 = toChartSeriesData(points, '24');
    const tableRows = toTableRows(points);
    const latestChart = chart24[chart24.length - 1].value;
    const latestTable = tableRows[0].values['24'];
    assert.equal(latestChart, latestTable);
    assert.equal(formatAedPerGram(points[1].values['24']), latestChart.toFixed(2));
  });

  test('all four karat codes are present', () => {
    const points = buildUaeKaratHistoryPoints([
      { date: '2024-01-01', price: 2000, source: 'test' },
    ]);
    for (const code of UAE_HISTORY_KARATS) {
      assert.ok(points[0].values[code] > 0);
      assert.ok(points[0].displayValues[code] > 0);
    }
  });

  test('classifyCoverageFreshness thresholds', () => {
    assert.equal(classifyCoverageFreshness('2026-07-28', '2026-07-29'), 'current');
    assert.equal(classifyCoverageFreshness('2026-06-01', '2026-07-29'), 'delayed');
    assert.equal(classifyCoverageFreshness('2026-02-20', '2026-07-29'), 'stale');
    assert.equal(classifyCoverageFreshness(null, '2026-07-29'), 'unavailable');
    assert.ok(HIST_COVERAGE_FRESH_DAYS === 7);
    assert.ok(HIST_COVERAGE_DELAYED_DAYS === 60);
  });

  test('computeCoverageMeta returns range bounds and age', () => {
    const points = buildUaeKaratHistoryPoints([
      { date: '2024-01-15', price: 2000, source: 'test' },
      { date: '2026-02-20', price: 2100, source: 'test' },
    ]);
    const meta = computeCoverageMeta(points, '2026-07-29');
    assert.equal(meta.start, '2024-01-15');
    assert.equal(meta.end, '2026-02-20');
    assert.equal(meta.freshness, 'stale');
    assert.ok(meta.ageDays > 150);
  });

  test('describeRangeResolution returns semantic keys for mixed data', () => {
    const points = buildUaeKaratHistoryPoints([
      { date: '2025-06-01', price: 2000, source: 'monthly-baseline-embedded', granularity: 'monthly' },
      { date: '2026-01-02', price: 2100, source: 'freegoldapi-reference', granularity: 'daily' },
      { date: '2026-02-20', price: 2200, source: 'freegoldapi-reference', granularity: 'daily' },
    ]);
    const filtered = filterUaeHistoryByRange(points, '12M');
    const res = describeRangeResolution(filtered);
    assert.equal(res.key, 'mixed_daily_monthly');
    assert.ok(res.dailyCount > 0);
    assert.ok(res.monthlyCount > 0);
  });

  test('describeRangeResolution detects cached browser data', () => {
    const points = buildUaeKaratHistoryPoints([
      { date: '2026-02-18', price: 2100, source: 'local-snapshot', granularity: 'daily' },
      { date: '2026-02-20', price: 2200, source: 'local-snapshot', granularity: 'daily' },
    ]);
    const res = describeRangeResolution(points);
    assert.equal(res.key, 'cached_browser');
    assert.equal(res.hasCached, true);
  });

  test('formatAedPerGramWithUnit includes AED/g in English', () => {
    assert.match(formatAedPerGramWithUnit(100.5, 'en'), /AED\/g/);
    assert.match(formatAedPerGramWithUnit(100.5, 'ar'), /درهم\/غ/);
  });

  test('daysBetweenDates is timezone-safe for UTC date keys', () => {
    assert.equal(daysBetweenDates('2026-02-20', '2026-07-29'), 159);
  });

  test('buildDisplayValues matches normalizeDisplayAed per karat', () => {
    const values = { 24: 300.556, 22: 275.111, 21: 262.999, 18: 225.444 };
    const display = buildDisplayValues(values);
    assert.equal(display['24'], 300.56);
    assert.equal(display['22'], 275.11);
  });
});
