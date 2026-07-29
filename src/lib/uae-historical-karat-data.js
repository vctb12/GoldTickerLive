/**
 * UAE historical karat reference data — pure transforms from unified XAU/USD history.
 *
 * Converts spot-linked USD/troy-oz records into AED/gram per karat using canonical
 * constants and purity factors only (no duplicated peg or troy-ounce values).
 */

import { CONSTANTS } from '../config/constants.js';
import { KARATS } from '../config/karats.js';
import { usdPerGram } from './price-calculator.js';
import {
  getUnifiedHistory,
  describeHistoryResolution,
  ensureRemoteHistory,
} from '../lib/historical-data.js';

/** Homepage chart karat series (24K baseline). */
export const UAE_HISTORY_KARATS = ['24', '22', '21', '18'];

/** UI range keys → day windows (anchored on latest valid record). */
export const UAE_HISTORY_RANGES = Object.freeze({
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '12M': 365,
});

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
 * @property {Record<string, number>} values - AED/gram per karat code
 */

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
        raw.granularity === 'monthly' ||
        (date.endsWith('-01') && String(raw.date).length === 7)
          ? 'monthly'
          : raw.granularity || 'daily',
      freshnessState: raw.freshnessState || 'historical',
      derived: Boolean(raw.derived),
      values,
    };

    // Later rows win for duplicate dates (local snapshot > reference > baseline).
    byDate.set(date, point);
  }

  return [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
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
 * Period summary for the 24K reference series.
 * @param {UaeKaratHistoryPoint[]} points
 * @returns {object|null}
 */
export function computeUaeHistorySummary(points) {
  if (!points.length) return null;

  const series24 = points.map((p) => p.values['24']).filter((v) => v > 0);
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
    absoluteChange: change,
    percentageChange: pctChange,
    points: points.length,
  };
}

/**
 * Lightweight Charts series data for one karat.
 * @param {UaeKaratHistoryPoint[]} points
 * @param {string} karatCode
 * @returns {Array<{ time: string, value: number }>}
 */
export function toChartSeriesData(points, karatCode) {
  return points
    .map((p) => {
      const value = p.values[karatCode];
      if (!(value > 0)) return null;
      return { time: p.date, value: Number(value.toFixed(2)) };
    })
    .filter(Boolean);
}

/**
 * Table rows (newest first) matching chart values exactly.
 * @param {UaeKaratHistoryPoint[]} points
 * @returns {Array<{ date: string, values: Record<string, number> }>}
 */
export function toTableRows(points) {
  return [...points]
    .reverse()
    .map((p) => ({
      date: p.date,
      values: { ...p.values },
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

  if (lang === 'ar') {
    return `مخطط مرجعي لأسعار الذهب في الإمارات للفترة ${rangeKey} من ${start} إلى ${end}. آخر سعر مرجعي لعيار 24: ${summary.latest24.toFixed(2)} درهم للغرام. السلاسل المرئية: ${karatList}.`;
  }
  return `UAE reference gold chart for ${rangeKey} from ${start} to ${end}. Latest 24K reference: AED ${summary.latest24.toFixed(2)}/g. Visible series: ${karatList}.`;
}

/**
 * Load unified history and transform to karat points.
 * @param {Array} [localSnapshots]
 * @returns {Promise<{ points: UaeKaratHistoryPoint[], resolution: object, rawCount: number }>}
 */
export async function loadUaeKaratHistory(localSnapshots = []) {
  await ensureRemoteHistory?.().catch(() => {});
  const unified = getUnifiedHistory(localSnapshots);
  const points = buildUaeKaratHistoryPoints(unified);
  const resolution = describeHistoryResolution(unified);
  return { points, resolution, rawCount: unified.length };
}

/**
 * Format AED/gram for display (2 decimal places).
 * @param {number} value
 * @returns {string}
 */
export function formatAedPerGram(value) {
  if (!Number.isFinite(value)) return '—';
  return value.toFixed(2);
}
