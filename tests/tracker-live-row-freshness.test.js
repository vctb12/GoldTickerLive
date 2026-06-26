'use strict';

/**
 * tracker-live-row-freshness.test.js
 *
 * Guards the freshness-honesty contract for the synthetic "current price" row
 * that the tracker appends to its chart series and CSV/JSON exports.
 *
 * Regression target: the row was previously hard-labelled `source: 'live'`
 * (only downgraded to `cached` on a hard live-fetch failure). That stamped
 * delayed / cached / stale / fallback / closed data as "live" in downloaded
 * exports and the chart resolution — a violation of the AGENTS.md freshness
 * non-negotiable ("If data is not truly live, must not call it live").
 *
 * The fix routes the row through deriveLiveRowFreshness(effectiveKey) and lets
 * the export writer's rowFreshnessState() honour the explicit freshnessState.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function load(rel) {
  const url = new URL('file://' + path.resolve(__dirname, '..', rel));
  return import(url.href);
}

const NON_LIVE_KEYS = ['delayed', 'cached', 'stale', 'fallback', 'closed', 'unavailable'];

test('deriveLiveRowFreshness: genuinely live data stays live', async () => {
  const { deriveLiveRowFreshness } = await load('src/tracker/chart.js');
  assert.deepEqual(deriveLiveRowFreshness('live'), {
    source: 'live',
    freshnessState: 'live',
  });
});

test('deriveLiveRowFreshness: non-live freshness keys never claim live', async () => {
  const { deriveLiveRowFreshness } = await load('src/tracker/chart.js');
  for (const key of NON_LIVE_KEYS) {
    const row = deriveLiveRowFreshness(key);
    assert.equal(row.source, 'cached', `freshness "${key}" must not be sourced as 'live'`);
    assert.equal(
      row.freshnessState,
      key,
      `freshness "${key}" must be preserved for export honesty`
    );
  }
});

test('export writer labels a stale current-price row honestly (freshnessState overrides granularity)', async () => {
  const { deriveLiveRowFreshness } = await load('src/tracker/chart.js');
  const { rowFreshnessState } = await load('src/lib/export.js');
  // granularity 'live' previously forced the CSV "Freshness state" column to 'live'.
  const row = { date: '2026-06-26', granularity: 'live', ...deriveLiveRowFreshness('stale') };
  assert.equal(rowFreshnessState(row), 'stale');
});

test('export writer still labels genuinely live data as live', async () => {
  const { deriveLiveRowFreshness } = await load('src/tracker/chart.js');
  const { rowFreshnessState } = await load('src/lib/export.js');
  const row = { date: '2026-06-26', granularity: 'live', ...deriveLiveRowFreshness('live') };
  assert.equal(rowFreshnessState(row), 'live');
});
