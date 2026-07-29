#!/usr/bin/env node
/**
 * QA cross-validation for gold-api.com daily history (not merged into production file).
 *
 * Usage:
 *   node scripts/node/cross-validate-gold-api-history.mjs [--input path] [--world-bank path]
 *
 * Compares:
 *  A) 10 overlapping daily dates vs FreeGoldAPI (pre-2026-02-20 overlap only)
 *  B) Monthly aggregates vs World Bank Pink Sheet fixture (documented tolerance)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PRODUCTION_REL_PATH,
  CROSS_VALIDATION_MAX_PCT,
  roundStoredUsdOz,
  validateProductionProvenance,
} from '../../src/lib/gold-api-daily-history-contract.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DEFAULT_INPUT = path.join(ROOT, PRODUCTION_REL_PATH);
const DEFAULT_WORLD_BANK = path.join(
  ROOT,
  'tests/fixtures/world-bank/pink-sheet-gold-monthly-2025.json'
);
const FREE_GOLD_URL = 'https://freegoldapi.com/data/latest.json';
const FREE_GOLD_MAX_DATE = '2026-02-20';

/** Recent USD overlap rows — reject GBP / historical non-USD sources. */
export const FREE_GOLD_ACCEPTABLE_SOURCES = Object.freeze(['yahoo_finance']);

const MONTHLY_TOLERANCE_PCT = 8.0;

function parseArgs(argv) {
  let input = DEFAULT_INPUT;
  let worldBank = DEFAULT_WORLD_BANK;
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--input') input = path.resolve(argv[++i]);
    else if (argv[i] === '--world-bank') worldBank = path.resolve(argv[++i]);
  }
  return { input, worldBank };
}

function monthlyAverage(records, monthKey) {
  const monthRows = records.filter((r) => r.date.startsWith(`${monthKey}-`));
  if (!monthRows.length) return null;
  const sum = monthRows.reduce((a, r) => a + r.avgUsdOz, 0);
  return roundStoredUsdOz(sum / monthRows.length);
}

/**
 * Parse FreeGoldAPI latest.json — top-level array of { date, price, source }.
 * @param {unknown} data
 * @returns {{
 *   status: 'ok' | 'schema_invalid' | 'no_eligible_rows',
 *   map: Map<string, { price: number, source: string }>,
 *   rowCount: number,
 *   eligibleCount: number,
 *   errors: string[],
 * }}
 */
export function parseFreeGoldResponse(data) {
  const errors = [];
  if (!Array.isArray(data)) {
    return {
      status: 'schema_invalid',
      map: new Map(),
      rowCount: 0,
      eligibleCount: 0,
      errors: ['response is not a top-level array'],
    };
  }

  const map = new Map();
  let eligibleCount = 0;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || typeof row !== 'object') {
      errors.push(`row ${i}: not an object`);
      continue;
    }
    const date = String(row.date || '').slice(0, 10);
    const source = String(row.source || '').trim();
    const price = Number(row.price);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      errors.push(`row ${i}: invalid date`);
      continue;
    }
    if (!Number.isFinite(price) || price <= 0) {
      errors.push(`row ${i}: malformed price`);
      continue;
    }
    if (!FREE_GOLD_ACCEPTABLE_SOURCES.includes(source)) {
      continue;
    }
    if (date > FREE_GOLD_MAX_DATE) {
      continue;
    }

    eligibleCount++;
    if (map.has(date)) {
      errors.push(`duplicate eligible date: ${date}`);
      continue;
    }
    map.set(date, { price: roundStoredUsdOz(price), source });
  }

  if (map.size === 0) {
    return {
      status: eligibleCount === 0 ? 'no_eligible_rows' : 'schema_invalid',
      map,
      rowCount: data.length,
      eligibleCount,
      errors,
    };
  }

  return {
    status: errors.length ? 'schema_invalid' : 'ok',
    map,
    rowCount: data.length,
    eligibleCount: map.size,
    errors,
  };
}

/**
 * @param {typeof fetch} fetchFn
 * @returns {Promise<{
 *   status: 'ok' | 'endpoint_unavailable' | 'schema_invalid' | 'no_eligible_rows',
 *   map: Map<string, { price: number, source: string }>,
 *   rowCount: number,
 *   eligibleCount: number,
 *   errors: string[],
 * }>}
 */
