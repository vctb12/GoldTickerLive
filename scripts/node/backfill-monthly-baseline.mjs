#!/usr/bin/env node
/**
 * scripts/node/backfill-monthly-baseline.mjs — append real monthly gold averages to the baseline.
 *
 * Phase 46. The homepage "Price History" table + tracker long-range history read
 * `src/data/historical-baseline.json`. When it stops short, the owner backfills the missing months
 * with REAL monthly averages (from their `price_history` export or a verified public dataset), then
 * runs this script to land them safely. It NEVER overwrites an existing month and NEVER invents data.
 *
 * Usage:
 *   node scripts/node/backfill-monthly-baseline.mjs [input.json]
 *
 * `input.json` is an array of { "date": "YYYY-MM", "price": <number> } rows. Rows with a null/absent
 * price are ignored (so the shipped template can be filled incrementally). Defaults to the template
 * at reports/data/PHASE-46-monthly-baseline-backfill.template.json.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  validateMonthlyRows,
  mergeMonthlyBaseline,
  findMonthlyGaps,
} from '../../src/lib/monthly-baseline-merge.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BASELINE = path.join(ROOT, 'src/data/historical-baseline.json');
const DEFAULT_INPUT = path.join(ROOT, 'reports/data/PHASE-46-monthly-baseline-backfill.template.json');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function main() {
  const inputPath = process.argv[2] || DEFAULT_INPUT;
  const baseline = readJson(BASELINE);
  const rawInput = readJson(inputPath);

  // Only rows with a real numeric price — the template ships with nulls for the owner to fill in.
  const incoming = (Array.isArray(rawInput) ? rawInput : []).filter(
    (r) => r && typeof r.price === 'number' && Number.isFinite(r.price)
  );

  if (incoming.length === 0) {
    const gaps = findMonthlyGaps(baseline);
    console.log(
      `No priced rows in ${path.relative(ROOT, inputPath)}. Nothing to backfill.\n` +
        `Baseline currently ends at ${baseline[baseline.length - 1]?.date}. ` +
        (gaps.length ? `Missing months: ${gaps.join(', ')}` : 'No internal gaps.')
    );
    return;
  }

  const { ok, errors } = validateMonthlyRows(incoming);
  if (!ok) {
    console.error('Refusing to write — invalid rows:\n  ' + errors.join('\n  '));
    process.exit(1);
  }

  const { merged, added, skipped } = mergeMonthlyBaseline(baseline, incoming);
  fs.writeFileSync(BASELINE, JSON.stringify(merged, null, 2) + '\n');
  console.log(
    `Backfilled ${added.length} month(s): ${added.join(', ') || '(none)'}` +
      (skipped.length ? `\nSkipped ${skipped.length} already-present month(s): ${skipped.join(', ')}` : '') +
      `\nBaseline now ends at ${merged[merged.length - 1].date} (${merged.length} rows).`
  );
}

main();
