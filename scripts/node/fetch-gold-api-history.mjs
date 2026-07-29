#!/usr/bin/env node
/**
 * Fetch daily XAU/USD history from gold-api.com.
 *
 * Usage:
 *   node scripts/node/fetch-gold-api-history.mjs [--output path] [--days N] [--check]
 *   node scripts/node/fetch-gold-api-history.mjs --fixture path --output /tmp/out.json
 *   node scripts/node/fetch-gold-api-history.mjs --diagnose-schema
 *
 * Requires GOLD_API_KEY (preferred) or GOLD_API_COM_KEY for live/diagnose modes.
 * Never logs the key. Fixture mode must not write to data/historical/xau-usd-daily.json.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AGGREGATION,
  DATA_ORIGIN_FIXTURE,
  DATA_ORIGIN_LIVE,
  DEFAULT_WINDOW_DAYS,
  ENDPOINT_TYPE,
  PROVIDER,
  PRODUCTION_REL_PATH,
  buildDatasetDocument,
  buildHistoryRequestParams,
  buildHistoryUrl,
  diagnoseProviderResponse,
  formatRejectionSummary,
  isProductionDataPath,
  parseProviderHistoryBody,
  sha256Hex,
  validateDailyDataset,
  validateDatasetDocument,
  validateProductionProvenance,
  analyzeAuthenticity,
  CROSS_VALIDATION_MAX_PCT,
  roundStoredUsdOz,
} from '../../src/lib/gold-api-daily-history-contract.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DEFAULT_OUTPUT = path.join(ROOT, PRODUCTION_REL_PATH);

function parseArgs(argv) {
  const opts = {
    output: DEFAULT_OUTPUT,
    days: DEFAULT_WINDOW_DAYS,
    check: false,
    fixture: null,
    diagnoseSchema: false,
    referenceDate: new Date().toISOString().slice(0, 10),
  };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--check') opts.check = true;
    else if (arg === '--diagnose-schema') opts.diagnoseSchema = true;
    else if (arg === '--output') opts.output = path.resolve(argv[++i]);
    else if (arg === '--days') opts.days = Number(argv[++i]);
    else if (arg === '--fixture') opts.fixture = path.resolve(argv[++i]);
    else if (arg === '--reference-date') opts.referenceDate = argv[++i];
    else if (arg === '--help' || arg === '-h') {
      console.log(`Usage: node scripts/node/fetch-gold-api-history.mjs [options]
  --output <path>         Output JSON path (default: ${PRODUCTION_REL_PATH})
  --days <n>              Calendar days to request (default: ${DEFAULT_WINDOW_DAYS})
  --check                 Validate existing file only; do not fetch
  --fixture <path>        Use fixture provider response (cannot target production path)
  --diagnose-schema       Call live API and print secret-free schema diagnostics
  --reference-date <d>    Audit date YYYY-MM-DD (default: today UTC)`);
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

function collectWorkflowMeta() {
  const runId = process.env.GITHUB_RUN_ID;
  if (!runId) return null;
  return {
    repository: process.env.GITHUB_REPOSITORY || null,
    runId,
    runAttempt: process.env.GITHUB_RUN_ATTEMPT || '1',
    commitSha: process.env.GITHUB_SHA || null,
    ref: process.env.GITHUB_REF || null,
  };
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
 * @returns {Promise<{ body: unknown, status: number, contentType: string, rawText: string, requestParams: object, requestUrl: string }>}
 */
async function fetchHistory(apiKey, days, referenceDate) {
  const requestParams = buildHistoryRequestParams(days, referenceDate);
  const url = buildHistoryUrl(requestParams);
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'x-api-key': apiKey,
    },
  });
  const rawText = await response.text();
  const contentType = response.headers.get('content-type') || 'unknown';
  let body;
  try {
    body = JSON.parse(rawText);
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
  return { body, status: response.status, contentType, rawText, requestParams, requestUrl: url };
}