export async function fetchFreeGoldByDate(fetchFn = fetch) {
  try {
    const res = await fetchFn(FREE_GOLD_URL, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return {
        status: 'endpoint_unavailable',
        map: new Map(),
        rowCount: 0,
        eligibleCount: 0,
        errors: [`HTTP ${res.status}`],
      };
    }
    const data = await res.json();
    const parsed = parseFreeGoldResponse(data);
    return { ...parsed, status: parsed.status };
  } catch (err) {
    return {
      status: 'endpoint_unavailable',
      map: new Map(),
      rowCount: 0,
      eligibleCount: 0,
      errors: [err instanceof Error ? err.message : String(err)],
    };
  }
}

/**
 * Pick up to `count` dates from the intersection of production records and FreeGold map.
 * @param {Array<{date: string, avgUsdOz: number}>} records
 * @param {Map<string, { price: number, source: string }>} freegoldMap
 * @param {number} [count]
 */
export function pickIntersectionDates(records, freegoldMap, count = 10) {
  const intersection = records
    .filter((r) => r.date <= FREE_GOLD_MAX_DATE && freegoldMap.has(r.date))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (intersection.length === 0) return [];
  if (intersection.length <= count) return intersection;

  const out = [];
  const step = Math.floor(intersection.length / count);
  for (let i = 0; i < count; i++) {
    out.push(intersection[Math.min(i * step, intersection.length - 1)]);
  }
  return out;
}

/**
 * @param {string} fixturePath
 */
export function loadWorldBankFixture(fixturePath) {
  if (!fs.existsSync(fixturePath)) {
    throw new Error(`World Bank fixture not found: ${fixturePath}`);
  }
  const doc = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
  const required = [
    'source',
    'sourceUrl',
    'retrievedAt',
    'workbookSha256',
    'sheet',
    'series',
    'unit',
    'records',
  ];
  const missing = required.filter((k) => !doc[k]);
  if (missing.length) {
    throw new Error(`World Bank fixture missing metadata: ${missing.join(', ')}`);
  }
  if (!Array.isArray(doc.records) || doc.records.length === 0) {
    throw new Error('World Bank fixture has no records');
  }
  const byMonth = new Map();
  for (const row of doc.records) {
    if (!row?.month || !Number.isFinite(Number(row.priceUsdPerTroyOz))) {
      throw new Error(`invalid World Bank record: ${JSON.stringify(row)}`);
    }
    byMonth.set(row.month, Number(row.priceUsdPerTroyOz));
  }
  return { meta: doc, byMonth };
}

/**
 * @param {Array<{date: string, avgUsdOz: number}>} records
 * @param {Map<string, { price: number, source: string }>} freegoldMap
 */
export function buildDailyCrossValidationRows(records, freegoldMap) {
  const picks = pickIntersectionDates(records, freegoldMap, 10);
  if (picks.length === 0) {
    return {
      status: freegoldMap.size === 0 ? 'no_eligible_rows' : 'no_date_intersection',
      rows: [],
      methodologyWarning:
        'Secondary consistency check only; FreeGoldAPI yahoo_finance rows may not be independent of gold-api.com if both trace to Yahoo Finance.',
    };
  }

  const rows = picks.map((row) => {
    const compare = freegoldMap.get(row.date);
    const diff = Math.abs(row.avgUsdOz - compare.price);
    const pct = (diff / compare.price) * 100;
    return {
      date: row.date,
      goldApiAvg: row.avgUsdOz,
      compareValue: compare.price,
      compareSource: compare.source,
      absoluteDiff: roundStoredUsdOz(diff),
      percentDiff: roundStoredUsdOz(pct),
      methodology:
        'gold-api daily avg vs FreeGoldAPI daily (QA only; secondary check, not merged into production)',
      methodologyWarning:
        'Secondary consistency check; sources may not be statistically independent if both rely on Yahoo Finance.',
      result: pct <= CROSS_VALIDATION_MAX_PCT ? 'pass' : 'fail',
      status: pct <= CROSS_VALIDATION_MAX_PCT ? 'pass' : 'fail',
    };
  });

  return {
    status: 'comparison_completed',
    rows,
    methodologyWarning:
      'Secondary consistency check only; FreeGoldAPI yahoo_finance rows may not be independent of gold-api.com if both trace to Yahoo Finance.',
  };
}

/**
 * @param {Array<{date: string, avgUsdOz: number}>} records
 * @param {Map<string, number>} worldBankByMonth
 */
