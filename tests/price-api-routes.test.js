'use strict';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-for-tests-only';
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test-password-1234';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
delete process.env.SUPABASE_URL;
delete process.env.SUPABASE_SERVICE_ROLE_KEY;

const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');
const { __testables } = require('../server/routes/api-v1');

const appPath = path.resolve(__dirname, '..', 'server.js');
const app = require(appPath);
const server = app.listen(0);
const port = server.address().port;

after(() => {
  server.close();
});

function get(p) {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path: p, method: 'GET' }, (res) => {
      let body = '';
      res.on('data', (d) => (body += d));
      res.on('end', () => resolve({ status: res.statusCode, body, headers: res.headers }));
    });
    req.on('error', reject);
    req.end();
  });
}

test('GET /api/v1/prices/latest returns latest price payload with file fallback mode', async () => {
  const res = await get('/api/v1/prices/latest');
  assert.equal(res.status, 200);
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.ok, true);
  assert.equal(typeof parsed.data.xauUsdPerOz, 'number');
  assert.equal(parsed.data.sourceMode, 'file');
});

test('GET /api/v1/prices/history returns range-aware response', async () => {
  const res = await get('/api/v1/prices/history?range=7d');
  assert.equal(res.status, 200);
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.data.range, '7d');
  assert.equal(Array.isArray(parsed.data.points), true);
  assert.equal(parsed.meta.source, 'datacore-static-rollup');
  assert.equal(parsed.meta.freshness, 'historical');
  assert.match(res.headers['cache-control'], /max-age=60/);
  assert.match(res.headers['cache-control'], /stale-while-revalidate=300/);
});

test('GET /api/v1/prices/history applies range window in file fallback mode', async () => {
  const res = await get('/api/v1/prices/history?range=30d&limit=5000');
  assert.equal(res.status, 200);
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.data.range, '30d');
  assert.equal(parsed.data.historySource, 'datacore-static-rollup');
  assert.equal(parsed.data.fallback, true);
  assert.equal(parsed.data.coverage.staticFallback, true);
  assert.equal(parsed.meta.coveragePoints, parsed.data.points.length);
  if (parsed.data.points.length > 0) {
    assert.equal(typeof parsed.meta.coverageStartUtc, 'string');
    assert.equal(typeof parsed.meta.coverageEndUtc, 'string');
  } else {
    assert.equal(parsed.meta.coverageStartUtc, null);
    assert.equal(parsed.meta.coverageEndUtc, null);
  }
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  for (const point of parsed.data.points) {
    const ts = new Date(point.timestampUtc).getTime();
    assert.equal(Number.isFinite(ts), true);
    assert.equal(ts >= cutoff, true);
  }
});

test('buildHistoryResponse prefers Supabase rows and labels source explicitly', () => {
  const { body, status } = __testables.buildHistoryResponse({
    range: '7d',
    limit: 120,
    supabaseRows: [
      {
        timestamp_utc: '2026-05-15T00:00:00.000Z',
        fetched_at_utc: '2026-05-15T00:02:00.000Z',
        xau_usd_per_oz: 3200.55,
        xau_aed_per_gram: 377.11,
        source_provider: 'supabase-feed',
        freshness_seconds: 120,
        is_fresh: true,
        is_fallback: false,
      },
    ],
    baselineHistory: null,
    latestPricePayload: null,
  });
  assert.equal(status, 200);
  assert.equal(body.meta.source, 'supabase');
  assert.equal(body.data.historySource, 'supabase');
  assert.equal(body.data.coverage.providerBacked, true);
});

test('buildHistoryResponse restores chronological order after a newest-first Supabase query', () => {
  const { body, status } = __testables.buildHistoryResponse({
    range: '7d',
    limit: 2,
    supabaseRows: [
      {
        timestamp_utc: '2026-05-15T00:05:00.000Z',
        fetched_at_utc: '2026-05-15T00:05:05.000Z',
        xau_usd_per_oz: 3201,
        source_provider: 'supabase-feed',
      },
      {
        timestamp_utc: '2026-05-15T00:00:00.000Z',
        fetched_at_utc: '2026-05-15T00:00:05.000Z',
        xau_usd_per_oz: 3200,
        source_provider: 'supabase-feed',
      },
    ],
    staticRollup: null,
    baselineHistory: null,
    latestPricePayload: null,
  });
  assert.equal(status, 200);
  assert.deepEqual(
    body.data.points.map((point) => point.timestampUtc),
    ['2026-05-15T00:00:00.000Z', '2026-05-15T00:05:00.000Z']
  );
  assert.equal(body.data.latestTimestampUtc, '2026-05-15T00:05:00.000Z');
});

