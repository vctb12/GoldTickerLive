#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const {
  OBSERVATION_SCHEMA_VERSION,
  OBSERVATION_SLOT_SECONDS,
  PROVIDER_DIVERGENCE_THRESHOLD_BPS,
  buildObservationRows,
  buildProviderRunRows,
  computeProviderHealthRows,
  floorTimestampToSlot,
  stableJsonStringify,
  validatePricePayload,
} = require('../../server/lib/price-snapshots');

const DEFAULT_ROOT = path.resolve(__dirname, '../..');
const DEFAULT_METAL = 'XAU';
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const STATIC_INTRADAY_DAYS = 7;
const STATIC_HOURLY_DAYS = 90;
const STATIC_DAILY_DAYS = 1825;
const MAX_ACCEPTABLE_MISSING_SLOT_RATE = 0.2;
const MAX_ACCEPTABLE_GAP_SECONDS = 30 * 60;

function parseIso(value) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function observationTimestamp(row) {
  return parseIso(row?.provider_timestamp_utc || row?.timestamp_utc);
}

function observationPrice(row) {
  const value = Number(row?.price_usd_per_oz ?? row?.xau_usd_per_oz);
  return Number.isFinite(value) && value > 0 ? value : null;
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
  return observationTimestamp(row)?.slice(0, 7) || null;
}

function immutableIdentity(row) {
  return {
    observation_id: row.observation_id,
    metal_symbol: row.metal_symbol,
    quote_currency: row.quote_currency,
    source_provider: row.source_provider,
    provider_timestamp_utc: observationTimestamp(row),
  };
}

function publicArchiveRow(row) {
  return {
    observation_id: row.observation_id,
    metal_symbol: row.metal_symbol,
    quote_currency: row.quote_currency,
    price_usd_per_oz: observationPrice(row),
    price_aed_per_gram:
      Number.isFinite(Number(row.price_aed_per_gram)) && Number(row.price_aed_per_gram) > 0
        ? Number(row.price_aed_per_gram)
        : null,
    source_provider: row.source_provider,
    provider_chain: row.provider_chain || '',
    provider_timestamp_utc: observationTimestamp(row),
    fetched_at_utc: parseIso(row.fetched_at_utc),
    ingested_at_utc: parseIso(row.ingested_at_utc),
    slot_start_utc: parseIso(row.slot_start_utc || row.slot_5m_utc),
    slot_resolution_seconds: Number(row.slot_resolution_seconds) || OBSERVATION_SLOT_SECONDS,
    market_state: row.market_state || 'unknown',
    freshness_state: row.freshness_state || 'stale',
    freshness_seconds:
      Number.isFinite(Number(row.freshness_seconds)) && Number(row.freshness_seconds) >= 0
        ? Number(row.freshness_seconds)
        : null,
    is_selected: row.is_selected !== false,
    selection_method: row.selection_method || null,
    deviation_bps: Number.isFinite(Number(row.deviation_bps)) ? Number(row.deviation_bps) : null,
    quality_state: row.quality_state || 'warning',
    quality_flags: normalizeFlags(row.quality_flags || []),
    correction_of_observation_id: row.correction_of_observation_id || null,
    is_correction: row.is_correction === true,
    schema_version: Number(row.schema_version) || OBSERVATION_SCHEMA_VERSION,
  };
}

