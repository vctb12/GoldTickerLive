/**
 * lib/monthly-baseline-merge.js — safe merge for the embedded monthly gold baseline (Phase 46).
 *
 * The homepage "Price History" table and the tracker's long-range history read
 * `src/data/historical-baseline.json` — monthly average XAU/USD rows. When the live baseline stops
 * short (e.g. at 2025-08), the missing months must be *backfilled with real data*, never invented:
 * this is a gold-price reference site and a wrong historical value is a trust defect.
 *
 * This module is the tested, deterministic core used by `scripts/node/backfill-monthly-baseline.mjs`.
 * It validates incoming monthly rows and appends only genuinely-new months — it NEVER overwrites an
 * existing month, so committed data can't be silently changed. Sourcing the real values is an owner
 * action (their `price_history` export or a verified public dataset); this code just lands them safely.
 */

const MONTH_RE = /^\d{4}-\d{2}$/;

/**
 * Validate a set of monthly rows. Returns `{ ok, errors }`; does not throw.
 * A row is `{ date: 'YYYY-MM', price: number > 0 }`. Dates must be unique.
 * @param {Array<{date:string, price:number}>} rows
 */
export function validateMonthlyRows(rows) {
  const errors = [];
  if (!Array.isArray(rows)) return { ok: false, errors: ['rows must be an array'] };
  const seen = new Set();
  for (const [i, row] of rows.entries()) {
    if (!row || typeof row !== 'object') {
      errors.push(`row ${i}: not an object`);
      continue;
    }
    if (typeof row.date !== 'string' || !MONTH_RE.test(row.date)) {
      errors.push(`row ${i}: date must be 'YYYY-MM' (got ${JSON.stringify(row.date)})`);
    } else if (seen.has(row.date)) {
      errors.push(`row ${i}: duplicate date ${row.date}`);
    } else {
      seen.add(row.date);
    }
    if (typeof row.price !== 'number' || !Number.isFinite(row.price) || row.price <= 0) {
      errors.push(
        `row ${i} (${row.date}): price must be a positive number (got ${JSON.stringify(row.price)})`
      );
    }
  }
  return { ok: errors.length === 0, errors };
}

/** Sort helper — ascending by 'YYYY-MM' string (lexicographic == chronological for this format). */
function byDate(a, b) {
  return a.date < b.date ? -1 : a.date > b.date ? 1 : 0;
}

/**
 * Merge `incoming` monthly rows into `existing`, APPEND-ONLY: a month already present in `existing`
 * is left exactly as-is (its price is never overwritten). Result is sorted ascending.
 *
 * @param {Array<{date:string, price:number}>} existing  Current baseline rows.
 * @param {Array<{date:string, price:number}>} incoming  New rows to add (validated by the caller).
 * @returns {{ merged: Array, added: string[], skipped: string[] }}
 *   `added` = months newly inserted; `skipped` = incoming months that already existed.
 */
export function mergeMonthlyBaseline(existing, incoming) {
  const base = Array.isArray(existing) ? existing : [];
  const have = new Set(base.map((r) => r.date));
  const added = [];
  const skipped = [];
  const out = [...base];
  for (const row of Array.isArray(incoming) ? incoming : []) {
    if (have.has(row.date)) {
      skipped.push(row.date);
      continue;
    }
    have.add(row.date);
    added.push(row.date);
    out.push({ date: row.date, price: row.price });
  }
  out.sort(byDate);
  return { merged: out, added, skipped };
}

/**
 * List the calendar months missing between the first and last row of a sorted baseline — i.e. the
 * gap the owner needs to backfill. Returns `['YYYY-MM', …]` (empty if contiguous).
 * @param {Array<{date:string}>} rows
 */
export function findMonthlyGaps(rows) {
  const dates = (Array.isArray(rows) ? rows : [])
    .map((r) => r.date)
    .filter((d) => typeof d === 'string' && MONTH_RE.test(d))
    .sort();
  if (dates.length < 2) return [];
  const present = new Set(dates);
  const gaps = [];
  let [y, m] = dates[0].split('-').map(Number);
  const [ly, lm] = dates[dates.length - 1].split('-').map(Number);
  // Walk month-by-month from first to last, collecting any not present.
  while (y < ly || (y === ly && m < lm)) {
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    const key = `${y}-${String(m).padStart(2, '0')}`;
    if (!present.has(key) && (y < ly || (y === ly && m <= lm))) gaps.push(key);
  }
  return gaps;
}
