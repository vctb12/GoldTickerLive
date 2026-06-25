const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function loadHistoricalData() {
  const url = new URL(
    'file://' + path.resolve(__dirname, '..', 'src', 'lib', 'historical-data.js')
  );
  return import(url.href + `?v=${Date.now()}`);
}

describe('historical-data merge and stats date coercion', () => {
  test('getUnifiedHistory merges cached daily rows with numeric epoch dates', async () => {
    const { getUnifiedHistory } = await loadHistoricalData();
    const epochMs = Date.parse('2025-06-15T12:00:00Z');
    const unified = getUnifiedHistory([{ date: epochMs, price: 3350, timestamp: epochMs }]);
    const daily = unified.filter((row) => row.granularity === 'daily');
    assert.ok(daily.some((row) => row.date === '2025-06-15' && row.price === 3350));
  });

  test('getUnifiedHistory merges cached daily rows with Date object dates', async () => {
    const { getUnifiedHistory } = await loadHistoricalData();
    const unified = getUnifiedHistory([
      { date: new Date('2025-08-01T00:00:00Z'), price: 3450, timestamp: Date.now() },
    ]);
    assert.ok(unified.some((row) => row.date === '2025-08-01' && row.price === 3450));
  });

  test('getHistoryStats accepts tracker rows with Date objects', async () => {
    const { getHistoryStats } = await loadHistoricalData();
    const year = new Date().getFullYear();
    const records = [
      { date: new Date(`${year}-01-01T00:00:00Z`), price: 2600, spot: 2600 },
      { date: new Date(`${year}-06-01T00:00:00Z`), price: 3300, spot: 3300 },
    ];
    assert.doesNotThrow(() => getHistoryStats(records));
    const stats = getHistoryStats(records);
    assert.equal(stats.latest, 3300);
    assert.ok(stats.ytdChange != null);
    assert.equal(typeof stats.allTimeHigh, 'number');
    assert.equal(typeof stats.allTimeLow, 'number');
  });

  test('computeYoYChange accepts Date objects without throwing', async () => {
    const { computeYoYChange } = await loadHistoricalData();
    const now = new Date();
    const lastYear = new Date(now);
    lastYear.setFullYear(lastYear.getFullYear() - 1);
    const records = [
      { date: lastYear, price: 2500 },
      { date: now, price: 3000 },
    ];
    const change = computeYoYChange(records);
    assert.equal(typeof change, 'number');
    assert.ok(Number.isFinite(change));
  });
});
