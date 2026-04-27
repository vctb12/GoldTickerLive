'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function load() {
  const url = new URL('file://' + path.resolve(__dirname, '..', 'src', 'lib', 'live-status.js'));
  return import(url.href);
}

test('getMarketStatus() reports weekend closures correctly', async () => {
  const { getMarketStatus } = await load();

  assert.equal(getMarketStatus('2026-04-24T20:59:00Z').isOpen, true);
  assert.equal(getMarketStatus('2026-04-24T21:00:00Z').isOpen, false);
  assert.equal(getMarketStatus('2026-04-26T21:59:00Z').isOpen, false);
  assert.equal(getMarketStatus('2026-04-26T22:00:00Z').isOpen, true);
});

test('getAgeMs() returns infinity for invalid timestamps', async () => {
  const { getAgeMs } = await load();

  assert.equal(getAgeMs(null), Infinity);
  assert.equal(getAgeMs('not-a-date'), Infinity);
});

test('formatRelativeAge() returns a readable localized label', async () => {
  const { formatRelativeAge } = await load();

  assert.match(formatRelativeAge(45_000, 'en'), /sec|second|s ago|45/);
  assert.notEqual(formatRelativeAge(120_000, 'ar'), '—');
});

test('getLiveFreshness() classifies live, cached, stale, and unavailable states', async () => {
  const { getLiveFreshness } = await load();
  const now = Date.now();

  const live = getLiveFreshness({
    updatedAt: new Date(now - 30_000).toISOString(),
    hasLiveFailure: false,
  });
  assert.equal(live.key, 'live');

  const cached = getLiveFreshness({
    updatedAt: new Date(now - 30_000).toISOString(),
    hasLiveFailure: true,
  });
  assert.equal(cached.key, 'cached');

  const stale = getLiveFreshness({
    updatedAt: new Date(now - 20 * 60 * 1000).toISOString(),
    hasLiveFailure: true,
  });
  assert.equal(stale.key, 'stale');

  const unavailable = getLiveFreshness({ updatedAt: null, hasLiveFailure: true });
  assert.equal(unavailable.key, 'unavailable');
});

// W-2 regression — STALE_AFTER_MS must give the freshness pill at least one
// missed cron-tick of safety margin over the gold-price-fetch workflow's
// `*/6` cadence. If the workflow cadence ever drops below 12 minutes, this
// assertion intentionally fails so the threshold is reconsidered together.
test('GOLD_MARKET.STALE_AFTER_MS exceeds the gold-price-fetch cron cadence', async () => {
  const { GOLD_MARKET, getLiveFreshness } = await load();
  const cronCadenceMs = 6 * 60 * 1000;

  assert.ok(
    GOLD_MARKET.STALE_AFTER_MS >= 2 * cronCadenceMs,
    `STALE_AFTER_MS (${GOLD_MARKET.STALE_AFTER_MS}ms) must allow at least one missed cron tick`
  );

  // Boundary: a price that is just under the threshold must still be "live".
  const now = Date.now();
  const justFresh = getLiveFreshness({
    updatedAt: new Date(now - (GOLD_MARKET.STALE_AFTER_MS - 1_000)).toISOString(),
    hasLiveFailure: false,
  });
  assert.equal(justFresh.key, 'live');

  // Boundary: a price just past the threshold must classify as "stale", even
  // when the live fetch reportedly succeeded.
  const justStale = getLiveFreshness({
    updatedAt: new Date(now - (GOLD_MARKET.STALE_AFTER_MS + 1_000)).toISOString(),
    hasLiveFailure: false,
  });
  assert.equal(justStale.key, 'stale');
});

// §22b Phase 4 — equivalence guard for the homepage's previously-duplicated
// getMarketStatus() implementation. Ensures the shared primitive stays behavior-
// compatible with the local impl that `src/pages/home.js` used to carry.
test('getMarketStatus() matches the legacy home.js open/closed rules', async () => {
  const { getMarketStatus } = await load();

  // Replicates src/pages/home.js getMarketStatus() prior to Phase 4 dedup.
  function legacy(now) {
    const utcDay = now.getUTCDay();
    const utcTime = now.getUTCHours() * 60 + now.getUTCMinutes();
    const OPEN_SUN = 22 * 60;
    const CLOSE_FRI = 21 * 60;
    let isOpen = false;
    if (utcDay === 6) isOpen = false;
    else if (utcDay === 5) isOpen = utcTime < CLOSE_FRI;
    else if (utcDay === 0) isOpen = utcTime >= OPEN_SUN;
    else isOpen = true;
    return isOpen;
  }

  // Sample every 30 minutes across a full week to catch schedule-edge drift.
  const start = new Date('2026-04-19T00:00:00Z'); // Sunday 00:00 UTC
  for (let minute = 0; minute < 7 * 24 * 60; minute += 30) {
    const sample = new Date(start.getTime() + minute * 60_000);
    const actual = getMarketStatus(sample).isOpen;
    const expected = legacy(sample);
    assert.equal(
      actual,
      expected,
      `getMarketStatus mismatch at ${sample.toISOString()} (day=${sample.getUTCDay()}, min=${sample.getUTCHours() * 60 + sample.getUTCMinutes()})`
    );
  }
});
