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
    validateDailyDataset,
    validateDatasetDocument,
    isSanePrice,
    isFreshnessAgeAcceptable,
    isExplainableGap,
    filterRecordsByRangeDays,
    RANGE_MIN_OBSERVATIONS,
    MIN_OBSERVATIONS_IN_WINDOW,
    buildDatasetDocument,
    classifyDatasetFreshness,
  } = contract;

  const fixturePath = path.join(__dirname, 'fixtures/gold-api-history/provider-response.json');
  const datasetFixturePath = path.join(
    __dirname,
    'fixtures/gold-api-history/xau-usd-daily.fixture.json'
  );

  test('parseProviderHistoryBody normalizes ascending unique records', () => {
    const body = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
    const { records, rejected, errors } = parseProviderHistoryBody(body, '2026-07-29');
    assert.equal(errors.length, 0);
    assert.ok(records.length >= MIN_OBSERVATIONS_IN_WINDOW);
    assert.equal(rejected, 0);
    for (let i = 1; i < records.length; i++) {
      assert.ok(records[i - 1].date < records[i].date);
    }
  });

  test('parseProviderHistoryBody supports official gold-api.com day/avg_price shape', () => {
    const body = [
      { day: '2026-07-01', avg_price: 4200.5 },
      { day: '2026-06-30', avg_price: 4185 },
      { day: '2026-06-29', max_price: 4100 },
    ];
    const { records, rejected, errors } = parseProviderHistoryBody(body, '2026-07-29');
    assert.equal(errors.length, 0);
    assert.equal(rejected, 0);
    assert.equal(records.length, 3);
    assert.equal(records[0].date, '2026-06-29');
    assert.equal(records[0].avgUsdOz, 4100);
    assert.equal(records[2].avgUsdOz, 4200.5);
  });

  test('rejects duplicate dates deterministically', () => {
    const body = [
      { timestamp: 1750809600, avg: 2300 },
      { timestamp: 1750809600, avg: 2400 },
    ];
    const { records } = parseProviderHistoryBody(body, '2026-07-29');
    assert.equal(records.length, 1);
    assert.equal(records[0].avgUsdOz, 2400);
  });

  test('rejects invalid JSON shapes', () => {
    const { errors } = parseProviderHistoryBody({ foo: 'bar' }, '2026-07-29');
    assert.ok(errors.includes('unexpected_schema: no array payload'));
  });

  test('rejects future dates and bad prices', () => {
    const body = [
      { date: '2099-01-01', avg: 2000 },
      { date: '2026-07-01', avg: 0 },
      { date: '2026-07-02', avg: -10 },
    ];
    const { records, rejected } = parseProviderHistoryBody(body, '2026-07-29');
    assert.equal(records.length, 0);
    assert.equal(rejected, 3);
    assert.equal(isSanePrice(0), false);
  });

  test('fixture dataset passes acceptance contract', () => {
    const doc = JSON.parse(fs.readFileSync(datasetFixturePath, 'utf8'));
    const result = validateDatasetDocument(doc, '2026-07-29');
    assert.equal(result.ok, true, result.errors.join(', '));
    const daily = validateDailyDataset(result.records, '2026-07-29');
    for (const [range, min] of Object.entries(RANGE_MIN_OBSERVATIONS)) {
      assert.ok(daily.stats.rangeCounts[range] >= min, `${range} count`);
    }
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
    const doc = JSON.parse(fs.readFileSync(datasetFixturePath, 'utf8'));
    const records = doc.records;
    assert.ok(filterRecordsByRangeDays(records, 30, '2026-07-29').length >= 15);
    assert.ok(filterRecordsByRangeDays(records, 365, '2026-07-29').length >= 200);
  });

  test('buildDatasetDocument includes metadata without secrets', () => {
    const records = [{ date: '2026-07-01', avgUsdOz: 2400 }];
    const doc = buildDatasetDocument({}, records, '2026-07-29T00:00:00.000Z');
    assert.equal(doc.provider, 'gold-api.com');
    assert.equal(doc.aggregation, 'daily-average');
    const text = JSON.stringify(doc);
    assert.ok(!text.includes('x-api-key'));
    assert.ok(!/sk_[a-z0-9]+/i.test(text));
  });

  test('validateDailyDataset fails when insufficient records', () => {
    const records = [{ date: '2026-07-01', avgUsdOz: 2400 }];
    const result = validateDailyDataset(records, '2026-07-29');
    assert.equal(result.ok, false);
  });

  test('validateDailyDataset allowStale accepts aged latest record for display', () => {
    const doc = JSON.parse(fs.readFileSync(datasetFixturePath, 'utf8'));
    const records = doc.records.filter((r) => r.date <= '2026-07-24');
    const strict = validateDailyDataset(records, '2026-07-29');
    assert.equal(strict.ok, false);
    assert.ok(strict.errors.some((e) => e.startsWith('stale_latest')));
    const display = validateDailyDataset(records, '2026-07-29', { allowStale: true });
    assert.equal(display.ok, true, display.errors.join(', '));
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

  test('--fixture writes validated output', () => {
    const { spawnSync } = require('node:child_process');
    const outFile = path.join(__dirname, 'fixtures/gold-api-history/tmp-output.json');
    const res = spawnSync(
      process.execPath,
      [
        'scripts/node/fetch-gold-api-history.mjs',
        '--fixture',
        'tests/fixtures/gold-api-history/provider-response.json',
        '--output',
        outFile,
        '--reference-date',
        '2026-07-29',
      ],
      { cwd: path.join(__dirname, '..'), encoding: 'utf8' }
    );
    assert.equal(res.status, 0, res.stderr);
    const doc = JSON.parse(fs.readFileSync(outFile, 'utf8'));
    assert.equal(doc.schemaVersion, 1);
    fs.unlinkSync(outFile);
  });
});
