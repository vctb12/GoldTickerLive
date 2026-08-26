'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const rateLimit = require('express-rate-limit');
const { atomicWriteJSON } = require('../lib/fs-atomic');
const { getRuntimeEnvSnapshot, validateServerEnv } = require('../lib/env-validation');
const { successResponse, errorResponse } = require('../lib/api-response');
const { authMiddleware } = require('../lib/auth');
const { getSupabaseClient } = require('../lib/supabase-client');
const {
  HISTORY_RANGE_DAYS,
  normalizeHistoryRange,
  getHistoryWindowStart,
  validatePricePayload,
  createPostgrestQueryClient,
} = require('../lib/price-snapshots');

const router = express.Router();
const ROOT = path.resolve(__dirname, '../..');
const PACKAGE_JSON_PATH = path.join(ROOT, 'package.json');
const GOLD_PRICE_FILE = path.join(ROOT, 'data', 'gold_price.json');
const PROVIDER_STATE_FILE = path.join(ROOT, 'data', 'provider_state.json');
const PRICE_HISTORY_FILE = path.join(ROOT, 'src', 'data', 'historical-baseline.json');
const DATACORE_HISTORY_DIR = path.join(ROOT, 'data', 'history', 'XAU');
const DATACORE_INTRADAY_FILE = path.join(DATACORE_HISTORY_DIR, 'intraday-7d.json');
const DATACORE_HOURLY_FILE = path.join(DATACORE_HISTORY_DIR, 'hourly-90d.json');
const DATACORE_DAILY_FILE = path.join(DATACORE_HISTORY_DIR, 'daily.json');
const DATACORE_MANIFEST_FILE = path.join(ROOT, 'data', 'history', 'manifest.json');
const DATACORE_PROVIDER_HEALTH_FILE = path.join(ROOT, 'data', 'provider-health', 'summary.json');
const PRICE_SNAPSHOT_SYNC_SCRIPT_FILE = path.join(
  ROOT,
  'scripts',
  'node',
  'sync-price-snapshot.js'
);
const EVENTS_FILE = path.join(ROOT, 'data', 'analytics-events.json');
const LEADS_FILE = path.join(ROOT, 'data', 'leads.json');
const MAX_EVENT_NAME_LENGTH = 80;
const MAX_EVENT_PAGE_LENGTH = 200;
const MAX_LEAD_NAME_LENGTH = 120;
const MAX_LEAD_MESSAGE_LENGTH = 1200;
const MAX_LEAD_SOURCE_LENGTH = 120;
const MAX_STORED_EVENTS = 5000;
const MAX_STORED_LEADS = 5000;
const ISO_YEAR_MONTH_STRING_LENGTH = 7;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EVENTS_RATE_LIMIT_WINDOW_MINUTES = 15;
const LEADS_RATE_LIMIT_WINDOW_MINUTES = 15;
const HISTORY_RATE_LIMIT_WINDOW_MINUTES = 15;
const HISTORY_RATE_LIMIT_MAX = 30;
const HISTORY_SUPABASE_PAGE_SIZE = 1000;
const HISTORY_SUPABASE_MAX_ROWS = 10000;
const HISTORY_SUPABASE_COLUMNS =
  'observation_id,metal_symbol,quote_currency,provider_timestamp_utc,fetched_at_utc,ingested_at_utc,price_usd_per_oz,price_aed_per_gram,source_provider,freshness_state,market_state,freshness_seconds,is_fresh,is_fallback,is_selected,quality_state,quality_flags,correction_of_observation_id,is_correction';
const LATEST_SUPABASE_CANDIDATE_LIMIT = 100;
const LATEST_SUPABASE_COLUMNS = `${HISTORY_SUPABASE_COLUMNS},provider_chain,is_market_open`;
const DEFAULT_LIMIT_PROVIDER_RUNS = 100;

const PACKAGE_VERSION = (() => {
  try {
    return JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8')).version || '0.0.0';
  } catch {
    return '0.0.0';
  }
})();

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function readJsonArray(filePath) {
  if (!fileExists(filePath)) return [];
  const parsed = readJsonFile(filePath);
  return Array.isArray(parsed) ? parsed : [];
}

function writeJsonArray(filePath, entries) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  atomicWriteJSON(filePath, entries);
}

