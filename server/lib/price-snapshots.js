'use strict';

const crypto = require('crypto');

const HISTORY_RANGE_DAYS = {
  '1d': 1,
  '7d': 7,
  '30d': 30,
  '1y': 365,
};

const OBSERVATION_SCHEMA_VERSION = 1;
const OBSERVATION_SLOT_MINUTES = 5;
const PROVIDER_DIVERGENCE_THRESHOLD_BPS = 300;

function toFiniteNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return fallback;
}

function parseIsoTimestamp(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toISOString();
}

function sortObjectDeep(value) {
  if (Array.isArray(value)) return value.map(sortObjectDeep);
  if (!value || typeof value !== 'object') return value;
  return Object.keys(value)
    .sort()
    .reduce((acc, key) => {
      acc[key] = sortObjectDeep(value[key]);
      return acc;
    }, {});
}

/**
 * Return a deterministic JSON representation by recursively sorting object keys
 * before serialization. This ensures semantically identical payloads hash to
 * the same value even when key insertion order differs.
 *
 * @param {unknown} value
 * @returns {string}
 */
function stableJsonStringify(value) {
  return JSON.stringify(sortObjectDeep(value));
}

function computeRawPayloadHash(payload) {
  return crypto.createHash('sha256').update(stableJsonStringify(payload)).digest('hex');
}

function normalizeSymbol(value = 'XAUUSD') {
  const normalized = String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  return normalized || 'XAUUSD';
}

function floorTimestampToSlot(timestampUtc, minutes = OBSERVATION_SLOT_MINUTES) {
  const parsed = parseIsoTimestamp(timestampUtc);
  if (!parsed) return null;
  const date = new Date(parsed);
  const slotMinutes = Math.max(1, Math.trunc(minutes));
  date.setUTCMinutes(Math.floor(date.getUTCMinutes() / slotMinutes) * slotMinutes, 0, 0);
  return date.toISOString();
}

function computeObservationId({ symbol, sourceProvider, timestampUtc, xauUsdPerOz }) {
  const identity = [
    OBSERVATION_SCHEMA_VERSION,
    normalizeSymbol(symbol),
    String(sourceProvider || '')
      .trim()
      .toLowerCase(),
    parseIsoTimestamp(timestampUtc) || '',
    Number(xauUsdPerOz).toFixed(8),
  ].join('|');
  return crypto.createHash('sha256').update(identity).digest('hex');
}

function qualityStateForObservation({ isFresh, isFallback }) {
  if (isFallback) return 'fallback';
  if (isFresh) return 'fresh';
  return 'stale';
}

function buildCanonicalObservation(
  normalized,
  {
    symbol = 'XAUUSD',
    providerChain = '',
    selected = true,
    selectionMethod = null,
    deviationBps = 0,
    workflowRunId = null,
  } = {}
) {
  const normalizedSymbol = normalizeSymbol(symbol);
  const timestampUtc = parseIsoTimestamp(normalized.timestampUtc);
  const row = {
    symbol: normalizedSymbol,
    xau_usd_per_oz: normalized.xauUsdPerOz,
    xau_aed_per_gram: normalized.xauAedPerGram,
    currency: normalized.currency || 'USD',
    source_provider: normalized.sourceProvider,
    provider_chain: String(providerChain || ''),
    timestamp_utc: timestampUtc,
    fetched_at_utc: parseIsoTimestamp(normalized.fetchedAtUtc),
    slot_5m_utc: floorTimestampToSlot(timestampUtc),
    freshness_seconds: normalized.freshnessSeconds,
    is_fresh: normalized.isFresh,
    is_fallback: normalized.isFallback,
    is_market_open: normalized.isMarketOpen,
    is_selected: selected === true,
    selection_method: selectionMethod ? String(selectionMethod) : null,
    deviation_bps: Number.isFinite(Number(deviationBps))
      ? Number(Number(deviationBps).toFixed(2))
      : null,
    provider_response_time_ms:
      normalized.providerResponseTimeMs !== null &&
      Number.isFinite(Number(normalized.providerResponseTimeMs))
        ? Math.max(0, Math.round(Number(normalized.providerResponseTimeMs)))
        : null,
    quality_state: qualityStateForObservation(normalized),
    raw_payload_hash: normalized.rawPayloadHash,
    workflow_run_id: workflowRunId ? String(workflowRunId) : null,
    schema_version: OBSERVATION_SCHEMA_VERSION,
  };
  row.observation_id = computeObservationId({
    symbol: row.symbol,
    sourceProvider: row.source_provider,
    timestampUtc: row.timestamp_utc,
    xauUsdPerOz: row.xau_usd_per_oz,
  });
  return row;
}

