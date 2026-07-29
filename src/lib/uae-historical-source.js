/**
 * Homepage UAE historical chart — loader for committed gold-api.com daily XAU/USD file.
 *
 * Primary source: /data/historical/xau-usd-daily.json (refreshed by historical-gold-refresh.yml).
 * Does not use getUnifiedHistory(), FreeGoldAPI, or embedded monthly baseline.
 */

import { CONSTANTS } from '../config/constants.js';
import { KARATS } from '../config/karats.js';
import { usdPerGram } from './price-calculator.js';
import {
  validateDatasetDocument,
  validateProductionProvenance,
  classifyDatasetFreshness,
  SCHEMA_VERSION,
  PROVIDER,
  AGGREGATION,
  DATA_ORIGIN_LIVE,
} from './gold-api-daily-history-contract.js';
import {
  buildUaeKaratHistoryPoints,
  computeCoverageMeta,
  normalizeDisplayAed,
  UAE_HISTORY_KARATS,
} from './uae-historical-karat-data.js';

export const DAILY_HISTORY_URL = '/data/historical/xau-usd-daily.json';

const PURITY_BY_CODE = Object.fromEntries(KARATS.map((k) => [k.code, k.purity]));

/**
 * @typedef {object} UaeDailyHistoryMeta
 * @property {string} provider
 * @property {string} aggregation
 * @property {string} generatedAt
 * @property {object} coverage
 * @property {'current'|'stale'|'unavailable'} freshness
 */

/**
 * Fetch and validate the committed daily history JSON.
 * @param {string} [url]
 * @param {typeof fetch} [fetchFn]
 * @returns {Promise<{ ok: boolean, document: object|null, errors: string[], meta: UaeDailyHistoryMeta|null }>}
 */
export async function fetchDailyHistoryDocument(url = DAILY_HISTORY_URL, fetchFn = fetch) {
  let response;
  try {
    response = await fetchFn(url, { cache: 'no-cache' });
  } catch {
    return { ok: false, document: null, errors: ['fetch_failed'], meta: null };
  }

  if (!response.ok) {
    return { ok: false, document: null, errors: [`http_${response.status}`], meta: null };
  }

  let document;
  try {
    document = await response.json();
  } catch {
    return { ok: false, document: null, errors: ['invalid_json'], meta: null };
  }

  const validation = validateDatasetDocument(document, undefined, {
    allowStale: true,
    requireProductionProvenance: true,
  });
  const provenance = validateProductionProvenance(document);
  if (!validation.ok || !provenance.ok) {
    return {
      ok: false,
      document,
      errors: [...validation.errors, ...provenance.errors, ...provenance.fatalWarnings],
      meta: null,
    };
  }

  if (document.dataOrigin !== DATA_ORIGIN_LIVE) {
    return { ok: false, document, errors: ['data_origin_not_live'], meta: null };
  }

  const end = validation.records[validation.records.length - 1]?.date || null;
  const meta = {
    provider: String(document.provider || PROVIDER),
    aggregation: String(document.aggregation || AGGREGATION),
    generatedAt: String(document.generatedAt || ''),
    coverage: document.coverage || {},
    freshness: classifyDatasetFreshness(end),
    schemaVersion: document.schemaVersion ?? SCHEMA_VERSION,
  };

  return { ok: true, document, errors: [], meta };
}

/**
 * Transform validated daily XAU/USD averages into karat history input rows.
 * @param {Array<{date: string, avgUsdOz: number}>} records
 * @returns {Array<{date: string, price: number, source: string, granularity: string, freshnessState: string}>}
 */
export function dailyRecordsToUnifiedRows(records) {
  return records.map((row) => ({
    date: row.date,
    price: row.avgUsdOz,
    source: 'gold-api-daily',
    upstreamSource: PROVIDER,
    granularity: 'daily',
    freshnessState: 'historical',
    derived: true,
  }));
}

/**
 * AED/gram for karat K from daily average XAU/USD per troy ounce.
 * @param {number} avgUsdOz
 * @param {string} karatCode
 * @returns {number}
 */
export function aedPerGramFromDailyAvg(avgUsdOz, karatCode) {
  const purity = PURITY_BY_CODE[karatCode];
  if (!purity || !(avgUsdOz > 0)) return 0;
  const usdGram = usdPerGram(avgUsdOz, purity);
  if (!(usdGram > 0)) return 0;
  return usdGram * CONSTANTS.AED_PEG;
}

/**
 * Load homepage UAE karat history from committed daily file.
 * @param {object} [options]
 * @param {string} [options.url]
 * @param {typeof fetch} [options.fetchFn]
 * @returns {Promise<{ points: import('./uae-historical-karat-data.js').UaeKaratHistoryPoint[], coverage: object|null, meta: UaeDailyHistoryMeta|null, errors: string[] }>}
 */
export async function loadUaeDailyKaratHistory({ url, fetchFn } = {}) {
  const result = await fetchDailyHistoryDocument(url, fetchFn);
  if (!result.ok || !result.document) {
    return { points: [], coverage: null, meta: result.meta, errors: result.errors };
  }

  const records = result.document.records || [];
  const rows = dailyRecordsToUnifiedRows(records);
  const points = buildUaeKaratHistoryPoints(rows);
  const coverage = computeCoverageMeta(points);
  return {
    points,
    coverage: coverage
      ? { ...coverage, freshness: result.meta?.freshness || coverage.freshness }
      : null,
    meta: result.meta,
    errors: [],
  };
}

/**
 * Source line metadata for UI (EN/AR keys resolved in component).
 * @param {UaeDailyHistoryMeta|null} meta
 * @returns {{ provider: string, aggregation: string, peg: string }}
 */
export function getDailySourceAttribution(meta) {
  return {
    provider: meta?.provider || PROVIDER,
    aggregation: meta?.aggregation || AGGREGATION,
    peg: String(CONSTANTS.AED_PEG),
  };
}

/**
 * Expose canonical display check for tests.
 * @param {number} value
 * @returns {number|null}
 */
export { normalizeDisplayAed, UAE_HISTORY_KARATS };
