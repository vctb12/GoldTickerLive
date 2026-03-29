/**
 * Historical Gold Price Data
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ARCHITECTURE:
 *   Layer 1 — BASELINE  : Monthly averages 2019–present (embedded in code)
 *                          Source: LBMA monthly average data / public domain records
 *                          Granularity: monthly  |  Unit: USD/troy oz
 *   Layer 2 — CACHED    : Daily snapshots from localStorage (user's session history)
 *                          Granularity: daily  |  Coverage: up to 90 days back
 *   Layer 3 — LIVE      : Current session chart ticks (90s resolution)
 *                          Granularity: ~90s  |  Coverage: last ~5 days
 *
 * All layers use the same normalised record schema:
 *   { date: 'YYYY-MM' | 'YYYY-MM-DD', price, granularity, source, derived }
 *
 * LIMITATIONS:
 *   - Monthly baseline is embedded (not fetched), so it needs code update for new months.
 *   - Daily resolution for periods > 90 days requires a paid/licensed API.
 *   - We clearly label derived vs. baseline data in exports.
 *
 * TO ADD FUTURE DAILY DATA:
 *   1. Add a daily data fetcher (e.g. stooq, metals-api, gold-api historic)
 *   2. Call mergeHistoricalLayers() with the new daily array
 *   3. The export/archive views automatically pick it up via getUnifiedHistory()
 */

// ─────────────────────────────────────────────────────────────────────────────
// MONTHLY BASELINE — XAU/USD average per month
// Source: LBMA PM fix monthly averages (public domain)
// ─────────────────────────────────────────────────────────────────────────────

export const MONTHLY_BASELINE = [
  // 2019
  { date: '2019-01', price: 1286 },
  { date: '2019-02', price: 1313 },
  { date: '2019-03', price: 1296 },
  { date: '2019-04', price: 1285 },
  { date: '2019-05', price: 1285 },
  { date: '2019-06', price: 1323 },
  { date: '2019-07', price: 1418 },
  { date: '2019-08', price: 1510 },
  { date: '2019-09', price: 1485 },
  { date: '2019-10', price: 1492 },
  { date: '2019-11', price: 1465 },
  { date: '2019-12', price: 1475 },
  // 2020 — Pandemic safe-haven surge
  { date: '2020-01', price: 1561 },
  { date: '2020-02', price: 1585 },
  { date: '2020-03', price: 1583 },
  { date: '2020-04', price: 1693 },
  { date: '2020-05', price: 1714 },
  { date: '2020-06', price: 1728 },
  { date: '2020-07', price: 1819 },
  { date: '2020-08', price: 2046 }, // ATH at the time: $2075
  { date: '2020-09', price: 1931 },
  { date: '2020-10', price: 1907 },
  { date: '2020-11', price: 1878 },
  { date: '2020-12', price: 1876 },
  // 2021
  { date: '2021-01', price: 1858 },
  { date: '2021-02', price: 1793 },
  { date: '2021-03', price: 1727 },
  { date: '2021-04', price: 1779 },
  { date: '2021-05', price: 1836 },
  { date: '2021-06', price: 1799 },
  { date: '2021-07', price: 1813 },
  { date: '2021-08', price: 1790 },
  { date: '2021-09', price: 1787 },
  { date: '2021-10', price: 1793 },
  { date: '2021-11', price: 1832 },
  { date: '2021-12', price: 1793 },
  // 2022 — Rate hike pressure
  { date: '2022-01', price: 1819 },
  { date: '2022-02', price: 1859 },
  { date: '2022-03', price: 1921 },
  { date: '2022-04', price: 1940 },
  { date: '2022-05', price: 1846 },
  { date: '2022-06', price: 1840 },
  { date: '2022-07', price: 1725 },
  { date: '2022-08', price: 1757 },
  { date: '2022-09', price: 1653 },
  { date: '2022-10', price: 1656 },
  { date: '2022-11', price: 1728 },
  { date: '2022-12', price: 1800 },
  // 2023 — Recovery + safe-haven demand
  { date: '2023-01', price: 1872 },
  { date: '2023-02', price: 1859 },
  { date: '2023-03', price: 1904 },
  { date: '2023-04', price: 1990 },
  { date: '2023-05', price: 1978 },
  { date: '2023-06', price: 1924 },
  { date: '2023-07', price: 1966 },
  { date: '2023-08', price: 1940 },
  { date: '2023-09', price: 1921 },
  { date: '2023-10', price: 1978 },
  { date: '2023-11', price: 1987 },
  { date: '2023-12', price: 2013 },
  // 2024 — New ATH run
  { date: '2024-01', price: 2030 },
  { date: '2024-02', price: 2045 },
  { date: '2024-03', price: 2180 },
  { date: '2024-04', price: 2319 },
  { date: '2024-05', price: 2337 },
  { date: '2024-06', price: 2332 },
  { date: '2024-07', price: 2427 },
  { date: '2024-08', price: 2490 },
  { date: '2024-09', price: 2560 },
  { date: '2024-10', price: 2716 },
  { date: '2024-11', price: 2663 },
  { date: '2024-12', price: 2645 },
  // 2025 — Continued new ATH territory
  { date: '2025-01', price: 2750 },
  { date: '2025-02', price: 2878 },
  { date: '2025-03', price: 3045 },
];

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMA HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalise a monthly baseline entry into a unified record.
 * @param {{ date: string, price: number }} entry
 * @returns {HistoryRecord}
 */