function buildObservationRows(
  payload,
  { symbol = 'XAUUSD', providerChain = '', circuitState = null, workflowRunId = null } = {}
) {
  const validated = validatePricePayload(payload);
  if (!validated.ok) return [];

  const selected = validated.normalized;
  const selectedPrice = selected.xauUsdPerOz;
  const selectionMethod = payload.selection_method || payload?.consensus?.method || null;
  const rows = new Map();
  const selectedRow = buildCanonicalObservation(selected, {
    symbol,
    providerChain,
    selected: true,
    selectionMethod,
    workflowRunId,
  });
  rows.set(selectedRow.observation_id, selectedRow);

  const diagnostics = Array.isArray(payload.provider_diagnostics)
    ? payload.provider_diagnostics
    : [];
  for (const diagnostic of diagnostics) {
    const provider = String(diagnostic?.provider || '').trim();
    const price = toFiniteNumber(diagnostic?.normalized_price);
    const timestampUtc = parseIsoTimestamp(diagnostic?.provider_timestamp);
    if (!provider || !diagnostic?.valid || !price || price <= 0 || !timestampUtc) continue;

    const fetchedAtUtc =
      parseIsoTimestamp(diagnostic.requested_at_utc) || selected.fetchedAtUtc || timestampUtc;
    const freshnessSeconds = Math.max(
      0,
      Math.round((new Date(fetchedAtUtc).getTime() - new Date(timestampUtc).getTime()) / 1000)
    );
    const candidate = {
      xauUsdPerOz: price,
      xauAedPerGram: provider === selected.sourceProvider ? selected.xauAedPerGram : null,
      currency: 'USD',
      sourceProvider: provider,
      timestampUtc,
      fetchedAtUtc,
      freshnessSeconds,
      isFresh: diagnostic.reason === 'fresh',
      isFallback: false,
      isMarketOpen: selected.isMarketOpen,
      providerResponseTimeMs: toFiniteNumber(diagnostic.response_time_ms),
      rawPayloadHash: computeRawPayloadHash(diagnostic),
      circuitState,
    };
    const deviationBps = ((price - selectedPrice) / selectedPrice) * 10000;
    const row = buildCanonicalObservation(candidate, {
      symbol,
      providerChain,
      selected:
        provider === selected.sourceProvider &&
        timestampUtc === selected.timestampUtc &&
        Math.abs(price - selectedPrice) < 1e-8,
      selectionMethod,
      deviationBps,
      workflowRunId,
    });
    const prior = rows.get(row.observation_id);
    rows.set(
      row.observation_id,
      prior
        ? {
            ...row,
            ...prior,
            provider_response_time_ms:
              prior.provider_response_time_ms ?? row.provider_response_time_ms,
            deviation_bps: row.deviation_bps,
          }
        : row
    );
  }

  return [...rows.values()].sort(
    (a, b) =>
      String(a.timestamp_utc).localeCompare(String(b.timestamp_utc)) ||
      a.observation_id.localeCompare(b.observation_id)
  );
}

