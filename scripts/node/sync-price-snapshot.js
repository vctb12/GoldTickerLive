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
const { buildStaticArtifacts } = require('./build-datacore-history');

const ROOT = path.resolve(__dirname, '../..');
const GOLD_PRICE_FILE = path.join(ROOT, 'data', 'gold_price.json');
const REMOTE_HISTORY_DAYS = 31;

function envBool(name, fallback = false, env = process.env) {
  const value = env[name];
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
}

function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function appendGithubOutput(name, value) {
  const outputFile = process.env.GITHUB_OUTPUT;
  if (!outputFile) return;
  try {
    fs.appendFileSync(outputFile, `${name}=${String(value)}\n`, 'utf8');
  } catch {
    // Best effort only; output failure must not hide the primary sync result.
  }
}

function writeSummary(lines) {
  const summary = process.env.GITHUB_STEP_SUMMARY;
  if (!summary || !Array.isArray(lines) || !lines.length) return;
  try {
    fs.appendFileSync(summary, `${lines.join('\n')}\n`, 'utf8');
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
    const headers = {
      apikey: key,
      Authorization: `Bearer ${key}`,
    };
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
    return {
      data,
      contentRange: response.headers.get('content-range'),
      status: response.status,
    };
  }

  return {
    request,
    async insert(table, rows, { onConflict = null, ignoreDuplicates = false } = {}) {
      const query = onConflict ? { on_conflict: onConflict } : {};
      const prefer = ['return=representation'];
      if (ignoreDuplicates) prefer.unshift('resolution=ignore-duplicates');
      return request(table, { method: 'POST', query, body: rows, prefer });
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

async function syncRemoteControlPlane({ client, observations, providerRuns, nowIso }) {
  const observationInsert = await client.insert('price_snapshots', observations, {
    onConflict: 'observation_id',
    ignoreDuplicates: true,
  });
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

  const since24h = new Date(new Date(nowIso).getTime() - 24 * 60 * 60 * 1000).toISOString();
  const providerRunQuery = await client.select('provider_runs', {
    select:
      'provider_name,status,latency_ms,freshness_seconds,circuit_state,deviation_bps,attempted_at_utc,created_at',
    attempted_at_utc: `gte.${since24h}`,
    order: 'attempted_at_utc.desc',
    limit: 5000,
  });
  const remoteProviderRuns = Array.isArray(providerRunQuery.data) ? providerRunQuery.data : [];
  const providerHealthRows = computeProviderHealthRows(remoteProviderRuns, { nowIso });
  if (providerHealthRows.length) {
    await client.upsert('provider_health', providerHealthRows, 'provider_name');
  }

  const sinceHistory = new Date(
    new Date(nowIso).getTime() - REMOTE_HISTORY_DAYS * 24 * 60 * 60 * 1000
  ).toISOString();
  const observationQuery = await client.select('price_snapshots', {
    select:
      'observation_id,symbol,xau_usd_per_oz,xau_aed_per_gram,currency,source_provider,provider_chain,timestamp_utc,fetched_at_utc,slot_5m_utc,freshness_seconds,is_fresh,is_fallback,is_market_open,is_selected,selection_method,deviation_bps,provider_response_time_ms,quality_state,raw_payload_hash,workflow_run_id,schema_version',
    symbol: 'eq.XAUUSD',
    is_selected: 'eq.true',
    timestamp_utc: `gte.${sinceHistory}`,
    order: 'timestamp_utc.asc',
    limit: 10000,
  });

  return {
    insertedObservations,
    duplicateObservations: Math.max(0, observations.length - insertedObservations),
    insertedProviderRuns,
    duplicateProviderRuns: Math.max(0, providerRuns.length - insertedProviderRuns),
    remoteObservations: Array.isArray(observationQuery.data) ? observationQuery.data : [],
    remoteProviderRuns,
    providerHealthRows,
  };
}

function recordOutputs(result) {
  appendGithubOutput('snapshot_synced', result.schemaState === 'ready' ? 'true' : 'false');
  appendGithubOutput('snapshot_duplicate', result.duplicateObservations > 0 ? 'true' : 'false');
  appendGithubOutput('snapshot_sync_reason', result.reason);
  appendGithubOutput('datacore_schema_state', result.schemaState);
  appendGithubOutput('observation_rows', result.observationRows);
  appendGithubOutput('observation_inserted', result.insertedObservations);
  appendGithubOutput('observation_duplicates', result.duplicateObservations);
  appendGithubOutput('provider_run_rows', result.providerRunRows);
  appendGithubOutput('provider_runs_inserted', result.insertedProviderRuns);
  appendGithubOutput('provider_health_rows', result.providerHealthRows);
  appendGithubOutput('static_export_updated', result.staticExportUpdated ? 'true' : 'false');
  appendGithubOutput('static_observation_count', result.staticObservationCount);
  appendGithubOutput('static_missing_slot_rate', result.staticMissingSlotRate ?? 'n/a');
}

async function run({ env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const strictMode = envBool('SNAPSHOT_SYNC_STRICT', false, env);
  const providerChain = env.PRICE_PROVIDER_CHAIN || '';
  const circuitState = env.PRICE_CIRCUIT_STATE || null;
  const workflowRunId = env.GITHUB_RUN_ID || `local-${Date.now()}`;
  const payload = readJsonFile(env.PRICE_JSON_PATH || GOLD_PRICE_FILE);

  if (!payload) {
    const result = {
      reason: 'invalid_payload_file',
      schemaState: 'not_checked',
      observationRows: 0,
      insertedObservations: 0,
      duplicateObservations: 0,
      providerRunRows: 0,
      insertedProviderRuns: 0,
      providerHealthRows: 0,
      staticExportUpdated: false,
      staticObservationCount: 0,
      staticMissingSlotRate: null,
    };
    recordOutputs(result);
    if (strictMode) throw new Error('gold_price.json is missing or invalid JSON');
    return result;
  }

  const validated = validatePricePayload(payload);
  if (!validated.ok) {
    const result = {
      reason: 'validation_failed',
      schemaState: 'not_checked',
      observationRows: 0,
      insertedObservations: 0,
      duplicateObservations: 0,
      providerRunRows: 0,
      insertedProviderRuns: 0,
      providerHealthRows: 0,
      staticExportUpdated: false,
      staticObservationCount: 0,
      staticMissingSlotRate: null,
    };
    recordOutputs(result);
    appendGithubOutput('snapshot_validation_error', validated.errors.join('; '));
    if (strictMode) throw new Error(`snapshot validation failed: ${validated.errors.join('; ')}`);
    return result;
  }

  const observations = buildObservationRows(payload, {
    providerChain,
    circuitState,
    workflowRunId,
  });
  const providerRuns = buildProviderRunRows(payload, validated.normalized, {
    circuitState,
    workflowRunId,
  });
  const nowIso = validated.normalized.fetchedAtUtc;
  const client = createPostgrestClient({
    url: env.SUPABASE_URL,
    key: env.SUPABASE_SERVICE_ROLE_KEY,
    fetchImpl,
  });

  let remote = {
    insertedObservations: 0,
    duplicateObservations: 0,
    insertedProviderRuns: 0,
    duplicateProviderRuns: 0,
    remoteObservations: [],
    remoteProviderRuns: [],
    providerHealthRows: [],
  };
  let reason = client ? 'sync_failed' : 'supabase_not_configured';
  let schemaState = client ? 'unknown' : 'not_configured';
  let remoteError = null;
  if (client) {
    try {
      remote = await syncRemoteControlPlane({ client, observations, providerRuns, nowIso });
      schemaState = 'ready';
      reason = remote.insertedObservations > 0 ? 'inserted' : 'duplicate_observations';
    } catch (error) {
      remoteError = error;
      schemaState = isSchemaMissingError(error) ? 'migration_required' : 'error';
      reason = isSchemaMissingError(error) ? 'schema_missing' : 'sync_failed';
    }
  }

  const staticResult = buildStaticArtifacts({
    root: ROOT,
    observations: [...remote.remoteObservations, ...observations],
    providerRuns: remote.remoteProviderRuns.length ? remote.remoteProviderRuns : providerRuns,
    providerHealthRows: remote.providerHealthRows,
    syncState: schemaState === 'ready' ? 'synced' : reason,
  });

  const result = {
    reason,
    schemaState,
    observationRows: observations.length,
    insertedObservations: remote.insertedObservations,
    duplicateObservations: remote.duplicateObservations,
    providerRunRows: providerRuns.length,
    insertedProviderRuns: remote.insertedProviderRuns,
    providerHealthRows: remote.providerHealthRows.length,
    staticExportUpdated: true,
    staticObservationCount: staticResult.observationCount,
    staticMissingSlotRate: staticResult.quality.missingOpenMarketSlotRate,
  };
  recordOutputs(result);
  if (remoteError)
    appendGithubOutput('snapshot_sync_error', remoteError.message || 'unknown error');
  writeSummary([
    '### DataCore DC-1 continuity',
    '',
    `- Schema state: \`${schemaState}\``,
    `- Remote sync reason: \`${reason}\``,
    `- Canonical observation rows in this run: \`${observations.length}\``,
    `- Remote observations inserted / deduplicated: \`${remote.insertedObservations}\` / \`${remote.duplicateObservations}\``,
    `- Provider runs inserted: \`${remote.insertedProviderRuns}\``,
    `- Static observation count: \`${staticResult.observationCount}\``,
    `- Static missing open-market slot rate: \`${staticResult.quality.missingOpenMarketSlotRate ?? 'n/a'}\``,
    '- Static history is historical reference data, not a live retail quote.',
  ]);

  if (remoteError && strictMode) throw remoteError;
  return result;
}

if (require.main === module) {
  run()
    .then(() => {
      process.exitCode = 0;
    })
    .catch((error) => {
      console.error(`[sync-price-snapshot] ${error.message || error}`);
      process.exitCode = 1;
    });
}

module.exports = {
  createPostgrestClient,
  isSchemaMissingError,
  recordOutputs,
  syncRemoteControlPlane,
  run,
};
