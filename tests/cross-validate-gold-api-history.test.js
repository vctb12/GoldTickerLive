/**
 * Tests for QA cross-validation (FreeGoldAPI + World Bank fixture).
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function loadModule() {
  const url = new URL(
    '../scripts/node/cross-validate-gold-api-history.mjs',
    `file://${__dirname}/`
  );
  return import(url.href + `?v=${Date.now()}`);
}

describe('cross-validate-gold-api-history', async () => {
  const mod = await loadModule();
  const {
    parseFreeGoldResponse,
    fetchFreeGoldByDate,
    pickIntersectionDates,
    buildDailyCrossValidationRows,
    buildMonthlyCrossValidationRows,
    loadWorldBankFixture,
    FREE_GOLD_ACCEPTABLE_SOURCES,
  } = mod;

  const fixturePath = path.join(__dirname, 'fixtures/world-bank/pink-sheet-gold-monthly-2025.json');

  test('parseFreeGoldResponse accepts top-level array', () => {
    const data = [
      { date: '2025-06-25', price: 3327.1, source: 'yahoo_finance' },
      { date: '2025-06-26', price: 3330.0, source: 'yahoo_finance' },
    ];
    const parsed = parseFreeGoldResponse(data);
    assert.equal(parsed.status, 'ok');
    assert.equal(parsed.map.size, 2);
    assert.equal(parsed.map.get('2025-06-25').price, 3327.1);
    assert.equal(parsed.map.get('2025-06-25').source, 'yahoo_finance');
  });

  test('parseFreeGoldResponse rejects invalid envelope', () => {
    const parsed = parseFreeGoldResponse({ prices: [] });
    assert.equal(parsed.status, 'schema_invalid');
    assert.equal(parsed.map.size, 0);
    assert.match(parsed.errors[0], /not a top-level array/);
  });

  test('parseFreeGoldResponse filters non-USD historical sources', () => {
    const data = [
      { date: '1258-01-01', price: 0.89, source: 'measuringworth_british (GBP)' },
      { date: '2025-07-01', price: 3340.0, source: 'yahoo_finance' },
      { date: '2026-03-01', price: 5100.0, source: 'yahoo_finance' },
    ];
    const parsed = parseFreeGoldResponse(data);
    assert.equal(parsed.status, 'ok');
    assert.equal(parsed.map.size, 1);
    assert.ok(parsed.map.has('2025-07-01'));
  });

  test('parseFreeGoldResponse rejects malformed price', () => {
    const data = [{ date: '2025-07-01', price: 'n/a', source: 'yahoo_finance' }];
    const parsed = parseFreeGoldResponse(data);
    assert.equal(parsed.status, 'no_eligible_rows');
    assert.match(parsed.errors.join(' '), /malformed price/);
  });

  test('parseFreeGoldResponse rejects duplicate eligible dates', () => {
    const data = [
      { date: '2025-07-01', price: 3340, source: 'yahoo_finance' },
      { date: '2025-07-01', price: 3341, source: 'yahoo_finance' },
    ];
    const parsed = parseFreeGoldResponse(data);
    assert.equal(parsed.status, 'schema_invalid');
    assert.match(parsed.errors.join(' '), /duplicate eligible date/);
  });

  test('fetchFreeGoldByDate handles endpoint failure', async () => {
    const result = await fetchFreeGoldByDate(async () => ({ ok: false, status: 503 }));
    assert.equal(result.status, 'endpoint_unavailable');
    assert.equal(result.map.size, 0);
  });

  test('pickIntersectionDates selects from actual overlap', () => {
    const records = [
      { date: '2025-06-25', avgUsdOz: 3330 },
      { date: '2025-06-26', avgUsdOz: 3335 },
      { date: '2025-07-01', avgUsdOz: 3340 },
      { date: '2026-03-01', avgUsdOz: 5100 },
    ];
    const map = new Map([
      ['2025-06-25', { price: 3327.1, source: 'yahoo_finance' }],
      ['2025-06-26', { price: 3330.0, source: 'yahoo_finance' }],
      ['2025-07-01', { price: 3340.0, source: 'yahoo_finance' }],
    ]);
    const picks = pickIntersectionDates(records, map, 2);
    assert.equal(picks.length, 2);
    assert.ok(picks.every((p) => map.has(p.date)));
    assert.ok(!picks.some((p) => p.date === '2026-03-01'));
  });

  test('buildDailyCrossValidationRows returns numeric comparisons on intersection', () => {
    const records = Array.from({ length: 20 }, (_, i) => ({
      date: `2025-07-${String(i + 1).padStart(2, '0')}`,
      avgUsdOz: 3300 + i,
    }));
    const map = new Map(
      records.map((r) => [r.date, { price: r.avgUsdOz + 1, source: 'yahoo_finance' }])
    );
    const daily = buildDailyCrossValidationRows(records, map);
    assert.equal(daily.status, 'comparison_completed');
    assert.equal(daily.rows.length, 10);
    for (const row of daily.rows) {
      assert.ok(row.compareValue != null);
      assert.equal(row.compareSource, 'yahoo_finance');
      assert.ok(Number.isFinite(row.percentDiff));
      assert.notEqual(row.result, 'no_overlap');
    }
  });

  test('loadWorldBankFixture validates metadata', () => {
    const { meta, byMonth } = loadWorldBankFixture(fixturePath);
    assert.equal(meta.source, 'World Bank Commodity Markets Pink Sheet');
    assert.ok(meta.workbookSha256);
    assert.ok(byMonth.has('2025-06'));
    assert.ok(byMonth.get('2025-06') > 3000);
  });

  test('buildMonthlyCrossValidationRows uses fixture months', () => {
    const { byMonth } = loadWorldBankFixture(fixturePath);
    const records = [];
    for (const month of byMonth.keys()) {
      for (let d = 1; d <= 5; d++) {
        records.push({
          date: `${month}-${String(d).padStart(2, '0')}`,
          avgUsdOz: byMonth.get(month),
        });
      }
    }
    const rows = buildMonthlyCrossValidationRows(records, byMonth);
    assert.equal(rows.length, byMonth.size);
    assert.ok(rows.every((r) => r.status === 'pass'));
  });

  test('acceptable sources constant documents yahoo_finance only', () => {
    assert.deepEqual(FREE_GOLD_ACCEPTABLE_SOURCES, ['yahoo_finance']);
  });
});
