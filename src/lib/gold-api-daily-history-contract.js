/**
 * gold-api.com daily XAU/USD history — validation contract shared by fetch script,
 * tests, and the homepage historical chart loader.
 */

export const SCHEMA_VERSION = 1;
export const PROVIDER = 'gold-api.com';
export const ENDPOINT_TYPE = 'history';
export const AGGREGATION = 'daily-average';
export const DEFAULT_WINDOW_DAYS = 400;

/** Sanity bounds aligned with scripts/python/gold_providers/base.py */
export const MIN_VALID_XAU_USD = 500;
export const MAX_VALID_XAU_USD = 10000;

/** Freshness: latest record age in calendar days */
export const FRESHNESS_WEEKDAY_MAX_DAYS = 3;
export const FRESHNESS_WEEKEND_MAX_DAYS = 4;

/** Minimum observations inside the fetch window */
export const MIN_OBSERVATIONS_IN_WINDOW = 240;

/** Range minimums (anchored on latest record) */
export const RANGE_MIN_OBSERVATIONS = Object.freeze({
  '1M': 15,
  '3M': 50,
  '6M': 100,
  '12M': 200,
});

/** Max unexplained gap (calendar days between consecutive records) */
export const MAX_UNEXPLAINED_GAP_DAYS = 5;

/** Cross-validation tolerance vs independent spot reference (QA only) */
export const CROSS_VALIDATION_MAX_PCT = 3.0;

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * @param {string} [referenceDate] YYYY-MM-DD
 * @returns {boolean}
 */
