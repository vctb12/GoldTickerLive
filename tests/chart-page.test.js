'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function loadModule() {
  const url = new URL(
    'file://' + path.resolve(__dirname, '..', 'src', 'pages', 'chart', 'chart-page.js')
  );
  return import(url.href);
}

test('parseChartQuery parses valid URL params', async () => {
  const mod = await loadModule();
  const parsed = mod.parseChartQuery('?karat=22&period=1W&currency=USD');
  assert.deepEqual(parsed, { karat: '22', period: '1W', currency: 'USD' });
});

test('parseChartQuery falls back to defaults on invalid params', async () => {
  const mod = await loadModule();
  const parsed = mod.parseChartQuery('?karat=19&period=2Y&currency=ABC');
  assert.deepEqual(parsed, { karat: '24', period: '1M', currency: 'AED' });
});

test('buildChartCsv includes expected headers and karat rows', async () => {
  const mod = await loadModule();
  const csv = mod.buildChartCsv(
    [
      {
        timestampUtc: '2026-05-01T00:00:00Z',
        value: 321.1234,
        provider: 'supabase',
      },
    ],
    { karat: '22', currency: 'AED', period: '1W' }
  );

  const lines = csv.split('\n');
  assert.equal(
    lines[0],
    'timestamp_utc,karat,currency,price_per_gram,source,resolution,timezone,disclaimer'
  );
  assert.match(lines[1], /,22K,AED,/);
  assert.match(lines[1], /supabase/);
});

test('calculateChartStats returns high/low/average/change/changePct', async () => {
  const mod = await loadModule();
  const stats = mod.calculateChartStats([
    { value: 100, timestampUtc: '2026-01-01T00:00:00Z' },
    { value: 120, timestampUtc: '2026-01-02T00:00:00Z' },
    { value: 110, timestampUtc: '2026-01-03T00:00:00Z' },
  ]);

  assert.equal(stats.high, 120);
  assert.equal(stats.low, 100);
  assert.equal(stats.average, 110);
  assert.equal(stats.change, 10);
  assert.equal(Number(stats.changePct.toFixed(2)), 10);
});
