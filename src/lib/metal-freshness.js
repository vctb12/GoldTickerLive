/**
 * lib/metal-freshness.js — per-metal freshness view-model (Phase 58, Theme B).
 *
 * The multi-metal comparison (Phase 56) prices each metal, and the feed adapter (Phase 57) carries an
 * `updatedAt` per metal. This module turns those timestamps into an honest freshness state per metal
 * by reusing the **canonical** `evaluateFreshnessState` from `freshness-policy.js` — the same
 * live ≤ 5s / cached ≤ 60s / delayed ≤ 300s budgets the gold badge already uses. No new policy, no
 * second source of truth: a metal's freshness is judged exactly like gold's.
 *
 * Pure and side-effect-free. A metal with no feed timestamp is `unavailable` (nothing to age), never
 * a fabricated freshness. Peg / troy-oz / framing are untouched.
 */

import { evaluateFreshnessState } from './freshness-policy.js';

/** Staleness ranking (lower = fresher) for aggregating an overall badge across metals. */
const STALENESS_RANK = {
  live: 0,
  cached: 1,
  delayed: 2,
  estimated: 3,
  fallback: 4,
  closed: 5,
  unavailable: 6,
};

function toEpochMs(value) {
  if (value == null) return NaN;
  const ms = typeof value === 'number' ? value : new Date(value).getTime();
  return Number.isFinite(ms) && ms > 0 ? ms : NaN;
}

/**
 * Freshness state for one metal from its feed timestamp.
 *
 * @param {object} input
 * @param {number|string|null} input.updatedAt   The feed's own timestamp (epoch ms or ISO).
 * @param {number} input.observedAtMs            When we read it (epoch ms). Required.
 * @param {boolean} [input.marketOpen]
 * @param {object} [input.policy]                Freshness budgets (defaults to FRESHNESS_POLICY).
 * @returns {{ state: string, ageMs: number, reason: string }}
 */
export function assessMetalFreshness({ updatedAt, observedAtMs, marketOpen = true, policy } = {}) {
  const observed = toEpochMs(observedAtMs);
  const ts = toEpochMs(updatedAt);

  // No usable timestamp → nothing to age. Honest "unavailable", not a stale-but-known state.
  if (!Number.isFinite(observed) || !Number.isFinite(ts)) {
    return { state: 'unavailable', ageMs: Number.POSITIVE_INFINITY, reason: 'no-timestamp' };
  }

  const ageMs = Math.max(0, observed - ts);
  return evaluateFreshnessState({ ageMs, marketOpen, ...(policy ? { policy } : {}) });
}

/**
 * Freshness for many metals at once.
 *
 * @param {Record<string, { updatedAt?: number|string|null }>} feedMetaByMetal
 * @param {{ observedAtMs: number, marketOpen?: boolean, policy?: object }} options
 * @returns {Record<string, { state: string, ageMs: number, reason: string }>}
 */
export function buildMetalFreshness(feedMetaByMetal = {}, options = {}) {
  const { observedAtMs, marketOpen = true, policy } = options;
  const out = {};
  for (const [key, meta] of Object.entries(feedMetaByMetal || {})) {
    out[key] = assessMetalFreshness({
      updatedAt: meta ? meta.updatedAt : null,
      observedAtMs,
      marketOpen,
      policy,
    });
  }
  return out;
}

/**
 * The stalest freshness across all metals, for an overall comparison badge — so the header never
 * looks fresher than the least-fresh metal it summarizes. Returns 'unavailable' when there are none.
 *
 * @param {Record<string, { state: string }>} freshnessByMetal
 * @returns {string}
 */
export function overallMetalFreshness(freshnessByMetal = {}) {
  const states = Object.values(freshnessByMetal || {})
    .map((f) => f && f.state)
    .filter(Boolean);
  if (!states.length) return 'unavailable';
  return states.reduce((worst, s) =>
    (STALENESS_RANK[s] ?? STALENESS_RANK.unavailable) > (STALENESS_RANK[worst] ?? -1) ? s : worst
  );
}

export { STALENESS_RANK };