test('buildHistoryResponse resolves Supabase corrections before limit and coverage like static history', () => {
  const predecessor = {
    observation_id: 'obs-predecessor',
    provider_timestamp_utc: '2026-05-15T00:05:00.000Z',
    fetched_at_utc: '2026-05-15T00:05:05.000Z',
    ingested_at_utc: '2026-05-15T00:05:06.000Z',
    price_usd_per_oz: 3200,
    source_provider: 'supabase-feed',
    is_selected: true,
    quality_state: 'accepted',
    is_correction: false,
    correction_of_observation_id: null,
  };
  const correction = {
    ...predecessor,
    observation_id: 'obs-correction',
    ingested_at_utc: '2026-05-15T00:06:06.000Z',
    price_usd_per_oz: 3205,
    is_correction: true,
    correction_of_observation_id: predecessor.observation_id,
  };
  const rawRows = [correction, predecessor];
  const rawRowsBefore = structuredClone(rawRows);

  const supabase = __testables.buildHistoryResponse({
    range: '7d',
    limit: 1,
    supabaseRows: rawRows,
    staticRollup: null,
    baselineHistory: null,
    latestPricePayload: null,
  });
  const staticFallback = __testables.buildHistoryResponse({
    range: '7d',
    limit: 1,
    supabaseRows: null,
    staticRollup: {
      payload: { interval: '5m', generatedAtUtc: '2026-05-15T00:07:00.000Z' },
      points: [
        {
          timestampUtc: correction.provider_timestamp_utc,
          xauUsdPerOz: correction.price_usd_per_oz,
          sourceObservationId: correction.observation_id,
        },
      ],
    },
    baselineHistory: null,
    latestPricePayload: null,
  });

  assert.equal(supabase.body.data.total, 1);
  assert.equal(supabase.body.data.returned, 1);
  assert.equal(supabase.body.data.coverage.pointsAvailable, 1);
  assert.equal(supabase.body.data.coverage.partial, false);
  assert.equal(supabase.body.data.points[0].sourceObservationId, correction.observation_id);
  assert.equal(supabase.body.data.points[0].correctionOfObservationId, predecessor.observation_id);
  assert.equal(supabase.body.data.points[0].isCorrection, true);
  assert.equal(
    supabase.body.data.points[0].timestampUtc,
    staticFallback.body.data.points[0].timestampUtc
  );
  assert.equal(
    supabase.body.data.points[0].xauUsdPerOz,
    staticFallback.body.data.points[0].xauUsdPerOz
  );
  assert.deepEqual(rawRows, rawRowsBefore, 'raw snapshot lineage must remain unchanged');
});

test('buildHistoryResponse resolves corrections before filtering selected observations', () => {
  const timestampUtc = '2026-05-15T00:05:00.000Z';
  const predecessor = {
    observation_id: 'obs-selected-predecessor',
    provider_timestamp_utc: timestampUtc,
    ingested_at_utc: '2026-05-15T00:05:05.000Z',
    price_usd_per_oz: 3200,
    source_provider: 'provider-a',
    is_selected: true,
    quality_state: 'accepted',
  };
  const unselectedCorrection = {
    ...predecessor,
    observation_id: 'obs-unselected-correction',
    ingested_at_utc: '2026-05-15T00:06:05.000Z',
    price_usd_per_oz: 3201,
    is_selected: false,
    is_correction: true,
    correction_of_observation_id: predecessor.observation_id,
  };
  const replacementSelection = {
    ...predecessor,
    observation_id: 'obs-selected-provider-b',
    ingested_at_utc: '2026-05-15T00:06:06.000Z',
    price_usd_per_oz: 3202,
    source_provider: 'provider-b',
  };

  const { body } = __testables.buildHistoryResponse({
    range: '7d',
    limit: 10,
    supabaseRows: [replacementSelection, unselectedCorrection, predecessor],
    staticRollup: null,
    baselineHistory: null,
    latestPricePayload: null,
  });

  assert.equal(body.data.total, 1);
  assert.deepEqual(
    body.data.points.map((point) => point.sourceObservationId),
    [replacementSelection.observation_id]
  );
});

