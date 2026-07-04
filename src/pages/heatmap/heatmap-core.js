/**
 * World heatmap — pure, framework-free core logic.
 *
 * No DOM access so it can be unit-tested in isolation (see
 * `tests/heatmap-core.test.js`). The page orchestrator (`src/pages/heatmap.js`)
 * wires it to live price/FX data and the generated SVG world map
 * (`world-map-data.js`).
 *
 * Honesty note (same contract as compare): the spot-linked gold value per gram
 * is globally identical in USD — the map colors countries by the all-in
 * **retail estimate** (gold value + median making charge + VAT), surfaced as a
 * reference figure, not a retail quote or financial advice.
 *
 * Color: one-hue ordinal gold ramps (5 buckets), one per theme, validated for
 * monotone lightness, visible step gaps and light-end contrast against the
 * site's light (#fdfbf5) and dark (#0c0e14) surfaces. Higher estimate = more
 * ink in light mode, brighter gold in dark mode (anchor flips with the theme).
 */

import { buildComparisonRows, annotatePctVsUae, COMPARE_KARATS } from '../compare/compare-core.js';

export const HEATMAP_BUCKETS = 5;
export const HEATMAP_KARATS = COMPARE_KARATS;

/** Low→high bucket fills per theme (index 0 = cheapest bucket). */
export const HEATMAP_RAMPS = {
  light: ['#c08a2b', '#a1731e', '#835d15', '#66480e', '#4a3309'],
  dark: ['#75561d', '#946f26', '#b48d35', '#d4af53', '#f2d385'],
};

/**
 * Build one heatmap row per country: the compare rows (all-in retail estimate
 * per gram) annotated with % vs UAE, for the full tracked-country list.
 *
 * USD is seeded with its identity rate (1 USD = 1 USD) so the US stays on the
 * map even when the FX feed is down — the identity is definitional, not a
 * guess. A live USD entry from the feed still wins if present.
 *
 * @param {object} args  Same shape as {@link buildComparisonRows}.
 * @returns {Array<object>}
 */
export function buildHeatmapRows(args) {
  const rates = { USD: 1, ...(args.rates || {}) };
  return annotatePctVsUae(buildComparisonRows({ ...args, rates }));
}

/**
 * Equal-interval bucket domain over the available retail estimates.
 * Returns `null` when fewer than two countries have data (no meaningful
 * scale exists — the page should render the "waiting for data" state).
 *
 * @param {Array<object>} rows  Rows from {@link buildHeatmapRows}.
 * @returns {{ min: number, max: number, thresholds: number[] } | null}
 */
export function computeDomain(rows) {
  const values = (rows || [])
    .map((r) => r.retailUsdPerGram)
    .filter((v) => typeof v === 'number' && Number.isFinite(v));
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (!(max > min)) return null;
  const step = (max - min) / HEATMAP_BUCKETS;
  const thresholds = [];
  for (let i = 1; i < HEATMAP_BUCKETS; i++) thresholds.push(min + step * i);
  return { min, max, thresholds };
}

/**
 * Bucket index (0 = cheapest … 4 = priciest) for a retail estimate, or `null`
 * when the value or domain is unavailable.
 *
 * @param {number|null} value
 * @param {{ min: number, max: number, thresholds: number[] } | null} domain
 * @returns {number|null}
 */
export function bucketFor(value, domain) {
  if (value == null || !Number.isFinite(value) || !domain) return null;
  let bucket = 0;
  for (const threshold of domain.thresholds) {
    if (value >= threshold) bucket += 1;
  }
  return Math.min(bucket, HEATMAP_BUCKETS - 1);
}

/**
 * Legend entries (low→high) for the current domain: value range plus the
 * bucket's fill for the active theme.
 *
 * @param {{ min: number, max: number, thresholds: number[] } | null} domain
 * @param {'light'|'dark'} theme
 * @returns {Array<{ from: number, to: number, color: string }>}
 */
export function legendStops(domain, theme = 'light') {
  if (!domain) return [];
  const ramp = HEATMAP_RAMPS[theme] || HEATMAP_RAMPS.light;
  const edges = [domain.min, ...domain.thresholds, domain.max];
  const stops = [];
  for (let i = 0; i < HEATMAP_BUCKETS; i++) {
    stops.push({ from: edges[i], to: edges[i + 1], color: ramp[i] });
  }
  return stops;
}

/**
 * Map country code → `{ bucket, row }` for every tracked country, so the page
 * can paint the SVG in one pass. Countries without data get `bucket: null`.
 *
 * @param {Array<object>} rows
 * @param {{ min: number, max: number, thresholds: number[] } | null} domain
 * @returns {Map<string, { bucket: number|null, row: object }>}
 */
export function fillIndex(rows, domain) {
  const index = new Map();
  for (const row of rows || []) {
    index.set(row.code, { bucket: bucketFor(row.retailUsdPerGram, domain), row });
  }
  return index;
}

/**
 * Parse the location hash into an active karat and optional selected country.
 * Accepts forms like `#k=22&c=eg`. Unknown values fall back to defaults.
 *
 * @param {string} hash  e.g. `location.hash`.
 * @param {Set<string>|Array<string>} validCodes
 * @returns {{ karat: string, selected: string|null }}
 */
export function parseHeatmapHash(hash, validCodes) {
  const valid = validCodes instanceof Set ? validCodes : new Set(validCodes || []);
  const params = new URLSearchParams(String(hash || '').replace(/^#/, ''));
  const karatParam = params.get('k');
  const karat = HEATMAP_KARATS.includes(karatParam) ? karatParam : '22';
  const rawSelected = String(params.get('c') || '')
    .trim()
    .toUpperCase();
  const selected = valid.has(rawSelected) ? rawSelected : null;
  return { karat, selected };
}

/**
 * Serialise karat + selected country back into a hash string.
 *
 * @param {{ karat: string, selected?: string|null }} state
 * @returns {string}  e.g. `k=22&c=eg`.
 */
export function serializeHeatmapHash({ karat, selected } = {}) {
  const k = HEATMAP_KARATS.includes(karat) ? karat : '22';
  return selected ? `k=${k}&c=${String(selected).toLowerCase()}` : `k=${k}`;
}
