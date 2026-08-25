'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  validatePricePayload,
  buildObservationRows,
  buildProviderRunRows,
  computeProviderHealthRows,
  floorTimestampToSlot,
  createPostgrestQueryClient,
} = require('../server/lib/price-snapshots');
const {
  mergeObservationRows,
  expectedOpenMarketSlots,
  buildRollups,
  buildQualityProfile,
  buildStaticArtifacts,
} = require('../scripts/node/build-datacore-history');
const {
  createPostgrestClient,
  isSchemaMissingError,
  recordOutputs,
} = require('../scripts/node/sync-price-snapshot');

function payload() {
  return {
    provider: 'gold_api_com',
    xau_usd_per_oz: 4700,
    aed_per_gram_24k: 554.9,
    quote_currency: 'USD',
    timestamp_utc: '2026-08-24T21:04:00.000Z',
    fetched_at_utc: '2026-08-24T21:04:08.000Z',
    freshness_seconds: 8,
    is_fresh: true,
    is_fallback: false,
    is_market_open: true,
    provider_response_time_ms: 120,
    selection_method: 'median_consensus',
    provider_diagnostics: [
      {
        provider: 'gold_api_com',
        requested_at_utc: '2026-08-24T21:04:08.000Z',
        status: 'success',
        valid: true,
        response_time_ms: 120,
        provider_timestamp: '2026-08-24T21:04:00.000Z',
        normalized_price: 4700,
        reason: 'fresh',
      },
      {
        provider: 'goldapi_io',
        requested_at_utc: '2026-08-24T21:04:08.000Z',
        status: 'success',
        valid: true,
        response_time_ms: 220,
        provider_timestamp: '2026-08-24T21:03:58.000Z',
        normalized_price: 4704.7,
        reason: 'fresh',
      },
      {
        provider: 'twelvedata_xauusd',
        requested_at_utc: '2026-08-24T21:04:08.000Z',
        status: 'error',
        valid: false,
        response_time_ms: 500,
        provider_timestamp: null,
        normalized_price: null,
        reason: 'timeout',
      },
    ],
  };
}