function mergeObservationRows(existingRows, incomingRows) {
  const rows = new Map();
  for (const row of Array.isArray(existingRows) ? existingRows : []) {
    if (row?.observation_id) rows.set(row.observation_id, publicArchiveRow(row));
  }
  let duplicateCount = 0;
  let insertedCount = 0;
  for (const row of Array.isArray(incomingRows) ? incomingRows : []) {
    if (!row?.observation_id || !observationTimestamp(row) || row.quality_state === 'rejected') {
      continue;
    }
    const safeRow = publicArchiveRow(row);
    const existing = rows.get(safeRow.observation_id);
    if (existing) {
      if (
        stableJsonStringify(immutableIdentity(existing)) !==
        stableJsonStringify(immutableIdentity(safeRow))
      ) {
        throw new Error(`immutable observation identity conflict: ${safeRow.observation_id}`);
      }
      duplicateCount += 1;
      continue;
    }
    rows.set(safeRow.observation_id, safeRow);
    insertedCount += 1;
  }
  return {
    rows: [...rows.values()].sort(
      (left, right) =>
        String(observationTimestamp(left)).localeCompare(String(observationTimestamp(right))) ||
        String(left.observation_id).localeCompare(String(right.observation_id))
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
    cursor += OBSERVATION_SLOT_SECONDS * 1000
  ) {
    if (isOpenMarketSlot(new Date(cursor).toISOString())) count += 1;
  }
  return count;
}

function effectiveObservations(observations) {
  const rows = (Array.isArray(observations) ? observations : [])
    .filter((row) => row.quality_state !== 'rejected' && observationPrice(row) !== null)
    .sort(
      (left, right) =>
        String(observationTimestamp(left)).localeCompare(String(observationTimestamp(right))) ||
        String(left.ingested_at_utc || '').localeCompare(String(right.ingested_at_utc || '')) ||
        String(left.observation_id).localeCompare(String(right.observation_id))
    );
  const correctedIds = new Set(rows.map((row) => row.correction_of_observation_id).filter(Boolean));
  return rows.filter((row) => !correctedIds.has(row.observation_id));
}

function bucketStart(timestampUtc, interval) {
  const date = new Date(timestampUtc);
  if (!Number.isFinite(date.getTime())) return null;
  if (interval === '1d') date.setUTCHours(0, 0, 0, 0);
  else date.setUTCMinutes(0, 0, 0);
  return date.toISOString();
}

function median(values) {
  const sorted = values.map(Number).sort((left, right) => left - right);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function sortedDistribution(values) {
  const counts = {};
  for (const value of values.filter(Boolean)) counts[value] = (counts[value] || 0) + 1;
  return Object.fromEntries(
    Object.entries(counts).sort(([left], [right]) => left.localeCompare(right))
  );
}

function contributorHash(rows) {
  const identity = rows.map((row) => row.observation_id).sort();
  return crypto.createHash('sha256').update(stableJsonStringify(identity)).digest('hex');
}

function buildRollups(observations, interval) {
  const selected = effectiveObservations(observations).filter((row) => row.is_selected !== false);
  const groups = new Map();
  for (const row of selected) {
    const timestampUtc = observationTimestamp(row);
    const bucket = bucketStart(timestampUtc, interval);
    if (!bucket) continue;
    if (!groups.has(bucket)) groups.set(bucket, []);
    groups.get(bucket).push(row);
  }
  return [...groups.entries()].map(([bucketStartUtc, rows]) => {
    const prices = rows.map(observationPrice);
    const providers = [...new Set(rows.map((row) => row.source_provider).filter(Boolean))].sort();
    const duration = interval === '1d' ? DAY_MS : HOUR_MS;
    const bucketEndUtc = new Date(new Date(bucketStartUtc).getTime() + duration).toISOString();
    const expectedSlotCount = expectedOpenMarketSlots(
      bucketStartUtc,
      new Date(new Date(bucketEndUtc).getTime() - OBSERVATION_SLOT_SECONDS * 1000).toISOString()
    );
    const observedSlotCount = new Set(
      rows.map((row) => row.slot_start_utc || row.slot_5m_utc).filter(Boolean)
    ).size;
    const sourceObservationIds = rows.map((row) => row.observation_id).sort();
    const qualityFlags = normalizeFlags(rows.flatMap((row) => row.quality_flags || []));
    return {
      bucketStartUtc,
      bucketEndUtc,
      interval,
      open: prices[0],
      high: Math.max(...prices),
      low: Math.min(...prices),
      close: prices[prices.length - 1],
      average: Number((prices.reduce((sum, value) => sum + value, 0) / prices.length).toFixed(8)),
      median: Number(median(prices).toFixed(8)),
      observationCount: rows.length,
      expectedSlotCount,
      observedSlotCount,
      incomplete: expectedSlotCount > observedSlotCount,
      providerCount: providers.length,
      providers,
      mixedProviders: providers.length > 1,
      providerDistribution: sortedDistribution(rows.map((row) => row.source_provider)),
      freshnessStates: sortedDistribution(rows.map((row) => row.freshness_state)),
      qualityFlags,
      sourceObservationIds,
      sourceObservationHash: contributorHash(rows),
    };
  });
}

function normalizeFlags(flags) {
  return [...new Set((Array.isArray(flags) ? flags : []).map(String).filter(Boolean))].sort();
}

function boundRows(rows, latestTimestampUtc, days, timestampField = 'bucketStartUtc') {
  if (!latestTimestampUtc) return [];
  const cutoff = new Date(latestTimestampUtc).getTime() - days * DAY_MS;
  return rows.filter((row) => {
    const value = row[timestampField] || observationTimestamp(row);
    return value && new Date(value).getTime() >= cutoff;
  });
}

function buildIntradayPoints(observations, latestTimestampUtc) {
  return boundRows(
    effectiveObservations(observations).filter((row) => row.is_selected !== false),
    latestTimestampUtc,
    STATIC_INTRADAY_DAYS,
    'provider_timestamp_utc'
  ).map((row) => ({
    timestampUtc: observationTimestamp(row),
    slotStartUtc: row.slot_start_utc || row.slot_5m_utc,
    priceUsdPerOz: observationPrice(row),
    provider: row.source_provider,
    providerChain: row.provider_chain || '',
    freshnessState: row.freshness_state,
    marketState: row.market_state,
    qualityFlags: row.quality_flags || [],
    isCorrection: row.is_correction === true,
    correctionOfObservationId: row.correction_of_observation_id || null,
    sourceObservationId: row.observation_id,
  }));
}

function maximumOpenMarketGap(selected) {
  let maxGapSeconds = 0;
  let maxGapStartUtc = null;
  let maxGapEndUtc = null;
  for (let index = 1; index < selected.length; index += 1) {
    const left = observationTimestamp(selected[index - 1]);
    const right = observationTimestamp(selected[index]);
    const missingSlots = Math.max(0, expectedOpenMarketSlots(left, right) - 2);
    const gapSeconds = missingSlots * OBSERVATION_SLOT_SECONDS;
    if (gapSeconds > maxGapSeconds) {
      maxGapSeconds = gapSeconds;
      maxGapStartUtc = left;
      maxGapEndUtc = right;
    }
  }
  return { maxGapSeconds, maxGapStartUtc, maxGapEndUtc };
}

function buildQualityProfile(
  observations,
  providerRuns,
  { duplicateCount = 0, rejectedObservations = [] } = {}
) {
  const selected = effectiveObservations(observations)
    .filter((row) => row.is_selected !== false)
    .sort((left, right) =>
      String(observationTimestamp(left)).localeCompare(String(observationTimestamp(right)))
    );
  const first = observationTimestamp(selected[0]) || null;
  const last = observationTimestamp(selected[selected.length - 1]) || null;
  const observedSlots = new Set(
    selected
      .map(
        (row) =>
          row.slot_start_utc || row.slot_5m_utc || floorTimestampToSlot(observationTimestamp(row))
      )
      .filter(Boolean)
  );
  const expectedSlots = first && last ? expectedOpenMarketSlots(first, last) : 0;
  const openObservedSlots = [...observedSlots].filter(isOpenMarketSlot).length;
  const missingSlots = Math.max(0, expectedSlots - openObservedSlots);
  const missingRate = expectedSlots > 0 ? Number((missingSlots / expectedSlots).toFixed(6)) : null;
  const qualityFlags = selected.flatMap((row) => row.quality_flags || []);
  const rejectedFlags = (Array.isArray(rejectedObservations) ? rejectedObservations : []).flatMap(
    (row) => row.quality_flags || row.errors || []
  );
  const gaps = maximumOpenMarketGap(selected);
  const warnings = [];
  const failures = [];
  if (selected.length === 0) warnings.push('no_accepted_observations');
  else if (selected.length < 2) warnings.push('insufficient_continuity_evidence');
  if (selected.length > 1 && missingRate > MAX_ACCEPTABLE_MISSING_SLOT_RATE) {
    warnings.push('missing_slot_rate_exceeds_threshold');
  }
  if (gaps.maxGapSeconds > MAX_ACCEPTABLE_GAP_SECONDS) warnings.push('max_gap_exceeds_threshold');
  if (rejectedFlags.includes('future_provider_timestamp'))
    failures.push('future_observation_rejected');
  if (rejectedFlags.length > 0) failures.push('invalid_observation_rejected');
  if (qualityFlags.includes('fallback')) warnings.push('fallback_observations_present');
  if (qualityFlags.includes('stale')) warnings.push('stale_observations_present');
  const runs = Array.isArray(providerRuns) ? providerRuns : [];
  let sourceTransitionCount = 0;
  for (let index = 1; index < selected.length; index += 1) {
    if (selected[index].source_provider !== selected[index - 1].source_provider) {
      sourceTransitionCount += 1;
    }
  }
  const gateStatus = failures.length ? 'fail' : warnings.length ? 'warn' : 'pass';
  return {
    schemaVersion: OBSERVATION_SCHEMA_VERSION,
    dataset: 'DataCore canonical XAU/USD observations',
    grain: 'one immutable provider observation; selected observations drive public aggregates',
    gateStatus,
    pass: failures.length === 0,
    thresholds: {
      slotResolutionSeconds: OBSERVATION_SLOT_SECONDS,
      maximumMissingSlotRate: MAX_ACCEPTABLE_MISSING_SLOT_RATE,
      maximumGapSeconds: MAX_ACCEPTABLE_GAP_SECONDS,
    },
    coverage: {
      firstObservationUtc: first,
      lastObservationUtc: last,
      observationCount: selected.length,
      expectedOpenMarketSlots: expectedSlots,
      observedOpenMarketSlots: openObservedSlots,
      missingOpenMarketSlots: missingSlots,
      missingOpenMarketSlotRate: missingRate,
      ...gaps,
    },
    duplicateCount,
    duplicateRate:
      selected.length + duplicateCount > 0
        ? Number((duplicateCount / (selected.length + duplicateCount)).toFixed(6))
        : 0,
    invalidObservationCount: rejectedFlags.length ? rejectedObservations.length : 0,
    futureObservationCount: rejectedFlags.filter((flag) => flag === 'future_provider_timestamp')
      .length,
    lateArrivalCount: qualityFlags.filter((flag) => flag === 'late_arrival').length,
    outOfOrderCount: qualityFlags.filter((flag) => flag === 'out_of_order').length,
    correctionCount: selected.filter((row) => row.is_correction === true).length,
    fallbackObservationCount: qualityFlags.filter((flag) => flag === 'fallback').length,
    staleObservationCount: qualityFlags.filter((flag) => flag === 'stale').length,
    providerDistribution: sortedDistribution(selected.map((row) => row.source_provider)),
    freshnessDistribution: sortedDistribution(selected.map((row) => row.freshness_state)),
    sourceTransitionCount,
    providerAttemptCount: runs.length,
    providerSuccessCount: runs.filter((row) => row.status === 'success').length,
    providerDivergenceEventCount: runs.filter(
      (row) => Math.abs(Number(row.deviation_bps)) > PROVIDER_DIVERGENCE_THRESHOLD_BPS
    ).length,
    providerFallbackCount: runs.filter((row) => row.status === 'fallback').length,
    warnings: normalizeFlags(warnings),
    failures: normalizeFlags(failures),
  };
}

function historyDirectory(root, metal = DEFAULT_METAL) {
  return path.join(root, 'data', 'history', metal);
}

function loadObservationArchives(historyDir) {
  const archiveDir = path.join(historyDir, 'observations');
  if (!fs.existsSync(archiveDir)) return [];
  return fs
    .readdirSync(archiveDir)
    .filter((name) => /^\d{4}-\d{2}\.json$/.test(name))
    .sort()
    .flatMap((name) => {
      const payload = readJson(path.join(archiveDir, name), {});
      return Array.isArray(payload?.observations) ? payload.observations : [];
    });
}

function updateObservationArchives(historyDir, incomingRows) {
  const archiveDir = path.join(historyDir, 'observations');
  const grouped = new Map();
  for (const row of incomingRows) {
    const period = periodForObservation(row);
    if (!period || row.quality_state === 'rejected') continue;
    if (!grouped.has(period)) grouped.set(period, []);
    grouped.get(period).push(row);
  }
  let duplicateCount = 0;
  let insertedCount = 0;
  const changedFiles = [];
  for (const [period, rows] of grouped.entries()) {
    const filePath = path.join(archiveDir, `${period}.json`);
    const existingPayload = readJson(filePath, {});
    const merged = mergeObservationRows(existingPayload?.observations, rows);
    const requiresSanitization = (existingPayload?.observations || []).some(
      (row) =>
        Object.prototype.hasOwnProperty.call(row, 'raw_payload_hash') ||
        Object.prototype.hasOwnProperty.call(row, 'workflow_run_id') ||
        Object.prototype.hasOwnProperty.call(row, 'provider_response_time_ms') ||
        Object.prototype.hasOwnProperty.call(row, 'xau_usd_per_oz')
    );
    duplicateCount += merged.duplicateCount;
    insertedCount += merged.insertedCount;
    if (merged.insertedCount > 0 || requiresSanitization || !fs.existsSync(filePath)) {
      atomicWriteJson(filePath, {
        schemaVersion: OBSERVATION_SCHEMA_VERSION,
        metalSymbol: DEFAULT_METAL,
        quoteCurrency: 'USD',
        period,
        source: 'DataCore canonical provider observations',
        immutableIdentity:
          'schema + metal + quote + provider + provider timestamp + raw payload hash',
        correctionPolicy: 'corrections append a new linked row; prior rows are never mutated',
        observations: merged.rows,
      });
      changedFiles.push(filePath);
    }
  }
  return { duplicateCount, insertedCount, changedFiles };
}

function buildDatasetDocument({ metal, interval, generatedAtUtc, retention, points, quality }) {
  return {
    schemaVersion: OBSERVATION_SCHEMA_VERSION,
    metalSymbol: metal,
    quoteCurrency: 'USD',
    interval,
    sourceMode: 'static-derived',
    freshnessState: 'historical',
    generatedAtUtc,
    retention,
    coverage: {
      startTimestampUtc: points[0]?.timestampUtc || points[0]?.bucketStartUtc || null,
      endTimestampUtc: points.at(-1)?.timestampUtc || points.at(-1)?.bucketEndUtc || null,
      pointCount: points.length,
    },
    qualityGateStatus: quality.gateStatus,
    note: 'Spot-linked historical reference data; not a live feed or retail shop quote.',
    points,
  };
}

function buildStaticArtifacts({
  root = DEFAULT_ROOT,
  metal = DEFAULT_METAL,
  observations = [],
  providerRuns = [],
  providerHealthRows = [],
  rejectedObservations = [],
  syncState = 'local_only',
  writeHistory = true,
  publishPublic = true,
} = {}) {
  const historyDir = historyDirectory(root, metal);
  const providerHealthDir = path.join(root, 'data', 'provider-health');
  fs.mkdirSync(historyDir, { recursive: true });
  fs.mkdirSync(providerHealthDir, { recursive: true });
  const mergeResult = writeHistory
    ? updateObservationArchives(historyDir, observations)
    : { duplicateCount: 0, insertedCount: 0, changedFiles: [] };
  const allObservations = mergeObservationRows(
    loadObservationArchives(historyDir),
    writeHistory ? [] : observations
  ).rows;
  const selected = effectiveObservations(allObservations).filter(
    (row) => row.is_selected !== false
  );
  const latestTimestampUtc = observationTimestamp(selected.at(-1)) || null;
  const generatedAtUtc =
    selected.at(-1)?.ingested_at_utc || selected.at(-1)?.fetched_at_utc || latestTimestampUtc;
  const quality = buildQualityProfile(allObservations, providerRuns, {
    duplicateCount: 0,
    rejectedObservations,
  });
  const intraday = buildIntradayPoints(allObservations, latestTimestampUtc);
  const hourly = boundRows(
    buildRollups(allObservations, '1h'),
    latestTimestampUtc,
    STATIC_HOURLY_DAYS
  );
  const daily = boundRows(
    buildRollups(allObservations, '1d'),
    latestTimestampUtc,
    STATIC_DAILY_DAYS
  );

  const healthRows = providerHealthRows.length
    ? providerHealthRows
    : computeProviderHealthRows(providerRuns, { nowIso: generatedAtUtc });
  const providerSummaryPath = path.join(providerHealthDir, 'summary.json');
  atomicWriteJson(providerSummaryPath, {
    schemaVersion: OBSERVATION_SCHEMA_VERSION,
    metalSymbol: metal,
    sourceMode: syncState === 'synced' ? 'supabase-and-workflow' : 'workflow-static',
    freshnessState: 'historical',
    generatedAtUtc,
    syncState,
    qualityGateStatus: quality.gateStatus,
    quality,
    providers: healthRows,
  });

  const output = {
    insertedCount: mergeResult.insertedCount,
    duplicateCount: mergeResult.duplicateCount,
    observationCount: quality.coverage.observationCount,
    intradayCount: intraday.length,
    hourlyCount: hourly.length,
    dailyCount: daily.length,
    publicExportUpdated: false,
    manifestPath: path.join(root, 'data', 'history', 'manifest.json'),
    quality,
  };
  if (!publishPublic) return output;

  const intradayPath = path.join(historyDir, 'intraday-7d.json');
  const hourlyPath = path.join(historyDir, 'hourly-90d.json');
  const dailyPath = path.join(historyDir, 'daily.json');
  const qualityPath = path.join(historyDir, 'quality.json');
  atomicWriteJson(
    intradayPath,
    buildDatasetDocument({
      metal,
      interval: '5m-observation',
      generatedAtUtc,
      retention: { type: 'rolling', days: STATIC_INTRADAY_DAYS },
      points: intraday,
      quality,
    })
  );
  atomicWriteJson(
    hourlyPath,
    buildDatasetDocument({
      metal,
      interval: '1h',
      generatedAtUtc,
      retention: { type: 'rolling', days: STATIC_HOURLY_DAYS },
      points: hourly,
      quality,
    })
  );
  atomicWriteJson(
    dailyPath,
    buildDatasetDocument({
      metal,
      interval: '1d',
      generatedAtUtc,
      retention: { type: 'rolling', days: STATIC_DAILY_DAYS },
      points: daily,
      quality,
    })
  );
  atomicWriteJson(qualityPath, { ...quality, generatedAtUtc });

  const archiveDir = path.join(historyDir, 'observations');
  const archiveFiles = fs.existsSync(archiveDir)
    ? fs
        .readdirSync(archiveDir)
        .filter((name) => /^\d{4}-\d{2}\.json$/.test(name))
        .sort()
        .map((name) => path.join(archiveDir, name))
    : [];
  const files = [
    intradayPath,
    hourlyPath,
    dailyPath,
    qualityPath,
    ...archiveFiles,
    providerSummaryPath,
  ];
  atomicWriteJson(output.manifestPath, {
    schemaVersion: OBSERVATION_SCHEMA_VERSION,
    generatedAtUtc,
    sourceMode: 'static-fallback',
    freshnessState: 'historical',
    publicExportGateStatus: quality.gateStatus,
    note: 'Bounded reference history derived from verified observations; never a live retail quote.',
    metals: {
      XAU: {
        quoteCurrency: 'USD',
        status: 'active',
        nonGoldActivation: false,
        qualityPath: 'data/history/XAU/quality.json',
      },
    },
    files: files.map((filePath) => ({
      path: path.relative(root, filePath).replaceAll('\\', '/'),
      sha256: sha256File(filePath),
      bytes: fs.statSync(filePath).size,
    })),
  });
  output.publicExportUpdated = true;
  return output;
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
  return result;
}

if (require.main === module) {
  try {
    runCli();
  } catch (error) {
    console.error(`[datacore-history-v2] ${error.message || error}`);
    process.exitCode = 1;
  }
}

module.exports = {
  STATIC_INTRADAY_DAYS,
  STATIC_HOURLY_DAYS,
  STATIC_DAILY_DAYS,
  MAX_ACCEPTABLE_MISSING_SLOT_RATE,
  MAX_ACCEPTABLE_GAP_SECONDS,
  mergeObservationRows,
  isOpenMarketSlot,
  expectedOpenMarketSlots,
  effectiveObservations,
  buildIntradayPoints,
  buildRollups,
  buildQualityProfile,
  buildStaticArtifacts,
  runCli,
};
