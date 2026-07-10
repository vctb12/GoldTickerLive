'use strict';

/**
 * Freshness-badge metadata regression lock (Phase 63, shippable-now).
 *
 * `src/lib/freshness.js` maps a freshness state to the user-facing badge (tone + translation key),
 * normalizes unknown / market-closed states, and formats the UTC "updated at" timestamp — all
 * user-visible and, until now, untested. This suite pins that behaviour so the badges users see can't
 * silently regress. Imports the REAL module (no inline copy).
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const MOD = new URL('../src/lib/freshness.js', `file://${__filename}`).href;

test('freshness: config covers every state with a tone + translation key', async () => {
  const { FRESHNESS_CONFIG } = await import(MOD);
  for (const state of [
    'live',
    'cached',
    'delayed',
    'estimated',
    'fallback',
    'closed',
    'stale',
    'unavailable',
  ]) {
    assert.ok(FRESHNESS_CONFIG[state], `missing config for ${state}`);
    assert.equal(typeof FRESHNESS_CONFIG[state].tone, 'string');
    assert.match(FRESHNESS_CONFIG[state].translationKey, /^freshness\.badge\./);
  }
  // stale / unavailable degrade to the fallback tone.
  assert.equal(FRESHNESS_CONFIG.stale.tone, 'fallback');
  assert.equal(FRESHNESS_CONFIG.unavailable.tone, 'fallback');
});

test('freshness: normalizeFreshnessState — known passes, unknown → estimated, closed market wins', async () => {
  const { normalizeFreshnessState } = await import(MOD);
  assert.equal(normalizeFreshnessState('live'), 'live');
  assert.equal(normalizeFreshnessState('cached'), 'cached');
  assert.equal(normalizeFreshnessState('nonsense'), 'estimated');
  assert.equal(normalizeFreshnessState(undefined), 'estimated');
  // A closed market overrides even a "live" state — truth-first.
  assert.equal(normalizeFreshnessState('live', { marketOpen: false }), 'closed');
  assert.equal(normalizeFreshnessState('nonsense', { marketOpen: false }), 'closed');
});

test('freshness: getFreshnessMeta maps tone/key, defaults source, and honours market-closed', async () => {
  const { getFreshnessMeta, FRESHNESS_CONFIG } = await import(MOD);
  const live = getFreshnessMeta({ state: 'live', updatedAt: '2026-07-08T13:05:00Z' });
  assert.equal(live.state, 'live');
  assert.equal(live.tone, FRESHNESS_CONFIG.live.tone);
  assert.equal(live.translationKey, FRESHNESS_CONFIG.live.translationKey);
  assert.equal(live.updatedAt, '2026-07-08T13:05:00Z');
  assert.equal(live.source, 'Gold Ticker Live'); // default when source omitted

  // Explicit source is preserved.
  assert.equal(
    getFreshnessMeta({ state: 'cached', source: 'gold-api.com' }).source,
    'gold-api.com'
  );

  // Unknown state → estimated; defaults with no args → estimated.
  assert.equal(getFreshnessMeta({ state: 'bogus' }).state, 'estimated');
  assert.equal(getFreshnessMeta().state, 'estimated');

  // Market closed downgrades to the closed badge regardless of the incoming state.
  const closed = getFreshnessMeta({ state: 'live', marketOpen: false });
  assert.equal(closed.state, 'closed');
  assert.equal(closed.tone, FRESHNESS_CONFIG.closed.tone);
});

test('freshness: formatUtcTimestamp renders UTC 24h, and guards empty/invalid input', async () => {
  const { formatUtcTimestamp } = await import(MOD);
  assert.equal(formatUtcTimestamp(null), '—');
  assert.equal(formatUtcTimestamp(''), '—');
  assert.equal(formatUtcTimestamp('not-a-date'), '—');

  const out = formatUtcTimestamp('2026-07-08T13:05:00Z'); // en-GB, UTC, 24h
  assert.notEqual(out, '—');
  assert.match(out, /2026/);
  assert.match(out, /13:05/); // UTC hour:minute, 24-hour (not 1:05 PM)
  assert.doesNotMatch(out, /AM|PM/i);

  // Arabic locale still renders a real (non-dash) string for a valid date.
  const ar = formatUtcTimestamp('2026-07-08T13:05:00Z', 'ar');
  assert.notEqual(ar, '—');
  assert.equal(typeof ar, 'string');
});
