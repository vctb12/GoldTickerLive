#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const {
  OBSERVATION_SCHEMA_VERSION,
  PROVIDER_DIVERGENCE_THRESHOLD_BPS,
  buildObservationRows,
  buildProviderRunRows,
  computeProviderHealthRows,
  floorTimestampToSlot,
  stableJsonStringify,
  validatePricePayload,
} = require('../../server/lib/price-snapshots');

const DEFAULT_ROOT = path.resolve(__dirname, '../..');
const SYMBOL = 'XAUUSD';
const HISTORY_RELATIVE_DIR = path.join('data', 'history', 'xau-usd');
const PROVIDER_HEALTH_RELATIVE_DIR = path.join('data', 'provider-health');
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const STATIC_HOURLY_DAYS = 31;
const STATIC_DAILY_DAYS = 366;

function parseIso(value) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function atomicWriteJson(filePath, payload) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  fs.renameSync(tempPath, filePath);
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function periodForObservation(row) {
  const timestamp = parseIso(row?.timestamp_utc);
  return timestamp ? timestamp.slice(0, 7) : null;
}

function immutableIdentity(row) {
  return {
    observation_id: row.observation_id,
    symbol: row.symbol,
    source_provider: row.source_provider,
    timestamp_utc: parseIso(row.timestamp_utc),
    xau_usd_per_oz: Number(row.xau_usd_per_oz),
  };
}

function mergeObservationRows(existingRows, incomingRows) {
  const rows = new Map();
  for (const row of Array.isArray(existingRows) ? existingRows : []) {
    if (row?.observation_id) rows.set(row.observation_id, row);
  }
  let duplicateCount = 0;
  let insertedCount = 0;
  for (const row of Array.isArray(incomingRows) ? incomingRows : []) {
    if (!row?.observation_id || !parseIso(row.timestamp_utc)) continue;
    const existing = rows.get(row.observation_id);
    if (existing) {
      if (
        stableJsonStringify(immutableIdentity(existing)) !==
        stableJsonStringify(immutableIdentity(row))
      ) {
        throw new Error(`immutable observation identity conflict: ${row.observation_id}`);
      }
      duplicateCount += 1;
      continue;
    }
    rows.set(row.observation_id, row);
    insertedCount += 1;
  }
  return {
    rows: [...rows.values()].sort(
      (a, b) =>
        String(a.timestamp_utc).localeCompare(String(b.timestamp_utc)) ||
        String(a.observation_id).localeCompare(String(b.observation_id))
    ),
    duplicateCount,
    insertedCount,
  };
}

function isOpenMarketSlot(timestampUtc) {
  const date = new Date(timestampUtc);
  if (!Number.isFinite(date.getTime())) return false;
  const day = date.getUTCDay();
  const hour = date.getUTCHours();
  if (day >= 1 && day <= 4) return true;
  if (day === 5) return hour <= 20;
  return day === 0 && hour >= 21;
}

function expectedOpenMarketSlots(startUtc, endUtc) {
  const startSlot = floorTimestampToSlot(startUtc);
  const endSlot = floorTimestampToSlot(endUtc);
  if (!startSlot || !endSlot) return 0;
  let count = 0;
  for (
    let cursor = new Date(startSlot).getTime();
    cursor <= new Date(endSlot).getTime();
    cursor += 5 * 60 * 1000
  ) {
    if (isOpenMarketSlot(new Date(cursor).toISOString())) count += 1;
  }
  return count;
}

function bucketStart(timestampUtc, interval) {
  const date = new Date(timestampUtc);
  if (!Number.isFinite(date.getTime())) return null;
  if (interval === '1d') date.setUTCHours(0, 0, 0, 0);
  else date.setUTCMinutes(0, 0, 0);
  return date.toISOString();
}

