#!/usr/bin/env node
/**
 * QA cross-validation for gold-api.com daily history (not merged into production file).
 *
 * Usage:
 *   node scripts/node/cross-validate-gold-api-history.mjs [--input path]
 *
 * Compares:
 *  A) 10 overlapping daily dates vs FreeGoldAPI (pre-2026-02-20 overlap only)
 *  B) Monthly aggregates vs World Bank Pink Sheet proxy constants (documented tolerance)
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

/** World Bank Pink Sheet monthly USD/oz (QA reference — not merged). Source documented in report. */
const WORLD_BANK_MONTHLY_QA = Object.freeze({
  '2025-06': 3342.87,
  '2025-07': 3289.68,
  '2025-08': 3347.4,
  '2025-09': 3636.87,
  '2025-10': 3977.35,
  '2025-11': 4067.38,
  '2025-12': 4216.29,
});

const MONTHLY_TOLERANCE_PCT = 8.0;

function parseArgs(argv) {
  let input = DEFAULT_INPUT;
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--input') input = path.resolve(argv[++i]);
  }
  return { input };
}

function monthlyAverage(records, monthKey) {
  const monthRows = records.filter((r) => r.date.startsWith(`${monthKey}-`));
  if (!monthRows.length) return null;
  const sum = monthRows.reduce((a, r) => a + r.avgUsdOz, 0);
  return roundStoredUsdOz(sum / monthRows.length);
}

async function fetchFreeGoldByDate() {
  try {
    const res = await fetch('https://freegoldapi.com/data/latest.json', {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data?.prices)) return null;
    return new Map(
      data.prices
        .filter((p) => p?.date && Number(p?.price) > 0)
        .map((p) => [String(p.date).slice(0, 10), Number(p.price)])
    );
  } catch {
    return null;
  }
}

function pickTenDates(records) {
  const eligible = records.filter((r) => r.date <= '2026-02-20');
  if (eligible.length < 10) return eligible.filter((_, i) => i % Math.ceil(eligible.length / 10) === 0).slice(0, 10);
  const out = [];
  const step = Math.floor(eligible.length / 10);
  for (let i = 0; i < 10; i++) out.push(eligible[i * step]);
  return out;
}

async function main() {
  const { input } = parseArgs(process.argv);
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
  const freegold = await fetchFreeGoldByDate();

  console.log('--- daily cross-validation (10 dates, QA only) ---');
  const picks = pickTenDates(records);
  const dailyRows = [];
  for (const row of picks) {
    const compare = freegold?.get(row.date) ?? null;
    if (compare == null) {
      dailyRows.push({
        date: row.date,
        goldApiAvg: row.avgUsdOz,
        compareValue: null,
        status: 'no_overlap',
      });
      continue;
    }
    const diff = Math.abs(row.avgUsdOz - compare);
    const pct = (diff / compare) * 100;
    dailyRows.push({
      date: row.date,
      goldApiAvg: row.avgUsdOz,
      compareValue: roundStoredUsdOz(compare),
      absoluteDiff: roundStoredUsdOz(diff),
      percentDiff: roundStoredUsdOz(pct),
      methodology: 'gold-api daily avg vs FreeGoldAPI daily (QA only)',
      status: pct <= CROSS_VALIDATION_MAX_PCT ? 'pass' : 'fail',
    });
  }
  console.table(dailyRows);

  console.log('--- monthly aggregate validation (World Bank Pink Sheet QA) ---');
  const monthlyRows = [];
  for (const [month, wbValue] of Object.entries(WORLD_BANK_MONTHLY_QA)) {
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
      methodology: 'mean of gold-api daily avgs vs WB monthly (methodology differs)',
      status: pct <= MONTHLY_TOLERANCE_PCT ? 'pass' : 'warn',
    });
  }
  console.table(monthlyRows);

  const dailyFails = dailyRows.filter((r) => r.status === 'fail');
  const monthlyWarns = monthlyRows.filter((r) => r.status === 'warn');
  if (dailyFails.length) {
    console.error(`ERROR: ${dailyFails.length} daily cross-check(s) exceeded tolerance`);
    process.exit(1);
  }
  if (monthlyWarns.length) {
    console.warn(`WARN: ${monthlyWarns.length} monthly aggregate(s) exceeded ${MONTHLY_TOLERANCE_PCT}% — investigate`);
  }
  console.log('cross-validation complete');
}

main().catch((err) => {
  console.error(`ERROR: ${err.message}`);
  process.exit(1);
});
