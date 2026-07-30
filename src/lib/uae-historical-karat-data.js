/**
 * UAE historical karat reference data — pure transforms from unified XAU/USD history.
 *
 * Converts spot-linked USD/troy-oz records into AED/gram per karat using canonical
 * constants and purity factors only (no duplicated peg or troy-ounce values).
 */

import { CONSTANTS } from '../config/constants.js';
import { KARATS } from '../config/karats.js';
import { usdPerGram } from './price-calculator.js';
import { loadUaeDailyKaratHistory } from './uae-historical-source.js';
import {
  FRESHNESS_WEEKDAY_MAX_DAYS,
  FRESHNESS_WEEKEND_MAX_DAYS,
  isWeekendReference,
} from './gold-api-daily-history-contract.js';

/** Homepage chart karat series (24K baseline). */
export const UAE_HISTORY_KARATS = ['24', '22', '21', '18'];

/** UI range keys → day windows (anchored on latest valid record). */
export const UAE_HISTORY_RANGES = Object.freeze({
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '12M': 365,
});

/** @deprecated Use gold-api-daily-history-contract freshness for daily file */
export const HIST_COVERAGE_FRESH_DAYS = FRESHNESS_WEEKDAY_MAX_DAYS;
export const HIST_COVERAGE_DELAYED_DAYS = FRESHNESS_WEEKEND_MAX_DAYS;

const PURITY_BY_CODE = Object.fromEntries(KARATS.map((k) => [k.code, k.purity]));

/**
 * @typedef {object} UaeKaratHistoryPoint
 * @property {string} date - YYYY-MM-DD
 * @property {number} spotUsdOz
 * @property {string} source
 * @property {string} [upstreamSource]
 * @property {'daily'|'monthly'} granularity
 * @property {string} freshnessState
 * @property {boolean} derived
 * @property {Record<string, number>} values - AED/gram per karat code (full precision)
 * @property {Record<string, number>} displayValues - AED/gram per karat (canonical display)
 */

/**
 * Canonical display normalization — single source for chart, table, tooltip, summary, CSV.
 * @param {number} value
 * @returns {number|null}
 */
export function normalizeDisplayAed(value) {
  if (!Number.isFinite(value) || value <= 0) return null;
  return Math.round(value * 100) / 100;
}

/**
 * Normalize a raw history record date to YYYY-MM-DD.
 * @param {string|Date} value
 * @returns {string}
 */
export function normalizeHistoryDateKey(value) {
  if (!value) return '';
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}$/.test(trimmed)) return `${trimmed}-01`;
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : '';
}

/**
 * Compute AED/gram for a karat from XAU/USD spot (troy oz).
 * @param {number} spotUsdOz
 * @param {string} karatCode
 * @returns {number}
 */
export function aedPerGramFromSpot(spotUsdOz, karatCode) {
  const purity = PURITY_BY_CODE[karatCode];
  if (!purity || !(spotUsdOz > 0)) return 0;
  const usdGram = usdPerGram(spotUsdOz, purity);
  if (!(usdGram > 0)) return 0;
  return usdGram * CONSTANTS.AED_PEG;
}

/**
 * Build display value map for all karats on a point.
 * @param {Record<string, number>} values
 * @returns {Record<string, number>}
 */
export function buildDisplayValues(values) {
  const out = {};
  for (const code of UAE_HISTORY_KARATS) {
    const norm = normalizeDisplayAed(values[code]);
    if (norm != null) out[code] = norm;
  }
  return out;
}

/**
 * Validate and dedupe raw unified history rows into karat-ready points.
 * @param {Array<{ date: string|Date, price: number, source?: string, granularity?: string, derived?: boolean, freshnessState?: string }>} records
 * @returns {UaeKaratHistoryPoint[]}
 */
