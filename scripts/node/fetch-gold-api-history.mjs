#!/usr/bin/env node
/**
 * Fetch daily XAU/USD history from gold-api.com and write data/historical/xau-usd-daily.json.
 *
 * Usage:
 *   node scripts/node/fetch-gold-api-history.mjs [--output path] [--days N] [--check] [--fixture path]
 *
 * Requires GOLD_API_KEY (preferred) or GOLD_API_COM_KEY. Never logs the key.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AGGREGATION,
  DEFAULT_WINDOW_DAYS,
  ENDPOINT_TYPE,
  PROVIDER,
  buildDatasetDocument,
  parseProviderHistoryBody,
  validateDailyDataset,
  validateDatasetDocument,
  CROSS_VALIDATION_MAX_PCT,
  roundStoredUsdOz,
} from '../../src/lib/gold-api-daily-history-contract.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DEFAULT_OUTPUT = path.join(ROOT, 'data/historical/xau-usd-daily.json');
const HISTORY_URL = 'https://api.gold-api.com/history';

function parseArgs(argv) {
  const opts = {
    output: DEFAULT_OUTPUT,
    days: DEFAULT_WINDOW_DAYS,
    check: false,
    fixture: null,
    referenceDate: new Date().toISOString().slice(0, 10),
  };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--check') opts.check = true;
    else if (arg === '--output') opts.output = path.resolve(argv[++i]);
    else if (arg === '--days') opts.days = Number(argv[++i]);
    else if (arg === '--fixture') opts.fixture = path.resolve(argv[++i]);
    else if (arg === '--reference-date') opts.referenceDate = argv[++i];
    else if (arg === '--help' || arg === '-h') {
      console.log(`Usage: node scripts/node/fetch-gold-api-history.mjs [options]
  --output <path>       Output JSON path (default: data/historical/xau-usd-daily.json)
  --days <n>            Calendar days to request (default: ${DEFAULT_WINDOW_DAYS})
  --check               Validate existing file only; do not fetch
  --fixture <path>      Use fixture provider response instead of live API
  --reference-date <d>  Audit date YYYY-MM-DD (default: today UTC)`);
      process.exit(0);
    }
  }
  return opts;
}

function resolveApiKey() {
  const key = process.env.GOLD_API_KEY || process.env.GOLD_API_COM_KEY;
  if (!key || !String(key).trim()) {
    console.error(
      'ERROR: Missing API key. Set GOLD_API_KEY (preferred) or GOLD_API_COM_KEY in the environment.'
    );
    process.exit(1);
  }
  return String(key).trim();
}

function utcStartOfDay(dateStr) {
  return Math.floor(new Date(`${dateStr}T00:00:00Z`).getTime() / 1000);
}

function buildHistoryUrl(days, referenceDate) {
  const endDate = referenceDate;
  const endTs = utcStartOfDay(endDate) + 86399;
  const startMs = new Date(`${endDate}T00:00:00Z`).getTime() - (days - 1) * 86400000;
  const startTs = Math.floor(startMs / 1000);
  const params = new URLSearchParams({
    symbol: 'XAU',
    groupBy: 'day',
    aggregation: 'avg',
    orderBy: 'asc',
    startTimestamp: String(startTs),
    endTimestamp: String(endTs),
  });
  return `${HISTORY_URL}?${params.toString()}`;
}

/**
 * @param {number} status
 * @returns {string}
 */
function httpErrorLabel(status) {
  if (status === 401) return 'auth_error_401';
  if (status === 403) return 'auth_error_403';
  if (status === 429) return 'rate_limited_429';
  if (status >= 500) return `server_error_${status}`;
  return `http_error_${status}`;
}

/**
 * @param {string} apiKey
 * @param {number} days
 * @param {string} referenceDate
 * @returns {Promise<{ body: unknown, status: number }>}
 */
async function fetchHistory(apiKey, days, referenceDate) {
  const url = buildHistoryUrl(days, referenceDate);
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'x-api-key': apiKey,
    },
  });
  const text = await response.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`invalid_json: HTTP ${response.status}`);
  }
  if (!response.ok) {
    const label = httpErrorLabel(response.status);
    const msg =
      body && typeof body === 'object' && 'error' in body
        ? String(/** @type {Record<string, unknown>} */ (body).error)
        : label;
    throw new Error(`${label}: ${msg}`);
  }
  return { body, status: response.status };
}

/**
 * QA cross-validation against freegoldapi (not merged into dataset).
 * @param {Array<{date: string, avgUsdOz: number}>} records
 */