function buildRollups(observations, interval) {
  const selected = (Array.isArray(observations) ? observations : [])
    .filter((row) => row.is_selected !== false && Number(row.xau_usd_per_oz) > 0)
    .sort(
      (a, b) =>
        String(a.timestamp_utc).localeCompare(String(b.timestamp_utc)) ||
        String(a.observation_id).localeCompare(String(b.observation_id))
    );
  const groups = new Map();
  for (const row of selected) {
    const bucket = bucketStart(row.timestamp_utc, interval);
    if (!bucket) continue;
    if (!groups.has(bucket)) groups.set(bucket, []);
    groups.get(bucket).push(row);
  }
  return [...groups.entries()].map(([bucketStartUtc, rows]) => {
    const prices = rows.map((row) => Number(row.xau_usd_per_oz));
    const providers = {};
    for (const row of rows) {
      providers[row.source_provider] = (providers[row.source_provider] || 0) + 1;
    }
    const duration = interval === '1d' ? DAY_MS : HOUR_MS;
    return {
      bucketStartUtc,
      bucketEndUtc: new Date(new Date(bucketStartUtc).getTime() + duration).toISOString(),
      open: prices[0],
      high: Math.max(...prices),
      low: Math.min(...prices),
      close: prices[prices.length - 1],
      observationCount: rows.length,
      freshCount: rows.filter((row) => row.is_fresh === true).length,
      fallbackCount: rows.filter((row) => row.is_fallback === true).length,
      providerDistribution: Object.fromEntries(
        Object.entries(providers).sort(([left], [right]) => left.localeCompare(right))
      ),
    };
  });
}

function boundRollups(points, latestTimestampUtc, days) {
  if (!latestTimestampUtc) return [];
  const cutoff = new Date(latestTimestampUtc).getTime() - days * DAY_MS;
  return points.filter((point) => new Date(point.bucketStartUtc).getTime() >= cutoff);
}

function buildQualityProfile(observations, providerRuns, { duplicateCount = 0 } = {}) {
  const selected = (Array.isArray(observations) ? observations : [])
    .filter((row) => row.is_selected !== false)
    .sort(
      (a, b) =>
        String(a.timestamp_utc).localeCompare(String(b.timestamp_utc)) ||
        String(a.observation_id).localeCompare(String(b.observation_id))
    );
  const first = selected[0]?.timestamp_utc || null;
  const last = selected[selected.length - 1]?.timestamp_utc || null;
  const observedSlots = new Set(
    selected
      .map((row) => row.slot_5m_utc || floorTimestampToSlot(row.timestamp_utc))
      .filter(Boolean)
  );
  const expectedSlots = first && last ? expectedOpenMarketSlots(first, last) : 0;
  const openObservedSlots = [...observedSlots].filter(isOpenMarketSlot).length;
  const missingSlots = Math.max(0, expectedSlots - openObservedSlots);
  const providerDistribution = {};
  for (const row of selected) {
    providerDistribution[row.source_provider] =
      (providerDistribution[row.source_provider] || 0) + 1;
  }
  let sourceTransitionCount = 0;
  for (let index = 1; index < selected.length; index += 1) {
    if (selected[index].source_provider !== selected[index - 1].source_provider) {
      sourceTransitionCount += 1;
    }
  }
  const runs = Array.isArray(providerRuns) ? providerRuns : [];
  return {
    observationCount: selected.length,
    firstObservationUtc: first,
    lastObservationUtc: last,
    duplicateCount,
    duplicateRate:
      selected.length + duplicateCount > 0
        ? Number((duplicateCount / (selected.length + duplicateCount)).toFixed(6))
        : 0,
    expectedOpenMarket5mSlots: expectedSlots,
    observedOpenMarket5mSlots: openObservedSlots,
    missingOpenMarket5mSlots: missingSlots,
    missingOpenMarketSlotRate:
      expectedSlots > 0 ? Number((missingSlots / expectedSlots).toFixed(6)) : null,
    fallbackObservationCount: selected.filter((row) => row.is_fallback === true).length,
    staleObservationCount: selected.filter((row) => row.is_fresh !== true).length,
    providerDistribution: Object.fromEntries(
      Object.entries(providerDistribution).sort(([left], [right]) => left.localeCompare(right))
    ),
    sourceTransitionCount,
    providerAttemptCount: runs.length,
    providerSuccessCount: runs.filter((row) => row.status === 'success').length,
    providerDivergenceEventCount: runs.filter(
      (row) => Math.abs(Number(row.deviation_bps)) > PROVIDER_DIVERGENCE_THRESHOLD_BPS
    ).length,
    providerFallbackCount: runs.filter((row) => row.status === 'fallback').length,
  };
}

