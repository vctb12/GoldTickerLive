#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const {
  validatePricePayload,
  buildObservationRows,
  buildProviderRunRows,
  computeProviderHealthRows,
} = require('../../server/lib/price-snapshots');
const {
  buildStaticArtifacts,
  loadObservationArchivesForRoot,
} = require('./build-datacore-history');

const ROOT = path.resolve(__dirname, '../..');
const REMOTE_HISTORY_DAYS = 90;
const POSTGREST_PAGE_SIZE = 1000;
const POSTGREST_MAX_PAGES = 200;
const ENFORCEMENT_MODES = Object.freeze([
  'observe-only',
  'warn',
  'block-history-write',
  'block-public-export',
]);

function resolveEnforcementMode(value) {
  const mode = String(value || 'observe-only')
    .trim()
    .toLowerCase();
  return ENFORCEMENT_MODES.includes(mode) ? mode : 'observe-only';
}

function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function appendGithubOutput(name, value, env = process.env) {
  if (!env.GITHUB_OUTPUT) return;
  try {
    fs.appendFileSync(env.GITHUB_OUTPUT, `${name}=${String(value)}\n`, 'utf8');
  } catch {
    // A summary-output failure must not hide the primary data result.
  }
}

function writeSummary(lines, env = process.env) {
  if (!env.GITHUB_STEP_SUMMARY || !Array.isArray(lines) || !lines.length) return;
  try {
    fs.appendFileSync(env.GITHUB_STEP_SUMMARY, `${lines.join('\n')}\n`, 'utf8');
  } catch {
    // Best effort only.
  }
}

function createPostgrestClient({ url, key, fetchImpl = globalThis.fetch } = {}) {
  if (!url || !key || typeof fetchImpl !== 'function') return null;
  const baseUrl = String(url).replace(/\/$/, '');
  async function request(table, { method = 'GET', query = {}, body = null, prefer = [] } = {}) {
    const endpoint = new URL(`${baseUrl}/rest/v1/${encodeURIComponent(table)}`);
    for (const [name, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue;
      endpoint.searchParams.set(name, String(value));
    }
    const headers = { apikey: key, Authorization: `Bearer ${key}` };
    if (body !== null) headers['Content-Type'] = 'application/json';
    if (prefer.length) headers.Prefer = prefer.join(',');
    const response = await fetchImpl(endpoint, {
      method,
      headers,
      body: body === null ? undefined : JSON.stringify(body),
    });
    const responseText = await response.text();
    let data = null;
    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch {
        data = responseText;
      }
    }
    if (!response.ok) {
      const error = new Error(
        `PostgREST ${method} ${table} failed (${response.status}): ${data?.message || response.statusText}`
      );
      error.status = response.status;
      error.code = data?.code || null;
      error.details = data?.details || null;
      throw error;
    }
    return { data, contentRange: response.headers.get('content-range'), status: response.status };
  }
  return {
    request,
    async insert(table, rows, { onConflict = null, ignoreDuplicates = false } = {}) {
      const prefer = ['return=representation'];
      if (ignoreDuplicates) prefer.unshift('resolution=ignore-duplicates');
      return request(table, {
        method: 'POST',
        query: onConflict ? { on_conflict: onConflict } : {},
        body: rows,
        prefer,
      });
    },
    async upsert(table, rows, onConflict) {
      return request(table, {
        method: 'POST',
        query: { on_conflict: onConflict },
        body: rows,
        prefer: ['resolution=merge-duplicates', 'return=representation'],
      });
    },
    async select(table, query) {
      return request(table, { query });
    },
  };
}

function isSchemaMissingError(error) {
  return ['PGRST204', 'PGRST205', '42P01', '42703'].includes(String(error?.code || ''));
}

