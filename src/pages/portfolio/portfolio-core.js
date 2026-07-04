/**
 * Portfolio tracker — pure, framework-free core logic.
 *
 * No DOM or storage access so it can be unit-tested in isolation (see
 * `tests/portfolio-core.test.js`). The page orchestrator
 * (`src/pages/portfolio.js`) wires it to localStorage, live price/FX data and
 * the shared shell.
 *
 * Honesty contract (non-negotiable rule 1):
 *   • A holding's "current value" is a spot-linked **reference valuation** of
 *     its gold content (weight × karat purity × reference gram price). It is
 *     NOT a resale quote, a broker statement, or the market value of a
 *     finished jewellery piece — making charges are not recoverable at resale.
 *   • Cost basis stays in the currency it was entered in. Gain/loss is only
 *     computed against holdings whose cost currency matches the display
 *     currency — the engine never silently converts historic costs at today's
 *     FX rate, because that would fabricate a false profit figure.
 *
 * Storage schema (owned by the orchestrator, versioned):
 *   gtl_portfolio_v1 = { version: 1, currency: 'AED', holdings: [Holding] }
 *   Holding = { id, label, weightGrams, karat, purchaseDate('YYYY-MM-DD'),
 *               costTotal, costCurrency, createdAt }
 */

import { CONSTANTS, KARATS } from '../../config/index.js';

export const PORTFOLIO_STORAGE_KEY = 'gtl_portfolio_v1';
export const PORTFOLIO_VERSION = 1;
export const MAX_HOLDINGS = 100;

export const KARAT_CODES = KARATS.map((k) => k.code);

/** Purity fraction for a karat code, from the canonical karat table. */
export function purityFor(karatCode) {
  const karat = KARATS.find((k) => k.code === String(karatCode));
  return karat ? karat.purity : null;
}

/**
 * FX rate (1 USD → currency units). USD is identity, AED is always the fixed
 * peg, anything else comes from the live rates map. `null` when unavailable.
 *
 * @param {string} currency
 * @param {Record<string, number>} rates
 * @returns {number|null}
 */
export function fxForCurrency(currency, rates) {
  if (currency === 'USD') return 1;
  if (currency === 'AED') return CONSTANTS.AED_PEG;
  const rate = rates && rates[currency];
  return typeof rate === 'number' && rate > 0 ? rate : null;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validate + normalise a raw holding (from a form or an imported file).
 * Returns the clean holding, or `null` when the input is not salvageable.
 *
 * @param {object} raw
 * @param {{ now?: string }} [opts]  `now` = today's date (YYYY-MM-DD) for the
 *   future-date guard; injectable for tests.
 * @returns {object|null}
 */
export function sanitizeHolding(raw, { now } = {}) {
  if (!raw || typeof raw !== 'object') return null;

  const weightGrams = Number(raw.weightGrams);
  if (!Number.isFinite(weightGrams) || weightGrams <= 0 || weightGrams > 1e6) return null;

  const karat = String(raw.karat || '');
  if (!KARAT_CODES.includes(karat)) return null;

  const purchaseDate = String(raw.purchaseDate || '');
  if (!DATE_RE.test(purchaseDate)) return null;
  if (now && purchaseDate > now) return null;

  const costTotal = Number(raw.costTotal);
  if (!Number.isFinite(costTotal) || costTotal < 0 || costTotal > 1e12) return null;

  const costCurrency = String(raw.costCurrency || '').toUpperCase();
  if (!/^[A-Z]{3}$/.test(costCurrency)) return null;

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id.slice(0, 64) : null,
    label: String(raw.label || '')
      .trim()
      .slice(0, 80),
    weightGrams: Math.round(weightGrams * 1000) / 1000,
    karat,
    purchaseDate,
    costTotal: Math.round(costTotal * 100) / 100,
    costCurrency,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : null,
  };
}

/**
 * Parse the persisted (or imported) portfolio envelope. Tolerates junk —
 * malformed holdings are dropped, the count is capped, and an unknown payload
 * yields an empty portfolio rather than a crash.
 *
 * @param {string|object|null} payload  JSON string or already-parsed object.
 * @param {{ now?: string }} [opts]
 * @returns {{ version: number, currency: string, holdings: Array<object> }}
 */
