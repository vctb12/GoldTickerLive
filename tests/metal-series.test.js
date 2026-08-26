'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function load() {
  const url = new URL('file://' + path.resolve(__dirname, '..', 'src', 'lib', 'metal-series.js'));
  return import(url.href + `?v=${Date.now()}`);
}

const generatedAt = '2026-08-24T12:00:00.000Z';
const base = {
  metal: 'XAG',
  resolution: '1d',
  sourceId: 'licensed-history',
  ingestedAt: generatedAt,
  freshnessState: 'historical',
  verified: true,
};

test('normalizes metal points to the provider-neutral UTC contract', async () => {
  const { normalizeMetalPoint } = await load();
  const point = normalizeMetalPoint({ ...base, timestamp: '2026-08-01', price: '36.25' });
  assert.equal(point.timestamp, '2026-08-01T00:00:00.000Z');
  assert.equal(point.valueUsdPerOz, 36.25);
  assert.equal(point.metal, 'XAG');
  assert.equal(point.resolution, '1d');
  assert.equal(point.verified, true);
  assert.deepEqual(point.qualityFlags, []);
});

test('rejects invalid timestamp, metal, price, resolution, and ingestion metadata', async () => {
  const { normalizeMetalPoint } = await load();
  assert.equal(normalizeMetalPoint({ ...base, timestamp: 'bad', price: 36 }), null);
  assert.equal(normalizeMetalPoint({ ...base, timestamp: '2026-08-01', price: 0 }), null);
  assert.equal(
    normalizeMetalPoint({ ...base, timestamp: '2026-08-01', price: 36, metal: 'BTC' }),
    null
  );
  assert.equal(
    normalizeMetalPoint({ ...base, timestamp: '2026-08-01', price: 36, resolution: 'tick' }),
    null
  );
  assert.equal(
    normalizeMetalPoint({ ...base, timestamp: '2026-08-01', price: 36, ingestedAt: null }),
    null
  );
});

test('sorts and deterministically de-duplicates timestamp collisions', async () => {
  const { buildMetalSeries } = await load();
  const result = buildMetalSeries(
    [
      { ...base, timestamp: '2026-08-02', price: 37 },
      { ...base, timestamp: '2026-08-01', price: 36 },
      { ...base, timestamp: '2026-08-02', price: 99, verified: false, derived: true },
    ],
    { metal: 'silver', generatedAt }
  );
  assert.deepEqual(
    result.points.map((point) => point.valueUsdPerOz),
    [36, 37]
  );
  assert.ok(result.points[1].qualityFlags.includes('timestamp-collision-deduped'));
});

test('preserves source values and reports mixed sources without rebasing', async () => {
  const { buildMetalSeries } = await load();
  const result = buildMetalSeries(
    [
      { ...base, timestamp: '2026-08-01', price: 36 },
      { ...base, timestamp: '2026-08-02', price: 37, sourceId: 'second-source' },
    ],
    { metal: 'XAG', generatedAt }
  );
  assert.deepEqual(
    result.points.map((point) => point.valueUsdPerOz),
    [36, 37]
  );
  assert.equal(result.metadata.mixedSources, true);
  assert.deepEqual(result.metadata.sourceIds, ['licensed-history', 'second-source']);
  assert.ok(result.metadata.warnings.includes('mixed-sources'));
});

test('detects material gaps and outliers rather than interpolating them', async () => {
  const { buildMetalSeries } = await load();
  const result = buildMetalSeries(
    [
      { ...base, timestamp: '2026-08-01', price: 36 },
      { ...base, timestamp: '2026-08-10', price: 60 },
    ],
    { metal: 'silver', generatedAt }
  );
  assert.equal(result.points.length, 2);
  assert.ok(result.points[1].qualityFlags.includes('gap-before'));
  assert.ok(result.points[1].qualityFlags.includes('material-outlier-review'));
  assert.ok(result.metadata.warnings.includes('gaps-detected'));
});

test('reports requested-range partial coverage explicitly', async () => {
  const { buildMetalSeries } = await load();
  const result = buildMetalSeries(
    [
      { ...base, timestamp: '2026-08-20', price: 36 },
      { ...base, timestamp: '2026-08-24', price: 37 },
    ],
    { metal: 'silver', requestedRange: '1M', generatedAt }
  );
  assert.equal(result.metadata.partiallyCovered, true);
  assert.ok(result.metadata.warnings.includes('partial-coverage'));
});

test('filters relative to the latest observation and supports six months', async () => {
  const { filterMetalSeriesByRange } = await load();
  const points = [
    { timestamp: '2026-01-01T00:00:00.000Z' },
    { timestamp: '2026-03-01T00:00:00.000Z' },
    { timestamp: '2026-08-24T00:00:00.000Z' },
  ];
  assert.deepEqual(filterMetalSeriesByRange(points, '6M'), points.slice(1));
});

test('appends a distinct current anchor at the provider timestamp without shifting history', async () => {
  const { appendCurrentAnchor, buildMetalSeries } = await load();
  const history = buildMetalSeries([{ ...base, timestamp: '2026-08-23', price: 36 }], {
    metal: 'silver',
    requestedRange: '1W',
    generatedAt,
  });
  const result = appendCurrentAnchor(
    history,
    {
      metal: 'XAG',
      price: 38,
      providerTimestamp: '2026-08-24T11:59:00.000Z',
      fetchedAt: generatedAt,
      sourceId: 'gold_api_com_xag',
      freshnessState: 'updated',
      verified: true,
    },
    { metal: 'silver', generatedAt }
  );
  assert.equal(result.points[0].valueUsdPerOz, 36);
  assert.equal(result.points[1].valueUsdPerOz, 38);
  assert.equal(result.points[1].isCurrentAnchor, true);
  assert.equal(result.points[1].timestamp, '2026-08-24T11:59:00.000Z');
  assert.ok(result.metadata.warnings.includes('source-transition-discrepancy'));
});

test('rejects mismatched, invalid, unavailable, and non-newer current anchors', async () => {
  const { appendCurrentAnchor, buildMetalSeries } = await load();
  const history = buildMetalSeries([{ ...base, timestamp: '2026-08-24', price: 36 }], {
    metal: 'silver',
    generatedAt,
  });
  assert.ok(
    appendCurrentAnchor(history, { metal: 'XAU' }, { metal: 'silver' }).metadata.warnings.includes(
      'current-anchor-metal-mismatch'
    )
  );
  assert.ok(
    appendCurrentAnchor(
      history,
      { metal: 'XAG', freshnessState: 'unavailable' },
      { metal: 'silver' }
    ).metadata.warnings.includes('current-anchor-freshness-unknown')
  );
  assert.ok(
    appendCurrentAnchor(
      history,
      {
        metal: 'XAG',
        price: 37,
        providerTimestamp: '2026-08-23',
        fetchedAt: generatedAt,
        sourceId: 'spot',
        freshnessState: 'updated',
      },
      { metal: 'silver', generatedAt }
    ).metadata.warnings.includes('current-anchor-not-newer')
  );
});
