'use strict';

const crypto = require('crypto');

const HISTORY_RANGE_DAYS = Object.freeze({
  '1d': 1,
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '1y': 365,
  all: null,
});
const OBSERVATION_SCHEMA_VERSION = 2;
const OBSERVATION_SLOT_MINUTES = 5;
const OBSERVATION_SLOT_SECONDS = OBSERVATION_SLOT_MINUTES * 60;
const PROVIDER_DIVERGENCE_THRESHOLD_BPS = 300;
const FUTURE_TOLERANCE_SECONDS = 60;
const LATE_ARRIVAL_SECONDS = 30 * 60;
const ALLOWED_METALS = new Set(['XAU', 'XAG', 'XPT', 'XPD']);
const ALLOWED_QUOTES = new Set(['USD']);
const ALLOWED_FRESHNESS_STATES = new Set([
  'updated',
  'delayed',
  'cached',
  'fallback',
  'stale',
  'unavailable',
  'closed',
]);

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
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function sortObjectDeep(value) {
  if (Array.isArray(value)) return value.map(sortObjectDeep);
  if (!value || typeof value !== 'object') return value;
  return Object.keys(value)
    .sort()
    .reduce((accumulator, key) => {
      accumulator[key] = sortObjectDeep(value[key]);
      return accumulator;
    }, {});
}

function stableJsonStringify(value) {
  return JSON.stringify(sortObjectDeep(value));
}

function computeRawPayloadHash(payload) {
  return crypto.createHash('sha256').update(stableJsonStringify(payload)).digest('hex');
}

