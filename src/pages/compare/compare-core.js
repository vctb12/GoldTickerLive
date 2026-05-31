/**
 * Compare-Countries — pure, framework-free core logic.
 *
 * These helpers contain no DOM access so they can be unit-tested in isolation
 * (see `tests/compare-core.test.js`). The page orchestrator (`src/pages/compare.js`)
 * wires them to live price/FX data and renders the result.
 *
 * Honesty note (mirrors the country Market Intelligence Panel): the spot-linked
 * gold *value* per gram is globally identical in USD — it only differs between
 * countries once local VAT and typical making charges are applied. The
 * comparison therefore keys its sort, colour-coding and "cheapest" callout off
 * an all-in **retail estimate** (gold value + median making charge + VAT), which
 * is explicitly surfaced as a reference figure, not financial advice.
 */

import { CONSTANTS } from '../../config/index.js';

export const DEFAULT_COMPARE_CODES = ['AE', 'SA', 'KW', 'QA'];
export const MAX_COMPARE = 6;
export const COMPARE_KARATS = ['24', '22', '21', '18'];

/**
 * Karat purity fraction for a karat code (e.g. '22' → 22/24).
 * @param {string} karatCode
 * @returns {number}
 */
export function karatPurity(karatCode) {
  const n = Number(karatCode);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n / 24;
}

/**
 * Resolve the FX rate (1 USD → local units) for a country, honouring the fixed
 * AED peg. Returns `null` when no rate is available for a non-pegged currency.
 *
 * @param {{ currency: string }} country
 * @param {Record<string, number>} rates
 * @returns {number|null}
 */
export function fxRateFor(country, rates) {
  if (!country) return null;
  if (country.currency === 'AED') return CONSTANTS.AED_PEG;
  const rate = rates && rates[country.currency];
  return typeof rate === 'number' && rate > 0 ? rate : null;
}

/**
 * Build one comparison row per country for the selected karat.
 *
 * @param {object}   args
 * @param {number}   args.spotUsdPerOz  XAU/USD spot price (USD per troy ounce).
 * @param {Record<string, number>} args.rates  FX rates (currency → USD rate; AED excluded).
 * @param {Array<object>} args.countries  Country config records.
 * @param {string}   args.karat          Karat code ('24' | '22' | '21' | '18').
 * @param {(code: string) => object} args.getIntel  Resolver → { vatRate, makingChargeMin, makingChargeMax }.
 * @returns {Array<object>}  Comparison rows (see inline shape).
 */
export function buildComparisonRows({ spotUsdPerOz, rates, countries, karat, getIntel }) {
  const purity = karatPurity(karat);
  const usdPerGram = spotUsdPerOz && purity ? (spotUsdPerOz / CONSTANTS.TROY_OZ_GRAMS) * purity : 0;

  return (countries || []).map((country) => {
    const intel = (getIntel && getIntel(country.code)) || {};
    const vatRate = typeof intel.vatRate === 'number' ? intel.vatRate : 0;
    const makingMin = typeof intel.makingChargeMin === 'number' ? intel.makingChargeMin : 0;
    const makingMax = typeof intel.makingChargeMax === 'number' ? intel.makingChargeMax : 0;
    const makingMid = (makingMin + makingMax) / 2;
    const fxRate = fxRateFor(country, rates);
    const available = Boolean(usdPerGram) && fxRate != null;

    const retailUsdPerGram = available ? usdPerGram * (1 + makingMid) * (1 + vatRate) : null;

    return {
      code: country.code,
      slug: country.slug,
      nameEn: country.nameEn,
      nameAr: country.nameAr,
      flag: country.flag || '',
      currency: country.currency,
      decimals: country.decimals ?? 2,
      fixedPeg: Boolean(country.fixedPeg) || country.currency === 'AED',
      group: country.group || '',
      fxRate,
      vatRate,
      makingMin,
      makingMax,
      makingMid,
      spotUsdPerGram: usdPerGram || null,
      spotLocalPerGram: available ? usdPerGram * fxRate : null,
      retailUsdPerGram,
      retailLocalPerGram: available ? retailUsdPerGram * fxRate : null,
      available,
    };
  });
}

/**
 * Attach `pctVsUae` (percentage difference of the all-in retail estimate vs the
 * UAE row) to each row. Mutates and returns the same array for convenience.
 *
 * @param {Array<object>} rows  Rows from {@link buildComparisonRows}.
 * @returns {Array<object>}
 */
export function annotatePctVsUae(rows) {
  const ref = (rows || []).find((r) => r.code === 'AE' && r.retailUsdPerGram);
  const refValue = ref ? ref.retailUsdPerGram : null;
  for (const row of rows || []) {
    if (refValue && row.retailUsdPerGram) {
      row.pctVsUae = ((row.retailUsdPerGram - refValue) / refValue) * 100;
    } else {
      row.pctVsUae = null;
    }
  }
  return rows;
}