export function buildUaeKaratHistoryPoints(records) {
  if (!Array.isArray(records) || !records.length) return [];

  const byDate = new Map();

  for (const raw of records) {
    const spot = Number(raw.price ?? raw.spot);
    if (!Number.isFinite(spot) || spot <= 0) continue;

    const date = normalizeHistoryDateKey(raw.date);
    if (!date) continue;

    const values = {};
    let valid = false;
    for (const code of UAE_HISTORY_KARATS) {
      const aed = aedPerGramFromSpot(spot, code);
      if (aed > 0) {
        values[code] = aed;
        valid = true;
      }
    }
    if (!valid) continue;

    const point = {
      date,
      spotUsdOz: spot,
      source: raw.source || 'derived',
      upstreamSource: raw.upstreamSource,
      granularity:
        raw.granularity === 'monthly' || (date.endsWith('-01') && String(raw.date).length === 7)
          ? 'monthly'
          : raw.granularity || 'daily',
      freshnessState: raw.freshnessState || 'historical',
      derived: Boolean(raw.derived),
      values,
      displayValues: buildDisplayValues(values),
    };

    // Later rows win for duplicate dates (local snapshot > reference > baseline).
    byDate.set(date, point);
  }

  return [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/**
 * Calendar days between two YYYY-MM-DD dates (inclusive start, exclusive of negative).
 * @param {string} startDate
 * @param {string} endDate
 * @returns {number}
 */
export function daysBetweenDates(startDate, endDate) {
  const ms = new Date(`${endDate}T00:00:00Z`) - new Date(`${startDate}T00:00:00Z`);
  return Math.round(ms / 86400000);
}

/**
 * Classify how current the historical coverage end date is.
 * @param {string|null} latestDate - YYYY-MM-DD
 * @param {string} [referenceDate] - YYYY-MM-DD audit date
 * @returns {'current'|'delayed'|'stale'|'unavailable'}
 */
export function classifyCoverageFreshness(latestDate, referenceDate) {
  if (!latestDate) return 'unavailable';
  const ref = referenceDate || new Date().toISOString().slice(0, 10);
  const age = daysBetweenDates(latestDate, ref);
  const limit = isWeekendReference(ref) ? FRESHNESS_WEEKEND_MAX_DAYS : FRESHNESS_WEEKDAY_MAX_DAYS;
  if (age <= limit) return 'current';
  return 'stale';
}

/**
 * Coverage metadata for the full dataset or a filtered slice.
 * @param {UaeKaratHistoryPoint[]} points
 * @param {string} [referenceDate]
 * @returns {object|null}
 */
export function computeCoverageMeta(points, referenceDate) {
  if (!points.length) return null;
  const start = points[0].date;
  const end = points[points.length - 1].date;
  const ref = referenceDate || new Date().toISOString().slice(0, 10);
  const ageDays = daysBetweenDates(end, ref);
  const freshness = classifyCoverageFreshness(end, ref);
  return { start, end, ageDays, freshness, referenceDate: ref };
}

/**
 * Filter points by range anchored on the latest record date.
 * @param {UaeKaratHistoryPoint[]} points
 * @param {'1M'|'3M'|'6M'|'12M'} rangeKey
 * @returns {UaeKaratHistoryPoint[]}
 */
export function filterUaeHistoryByRange(points, rangeKey) {
  if (!points.length) return [];
  const days = UAE_HISTORY_RANGES[rangeKey];
  if (!days) return points;

  const latest = points[points.length - 1].date;
  const latestMs = new Date(`${latest}T00:00:00Z`).getTime();
  const cutoffMs = latestMs - days * 86400000;

  return points.filter((p) => new Date(`${p.date}T00:00:00Z`).getTime() >= cutoffMs);
}

/**
 * Range-specific resolution descriptor (semantic key — translate in UI).
 * @param {UaeKaratHistoryPoint[]} points - filtered range points
 * @returns {{ key: string, dailyCount: number, monthlyCount: number, hasCached: boolean, sources: string[] }}
 */
export function describeRangeResolution(points) {
  if (!points.length) {
    return { key: 'unavailable', dailyCount: 0, monthlyCount: 0, hasCached: false, sources: [] };
  }

  let dailyCount = 0;
  let monthlyCount = 0;
  const sources = new Set();

  for (const p of points) {
    if (p.granularity === 'monthly') monthlyCount++;
    else dailyCount++;
    sources.add(p.source);
  }

  let key = 'daily_average_reference';
  if (monthlyCount > 0 && dailyCount > 0) {
    key = 'mixed_daily_monthly';
  } else if (monthlyCount > 0 && dailyCount === 0) {
    key = 'monthly_baseline';
  }

  return {
    key,
    dailyCount,
    monthlyCount,
    hasCached: false,
    sources: [...sources],
  };
}

/**
 * Period summary for the 24K reference series (uses canonical display values).
 * @param {UaeKaratHistoryPoint[]} points
 * @returns {object|null}
 */
export function computeUaeHistorySummary(points) {
  if (!points.length) return null;

  const series24 = points
    .map((p) => p.displayValues?.['24'] ?? normalizeDisplayAed(p.values['24']))
    .filter((v) => v != null);
  if (!series24.length) return null;

  const open = series24[0];
  const close = series24[series24.length - 1];
  const high = Math.max(...series24);
  const low = Math.min(...series24);
  const change = close - open;
  const pctChange = open > 0 ? (change / open) * 100 : 0;

  return {
    latest24: close,
    open24: open,
    high24: high,
    low24: low,
    absoluteChange: Math.round(change * 100) / 100,
    percentageChange: Math.round(pctChange * 10) / 10,
    points: points.length,
  };
}

/**
 * Lightweight Charts series data for one karat (canonical display values).
 * @param {UaeKaratHistoryPoint[]} points
 * @param {string} karatCode
 * @returns {Array<{ time: string, value: number }>}
 */
export function toChartSeriesData(points, karatCode) {
  return points
    .map((p) => {
      const value = p.displayValues?.[karatCode] ?? normalizeDisplayAed(p.values[karatCode]);
      if (value == null) return null;
      return { time: p.date, value };
    })
    .filter(Boolean);
}

/**
 * Table rows (newest first) — display values match chart exactly.
 * @param {UaeKaratHistoryPoint[]} points
 * @returns {Array<{ date: string, values: Record<string, number> }>}
 */
export function toTableRows(points) {
  return [...points].reverse().map((p) => ({
    date: p.date,
    values: { ...(p.displayValues || buildDisplayValues(p.values)) },
  }));
}

/**
 * Build a screen-reader summary for visible series.
 * @param {UaeKaratHistoryPoint[]} points
 * @param {'1M'|'3M'|'6M'|'12M'} rangeKey
 * @param {string[]} visibleKarats
 * @param {string} lang
 * @returns {string}
 */
export function buildChartSrSummary(points, rangeKey, visibleKarats, lang = 'en') {
  if (!points.length) {
    return lang === 'ar' ? 'لا تتوفر بيانات تاريخية.' : 'No historical data available.';
  }
  const summary = computeUaeHistorySummary(points);
  if (!summary) {
    return lang === 'ar' ? 'لا تتوفر بيانات تاريخية.' : 'No historical data available.';
  }

  const start = points[0].date;
  const end = points[points.length - 1].date;
  const karatList = visibleKarats.join(', ');
  const latest = formatAedPerGramWithUnit(summary.latest24, lang);

  if (lang === 'ar') {
    return `مخطط مرجعي لأسعار الذهب في الإمارات للفترة ${rangeKey} من ${start} إلى ${end}. آخر سعر مرجعي تاريخي لعيار 24: ${latest}. السلاسل المرئية: ${karatList}.`;
  }
  return `UAE reference gold chart for ${rangeKey} from ${start} to ${end}. Latest historical 24K reference: ${latest}. Visible series: ${karatList}.`;
}

/**
 * Load committed gold-api.com daily history and transform to karat points.
 * @returns {Promise<{ points: UaeKaratHistoryPoint[], rawCount: number, coverage: object|null, meta: object|null, errors: string[] }>}
 */
export async function loadUaeKaratHistory() {
  const { points, coverage, meta, errors } = await loadUaeDailyKaratHistory();
  return { points, rawCount: points.length, coverage, meta, errors };
}

/**
 * Format AED/gram for display (2 decimal places).
 * @param {number} value
 * @returns {string}
 */
export function formatAedPerGram(value) {
  const norm = normalizeDisplayAed(value);
  if (norm == null) return '—';
  return norm.toFixed(2);
}

/**
 * Format AED/gram with unit suffix for UI surfaces.
 * @param {number} value
 * @param {'en'|'ar'} [lang]
 * @returns {string}
 */
export function formatAedPerGramWithUnit(value, lang = 'en') {
  const formatted = formatAedPerGram(value);
  if (formatted === '—') return formatted;
  return lang === 'ar' ? `${formatted} درهم/غ` : `${formatted} AED/g`;
}

/**
 * Find point by chart time key.
 * @param {UaeKaratHistoryPoint[]} points
 * @param {string} dateKey
 * @returns {UaeKaratHistoryPoint|undefined}
 */
export function findPointByDate(points, dateKey) {
  return points.find((p) => p.date === dateKey);
}