function printRequestSummary(requestParams) {
  console.log('--- request summary (secret-free) ---');
  console.log('symbol=XAU');
  console.log('groupBy=day');
  console.log('aggregation=avg');
  console.log('orderBy=asc');
  console.log(`startDate=${requestParams.startDate}`);
  console.log(`endDate=${requestParams.endDate}`);
  console.log(`startTimestamp=${requestParams.startTimestamp}`);
  console.log(`endTimestamp=${requestParams.endTimestamp}`);
  console.log(`timestampUnit=${requestParams.timestampUnit}`);
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
    if (k === 'crossValidation' || k === 'rejectionTally' || k === 'authenticity') continue;
    console.log(`${k}: ${v}`);
  }
  if (summary.rejectionTally) {
    console.log(`rejectedSummary: ${formatRejectionSummary(summary.rejectionTally)}`);
  }
  if (summary.authenticity?.warnings?.length) {
    console.log(`authenticityWarnings: ${summary.authenticity.warnings.join('; ')}`);
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

function assertNotFixtureToProduction(opts) {
  if (opts.fixture && isProductionDataPath(opts.output, ROOT)) {
    console.error(
      `ERROR: Fixture mode cannot write to production path (${PRODUCTION_REL_PATH}). Use a temp/test output path.`
    );
    process.exit(1);
  }
}

async function runDiagnose(opts) {
  const apiKey = resolveApiKey();
  const requestParams = buildHistoryRequestParams(opts.days, opts.referenceDate);
  printRequestSummary(requestParams);
  let result;
  try {
    result = await fetchHistory(apiKey, opts.days, opts.referenceDate);
  } catch (err) {
    console.error(`ERROR: diagnose fetch failed — ${err.message}`);
    process.exit(1);
  }

  const rawSha256 = sha256Hex(result.rawText);
  const diag = diagnoseProviderResponse(result.body, {
    status: result.status,
    contentType: result.contentType,
    byteLength: Buffer.byteLength(result.rawText, 'utf8'),
    rawSha256,
  });

  const rows = Array.isArray(result.body) ? result.body : [];
  const sample = {
    firstRows: rows.slice(0, 3),
    lastRows: rows.slice(-3),
    keys: diag.firstRowKeys,
    fieldTypes: diag.firstRowFieldTypes,
  };

  const outDir = path.join(ROOT, 'reports/gold-api-history');
  fs.mkdirSync(outDir, { recursive: true });
  const diagPath = path.join(outDir, 'diagnose-schema.json');
  const samplePath = path.join(outDir, 'diagnose-schema-sample.json');
  fs.writeFileSync(diagPath, `${JSON.stringify(diag, null, 2)}\n`, 'utf8');
  fs.writeFileSync(samplePath, `${JSON.stringify(sample, null, 2)}\n`, 'utf8');

  console.log('--- diagnose-schema (secret-free) ---');
  console.log(JSON.stringify(diag, null, 2));
  console.log(`diagnosticArtifact: ${path.relative(ROOT, diagPath)}`);
  console.log(`sampleArtifact: ${path.relative(ROOT, samplePath)}`);
}

async function main() {
  const opts = parseArgs(process.argv);
  assertNotFixtureToProduction(opts);

  if (opts.diagnoseSchema) {
    await runDiagnose(opts);
    return;
  }

  if (opts.check) {
    if (!fs.existsSync(opts.output)) {
      console.error(`ERROR: File not found: ${opts.output}`);
      process.exit(1);
    }
    const doc = JSON.parse(fs.readFileSync(opts.output, 'utf8'));
    const requireProv = isProductionDataPath(opts.output, ROOT);
    const result = validateDatasetDocument(doc, opts.referenceDate, {
      requireProductionProvenance: requireProv,
    });
    const prov = requireProv ? validateProductionProvenance(doc) : { ok: true, errors: [] };
    printSummary({
      mode: 'check',
      ok: result.ok && prov.ok,
      errors: [...result.errors, ...prov.errors].join(', ') || 'none',
      dataOrigin: doc.dataOrigin || 'missing',
      workflowRunId: doc.workflow?.runId || 'missing',
      recordCount: result.records.length,
      start: result.records[0]?.date,
      end: result.records[result.records.length - 1]?.date,
      rawResponseSha256: doc.rawResponseSha256 || 'missing',
    });
    process.exit(result.ok && prov.ok ? 0 : 1);
  }

  let body;
  let rawText;
  let requestParams;
  let dataOrigin;
  let workflow = null;

  if (opts.fixture) {
    rawText = fs.readFileSync(opts.fixture, 'utf8');
    body = JSON.parse(rawText);
    requestParams = buildHistoryRequestParams(opts.days, opts.referenceDate);
    dataOrigin = DATA_ORIGIN_FIXTURE;
  } else {
    const apiKey = resolveApiKey();
    printRequestSummary(buildHistoryRequestParams(opts.days, opts.referenceDate));
    try {
      const result = await fetchHistory(apiKey, opts.days, opts.referenceDate);
      body = result.body;
      rawText = result.rawText;
      requestParams = result.requestParams;
    } catch (err) {
      console.error(`ERROR: fetch failed — ${err.message}`);
      process.exit(1);
    }
    dataOrigin = DATA_ORIGIN_LIVE;
    workflow = collectWorkflowMeta();
    if (!workflow?.runId) {
      console.error(
        'ERROR: Live fetch requires GitHub Actions workflow metadata (GITHUB_RUN_ID). Use workflow_dispatch on a trusted runner.'
      );
      process.exit(1);
    }
  }

  const rawResponseSha256 = sha256Hex(rawText);
  const {
    records,
    rejected,
    rejectionTally,
    providerResponseRecordCount,
    errors: parseErrors,
  } = parseProviderHistoryBody(body, opts.referenceDate);

  if (parseErrors.length) {
    console.error(`ERROR: parse failed — ${parseErrors.join(', ')}`);
    if (rejected > 0) {
      console.error(`rejectedSummary: ${formatRejectionSummary(rejectionTally)}`);
    }
    printSummary({
      mode: 'parse_failed',
      recordsFetched: records.length,
      providerResponseRecordCount,
      rejected,
      rejectionTally,
    });
    process.exit(1);
  }

  const validation = validateDailyDataset(records, opts.referenceDate);
  if (!validation.ok) {
    console.error(`ERROR: validation failed — ${validation.errors.join(', ')}`);
    printSummary({
      mode: 'validate_failed',
      recordsFetched: records.length,
      providerResponseRecordCount,
      rejected,
      rejectionTally,
      ...validation.stats,
    });
    process.exit(1);
  }

  const authenticity = analyzeAuthenticity(records);
  if (authenticity.fatal && dataOrigin === DATA_ORIGIN_LIVE) {
    console.error(`ERROR: authenticity fatal — ${authenticity.warnings.join(', ')}`);
    process.exit(1);
  }

  const crossValidation =
    dataOrigin === DATA_ORIGIN_LIVE ? await crossValidateSample(records) : { ok: true, reason: 'fixture_mode' };
  if (!crossValidation.ok && crossValidation.reason === 'tolerance_exceeded') {
    console.error('ERROR: cross-validation tolerance exceeded');
    printSummary({
      mode: 'cross_validation_failed',
      recordsFetched: records.length,
      rejected,
      rejectionTally,
      crossValidation,
      ...validation.stats,
    });
    process.exit(1);
  }

  const retrievedAt = new Date().toISOString();
  const document = buildDatasetDocument({
    records,
    retrievedAt,
    dataOrigin,
    providerResponseRecordCount,
    rejectedRecordCount: rejected,
    rejectionTally,
    rawResponseSha256,
    request: requestParams,
    workflow,
    authenticity: authenticity.stats,
  });

  if (dataOrigin === DATA_ORIGIN_LIVE) {
    const prov = validateProductionProvenance(document);
    if (!prov.ok) {
      console.error(`ERROR: production provenance invalid — ${prov.errors.join(', ')}`);
      process.exit(1);
    }
  }

  const previousExists = fs.existsSync(opts.output);
  const previous = previousExists ? fs.readFileSync(opts.output, 'utf8') : null;
  const next = `${JSON.stringify(document, null, 2)}\n`;

  if (previous === next) {
    printSummary({
      mode: 'unchanged',
      dataOrigin,
      recordsFetched: records.length,
      providerResponseRecordCount,
      rejected,
      rejectionTally,
      wrote: false,
      rawResponseSha256,
      workflowRunId: workflow?.runId || 'n/a',
      crossValidation: { reason: crossValidation.reason },
      authenticity,
      ...validation.stats,
    });
    return;
  }

  fs.mkdirSync(path.dirname(opts.output), { recursive: true });
  fs.writeFileSync(opts.output, next, 'utf8');

  printSummary({
    mode: 'written',
    dataOrigin,
    recordsFetched: records.length,
    providerResponseRecordCount,
    rejected,
    rejectionTally,
    wrote: true,
    output: path.relative(ROOT, opts.output),
    provider: PROVIDER,
    endpointType: ENDPOINT_TYPE,
    aggregation: AGGREGATION,
    rawResponseSha256,
    normalizedRecordsSha256: document.normalizedRecordsSha256,
    workflowRunId: workflow?.runId || 'n/a',
    crossValidation: {
      reason: crossValidation.reason,
      sampleCount: crossValidation.samples?.length || 0,
    },
    authenticity,
    ...validation.stats,
  });
}

main().catch((err) => {
  console.error(`ERROR: ${err.message}`);
  process.exit(1);
});
