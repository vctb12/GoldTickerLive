/**
 * gold-api.com daily XAU/USD history — validation contract shared by fetch script,
 * tests, and the homepage historical chart loader.
 */

import { createHash } from 'node:crypto';

export const SCHEMA_VERSION = 1;
export const NORMALIZER_VERSION = '1.1.0';
export const PROVIDER = 'gold-api.com';
export const ENDPOINT = '/history';
export const ENDPOINT_TYPE = 'history';
export const AGGREGATION = 'daily-average';
export const GROUP_BY = 'day';
export const SYMBOL = 'XAU';
export const DEFAULT_WINDOW_DAYS = 400;
export const PRODUCTION_REL_PATH = 'data/historical/xau-usd-daily.json';

export const DATA_ORIGIN_LIVE = 'live-provider';
export const DATA_ORIGIN_FIXTURE = 'fixture';

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

/** Authenticity warning thresholds (QA — not auto-reject unless fatal) */
export const AUTHENTICITY_FATAL_UNIQUE_RATIO = 0.15;
export const AUTHENTICITY_FATAL_CONSTANT_RUN = 45;
export const AUTHENTICITY_WARN_UNIQUE_RATIO = 0.35;

export const REJECTION_REASONS = Object.freeze({
  MISSING_DAY: 'missing_day',
  INVALID_DAY: 'invalid_day',
  MISSING_AVG_PRICE: 'missing_avg_price',
  NON_NUMERIC_AVG_PRICE: 'non_numeric_avg_price',
  NON_POSITIVE_AVG_PRICE: 'non_positive_avg_price',
  FUTURE_DATE: 'future_date',
  DUPLICATE_DATE: 'duplicate_date',
  IMPLAUSIBLE_PRICE: 'implausible_price',
  INVALID_ROW: 'invalid_row',
});

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
 * @param {string} text
 * @returns {string}
 */
export function sha256Hex(text) {
  return createHash('sha256').update(text).digest('hex');
}

/**
 * @param {Array<{date: string, avgUsdOz: number}>} records
 * @returns {string}
 */
export function hashNormalizedRecords(records) {
  return sha256Hex(JSON.stringify(records));
}

/**
 * @param {string} outputPath
 * @param {string} [root]
 * @returns {boolean}
 */
export function isProductionDataPath(outputPath, _root = process.cwd()) {
  const normalized = outputPath.replace(/\\/g, '/');
  return normalized.endsWith(PRODUCTION_REL_PATH) || normalized === PRODUCTION_REL_PATH;
}

/**
 * Create empty rejection tally.
 * @returns {Record<string, number>}
 */
export function createRejectionTally() {
  return Object.fromEntries(Object.values(REJECTION_REASONS).map((k) => [k, 0]));
}

/**
 * @param {Record<string, number>} tally
 * @param {string} reason
 */
export function incrementRejection(tally, reason) {
  tally[reason] = (tally[reason] || 0) + 1;
}

/**
 * Parse documented gold-api.com price field.
 * @param {unknown} value
 * @returns {number|null}
 */