function loadObservationArchives(historyDir) {
  if (!fs.existsSync(historyDir)) return [];
  const files = fs
    .readdirSync(historyDir)
    .filter((name) => /^observations-\d{4}-\d{2}\.json$/.test(name))
    .sort();
  return files.flatMap((name) => {
    const payload = readJson(path.join(historyDir, name), {});
    return Array.isArray(payload?.observations) ? payload.observations : [];
  });
}

function updateObservationArchives(historyDir, incomingRows) {
  const grouped = new Map();
  for (const row of incomingRows) {
    const period = periodForObservation(row);
    if (!period) continue;
    if (!grouped.has(period)) grouped.set(period, []);
    grouped.get(period).push(row);
  }

  let duplicateCount = 0;
  let insertedCount = 0;
  const changedFiles = [];
  for (const [period, rows] of grouped.entries()) {
    const filePath = path.join(historyDir, `observations-${period}.json`);
    const existingPayload = readJson(filePath, {});
    const merged = mergeObservationRows(existingPayload?.observations, rows);
    duplicateCount += merged.duplicateCount;
    insertedCount += merged.insertedCount;
    if (merged.insertedCount > 0 || !fs.existsSync(filePath)) {
      atomicWriteJson(filePath, {
        schemaVersion: OBSERVATION_SCHEMA_VERSION,
        symbol: SYMBOL,
        period,
        source: 'DataCore canonical provider observations',
        immutableIdentity: 'symbol + provider + provider timestamp + normalized USD/oz price',
        observations: merged.rows,
      });
      changedFiles.push(filePath);
    }
  }
  return { duplicateCount, insertedCount, changedFiles };
}