function buildProviderRunRows(
  payload,
  normalized,
  { circuitState = null, workflowRunId = null } = {}
) {
  const diagnostics = Array.isArray(payload?.provider_diagnostics)
    ? payload.provider_diagnostics
    : [];
  const selectedProvider = normalized?.sourceProvider || payload?.provider || null;
  const selectedPrice = toFiniteNumber(normalized?.xauUsdPerOz ?? payload?.xau_usd_per_oz);

  const sourceRows = diagnostics.length
    ? diagnostics
    : selectedProvider
      ? [
          {
            provider: selectedProvider,
            requested_at_utc: normalized?.fetchedAtUtc,
            status: normalized?.isFresh ? 'success' : normalized?.isFallback ? 'fallback' : 'stale',
            valid: normalized?.isFresh === true,
            response_time_ms: normalized?.providerResponseTimeMs,
            provider_timestamp: normalized?.timestampUtc,
            normalized_price: normalized?.xauUsdPerOz,
            reason: normalized?.isFresh ? 'fresh' : normalized?.isFallback ? 'fallback' : 'stale',
          },
        ]
      : [];

  return sourceRows.map((diagnostic) => {
    const provider = String(diagnostic?.provider || 'unknown').trim() || 'unknown';
    const attemptedAtUtc =
      parseIsoTimestamp(diagnostic?.requested_at_utc) ||
      parseIsoTimestamp(normalized?.fetchedAtUtc) ||
      new Date(0).toISOString();
    const providerTimestampUtc = parseIsoTimestamp(diagnostic?.provider_timestamp);
    const normalizedPrice = toFiniteNumber(diagnostic?.normalized_price);
    const reason = String(diagnostic?.reason || '').trim() || null;
    let status = 'error';
    if (diagnostic?.status === 'circuit_open') status = 'circuit_open';
    else if (diagnostic?.valid === true) status = 'success';
    else if (/fallback/i.test(reason || '')) status = 'fallback';
    else if (/stale|timestamp/i.test(reason || '')) status = 'stale';

    const deviationBps =
      normalizedPrice !== null && selectedPrice && selectedPrice > 0
        ? Number((((normalizedPrice - selectedPrice) / selectedPrice) * 10000).toFixed(2))
        : null;
    const freshnessSeconds =
      providerTimestampUtc && attemptedAtUtc
        ? Math.max(
            0,
            Math.round(
              (new Date(attemptedAtUtc).getTime() - new Date(providerTimestampUtc).getTime()) / 1000
            )
          )
        : null;
    const runIdentity = [
      workflowRunId || 'local',
      provider.toLowerCase(),
      attemptedAtUtc,
      providerTimestampUtc || '',
    ].join('|');
    return {
      run_key: crypto.createHash('sha256').update(runIdentity).digest('hex'),
      workflow_run_id: workflowRunId ? String(workflowRunId) : null,
      provider_name: provider,
      status,
      selected: provider === selectedProvider,
      attempted_at_utc: attemptedAtUtc,
      provider_timestamp_utc: providerTimestampUtc,
      normalized_price_usd_per_oz: normalizedPrice,
      deviation_bps: deviationBps,
      latency_ms:
        toFiniteNumber(diagnostic?.response_time_ms) !== null
          ? Math.max(0, Math.round(Number(diagnostic.response_time_ms)))
          : null,
      http_status:
        toFiniteNumber(diagnostic?.http_status) !== null
          ? Math.trunc(Number(diagnostic.http_status))
          : null,
      error_code: status === 'error' ? reason : null,
      error_message: null,
      freshness_seconds: freshnessSeconds,
      circuit_state:
        status === 'circuit_open'
          ? 'open'
          : circuitState || (status === 'fallback' ? 'fallback' : 'closed'),
    };
  });
}

function percentile(values, percentileValue) {
  const sorted = values
    .map(Number)
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);
  if (!sorted.length) return null;
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((percentileValue / 100) * sorted.length) - 1)
  );
  return Number(sorted[index].toFixed(2));
}

