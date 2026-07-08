/**
 * lib/crypto-history.js — normalise a crypto price series into the shared history-record shape.
 *
 * Plumbing only (Phase 36) — NO UI, no live fetch. Its single job is to turn raw crypto points into
 * the exact `{ date, price, granularity, source, … }` records that `historical-data.js` already
 * consumes, so crypto series can flow through the existing `toChartData` / `filterByRange` pipeline
 * with **zero new charting code** when a correlation view is built (Phase 37). Gold is untouched.
 *
 * A raw point is `{ date: 'YYYY-MM-DD' | 'YYYY-MM' | epoch-ms | Date, price|close|value: number }`.
 */

import { getCryptoAsset } from '../config/crypto-assets.js';

/** Coerce a raw crypto point's date to the ISO string the history pipeline expects. */
function toIsoKey(date) {
  if (date instanceof Date) {
    return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : null;
  }
  if (typeof date === 'number') {
    const d = new Date(date);
    return Number.isFinite(d.getTime()) ? d.toISOString().slice(0, 10) : null;
  }
  if (typeof date === 'string') {
    // Accept YYYY-MM and YYYY-MM-DD directly; otherwise try to parse.
    if (/^\d{4}-\d{2}(-\d{2})?$/.test(date)) return date;
    const d = new Date(date);
    return Number.isFinite(d.getTime()) ? d.toISOString().slice(0, 10) : null;
  }
  return null;
}

/**
 * Normalise one raw crypto point into a history record, or `null` if it's unusable.
 * @param {object} raw
 * @param {string} assetKey  'btc' | 'eth'
 * @returns {{ date: string, price: number, granularity: 'daily'|'monthly', source: string, asset: string } | null}
 */
export function normalizeCryptoPoint(raw, assetKey) {
  if (!raw || !getCryptoAsset(assetKey)) return null;
  const date = toIsoKey(raw.date ?? raw.time ?? raw.t);
  const price = Number(raw.price ?? raw.close ?? raw.value);
  if (!date || !Number.isFinite(price) || price <= 0) return null;
  return {
    date,
    price,
    granularity: date.length === 7 ? 'monthly' : 'daily',
    source: raw.source || 'crypto-feed',
    asset: assetKey,
  };
}

/**
 * Normalise a raw crypto series into ascending, de-duplicated history records.
 * @param {object[]} points
 * @param {string} assetKey
 * @returns {Array<{date:string, price:number, granularity:string, source:string, asset:string}>}
 */
export function normalizeCryptoHistory(points, assetKey) {
  const byDate = new Map();
  for (const p of points || []) {
    const rec = normalizeCryptoPoint(p, assetKey);
    if (rec) byDate.set(rec.date, rec); // last write wins per date
  }
  return [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}
