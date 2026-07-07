/**
 * lib/correlation.js — asset-generic correlation math over dated price records.
 *
 * Pure, deterministic, UI-free (Phase 37). Operates on the shared history-record shape
 * (`{ date, price }`) that both `historical-data.js` (gold) and `crypto-history.js` (BTC/ETH)
 * already emit, so a gold-vs-crypto correlation view can be computed with the existing pipeline —
 * no live fetch and no charting code here. Gold data is untouched.
 *
 * Correlation is a *descriptive* statistic only: it measures how two series co-moved over a window.
 * It is never a prediction, a causal claim, or an investment signal — the presentation layer
 * (`gold-crypto-correlation.js`) carries that framing to the user.
 */

/**
 * Align two dated series on their shared dates, returning parallel price arrays in date order.
 * Later records win on duplicate dates (matching the normalisers' last-write-wins rule).
 *
 * @param {Array<{date:string, price:number}>} recordsA
 * @param {Array<{date:string, price:number}>} recordsB
 * @returns {{ dates: string[], a: number[], b: number[] }}
 */
export function alignSeriesByDate(recordsA, recordsB) {
  const mapA = toPriceMap(recordsA);
  const mapB = toPriceMap(recordsB);
  const dates = [...mapA.keys()]
    .filter((d) => mapB.has(d))
    .sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
  return {
    dates,
    a: dates.map((d) => mapA.get(d)),
    b: dates.map((d) => mapB.get(d)),
  };
}

/** Build a date→price map, dropping unusable points; last write wins per date. */
function toPriceMap(records) {
  const map = new Map();
  for (const r of records || []) {
    const date = typeof r?.date === 'string' ? r.date : null;
    const price = Number(r?.price);
    if (!date || !Number.isFinite(price) || price <= 0) continue;
    map.set(date, price);
  }
  return map;
}

/**
 * Pearson product-moment correlation coefficient of two equal-length numeric arrays.
 * Returns a value in [-1, 1], or `null` when it is undefined (fewer than 2 points, length
 * mismatch, or zero variance in either series — a flat line has no correlation).
 *
 * @param {number[]} xs
 * @param {number[]} ys
 * @returns {number|null}
 */
export function pearson(xs, ys) {
  if (!Array.isArray(xs) || !Array.isArray(ys)) return null;
  const n = xs.length;
  if (n < 2 || ys.length !== n) return null;

  const meanX = mean(xs);
  const meanY = mean(ys);
  let cov = 0;
  let varX = 0;
  let varY = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    cov += dx * dy;
    varX += dx * dx;
    varY += dy * dy;
  }
  if (varX === 0 || varY === 0) return null;
  const r = cov / Math.sqrt(varX * varY);
  // Clamp tiny floating-point overshoot so callers can rely on the [-1, 1] contract.
  return Math.max(-1, Math.min(1, r));
}

function mean(values) {
  let sum = 0;
  for (const v of values) sum += v;
  return sum / values.length;
}

/**
 * Rolling Pearson correlation over a sliding window of `window` aligned points.
 * Each entry anchors to the window's last date. Windows with undefined correlation
 * (e.g. a flat segment) are skipped rather than reported as 0.
 *
 * @param {string[]} dates   Shared, ascending dates (from {@link alignSeriesByDate}).
 * @param {number[]} a
 * @param {number[]} b
 * @param {number} window    Points per window (>= 2).
 * @returns {Array<{ date: string, coefficient: number }>}
 */
export function rollingCorrelation(dates, a, b, window) {
  const size = Math.floor(window);
  if (!Array.isArray(dates) || size < 2 || a.length !== dates.length || b.length !== dates.length) {
    return [];
  }
  const out = [];
  for (let end = size; end <= dates.length; end += 1) {
    const start = end - size;
    const r = pearson(a.slice(start, end), b.slice(start, end));
    if (r !== null) out.push({ date: dates[end - 1], coefficient: r });
  }
  return out;
}
