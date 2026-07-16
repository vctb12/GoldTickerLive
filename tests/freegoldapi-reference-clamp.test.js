'use strict';

/**
 * R14 regression lock — freegoldapi.com reference feed containment.
 *
 * The freegoldapi feed can stop updating and/or carry bad datapoints: its last
 * observed row is 2026-02-20 at $5059.30 — months stale and ~27% above the
 * current committed spot (~$4000). These tests lock the containment guarantees
 * documented in src/lib/freegoldapi.js:
 *
 *   1. Rows are normalised as HISTORICAL reference records pinned to their own
 *      date (`freshnessState:'historical'`, `source:'freegoldapi-reference'`,
 *      `derived:true`) — never re-dated to "now".
 *   2. The chart history merge (`historical-data.js getUnifiedHistory`) keeps
 *      the row at its own date and lets local browser snapshots supersede it.
 *   3. The live-lane second opinion (`secondary-spot-check.js`) REJECTS the
 *      stale row (older than REFERENCE_MAX_AGE_MS ≈ 26 h) even though its
 *      price sits inside the sane XAU/USD band — so it can never act as
 *      current-price context, confirm a live quote, or trigger a divergence
 *      downgrade off months-old data.
 */

const { describe, test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// The exact R14 datapoint: last row of the feed, months stale, 27% off spot.
const R14_ROW = { date: '2026-02-20', price: 5059.3, source: 'yahoo_finance' };
// "Today" for these tests — long after the feed stopped updating.
const NOW = Date.parse('2026-07-16T12:00:00Z');

async function loadModules() {
  const base = path.resolve(__dirname, '..', 'src', 'lib');
  const freegold = await import('file://' + path.join(base, 'freegoldapi.js'));
  const check = await import(
    'file://' + path.join(base, 'quote-providers', 'secondary-spot-check.js')
  );
  const history = await import('file://' + path.join(base, 'historical-data.js'));
  return { freegold, check, history };
}

function installLocalStorage(seed = {}) {
  const store = new Map(Object.entries(seed));
  global.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}

beforeEach(async () => {
  const { freegold, check } = await loadModules();
  freegold.__resetFreeGoldCacheForTests();
  check.__resetSecondarySpotCheckForTests();
  delete global.localStorage;
});

afterEach(async () => {
  const { freegold, check } = await loadModules();
  freegold.__resetFreeGoldCacheForTests();
  check.__resetSecondarySpotCheckForTests();
  delete global.localStorage;
});

describe('R14 — stale freegoldapi datapoint never becomes current price context', () => {
  test('the stale $5059 row is normalised as a historical record pinned to its own date', async () => {
    const { freegold } = await loadModules();
    const records = freegold.normalizeFreeGoldRows([R14_ROW]);
    assert.equal(records.length, 1);
    assert.equal(records[0].date, '2026-02-20'); // never re-dated to "now"
    assert.equal(records[0].price, 5059.3);
    assert.equal(records[0].freshnessState, 'historical');
    assert.equal(records[0].source, 'freegoldapi-reference');
    assert.equal(records[0].derived, true);
  });

  test('live-lane second opinion REJECTS the stale row despite an in-band price', async () => {
    const { freegold, check } = await loadModules();
    const records = freegold.normalizeFreeGoldRows([R14_ROW]);
    // The price alone would pass the sane band (1000..10000) — the age gate
    // must be what keeps it out of the live lane.
    assert.equal(check.getSecondaryReferenceSpotUsd(records, NOW), null);
  });

  test('a stale reference yields insufficient-data — no divergence downgrade off months-old data', async () => {
    const { freegold, check } = await loadModules();
    const normalized = freegold.normalizeFreeGoldRows([R14_ROW]);
    installLocalStorage({
      gtl_freegoldapi_reference_v1: JSON.stringify({
        fetchedAt: Date.now(),
        records: normalized,
      }),
    });

    const evaluation = await check.maybeRunSecondarySpotCheck({
      primaryUsd: 4002.7,
      enabled: true,
      now: NOW,
    });
    // 4002.7 vs 5059.3 is a 26%+ gap — but the row is months old, so the
    // checker must report insufficient-data, not a (false) live divergence.
    assert.equal(evaluation.status, 'insufficient-data');
    assert.equal(evaluation.underReview, false);
  });

  test('chart history keeps the row at 2026-02-20 and local snapshots supersede it', async () => {
    const { freegold, history } = await loadModules();
    const normalized = freegold.normalizeFreeGoldRows([R14_ROW]);
    installLocalStorage({
      gtl_freegoldapi_reference_v1: JSON.stringify({
        fetchedAt: Date.now(),
        records: normalized,
      }),
    });

    // A same-date local browser snapshot must win over the reference row.
    const merged = history.getUnifiedHistory([
      { date: '2026-02-20', price: 3960.4, timestamp: Date.parse('2026-02-20T12:00:00Z') },
    ]);

    const feb20 = merged.filter((r) => r.date === '2026-02-20');
    assert.equal(feb20.length, 1);
    assert.equal(feb20[0].source, 'local-snapshot');
    assert.equal(feb20[0].price, 3960.4);

    // The reference row never migrates to another (e.g. current) date.
    const referenceRows = merged.filter((r) => r.source === 'freegoldapi-reference');
    assert.equal(referenceRows.length, 0);
  });

  test('without a local snapshot the row appears ONLY as a labelled historical point at its date', async () => {
    const { freegold, history } = await loadModules();
    const normalized = freegold.normalizeFreeGoldRows([R14_ROW]);
    installLocalStorage({
      gtl_freegoldapi_reference_v1: JSON.stringify({
        fetchedAt: Date.now(),
        records: normalized,
      }),
    });

    const merged = history.getUnifiedHistory([]);
    const referenceRows = merged.filter((r) => r.source === 'freegoldapi-reference');
    assert.equal(referenceRows.length, 1);
    assert.equal(referenceRows[0].date, '2026-02-20');
    assert.equal(referenceRows[0].freshnessState, 'historical');
    assert.equal(referenceRows[0].derived, true);
  });
});