export function buildMonthlyCrossValidationRows(records, worldBankByMonth) {
  const monthlyRows = [];
  for (const [month, wbValue] of worldBankByMonth.entries()) {
    const avg = monthlyAverage(records, month);
    if (avg == null) {
      monthlyRows.push({ month, goldApiMonthlyAvg: null, worldBank: wbValue, status: 'no_data' });
      continue;
    }
    const diff = Math.abs(avg - wbValue);
    const pct = (diff / wbValue) * 100;
    monthlyRows.push({
      month,
      goldApiMonthlyAvg: avg,
      worldBank: wbValue,
      absoluteDiff: roundStoredUsdOz(diff),
      percentDiff: roundStoredUsdOz(pct),
      methodology: 'mean of gold-api daily avgs vs World Bank Pink Sheet monthly (methodology differs)',
      status: pct <= MONTHLY_TOLERANCE_PCT ? 'pass' : 'warn',
    });
  }
  return monthlyRows;
}

async function main() {
  const { input, worldBank } = parseArgs(process.argv);
  if (!fs.existsSync(input)) {
    console.error(`ERROR: input not found: ${input}`);
    process.exit(1);
  }
  const doc = JSON.parse(fs.readFileSync(input, 'utf8'));
  const prov = validateProductionProvenance(doc);
  if (!prov.ok) {
    console.error(`ERROR: input lacks production provenance — ${prov.errors.join(', ')}`);
    process.exit(1);
  }

  const records = doc.records || [];
  const freegoldResult = await fetchFreeGoldByDate();

  console.log('--- FreeGoldAPI fetch status ---');
  console.log({
    status: freegoldResult.status,
    rowCount: freegoldResult.rowCount,
    eligibleCount: freegoldResult.eligibleCount,
    errors: freegoldResult.errors.slice(0, 3),
  });

  if (freegoldResult.status === 'endpoint_unavailable') {
    console.error('ERROR: FreeGoldAPI endpoint unavailable');
    process.exit(1);
  }
  if (freegoldResult.status === 'schema_invalid') {
    console.error(`ERROR: FreeGoldAPI schema invalid — ${freegoldResult.errors.join('; ')}`);
    process.exit(1);
  }
  if (freegoldResult.status === 'no_eligible_rows') {
    console.error('ERROR: FreeGoldAPI returned no eligible recent USD rows');
    process.exit(1);
  }

  const daily = buildDailyCrossValidationRows(records, freegoldResult.map);
  console.log('--- daily cross-validation (10 dates, QA only) ---');
  console.log(`overlap status: ${daily.status}`);
  if (daily.methodologyWarning) console.log(`note: ${daily.methodologyWarning}`);
  console.table(daily.rows);

  if (daily.status === 'no_date_intersection') {
    console.error('ERROR: no date intersection between production dataset and FreeGoldAPI');
    process.exit(1);
  }
  if (daily.rows.length < 10) {
    console.error(`ERROR: expected 10 overlap comparisons, got ${daily.rows.length}`);
    process.exit(1);
  }

  const { meta: wbMeta, byMonth } = loadWorldBankFixture(worldBank);
  console.log('--- World Bank fixture provenance ---');
  console.log({
    source: wbMeta.source,
    sourceUrl: wbMeta.sourceUrl,
    downloadUrl: wbMeta.downloadUrl,
    workbookSha256: wbMeta.workbookSha256,
    sheet: wbMeta.sheet,
    series: wbMeta.series,
    unit: wbMeta.unit,
    retrievedAt: wbMeta.retrievedAt,
  });

  console.log('--- monthly aggregate validation (World Bank Pink Sheet QA) ---');
  const monthlyRows = buildMonthlyCrossValidationRows(records, byMonth);
  console.table(monthlyRows);

  const dailyFails = daily.rows.filter((r) => r.status === 'fail');
  const monthlyWarns = monthlyRows.filter((r) => r.status === 'warn');
  if (dailyFails.length) {
    console.error(`ERROR: ${dailyFails.length} daily cross-check(s) exceeded tolerance`);
    process.exit(1);
  }
  if (monthlyWarns.length) {
    console.warn(
      `WARN: ${monthlyWarns.length} monthly aggregate(s) exceeded ${MONTHLY_TOLERANCE_PCT}% — investigate`
    );
  }
  console.log('cross-validation complete');
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  main().catch((err) => {
    console.error(`ERROR: ${err.message}`);
    process.exit(1);
  });
}