function hashFile(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

test('canonical observations keep provider identity, selection, slot, and stable IDs', () => {
  const rowsA = buildObservationRows(payload(), { workflowRunId: 'run-1' });
  const rowsB = buildObservationRows({ ...payload() }, { workflowRunId: 'run-1' });
  assert.equal(rowsA.length, 2);
  assert.deepEqual(
    rowsA.map((row) => row.observation_id),
    rowsB.map((row) => row.observation_id)
  );
  assert.equal(rowsA.filter((row) => row.is_selected).length, 1);
  assert.equal(rowsA[0].slot_5m_utc, '2026-08-24T21:00:00.000Z');
  assert.equal(floorTimestampToSlot('2026-08-24T21:09:59Z'), '2026-08-24T21:05:00.000Z');
});

test('provider runs preserve failures, latency, selection, and divergence inputs', () => {
  const validated = validatePricePayload(payload());
  const rows = buildProviderRunRows(payload(), validated.normalized, {
    workflowRunId: 'run-1',
    circuitState: 'closed',
  });
  assert.equal(rows.length, 3);
  assert.equal(rows.find((row) => row.provider_name === 'gold_api_com').selected, true);
  assert.equal(rows.find((row) => row.provider_name === 'goldapi_io').deviation_bps, 10);
  assert.equal(rows.find((row) => row.provider_name === 'twelvedata_xauusd').status, 'error');
});

test('a selected fallback provider remains marked selected in provider telemetry', () => {
  const fallbackPayload = {
    ...payload(),
    is_fresh: false,
    is_fallback: true,
    provider_diagnostics: [],
  };
  const validated = validatePricePayload(fallbackPayload);
  const [row] = buildProviderRunRows(fallbackPayload, validated.normalized, {
    workflowRunId: 'run-fallback',
  });
  assert.equal(row.status, 'fallback');
  assert.equal(row.selected, true);
});

test('provider health computes success, p95 latency, and circuit transitions deterministically', () => {
  const rows = [
    {
      provider_name: 'p',
      status: 'success',
      latency_ms: 100,
      freshness_seconds: 5,
      circuit_state: 'closed',
      attempted_at_utc: '2026-08-24T21:00:00.000Z',
      deviation_bps: 0,
    },
    {
      provider_name: 'p',
      status: 'error',
      latency_ms: 900,
      freshness_seconds: null,
      circuit_state: 'open',
      attempted_at_utc: '2026-08-24T21:05:00.000Z',
      deviation_bps: null,
    },
  ];
  const health = computeProviderHealthRows(rows, { nowIso: '2026-08-24T21:05:00.000Z' });
  assert.equal(health[0].success_rate_24h, 50);
  assert.equal(health[0].p95_latency_24h, 900);
  assert.equal(health[0].circuit_transition_count_24h, 1);
  assert.equal(health[0].current_status, 'error');
});

test('quality profile counts selected-provider source transitions chronologically', () => {
  const first = buildObservationRows(payload(), { workflowRunId: 'run-1' }).find(
    (row) => row.is_selected
  );
  const second = {
    ...first,
    observation_id: 'later-provider-b',
    source_provider: 'provider_b',
    timestamp_utc: '2026-08-24T21:09:00.000Z',
    slot_5m_utc: '2026-08-24T21:05:00.000Z',
  };
  const third = {
    ...second,
    observation_id: 'later-provider-b-again',
    timestamp_utc: '2026-08-24T21:14:00.000Z',
    slot_5m_utc: '2026-08-24T21:10:00.000Z',
  };
  const quality = buildQualityProfile([third, first, second], []);
  assert.equal(quality.sourceTransitionCount, 1);
});

test('append-only archive replay deduplicates without rewriting an existing observation', () => {
  const [row] = buildObservationRows(payload(), { workflowRunId: 'first-run' });
  const replay = { ...row, workflow_run_id: 'retry-run', fetched_at_utc: '2026-08-24T21:04:12Z' };
  const merged = mergeObservationRows([row], [replay]);
  assert.equal(merged.rows.length, 1);
  assert.equal(merged.insertedCount, 0);
  assert.equal(merged.duplicateCount, 1);
  assert.equal(merged.rows[0].workflow_run_id, 'first-run');
});

test('hourly rollups use deterministic OHLC ordering and provider counts', () => {
  const rows = buildObservationRows(payload(), { workflowRunId: 'run-1' });
  const selected = rows.find((row) => row.is_selected);
  const next = {
    ...selected,
    observation_id: `${selected.observation_id}-next`,
    timestamp_utc: '2026-08-24T21:14:00.000Z',
    slot_5m_utc: '2026-08-24T21:10:00.000Z',
    xau_usd_per_oz: 4710,
  };
  const rollups = buildRollups([next, selected], '1h');
  assert.equal(rollups.length, 1);
  assert.equal(rollups[0].open, 4700);
  assert.equal(rollups[0].close, 4710);
  assert.equal(rollups[0].high, 4710);
  assert.equal(rollups[0].observationCount, 2);
});

test('open-market slot counting follows Sunday 21:00 through Friday 20:59 UTC', () => {
  assert.equal(expectedOpenMarketSlots('2026-08-23T21:00:00Z', '2026-08-23T21:10:00Z'), 3);
  assert.equal(expectedOpenMarketSlots('2026-08-21T20:55:00Z', '2026-08-23T21:00:00Z'), 2);
});

test('static fallback is byte-reproducible when the same workflow run is replayed', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gtl-datacore-'));
  try {
    const validated = validatePricePayload(payload());
    const observations = buildObservationRows(payload(), { workflowRunId: 'run-1' });
    const providerRuns = buildProviderRunRows(payload(), validated.normalized, {
      workflowRunId: 'run-1',
    });
    buildStaticArtifacts({ root, observations, providerRuns, syncState: 'schema_missing' });
    const files = [
      path.join(root, 'data', 'history', 'xau-usd', 'hourly-latest.json'),
      path.join(root, 'data', 'history', 'xau-usd', 'daily-latest.json'),
      path.join(root, 'data', 'history', 'manifest.json'),
      path.join(root, 'data', 'provider-health', 'summary.json'),
    ];
    const firstHashes = files.map(hashFile);
    buildStaticArtifacts({ root, observations, providerRuns, syncState: 'schema_missing' });
    assert.deepEqual(files.map(hashFile), firstHashes);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('PostgREST client sends conflict-safe inserts without exposing the key in the URL', async () => {
  let request;
  const client = createPostgrestClient({
    url: 'https://example.supabase.co',
    key: 'service-role-test-key',
    fetchImpl: async (url, options) => {
      request = { url: String(url), options };
      return new Response('[]', { status: 201, headers: { 'content-type': 'application/json' } });
    },
  });
  await client.insert('price_snapshots', [{ observation_id: 'one' }], {
    onConflict: 'observation_id',
    ignoreDuplicates: true,
  });
  assert.match(request.url, /on_conflict=observation_id/);
  assert.doesNotMatch(request.url, /service-role-test-key/);
  assert.match(request.options.headers.Prefer, /resolution=ignore-duplicates/);
});

test('server PostgREST query adapter supports the API route select chain without a dependency', async () => {
  let requestUrl = '';
  const client = createPostgrestQueryClient({
    url: 'https://example.supabase.co',
    key: 'service-role-test-key',
    fetchImpl: async (url) => {
      requestUrl = String(url);
      return new Response('[{"observation_id":"one"}]', { status: 200 });
    },
  });
  const { data, error } = await client
    .from('price_snapshots')
    .select('observation_id')
    .eq('symbol', 'XAUUSD')
    .order('timestamp_utc', { ascending: false })
    .limit(1);
  assert.equal(error, null);
  assert.equal(data[0].observation_id, 'one');
  assert.match(requestUrl, /symbol=eq.XAUUSD/);
  assert.doesNotMatch(requestUrl, /service-role-test-key/);
});

test('schema-missing classifier recognizes PostgREST cache and column errors', () => {
  assert.equal(isSchemaMissingError({ code: 'PGRST205' }), true);
  assert.equal(isSchemaMissingError({ code: '42703' }), true);
  assert.equal(isSchemaMissingError({ code: 'PGRST301' }), false);
});

test('an idempotent remote replay remains truthfully reported as synchronized', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'datacore-output-'));
  const outputPath = path.join(directory, 'github-output.txt');
  const previousOutput = process.env.GITHUB_OUTPUT;
  process.env.GITHUB_OUTPUT = outputPath;
  try {
    recordOutputs({
      reason: 'duplicate_observations',
      schemaState: 'ready',
      observationRows: 1,
      insertedObservations: 0,
      duplicateObservations: 1,
      providerRunRows: 1,
      insertedProviderRuns: 0,
      providerHealthRows: 1,
      staticExportUpdated: true,
      staticObservationCount: 1,
      staticMissingSlotRate: null,
    });
    const output = fs.readFileSync(outputPath, 'utf8');
    assert.match(output, /^snapshot_synced=true$/m);
    assert.match(output, /^snapshot_duplicate=true$/m);
  } finally {
    if (previousOutput === undefined) delete process.env.GITHUB_OUTPUT;
    else process.env.GITHUB_OUTPUT = previousOutput;
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('DataCore migration keeps raw writes service-role-only and append-only', () => {
  const sql = fs.readFileSync(
    path.resolve(__dirname, '..', 'supabase', 'migrations', '006_datacore_observations.sql'),
    'utf8'
  );
  assert.match(sql, /price_snapshots_reject_mutation/);
  assert.match(sql, /provider_runs_reject_mutation/);
  assert.match(sql, /revoke all on table public\.price_snapshots from anon, authenticated/i);
  assert.match(sql, /grant select on table public\.price_snapshots to anon, authenticated/i);
  assert.match(sql, /grant all on table public\.price_snapshots to service_role/i);
  assert.doesNotMatch(sql, /for (?:insert|update|delete)\s+to authenticated/i);
});

test('gold workflow commits bounded DataCore outputs and emits continuity truth', () => {
  const workflow = fs.readFileSync(
    path.resolve(__dirname, '..', '.github', 'workflows', 'gold-price-fetch.yml'),
    'utf8'
  );
  assert.match(workflow, /data\/history data\/provider-health/);
  assert.match(workflow, /datacore_schema_state/);
  assert.match(workflow, /observation_duplicates/);
  assert.match(workflow, /static_missing_slot_rate/);
});