export function parseAvgPrice(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/**
 * Parse documented gold-api.com day field.
 * @param {unknown} value
 * @returns {string|null}
 */
export function parseDayField(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const candidate = value.trim().slice(0, 10);
  return ISO_DATE_RE.test(candidate) ? candidate : null;
}

/**
 * Normalize provider history payload into ascending unique daily records.
 * Official shape: [{ day: "YYYY-MM-DD", avg_price: number|string }]
 *
 * @param {unknown} body
 * @param {string} [referenceDate]
 * @returns {{
 *   records: Array<{date: string, avgUsdOz: number}>,
 *   rejected: number,
 *   rejectionTally: Record<string, number>,
 *   providerResponseRecordCount: number,
 *   errors: string[],
 * }}
 */
export function parseProviderHistoryBody(body, referenceDate) {
  const ref = referenceDate || new Date().toISOString().slice(0, 10);
  const errors = [];
  const rejectionTally = createRejectionTally();
  let rejected = 0;

  if (body && typeof body === 'object' && !Array.isArray(body)) {
    const obj = /** @type {Record<string, unknown>} */ (body);
    for (const key of ['error', 'message', 'status', 'code']) {
      if (obj[key] != null && String(obj[key]).trim()) {
        errors.push(`provider_error:${key}=${String(obj[key]).slice(0, 120)}`);
      }
    }
  }

  let rows = [];
  if (Array.isArray(body)) {
    rows = body;
  } else if (body && typeof body === 'object') {
    const obj = /** @type {Record<string, unknown>} */ (body);
    if (Array.isArray(obj.data)) rows = obj.data;
    else {
      errors.push('unexpected_schema: expected top-level array per gold-api.com /history docs');
      return {
        records: [],
        rejected: 0,
        rejectionTally,
        providerResponseRecordCount: 0,
        errors,
      };
    }
  } else {
    errors.push('unexpected_schema: body is not array');
    return {
      records: [],
      rejected: 0,
      rejectionTally,
      providerResponseRecordCount: 0,
      errors,
    };
  }

  const providerResponseRecordCount = rows.length;
  if (!rows.length) {
    errors.push('empty_response');
    return { records: [], rejected: 0, rejectionTally, providerResponseRecordCount: 0, errors };
  }

  const byDate = new Map();

  for (const raw of rows) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      rejected++;
      incrementRejection(rejectionTally, REJECTION_REASONS.INVALID_ROW);
      continue;
    }
    const row = /** @type {Record<string, unknown>} */ (raw);

    const date = parseDayField(row.day);
    if (!date) {
      rejected++;
      incrementRejection(
        rejectionTally,
        row.day == null ? REJECTION_REASONS.MISSING_DAY : REJECTION_REASONS.INVALID_DAY
      );
      continue;
    }
    if (isFutureDate(date, ref)) {
      rejected++;
      incrementRejection(rejectionTally, REJECTION_REASONS.FUTURE_DATE);
      continue;
    }

    if (!('avg_price' in row)) {
      rejected++;
      incrementRejection(rejectionTally, REJECTION_REASONS.MISSING_AVG_PRICE);
      continue;
    }

    const price = parseAvgPrice(row.avg_price);
    if (price == null) {
      rejected++;
      incrementRejection(rejectionTally, REJECTION_REASONS.NON_NUMERIC_AVG_PRICE);
      continue;
    }
    if (!(price > 0)) {
      rejected++;
      incrementRejection(rejectionTally, REJECTION_REASONS.NON_POSITIVE_AVG_PRICE);
      continue;
    }
    if (!isSanePrice(price)) {
      rejected++;
      incrementRejection(rejectionTally, REJECTION_REASONS.IMPLAUSIBLE_PRICE);
      continue;
    }

    const avgUsdOz = roundStoredUsdOz(price);
    if (byDate.has(date)) {
      rejected++;
      incrementRejection(rejectionTally, REJECTION_REASONS.DUPLICATE_DATE);
    }
    byDate.set(date, { date, avgUsdOz });
  }

  const records = [...byDate.values()].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0
  );

  if (!records.length && providerResponseRecordCount > 0) {
    errors.push(`all_rows_rejected:${formatRejectionSummary(rejectionTally)}`);
  }

  return { records, rejected, rejectionTally, providerResponseRecordCount, errors };
}

/**
 * @param {Record<string, number>} tally
 * @returns {string}
 */
