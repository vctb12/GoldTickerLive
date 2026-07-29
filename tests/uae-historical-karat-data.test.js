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
    aedPerGramFromSpot,
    buildUaeKaratHistoryPoints,
    filterUaeHistoryByRange,
    toChartSeriesData,
    toTableRows,
    normalizeHistoryDateKey,
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

  test('buildUaeKaratHistoryPoints dedupes by date', () => {
    const records = [
      { date: '2024-01-01', price: 1900, source: 'LBMA-baseline', granularity: 'monthly' },
      { date: '2024-02-01', price: 1950, source: 'LBMA-baseline', granularity: 'monthly' },
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
  });

  test('toChartSeriesData and toTableRows match values', () => {
    const points = buildUaeKaratHistoryPoints([
      { date: '2024-01-01', price: 2000, source: 'test' },
      { date: '2024-02-01', price: 2100, source: 'test' },
    ]);
    const chart24 = toChartSeriesData(points, '24');
    const tableRows = toTableRows(points);
    assert.ok(Math.abs(chart24[chart24.length - 1].value - tableRows[0].values['24']) < 0.01);
  });

  test('all four karat codes are present', () => {
    const points = buildUaeKaratHistoryPoints([
      { date: '2024-01-01', price: 2000, source: 'test' },
    ]);
    for (const code of UAE_HISTORY_KARATS) {
      assert.ok(points[0].values[code] > 0);
    }
  });
});