export function isWeekendReference(referenceDate) {
  const ref = referenceDate || new Date().toISOString().slice(0, 10);
  const day = new Date(`${ref}T12:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
}

/**
 * @param {number} ageDays
 * @param {string} [referenceDate]
 * @returns {boolean}
 */
export function isFreshnessAgeAcceptable(ageDays, referenceDate) {
  const limit = isWeekendReference(referenceDate)
    ? FRESHNESS_WEEKEND_MAX_DAYS
    : FRESHNESS_WEEKDAY_MAX_DAYS;
  return ageDays <= limit;
}

/**
 * @param {string} dateStr YYYY-MM-DD
 * @param {string} [referenceDate]
 * @returns {boolean}
 */
export function isFutureDate(dateStr, referenceDate) {
  const ref = referenceDate || new Date().toISOString().slice(0, 10);
  return dateStr > ref;
}

/**
 * @param {number} price
 * @returns {boolean}
 */
export function isSanePrice(price) {
  return Number.isFinite(price) && price > MIN_VALID_XAU_USD && price <= MAX_VALID_XAU_USD;
}

/**
 * Round stored USD/oz averages (4 dp — matches provider normalize policy).
 * @param {number} price
 * @returns {number}
 */
export function roundStoredUsdOz(price) {
  return Math.round(price * 10000) / 10000;
}

/**
 * Calendar days between ISO dates.
 * @param {string} startDate
 * @param {string} endDate
 * @returns {number}
 */
export function daysBetween(startDate, endDate) {
  const ms = new Date(`${endDate}T00:00:00Z`) - new Date(`${startDate}T00:00:00Z`);
  return Math.round(ms / 86400000);
}

/**
 * @param {string} prevDate
 * @param {string} nextDate
 * @returns {number}
 */
export function gapDaysBetween(prevDate, nextDate) {
  return daysBetween(prevDate, nextDate) - 1;
}

/**
 * @param {string} dateStr YYYY-MM-DD
 * @returns {boolean}
 */
export function isWeekendDate(dateStr) {
  const day = new Date(`${dateStr}T12:00:00Z`).getUTCDay();
  return day === 0 || day === 6;
}

/**
 * Whether a gap between trading days is explainable (weekends / single closure).
 * @param {number} gapDays
 * @param {string} prevDate
 * @param {string} nextDate
 * @returns {boolean}
 */
export function isExplainableGap(gapDays, prevDate, nextDate) {
  if (gapDays <= 0) return true;
  if (gapDays <= 2) {
    const prevDay = new Date(`${prevDate}T12:00:00Z`).getUTCDay();
    const nextDay = new Date(`${nextDate}T12:00:00Z`).getUTCDay();
    if (prevDay === 5 && nextDay === 1) return true;
    if (prevDay === 5 && (nextDay === 0 || nextDay === 6)) return true;
    if (prevDay === 6 && nextDay === 1) return true;
  }
  return gapDays <= 1 && (isWeekendDate(prevDate) || isWeekendDate(nextDate));
}

/**
 * Normalize provider history payload into ascending unique daily records.
 * @param {unknown} body
 * @param {string} [referenceDate]
 * @returns {{ records: Array<{date: string, avgUsdOz: number}>, rejected: number, errors: string[] }}
 */
export function parseProviderHistoryBody(body, referenceDate) {
  const ref = referenceDate || new Date().toISOString().slice(0, 10);
  const errors = [];
  let rejected = 0;

  let rows = [];
  if (Array.isArray(body)) {
    rows = body;
  } else if (body && typeof body === 'object') {
    const obj = /** @type {Record<string, unknown>} */ (body);
    if (Array.isArray(obj.data)) rows = obj.data;
    else if (Array.isArray(obj.history)) rows = obj.history;
    else if (Array.isArray(obj.records)) rows = obj.records;
    else if (Array.isArray(obj.prices)) rows = obj.prices;
    else {
      errors.push('unexpected_schema: no array payload');
      return { records: [], rejected: 0, errors };
    }
  } else {
    errors.push('unexpected_schema: body is not array or object');
    return { records: [], rejected: 0, errors };
  }

  if (!rows.length) {
    errors.push('empty_response');
    return { records: [], rejected: 0, errors };
  }

  const byDate = new Map();

  for (const raw of rows) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      rejected++;
      continue;
    }
    const row = /** @type {Record<string, unknown>} */ (raw);

    let date = '';
    // Official gold-api.com /history shape: { day: "YYYY-MM-DD", avg_price: n }
    const groupByDate = row.day ?? row.week ?? row.month ?? row.year ?? row.date;
    if (typeof groupByDate === 'string') {
      const candidate = groupByDate.slice(0, 10);
      if (ISO_DATE_RE.test(candidate)) {
        date = candidate;
      } else if (/^\d{4}-\d{2}$/.test(groupByDate)) {
        date = `${groupByDate}-01`;
      }
    }
    if (!date) {
      const ts = row.timestamp ?? row.time ?? row.t ?? row.startTimestamp ?? row.start ?? row.ts;
      if (typeof ts === 'number' && Number.isFinite(ts)) {
        const ms = ts > 1e12 ? ts : ts * 1000;
        date = new Date(ms).toISOString().slice(0, 10);
      } else if (typeof ts === 'string' && ISO_DATE_RE.test(ts.slice(0, 10))) {
        date = ts.slice(0, 10);
      }
    }

    if (!date || !ISO_DATE_RE.test(date)) {
      rejected++;
      continue;
    }
    if (isFutureDate(date, ref)) {
      rejected++;
      continue;
    }

    const priceRaw =
      row.avg_price ??
      row.avg ??
      row.average ??
      row.avgPrice ??
      row.price ??
      row.close ??
      row.c ??
      row.max_price ??
      row.min_price ??
      row.value ??
      row.o;
    const price = Number(priceRaw);
    if (!isSanePrice(price)) {
      rejected++;
      continue;
    }

    const avgUsdOz = roundStoredUsdOz(price);
    byDate.set(date, { date, avgUsdOz });
  }

  const records = [...byDate.values()].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0
  );
  return { records, rejected, errors };
}

/**
 * @param {Array<{date: string, avgUsdOz: number}>} records
 * @returns {{ maxGap: number, maxUnexplainedGap: number }}
 */
export function computeGapStats(records) {
  if (records.length < 2) return { maxGap: 0, maxUnexplainedGap: 0 };
  let maxGap = 0;
  let maxUnexplainedGap = 0;
  for (let i = 1; i < records.length; i++) {
    const gap = gapDaysBetween(records[i - 1].date, records[i].date);
    maxGap = Math.max(maxGap, gap);
    if (!isExplainableGap(gap, records[i - 1].date, records[i].date)) {
      maxUnexplainedGap = Math.max(maxUnexplainedGap, gap);
    }
  }
  return { maxGap, maxUnexplainedGap };
}

/**
 * @param {Array<{date: string}>} records
 * @param {number} days
 * @param {string} [referenceDate]
 * @returns {Array<{date: string}>}
 */
export function filterRecordsByRangeDays(records, days, _referenceDate) {
  if (!records.length) return [];
  const end = records[records.length - 1].date;
  const endMs = new Date(`${end}T00:00:00Z`).getTime();
  const cutoffMs = endMs - days * 86400000;
  return records.filter((r) => new Date(`${r.date}T00:00:00Z`).getTime() >= cutoffMs);
}

/**
 * @param {Array<{date: string}>} records
 * @param {string} [referenceDate]
 * @param {{ allowStale?: boolean }} [options]
 * @returns {{ ok: boolean, errors: string[], stats: object }}
 */
export function validateDailyDataset(records, referenceDate, options = {}) {
  const { allowStale = false } = options;
  const ref = referenceDate || new Date().toISOString().slice(0, 10);
  const errors = [];

  if (!Array.isArray(records) || !records.length) {
    return {
      ok: false,
      errors: ['no_records'],
      stats: { recordCount: 0 },
    };
  }

  if (records.length < MIN_OBSERVATIONS_IN_WINDOW) {
    errors.push(`insufficient_records:${records.length}<${MIN_OBSERVATIONS_IN_WINDOW}`);
  }

  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    if (!r?.date || !ISO_DATE_RE.test(r.date)) {
      errors.push(`malformed_date:index_${i}`);
    }
    if (!isSanePrice(Number(r.avgUsdOz))) {
      errors.push(`invalid_price:${r.date}`);
    }
    if (i > 0 && records[i - 1].date >= r.date) {
      errors.push(`not_ascending:${records[i - 1].date}->${r.date}`);
    }
    if (isFutureDate(r.date, ref)) {
      errors.push(`future_date:${r.date}`);
    }
  }

  const start = records[0].date;
  const end = records[records.length - 1].date;
  const ageDays = daysBetween(end, ref);

  if (!allowStale && !isFreshnessAgeAcceptable(ageDays, ref)) {
    errors.push(`stale_latest:${ageDays}d`);
  }

  const { maxGap, maxUnexplainedGap } = computeGapStats(records);
  if (maxUnexplainedGap > MAX_UNEXPLAINED_GAP_DAYS) {
    errors.push(`unexplained_gap:${maxUnexplainedGap}d`);
  }

  for (const [rangeKey, minCount] of Object.entries(RANGE_MIN_OBSERVATIONS)) {
    const windowDays = { '1M': 30, '3M': 90, '6M': 180, '12M': 365 }[rangeKey];
    const slice = filterRecordsByRangeDays(records, windowDays, ref);
    if (slice.length < minCount) {
      errors.push(`range_${rangeKey}:${slice.length}<${minCount}`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    stats: {
      recordCount: records.length,
      start,
      end,
      ageDays,
      maxGap,
      maxUnexplainedGap,
      rangeCounts: Object.fromEntries(
        Object.keys(RANGE_MIN_OBSERVATIONS).map((k) => {
          const windowDays = { '1M': 30, '3M': 90, '6M': 180, '12M': 365 }[k];
          return [k, filterRecordsByRangeDays(records, windowDays, ref).length];
        })
      ),
    },
  };
}

/**
 * @param {object} meta
 * @param {Array<{date: string, avgUsdOz: number}>} records
 * @param {string} generatedAt
 * @returns {object}
 */
export function buildDatasetDocument(meta, records, generatedAt) {
  const start = records[0]?.date || null;
  const end = records[records.length - 1]?.date || null;
  const ref = generatedAt.slice(0, 10);
  const ageDays = end ? daysBetween(end, ref) : null;

  return {
    schemaVersion: SCHEMA_VERSION,
    metal: 'XAU',
    currency: 'USD',
    provider: PROVIDER,
    endpointType: ENDPOINT_TYPE,
    aggregation: AGGREGATION,
    generatedAt,
    coverage: {
      start,
      end,
      recordCount: records.length,
      calendarAgeDays: ageDays,
    },
    records,
    ...meta,
  };
}

/**
 * Validate committed JSON document schema.
 * @param {unknown} doc
 * @param {string} [referenceDate]
 * @param {{ allowStale?: boolean }} [options]
 * @returns {{ ok: boolean, errors: string[], records: Array<{date: string, avgUsdOz: number}> }}
 */
export function validateDatasetDocument(doc, referenceDate, options = {}) {
  const errors = [];
  if (!doc || typeof doc !== 'object') {
    return { ok: false, errors: ['invalid_document'], records: [] };
  }
  const d = /** @type {Record<string, unknown>} */ (doc);

  if (d.schemaVersion !== SCHEMA_VERSION) errors.push('schema_version');
  if (d.provider !== PROVIDER) errors.push('provider');
  if (d.aggregation !== AGGREGATION) errors.push('aggregation');
  if (!Array.isArray(d.records)) errors.push('records_missing');

  const secretPattern = /x-api-key|api[_-]?key/i;
  const serialized = JSON.stringify(doc);
  if (secretPattern.test(serialized) && /[a-f0-9]{20,}/i.test(serialized)) {
    errors.push('possible_secret_leak');
  }

  const records = Array.isArray(d.records)
    ? d.records.map((r) => ({
        date: String(/** @type {Record<string, unknown>} */ (r).date),
        avgUsdOz: Number(/** @type {Record<string, unknown>} */ (r).avgUsdOz),
      }))
    : [];

  const validation = validateDailyDataset(records, referenceDate, options);
  return {
    ok: errors.length === 0 && validation.ok,
    errors: [...errors, ...validation.errors],
    records,
  };
}

/**
 * Classify dataset freshness for UI (homepage chart).
 * @param {string|null} latestDate
 * @param {string} [referenceDate]
 * @returns {'current'|'stale'|'unavailable'}
 */
export function classifyDatasetFreshness(latestDate, referenceDate) {
  if (!latestDate) return 'unavailable';
  const ref = referenceDate || new Date().toISOString().slice(0, 10);
  const ageDays = daysBetween(latestDate, ref);
  return isFreshnessAgeAcceptable(ageDays, ref) ? 'current' : 'stale';
}