test('buildHistoryResponse marks capped Supabase coverage as truncated and partial', () => {
  const { body } = __testables.buildHistoryResponse({
    range: '1y',
    limit: 10,
    supabaseRows: [
      {
        observation_id: 'obs-with-more-history',
        provider_timestamp_utc: '2026-05-15T00:05:00.000Z',
        ingested_at_utc: '2026-05-15T00:05:05.000Z',
        price_usd_per_oz: 3200,
        source_provider: 'supabase-feed',
        is_selected: true,
        quality_state: 'accepted',
      },
    ],
    supabaseTruncated: true,
    staticRollup: null,
    baselineHistory: null,
    latestPricePayload: null,
  });

  assert.equal(body.data.total, 1);
  assert.equal(body.data.coverage.partial, true);
  assert.equal(body.data.coverage.truncated, true);
  assert.equal(body.data.coverage.totalIsLowerBound, true);
});

test('fetchSupabaseHistoryRows keyset pagination survives an insert between pages', async () => {
  const requests = [];
  const makeRow = (observationId, providerTimestampUtc, ingestedAtUtc) => ({
    observation_id: observationId,
    provider_timestamp_utc: providerTimestampUtc,
    ingested_at_utc: ingestedAtUtc,
  });
  const serverRows = [
    makeRow('obs-a', '2026-05-15T00:10:00.000Z', '2026-05-15T00:10:05.000Z'),
    makeRow('obs-b', '2026-05-15T00:10:00.000Z', '2026-05-15T00:09:05.000Z'),
    makeRow('obs-c', '2026-05-15T00:09:00.000Z', '2026-05-15T00:09:05.000Z'),
    makeRow('obs-d', '2026-05-15T00:08:00.000Z', '2026-05-15T00:08:05.000Z'),
    makeRow('obs-e', '2026-05-15T00:07:00.000Z', '2026-05-15T00:07:05.000Z'),
    makeRow('obs-f', '2026-05-15T00:06:00.000Z', '2026-05-15T00:06:05.000Z'),
  ];
  const newerInsert = makeRow('obs-new', '2026-05-15T00:10:00.000Z', '2026-05-15T00:11:05.000Z');
  const compareTuple = (left, right) =>
    left.provider_timestamp_utc.localeCompare(right.provider_timestamp_utc) ||
    left.ingested_at_utc.localeCompare(right.ingested_at_utc) ||
    left.observation_id.localeCompare(right.observation_id);
  let cursor = null;
  let requestCount = 0;

  const result = await __testables.fetchSupabaseHistoryRows('2026-05-01T00:00:00.000Z', {
    url: 'https://project.supabase.co',
    key: 'test-service-key',
    pageSize: 2,
    maxRows: 5,
    fetchImpl: async (input, init) => {
      const url = new URL(input);
      requests.push({ url, headers: init.headers });
      assert.equal(
        url.searchParams.get('or'),
        cursor ? __testables.buildHistoryCursorFilter(cursor) : null
      );
      if (requestCount === 1) serverRows.push(newerInsert);
      const page = serverRows
        .filter((row) => !cursor || compareTuple(row, cursor) < 0)
        .sort((left, right) => compareTuple(right, left))
        .slice(0, Number(url.searchParams.get('limit')));
      cursor = page.at(-1) || cursor;
      requestCount += 1;
      return {
        ok: true,
        statusText: 'OK',
        text: async () => JSON.stringify(page),
      };
    },
  });

  assert.equal(result.truncated, true);
  assert.deepEqual(
    result.rows.map((row) => row.observation_id),
    ['obs-a', 'obs-b', 'obs-c', 'obs-d', 'obs-e']
  );
  assert.equal(new Set(result.rows.map((row) => row.observation_id)).size, result.rows.length);
  assert.equal(
    result.rows.some((row) => row.observation_id === newerInsert.observation_id),
    false
  );
  assert.deepEqual(
    requests.map(({ url }) => url.searchParams.get('limit')),
    ['2', '2', '2']
  );
  for (const { url, headers } of requests) {
    assert.equal(
      url.searchParams.get('order'),
      'provider_timestamp_utc.desc,ingested_at_utc.desc,observation_id.desc'
    );
    assert.equal(url.searchParams.get('metal_symbol'), 'eq.XAU');
    assert.equal(url.searchParams.has('is_selected'), false);
    assert.equal(url.searchParams.get('provider_timestamp_utc'), 'gte.2026-05-01T00:00:00.000Z');
    assert.equal(url.searchParams.has('offset'), false);
    assert.equal(headers.Authorization, 'Bearer test-service-key');
  }
});