export function parsePortfolio(payload, opts = {}) {
  let data = payload;
  if (typeof payload === 'string') {
    try {
      data = JSON.parse(payload);
    } catch {
      data = null;
    }
  }
  const currencyRaw = data && typeof data.currency === 'string' ? data.currency.toUpperCase() : '';
  const currency = /^[A-Z]{3}$/.test(currencyRaw) ? currencyRaw : 'AED';
  const rawHoldings = data && Array.isArray(data.holdings) ? data.holdings : [];
  const holdings = [];
  for (const raw of rawHoldings) {
    const clean = sanitizeHolding(raw, opts);
    if (clean) holdings.push(clean);
    if (holdings.length >= MAX_HOLDINGS) break;
  }
  return { version: PORTFOLIO_VERSION, currency, holdings };
}

/** Serialise the portfolio envelope for localStorage / export. */
export function serializePortfolio({ currency, holdings } = {}) {
  return JSON.stringify({
    version: PORTFOLIO_VERSION,
    currency: currency || 'AED',
    holdings: holdings || [],
  });
}

/**
 * Reference valuation of one holding's gold content.
 *
 * @param {object} holding  Sanitised holding.
 * @param {number} spotUsdPerOz
 * @param {Record<string, number>} rates
 * @param {string} displayCurrency
 * @returns {{ currentUsd: number|null, currentDisplay: number|null,
 *             currentInCost: number|null, gainValue: number|null,
 *             gainPct: number|null, fineGrams: number }}
 */
export function valueHolding(holding, spotUsdPerOz, rates, displayCurrency) {
  const purity = purityFor(holding.karat) || 0;
  const fineGrams = holding.weightGrams * purity;
  if (!spotUsdPerOz || !purity) {
    return {
      currentUsd: null,
      currentDisplay: null,
      currentInCost: null,
      gainValue: null,
      gainPct: null,
      fineGrams,
    };
  }
  const usdPerGramPure = spotUsdPerOz / CONSTANTS.TROY_OZ_GRAMS;
  const currentUsd = fineGrams * usdPerGramPure;

  const displayFx = fxForCurrency(displayCurrency, rates);
  const currentDisplay = displayFx != null ? currentUsd * displayFx : null;

  const costFx = fxForCurrency(holding.costCurrency, rates);
  const currentInCost = costFx != null ? currentUsd * costFx : null;

  // Gain/loss lives in the holding's own cost currency — never a converted
  // historic cost. Zero-cost holdings (gifts, inheritance) have no gain %.
  let gainValue = null;
  let gainPct = null;
  if (currentInCost != null) {
    gainValue = currentInCost - holding.costTotal;
    gainPct = holding.costTotal > 0 ? (gainValue / holding.costTotal) * 100 : null;
  }
  return { currentUsd, currentDisplay, currentInCost, gainValue, gainPct, fineGrams };
}

/**
 * Portfolio-level summary. Gain totals are only produced when every holding's
 * cost currency equals the display currency (see the honesty contract above);
 * otherwise `gain` is null and the UI explains why.
 *
 * @param {Array<object>} holdings
 * @param {number} spotUsdPerOz
 * @param {Record<string, number>} rates
 * @param {string} displayCurrency
 * @returns {object}
 */
