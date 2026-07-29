/**
 * Tests for gold-api.com daily history fetch + validation contract.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

async function loadContract() {
  const url = new URL('../src/lib/gold-api-daily-history-contract.js', `file://${__dirname}/`);
  return import(url.href + `?v=${Date.now()}`);
}

describe('gold-api-daily-history-contract', async () => {
  const contract = await loadContract();
  const {
    parseProviderHistoryBody,
    validateDatasetDocument,
    validateProductionProvenance,
    isSanePrice,
    isFreshnessAgeAcceptable,
    isExplainableGap,
    filterRecordsByRangeDays,
    MIN_OBSERVATIONS_IN_WINDOW,
    buildDatasetDocument,
    classifyDatasetFreshness,
    buildHistoryRequestParams,
    analyzeAuthenticity,
    REJECTION_REASONS,
    DATA_ORIGIN_LIVE,
    isProductionDataPath,
    formatRejectionSummary,
    diagnoseProviderResponse,
    sha256Hex,
  } = contract;

  const officialFixturePath = path.join(
    __dirname,
    'fixtures/gold-api-history/provider-response-official.json'
  );
  const liveFixturePath = path.join(
    __dirname,
    'fixtures/gold-api-history/xau-usd-daily.live-fixture.json'
  );

  test('parseProviderHistoryBody normalizes official day/avg_price records', () => {
    const body = JSON.parse(fs.readFileSync(officialFixturePath, 'utf8'));
    const { records, rejected, errors, rejectionTally } = parseProviderHistoryBody(
      body,
      '2026-07-29'
    );
    assert.equal(errors.length, 0);
    assert.ok(records.length >= MIN_OBSERVATIONS_IN_WINDOW);
    assert.equal(rejected, 0);
    for (let i = 1; i < records.length; i++) {
      assert.ok(records[i - 1].date < records[i].date);
    }
    assert.equal(rejectionTally[REJECTION_REASONS.MISSING_AVG_PRICE], 0);
  });

  test('parseProviderHistoryBody supports avg_price numeric string', () => {
    const body = [
      { day: '2026-07-01', avg_price: '4200.5' },
      { day: '2026-06-30', avg_price: '4185' },
    ];
    const { records, rejected, errors } = parseProviderHistoryBody(body, '2026-07-29');
    assert.equal(errors.length, 0);
    assert.equal(rejected, 0);
    assert.equal(records.length, 2);
    assert.equal(records[1].avgUsdOz, 4200.5);
  });

  test('rejects rows without avg_price with reason tally', () => {
    const body = [
      { day: '2026-07-01', avg_price: 4200 },
      { day: '2026-07-02', max_price: 4100 },
    ];
    const { records, rejected, rejectionTally, errors } = parseProviderHistoryBody(
      body,
      '2026-07-29'
    );
    assert.equal(records.length, 1);
    assert.equal(rejected, 1);
    assert.equal(rejectionTally.missing_avg_price, 1);
    assert.equal(errors.length, 0);
  });

  test('all rows rejected reports rejection summary not only no_records', () => {
    const body = Array.from({ length: 3 }, (_, i) => ({
      day: `2026-07-0${i + 1}`,
      max_price: 4000 + i,
    }));
    const { records, errors } = parseProviderHistoryBody(body, '2026-07-29');
    assert.equal(records.length, 0);
    assert.ok(errors.some((e) => e.startsWith('all_rows_rejected')));
    assert.ok(errors[0].includes('missing_avg_price:3'));
  });

  test('rejects invalid JSON shapes', () => {
    const { errors } = parseProviderHistoryBody({ foo: 'bar' }, '2026-07-29');
    assert.ok(errors.some((e) => e.startsWith('unexpected_schema')));
  });

  test('rejects future dates and bad prices', () => {
    const body = [
      { day: '2099-01-01', avg_price: 2000 },
      { day: '2026-07-01', avg_price: 0 },
      { day: '2026-07-02', avg_price: -10 },
    ];
    const { records, rejected, rejectionTally } = parseProviderHistoryBody(body, '2026-07-29');
    assert.equal(records.length, 0);
    assert.equal(rejected, 3);
    assert.equal(isSanePrice(0), false);
    assert.ok(rejectionTally.future_date >= 1);
    assert.ok(rejectionTally.non_positive_avg_price >= 1);
  });

  test('live fixture passes production provenance', () => {
    const doc = JSON.parse(fs.readFileSync(liveFixturePath, 'utf8'));
    const prov = validateProductionProvenance(doc);
    assert.equal(prov.ok, true, prov.errors.join(', '));
    const result = validateDatasetDocument(doc, '2026-07-29', {
      requireProductionProvenance: true,
    });
    assert.equal(result.ok, true, result.errors.join(', '));
  });

  test('fixture dataOrigin is rejected for production loader', () => {
    const doc = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, 'fixtures/gold-api-history/xau-usd-daily.fixture.json'),
        'utf8'
      )
    );
    const prov = validateProductionProvenance(doc);
    assert.equal(prov.ok, false);
    assert.ok(prov.errors.includes('data_origin_not_live'));
  });

  test('stale classification respects weekend allowance', () => {
    assert.equal(classifyDatasetFreshness('2026-07-26', '2026-07-29'), 'current');
    assert.equal(classifyDatasetFreshness('2026-07-20', '2026-07-29'), 'stale');
    assert.equal(isFreshnessAgeAcceptable(4, '2026-07-26'), true);
  });

  test('weekend gaps are explainable', () => {
    assert.equal(isExplainableGap(2, '2026-07-24', '2026-07-27'), true);
    assert.equal(isExplainableGap(10, '2026-06-01', '2026-06-15'), false);
  });

  test('range filters respect 1M/3M/6M/12M windows', () => {
    const doc = JSON.parse(fs.readFileSync(liveFixturePath, 'utf8'));
    const records = doc.records;
    assert.ok(filterRecordsByRangeDays(records, 30).length >= 15);
    assert.ok(filterRecordsByRangeDays(records, 365).length >= 200);
  });

  test('buildDatasetDocument includes metadata without secrets', () => {
    const records = [{ date: '2026-07-01', avgUsdOz: 2400 }];
    const doc = buildDatasetDocument({
      records,
      retrievedAt: '2026-07-29T00:00:00.000Z',
      dataOrigin: DATA_ORIGIN_LIVE,
      providerResponseRecordCount: 1,
      rejectedRecordCount: 0,
      rawResponseSha256: 'b'.repeat(64),
      workflow: { runId: '1', commitSha: 'abc' },
    });
    assert.equal(doc.provider, 'gold-api.com');
    assert.equal(doc.dataOrigin, DATA_ORIGIN_LIVE);
    const text = JSON.stringify(doc);
    assert.ok(!text.includes('x-api-key'));
    assert.ok(!/sk_[a-z0-9]+/i.test(text));
  });

  test('request params use Unix seconds not milliseconds', () => {
    const params = buildHistoryRequestParams(400, '2026-07-29');
    assert.equal(params.timestampUnit, 'seconds');
    assert.ok(params.startTimestamp < 2_000_000_000);
    assert.ok(params.endTimestamp < 2_000_000_000);
    assert.ok(params.startTimestamp < params.endTimestamp);
  });

  test('analyzeAuthenticity flags implausible constant synthetic data', () => {
    const records = Array.from({ length: 60 }, (_, i) => ({
      date: `2026-05-${String((i % 28) + 1).padStart(2, '0')}`,
      avgUsdOz: 2400,
    }));
    const auth = analyzeAuthenticity(records);
    assert.ok(auth.warnings.length > 0);
  });

  test('diagnoseProviderResponse is secret-free structural output', () => {
    const body = [{ day: '2026-07-01', avg_price: 4200.5 }];
    const diag = diagnoseProviderResponse(body, {
      status: 200,
      contentType: 'application/json',
      byteLength: 42,
      rawSha256: sha256Hex('test'),
    });
    assert.equal(diag.hasDay, true);
    assert.equal(diag.hasAvgPrice, true);
    assert.equal(diag.rowCount, 1);
  });

  test('isProductionDataPath detects production output target', () => {
    assert.equal(isProductionDataPath('data/historical/xau-usd-daily.json'), true);
    assert.equal(isProductionDataPath('/tmp/out.json'), false);
  });

  test('formatRejectionSummary omits zero counts', () => {
    const summary = formatRejectionSummary({ missing_avg_price: 400, missing_day: 0 });
    assert.equal(summary, 'missing_avg_price:400');
  });
});

describe('fetch-gold-api-history CLI', () => {
  test('missing key exits non-zero', () => {
    const { spawnSync } = require('node:child_process');
    const res = spawnSync(process.execPath, ['scripts/node/fetch-gold-api-history.mjs'], {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, GOLD_API_KEY: '', GOLD_API_COM_KEY: '' },
    });
    assert.notEqual(res.status, 0);
    const out = `${res.stderr}${res.stdout}`;
    assert.ok(out.includes('Missing API key'));
    assert.ok(!/x-api-key:\s*\S+/i.test(out));
  });

  test('--fixture cannot write to production path', () => {
    const { spawnSync } = require('node:child_process');
    const res = spawnSync(
      process.execPath,
      [
        'scripts/node/fetch-gold-api-history.mjs',
        '--fixture',
        'tests/fixtures/gold-api-history/provider-response-official.json',
        '--output',
        'data/historical/xau-usd-daily.json',
        '--reference-date',
        '2026-07-29',
      ],
      { cwd: path.join(__dirname, '..'), encoding: 'utf8' }
    );
    assert.notEqual(res.status, 0);
    assert.ok(`${res.stderr}${res.stdout}`.includes('Fixture mode cannot write to production path'));
  });

  test('--fixture writes validated output to temp path', () => {
    const { spawnSync } = require('node:child_process');
    const outFile = path.join(__dirname, 'fixtures/gold-api-history/tmp-output.json');
    const res = spawnSync(
      process.execPath,
      [
        'scripts/node/fetch-gold-api-history.mjs',
        '--fixture',
        'tests/fixtures/gold-api-history/provider-response-official.json',
        '--output',
        outFile,
        '--reference-date',
        '2026-07-29',
      ],
      { cwd: path.join(__dirname, '..'), encoding: 'utf8' }
    );
    assert.equal(res.status, 0, res.stderr);
    const doc = JSON.parse(fs.readFileSync(outFile, 'utf8'));
    assert.equal(doc.dataOrigin, 'fixture');
    fs.unlinkSync(outFile);
  });
});