async function crossValidateSample(records) {
  const recent = records.slice(-30);
  if (recent.length < 10) {
    return { ok: false, reason: 'insufficient_recent_records', samples: [] };
  }

  let freegold = null;
  try {
    const res = await fetch('https://freegoldapi.com/data/latest.json', {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) freegold = await res.json();
  } catch {
    return { ok: true, reason: 'comparison_source_unavailable', samples: [] };
  }

  const prices = freegold?.prices;
  if (!Array.isArray(prices)) {
    return { ok: true, reason: 'comparison_source_unavailable', samples: [] };
  }

  const byDate = new Map(
    prices
      .filter((p) => p?.date && Number(p?.price) > 0)
      .map((p) => [String(p.date).slice(0, 10), Number(p.price)])
  );

  const picks = [];
  for (let i = 0; i < 10; i++) {
    const idx = recent.length - 1 - i * 2;
    if (idx < 0) break;
    const row = recent[idx];
    const compare = byDate.get(row.date);
    if (compare == null) continue;
    const diff = Math.abs(row.avgUsdOz - compare);
    const pct = (diff / compare) * 100;
    picks.push({
      date: row.date,
      goldApiAvg: row.avgUsdOz,
      compareValue: roundStoredUsdOz(compare),
      absoluteDiff: roundStoredUsdOz(diff),
      percentDiff: Math.round(pct * 100) / 100,
      withinTolerance: pct <= CROSS_VALIDATION_MAX_PCT,
    });
  }

  if (!picks.length) {
    return { ok: true, reason: 'no_overlapping_dates', samples: [] };
  }

  const failures = picks.filter((p) => !p.withinTolerance);
  return {
    ok: failures.length === 0,
    reason: failures.length ? 'tolerance_exceeded' : 'ok',
    tolerancePct: CROSS_VALIDATION_MAX_PCT,
    samples: picks,
    failures,
  };
}

function printSummary(summary) {
  console.log('--- gold-api daily history summary ---');
  for (const [k, v] of Object.entries(summary)) {
    if (k === 'crossValidation') continue;
    console.log(`${k}: ${v}`);
  }
  if (summary.crossValidation) {
    console.log(`crossValidation: ${summary.crossValidation.reason}`);
    for (const s of summary.crossValidation.samples || []) {
      console.log(
        `  ${s.date} api=${s.goldApiAvg} cmp=${s.compareValue} diff=${s.percentDiff}% ok=${s.withinTolerance}`
      );
    }
  }
}

async function main() {
  const opts = parseArgs(process.argv);

  if (opts.check) {
    if (!fs.existsSync(opts.output)) {
      console.error(`ERROR: File not found: ${opts.output}`);
      process.exit(1);
    }
    const doc = JSON.parse(fs.readFileSync(opts.output, 'utf8'));
    const result = validateDatasetDocument(doc, opts.referenceDate);
    printSummary({
      mode: 'check',
      ok: result.ok,
      errors: result.errors.join(', ') || 'none',
      recordCount: result.records.length,
      start: result.records[0]?.date,
      end: result.records[result.records.length - 1]?.date,
    });
    process.exit(result.ok ? 0 : 1);
  }

  let body;
  if (opts.fixture) {
    body = JSON.parse(fs.readFileSync(opts.fixture, 'utf8'));
  } else {
    const apiKey = resolveApiKey();
    try {
      ({ body } = await fetchHistory(apiKey, opts.days, opts.referenceDate));
    } catch (err) {
      console.error(`ERROR: fetch failed — ${err.message}`);
      process.exit(1);
    }
  }

  const {
    records,
    rejected,
    errors: parseErrors,
  } = parseProviderHistoryBody(body, opts.referenceDate);
  if (parseErrors.length) {
    console.error(`ERROR: parse failed — ${parseErrors.join(', ')}`);
    process.exit(1);
  }

  const validation = validateDailyDataset(records, opts.referenceDate);
  if (!validation.ok) {
    console.error(`ERROR: validation failed — ${validation.errors.join(', ')}`);
    printSummary({
      mode: 'validate_failed',
      recordsFetched: records.length,
      rejected,
      ...validation.stats,
    });
    process.exit(1);
  }

  const crossValidation = await crossValidateSample(records);
  if (!crossValidation.ok && crossValidation.reason === 'tolerance_exceeded') {
    console.error('ERROR: cross-validation tolerance exceeded');
    printSummary({
      mode: 'cross_validation_failed',
      recordsFetched: records.length,
      rejected,
      crossValidation,
      ...validation.stats,
    });
    process.exit(1);
  }

  const generatedAt = new Date().toISOString();
  const document = buildDatasetDocument({}, records, generatedAt);

  const previousExists = fs.existsSync(opts.output);
  const previous = previousExists ? fs.readFileSync(opts.output, 'utf8') : null;
  const next = `${JSON.stringify(document, null, 2)}\n`;

  if (previous === next) {
    printSummary({
      mode: 'unchanged',
      recordsFetched: records.length,
      rejected,
      wrote: false,
      crossValidation: { reason: crossValidation.reason },
      ...validation.stats,
    });
    return;
  }

  fs.mkdirSync(path.dirname(opts.output), { recursive: true });
  fs.writeFileSync(opts.output, next, 'utf8');

  printSummary({
    mode: 'written',
    recordsFetched: records.length,
    rejected,
    wrote: true,
    output: path.relative(ROOT, opts.output),
    provider: PROVIDER,
    endpointType: ENDPOINT_TYPE,
    aggregation: AGGREGATION,
    crossValidation: {
      reason: crossValidation.reason,
      sampleCount: crossValidation.samples?.length || 0,
    },
    ...validation.stats,
  });
}

main().catch((err) => {
  console.error(`ERROR: ${err.message}`);
  process.exit(1);
});