export function summarizePortfolio(holdings, spotUsdPerOz, rates, displayCurrency) {
  const valued = (holdings || []).map((holding) => ({
    holding,
    ...valueHolding(holding, spotUsdPerOz, rates, displayCurrency),
  }));

  let totalWeightGrams = 0;
  let totalFineGrams = 0;
  let currentUsd = 0;
  let currentUsdComplete = valued.length > 0;
  let hasMissingCost = false;
  const costByCurrency = {};
  for (const entry of valued) {
    totalWeightGrams += entry.holding.weightGrams;
    totalFineGrams += entry.fineGrams;
    if (entry.currentUsd != null) currentUsd += entry.currentUsd;
    else currentUsdComplete = false;
    if (entry.holding.costTotal <= 0) hasMissingCost = true;
    const cur = entry.holding.costCurrency;
    costByCurrency[cur] = (costByCurrency[cur] || 0) + entry.holding.costTotal;
  }

  const displayFx = fxForCurrency(displayCurrency, rates);
  const currentDisplay =
    currentUsdComplete && displayFx != null && valued.length ? currentUsd * displayFx : null;

  const costCurrencies = Object.keys(costByCurrency);
  let gain = null;
  // A portfolio-level gain figure is only honest when the cost basis is
  // complete: every holding priced, all in the display currency. A partial
  // cost basis (e.g. one gifted piece at zero cost) would fabricate a profit.
  if (
    currentDisplay != null &&
    !hasMissingCost &&
    costCurrencies.length === 1 &&
    costCurrencies[0] === displayCurrency
  ) {
    const totalCost = costByCurrency[displayCurrency];
    const value = currentDisplay - totalCost;
    gain = {
      value,
      pct: totalCost > 0 ? (value / totalCost) * 100 : null,
    };
  }

  return {
    valued,
    count: valued.length,
    totalWeightGrams: Math.round(totalWeightGrams * 1000) / 1000,
    totalFineGrams: Math.round(totalFineGrams * 1000) / 1000,
    currentUsd: currentUsdComplete && valued.length ? currentUsd : null,
    currentDisplay,
    costByCurrency,
    mixedCostCurrencies: costCurrencies.length > 1,
    hasMissingCost,
    gain,
  };
}

/**
 * Portfolio reference value over time, replayed against the daily snapshots
 * this browser has saved (`cache.saveHistorySnapshot` — date, XAU/USD price,
 * FX rates). Only holdings already purchased on a snapshot's date count, so
 * the series honestly reflects what the holdings were worth *then*, not a
 * back-projection of today's portfolio.
 *
 * @param {Array<object>} holdings
 * @param {Array<{ date: string, price: number, rates?: object }>} history
 * @param {string} displayCurrency
 * @returns {Array<{ date: string, value: number }>}  Empty when under 2 points.
 */
export function computeTimeline(holdings, history, displayCurrency) {
  if (!holdings || !holdings.length) return [];
  const points = [];
  for (const snap of history || []) {
    if (!snap || typeof snap.date !== 'string' || !DATE_RE.test(snap.date)) continue;
    if (typeof snap.price !== 'number' || snap.price <= 0) continue;
    const fx = fxForCurrency(displayCurrency, snap.rates || {});
    if (fx == null) continue;
    let usd = 0;
    let counted = 0;
    for (const holding of holdings) {
      if (holding.purchaseDate > snap.date) continue;
      const purity = purityFor(holding.karat) || 0;
      usd += holding.weightGrams * purity * (snap.price / CONSTANTS.TROY_OZ_GRAMS);
      counted += 1;
    }
    if (!counted) continue;
    points.push({ date: snap.date, value: usd * fx });
  }
  points.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  return points.length >= 2 ? points : [];
}

const CSV_HEADER = [
  'label',
  'weight_grams',
  'karat',
  'purchase_date',
  'cost_total',
  'cost_currency',
  'current_reference_value',
  'value_currency',
];

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * CSV export of valued holdings. The value column is explicitly labelled a
 * reference value; the header row is stable for spreadsheet users.
 *
 * @param {Array<object>} valued  Entries from {@link summarizePortfolio}.valued
 * @param {string} displayCurrency
 * @returns {string}
 */
export function holdingsToCsv(valued, displayCurrency) {
  const lines = [CSV_HEADER.join(',')];
  for (const entry of valued || []) {
    const h = entry.holding;
    lines.push(
      [
        csvCell(h.label),
        h.weightGrams,
        `${h.karat}K`,
        h.purchaseDate,
        h.costTotal,
        h.costCurrency,
        entry.currentDisplay != null ? Math.round(entry.currentDisplay * 100) / 100 : '',
        displayCurrency,
      ].join(',')
    );
  }
  return lines.join('\n');
}