function computeProviderHealthRows(providerRuns, { nowIso = null } = {}) {
  const now = parseIsoTimestamp(nowIso) || new Date().toISOString();
  const since = new Date(new Date(now).getTime() - 24 * 60 * 60 * 1000).getTime();
  const groups = new Map();
  for (const row of Array.isArray(providerRuns) ? providerRuns : []) {
    const createdAt =
      parseIsoTimestamp(row.attempted_at_utc || row.created_at) || new Date(0).toISOString();
    if (new Date(createdAt).getTime() < since) continue;
    const provider = String(row.provider_name || 'unknown');
    if (!groups.has(provider)) groups.set(provider, []);
    groups.get(provider).push({ ...row, attempted_at_utc: createdAt });
  }

  return [...groups.entries()]
    .map(([providerName, rows]) => {
      rows.sort((a, b) => String(b.attempted_at_utc).localeCompare(String(a.attempted_at_utc)));
      const successful = rows.filter((row) => row.status === 'success');
      const failed = rows.filter((row) => row.status !== 'success');
      const latencies = rows.map((row) => row.latency_ms).filter((value) => value !== null);
      const freshness = rows.map((row) => row.freshness_seconds).filter((value) => value !== null);
      const chronological = [...rows].reverse();
      let circuitTransitions = 0;
      for (let index = 1; index < chronological.length; index += 1) {
        if (chronological[index].circuit_state !== chronological[index - 1].circuit_state) {
          circuitTransitions += 1;
        }
      }
      return {
        provider_name: providerName,
        last_success_at: successful[0]?.attempted_at_utc || null,
        last_failure_at: failed[0]?.attempted_at_utc || null,
        success_rate_24h: rows.length
          ? Number(((successful.length / rows.length) * 100).toFixed(2))
          : 0,
        avg_latency_24h: latencies.length
          ? Number(
              (latencies.reduce((sum, value) => sum + Number(value), 0) / latencies.length).toFixed(
                2
              )
            )
          : null,
        p95_latency_24h: percentile(latencies, 95),
        p95_freshness_seconds_24h: percentile(freshness, 95),
        attempt_count_24h: rows.length,
        success_count_24h: successful.length,
        stale_count_24h: rows.filter((row) => row.status === 'stale').length,
        fallback_count_24h: rows.filter((row) => row.status === 'fallback').length,
        divergence_count_24h: rows.filter(
          (row) => Math.abs(Number(row.deviation_bps)) > PROVIDER_DIVERGENCE_THRESHOLD_BPS
        ).length,
        circuit_transition_count_24h: circuitTransitions,
        current_status: rows[0]?.status || 'unknown',
        circuit_state: rows[0]?.circuit_state || 'unknown',
        updated_at: now,
      };
    })
    .sort((a, b) => a.provider_name.localeCompare(b.provider_name));
}

function createPostgrestQueryClient({ url, key, fetchImpl = globalThis.fetch } = {}) {
  if (!url || !key || typeof fetchImpl !== 'function') return null;
  const baseUrl = String(url).replace(/\/$/, '');

  function from(table) {
    const params = new URLSearchParams();
    const builder = {
      select(columns = '*') {
        params.set('select', columns);
        return builder;
      },
      eq(column, value) {
        params.set(column, `eq.${value}`);
        return builder;
      },
      gte(column, value) {
        params.set(column, `gte.${value}`);
        return builder;
      },
      order(column, { ascending = true } = {}) {
        params.set('order', `${column}.${ascending ? 'asc' : 'desc'}`);
        return builder;
      },
      limit(value) {
        params.set('limit', String(value));
        return builder;
      },
      async execute() {
        const endpoint = new URL(`${baseUrl}/rest/v1/${encodeURIComponent(table)}`);
        endpoint.search = params.toString();
        try {
          const response = await fetchImpl(endpoint, {
            headers: {
              apikey: key,
              Authorization: `Bearer ${key}`,
            },
          });
          const text = await response.text();
          let data = null;
          if (text) {
            try {
              data = JSON.parse(text);
            } catch {
              data = null;
            }
          }
          if (!response.ok) {
            return {
              data: null,
              error: {
                code: data?.code || null,
                message: data?.message || response.statusText,
              },
            };
          }
          return { data, error: null };
        } catch (error) {
          return { data: null, error: { code: null, message: error.message || String(error) } };
        }
      },
      then(resolve, reject) {
        return builder.execute().then(resolve, reject);
      },
    };
    return builder;
  }

  return { from };
}

function validatePricePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, errors: ['payload must be an object'] };
  }

  const xauUsdPerOz = toFiniteNumber(payload.xau_usd_per_oz ?? payload?.gold?.ounce_usd);
  if (!xauUsdPerOz || xauUsdPerOz <= 0) {
    return { ok: false, errors: ['xau_usd_per_oz must be a positive number'] };
  }

  const provider = String(payload.provider || payload.source || '').trim();
  if (!provider) return { ok: false, errors: ['provider/source is required'] };

  const timestampUtc = parseIsoTimestamp(payload.timestamp_utc || payload.fetched_at_utc);
  const fetchedAtUtc = parseIsoTimestamp(payload.fetched_at_utc || payload.timestamp_utc);
  if (!timestampUtc || !fetchedAtUtc) {
    return { ok: false, errors: ['timestamp_utc or fetched_at_utc must be valid ISO timestamps'] };
  }

  const aedPerGram24k = toFiniteNumber(payload.aed_per_gram_24k ?? payload?.gold?.gram_aed);
  const freshnessSeconds = toFiniteNumber(payload.freshness_seconds);
  const normalized = {
    xauUsdPerOz,
    xauAedPerGram: aedPerGram24k && aedPerGram24k > 0 ? aedPerGram24k : null,
    currency: String(payload.quote_currency || 'USD').toUpperCase(),
    sourceProvider: provider,
    timestampUtc,
    fetchedAtUtc,
    freshnessSeconds: freshnessSeconds !== null ? Math.max(0, Math.round(freshnessSeconds)) : null,
    isFresh: toBoolean(payload.is_fresh, false),
    isFallback: toBoolean(payload.is_fallback, false),
    isMarketOpen: typeof payload.is_market_open === 'boolean' ? payload.is_market_open : null,
    providerResponseTimeMs: toFiniteNumber(payload.provider_response_time_ms),
    rawPayloadHash: computeRawPayloadHash(payload),
  };

  return {
    ok: true,
    errors: [],
    normalized,
  };
}

function buildPriceSnapshotRow(normalized, { providerChain = '' } = {}) {
  return buildCanonicalObservation(normalized, { providerChain });
}

async function hasDuplicateSnapshot(supabase, row) {
  const { data, error } = await supabase
    .from('price_snapshots')
    .select('id')
    .eq('timestamp_utc', row.timestamp_utc)
    .eq('source_provider', row.source_provider)
    .eq('raw_payload_hash', row.raw_payload_hash)
    .limit(1);
  if (error) throw new Error(`duplicate-check failed: ${error.message}`);
  return Array.isArray(data) && data.length > 0;
}

async function insertSnapshotIfNew(supabase, row) {
  const { data, error } = await supabase
    .from('price_snapshots')
    .insert([row])
    .select('id')
    .single();
  if (error) {
    // Postgres duplicate key violations use SQLSTATE 23505. Some client stacks
    // may omit `code`, so we keep a narrow message fallback for compatibility.
    const isDuplicate =
      error.code === '23505' ||
      /\bduplicate\s+key\b|\bunique\s+constraint\b/i.test(String(error.message || ''));
    if (isDuplicate) return { inserted: false, duplicate: true };
    throw new Error(`snapshot insert failed: ${error.message}`);
  }
  return { inserted: true, duplicate: false, id: data?.id || null };
}