const SORT_ACCESSORS = {
  name: (r) => (r.nameEn || '').toLowerCase(),
  currency: (r) => (r.currency || '').toLowerCase(),
  spotLocal: (r) => r.spotLocalPerGram,
  spotUsd: (r) => r.spotUsdPerGram,
  retailUsd: (r) => r.retailUsdPerGram,
  vat: (r) => r.vatRate,
  making: (r) => r.makingMid,
  pctVsUae: (r) => r.pctVsUae,
};

/**
 * Stable sort of comparison rows by a known column key and direction. Rows with
 * `null`/unavailable values for the active key always sink to the bottom,
 * regardless of direction, so the table never leads with empty cells.
 *
 * @param {Array<object>} rows
 * @param {string} key  One of the keys in {@link SORT_ACCESSORS}.
 * @param {'asc'|'desc'} dir
 * @returns {Array<object>}  A new sorted array.
 */
export function sortRows(rows, key, dir = 'asc') {
  const accessor = SORT_ACCESSORS[key] || SORT_ACCESSORS.retailUsd;
  const factor = dir === 'desc' ? -1 : 1;
  return [...(rows || [])]
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const va = accessor(a.row);
      const vb = accessor(b.row);
      const aMissing = va == null || va === '' || Number.isNaN(va);
      const bMissing = vb == null || vb === '' || Number.isNaN(vb);
      if (aMissing && bMissing) return a.index - b.index;
      if (aMissing) return 1;
      if (bMissing) return -1;
      if (typeof va === 'string' || typeof vb === 'string') {
        const cmp = String(va).localeCompare(String(vb));
        return cmp !== 0 ? cmp * factor : a.index - b.index;
      }
      if (va === vb) return a.index - b.index;
      return (va < vb ? -1 : 1) * factor;
    })
    .map((entry) => entry.row);
}

/**
 * Find the country with the lowest all-in retail estimate (USD/gram). Ignores
 * rows whose data is unavailable.
 *
 * @param {Array<object>} rows
 * @returns {object|null}
 */
export function computeCheapest(rows) {
  let best = null;
  for (const row of rows || []) {
    if (!row.available || row.retailUsdPerGram == null) continue;
    if (!best || row.retailUsdPerGram < best.retailUsdPerGram) best = row;
  }
  return best;
}

/**
 * Normalise, de-duplicate and clamp a list of country codes to the configured
 * maximum, preserving order and only keeping codes that exist in `validCodes`.
 *
 * @param {Array<string>} codes
 * @param {Set<string>|Array<string>} validCodes
 * @returns {Array<string>}
 */
export function sanitizeCodes(codes, validCodes) {
  const valid = validCodes instanceof Set ? validCodes : new Set(validCodes || []);
  const seen = new Set();
  const out = [];
  for (const raw of codes || []) {
    const code = String(raw || '')
      .trim()
      .toUpperCase();
    if (!code || seen.has(code)) continue;
    if (valid.size && !valid.has(code)) continue;
    seen.add(code);
    out.push(code);
    if (out.length >= MAX_COMPARE) break;
  }
  return out;
}

/**
 * Parse the location hash into selected country codes and an active karat.
 * Accepts forms like `#compare=ae,sa,kw&k=22`. Unknown/empty values fall back
 * to defaults.
 *
 * @param {string} hash  e.g. `location.hash`.
 * @param {Set<string>|Array<string>} validCodes
 * @returns {{ codes: string[], karat: string }}
 */
export function parseCompareHash(hash, validCodes) {
  const raw = String(hash || '').replace(/^#/, '');
  const params = new URLSearchParams(raw);
  const codesParam = params.get('compare');
  const codes = codesParam
    ? sanitizeCodes(codesParam.split(','), validCodes)
    : sanitizeCodes(DEFAULT_COMPARE_CODES, validCodes);
  const karatParam = params.get('k');
  const karat = COMPARE_KARATS.includes(karatParam) ? karatParam : '22';
  return {
    codes: codes.length ? codes : sanitizeCodes(DEFAULT_COMPARE_CODES, validCodes),
    karat,
  };
}

/**
 * Serialise selected country codes + karat back into a hash string suitable for
 * assignment to `location.hash`.
 *
 * @param {{ codes: string[], karat: string }} state
 * @returns {string}  e.g. `compare=ae,sa&k=22`.
 */
export function serializeCompareHash({ codes, karat } = {}) {
  const list = (codes || []).map((c) => String(c).toLowerCase()).join(',');
  const k = COMPARE_KARATS.includes(karat) ? karat : '22';
  return `compare=${list}&k=${k}`;
}
