'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  validatePricePayload,
  validateObservationCandidate,
  buildCanonicalObservation,
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
  readRemoteControlPlane,
  resolveEnforcementMode,
  run: runDataCoreSync,
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
  assert.deepEqual(rowsA.map((row) => row.source_provider).sort(), ['gold_api_com', 'goldapi_io']);
  assert.equal(new Set(rowsA.map((row) => row.slot_start_utc)).size, 1);
  assert.equal(rowsA[0].slot_5m_utc, '2026-08-24T21:00:00.000Z');
  assert.equal(rowsA[0].metal_symbol, 'XAU');
  assert.equal(rowsA[0].quote_currency, 'USD');
  assert.equal(rowsA[0].slot_resolution_seconds, 300);
  assert.equal(rowsA[0].freshness_state, 'updated');
  assert.equal(floorTimestampToSlot('2026-08-24T21:09:59Z'), '2026-08-24T21:05:00.000Z');
});

test('observation identity is stable across retry telemetry and remains provider-specific', () => {
  const original = payload();
  const retried = payload();
  retried.fetched_at_utc = '2026-08-24T21:04:18.000Z';
  retried.freshness_seconds = 18;
  retried.provider_response_time_ms = 999;
  retried.provider_diagnostics = retried.provider_diagnostics.map((diagnostic) => ({
    ...diagnostic,
    requested_at_utc: '2026-08-24T21:04:18.000Z',
    response_time_ms: Number(diagnostic.response_time_ms || 0) + 50,
  }));
  const originalRows = buildObservationRows(original, { workflowRunId: 'run-a' });
  const retriedRows = buildObservationRows(retried, { workflowRunId: 'run-b' });
  for (const originalRow of originalRows) {
    const retriedRow = retriedRows.find(
      (row) => row.source_provider === originalRow.source_provider
    );
    assert.ok(retriedRow);
    assert.equal(retriedRow.observation_id, originalRow.observation_id);
    assert.notEqual(retriedRow.raw_payload_hash, originalRow.raw_payload_hash);
  }
  assert.notEqual(originalRows[0].observation_id, originalRows[1].observation_id);
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
  assert.equal(merged.rows[0].workflow_run_id, undefined);
  assert.equal(merged.rows[0].raw_payload_hash, undefined);
  assert.equal(merged.rows[0].source_provider, row.source_provider);
});

