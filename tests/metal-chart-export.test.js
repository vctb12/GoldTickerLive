'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

test('multi-metal chart CSV carries symbol, provenance, resolution, freshness, and quality fields', async () => {
  const url = new URL('file://' + path.resolve(__dirname, '..', 'src', 'lib', 'export.js'));
  const { buildChartCSVContent } = await import(url.href + `?v=${Date.now()}`);
  const csv = buildChartCSVContent(
    [
      {
        date: new Date('2026-08-24T11:59:00.000Z'),
        spot: 36.25,
        metal: 'XAG',
        source: 'gold_api_com_xag',
        resolution: 'live',
        providerTimestamp: '2026-08-24T11:59:00.000Z',
        freshnessState: 'updated',
        verified: true,
        derived: false,
        isCurrentAnchor: true,
        qualityFlags: ['partial-coverage'],
      },
    ],
    '6M',
    {
      symbol: 'XAG',
      gradeCode: '999',
      purity: 0.999,
      metadata: {
        effectiveResolution: 'live',
        sourceIds: ['gold_api_com_xag'],
        partiallyCovered: true,
        derived: false,
        warnings: ['partial-coverage'],
      },
    }
  );
  assert.match(csv, /Visible XAG Chart Range \(fineness 999, 6M\)/);
  assert.match(csv, /XAG\/USD per troy ounce/);
  assert.match(csv, /gold_api_com_xag/);
  assert.match(csv, /Provider timestamp UTC/);
  assert.match(csv, /Current anchor/);
  assert.match(csv, /partial-coverage/);
});