async function insertProviderRun(supabase, normalized, { circuitState = null } = {}) {
  let status = 'stale';
  if (normalized.isFresh) status = 'success';
  else if (normalized.isFallback) status = 'fallback';
  const row = {
    provider_name: normalized.sourceProvider,
    status,
    latency_ms:
      normalized.providerResponseTimeMs !== null
        ? Math.round(normalized.providerResponseTimeMs)
        : null,
    http_status: null,
    error_code: null,
    error_message: null,
    freshness_seconds: normalized.freshnessSeconds,
    circuit_state: circuitState || (normalized.isFallback ? 'fallback' : 'closed'),
  };
  const { error } = await supabase.from('provider_runs').insert([row]);
  if (error) throw new Error(`provider_runs insert failed: ${error.message}`);
  return row;
}

async function upsertProviderHealth(supabase, providerName, fallbackCircuitState = 'closed') {
  const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('provider_runs')
    .select('status,latency_ms,circuit_state,created_at')
    .eq('provider_name', providerName)
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) throw new Error(`provider health query failed: ${error.message}`);
  const rows = Array.isArray(data) ? data : [];
  const total = rows.length;
  const successCount = rows.filter((row) => row.status === 'success').length;
  const latencyRows = rows
    .map((row) => toFiniteNumber(row.latency_ms))
    .filter((value) => value !== null && value >= 0);
  const avgLatency24h =
    latencyRows.length > 0
      ? Number((latencyRows.reduce((sum, value) => sum + value, 0) / latencyRows.length).toFixed(2))
      : null;

  const latestSuccess = rows.find((row) => row.status === 'success')?.created_at || null;
  const latestFailure =
    rows.find((row) => row.status && row.status !== 'success')?.created_at || null;
  const latest = rows[0] || null;
  const currentStatus = latest?.status || 'unknown';
  const circuitState = latest?.circuit_state || fallbackCircuitState || 'unknown';
  const successRate24h =
    total > 0
      ? Number(((successCount / total) * 100).toFixed(2))
      : currentStatus === 'success'
        ? 100
        : 0;

  const row = {
    provider_name: providerName,
    last_success_at: latestSuccess,
    last_failure_at: latestFailure,
    success_rate_24h: successRate24h,
    avg_latency_24h: avgLatency24h,
    current_status: currentStatus,
    circuit_state: circuitState,
    updated_at: new Date().toISOString(),
  };

  const { error: upsertError } = await supabase
    .from('provider_health')
    .upsert([row], { onConflict: 'provider_name' });
  if (upsertError) throw new Error(`provider_health upsert failed: ${upsertError.message}`);
  return row;
}

function normalizeHistoryRange(range) {
  const key = String(range || '30d').toLowerCase();
  return Object.prototype.hasOwnProperty.call(HISTORY_RANGE_DAYS, key) ? key : '30d';
}

function getHistoryWindowStart(range) {
  const key = normalizeHistoryRange(range);
  const days = HISTORY_RANGE_DAYS[key];
  return new Date(Date.now() - days * 86400000).toISOString();
}

module.exports = {
  HISTORY_RANGE_DAYS,
  OBSERVATION_SCHEMA_VERSION,
  OBSERVATION_SLOT_MINUTES,
  PROVIDER_DIVERGENCE_THRESHOLD_BPS,
  normalizeHistoryRange,
  getHistoryWindowStart,
  normalizeSymbol,
  floorTimestampToSlot,
  computeObservationId,
  stableJsonStringify,
  computeRawPayloadHash,
  validatePricePayload,
  buildCanonicalObservation,
  buildObservationRows,
  buildPriceSnapshotRow,
  buildProviderRunRows,
  computeProviderHealthRows,
  createPostgrestQueryClient,
  hasDuplicateSnapshot,
  insertSnapshotIfNew,
  insertProviderRun,
  upsertProviderHealth,
};