test('latest Supabase helpers query lineage candidates and select the correction', async () => {
  const predecessor = {
    observation_id: 'obs-latest-predecessor',
    provider_timestamp_utc: '2026-05-15T00:10:00.000Z',
    fetched_at_utc: '2026-05-15T00:10:05.000Z',
    ingested_at_utc: '2026-05-15T00:10:06.000Z',
    price_usd_per_oz: 3200,
    source_provider: 'supabase-feed',
    is_selected: true,
    quality_state: 'accepted',
    is_correction: false,
    correction_of_observation_id: null,
  };
  const correction = {
    ...predecessor,
    observation_id: 'obs-latest-correction',
    ingested_at_utc: '2026-05-15T00:11:06.000Z',
    price_usd_per_oz: 3205,
    is_correction: true,
    correction_of_observation_id: predecessor.observation_id,
  };
  let requestedUrl = null;
  const candidates = await __testables.fetchSupabaseLatestRows({
    url: 'https://project.supabase.co',
    key: 'test-service-key',
    fetchImpl: async (input) => {
      requestedUrl = new URL(input);
      return {
        ok: true,
        statusText: 'OK',
        text: async () => JSON.stringify([correction, predecessor]),
      };
    },
  });
  const latest = __testables.selectLatestEffectiveSnapshotRow(candidates);

  assert.equal(latest.observation_id, correction.observation_id);
  assert.equal(latest.price_usd_per_oz, correction.price_usd_per_oz);
  assert.equal(latest.correction_of_observation_id, predecessor.observation_id);
  assert.equal(
    requestedUrl.searchParams.get('order'),
    'provider_timestamp_utc.desc,ingested_at_utc.desc,observation_id.desc'
  );
  assert.equal(requestedUrl.searchParams.get('metal_symbol'), 'eq.XAU');
  assert.equal(requestedUrl.searchParams.has('is_selected'), false);
  assert.equal(requestedUrl.searchParams.get('limit'), '100');
  assert.match(requestedUrl.searchParams.get('select'), /correction_of_observation_id/);
  assert.match(requestedUrl.searchParams.get('select'), /quality_state/);
  assert.doesNotMatch(requestedUrl.searchParams.get('select'), /raw_payload_hash|workflow_run_id/);
});

test('buildHistoryResponse falls back to JSON snapshot when baseline is unavailable', () => {
  const { body, status } = __testables.buildHistoryResponse({
    range: '7d',
    limit: 120,
    supabaseRows: null,
    baselineHistory: null,
    latestPricePayload: {
      provider: 'file-provider',
      xau_usd_per_oz: 3210.45,
      aed_per_gram_24k: 378.22,
      timestamp_utc: '2026-05-15T00:00:00.000Z',
      fetched_at_utc: '2026-05-15T00:05:00.000Z',
      freshness_seconds: 300,
      is_fresh: true,
      is_fallback: false,
    },
  });
  assert.equal(status, 200);
  assert.equal(body.meta.source, 'json-fallback');
  assert.equal(body.meta.freshness, 'fallback');
  assert.equal(body.data.coverage.snapshotFallback, true);
  assert.equal(body.data.points.length, 1);
});

