const fs = require('fs');
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const baseline = JSON.parse(fs.readFileSync('src/data/historical-baseline.json', 'utf8'));

function toChartData(records) {
  return records.map((r) => ({
    time: r.date.length === 7 ? `${r.date}-01` : r.date,
    value: r.price,
  }));
}

function filterByRange(records, range) {
  if (!range || range === 'ALL') return records;
  const now = new Date();
  const cutoffs = { '30D': 30, '90D': 90, '1Y': 365, '3Y': 365 * 3, '5Y': 365 * 5 };
  const days = cutoffs[range.toUpperCase()];
  if (!days) return records;
  const cutoffDate = new Date(now.getTime() - days * 86400000);
  const cutoffStr = cutoffDate.toISOString().slice(0, 10);
  return records.filter((r) => r.date >= cutoffStr);
}

function computeYoYChange(records) {
  if (records.length < 2) return null;
  const latest = records[records.length - 1].price;
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const yearAgoStr = oneYearAgo.toISOString().slice(0, 7);
  const yearAgoEntry = [...records].reverse().find((r) => r.date.slice(0, 7) <= yearAgoStr);
  if (!yearAgoEntry) return null;
  return ((latest - yearAgoEntry.price) / yearAgoEntry.price) * 100;
}

function getHistoryStats(records) {
  if (!records.length) return {};
  const prices = records.map((r) => r.price);
  const allTimeHigh = Math.max(...prices);
  const allTimeLow = Math.min(...prices);
  const latest = records[records.length - 1].price;
  const yearStart = `${new Date().getFullYear()}-01`;
  const ytdEntry = records.find((r) => r.date.slice(0, 7) === yearStart || r.date >= yearStart);
  const ytdChange = ytdEntry ? ((latest - ytdEntry.price) / ytdEntry.price) * 100 : null;
  const yoyChange = computeYoYChange(records);
  return { allTimeHigh, allTimeLow, latest, ytdChange, yoyChange };
}

describe('historical-data (inline helpers)', () => {
  test('baseline JSON loads and has expected fields', () => {
    assert.ok(Array.isArray(baseline));
    assert.ok(baseline.length > 0);
    assert.ok(typeof baseline[0].date === 'string');
    assert.ok(typeof baseline[0].price === 'number');
  });

  test('toChartData maps monthly to first-of-month', () => {
    const cd = toChartData(baseline.slice(0, 3));
    assert.equal(cd[0].time.length, 10);
    assert.ok(cd[0].time.endsWith('-01'));
  });

  test('filterByRange returns an array', () => {
    const records = baseline.map((r) => ({
      date: r.date.length === 7 ? `${r.date}-01` : r.date,
      price: r.price,
    }));
    const out = filterByRange(records, '30D');
    assert.ok(Array.isArray(out));
  });

  test('computeYoYChange returns number or null', () => {
    const recs = baseline
      .slice(-14)
      .map((r) => ({ date: r.date.length === 7 ? `${r.date}-01` : r.date, price: r.price }));
    const val = computeYoYChange(recs);
    if (val !== null) assert.equal(typeof val, 'number');
  });

  test('getHistoryStats returns stats keys', () => {
    const recs = baseline
      .slice(0, 12)
      .map((r) => ({ date: r.date.length === 7 ? `${r.date}-01` : r.date, price: r.price }));
    const s = getHistoryStats(recs);
    assert.ok('allTimeHigh' in s && 'latest' in s);
  });
});