function normalizeMetalSymbol(value = 'XAU') {
  if (value === null) return null;
  const compact = String(value || '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
  const metal = compact.length >= 3 ? compact.slice(0, 3) : compact ? null : 'XAU';
  return ALLOWED_METALS.has(metal) ? metal : null;
}

function normalizeQuoteCurrency(value = 'USD') {
  const currency = String(value || '')
    .toUpperCase()
    .replace(/[^A-Z]/g, '');
  return ALLOWED_QUOTES.has(currency) ? currency : null;
}

// Compatibility helper. Canonical code uses metal_symbol + quote_currency.
function normalizeSymbol(value = 'XAUUSD') {
  const compact = String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  return compact || 'XAUUSD';
}

function floorTimestampToSlot(timestampUtc, minutes = OBSERVATION_SLOT_MINUTES) {
  const parsed = parseIsoTimestamp(timestampUtc);
  if (!parsed) return null;
  const date = new Date(parsed);
  const slotMinutes = Math.max(1, Math.trunc(minutes));
  date.setUTCMinutes(Math.floor(date.getUTCMinutes() / slotMinutes) * slotMinutes, 0, 0);
  return date.toISOString();
}

function normalizeQualityFlags(flags) {
  return [...new Set((Array.isArray(flags) ? flags : []).map(String).filter(Boolean))].sort();
}

function computeObservationId(input) {
  const metalSymbol = normalizeMetalSymbol(input.metalSymbol || input.metal_symbol || input.symbol);
  const quoteCurrency = normalizeQuoteCurrency(
    input.quoteCurrency || input.quote_currency || input.currency || 'USD'
  );
  const provider = String(input.sourceProvider || input.source_provider || '')
    .trim()
    .toLowerCase();
  const providerTimestampUtc = parseIsoTimestamp(
    input.providerTimestampUtc || input.provider_timestamp_utc || input.timestampUtc
  );
  const rawPayloadHash = String(input.rawPayloadHash || input.raw_payload_hash || '').trim();
  const price = toFiniteNumber(
    input.priceUsdPerOz ?? input.price_usd_per_oz ?? input.xauUsdPerOz ?? input.xau_usd_per_oz
  );
  const identity = [
    OBSERVATION_SCHEMA_VERSION,
    metalSymbol || '',
    quoteCurrency || '',
    provider,
    providerTimestampUtc || '',
    rawPayloadHash || (price === null ? '' : price.toFixed(8)),
  ].join('|');
  return crypto.createHash('sha256').update(identity).digest('hex');
}

function deriveMarketState(isMarketOpen) {
  if (isMarketOpen === true) return 'open';
  if (isMarketOpen === false) return 'closed';
  return 'unknown';
}

function deriveFreshnessState({ isFresh, isFallback, isMarketOpen, freshnessState }) {
  const explicit = String(freshnessState || '').toLowerCase();
  if (ALLOWED_FRESHNESS_STATES.has(explicit)) return explicit;
  if (isMarketOpen === false) return 'closed';
  if (isFallback) return 'fallback';
  if (isFresh) return 'updated';
  return 'stale';
}

function validateObservationCandidate(
  normalized,
  {
    latestProviderTimestampUtc = null,
    futureToleranceSeconds = FUTURE_TOLERANCE_SECONDS,
    lateArrivalSeconds = LATE_ARRIVAL_SECONDS,
  } = {}
) {
  const errors = [];
  const warnings = [];
  const metalSymbol = normalizeMetalSymbol(normalized?.metalSymbol);
  const quoteCurrency = normalizeQuoteCurrency(normalized?.quoteCurrency);
  const price = toFiniteNumber(normalized?.priceUsdPerOz ?? normalized?.xauUsdPerOz);
  const providerTimestampUtc = parseIsoTimestamp(
    normalized?.providerTimestampUtc || normalized?.timestampUtc
  );
  const fetchedAtUtc = parseIsoTimestamp(normalized?.fetchedAtUtc);
  const ingestedAtUtc = parseIsoTimestamp(normalized?.ingestedAtUtc || normalized?.fetchedAtUtc);

  if (!metalSymbol) errors.push('invalid_metal_symbol');
  if (!quoteCurrency) errors.push('invalid_quote_currency');
  if (price === null || price <= 0) errors.push('invalid_price');
  if (!String(normalized?.sourceProvider || '').trim()) errors.push('missing_provider');
  if (!providerTimestampUtc) errors.push('invalid_provider_timestamp');
  if (!fetchedAtUtc) errors.push('invalid_fetched_timestamp');
  if (!ingestedAtUtc) errors.push('invalid_ingested_timestamp');

  if (providerTimestampUtc && fetchedAtUtc) {
    const futureSeconds =
      (new Date(providerTimestampUtc).getTime() - new Date(fetchedAtUtc).getTime()) / 1000;
    if (futureSeconds > futureToleranceSeconds) errors.push('future_provider_timestamp');
  }
  if (providerTimestampUtc && ingestedAtUtc) {
    const arrivalSeconds =
      (new Date(ingestedAtUtc).getTime() -
        new Date(floorTimestampToSlot(providerTimestampUtc)).getTime()) /
      1000;
    if (arrivalSeconds > lateArrivalSeconds) warnings.push('late_arrival');
  }
  const latest = parseIsoTimestamp(latestProviderTimestampUtc);
  if (
    latest &&
    providerTimestampUtc &&
    new Date(providerTimestampUtc).getTime() < new Date(latest).getTime()
  ) {
    warnings.push('out_of_order');
  }
  if (normalized?.isFallback) warnings.push('fallback');
  if (normalized?.isFresh === false && normalized?.isMarketOpen !== false) warnings.push('stale');

  return {
    ok: errors.length === 0,
    errors: normalizeQualityFlags(errors),
    warnings: normalizeQualityFlags(warnings),
    qualityFlags: normalizeQualityFlags([...errors, ...warnings]),
  };
}

function buildCanonicalObservation(
  normalized,
  {
    symbol = null,
    providerChain = '',
    selected = true,
    selectionMethod = null,
    deviationBps = 0,
    workflowRunId = null,
    latestProviderTimestampUtc = null,
    correctionOfObservationId = null,
    rawPayloadHash = null,
  } = {}
) {
  const metalSymbol = normalizeMetalSymbol(normalized.metalSymbol || symbol || 'XAU');
  const quoteCurrency = normalizeQuoteCurrency(normalized.quoteCurrency || normalized.currency);
  const providerTimestampUtc = parseIsoTimestamp(
    normalized.providerTimestampUtc || normalized.timestampUtc
  );
  const fetchedAtUtc = parseIsoTimestamp(normalized.fetchedAtUtc);
  const ingestedAtUtc = parseIsoTimestamp(normalized.ingestedAtUtc || normalized.fetchedAtUtc);
  const priceUsdPerOz = toFiniteNumber(normalized.priceUsdPerOz ?? normalized.xauUsdPerOz);
  const validation = validateObservationCandidate(
    {
      ...normalized,
      metalSymbol,
      quoteCurrency,
      providerTimestampUtc,
      ingestedAtUtc,
      priceUsdPerOz,
    },
    { latestProviderTimestampUtc }
  );
  const payloadHash = rawPayloadHash || normalized.rawPayloadHash;
  const legacySymbol = `${metalSymbol || 'UNK'}${quoteCurrency || 'UNK'}`;
  const priceAedPerGram = toFiniteNumber(normalized.priceAedPerGram ?? normalized.xauAedPerGram);
  const row = {
    metal_symbol: metalSymbol,
    quote_currency: quoteCurrency,
    price_usd_per_oz: priceUsdPerOz,
    price_aed_per_gram: priceAedPerGram,
    source_provider: String(normalized.sourceProvider || '').trim(),
    provider_chain: String(providerChain || ''),
    provider_timestamp_utc: providerTimestampUtc,
    fetched_at_utc: fetchedAtUtc,
    ingested_at_utc: ingestedAtUtc,
    slot_start_utc: floorTimestampToSlot(providerTimestampUtc),
    slot_resolution_seconds: OBSERVATION_SLOT_SECONDS,
    market_state: deriveMarketState(normalized.isMarketOpen),
    freshness_state: deriveFreshnessState(normalized),
    freshness_seconds:
      toFiniteNumber(normalized.freshnessSeconds) === null
        ? null
        : Math.max(0, Math.round(Number(normalized.freshnessSeconds))),
    is_selected: selected === true,
    selection_method: selectionMethod ? String(selectionMethod) : null,
    deviation_bps: Number.isFinite(Number(deviationBps))
      ? Number(Number(deviationBps).toFixed(2))
      : null,
    provider_response_time_ms:
      toFiniteNumber(normalized.providerResponseTimeMs) === null
        ? null
        : Math.max(0, Math.round(Number(normalized.providerResponseTimeMs))),
    quality_state: validation.ok
      ? validation.warnings.length
        ? 'warning'
        : 'accepted'
      : 'rejected',
    quality_flags: validation.qualityFlags,
    correction_of_observation_id: correctionOfObservationId || null,
    is_correction: Boolean(correctionOfObservationId),
    raw_payload_hash: payloadHash,
    workflow_run_id: workflowRunId ? String(workflowRunId) : null,
    schema_version: OBSERVATION_SCHEMA_VERSION,
    // XAU-only compatibility aliases. Non-gold values never enter XAU-named columns.
    symbol: legacySymbol,
    currency: quoteCurrency,
    timestamp_utc: providerTimestampUtc,
    slot_5m_utc: floorTimestampToSlot(providerTimestampUtc),
    xau_usd_per_oz: metalSymbol === 'XAU' ? priceUsdPerOz : null,
    xau_aed_per_gram: metalSymbol === 'XAU' ? priceAedPerGram : null,
    is_fresh: normalized.isFresh === true,
    is_fallback: normalized.isFallback === true,
    is_market_open: typeof normalized.isMarketOpen === 'boolean' ? normalized.isMarketOpen : null,
  };
  row.observation_id = computeObservationId({
    metalSymbol: row.metal_symbol,
    quoteCurrency: row.quote_currency,
    sourceProvider: row.source_provider,
    providerTimestampUtc: row.provider_timestamp_utc,
    rawPayloadHash: row.raw_payload_hash,
    priceUsdPerOz: row.price_usd_per_oz,
  });
  if (row.correction_of_observation_id === row.observation_id) {
    throw new Error('an observation cannot correct itself');
  }
  return row;
}

function findCorrectionPredecessor(row, existingObservations) {
  return (Array.isArray(existingObservations) ? existingObservations : [])
    .filter(
      (candidate) =>
        candidate.observation_id !== row.observation_id &&
        candidate.metal_symbol === row.metal_symbol &&
        candidate.quote_currency === row.quote_currency &&
        candidate.source_provider === row.source_provider &&
        (candidate.provider_timestamp_utc || candidate.timestamp_utc) === row.provider_timestamp_utc
    )
    .sort((left, right) =>
      String(right.ingested_at_utc || right.created_at || '').localeCompare(
        String(left.ingested_at_utc || left.created_at || '')
      )
    )[0];
}

function buildObservationRows(
  payload,
  {
    symbol = 'XAUUSD',
    providerChain = '',
    circuitState = null,
    workflowRunId = null,
    existingObservations = [],
  } = {}
) {
  const validated = validatePricePayload(payload);
  if (!validated.ok) return [];
  const selected = validated.normalized;
  const selectedPrice = selected.priceUsdPerOz;
  const selectionMethod = payload.selection_method || payload?.consensus?.method || null;
  const rows = new Map();

  function addRow(normalized, options) {
    let row = buildCanonicalObservation(normalized, options);
    const predecessor = findCorrectionPredecessor(row, [...existingObservations, ...rows.values()]);
    if (predecessor) {
      row = buildCanonicalObservation(normalized, {
        ...options,
        correctionOfObservationId: predecessor.observation_id,
      });
    }
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

  addRow(selected, {
    symbol,
    providerChain,
    selected: true,
    selectionMethod,
    workflowRunId,
  });

  const diagnostics = Array.isArray(payload.provider_diagnostics)
    ? payload.provider_diagnostics
    : [];
  for (const diagnostic of diagnostics) {
    const provider = String(diagnostic?.provider || '').trim();
    const price = toFiniteNumber(diagnostic?.normalized_price);
    const providerTimestampUtc = parseIsoTimestamp(diagnostic?.provider_timestamp);
    if (!provider || !diagnostic?.valid || price === null || price <= 0 || !providerTimestampUtc) {
      continue;
    }
    // The selected provider is already represented by the canonical top-level payload. The
    // diagnostic copy is attempt telemetry, not a second raw price observation.
    if (
      provider === selected.sourceProvider &&
      providerTimestampUtc === selected.providerTimestampUtc &&
      Math.abs(price - selectedPrice) < 1e-8
    ) {
      continue;
    }
    const fetchedAtUtc =
      parseIsoTimestamp(diagnostic.requested_at_utc) ||
      selected.fetchedAtUtc ||
      providerTimestampUtc;
    const freshnessSeconds = Math.max(
      0,
      Math.round(
        (new Date(fetchedAtUtc).getTime() - new Date(providerTimestampUtc).getTime()) / 1000
      )
    );
    const candidate = {
      metalSymbol: selected.metalSymbol,
      quoteCurrency: selected.quoteCurrency,
      priceUsdPerOz: price,
      priceAedPerGram: provider === selected.sourceProvider ? selected.priceAedPerGram : null,
      sourceProvider: provider,
      providerTimestampUtc,
      timestampUtc: providerTimestampUtc,
      fetchedAtUtc,
      ingestedAtUtc: selected.ingestedAtUtc,
      freshnessSeconds,
      isFresh: diagnostic.reason === 'fresh',
      isFallback: /fallback/i.test(String(diagnostic.reason || '')),
      isMarketOpen: selected.isMarketOpen,
      providerResponseTimeMs: toFiniteNumber(diagnostic.response_time_ms),
      rawPayloadHash: computeRawPayloadHash(diagnostic),
      circuitState,
    };
    addRow(candidate, {
      symbol,
      providerChain,
      selected:
        provider === selected.sourceProvider &&
        providerTimestampUtc === selected.providerTimestampUtc &&
        Math.abs(price - selectedPrice) < 1e-8,
      selectionMethod,
      deviationBps: ((price - selectedPrice) / selectedPrice) * 10000,
      workflowRunId,
    });
  }

  return [...rows.values()].sort(
    (left, right) =>
      String(left.provider_timestamp_utc).localeCompare(String(right.provider_timestamp_utc)) ||
      left.observation_id.localeCompare(right.observation_id)
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
  const selectedPrice = toFiniteNumber(
    normalized?.priceUsdPerOz ?? normalized?.xauUsdPerOz ?? payload?.xau_usd_per_oz
  );
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
            provider_timestamp: normalized?.providerTimestampUtc,
            normalized_price: normalized?.priceUsdPerOz,
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
      normalized?.metalSymbol || 'XAU',
      provider.toLowerCase(),
      attemptedAtUtc,
      providerTimestampUtc || '',
    ].join('|');
    return {
      run_key: crypto.createHash('sha256').update(runIdentity).digest('hex'),
      workflow_run_id: workflowRunId ? String(workflowRunId) : null,
      metal_symbol: normalized?.metalSymbol || 'XAU',
      quote_currency: normalized?.quoteCurrency || 'USD',
      provider_name: provider,
      status,
      selected: provider === selectedProvider,
      attempted_at_utc: attemptedAtUtc,
      provider_timestamp_utc: providerTimestampUtc,
      normalized_price_usd_per_oz: normalizedPrice,
      deviation_bps: deviationBps,
      latency_ms:
        toFiniteNumber(diagnostic?.response_time_ms) === null
          ? null
          : Math.max(0, Math.round(Number(diagnostic.response_time_ms))),
      http_status:
        toFiniteNumber(diagnostic?.http_status) === null
          ? null
          : Math.trunc(Number(diagnostic.http_status)),
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
    .filter(Number.isFinite)
    .sort((left, right) => left - right);
  if (!sorted.length) return null;
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((percentileValue / 100) * sorted.length) - 1)
  );
  return Number(sorted[index].toFixed(2));
}

function computeProviderHealthRows(providerRuns, { nowIso = null } = {}) {
  const now = parseIsoTimestamp(nowIso) || new Date().toISOString();
  const since = new Date(now).getTime() - 24 * 60 * 60 * 1000;
  const groups = new Map();
  for (const row of Array.isArray(providerRuns) ? providerRuns : []) {
    const attemptedAtUtc =
      parseIsoTimestamp(row.attempted_at_utc || row.created_at) || new Date(0).toISOString();
    if (new Date(attemptedAtUtc).getTime() < since) continue;
    const key = `${row.metal_symbol || 'XAU'}|${row.provider_name || 'unknown'}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({ ...row, attempted_at_utc: attemptedAtUtc });
  }
  return [...groups.entries()]
    .map(([key, rows]) => {
      rows.sort((left, right) =>
        String(right.attempted_at_utc).localeCompare(String(left.attempted_at_utc))
      );
      const [metalSymbol, providerName] = key.split('|');
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
        metal_symbol: metalSymbol,
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
    .sort(
      (left, right) =>
        left.metal_symbol.localeCompare(right.metal_symbol) ||
        left.provider_name.localeCompare(right.provider_name)
    );
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
            headers: { apikey: key, Authorization: `Bearer ${key}` },
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
              error: { code: data?.code || null, message: data?.message || response.statusText },
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

function validatePricePayload(payload, options = {}) {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, errors: ['payload must be an object'], warnings: [] };
  }
  const metalSymbol = normalizeMetalSymbol(
    payload.metal_symbol || payload.metal || payload.symbol || 'XAU'
  );
  const quoteCurrency = normalizeQuoteCurrency(payload.quote_currency || payload.currency || 'USD');
  const priceUsdPerOz = toFiniteNumber(
    payload.price_usd_per_oz ?? payload.xau_usd_per_oz ?? payload?.gold?.ounce_usd
  );
  const provider = String(payload.provider || payload.source || '').trim();
  const providerTimestampUtc = parseIsoTimestamp(
    payload.provider_timestamp_utc || payload.timestamp_utc || payload.fetched_at_utc
  );
  const fetchedAtUtc = parseIsoTimestamp(payload.fetched_at_utc || payload.timestamp_utc);
  const ingestedAtUtc =
    parseIsoTimestamp(payload.ingested_at_utc) || fetchedAtUtc || providerTimestampUtc;
  const aedPerGram24k = toFiniteNumber(
    payload.price_aed_per_gram ?? payload.aed_per_gram_24k ?? payload?.gold?.gram_aed
  );
  const freshnessSeconds = toFiniteNumber(payload.freshness_seconds);
  const normalized = {
    metalSymbol,
    quoteCurrency,
    priceUsdPerOz,
    priceAedPerGram: aedPerGram24k && aedPerGram24k > 0 ? aedPerGram24k : null,
    xauUsdPerOz: priceUsdPerOz,
    xauAedPerGram: aedPerGram24k && aedPerGram24k > 0 ? aedPerGram24k : null,
    currency: quoteCurrency,
    sourceProvider: provider,
    providerTimestampUtc,
    timestampUtc: providerTimestampUtc,
    fetchedAtUtc,
    ingestedAtUtc,
    freshnessSeconds: freshnessSeconds === null ? null : Math.max(0, Math.round(freshnessSeconds)),
    isFresh: toBoolean(payload.is_fresh, false),
    isFallback: toBoolean(payload.is_fallback, false),
    isMarketOpen: typeof payload.is_market_open === 'boolean' ? payload.is_market_open : null,
    freshnessState: payload.freshness_state || null,
    providerResponseTimeMs: toFiniteNumber(payload.provider_response_time_ms),
    rawPayloadHash: computeRawPayloadHash(payload),
  };
  const observationValidation = validateObservationCandidate(normalized, options);
  const publicErrors = observationValidation.errors.map((error) =>
    error === 'invalid_price' ? 'price_usd_per_oz/xau_usd_per_oz must be a positive number' : error
  );
  return {
    ok: observationValidation.ok,
    errors: publicErrors,
    warnings: observationValidation.warnings,
    qualityFlags: observationValidation.qualityFlags,
    normalized,
  };
}

function buildPriceSnapshotRow(normalized, options = {}) {
  return buildCanonicalObservation(normalized, options);
}

async function hasDuplicateSnapshot(supabase, row) {
  const { data, error } = await supabase
    .from('price_snapshots')
    .select('id')
    .eq('observation_id', row.observation_id)
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
    const duplicate =
      error.code === '23505' ||
      /\bduplicate\s+key\b|\bunique\s+constraint\b/i.test(String(error.message || ''));
    if (duplicate) return { inserted: false, duplicate: true };
    throw new Error(`snapshot insert failed: ${error.message}`);
  }
  return { inserted: true, duplicate: false, id: data?.id || null };
}

async function insertProviderRun(supabase, normalized, { circuitState = null } = {}) {
  const row = buildProviderRunRows({}, normalized, { circuitState })[0];
  const { error } = await supabase.from('provider_runs').insert([row]);
  if (error) throw new Error(`provider_runs insert failed: ${error.message}`);
  return row;
}

async function upsertProviderHealth(supabase, providerName, fallbackCircuitState = 'closed') {
  const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('provider_runs')
    .select(
      'metal_symbol,provider_name,status,latency_ms,circuit_state,attempted_at_utc,created_at'
    )
    .eq('provider_name', providerName)
    .gte('attempted_at_utc', sinceIso)
    .order('attempted_at_utc', { ascending: false })
    .limit(500);
  if (error) throw new Error(`provider health query failed: ${error.message}`);
  const row = computeProviderHealthRows(Array.isArray(data) ? data : [])[0] || {
    metal_symbol: 'XAU',
    provider_name: providerName,
    success_rate_24h: 0,
    current_status: 'unknown',
    circuit_state: fallbackCircuitState,
    updated_at: new Date().toISOString(),
  };
  const { error: upsertError } = await supabase
    .from('provider_health')
    .upsert([row], { onConflict: 'metal_symbol,provider_name' });
  if (upsertError) throw new Error(`provider_health upsert failed: ${upsertError.message}`);
  return row;
}

function normalizeHistoryRange(range) {
  const key = String(range || '30d').toLowerCase();
  return Object.prototype.hasOwnProperty.call(HISTORY_RANGE_DAYS, key) ? key : '30d';
}

function getHistoryWindowStart(range, now = Date.now()) {
  const key = normalizeHistoryRange(range);
  const days = HISTORY_RANGE_DAYS[key];
  return days === null ? new Date(0).toISOString() : new Date(now - days * 86400000).toISOString();
}

module.exports = {
  HISTORY_RANGE_DAYS,
  OBSERVATION_SCHEMA_VERSION,
  OBSERVATION_SLOT_MINUTES,
  OBSERVATION_SLOT_SECONDS,
  PROVIDER_DIVERGENCE_THRESHOLD_BPS,
  FUTURE_TOLERANCE_SECONDS,
  LATE_ARRIVAL_SECONDS,
  normalizeHistoryRange,
  getHistoryWindowStart,
  normalizeSymbol,
  normalizeMetalSymbol,
  normalizeQuoteCurrency,
  floorTimestampToSlot,
  computeObservationId,
  stableJsonStringify,
  computeRawPayloadHash,
  validateObservationCandidate,
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