export function formatRejectionSummary(tally) {
  return Object.entries(tally)
    .filter(([, n]) => n > 0)
    .map(([k, n]) => `${k}:${n}`)
    .join(', ');
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
 * @returns {Array<{date: string}>}
 */
export function filterRecordsByRangeDays(records, days) {
  if (!records.length) return [];
  const end = records[records.length - 1].date;
  const endMs = new Date(`${end}T00:00:00Z`).getTime();
  const cutoffMs = endMs - days * 86400000;
  return records.filter((r) => new Date(`${r.date}T00:00:00Z`).getTime() >= cutoffMs);
}

/**
 * Statistical authenticity audit (QA — warns on algorithmic-looking data).
 * @param {Array<{date: string, avgUsdOz: number}>} records
 * @returns {{ fatal: boolean, warnings: string[], stats: object }}
 */
export function analyzeAuthenticity(records) {
  const warnings = [];
  if (!records.length) {
    return { fatal: true, warnings: ['no_records'], stats: {} };
  }

  let unchangedConsecutive = 0;
  let maxUnchangedRun = 0;
  let currentUnchangedRun = 1;
  let maxMonotonicUp = 1;
  let maxMonotonicDown = 1;
  let currentUp = 1;
  let currentDown = 1;
  const deltas = [];
  const decimalSuffixes = new Map();
  let weekendRows = 0;

  for (let i = 0; i < records.length; i++) {
    if (isWeekendDate(records[i].date)) weekendRows++;
    const suffix = String(records[i].avgUsdOz).split('.')[1] || '';
    decimalSuffixes.set(suffix, (decimalSuffixes.get(suffix) || 0) + 1);

    if (i === 0) continue;
    const prev = records[i - 1].avgUsdOz;
    const cur = records[i].avgUsdOz;
    const delta = cur - prev;
    deltas.push(delta);

    if (cur === prev) {
      currentUnchangedRun++;
      unchangedConsecutive++;
      maxUnchangedRun = Math.max(maxUnchangedRun, currentUnchangedRun);
      currentUp = 1;
      currentDown = 1;
    } else {
      currentUnchangedRun = 1;
      if (cur > prev) {
        currentUp++;
        currentDown = 1;
        maxMonotonicUp = Math.max(maxMonotonicUp, currentUp);
      } else if (cur < prev) {
        currentDown++;
        currentUp = 1;
        maxMonotonicDown = Math.max(maxMonotonicDown, currentDown);
      }
    }
  }

  const uniqueValues = new Set(records.map((r) => r.avgUsdOz));
  const uniqueRatio = uniqueValues.size / records.length;
  const deltaCounts = new Map();
  for (const d of deltas) {
    const key = d.toFixed(4);
    deltaCounts.set(key, (deltaCounts.get(key) || 0) + 1);
  }
  const maxRepeatedDelta = Math.max(0, ...deltaCounts.values());
  const mean = deltas.length ? deltas.reduce((a, b) => a + b, 0) / deltas.length : 0;
  const variance = deltas.length
    ? deltas.reduce((a, d) => a + (d - mean) ** 2, 0) / deltas.length
    : 0;
  const dailyReturnStdDev = Math.sqrt(variance);
  const absReturns = deltas.map((d) => Math.abs(d));
  const maxAbsReturn = absReturns.length ? Math.max(...absReturns) : 0;
  const nonZeroAbs = absReturns.filter((v) => v > 0);
  const minAbsNonZeroReturn = nonZeroAbs.length ? Math.min(...nonZeroAbs) : 0;
  const dominantDecimalSuffix = [...decimalSuffixes.entries()].sort((a, b) => b[1] - a[1])[0];

  if (uniqueRatio < AUTHENTICITY_FATAL_UNIQUE_RATIO) {
    warnings.push(`fatal_low_unique_ratio:${uniqueRatio.toFixed(3)}`);
  } else if (uniqueRatio < AUTHENTICITY_WARN_UNIQUE_RATIO) {
    warnings.push(`warn_low_unique_ratio:${uniqueRatio.toFixed(3)}`);
  }
  if (maxUnchangedRun >= AUTHENTICITY_FATAL_CONSTANT_RUN) {
    warnings.push(`fatal_constant_run:${maxUnchangedRun}`);
  } else if (maxUnchangedRun >= 14) {
    warnings.push(`warn_constant_run:${maxUnchangedRun}`);
  }
  if (maxRepeatedDelta > records.length * 0.4 && records.length > 30) {
    warnings.push(`warn_repeated_delta:${maxRepeatedDelta}`);
  }
  if (dominantDecimalSuffix && dominantDecimalSuffix[1] > records.length * 0.8) {
    warnings.push(`warn_decimal_pattern:${dominantDecimalSuffix[0] || 'integer'}`);
  }

  const fatal = warnings.some((w) => w.startsWith('fatal_'));
  return {
    fatal,
    warnings,
    stats: {
      unchangedConsecutive,
      maxUnchangedRun,
      maxMonotonicUp,
      maxMonotonicDown,
      maxRepeatedDelta,
      dailyReturnStdDev: roundStoredUsdOz(dailyReturnStdDev),
      uniqueValueRatio: roundStoredUsdOz(uniqueRatio),
      weekendRecordCount: weekendRows,
      maxAbsoluteDailyReturn: roundStoredUsdOz(maxAbsReturn),
      minAbsoluteNonZeroDailyReturn: roundStoredUsdOz(minAbsNonZeroReturn),
      dominantDecimalSuffix: dominantDecimalSuffix
        ? { suffix: dominantDecimalSuffix[0], count: dominantDecimalSuffix[1] }
        : null,
    },
  };
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
    const slice = filterRecordsByRangeDays(records, windowDays);
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
          return [k, filterRecordsByRangeDays(records, windowDays).length];
        })
      ),
    },
  };
}

/**
 * Validate production provenance metadata (homepage loader gate).
 * @param {unknown} doc
 * @returns {{ ok: boolean, errors: string[], fatalWarnings: string[] }}
 */