function buildSystemStatus() {
  const envValidation = validateServerEnv(process.env, console);
  const envSnapshot = getRuntimeEnvSnapshot(process.env);
  const goldPrice = readJsonFile(GOLD_PRICE_FILE);
  const providerState = readJsonFile(PROVIDER_STATE_FILE);
  const supabaseWriteAvailable = Boolean(
    process.env.SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    typeof globalThis.fetch === 'function'
  );
  const providerStateAvailable = fileExists(PROVIDER_STATE_FILE);
  const priceSnapshotSyncScriptAvailable = fileExists(PRICE_SNAPSHOT_SYNC_SCRIPT_FILE);
  const readiness = {
    supabaseConfigured: envSnapshot.supabaseConfigured,
    supabaseWriteAvailable,
    stripeConfigured: envSnapshot.stripeConfigured,
    stripeWebhookConfigured: envSnapshot.stripeWebhookConfigured,
    resendConfigured: envSnapshot.resendConfigured,
    alertJobTokenConfigured: envSnapshot.alertJobTokenConfigured,
    providerStateAvailable,
    priceSnapshotSyncAvailable: priceSnapshotSyncScriptAvailable && supabaseWriteAvailable,
  };

  return {
    status: 'ok',
    version: PACKAGE_VERSION,
    environment: envSnapshot.mode,
    uptimeSeconds: Math.floor(process.uptime()),
    checks: {
      dataFileAvailable: fileExists(GOLD_PRICE_FILE),
      providerStateFileAvailable: providerStateAvailable,
      supabaseConfigured: envSnapshot.supabaseConfigured,
      newsletterConfigured: envSnapshot.newsletterConfigured,
      stripeConfigured: envSnapshot.stripeConfigured,
      supabaseWriteAvailable,
      stripeWebhookConfigured: envSnapshot.stripeWebhookConfigured,
      resendConfigured: envSnapshot.resendConfigured,
      alertJobTokenConfigured: envSnapshot.alertJobTokenConfigured,
      priceSnapshotSyncScriptAvailable,
    },
    readiness,
    providers: {
      latestSource: goldPrice?.provider || goldPrice?.source || null,
      latestTimestampUtc: goldPrice?.timestamp_utc || goldPrice?.fetched_at_utc || null,
      state: providerState || {},
    },
    warnings: envValidation.warnings,
  };
}

function computeFreshnessLabel(pricePayload) {
  if (!pricePayload || typeof pricePayload !== 'object') return 'unknown';
  if (pricePayload.is_fresh === true) return 'fresh';
  if (pricePayload.is_fresh === false) return 'stale';
  if (pricePayload.is_fallback === true) return 'fallback';
  return 'unknown';
}

function parseLimit(input, fallback = 120, max = 1000) {
  const n = Number.parseInt(input, 10);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(n, max);
}

function sanitizeString(value, maxLength, fallback = null) {
  if (typeof value !== 'string') return fallback;
  const cleaned = value.trim().slice(0, maxLength);
  return cleaned || fallback;
}

function coerceToNumber(value, { positive = false, integer = false } = {}) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (positive && parsed <= 0) return null;
  if (integer) return Math.trunc(parsed);
  return parsed;
}

