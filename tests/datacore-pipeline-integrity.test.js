'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  buildObservationRows,
  computeObservationId,
  stableJsonStringify,
} = require('../server/lib/price-snapshots');
const { buildStaticArtifacts } = require('../scripts/node/build-datacore-history');
const {
  assertRemoteCorrectionTargets,
  selectAllKeysetPages,
  run: runDataCoreSync,
} = require('../scripts/node/sync-price-snapshot');

function payload(price = 4700) {
  return {
    provider: 'gold_api_com',
    xau_usd_per_oz: price,
    aed_per_gram_24k: 554.9,
    quote_currency: 'USD',
    timestamp_utc: '2026-08-25T10:00:00.000Z',
    fetched_at_utc: '2026-08-25T10:00:10.000Z',
    freshness_seconds: 10,
    is_fresh: true,
    is_fallback: false,
    is_market_open: true,
    provider_response_time_ms: 100,
  };
}

function sha256Buffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function sha256File(filePath) {
  return sha256Buffer(fs.readFileSync(filePath));
}

function fileHashes(directory) {
  if (!fs.existsSync(directory)) return {};
  const result = {};
  function visit(current) {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const entryPath = path.join(current, entry.name);
      if (entry.isDirectory()) visit(entryPath);
      else
        result[path.relative(directory, entryPath).replaceAll('\\', '/')] = sha256File(entryPath);
    }
  }
  visit(directory);
  return result;
}

function tupleCompare(left, right, timestampColumn, idColumn) {
  return (
    String(left[timestampColumn]).localeCompare(String(right[timestampColumn])) ||
    String(left[idColumn]).localeCompare(String(right[idColumn]))
  );
}

function cursorFromFilter(filter) {
  const values = [...String(filter || '').matchAll(/"([^"\\]*(?:\\.[^"\\]*)*)"/g)].map((match) =>
    match[1].replaceAll('\\"', '"').replaceAll('\\\\', '\\')
  );
  return values.length >= 3 ? { timestamp: values[0], id: values[2] } : null;
}

function mutatingKeysetClient({ rows, insertedRow, timestampColumn, idColumn, direction }) {
  const mutableRows = [...rows];
  const calls = [];
  let inserted = false;
  return {
    calls,
    async select(_table, query) {
      calls.push(query);
      const cursor = cursorFromFilter(query.or);
      const ordered = [...mutableRows].sort((left, right) => {
        const comparison = tupleCompare(left, right, timestampColumn, idColumn);
        return direction === 'desc' ? -comparison : comparison;
      });
      const ingestionUpperBound = String(query.and || '').match(
        /ingested_at_utc\.lte\."([^"]+)"/
      )?.[1];
      const bounded = ingestionUpperBound
        ? ordered.filter(
            (row) => !row.ingested_at_utc || String(row.ingested_at_utc) <= ingestionUpperBound
          )
        : ordered;
      const filtered = cursor
        ? bounded.filter((row) => {
            const comparison = tupleCompare(
              row,
              { [timestampColumn]: cursor.timestamp, [idColumn]: cursor.id },
              timestampColumn,
              idColumn
            );
            return direction === 'desc' ? comparison < 0 : comparison > 0;
          })
        : ordered;
      const page = filtered.slice(0, Number(query.limit));
      if (!inserted) {
        mutableRows.push(insertedRow);
        inserted = true;
      }
      return { data: page };
    },
  };
}