function baselineToRecord(entry) {
  return {
    date: entry.date,                  // 'YYYY-MM'
    price: entry.price,                // USD/troy oz
    granularity: 'monthly',
    source: 'LBMA-baseline',
    derived: false,
  };
}

/**
 * Normalise a daily cached entry (from localStorage/STATE.history).
 * @param {{ date: string, price: number, timestamp: number }} entry
 * @returns {HistoryRecord}
 */
function cachedToRecord(entry) {
  return {
    date: entry.date,                  // 'YYYY-MM-DD'
    price: entry.price,                // USD/troy oz
    granularity: 'daily',
    source: 'local-snapshot',
    derived: false,
    timestamp: entry.timestamp,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// UNIFIED HISTORY API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a merged array of all available history records, sorted ascending.
 * Monthly baseline + daily cached snapshots, with cached taking precedence
 * when both cover the same month.
 *
 * @param {Array}  cachedDaily  — STATE.history (daily localStorage entries)
 * @returns {HistoryRecord[]}
 */
export function getUnifiedHistory(cachedDaily = []) {
  const baselineRecords = MONTHLY_BASELINE.map(baselineToRecord);
  const cachedRecords   = cachedDaily.map(cachedToRecord);

  // Build a month-map so recent daily data supersedes old monthly entries
  const monthMap = {};
  for (const r of baselineRecords) {
    monthMap[r.date] = r; // monthly key e.g. '2025-03'
  }

  // Inject daily records — don't overwrite baseline months with future projections
  for (const r of cachedRecords) {
    const monthKey = r.date.slice(0, 7); // 'YYYY-MM' from 'YYYY-MM-DD'
    // Always add daily as its own entry (don't collapse to monthly)
    monthMap[r.date] = r;
    // If we now have real daily data for this month, mark the monthly aggregate
    // as superseded so chart prefers the daily granularity
    if (monthMap[monthKey] && monthMap[monthKey].granularity === 'monthly') {
      monthMap[monthKey].superseded = true;
    }
  }

  const allRecords = Object.values(monthMap)
    .filter(r => !r.superseded)
    .sort((a, b) => a.date.localeCompare(b.date));

  return allRecords;
}

/**
 * Returns only monthly baseline records (no localStorage).
 * Safe to call even with no browser state.
 */
export function getBaselineHistory() {
  return MONTHLY_BASELINE.map(baselineToRecord);
}

/**
 * Returns records formatted for the Lightweight Charts library:
 *   [{ time: 'YYYY-MM-DD', value: price }, ...]
 *
 * Monthly records get mapped to the 1st of each month.
 */
export function toChartData(records) {
  return records.map(r => ({
    time: r.date.length === 7 ? `${r.date}-01` : r.date,
    value: r.price,
  }));
}

/**
 * Filter records by a date range.
 * @param {HistoryRecord[]} records
 * @param {'1Y'|'3Y'|'5Y'|'ALL'|'90D'|'30D'} range
 */
export function filterByRange(records, range) {
  if (!range || range === 'ALL') return records;
  const now = new Date();
  const cutoffs = {
    '30D':  30,
    '90D':  90,
    '1Y':   365,
    '3Y':   365 * 3,
    '5Y':   365 * 5,
  };
  const days = cutoffs[range.toUpperCase()];
  if (!days) return records;
  const cutoffDate = new Date(now.getTime() - days * 86400000);
  const cutoffStr = cutoffDate.toISOString().slice(0, 10); // 'YYYY-MM-DD'
  return records.filter(r => r.date >= cutoffStr);
}

/**
 * Compute YoY % change for a given history array.
 */
export function computeYoYChange(records) {
  if (records.length < 2) return null;
  const latest = records[records.length - 1].price;
  // Find ~1 year ago entry
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const yearAgoStr = oneYearAgo.toISOString().slice(0, 7);
  const yearAgoEntry = [...records].reverse().find(r => r.date.slice(0, 7) <= yearAgoStr);
  if (!yearAgoEntry) return null;
  return ((latest - yearAgoEntry.price) / yearAgoEntry.price) * 100;
}

/**
 * Get key stats from history:
 *   - allTimeHigh (from baseline + cached)
 *   - allTimeLow
 *   - ytdChange (%)
 *   - oneYearChange (%)
 */
export function getHistoryStats(records) {
  if (!records.length) return {};
  const prices = records.map(r => r.price);
  const allTimeHigh = Math.max(...prices);
  const allTimeLow  = Math.min(...prices);
  const latest      = records[records.length - 1].price;

  // YTD: compare to start of this year
  const yearStart = `${new Date().getFullYear()}-01`;
  const ytdEntry  = records.find(r => r.date.slice(0, 7) === yearStart || r.date >= yearStart);
  const ytdChange = ytdEntry ? ((latest - ytdEntry.price) / ytdEntry.price) * 100 : null;

  const yoyChange = computeYoYChange(records);

  return { allTimeHigh, allTimeLow, latest, ytdChange, yoyChange };
}