function quotePostgrestLiteral(value) {
  return `"${String(value).replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;
}

function tupleCursorFilter(timestampColumn, idColumn, cursor, direction) {
  if (!cursor) return null;
  const operator = direction === 'desc' ? 'lt' : 'gt';
  const timestamp = quotePostgrestLiteral(cursor.timestamp);
  const id = quotePostgrestLiteral(cursor.id);
  return `(${timestampColumn}.${operator}.${timestamp},and(${timestampColumn}.eq.${timestamp},${idColumn}.${operator}.${id}))`;
}

async function selectAllKeysetPages(
  client,
  table,
  query,
  {
    timestampColumn,
    idColumn,
    direction = 'asc',
    pageSize = POSTGREST_PAGE_SIZE,
    maxPages = POSTGREST_MAX_PAGES,
  } = {}
) {
  if (!timestampColumn || !idColumn || !['asc', 'desc'].includes(direction)) {
    throw new Error(`PostgREST ${table} keyset pagination requires a complete tuple order`);
  }
  const rows = [];
  const seenTuples = new Set();
  const boundedPageSize = Math.max(1, Math.trunc(Number(pageSize)) || POSTGREST_PAGE_SIZE);
  const boundedMaxPages = Math.max(1, Math.trunc(Number(maxPages)) || POSTGREST_MAX_PAGES);
  let cursor = null;
  for (let page = 0; page < boundedMaxPages; page += 1) {
    const cursorFilter = tupleCursorFilter(timestampColumn, idColumn, cursor, direction);
    const response = await client.select(table, {
      ...query,
      order: `${timestampColumn}.${direction},${idColumn}.${direction}`,
      limit: boundedPageSize,
      or: cursorFilter || undefined,
    });
    const pageRows = Array.isArray(response.data) ? response.data : [];
    if (!pageRows.length) return rows;
    for (const row of pageRows) {
      const timestamp = row?.[timestampColumn];
      const id = row?.[idColumn];
      if (!timestamp || !id) {
        throw new Error(`PostgREST ${table} keyset row is missing ${timestampColumn}/${idColumn}`);
      }
      const tuple = `${timestamp}\u0000${id}`;
      if (seenTuples.has(tuple)) {
        throw new Error(`PostgREST ${table} keyset pagination repeated tuple ${tuple}`);
      }
      seenTuples.add(tuple);
      rows.push(row);
    }
    const last = pageRows.at(-1);
    const nextCursor = {
      timestamp: String(last[timestampColumn]),
      id: String(last[idColumn]),
    };
    if (cursor && cursor.timestamp === nextCursor.timestamp && cursor.id === nextCursor.id) {
      throw new Error(`PostgREST ${table} keyset pagination did not advance`);
    }
    cursor = nextCursor;
  }
  throw new Error(
    `PostgREST ${table} pagination exceeded ${boundedMaxPages} pages of ${boundedPageSize} rows`
  );
}

function deduplicateRows(rows, keyName) {
  const byKey = new Map();
  for (const row of Array.isArray(rows) ? rows : []) {
    const key = row?.[keyName];
    if (!key || byKey.has(key)) continue;
    byKey.set(key, row);
  }
  return [...byKey.values()];
}

function findMissingRemoteCorrectionTargets(observations, remoteObservations) {
  const batchIds = new Set(
    (Array.isArray(observations) ? observations : [])
      .map((row) => row?.observation_id)
      .filter(Boolean)
  );
  const remoteIds = new Set(
    (Array.isArray(remoteObservations) ? remoteObservations : [])
      .map((row) => row?.observation_id)
      .filter(Boolean)
  );
  return [
    ...new Set(
      (Array.isArray(observations) ? observations : [])
        .map((row) => row?.correction_of_observation_id)
        .filter((targetId) => targetId && !batchIds.has(targetId) && !remoteIds.has(targetId))
    ),
  ].sort();
}

function assertRemoteCorrectionTargets(observations, remoteObservations) {
  const missingTargets = findMissingRemoteCorrectionTargets(observations, remoteObservations);
  if (!missingTargets.length) return;
  const error = new Error(
    `DataCore correction targets are absent from the remote control plane: ${missingTargets.join(',')}`
  );
  error.code = 'DATACORE_CORRECTION_TARGET_MISSING_REMOTE';
  error.missingTargets = missingTargets;
  throw error;
}

async function readRemoteControlPlane({ client, nowIso, pageSize = POSTGREST_PAGE_SIZE }) {
  const since24h = new Date(new Date(nowIso).getTime() - 24 * 60 * 60 * 1000).toISOString();
  const sinceHistory = new Date(
    new Date(nowIso).getTime() - REMOTE_HISTORY_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();
  const [remoteProviderRuns, remoteObservations] = await Promise.all([
    selectAllKeysetPages(
      client,
      'provider_runs',
      {
        select:
          'run_key,metal_symbol,provider_name,status,latency_ms,freshness_seconds,circuit_state,deviation_bps,attempted_at_utc,created_at',
        and: `(attempted_at_utc.gte.${quotePostgrestLiteral(since24h)},attempted_at_utc.lte.${quotePostgrestLiteral(nowIso)})`,
      },
      {
        timestampColumn: 'attempted_at_utc',
        idColumn: 'run_key',
        direction: 'desc',
        pageSize,
      }
    ),
    selectAllKeysetPages(
      client,
      'price_snapshots',
      {
        select:
          'observation_id,metal_symbol,quote_currency,price_usd_per_oz,price_aed_per_gram,source_provider,provider_chain,provider_timestamp_utc,fetched_at_utc,ingested_at_utc,slot_start_utc,slot_resolution_seconds,market_state,freshness_state,freshness_seconds,is_selected,selection_method,deviation_bps,provider_response_time_ms,quality_state,quality_flags,correction_of_observation_id,is_correction,raw_payload_hash,workflow_run_id,schema_version,symbol,currency,timestamp_utc,slot_5m_utc,xau_usd_per_oz,xau_aed_per_gram,is_fresh,is_fallback,is_market_open',
        metal_symbol: 'eq.XAU',
        and: `(provider_timestamp_utc.gte.${quotePostgrestLiteral(sinceHistory)},ingested_at_utc.lte.${quotePostgrestLiteral(nowIso)})`,
      },
      {
        timestampColumn: 'provider_timestamp_utc',
        idColumn: 'observation_id',
        direction: 'asc',
        pageSize,
      }
    ),
  ]);
  return { remoteObservations, remoteProviderRuns };
}

async function syncRemoteControlPlane({
  client,
  observations,
  providerRuns,
  nowIso,
  remoteObservations = null,
  remoteProviderRuns = null,
}) {
  const preloaded =
    Array.isArray(remoteObservations) && Array.isArray(remoteProviderRuns)
      ? { remoteObservations, remoteProviderRuns }
      : await readRemoteControlPlane({ client, nowIso });
  assertRemoteCorrectionTargets(observations, preloaded.remoteObservations);
  const observationInsert = observations.length
    ? await client.insert('price_snapshots', observations, {
        onConflict: 'observation_id',
        ignoreDuplicates: true,
      })
    : { data: [] };
  const insertedObservations = Array.isArray(observationInsert.data)
    ? observationInsert.data.length
    : 0;
  const providerRunInsert = providerRuns.length
    ? await client.insert('provider_runs', providerRuns, {
        onConflict: 'run_key',
        ignoreDuplicates: true,
      })
    : { data: [] };
  const insertedProviderRuns = Array.isArray(providerRunInsert.data)
    ? providerRunInsert.data.length
    : 0;
  const allProviderRuns = deduplicateRows(
    [...preloaded.remoteProviderRuns, ...providerRuns],
    'run_key'
  );
  const providerHealthRows = computeProviderHealthRows(allProviderRuns, { nowIso });
  if (providerHealthRows.length) {
    await client.upsert('provider_health', providerHealthRows, 'metal_symbol,provider_name');
  }
  return {
    insertedObservations,
    duplicateObservations: Math.max(0, observations.length - insertedObservations),
    insertedProviderRuns,
    duplicateProviderRuns: Math.max(0, providerRuns.length - insertedProviderRuns),
    remoteObservations: preloaded.remoteObservations,
    remoteProviderRuns: allProviderRuns,
    providerHealthRows,
  };
}

function emptyResult(overrides = {}) {
  return {
    reason: 'not_run',
    schemaState: 'not_checked',
    enforcementMode: 'observe-only',
    gateStatus: 'fail',
    gateFailures: [],
    gateWarnings: [],
    observationRows: 0,
    insertedObservations: 0,
    duplicateObservations: 0,
    providerRunRows: 0,
    insertedProviderRuns: 0,
    providerHealthRows: 0,
    historyWriteBlocked: false,
    publicExportBlocked: false,
    staticExportUpdated: false,
    staticObservationCount: 0,
    staticRehydratedOverlapCount: 0,
    staticMissingSlotRate: null,
    staticMaxGapSeconds: 0,
    ...overrides,
  };
}

function recordOutputs(result, env = process.env) {
  const gateFailures = Array.isArray(result.gateFailures) ? result.gateFailures : [];
  const gateWarnings = Array.isArray(result.gateWarnings) ? result.gateWarnings : [];
  const outputs = {
    snapshot_synced: result.schemaState === 'ready',
    snapshot_duplicate: result.duplicateObservations > 0,
    snapshot_sync_reason: result.reason,
    datacore_schema_state: result.schemaState,
    datacore_enforcement_mode: result.enforcementMode,
    datacore_gate_status: result.gateStatus,
    datacore_gate_failures: gateFailures.join(','),
    datacore_gate_warnings: gateWarnings.join(','),
    observation_rows: result.observationRows,
    observation_inserted: result.insertedObservations,
    observation_duplicates: result.duplicateObservations,
    provider_run_rows: result.providerRunRows,
    provider_runs_inserted: result.insertedProviderRuns,
    provider_health_rows: result.providerHealthRows,
    history_write_blocked: result.historyWriteBlocked,
    public_export_blocked: result.publicExportBlocked,
    static_export_updated: result.staticExportUpdated,
    static_observation_count: result.staticObservationCount,
    static_rehydrated_overlap_count: result.staticRehydratedOverlapCount ?? 0,
    static_missing_slot_rate: result.staticMissingSlotRate ?? 'n/a',
    static_max_gap_seconds: result.staticMaxGapSeconds,
  };
  for (const [name, value] of Object.entries(outputs)) appendGithubOutput(name, value, env);
}

async function run({ env = process.env, fetchImpl = globalThis.fetch, root = ROOT } = {}) {
  const enforcementMode = resolveEnforcementMode(env.DATACORE_ENFORCEMENT_MODE);
  const payload = readJsonFile(env.PRICE_JSON_PATH || path.join(root, 'data', 'gold_price.json'));
  if (!payload) {
    const result = emptyResult({ reason: 'invalid_payload_file', enforcementMode });
    recordOutputs(result, env);
    if (enforcementMode === 'block-history-write') {
      throw new Error('gold_price.json is missing or invalid JSON');
    }
    return result;
  }

  const validated = validatePricePayload(payload);
  if (!validated.ok) {
    const result = emptyResult({
      reason: 'validation_failed',
      enforcementMode,
      gateStatus: 'fail',
      gateFailures: validated.errors,
      gateWarnings: validated.warnings,
      historyWriteBlocked: enforcementMode === 'block-history-write',
      publicExportBlocked: enforcementMode === 'block-public-export',
    });
    recordOutputs(result, env);
    appendGithubOutput('snapshot_validation_error', validated.errors.join('; '), env);
    if (enforcementMode === 'block-history-write') {
      throw new Error(`snapshot validation failed: ${validated.errors.join('; ')}`);
    }
    return result;
  }

  const providerChain = env.PRICE_PROVIDER_CHAIN || '';
  const circuitState = env.PRICE_CIRCUIT_STATE || null;
  const workflowRunId = env.GITHUB_RUN_ID || `local-${Date.now()}`;
  const providerRuns = buildProviderRunRows(payload, validated.normalized, {
    circuitState,
    workflowRunId,
  });
  const nowIso = validated.normalized.ingestedAtUtc;
  const client = createPostgrestClient({
    url: env.SUPABASE_URL,
    key: env.SUPABASE_SERVICE_ROLE_KEY,
    fetchImpl,
  });
  const localObservations = loadObservationArchivesForRoot(root);
  let remoteRead = { remoteObservations: [], remoteProviderRuns: [] };
  let reason = client ? 'sync_failed' : 'supabase_not_configured';
  let schemaState = client ? 'unknown' : 'not_configured';
  let remoteError = null;
  if (client) {
    try {
      remoteRead = await readRemoteControlPlane({ client, nowIso });
      schemaState = 'ready';
      reason = 'ready_for_sync';
    } catch (error) {
      remoteError = error;
      schemaState = isSchemaMissingError(error) ? 'migration_required' : 'error';
      reason = isSchemaMissingError(error) ? 'schema_missing' : 'sync_failed';
    }
  }
  const observations = buildObservationRows(payload, {
    providerChain,
    circuitState,
    workflowRunId,
    existingObservations: [...localObservations, ...remoteRead.remoteObservations],
  });
  const telemetryInputs = deduplicateRows(
    [...remoteRead.remoteProviderRuns, ...providerRuns],
    'run_key'
  );

  if (client && schemaState === 'ready') {
    try {
      assertRemoteCorrectionTargets(observations, remoteRead.remoteObservations);
    } catch (error) {
      const result = emptyResult({
        reason: 'correction_target_missing_remote',
        schemaState,
        enforcementMode,
        gateStatus: 'fail',
        gateFailures: ['missing_remote_correction_target'],
        observationRows: observations.length,
        providerRunRows: providerRuns.length,
        historyWriteBlocked: true,
        publicExportBlocked: true,
      });
      recordOutputs(result, env);
      throw error;
    }
  }

  // Blocking modes evaluate a read-only view before any remote or filesystem mutation.
  const preview = buildStaticArtifacts({
    root,
    observations,
    rehydratedObservations: remoteRead.remoteObservations,
    providerRuns: telemetryInputs,
    syncState: 'quality-preview',
    writeHistory: false,
    publishPublic: false,
  });
  if (enforcementMode === 'block-history-write' && preview.quality.gateStatus === 'fail') {
    const result = emptyResult({
      reason: 'quality_gate_blocked_history_write',
      schemaState,
      enforcementMode,
      gateStatus: preview.quality.gateStatus,
      gateFailures: preview.quality.failures,
      gateWarnings: preview.quality.warnings,
      observationRows: observations.length,
      providerRunRows: providerRuns.length,
      historyWriteBlocked: true,
      publicExportBlocked: true,
      staticObservationCount: preview.observationCount,
      staticRehydratedOverlapCount: preview.rehydratedOverlapCount,
      staticMissingSlotRate: preview.quality.coverage.missingOpenMarketSlotRate,
      staticMaxGapSeconds: preview.quality.coverage.maxGapSeconds,
    });
    recordOutputs(result, env);
    throw new Error(
      `DataCore quality gate blocked history write: ${result.gateFailures.join(',')}`
    );
  }
  if (enforcementMode === 'block-public-export' && preview.quality.gateStatus === 'fail') {
    const result = emptyResult({
      reason: 'quality_gate_blocked_public_export',
      schemaState,
      enforcementMode,
      gateStatus: preview.quality.gateStatus,
      gateFailures: preview.quality.failures,
      gateWarnings: preview.quality.warnings,
      observationRows: observations.length,
      providerRunRows: providerRuns.length,
      publicExportBlocked: true,
      staticObservationCount: preview.observationCount,
      staticRehydratedOverlapCount: preview.rehydratedOverlapCount,
      staticMissingSlotRate: preview.quality.coverage.missingOpenMarketSlotRate,
      staticMaxGapSeconds: preview.quality.coverage.maxGapSeconds,
    });
    recordOutputs(result, env);
    if (remoteError)
      appendGithubOutput('snapshot_sync_error', remoteError.message || 'unknown', env);
    return result;
  }

  let remote = {
    insertedObservations: 0,
    duplicateObservations: 0,
    insertedProviderRuns: 0,
    duplicateProviderRuns: 0,
    remoteObservations: [],
    remoteProviderRuns: [],
    providerHealthRows: [],
  };
  if (client && schemaState === 'ready') {
    try {
      remote = await syncRemoteControlPlane({
        client,
        observations,
        providerRuns,
        nowIso,
        ...remoteRead,
      });
      reason = remote.insertedObservations > 0 ? 'inserted' : 'duplicate_observations';
    } catch (error) {
      remoteError = error;
      schemaState = isSchemaMissingError(error) ? 'migration_required' : 'error';
      reason = isSchemaMissingError(error) ? 'schema_missing' : 'sync_failed';
    }
  }

  const staticResult = buildStaticArtifacts({
    root,
    observations,
    rehydratedObservations: remoteRead.remoteObservations,
    providerRuns: telemetryInputs,
    providerHealthRows: remote.providerHealthRows,
    syncState: schemaState === 'ready' ? 'synced' : reason,
    writeHistory: true,
    publishPublic: true,
  });

  const result = emptyResult({
    reason,
    schemaState,
    enforcementMode,
    gateStatus: staticResult.quality.gateStatus,
    gateFailures: staticResult.quality.failures,
    gateWarnings: staticResult.quality.warnings,
    observationRows: observations.length,
    insertedObservations: remote.insertedObservations,
    duplicateObservations: remote.duplicateObservations,
    providerRunRows: providerRuns.length,
    insertedProviderRuns: remote.insertedProviderRuns,
    providerHealthRows: remote.providerHealthRows.length,
    publicExportBlocked: false,
    staticExportUpdated: staticResult.publicExportUpdated,
    staticObservationCount: staticResult.observationCount,
    staticRehydratedOverlapCount: staticResult.rehydratedOverlapCount,
    staticMissingSlotRate: staticResult.quality.coverage.missingOpenMarketSlotRate,
    staticMaxGapSeconds: staticResult.quality.coverage.maxGapSeconds,
  });
  recordOutputs(result, env);
  if (remoteError) appendGithubOutput('snapshot_sync_error', remoteError.message || 'unknown', env);
  writeSummary(
    [
      '### DataCore DC-1 continuity and quality gate',
      '',
      `- Enforcement mode: \`${enforcementMode}\``,
      `- Schema state: \`${schemaState}\``,
      `- Remote sync reason: \`${reason}\``,
      `- Quality gate: \`${result.gateStatus}\``,
      `- Gate failures: \`${result.gateFailures.join(',') || 'none'}\``,
      `- Gate warnings: \`${result.gateWarnings.join(',') || 'none'}\``,
      `- Canonical observation rows in this run: \`${observations.length}\``,
      `- Remote observations inserted / deduplicated: \`${remote.insertedObservations}\` / \`${remote.duplicateObservations}\``,
      `- Remote rehydration overlaps excluded from duplicate rate: \`${staticResult.rehydratedOverlapCount}\``,
      `- Provider runs inserted: \`${remote.insertedProviderRuns}\``,
      `- Static observation count: \`${staticResult.observationCount}\``,
      `- Static missing open-market slot rate: \`${result.staticMissingSlotRate ?? 'n/a'}\``,
      '- Public export blocked: `false`',
      '- Missing observations are reported, never synthesized. Static history is not a live retail quote.',
    ],
    env
  );
  return result;
}

if (require.main === module) {
  run()
    .then(() => {
      process.exitCode = 0;
    })
    .catch((error) => {
      console.error(`[datacore-sync-v2] ${error.message || error}`);
      process.exitCode = 1;
    });
}

module.exports = {
  ENFORCEMENT_MODES,
  resolveEnforcementMode,
  createPostgrestClient,
  isSchemaMissingError,
  recordOutputs,
  findMissingRemoteCorrectionTargets,
  assertRemoteCorrectionTargets,
  selectAllKeysetPages,
  readRemoteControlPlane,
  syncRemoteControlPlane,
  run,
};