export function validateProductionProvenance(doc) {
  const errors = [];
  const fatalWarnings = [];
  if (!doc || typeof doc !== 'object') {
    return { ok: false, errors: ['invalid_document'], fatalWarnings };
  }
  const d = /** @type {Record<string, unknown>} */ (doc);

  if (d.dataOrigin !== DATA_ORIGIN_LIVE) errors.push('data_origin_not_live');
  if (d.provider !== PROVIDER) errors.push('provider_mismatch');
  if (d.endpoint !== ENDPOINT) errors.push('endpoint_mismatch');
  if (d.aggregation !== AGGREGATION) errors.push('aggregation_mismatch');
  if (d.groupBy !== GROUP_BY) errors.push('group_by_mismatch');
  if (!d.rawResponseSha256 || typeof d.rawResponseSha256 !== 'string') {
    errors.push('missing_raw_response_hash');
  }
  if (!d.normalizedRecordsSha256 || typeof d.normalizedRecordsSha256 !== 'string') {
    errors.push('missing_normalized_hash');
  }
  if (!d.workflow || typeof d.workflow !== 'object') {
    errors.push('missing_workflow_meta');
  } else {
    const wf = /** @type {Record<string, unknown>} */ (d.workflow);
    if (!wf.runId) errors.push('missing_workflow_run_id');
    if (!wf.commitSha) errors.push('missing_workflow_commit_sha');
  }
  if (typeof d.providerResponseRecordCount !== 'number') {
    errors.push('missing_provider_response_count');
  }
  if (typeof d.acceptedRecordCount !== 'number') {
    errors.push('missing_accepted_count');
  }
  if (
    typeof d.providerResponseRecordCount === 'number' &&
    typeof d.acceptedRecordCount === 'number' &&
    d.providerResponseRecordCount < d.acceptedRecordCount
  ) {
    errors.push('provider_count_lt_accepted');
  }
  if (d.dataOrigin === DATA_ORIGIN_FIXTURE) errors.push('fixture_in_production_path');

  const records = Array.isArray(d.records) ? d.records : [];
  const coverage = d.coverage && typeof d.coverage === 'object' ? d.coverage : null;
  if (coverage) {
    const cov = /** @type {Record<string, unknown>} */ (coverage);
    if (cov.recordCount !== records.length) errors.push('coverage_count_mismatch');
    if (records.length && cov.start !== records[0].date) errors.push('coverage_start_mismatch');
    if (records.length && cov.end !== records[records.length - 1].date) {
      errors.push('coverage_end_mismatch');
    }
  }

  const expectedHash = records.length ? hashNormalizedRecords(records) : null;
  if (expectedHash && d.normalizedRecordsSha256 !== expectedHash) {
    errors.push('normalized_hash_mismatch');
  }

  const auth = analyzeAuthenticity(records);
  if (auth.fatal) fatalWarnings.push(...auth.warnings.filter((w) => w.startsWith('fatal_')));

  return { ok: errors.length === 0 && fatalWarnings.length === 0, errors, fatalWarnings };
}

/**
 * @param {object} params
 * @param {Array<{date: string, avgUsdOz: number}>} params.records
 * @param {string} params.retrievedAt
 * @param {string} params.dataOrigin
 * @param {number} params.providerResponseRecordCount
 * @param {number} params.rejectedRecordCount
 * @param {Record<string, number>} [params.rejectionTally]
 * @param {string} params.rawResponseSha256
 * @param {object} [params.request]
 * @param {object|null} [params.workflow]
 * @param {object} [params.authenticity]
 * @returns {object}
 */
export function buildDatasetDocument({
  records,
  retrievedAt,
  dataOrigin,
  providerResponseRecordCount,
  rejectedRecordCount,
  rejectionTally = {},
  rawResponseSha256,
  request = {},
  workflow = null,
  authenticity = null,
}) {
  const start = records[0]?.date || null;
  const end = records[records.length - 1]?.date || null;
  const ref = retrievedAt.slice(0, 10);
  const ageDays = end ? daysBetween(end, ref) : null;

  return {
    schemaVersion: SCHEMA_VERSION,
    dataOrigin,
    provider: PROVIDER,
    endpoint: ENDPOINT,
    endpointType: ENDPOINT_TYPE,
    symbol: SYMBOL,
    currency: 'USD',
    groupBy: GROUP_BY,
    aggregation: AGGREGATION,
    retrievedAt,
    generatedAt: retrievedAt,
    request,
    providerResponseRecordCount,
    acceptedRecordCount: records.length,
    rejectedRecordCount,
    rejectionTally,
    rawResponseSha256,
    normalizedRecordsSha256: records.length ? hashNormalizedRecords(records) : null,
    workflow,
    normalizerVersion: NORMALIZER_VERSION,
    authenticity,
    coverage: {
      start,
      end,
      recordCount: records.length,
      calendarAgeDays: ageDays,
    },
    records,
  };
}