test('hourly rollups use deterministic OHLC ordering and provider counts', () => {
  const rows = buildObservationRows(payload(), { workflowRunId: 'run-1' });
  const selected = rows.find((row) => row.is_selected);
  const next = {
    ...selected,
    observation_id: `${selected.observation_id}-next`,
    provider_timestamp_utc: '2026-08-24T21:14:00.000Z',
    slot_start_utc: '2026-08-24T21:10:00.000Z',
    price_usd_per_oz: 4710,
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
  assert.equal(rollups[0].average, 4705);
  assert.equal(rollups[0].median, 4705);
  assert.equal(rollups[0].providerCount, 1);
  assert.equal(rollups[0].sourceObservationIds.length, 2);
  assert.equal(rollups[0].sourceObservationHash.length, 64);
  assert.equal(rollups[0].incomplete, true);
});

test('open-market slot counting follows Sunday 21:00 through Friday 20:59 UTC', () => {
  assert.equal(expectedOpenMarketSlots('2026-08-23T21:00:00Z', '2026-08-23T21:10:00Z'), 3);
  assert.equal(expectedOpenMarketSlots('2026-08-21T20:55:00Z', '2026-08-23T21:00:00Z'), 2);
});

test('static rollups replay identically while duplicate quality metrics remain truthful', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gtl-datacore-'));
  try {
    const validated = validatePricePayload(payload());
    const observations = buildObservationRows(payload(), { workflowRunId: 'run-1' });
    const providerRuns = buildProviderRunRows(payload(), validated.normalized, {
      workflowRunId: 'run-1',
    });
    const first = buildStaticArtifacts({
      root,
      observations,
      providerRuns,
      syncState: 'schema_missing',
    });
    const files = [
      path.join(root, 'data', 'history', 'XAU', 'intraday-7d.json'),
      path.join(root, 'data', 'history', 'XAU', 'hourly-90d.json'),
      path.join(root, 'data', 'history', 'XAU', 'daily.json'),
      path.join(root, 'data', 'history', 'XAU', 'quality.json'),
      path.join(root, 'data', 'history', 'manifest.json'),
      path.join(root, 'data', 'provider-health', 'summary.json'),
    ];
    const firstHashes = files.map(hashFile);
    const replay = buildStaticArtifacts({
      root,
      observations,
      providerRuns,
      syncState: 'schema_missing',
    });
    const replayHashes = files.map(hashFile);
    assert.deepEqual(replayHashes.slice(0, 3), firstHashes.slice(0, 3));
    assert.equal(first.duplicateCount, 0);
    assert.equal(replay.duplicateCount, observations.length);
    assert.equal(replay.quality.duplicateCount, observations.length);
    assert.equal(
      JSON.parse(fs.readFileSync(path.join(root, 'data', 'history', 'XAU', 'quality.json'), 'utf8'))
        .duplicateCount,
      observations.length
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('PostgREST reads paginate with stable tie-break ordering and bounded time windows', async () => {
  const calls = [];
  const client = {
    async select(table, query) {
      calls.push({ table, query });
      return { data: [] };
    },
  };
  const remote = await readRemoteControlPlane({
    client,
    nowIso: '2026-08-24T21:04:08.000Z',
    pageSize: 2,
  });
  assert.equal(remote.remoteProviderRuns.length, 0);
  assert.equal(remote.remoteObservations.length, 0);
  const providerQuery = calls.find((call) => call.table === 'provider_runs').query;
  const observationQuery = calls.find((call) => call.table === 'price_snapshots').query;
  assert.equal(providerQuery.order, 'attempted_at_utc.desc,run_key.desc');
  assert.match(providerQuery.and, /attempted_at_utc\.gte\./);
  assert.match(providerQuery.and, /attempted_at_utc\.lte\./);
  assert.equal(providerQuery.offset, undefined);
  assert.equal(observationQuery.order, 'provider_timestamp_utc.asc,observation_id.asc');
  assert.match(observationQuery.and, /provider_timestamp_utc\.gte\./);
  assert.match(observationQuery.and, /ingested_at_utc\.lte\./);
  assert.equal(observationQuery.offset, undefined);
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
  const sql = ['006_datacore_observations.sql', '007_datacore_v2_control_plane.sql']
    .map((file) =>
      fs.readFileSync(path.resolve(__dirname, '..', 'supabase', 'migrations', file), 'utf8')
    )
    .join('\n');
  assert.match(sql, /price_snapshots_reject_mutation/);
  assert.match(sql, /provider_runs_reject_mutation/);
  assert.match(sql, /revoke all on table public\.price_snapshots from anon, authenticated/i);
  assert.match(
    sql,
    /grant select \([\s\S]*observation_id[\s\S]*\) on public\.price_snapshots to anon, authenticated/i
  );
  assert.match(sql, /correction_of_observation_id/);
  assert.match(sql, /quality_flags text\[\]/);
  assert.match(sql, /metal_symbol/);
  assert.match(sql, /revoke all on table public\.price_snapshots from service_role/i);
  assert.match(sql, /grant select, insert on table public\.price_snapshots to service_role/i);
  assert.doesNotMatch(sql, /grant all on table public\.price_snapshots to service_role/i);
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
  assert.match(workflow, /DATACORE_ENFORCEMENT_MODE/);
  assert.match(workflow, /block-public-export/);
});

test('metal-neutral rows never place non-gold values in XAU compatibility columns', () => {
  const normalized = validatePricePayload({
    ...payload(),
    metal_symbol: 'XAG',
    price_usd_per_oz: 56,
    xau_usd_per_oz: undefined,
    aed_per_gram_24k: undefined,
  }).normalized;
  const row = buildCanonicalObservation(normalized);
  assert.equal(row.metal_symbol, 'XAG');
  assert.equal(row.price_usd_per_oz, 56);
  assert.equal(row.xau_usd_per_oz, null);
  assert.equal(row.xau_aed_per_gram, null);
});

test('quality validation rejects impossible future data and flags late/out-of-order arrivals', () => {
  const future = validatePricePayload({
    ...payload(),
    timestamp_utc: '2026-08-24T21:10:00.000Z',
    fetched_at_utc: '2026-08-24T21:04:00.000Z',
  });
  assert.equal(future.ok, false);
  assert.ok(future.errors.includes('future_provider_timestamp'));
  const invalidContract = validatePricePayload({
    ...payload(),
    metal_symbol: 'BTC',
    quote_currency: 'EUR',
  });
  assert.equal(invalidContract.ok, false);
  assert.ok(invalidContract.errors.includes('invalid_metal_symbol'));
  assert.ok(invalidContract.errors.includes('invalid_quote_currency'));

  const normalized = validatePricePayload(payload()).normalized;
  const quality = validateObservationCandidate(
    { ...normalized, ingestedAtUtc: '2026-08-24T22:00:00.000Z' },
    { latestProviderTimestampUtc: '2026-08-24T21:09:00.000Z' }
  );
  assert.equal(quality.ok, true);
  assert.ok(quality.warnings.includes('late_arrival'));
  assert.ok(quality.warnings.includes('out_of_order'));
});

test('corrections are additive and link to the immutable predecessor', () => {
  const first = buildObservationRows(payload(), { workflowRunId: 'run-a' }).find(
    (row) => row.is_selected
  );
  const correctedPayload = { ...payload(), xau_usd_per_oz: 4701 };
  const corrected = buildObservationRows(correctedPayload, {
    workflowRunId: 'run-b',
    existingObservations: [first],
  }).find((row) => row.is_selected);
  assert.notEqual(corrected.observation_id, first.observation_id);
  assert.equal(corrected.is_correction, true);
  assert.equal(corrected.correction_of_observation_id, first.observation_id);
  const merged = mergeObservationRows([first], [corrected]);
  assert.equal(merged.rows.length, 2);
});

test('sync links a correction to the prior archived observation across workflow runs', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'datacore-correction-'));
  const inputPath = path.join(root, 'gold-price.json');
  try {
    fs.writeFileSync(inputPath, JSON.stringify(payload()));
    await runDataCoreSync({
      root,
      env: {
        PRICE_JSON_PATH: inputPath,
        DATACORE_ENFORCEMENT_MODE: 'observe-only',
        GITHUB_RUN_ID: 'correction-run-a',
      },
    });
    const correctedPayload = payload();
    correctedPayload.xau_usd_per_oz = 4701;
    correctedPayload.provider_diagnostics[0].normalized_price = 4701;
    fs.writeFileSync(inputPath, JSON.stringify(correctedPayload));
    await runDataCoreSync({
      root,
      env: {
        PRICE_JSON_PATH: inputPath,
        DATACORE_ENFORCEMENT_MODE: 'observe-only',
        GITHUB_RUN_ID: 'correction-run-b',
      },
    });
    const archive = JSON.parse(
      fs.readFileSync(
        path.join(root, 'data', 'history', 'XAU', 'observations', '2026-08.json'),
        'utf8'
      )
    ).observations;
    const providerRows = archive.filter((row) => row.source_provider === 'gold_api_com');
    const original = providerRows.find((row) => row.price_usd_per_oz === 4700);
    const correction = providerRows.find((row) => row.price_usd_per_oz === 4701);
    assert.ok(original);
    assert.ok(correction);
    assert.equal(correction.is_correction, true);
    assert.equal(correction.correction_of_observation_id, original.observation_id);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('rejected observation rows propagate into the quality gate during a read-only preview', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'datacore-rejected-preview-'));
  try {
    const accepted = buildObservationRows(payload(), { workflowRunId: 'accepted' }).find(
      (row) => row.is_selected
    );
    const rejected = {
      ...accepted,
      observation_id: 'future-rejected-observation',
      quality_state: 'rejected',
      quality_flags: ['future_provider_timestamp'],
    };
    const result = buildStaticArtifacts({
      root,
      observations: [accepted, rejected],
      writeHistory: false,
      publishPublic: false,
    });
    assert.equal(result.quality.gateStatus, 'fail');
    assert.deepEqual(result.quality.failures, [
      'future_observation_rejected',
      'invalid_observation_rejected',
    ]);
    assert.equal(result.quality.invalidObservationCount, 1);
    assert.equal(result.quality.futureObservationCount, 1);
    assert.equal(fs.existsSync(path.join(root, 'data')), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('quality profile reports maximum gaps and does not fill missing slots', () => {
  const first = buildObservationRows(payload(), { workflowRunId: 'gap-a' }).find(
    (row) => row.is_selected
  );
  const second = {
    ...first,
    observation_id: `${first.observation_id}-gap`,
    provider_timestamp_utc: '2026-08-24T22:04:00.000Z',
    timestamp_utc: '2026-08-24T22:04:00.000Z',
    slot_start_utc: '2026-08-24T22:00:00.000Z',
    slot_5m_utc: '2026-08-24T22:00:00.000Z',
  };
  const quality = buildQualityProfile([first, second], []);
  assert.ok(quality.coverage.missingOpenMarketSlots > 0);
  assert.ok(quality.coverage.maxGapSeconds > 0);
  assert.equal(quality.gateStatus, 'warn');
});

test('enforcement modes are explicit and invalid values fail back to observe-only', () => {
  assert.equal(resolveEnforcementMode('warn'), 'warn');
  assert.equal(resolveEnforcementMode('block-history-write'), 'block-history-write');
  assert.equal(resolveEnforcementMode('block-public-export'), 'block-public-export');
  assert.equal(resolveEnforcementMode('invalid'), 'observe-only');
});

test('block-history-write rejects invalid input while observe-only reports it', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'datacore-gate-'));
  const invalidPath = path.join(root, 'invalid.json');
  fs.writeFileSync(invalidPath, JSON.stringify({ provider: 'bad' }));
  try {
    const observed = await runDataCoreSync({
      root,
      env: { PRICE_JSON_PATH: invalidPath, DATACORE_ENFORCEMENT_MODE: 'observe-only' },
    });
    assert.equal(observed.reason, 'validation_failed');
    assert.equal(observed.historyWriteBlocked, false);
    const exportBlocked = await runDataCoreSync({
      root,
      env: { PRICE_JSON_PATH: invalidPath, DATACORE_ENFORCEMENT_MODE: 'block-public-export' },
    });
    assert.equal(exportBlocked.publicExportBlocked, true);
    assert.equal(exportBlocked.staticExportUpdated, false);
    await assert.rejects(
      runDataCoreSync({
        root,
        env: { PRICE_JSON_PATH: invalidPath, DATACORE_ENFORCEMENT_MODE: 'block-history-write' },
      }),
      /quality|validation/i
    );
    assert.equal(fs.existsSync(path.join(root, 'data', 'history', 'XAU')), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('block-public-export rejects a future provider row before any remote or artifact write', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'datacore-public-gate-'));
  const inputPath = path.join(root, 'gold-price.json');
  const requests = [];
  const gatePayload = payload();
  gatePayload.provider_diagnostics.push({
    provider: 'future_provider',
    requested_at_utc: '2026-08-24T21:04:08.000Z',
    status: 'success',
    valid: true,
    response_time_ms: 20,
    provider_timestamp: '2026-08-24T21:10:00.000Z',
    normalized_price: 4699,
    reason: 'fresh',
  });
  fs.writeFileSync(inputPath, JSON.stringify(gatePayload));
  try {
    const result = await runDataCoreSync({
      root,
      env: {
        PRICE_JSON_PATH: inputPath,
        DATACORE_ENFORCEMENT_MODE: 'block-public-export',
        SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_SERVICE_ROLE_KEY: 'service-role-test-key',
        GITHUB_RUN_ID: 'blocked-public-export',
      },
      fetchImpl: async (url, options = {}) => {
        requests.push({ url: String(url), method: options.method || 'GET' });
        return new Response('[]', { status: 200 });
      },
    });
    assert.equal(result.reason, 'quality_gate_blocked_public_export');
    assert.equal(result.gateStatus, 'fail');
    assert.deepEqual(result.gateFailures, [
      'future_observation_rejected',
      'invalid_observation_rejected',
    ]);
    assert.equal(result.publicExportBlocked, true);
    assert.equal(result.staticExportUpdated, false);
    assert.ok(requests.length >= 2);
    assert.equal(
      requests.every((request) => request.method === 'GET'),
      true
    );
    assert.equal(fs.existsSync(path.join(root, 'data', 'history')), false);
    assert.equal(fs.existsSync(path.join(root, 'data', 'provider-health')), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