test('remote rehydration overlap is excluded from current-run duplicate metrics', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'datacore-overlap-'));
  try {
    const observations = buildObservationRows(payload(), { workflowRunId: 'overlap-a' });
    buildStaticArtifacts({ root, observations, syncState: 'local_only' });

    const rehydrationOnly = buildStaticArtifacts({
      root,
      observations: [],
      rehydratedObservations: observations,
      writeHistory: false,
      publishPublic: false,
    });
    assert.equal(rehydrationOnly.duplicateCount, 0);
    assert.equal(rehydrationOnly.quality.duplicateCount, 0);
    assert.equal(rehydrationOnly.quality.duplicateRate, 0);
    assert.equal(rehydrationOnly.rehydratedOverlapCount, observations.length);
    assert.equal(rehydrationOnly.quality.rehydratedOverlapCount, observations.length);

    const withCurrentReplay = buildStaticArtifacts({
      root,
      observations,
      rehydratedObservations: observations,
      writeHistory: false,
      publishPublic: false,
    });
    assert.equal(withCurrentReplay.duplicateCount, observations.length);
    assert.equal(withCurrentReplay.rehydratedOverlapCount, observations.length);

    buildStaticArtifacts({
      root,
      observations: [],
      rehydratedObservations: observations,
      syncState: 'synced',
    });
    const publicQuality = JSON.parse(
      fs.readFileSync(path.join(root, 'data', 'history', 'XAU', 'quality.json'), 'utf8')
    );
    assert.equal(publicQuality.duplicateCount, 0);
    assert.equal(publicQuality.duplicateRate, 0);
    assert.equal(publicQuality.rehydratedOverlapCount, observations.length);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('current duplicate rate uses selected and unselected valid observations', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'datacore-duplicate-rate-'));
  try {
    const replayPayload = payload();
    replayPayload.provider_diagnostics = [
      {
        provider: 'goldapi_io',
        requested_at_utc: '2026-08-25T10:00:10.000Z',
        status: 'success',
        valid: true,
        response_time_ms: 125,
        provider_timestamp: '2026-08-25T10:00:00.000Z',
        normalized_price: 4702,
        reason: 'fresh',
      },
    ];
    const observations = buildObservationRows(replayPayload, {
      workflowRunId: 'selected-unselected-replay',
    });
    assert.equal(observations.filter((row) => row.is_selected !== false).length, 1);
    assert.equal(observations.filter((row) => row.is_selected === false).length, 1);
    buildStaticArtifacts({ root, observations, syncState: 'local_only' });

    const replay = buildStaticArtifacts({
      root,
      observations,
      writeHistory: false,
      publishPublic: false,
    });
    assert.equal(replay.duplicateCount, 2);
    assert.equal(replay.quality.coverage.observationCount, 1);
    assert.equal(replay.quality.duplicateRate, 0.5);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('descending provider-run keysets do not shift when a newer row arrives between pages', async () => {
  const timestampColumn = 'attempted_at_utc';
  const idColumn = 'run_key';
  const client = mutatingKeysetClient({
    rows: [
      { attempted_at_utc: '2026-08-25T10:00:00.000Z', run_key: 'b' },
      { attempted_at_utc: '2026-08-25T10:00:00.000Z', run_key: 'a' },
      { attempted_at_utc: '2026-08-25T09:00:00.000Z', run_key: 'z' },
    ],
    insertedRow: { attempted_at_utc: '2026-08-25T10:30:00.000Z', run_key: 'new' },
    timestampColumn,
    idColumn,
    direction: 'desc',
  });
  const rows = await selectAllKeysetPages(
    client,
    'provider_runs',
    { and: '(attempted_at_utc.lte."2026-08-25T11:00:00.000Z")' },
    { timestampColumn, idColumn, direction: 'desc', pageSize: 2 }
  );
  assert.deepEqual(
    rows.map((row) => row.run_key),
    ['b', 'a', 'z']
  );
  assert.equal(
    client.calls.every((query) => query.offset === undefined),
    true
  );
  assert.match(client.calls[1].or, /attempted_at_utc\.lt\./);
  assert.match(client.calls[1].or, /run_key\.lt\./);
});

test('ascending observation keysets exclude rows ingested after the run boundary', async () => {
  const timestampColumn = 'provider_timestamp_utc';
  const idColumn = 'observation_id';
  const client = mutatingKeysetClient({
    rows: [
      {
        provider_timestamp_utc: '2026-08-25T08:00:00.000Z',
        observation_id: 'a',
        ingested_at_utc: '2026-08-25T10:00:00.000Z',
      },
      {
        provider_timestamp_utc: '2026-08-25T08:00:00.000Z',
        observation_id: 'b',
        ingested_at_utc: '2026-08-25T10:00:00.000Z',
      },
      {
        provider_timestamp_utc: '2026-08-25T09:00:00.000Z',
        observation_id: 'c',
        ingested_at_utc: '2026-08-25T10:30:00.000Z',
      },
    ],
    insertedRow: {
      provider_timestamp_utc: '2026-08-25T08:30:00.000Z',
      observation_id: 'late',
      ingested_at_utc: '2026-08-25T11:00:01.000Z',
    },
    timestampColumn,
    idColumn,
    direction: 'asc',
  });
  const rows = await selectAllKeysetPages(
    client,
    'price_snapshots',
    {
      metal_symbol: 'eq.XAU',
      and: '(ingested_at_utc.lte."2026-08-25T11:00:00.000Z")',
    },
    { timestampColumn, idColumn, direction: 'asc', pageSize: 2 }
  );
  assert.deepEqual(
    rows.map((row) => row.observation_id),
    ['a', 'b', 'c']
  );
  assert.equal(
    client.calls.every((query) => query.offset === undefined),
    true
  );
  assert.match(client.calls[1].or, /provider_timestamp_utc\.gt\./);
  assert.match(client.calls[1].or, /observation_id\.gt\./);
  assert.match(client.calls[1].and, /ingested_at_utc\.lte\./);
});

test('a local-only correction predecessor fails before remote or artifact mutation', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'datacore-correction-target-'));
  const inputPath = path.join(root, 'corrected-price.json');
  const requests = [];
  try {
    const firstRows = buildObservationRows(payload(), { workflowRunId: 'first' });
    buildStaticArtifacts({ root, observations: firstRows, syncState: 'local_only' });
    const before = fileHashes(path.join(root, 'data'));
    fs.writeFileSync(inputPath, JSON.stringify(payload(4701)));

    await assert.rejects(
      runDataCoreSync({
        root,
        env: {
          PRICE_JSON_PATH: inputPath,
          DATACORE_ENFORCEMENT_MODE: 'observe-only',
          SUPABASE_URL: 'https://example.supabase.co',
          SUPABASE_SERVICE_ROLE_KEY: 'service-role-test-key',
          GITHUB_RUN_ID: 'correction',
        },
        fetchImpl: async (url, options = {}) => {
          requests.push({ url: String(url), method: options.method || 'GET' });
          return new Response('[]', { status: 200 });
        },
      }),
      (error) => error.code === 'DATACORE_CORRECTION_TARGET_MISSING_REMOTE'
    );
    assert.equal(requests.length >= 2, true);
    assert.equal(
      requests.every((request) => request.method === 'GET'),
      true
    );
    assert.deepEqual(fileHashes(path.join(root, 'data')), before);

    const correction = buildObservationRows(payload(4701), {
      workflowRunId: 'same-batch-correction',
      existingObservations: firstRows,
    })[0];
    assert.doesNotThrow(() => assertRemoteCorrectionTargets([...firstRows, correction], []));
    assert.doesNotThrow(() => assertRemoteCorrectionTargets([correction], firstRows));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('draft bootstrap archive, rollups, and manifest are internally reproducible', () => {
  const root = path.resolve(__dirname, '..');
  const archiveDir = path.join(root, 'data', 'history', 'XAU', 'observations');
  const archiveFiles = fs
    .readdirSync(archiveDir)
    .filter((name) => /^\d{4}-\d{2}\.json$/.test(name))
    .sort();
  const observations = archiveFiles.flatMap((name) => {
    const archive = JSON.parse(fs.readFileSync(path.join(archiveDir, name), 'utf8'));
    assert.equal(
      archive.immutableIdentity,
      'schema + metal + quote + provider + provider timestamp + normalized price'
    );
    return archive.observations;
  });
  const observationIds = new Set(observations.map((row) => row.observation_id));
  for (const row of observations) {
    assert.equal(row.observation_id, computeObservationId(row));
    if (row.correction_of_observation_id) {
      assert.equal(observationIds.has(row.correction_of_observation_id), true);
    }
  }

  for (const relativePath of ['data/history/XAU/hourly-90d.json', 'data/history/XAU/daily.json']) {
    const dataset = JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
    for (const point of dataset.points) {
      const contributorIds = [...point.sourceObservationIds].sort();
      assert.equal(
        contributorIds.every((id) => observationIds.has(id)),
        true
      );
      assert.equal(
        point.sourceObservationHash,
        sha256Buffer(Buffer.from(stableJsonStringify(contributorIds)))
      );
    }
  }

  const intraday = JSON.parse(
    fs.readFileSync(path.join(root, 'data/history/XAU/intraday-7d.json'), 'utf8')
  );
  for (const point of intraday.points) {
    assert.equal(observationIds.has(point.sourceObservationId), true);
  }

  const manifestPath = path.join(root, 'data', 'history', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.equal(
    manifest.files.some((entry) => entry.path === 'data/history/manifest.json'),
    false
  );
  for (const entry of manifest.files) {
    const filePath = path.join(root, entry.path);
    assert.equal(fs.existsSync(filePath), true);
    assert.equal(entry.sha256, sha256File(filePath));
    assert.equal(entry.bytes, fs.statSync(filePath).size);
  }
});