function buildStaticArtifacts({
  root = DEFAULT_ROOT,
  observations = [],
  providerRuns = [],
  providerHealthRows = [],
  syncState = 'local_only',
} = {}) {
  const historyDir = path.join(root, HISTORY_RELATIVE_DIR);
  const providerHealthDir = path.join(root, PROVIDER_HEALTH_RELATIVE_DIR);
  fs.mkdirSync(historyDir, { recursive: true });
  fs.mkdirSync(providerHealthDir, { recursive: true });

  const mergeResult = updateObservationArchives(historyDir, observations);
  const allObservations = loadObservationArchives(historyDir);
  const selected = allObservations.filter((row) => row.is_selected !== false);
  const latestTimestampUtc = selected[selected.length - 1]?.timestamp_utc || null;
  const generatedAtUtc =
    selected[selected.length - 1]?.fetched_at_utc || latestTimestampUtc || null;
  const hourly = boundRollups(
    buildRollups(allObservations, '1h'),
    latestTimestampUtc,
    STATIC_HOURLY_DAYS
  );
  const daily = boundRollups(
    buildRollups(allObservations, '1d'),
    latestTimestampUtc,
    STATIC_DAILY_DAYS
  );
  // Duplicate attempts are workflow-run telemetry. The canonical static dataset is deduplicated,
  // so its quality profile remains byte-reproducible across safe replays of the same observation.
  const quality = buildQualityProfile(allObservations, providerRuns, { duplicateCount: 0 });

  const hourlyPath = path.join(historyDir, 'hourly-latest.json');
  const dailyPath = path.join(historyDir, 'daily-latest.json');
  atomicWriteJson(hourlyPath, {
    schemaVersion: OBSERVATION_SCHEMA_VERSION,
    symbol: SYMBOL,
    interval: '1h',
    sourceMode: 'static-rollup',
    freshnessState: 'historical',
    generatedAtUtc,
    coverage: {
      startTimestampUtc: hourly[0]?.bucketStartUtc || null,
      endTimestampUtc: hourly[hourly.length - 1]?.bucketEndUtc || null,
      pointCount: hourly.length,
    },
    points: hourly,
  });
  atomicWriteJson(dailyPath, {
    schemaVersion: OBSERVATION_SCHEMA_VERSION,
    symbol: SYMBOL,
    interval: '1d',
    sourceMode: 'static-rollup',
    freshnessState: 'historical',
    generatedAtUtc,
    coverage: {
      startTimestampUtc: daily[0]?.bucketStartUtc || null,
      endTimestampUtc: daily[daily.length - 1]?.bucketEndUtc || null,
      pointCount: daily.length,
    },
    points: daily,
  });

  const healthRows = providerHealthRows.length
    ? providerHealthRows
    : computeProviderHealthRows(providerRuns, { nowIso: generatedAtUtc });
  const providerSummaryPath = path.join(providerHealthDir, 'summary.json');
  atomicWriteJson(providerSummaryPath, {
    schemaVersion: OBSERVATION_SCHEMA_VERSION,
    symbol: SYMBOL,
    sourceMode: syncState === 'synced' ? 'supabase-and-workflow' : 'workflow-static',
    freshnessState: 'historical',
    generatedAtUtc,
    syncState,
    quality,
    providers: healthRows,
  });

  const observationFiles = fs
    .readdirSync(historyDir)
    .filter((name) => /^observations-\d{4}-\d{2}\.json$/.test(name))
    .sort();
  const files = [
    ...observationFiles.map((name) => path.join(historyDir, name)),
    hourlyPath,
    dailyPath,
    providerSummaryPath,
  ];
  const manifestPath = path.join(root, 'data', 'history', 'manifest.json');
  atomicWriteJson(manifestPath, {
    schemaVersion: OBSERVATION_SCHEMA_VERSION,
    symbol: SYMBOL,
    generatedAtUtc,
    sourceMode: 'static-fallback',
    freshnessState: 'historical',
    note: 'Bounded reference history derived from verified observations; never a live retail quote.',
    quality,
    files: files.map((filePath) => ({
      path: path.relative(root, filePath).replaceAll('\\', '/'),
      sha256: sha256File(filePath),
      bytes: fs.statSync(filePath).size,
    })),
  });

  return {
    insertedCount: mergeResult.insertedCount,
    duplicateCount: mergeResult.duplicateCount,
    observationCount: quality.observationCount,
    hourlyCount: hourly.length,
    dailyCount: daily.length,
    manifestPath,
    quality,
  };
}

function runCli() {
  const root = process.env.DATACORE_ROOT ? path.resolve(process.env.DATACORE_ROOT) : DEFAULT_ROOT;
  const payload = readJson(
    process.env.PRICE_JSON_PATH || path.join(root, 'data', 'gold_price.json')
  );
  const validated = validatePricePayload(payload);
  if (!validated.ok) throw new Error(`invalid gold price payload: ${validated.errors.join('; ')}`);
  const workflowRunId = process.env.GITHUB_RUN_ID || 'local-bootstrap';
  const observations = buildObservationRows(payload, { workflowRunId });
  const providerRuns = buildProviderRunRows(payload, validated.normalized, { workflowRunId });
  const result = buildStaticArtifacts({
    root,
    observations,
    providerRuns,
    syncState: 'local_only',
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

if (require.main === module) {
  try {
    runCli();
  } catch (error) {
    console.error(`[build-datacore-history] ${error.message || error}`);
    process.exitCode = 1;
  }
}

module.exports = {
  STATIC_HOURLY_DAYS,
  STATIC_DAILY_DAYS,
  mergeObservationRows,
  isOpenMarketSlot,
  expectedOpenMarketSlots,
  buildRollups,
  buildQualityProfile,
  buildStaticArtifacts,
};
