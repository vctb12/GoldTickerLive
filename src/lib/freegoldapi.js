/**
 * Optional reference historical gold prices from freegoldapi.com.
 * Community-maintained, no API key, CORS-enabled. Used as a supplement — not live spot authority.
 *
 * CONTAINMENT GUARANTEE (R14): this feed can lag or carry bad datapoints (its
 * last row has been observed months stale and ~27% off spot). Every consumer
 * must treat rows as HISTORICAL REFERENCE ONLY — never current-price context:
 *   • `freegoldRowToRecord` stamps `freshnessState:'historical'`,
 *     `source:'freegoldapi-reference'`, `derived:true`, and each row keeps its
 *     own date — `historical-data.js getUnifiedHistory()` merges it into chart
 *     history at that date only (local browser snapshots supersede it).
 *   • The live-lane second opinion (`quote-providers/secondary-spot-check.js`)
 *     rejects any row older than `REFERENCE_MAX_AGE_MS` (~26 h), so a stale
 *     row can never confirm, downgrade, or masquerade as today's spot.
 *   • Nothing here feeds `spot-resolver.js` or the realtime engine's price.
 * Locked by tests/freegoldapi-reference-clamp.test.js — keep that suite green
 * if you touch normalization or consumers.
 */

import { isSaneGoldSpotUsd } from './quote-providers/fetch-utils.js';

const API_URL = 'https://freegoldapi.com/data/latest.json';
const CACHE_KEY = 'gtl_freegoldapi_reference_v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // source refreshes daily ~06:00 UTC

/** USD-trusted rows only (pre-2018 rows mix GBP sources). */
const TRUSTED_SOURCES = new Set(['yahoo_finance', 'worldbank']);

let memoryCache = null;
let fetchPromise = null;

function readCache() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.fetchedAt || !Array.isArray(parsed.records)) return null;
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    return parsed.records;
  } catch {
    return null;
  }
}

function writeCache(records) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ fetchedAt: Date.now(), records: records.slice(0, 5000) })
    );
  } catch {
    // quota or private mode — memory cache still works this session
  }
}

/**
 * Normalise a freegoldapi row into unified history schema.
 * @param {{ date: string, price: number, source?: string }} row
 */
export function freegoldRowToRecord(row) {
  if (!row || typeof row !== 'object') return null;
  const price = Number(row.price);
  if (!row.date || !isSaneGoldSpotUsd(price)) return null;
  return {
    date: row.date.slice(0, 10),
    price,
    granularity: 'daily',
    source: 'freegoldapi-reference',
    freshnessState: 'historical',
    derived: true,
    upstreamSource: row.source || 'freegoldapi',
  };
}

/**
 * Filter and normalise raw API payload.
 * @param {Array<{ date: string, price: number, source?: string }>} rows
 */
export function normalizeFreeGoldRows(rows) {
  if (!Array.isArray(rows)) return [];
  return rows
    .filter((row) => row?.date >= '2019-01-01' && TRUSTED_SOURCES.has(row.source))
    .map(freegoldRowToRecord)
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * @returns {Promise<Array>} normalised history records (may be empty on failure)
 */
export async function fetchFreeGoldReference() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(API_URL, { credentials: 'omit', signal: controller.signal });
    if (!response.ok) throw new Error(`freegoldapi HTTP ${response.status}`);
    const payload = await response.json();
    return normalizeFreeGoldRows(payload);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Prefetch remote reference history once per session (24h local cache).
 * Safe to call from multiple surfaces — deduped via shared promise.
 */
export function ensureFreeGoldReference() {
  if (memoryCache) return Promise.resolve(memoryCache);
  const cached = readCache();
  if (cached?.length) {
    memoryCache = cached;
    return Promise.resolve(memoryCache);
  }
  if (!fetchPromise) {
    fetchPromise = fetchFreeGoldReference()
      .then((records) => {
        memoryCache = records;
        writeCache(records);
        return records;
      })
      .catch(() => {
        memoryCache = [];
        return [];
      })
      .finally(() => {
        fetchPromise = null;
      });
  }
  return fetchPromise;
}

/** Sync read of last prefetched / cached reference rows. */
export function getCachedFreeGoldReference() {
  if (memoryCache) return memoryCache;
  const cached = readCache();
  if (cached?.length) {
    memoryCache = cached;
    return memoryCache;
  }
  return [];
}

/** Test helper — reset module state. */
export function __resetFreeGoldCacheForTests() {
  memoryCache = null;
  fetchPromise = null;
}
