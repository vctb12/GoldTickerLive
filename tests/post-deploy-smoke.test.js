'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const {
  classifyRoute,
  evaluateSnapshot,
  checkCommitMatch,
  runSmoke,
} = require(path.resolve(__dirname, '..', 'scripts', 'node', 'post-deploy-smoke.js'));

// ── classifyRoute ─────────────────────────────────────────────────────────────
test('classifyRoute: 200 with marker passes', () => {
  assert.equal(classifyRoute({ status: 200, body: '<html><title>x</title>', marker: '<title' }).ok, true);
});
test('classifyRoute: 200 without marker fails (blank/error shell)', () => {
  const v = classifyRoute({ status: 200, body: 'oops', marker: '<title' });
  assert.equal(v.ok, false);
  assert.match(v.reason, /marker/);
});
test('classifyRoute: non-200 fails', () => {
  assert.equal(classifyRoute({ status: 404, body: '', marker: '<title' }).ok, false);
});

// ── evaluateSnapshot ──────────────────────────────────────────────────────────
test('evaluateSnapshot: sane fresh snapshot passes', () => {
  const now = Date.parse('2026-07-11T09:00:00Z');
  const v = evaluateSnapshot(
    { xau_usd_per_oz: 4121.4, fetched_at_utc: '2026-07-11T08:30:00Z' },
    { now }
  );
  assert.equal(v.ok, true);
  assert.equal(v.spot, 4121.4);
  assert.deepEqual(v.warnings, []);
});
test('evaluateSnapshot: insane spot hard-fails', () => {
  assert.equal(evaluateSnapshot({ xau_usd_per_oz: 0 }).ok, false);
  assert.equal(evaluateSnapshot({ xau_usd_per_oz: 'nope' }).ok, false);
  assert.equal(evaluateSnapshot(null).ok, false);
});
test('evaluateSnapshot: old age is a warning, not a failure (weekend cron gap)', () => {
  const now = Date.parse('2026-07-13T09:00:00Z'); // ~48h later
  const v = evaluateSnapshot(
    { xau_usd_per_oz: 4121.4, fetched_at_utc: '2026-07-11T08:30:00Z' },
    { now, warnAgeMs: 24 * 3.6e6 }
  );
  assert.equal(v.ok, true, 'still passes');
  assert.equal(v.warnings.length, 1, 'but warns about age');
});

// ── checkCommitMatch ──────────────────────────────────────────────────────────
test('checkCommitMatch: exact + short/long sha match', () => {
  assert.equal(checkCommitMatch({ commit: 'abc123def456' }, 'abc123def456').ok, true);
  assert.equal(checkCommitMatch({ commit: 'abc123def456' }, 'abc123de').ok, true, 'expected short sha');
  assert.equal(checkCommitMatch({ commit: 'abc123de' }, 'abc123def456').ok, true, 'live short sha');
});
test('checkCommitMatch: mismatch is a hard failure (stale deploy)', () => {
  const v = checkCommitMatch({ commit: 'aaaaaaaa' }, 'bbbbbbbb');
  assert.equal(v.ok, false);
  assert.match(v.reason, /STALE DEPLOY/);
});
test('checkCommitMatch: missing marker or sha is skipped, not failed', () => {
  assert.equal(checkCommitMatch(null, 'abc').skipped, true);
  assert.equal(checkCommitMatch({ commit: 'abc' }, '').skipped, true);
});

// ── runSmoke (fake fetch) ─────────────────────────────────────────────────────
function fakeFetch(map) {
  return async (url) => {
    for (const [frag, resp] of Object.entries(map)) {
      if (url.includes(frag)) {
        return {
          status: resp.status ?? 200,
          async text() {
            return resp.body ?? '';
          },
          async json() {
            return resp.json ?? null;
          },
        };
      }
    }
    return { status: 404, async text() { return 'not found'; }, async json() { return null; } };
  };
}

const HAPPY = {
  '/index': { body: '<title>Gold</title>' },
  '/?cb': { body: '<title>Gold</title>' },
  'goldtickerlive.com/?': { body: '<title>Gold</title>' },
  'tracker.html': { body: '<title>Tracker</title>' },
  'calculator.html': { body: '<title>Calc</title>' },
  'market.html': { body: '<title>Market</title>' },
  'methodology.html': { body: '<title>Method</title>' },
  'gold_price.json': { json: { xau_usd_per_oz: 4121.4, fetched_at_utc: '2026-07-11T08:30:00Z' } },
  'build-info.json': { json: { commit: 'deadbeef1234' } },
  'sw.js': { body: '// sw' },
};

test('runSmoke: healthy site with matching commit passes', async () => {
  const now = Date.parse('2026-07-11T09:00:00Z');
  const r = await runSmoke({ fetchImpl: fakeFetch(HAPPY), expectedSha: 'deadbeef1234', now });
  assert.equal(r.ok, true, JSON.stringify(r.results.filter((x) => !x.ok)));
});

test('runSmoke: a stale deployed commit fails loudly', async () => {
  const now = Date.parse('2026-07-11T09:00:00Z');
  const r = await runSmoke({ fetchImpl: fakeFetch(HAPPY), expectedSha: 'ffffffff9999', now });
  assert.equal(r.ok, false);
  assert.ok(r.results.find((x) => x.name === 'commit-match' && !x.ok));
});

test('runSmoke: a 404 route fails loudly', async () => {
  const broken = { ...HAPPY };
  delete broken['market.html'];
  const now = Date.parse('2026-07-11T09:00:00Z');
  const r = await runSmoke({ fetchImpl: fakeFetch(broken), expectedSha: 'deadbeef1234', now });
  assert.equal(r.ok, false);
  assert.ok(r.results.find((x) => x.name.includes('market.html') && !x.ok));
});

test('runSmoke: missing build-info marker is a warning, not a failure', async () => {
  const noMarker = { ...HAPPY };
  delete noMarker['build-info.json'];
  const now = Date.parse('2026-07-11T09:00:00Z');
  const r = await runSmoke({ fetchImpl: fakeFetch(noMarker), expectedSha: 'deadbeef1234', now });
  assert.equal(r.ok, true, 'site still healthy without the marker');
  assert.ok(r.warnings.find((w) => /commit-match skipped/.test(w)));
});