/**
 * Validate committed JSON document schema.
 * @param {unknown} doc
 * @param {string} [referenceDate]
 * @param {{ allowStale?: boolean, requireProductionProvenance?: boolean }} [options]
 * @returns {{ ok: boolean, errors: string[], records: Array<{date: string, avgUsdOz: number}> }}
 */
export function validateDatasetDocument(doc, referenceDate, options = {}) {
  const { allowStale = false, requireProductionProvenance = false } = options;
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

  if (requireProductionProvenance) {
    const prov = validateProductionProvenance(doc);
    errors.push(...prov.errors, ...prov.fatalWarnings);
  } else if (d.dataOrigin === DATA_ORIGIN_FIXTURE) {
    errors.push('fixture_not_for_production');
  }

  const records = Array.isArray(d.records)
    ? d.records.map((r) => ({
        date: String(/** @type {Record<string, unknown>} */ (r).date),
        avgUsdOz: Number(/** @type {Record<string, unknown>} */ (r).avgUsdOz),
      }))
    : [];

  const validation = validateDailyDataset(records, referenceDate, { allowStale });
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

/**
 * Build Unix-second history request parameters (UTC).
 * @param {number} days
 * @param {string} referenceDate YYYY-MM-DD
 * @returns {{ startTimestamp: number, endTimestamp: number, startDate: string, endDate: string, timestampUnit: 'seconds' }}
 */
export function buildHistoryRequestParams(days, referenceDate) {
  const endDate = referenceDate;
  const endTs = Math.floor(new Date(`${endDate}T23:59:59Z`).getTime() / 1000);
  const startMs = new Date(`${endDate}T00:00:00Z`).getTime() - (days - 1) * 86400000;
  const startTs = Math.floor(startMs / 1000);
  const startDate = new Date(startMs).toISOString().slice(0, 10);
  return {
    startTimestamp: startTs,
    endTimestamp: endTs,
    startDate,
    endDate,
    timestampUnit: 'seconds',
  };
}

/**
 * Build gold-api.com history URL from request params.
 * @param {ReturnType<typeof buildHistoryRequestParams>} params
 * @returns {string}
 */
export function buildHistoryUrl(params) {
  const search = new URLSearchParams({
    symbol: SYMBOL,
    groupBy: GROUP_BY,
    aggregation: 'avg',
    orderBy: 'asc',
    startTimestamp: String(params.startTimestamp),
    endTimestamp: String(params.endTimestamp),
  });
  return `https://api.gold-api.com${ENDPOINT}?${search.toString()}`;
}

/**
 * Secret-free structural diagnosis of a provider response body.
 * @param {unknown} body
 * @param {{ status: number, contentType: string, byteLength: number, rawSha256: string }} meta
 * @returns {object}
 */
export function diagnoseProviderResponse(body, meta) {
  const diag = {
    httpStatus: meta.status,
    contentType: meta.contentType,
    topLevelType: Array.isArray(body) ? 'array' : typeof body,
    responseByteLength: meta.byteLength,
    rawResponseSha256: meta.rawSha256,
    rowCount: 0,
    firstRowKeys: [],
    lastRowKeys: [],
    firstRowFieldTypes: {},
    lastRowFieldTypes: {},
    hasDay: false,
    hasAvgPrice: false,
    avgPriceType: null,
    firstDate: null,
    lastDate: null,
    providerErrorFields: {},
  };

  let rows = [];
  if (Array.isArray(body)) rows = body;
  else if (body && typeof body === 'object') {
    const obj = /** @type {Record<string, unknown>} */ (body);
    for (const key of ['error', 'message', 'status', 'code']) {
      if (obj[key] != null) diag.providerErrorFields[key] = String(obj[key]).slice(0, 120);
    }
    if (Array.isArray(obj.data)) rows = obj.data;
  }

  diag.rowCount = rows.length;
  if (!rows.length) return diag;

  const describeRow = (row) => {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return { keys: [], types: {} };
    const keys = Object.keys(row).sort();
    const types = Object.fromEntries(keys.map((k) => [k, typeof row[k]]));
    return { keys, types };
  };

  const first = describeRow(rows[0]);
  const last = describeRow(rows[rows.length - 1]);
  diag.firstRowKeys = first.keys;
  diag.lastRowKeys = last.keys;
  diag.firstRowFieldTypes = first.types;
  diag.lastRowFieldTypes = last.types;
  diag.hasDay = first.keys.includes('day');
  diag.hasAvgPrice = first.keys.includes('avg_price');
  diag.avgPriceType = rows[0]?.avg_price != null ? typeof rows[0].avg_price : null;
  diag.firstDate = parseDayField(rows[0]?.day);
  diag.lastDate = parseDayField(rows[rows.length - 1]?.day);
  return diag;
}
