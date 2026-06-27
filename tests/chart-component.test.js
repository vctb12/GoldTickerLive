'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function loadChartModule() {
  const url = new URL('file://' + path.resolve(__dirname, '..', 'src', 'components', 'chart.js'));
  return import(url.href);
}

test('GoldChart does not fall back to spot snapshots when custom data is empty', async () => {
  const { GoldChart } = await loadChartModule();
  const chart = Object.create(GoldChart.prototype);
  chart.range = '1M';
  chart.snapshots = [{ time: 1_700_000_000, price: 3200 }];
  chart._customData = [];
  chart._cachedDaily = [];

  const data = chart._getChartData();
  assert.equal(data, null);
});