function toBooleanOrNull(value) {
  if (typeof value === 'boolean') return value;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

function toHistoryTimestampUtc(dateValue) {
  if (typeof dateValue !== 'string') return null;
  const isoCandidate =
    dateValue.length === ISO_YEAR_MONTH_STRING_LENGTH
      ? `${dateValue}-01T00:00:00.000Z`
      : dateValue.length === 10
        ? `${dateValue}T00:00:00.000Z`
        : dateValue;
  const date = new Date(isoCandidate);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function inferHistoryGranularity(dateValue) {
  return String(dateValue).length === ISO_YEAR_MONTH_STRING_LENGTH ? 'monthly' : 'daily';
}

function readDataCoreRollup(range) {
  const filePath =
    range === '1d' || range === '7d'
      ? DATACORE_INTRADAY_FILE
      : range === '30d' || range === '90d'
        ? DATACORE_HOURLY_FILE
        : DATACORE_DAILY_FILE;
  const payload = readJsonFile(filePath);
  if (!payload || !Array.isArray(payload.points)) return null;
  const rangeStartTime = new Date(getHistoryWindowStart(range)).getTime();
  const points = payload.points
    .filter((point) => {
      const timestampUtc = toHistoryTimestampUtc(point?.timestampUtc || point?.bucketStartUtc);
      return timestampUtc && new Date(timestampUtc).getTime() >= rangeStartTime;
    })
    .map((point) => ({
      timestampUtc: toHistoryTimestampUtc(point.timestampUtc || point.bucketStartUtc),
      xauUsdPerOz: coerceToNumber(point.priceUsdPerOz ?? point.close, { positive: true }),
      open: coerceToNumber(point.open, { positive: true }),
      high: coerceToNumber(point.high, { positive: true }),
      low: coerceToNumber(point.low, { positive: true }),
      close: coerceToNumber(point.close, { positive: true }),
      observationCount: coerceToNumber(point.observationCount, { integer: true }),
      providerDistribution: point.providerDistribution || {},
      providers: point.providers || (point.provider ? [point.provider] : []),
      providerCount: coerceToNumber(point.providerCount, { integer: true }),
      sourceObservationIds:
        point.sourceObservationIds ||
        (point.sourceObservationId ? [point.sourceObservationId] : []),
      sourceObservationHash: point.sourceObservationHash || null,
      incomplete: toBooleanOrNull(point.incomplete),
      mixedProviders: toBooleanOrNull(point.mixedProviders),
      granularity:
        payload.interval === '1d' ? 'daily' : payload.interval === '1h' ? 'hourly' : 'intraday',
    }))
    .filter((point) => point.timestampUtc && point.xauUsdPerOz);
  return {
    payload,
    points,
  };
}

async function querySupabase(table, queryBuilder) {
  const sb =
    createPostgrestQueryClient({
      url: process.env.SUPABASE_URL,
      key: process.env.SUPABASE_SERVICE_ROLE_KEY,
    }) || getSupabaseClient(false);
  if (!sb) return null;
  try {
    const query = sb.from(table);
    const { data, error } = await queryBuilder(query);
    if (error) {
      console.warn(`[api-v1] Supabase query failed for table "${table}": ${error.message}`);
      return null;
    }
    return data;
  } catch (error) {
    console.warn(`[api-v1] Supabase query exception for table "${table}": ${error.message}`);
    return null;
  }
}

async function fetchSupabaseRestRows(endpoint, { key, fetchImpl, queryLabel }) {
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
    if (!response.ok || !Array.isArray(data)) {
      const message = data?.message || response.statusText || 'invalid response';
      console.warn(`[api-v1] Supabase ${queryLabel} query failed: ${message}`);
      return null;
    }
    return data;
  } catch (error) {
    console.warn(`[api-v1] Supabase ${queryLabel} query exception: ${error.message}`);
    return null;
  }
}

function buildHistoryCursorFilter(row) {
  const providerTimestampUtc = toHistoryTimestampUtc(
    row?.provider_timestamp_utc || row?.timestamp_utc
  );
  const ingestedAtUtc = toHistoryTimestampUtc(row?.ingested_at_utc);
  const observationId = String(row?.observation_id || '').trim();
  if (!providerTimestampUtc || !ingestedAtUtc || !observationId) return null;
  return `(${[
    `provider_timestamp_utc.lt.${providerTimestampUtc}`,
    `and(provider_timestamp_utc.eq.${providerTimestampUtc},ingested_at_utc.lt.${ingestedAtUtc})`,
    `and(provider_timestamp_utc.eq.${providerTimestampUtc},ingested_at_utc.eq.${ingestedAtUtc},observation_id.lt.${observationId})`,
  ].join(',')})`;
}

async function fetchSupabaseHistoryRows(
  startTimestampUtc,
  {
    url = process.env.SUPABASE_URL,
    key = process.env.SUPABASE_SERVICE_ROLE_KEY,
    fetchImpl = globalThis.fetch,
    pageSize = HISTORY_SUPABASE_PAGE_SIZE,
    maxRows = HISTORY_SUPABASE_MAX_ROWS,
  } = {}
) {
  if (!url || !key || typeof fetchImpl !== 'function') return null;
  const boundedPageSize = Math.max(1, Math.min(Number(pageSize) || 1, HISTORY_SUPABASE_PAGE_SIZE));
  const boundedMaxRows = Math.max(1, Math.min(Number(maxRows) || 1, HISTORY_SUPABASE_MAX_ROWS));
  const sentinelRowLimit = boundedMaxRows + 1;
  const rows = [];
  const baseUrl = String(url).replace(/\/$/, '');
  let cursorFilter = null;

  while (rows.length < sentinelRowLimit) {
    const requestSize = Math.min(boundedPageSize, sentinelRowLimit - rows.length);
    const endpoint = new URL(`${baseUrl}/rest/v1/price_snapshots`);
    endpoint.searchParams.set('select', HISTORY_SUPABASE_COLUMNS);
    endpoint.searchParams.set('metal_symbol', 'eq.XAU');
    endpoint.searchParams.set('provider_timestamp_utc', `gte.${startTimestampUtc}`);
    if (cursorFilter) endpoint.searchParams.set('or', cursorFilter);
    endpoint.searchParams.set(
      'order',
      'provider_timestamp_utc.desc,ingested_at_utc.desc,observation_id.desc'
    );
    endpoint.searchParams.set('limit', String(requestSize));

    const data = await fetchSupabaseRestRows(endpoint, {
      key,
      fetchImpl,
      queryLabel: 'history',
    });
    if (data === null) return null;
    rows.push(...data);
    if (data.length < requestSize) break;
    cursorFilter = buildHistoryCursorFilter(data[data.length - 1]);
    if (!cursorFilter) {
      console.warn('[api-v1] Supabase history query returned an invalid keyset cursor');
      return null;
    }
  }

  return {
    rows: rows.slice(0, boundedMaxRows),
    truncated: rows.length > boundedMaxRows,
  };
}

async function fetchSupabaseLatestRows({
  url = process.env.SUPABASE_URL,
  key = process.env.SUPABASE_SERVICE_ROLE_KEY,
  fetchImpl = globalThis.fetch,
} = {}) {
  if (!url || !key || typeof fetchImpl !== 'function') return null;
  const baseUrl = String(url).replace(/\/$/, '');
  const endpoint = new URL(`${baseUrl}/rest/v1/price_snapshots`);
  endpoint.searchParams.set('select', LATEST_SUPABASE_COLUMNS);
  endpoint.searchParams.set('metal_symbol', 'eq.XAU');
  endpoint.searchParams.set(
    'order',
    'provider_timestamp_utc.desc,ingested_at_utc.desc,observation_id.desc'
  );
  endpoint.searchParams.set('limit', String(LATEST_SUPABASE_CANDIDATE_LIMIT));
  return fetchSupabaseRestRows(endpoint, { key, fetchImpl, queryLabel: 'latest-price' });
}

function resolveEffectiveHistoryRows(rows) {
  const orderedRows = (Array.isArray(rows) ? rows : [])
    .filter(
      (row) =>
        row?.quality_state !== 'rejected' &&
        coerceToNumber(row?.price_usd_per_oz ?? row?.xau_usd_per_oz, { positive: true }) !== null
    )
    .sort(
      (left, right) =>
        String(left.provider_timestamp_utc || left.timestamp_utc).localeCompare(
          String(right.provider_timestamp_utc || right.timestamp_utc)
        ) ||
        String(left.ingested_at_utc || '').localeCompare(String(right.ingested_at_utc || '')) ||
        String(left.observation_id || '').localeCompare(String(right.observation_id || ''))
    );
  const correctedObservationIds = new Set(
    orderedRows.map((row) => row.correction_of_observation_id).filter(Boolean)
  );
  return orderedRows.filter((row) => !correctedObservationIds.has(row.observation_id));
}

function selectLatestEffectiveSnapshotRow(rows) {
  return (
    resolveEffectiveHistoryRows(rows)
      .filter((row) => row.is_selected !== false)
      .at(-1) || null
  );
}

function mapPricePayloadToApiData(pricePayload) {
  const freshnessSeconds = coerceToNumber(pricePayload?.freshness_seconds, { integer: true });
  return {
    xauUsdPerOz: coerceToNumber(pricePayload?.xau_usd_per_oz ?? pricePayload?.gold?.ounce_usd, {
      positive: true,
    }),
    usdPerGram24k: coerceToNumber(pricePayload?.usd_per_gram_24k, { positive: true }),
    aedPerGram24k: coerceToNumber(pricePayload?.aed_per_gram_24k ?? pricePayload?.gold?.gram_aed, {
      positive: true,
    }),
    karatsAedPerGram: pricePayload?.karats_aed_per_gram || null,
    timestampUtc: pricePayload?.timestamp_utc || null,
    fetchedAtUtc: pricePayload?.fetched_at_utc || null,
    provider: pricePayload?.provider || pricePayload?.source || null,
    providerChain: pricePayload?.provider_chain || null,
    freshnessSeconds: freshnessSeconds !== null && freshnessSeconds >= 0 ? freshnessSeconds : null,
    isFresh: toBooleanOrNull(pricePayload?.is_fresh),
    isFallback: toBooleanOrNull(pricePayload?.is_fallback),
    isMarketOpen: toBooleanOrNull(pricePayload?.is_market_open),
    sourceMode: 'file',
  };
}

function mapSnapshotRowToLatestApiData(row) {
  const freshnessSeconds = coerceToNumber(row?.freshness_seconds, { integer: true });
  return {
    xauUsdPerOz: coerceToNumber(row?.price_usd_per_oz ?? row?.xau_usd_per_oz, {
      positive: true,
    }),
    usdPerGram24k: null,
    aedPerGram24k: coerceToNumber(row?.price_aed_per_gram ?? row?.xau_aed_per_gram, {
      positive: true,
    }),
    karatsAedPerGram: null,
    timestampUtc: row?.provider_timestamp_utc || row?.timestamp_utc || null,
    fetchedAtUtc: row?.fetched_at_utc || null,
    provider: row?.source_provider || null,
    providerChain: row?.provider_chain || null,
    freshnessSeconds: freshnessSeconds !== null && freshnessSeconds >= 0 ? freshnessSeconds : null,
    isFresh: toBooleanOrNull(row?.is_fresh),
    isFallback: toBooleanOrNull(row?.is_fallback),
    isMarketOpen: toBooleanOrNull(row?.is_market_open),
    sourceMode: 'supabase',
  };
}

function buildHistoryCoverage(points, extra = {}) {
  if (!Array.isArray(points) || points.length === 0) {
    return {
      startTimestampUtc: null,
      endTimestampUtc: null,
      pointsAvailable: 0,
      ...extra,
    };
  }
  const timestamps = points
    .map((point) => point?.timestampUtc || null)
    .filter((value) => typeof value === 'string' && value.length > 0);
  return {
    startTimestampUtc: timestamps[0] || null,
    endTimestampUtc: timestamps[timestamps.length - 1] || null,
    pointsAvailable: points.length,
    ...extra,
  };
}

function buildHistorySuccessPayload({
  range,
  total,
  points,
  source,
  sourceMode,
  freshness,
  coverage,
  latestTimestampUtc = null,
  latestFetchedAtUtc = null,
  note = null,
  fallback = false,
}) {
  const normalizedCoverage = coverage || buildHistoryCoverage(points);
  return successResponse(
    {
      range,
      total,
      returned: points.length,
      points,
      sourceMode,
      historySource: source,
      coverage: normalizedCoverage,
      latestTimestampUtc,
      latestFetchedAtUtc,
      fallback,
      note,
    },
    {
      source,
      freshness,
      extra: {
        mode: sourceMode,
        fallback,
        coverageStartUtc: normalizedCoverage.startTimestampUtc,
        coverageEndUtc: normalizedCoverage.endTimestampUtc,
        coveragePoints: normalizedCoverage.pointsAvailable,
      },
    }
  );
}

function buildHistoryResponse({
  range,
  limit,
  supabaseRows,
  supabaseTruncated = false,
  staticRollup,
  baselineHistory,
  latestPricePayload,
}) {
  const effectiveRows = resolveEffectiveHistoryRows(supabaseRows).filter(
    (row) => row.is_selected !== false
  );
  if (effectiveRows.length > 0) {
    const points = effectiveRows.slice(-limit).map((row) => ({
      timestampUtc: row.provider_timestamp_utc || row.timestamp_utc,
      fetchedAtUtc: row.fetched_at_utc,
      ingestedAtUtc: row.ingested_at_utc,
      xauUsdPerOz: coerceToNumber(row.price_usd_per_oz ?? row.xau_usd_per_oz, {
        positive: true,
      }),
      xauAedPerGram: coerceToNumber(row.price_aed_per_gram ?? row.xau_aed_per_gram, {
        positive: true,
      }),
      provider: row.source_provider,
      freshnessState: row.freshness_state,
      marketState: row.market_state,
      qualityFlags: row.quality_flags || [],
      isCorrection: toBooleanOrNull(row.is_correction),
      correctionOfObservationId: row.correction_of_observation_id || null,
      sourceObservationId: row.observation_id,
      freshnessSeconds: coerceToNumber(row.freshness_seconds, { integer: true }),
      isFresh: toBooleanOrNull(row.is_fresh),
      isFallback: toBooleanOrNull(row.is_fallback),
    }));
    return {
      status: 200,
      body: buildHistorySuccessPayload({
        range,
        total: effectiveRows.length,
        points,
        source: 'supabase',
        sourceMode: 'supabase',
        freshness: 'historical',
        coverage: buildHistoryCoverage(points, {
          providerBacked: true,
          partial: supabaseTruncated || points.length < effectiveRows.length,
          truncated: supabaseTruncated,
          totalIsLowerBound: supabaseTruncated,
        }),
        latestTimestampUtc: points[points.length - 1]?.timestampUtc || null,
        latestFetchedAtUtc: points[points.length - 1]?.fetchedAtUtc || null,
      }),
    };
  }

  if (staticRollup && Array.isArray(staticRollup.points) && staticRollup.points.length > 0) {
    const points = staticRollup.points.slice(-limit);
    return {
      status: 200,
      body: buildHistorySuccessPayload({
        range,
        total: staticRollup.points.length,
        points,
        source: 'datacore-static-rollup',
        sourceMode: 'file',
        freshness: 'historical',
        coverage: buildHistoryCoverage(points, {
          providerBacked: true,
          staticFallback: true,
          granularity: staticRollup.payload.interval,
        }),
        latestTimestampUtc: points[points.length - 1]?.timestampUtc || null,
        latestFetchedAtUtc: staticRollup.payload.generatedAtUtc || null,
        note: 'Bounded DataCore rollup derived from verified observations. Historical reference data, not a live retail quote.',
        fallback: true,
      }),
    };
  }

  if (Array.isArray(baselineHistory)) {
    const rangeStartTime = new Date(getHistoryWindowStart(range)).getTime();
    const points = baselineHistory
      .filter((point) => {
        const ts = toHistoryTimestampUtc(point?.date);
        if (!ts) return false;
        return new Date(ts).getTime() >= rangeStartTime;
      })
      .slice(-limit)
      .map((point) => ({
        timestampUtc: toHistoryTimestampUtc(point.date),
        xauUsdPerOz: coerceToNumber(point.price, { positive: true }),
        provider: point.source || 'historical-baseline',
        granularity: point.granularity || inferHistoryGranularity(point.date),
      }));
    return {
      status: 200,
      body: buildHistorySuccessPayload({
        range,
        total: baselineHistory.length,
        points,
        source: 'static-baseline',
        sourceMode: 'file',
        freshness: 'reference',
        coverage: buildHistoryCoverage(points, {
          providerBacked: false,
          referenceOnly: true,
        }),
        latestTimestampUtc: points[points.length - 1]?.timestampUtc || null,
        note: 'Reference baseline fallback. This dataset is not a live shop or live market history feed.',
        fallback: true,
      }),
    };
  }

  const validatedLatestPayload = validatePricePayload(latestPricePayload);
  if (validatedLatestPayload.ok) {
    const point = {
      timestampUtc: validatedLatestPayload.normalized.timestampUtc,
      fetchedAtUtc: validatedLatestPayload.normalized.fetchedAtUtc,
      xauUsdPerOz: validatedLatestPayload.normalized.xauUsdPerOz,
      xauAedPerGram: validatedLatestPayload.normalized.xauAedPerGram,
      provider: validatedLatestPayload.normalized.sourceProvider,
      freshnessSeconds: validatedLatestPayload.normalized.freshnessSeconds,
      isFresh: validatedLatestPayload.normalized.isFresh,
      isFallback: validatedLatestPayload.normalized.isFallback,
    };
    return {
      status: 200,
      body: buildHistorySuccessPayload({
        range,
        total: 1,
        points: [point],
        source: 'json-fallback',
        sourceMode: 'file',
        freshness: 'fallback',
        coverage: buildHistoryCoverage([point], {
          providerBacked: false,
          snapshotFallback: true,
        }),
        latestTimestampUtc: point.timestampUtc,
        latestFetchedAtUtc: point.fetchedAtUtc,
        note: 'Single-point snapshot fallback only. Treat this as a cached reference point, not full live history.',
        fallback: true,
      }),
    };
  }

  return {
    status: 200,
    body: buildHistorySuccessPayload({
      range,
      total: 0,
      points: [],
      source: 'empty',
      sourceMode: 'none',
      freshness: 'unavailable',
      coverage: buildHistoryCoverage([], {
        providerBacked: false,
        empty: true,
      }),
      note: 'No Supabase history, static baseline, or JSON snapshot fallback is currently available.',
      fallback: true,
    }),
  };
}

const eventsRateLimiter = rateLimit({
  windowMs: EVENTS_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: errorResponse(
    'RATE_LIMITED',
    'Too many events from this address. Please try again later.'
  ),
});

const historyRateLimiter = rateLimit({
  windowMs: HISTORY_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  max: HISTORY_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: errorResponse(
    'RATE_LIMITED',
    'Too many history requests from this address. Please try again later.'
  ),
});

const leadsRateLimiter = rateLimit({
  windowMs: LEADS_RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: errorResponse(
    'RATE_LIMITED',
    'Too many leads from this address. Please try again later.'
  ),
});

router.get('/health', (_req, res) => {
  const status = buildSystemStatus();
  res.json(
    successResponse(status, {
      source: 'backend',
      freshness: 'live',
    })
  );
});

router.get('/status', (_req, res) => {
  const status = buildSystemStatus();
  res.json(
    successResponse(status, {
      source: 'backend',
      freshness: 'live',
    })
  );
});

router.get('/config/public', (_req, res) => {
  const envSnapshot = getRuntimeEnvSnapshot(process.env);
  const data = {
    version: PACKAGE_VERSION,
    apiVersion: 'v1',
    environment: envSnapshot.mode,
    storageBackend: envSnapshot.storageBackend,
    features: {
      supabase: envSnapshot.supabaseConfigured,
      newsletter: envSnapshot.newsletterConfigured,
      alerts: true,
      stripe: envSnapshot.stripeConfigured,
      adminPin: envSnapshot.adminPinConfigured,
    },
  };
  res.json(successResponse(data, { source: 'backend-config', freshness: 'current' }));
});

router.get('/prices/latest', async (_req, res) => {
  const latestSnapshotRows = await fetchSupabaseLatestRows();
  const latestSnapshotRow = selectLatestEffectiveSnapshotRow(latestSnapshotRows);

  if (latestSnapshotRow) {
    const latest = mapSnapshotRowToLatestApiData(latestSnapshotRow);
    return res.json(
      successResponse(latest, {
        source: latest.provider || 'price_snapshots',
        freshness:
          latest.isFresh === true ? 'fresh' : latest.isFresh === false ? 'stale' : 'unknown',
        extra: {
          mode: 'supabase',
        },
      })
    );
  }

  const pricePayload = readJsonFile(GOLD_PRICE_FILE);
  if (!pricePayload) {
    return res
      .status(503)
      .json(errorResponse('PRICE_DATA_UNAVAILABLE', 'Price data file is unavailable or invalid.'));
  }

  const data = mapPricePayloadToApiData(pricePayload);

  return res.json(
    successResponse(data, {
      source: data.provider || 'gold_price_file',
      freshness: computeFreshnessLabel(pricePayload),
      extra: {
        mode: 'file',
      },
    })
  );
});

router.get('/prices/history', historyRateLimiter, async (req, res) => {
  const requestedRange =
    req.query.range === undefined ? '30d' : String(req.query.range).toLowerCase();
  if (!Object.prototype.hasOwnProperty.call(HISTORY_RANGE_DAYS, requestedRange)) {
    return res
      .status(400)
      .json(errorResponse('INVALID_HISTORY_RANGE', 'range must be 1d, 7d, 30d, 90d, 1y, or all.'));
  }
  const requestedMetal = String(req.query.metal || 'XAU').toUpperCase();
  if (requestedMetal !== 'XAU') {
    return res
      .status(400)
      .json(errorResponse('METAL_NOT_ENABLED', 'Only XAU history is enabled in DataCore DC-1.'));
  }
  const range = normalizeHistoryRange(requestedRange);
  const limit = parseLimit(req.query.limit, 120, 5000);
  const supabaseStart = getHistoryWindowStart(range);
  const supabaseHistory = await fetchSupabaseHistoryRows(supabaseStart);
  const staticRollup = readDataCoreRollup(range);
  const history = readJsonFile(PRICE_HISTORY_FILE);
  const latestPricePayload = readJsonFile(GOLD_PRICE_FILE);
  const response = buildHistoryResponse({
    range,
    limit,
    supabaseRows: supabaseHistory?.rows || null,
    supabaseTruncated: supabaseHistory?.truncated === true,
    staticRollup,
    baselineHistory: Array.isArray(history) ? history : null,
    latestPricePayload,
  });
  res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
  res.set('Vary', 'Accept-Encoding');
  return res.status(response.status).json(response.body);
});

router.get('/prices/history/manifest', (_req, res) => {
  const manifest = readJsonFile(DATACORE_MANIFEST_FILE);
  if (!manifest) {
    return res
      .status(503)
      .json(
        errorResponse(
          'HISTORY_MANIFEST_UNAVAILABLE',
          'The DataCore static history manifest is unavailable.'
        )
      );
  }
  res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=900');
  return res.json(
    successResponse(manifest, {
      source: 'datacore-static-manifest',
      freshness: 'historical',
      extra: { mode: 'file', fallback: true },
    })
  );
});

router.get('/prices/snapshots', async (req, res) => {
  const limit = parseLimit(req.query.limit, 120, 1000);
  const provider = sanitizeString(req.query.provider, 120, null);

  const supabaseRows = await querySupabase('price_snapshots', (table) => {
    let query = table
      .select(
        'observation_id,metal_symbol,quote_currency,provider_timestamp_utc,fetched_at_utc,ingested_at_utc,price_usd_per_oz,price_aed_per_gram,source_provider,provider_chain,freshness_state,market_state,freshness_seconds,is_fresh,is_fallback,is_selected,quality_state,quality_flags,correction_of_observation_id,is_correction'
      )
      .eq('metal_symbol', 'XAU')
      .eq('is_selected', true)
      .order('timestamp_utc', { ascending: false })
      .limit(limit);
    if (provider) query = query.eq('source_provider', provider);
    return query;
  });

  if (Array.isArray(supabaseRows) && supabaseRows.length > 0) {
    return res.json(
      successResponse(
        {
          total: supabaseRows.length,
          returned: supabaseRows.length,
          snapshots: supabaseRows.map((row) => ({
            ...row,
            price_usd_per_oz: coerceToNumber(row.price_usd_per_oz, { positive: true }),
            price_aed_per_gram: coerceToNumber(row.price_aed_per_gram, { positive: true }),
            freshness_seconds: coerceToNumber(row.freshness_seconds, { integer: true }),
            is_fresh: toBooleanOrNull(row.is_fresh),
            is_fallback: toBooleanOrNull(row.is_fallback),
          })),
          sourceMode: 'supabase',
        },
        {
          source: 'price_snapshots',
          freshness: 'historical',
          extra: { mode: 'supabase' },
        }
      )
    );
  }

  const payload = readJsonFile(GOLD_PRICE_FILE);
  const validated = validatePricePayload(payload);
  const snapshots = validated.ok
    ? [
        {
          id: null,
          timestamp_utc: validated.normalized.timestampUtc,
          fetched_at_utc: validated.normalized.fetchedAtUtc,
          xau_usd_per_oz: validated.normalized.xauUsdPerOz,
          xau_aed_per_gram: validated.normalized.xauAedPerGram,
          source_provider: validated.normalized.sourceProvider,
          provider_chain: null,
          freshness_seconds: validated.normalized.freshnessSeconds,
          is_fresh: validated.normalized.isFresh,
          is_fallback: validated.normalized.isFallback,
          created_at: null,
        },
      ]
    : [];

  return res.json(
    successResponse(
      {
        total: snapshots.length,
        returned: snapshots.length,
        snapshots,
        sourceMode: 'file',
      },
      {
        source: 'gold_price_file',
        freshness: snapshots.length ? computeFreshnessLabel(payload) : 'unknown',
        extra: { mode: 'file' },
      }
    )
  );
});

router.get('/providers/status', async (_req, res) => {
  const providerHealthRows = await querySupabase('provider_health', (table) =>
    table.select('*').order('provider_name', { ascending: true }).limit(200)
  );

  if (Array.isArray(providerHealthRows) && providerHealthRows.length > 0) {
    const latestSnapshotRows = await querySupabase('price_snapshots', (table) =>
      table
        .select('source_provider,timestamp_utc')
        .eq('metal_symbol', 'XAU')
        .eq('is_selected', true)
        .order('timestamp_utc', { ascending: false })
        .limit(1)
    );
    return res.json(
      successResponse(
        {
          providers: providerHealthRows,
          latestProvider: latestSnapshotRows?.[0]?.source_provider || null,
          latestTimestampUtc: latestSnapshotRows?.[0]?.timestamp_utc || null,
          sourceMode: 'supabase',
        },
        {
          source: 'provider_health',
          freshness: 'current',
          extra: { mode: 'supabase' },
        }
      )
    );
  }

  const state = readJsonFile(PROVIDER_STATE_FILE);
  const staticHealth = readJsonFile(DATACORE_PROVIDER_HEALTH_FILE);
  const latest = readJsonFile(GOLD_PRICE_FILE);
  return res.json(
    successResponse(
      {
        providerStateFileAvailable: fileExists(PROVIDER_STATE_FILE),
        providerState: state || {},
        latestProvider: latest?.provider || latest?.source || null,
        latestTimestampUtc: latest?.timestamp_utc || latest?.fetched_at_utc || null,
        providers: Array.isArray(staticHealth?.providers) ? staticHealth.providers : [],
        quality: staticHealth?.quality || null,
        sourceMode: staticHealth ? 'datacore-static' : 'file',
      },
      {
        source: staticHealth ? 'datacore-provider-health' : 'provider-state',
        freshness: staticHealth ? 'historical' : state ? 'current' : 'unknown',
        extra: { mode: 'file' },
      }
    )
  );
});

router.get('/providers/runs', authMiddleware('admin'), async (req, res) => {
  const limit = parseLimit(req.query.limit, DEFAULT_LIMIT_PROVIDER_RUNS, 1000);
  const provider = sanitizeString(req.query.provider, 120, null);

  const providerRuns = await querySupabase('provider_runs', (table) => {
    let query = table.select('*').order('created_at', { ascending: false }).limit(limit);
    if (provider) query = query.eq('provider_name', provider);
    return query;
  });

  if (Array.isArray(providerRuns) && providerRuns.length > 0) {
    return res.json(
      successResponse(
        {
          total: providerRuns.length,
          returned: providerRuns.length,
          runs: providerRuns,
          sourceMode: 'supabase',
        },
        {
          source: 'provider_runs',
          freshness: 'current',
          extra: { mode: 'supabase' },
        }
      )
    );
  }

  return res.json(
    successResponse(
      {
        total: 0,
        returned: 0,
        runs: [],
        sourceMode: 'file',
      },
      {
        source: 'provider-state',
        freshness: 'unknown',
        extra: { mode: 'file' },
      }
    )
  );
});

router.post('/events', eventsRateLimiter, (req, res) => {
  const eventName = sanitizeString(req.body?.event, MAX_EVENT_NAME_LENGTH, '');
  if (!eventName) {
    return res.status(400).json(errorResponse('VALIDATION_ERROR', 'event is required.'));
  }

  const entry = {
    id: `evt_${crypto.randomBytes(8).toString('hex')}`,
    event: eventName,
    page: sanitizeString(req.body?.page, MAX_EVENT_PAGE_LENGTH),
    ts: typeof req.body?.ts === 'number' ? req.body.ts : Date.now(),
    properties:
      req.body?.properties && typeof req.body.properties === 'object' ? req.body.properties : {},
    createdAt: new Date().toISOString(),
  };

  const events = readJsonArray(EVENTS_FILE);
  events.push(entry);
  writeJsonArray(EVENTS_FILE, events.slice(-MAX_STORED_EVENTS));

  return res
    .status(202)
    .json(
      successResponse(
        { id: entry.id, accepted: true },
        { source: 'events-ingest', freshness: 'current' }
      )
    );
});

router.post('/leads', leadsRateLimiter, (req, res) => {
  const email = sanitizeString(req.body?.email, 320, '')?.toLowerCase() || '';
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json(errorResponse('VALIDATION_ERROR', 'A valid email is required.'));
  }

  const lead = {
    id: `lead_${crypto.randomBytes(8).toString('hex')}`,
    email,
    name: sanitizeString(req.body?.name, MAX_LEAD_NAME_LENGTH),
    message: sanitizeString(req.body?.message, MAX_LEAD_MESSAGE_LENGTH),
    source: sanitizeString(req.body?.source, MAX_LEAD_SOURCE_LENGTH, 'public'),
    createdAt: new Date().toISOString(),
  };

  const leads = readJsonArray(LEADS_FILE);
  leads.push(lead);
  writeJsonArray(LEADS_FILE, leads.slice(-MAX_STORED_LEADS));

  return res.status(201).json(
    successResponse(
      {
        id: lead.id,
        accepted: true,
      },
      {
        source: 'leads-ingest',
        freshness: 'current',
      }
    )
  );
});

module.exports = router;
module.exports.__testables = {
  buildHistoryCoverage,
  buildHistoryResponse,
  buildHistorySuccessPayload,
  buildSystemStatus,
  buildHistoryCursorFilter,
  fetchSupabaseHistoryRows,
  fetchSupabaseLatestRows,
  resolveEffectiveHistoryRows,
  selectLatestEffectiveSnapshotRow,
};