test('buildHistoryResponse prefers bounded DataCore rollups over the legacy baseline', () => {
  const { body, status } = __testables.buildHistoryResponse({
    range: '7d',
    limit: 120,
    supabaseRows: null,
    staticRollup: {
      payload: { interval: '1h', generatedAtUtc: '2026-08-25T06:00:00.000Z' },
      points: [
        {
          timestampUtc: '2026-08-25T06:00:00.000Z',
          xauUsdPerOz: 4700,
          granularity: 'hourly',
        },
      ],
    },
    baselineHistory: [{ date: '2026-08', price: 4600 }],
    latestPricePayload: null,
  });
  assert.equal(status, 200);
  assert.equal(body.meta.source, 'datacore-static-rollup');
  assert.equal(body.meta.freshness, 'historical');
  assert.equal(body.data.coverage.staticFallback, true);
});

test('buildHistoryResponse returns an explicit empty source when no history data exists', () => {
  const { body, status } = __testables.buildHistoryResponse({
    range: '7d',
    limit: 120,
    supabaseRows: null,
    baselineHistory: null,
    latestPricePayload: null,
  });
  assert.equal(status, 200);
  assert.equal(body.meta.source, 'empty');
  assert.equal(body.data.points.length, 0);
  assert.equal(body.data.coverage.empty, true);
});

test('GET /api/v1/providers/status returns provider status envelope', async () => {
  const res = await get('/api/v1/providers/status');
  assert.equal(res.status, 200);
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.data.sourceMode, 'datacore-static');
  assert.equal(parsed.meta.freshness, 'historical');
});

test('GET /api/v1/prices/history/manifest exposes static provenance without live labeling', async () => {
  const res = await get('/api/v1/prices/history/manifest');
  assert.equal(res.status, 200);
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.data.sourceMode, 'static-fallback');
  assert.equal(parsed.data.freshnessState, 'historical');
  assert.equal(parsed.meta.freshness, 'historical');
  assert.equal(Array.isArray(parsed.data.files), true);
  assert.match(res.headers['cache-control'], /max-age=300/);
});

test('GET /api/v1/providers/runs requires admin auth', async () => {
  const res = await get('/api/v1/providers/runs?limit=10');
  assert.equal(res.status, 401);
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.ok === false || parsed.success === false, true);
});

test('GET /api/v1/prices/snapshots returns fallback snapshot from local JSON', async () => {
  const res = await get('/api/v1/prices/snapshots?limit=1');
  assert.equal(res.status, 200);
  const parsed = JSON.parse(res.body);
  assert.equal(parsed.ok, true);
  assert.equal(Array.isArray(parsed.data.snapshots), true);
  assert.equal(parsed.data.sourceMode, 'file');
  assert.equal('raw_payload_hash' in (parsed.data.snapshots[0] || {}), false);
  assert.equal('workflow_run_id' in (parsed.data.snapshots[0] || {}), false);
});

test('GET /api/v1/prices/history supports every bounded DC-1 range', async () => {
  for (const range of ['1d', '7d', '30d', '90d', '1y', 'all']) {
    const res = await get(`/api/v1/prices/history?range=${range}`);
    assert.equal(res.status, 200, range);
    const parsed = JSON.parse(res.body);
    assert.equal(parsed.data.range, range);
    assert.equal(Array.isArray(parsed.data.points), true);
  }
});

test('GET /api/v1/prices/history rejects invalid ranges and non-gold activation', async () => {
  const invalidRange = await get('/api/v1/prices/history?range=forever');
  assert.equal(invalidRange.status, 400);
  assert.equal(JSON.parse(invalidRange.body).error.code, 'INVALID_HISTORY_RANGE');
  const nonGold = await get('/api/v1/prices/history?range=7d&metal=XAG');
  assert.equal(nonGold.status, 400);
  assert.equal(JSON.parse(nonGold.body).error.code, 'METAL_NOT_ENABLED');
});

test('GET /api/v1/prices/history enforces its dedicated IP rate limit', async () => {
  let rateLimited = null;
  for (let index = 0; index < 40; index += 1) {
    const response = await get('/api/v1/prices/history?range=1d');
    if (response.status === 429) {
      rateLimited = response;
      break;
    }
  }
  assert.ok(rateLimited, 'expected history rate limiter to return 429');
  assert.ok(rateLimited.headers['retry-after']);
  assert.match(rateLimited.body, /RATE_LIMITED/);
});
