const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function loadModule() {
  const url = new URL('file://' + path.resolve(__dirname, '..', 'src', 'lib', 'freegoldapi.js'));
  return import(url);
}

describe('freegoldapi', () => {
  test('normalizeFreeGoldRows keeps trusted USD sources from 2019+', async () => {
    const { normalizeFreeGoldRows } = await loadModule();
    const rows = normalizeFreeGoldRows([
      { date: '2018-12-31', price: 1280, source: 'yahoo_finance' },
      { date: '2019-01-01', price: 1291.75, source: 'worldbank' },
      { date: '2019-01-02', price: 1295, source: 'measuringworth_british (GBP)' },
      { date: '2026-02-20', price: 5059.3, source: 'yahoo_finance' },
    ]);
    assert.equal(rows.length, 2);
    assert.equal(rows[0].date, '2019-01-01');
    assert.equal(rows[0].source, 'freegoldapi-reference');
    assert.equal(rows[0].derived, true);
    assert.equal(rows[0].freshnessState, 'historical');
    assert.equal(rows[1].date, '2026-02-20');
  });

  test('freegoldRowToRecord rejects invalid rows', async () => {
    const { freegoldRowToRecord } = await loadModule();
    assert.equal(freegoldRowToRecord(null), null);
    assert.equal(freegoldRowToRecord({ date: '2020-01-01', price: 0 }), null);
    const ok = freegoldRowToRecord({ date: '2020-06-15', price: 1734.2, source: 'worldbank' });
    assert.equal(ok.granularity, 'daily');
    assert.equal(ok.upstreamSource, 'worldbank');
  });
});
