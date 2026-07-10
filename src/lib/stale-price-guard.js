/**
 * lib/stale-price-guard.js — stale-price protection layer (Phase 50).
 *
 * The freshness policy trusts the `ageMs` it is handed. That age is derived upstream from
 * `quote.providerTimestamp || quote.fetchedAt || 0` and clamped with `Math.max(0, now - ts)`, so two
 * blind spots can let a stale spot price be shown as **live**:
 *   1. the provider returns NO data timestamp → age falls back to the client fetch time (≈ 0), and
 *   2. the provider returns a FUTURE timestamp → `Math.max(0, …)` clamps the age to 0.
 * In both cases we have no evidence the underlying spot is actually recent, yet it reads as current.
 *
 * This module derives a *trustworthy* data age from the PROVIDER's own timestamp and returns the
 * freshest state a quote may honestly claim. It is truth-first and **downgrade-only**: it never makes
 * a quote look fresher than the age evidence supports, never overrides age-based truth, and never
 * touches the price itself. Pure and side-effect-free.
 */

import { FRESHNESS_POLICY } from './freshness-policy.js';
import { isFeatureEnabled } from '../config/feature-flags.js';

/**
 * A provider timestamp may lead our observation clock by at most this much before we treat it as
 * untrustworthy (clock skew / bad provider data) rather than a genuine fresh reading.
 */
export const DEFAULT_CLOCK_SKEW_TOLERANCE_MS = 2000;

/** Age-derived states, freshest → stalest. Only these are clamped here. */
const RECENCY_LADDER = ['live', 'cached', 'delayed', 'estimated'];

function ladderIndex(state) {
  const i = RECENCY_LADDER.indexOf(state);
  return i === -1 ? RECENCY_LADDER.length : i; // unknown / non-ladder → treat as stalest
}

/** Coerce an epoch-ms number or ISO/Date value to a positive epoch-ms, else null. */
function toEpochMs(value) {
  if (value == null) return null;
  const ms = typeof value === 'number' ? value : new Date(value).getTime();
  return Number.isFinite(ms) && ms > 0 ? ms : null;
}

function stateForAge(ageMs, policy) {
  if (ageMs <= policy.liveMaxAgeMs) return 'live';
  if (ageMs <= policy.cachedMaxAgeMs) return 'cached';
  if (ageMs <= policy.delayedMaxAgeMs) return 'delayed';
  return 'estimated';
}

function untrusted(reason) {
  return {
    trusted: false,
    stale: true,
    dataAgeMs: Number.POSITIVE_INFINITY,
    maxState: 'estimated',
    reason,
  };
}

/**
 * Assess whether a quote's freshness can be trusted from the provider's own data timestamp, and the
 * freshest state it may honestly claim.
 *
 * @param {object} input
 * @param {number|string|Date|null} input.providerTimestamp  The PROVIDER's own data timestamp
 *   (epoch ms, ISO string, or Date). NOT the client fetch time.
 * @param {number} input.observedAtMs   When we observed the quote (epoch ms). Required.
 * @param {object} [input.policy]        Freshness budgets (defaults to FRESHNESS_POLICY).
 * @param {number} [input.clockSkewToleranceMs]
 * @returns {{ trusted:boolean, stale:boolean, dataAgeMs:number, maxState:'live'|'cached'|'delayed'|'estimated', reason:string }}
 */
export function assessQuoteFreshness({
  providerTimestamp,
  observedAtMs,
  policy = FRESHNESS_POLICY,
  clockSkewToleranceMs = DEFAULT_CLOCK_SKEW_TOLERANCE_MS,
} = {}) {
  const observed = toEpochMs(observedAtMs);
  const providerMs = toEpochMs(providerTimestamp);
  const tolerance = Number.isFinite(clockSkewToleranceMs) ? Math.max(0, clockSkewToleranceMs) : 0;

  // We must know WHEN we observed the quote to reason about age at all.
  if (observed == null) return untrusted('no-observation-time');
  // No provider data timestamp → cannot prove the underlying spot is recent. Never claim live.
  if (providerMs == null) return untrusted('no-provider-timestamp');
  // Provider timestamp leads our clock beyond tolerance → implausible; do not clamp it to age 0.
  if (providerMs - observed > tolerance) return untrusted('timestamp-in-future');

  const dataAgeMs = Math.max(0, observed - providerMs);
  const maxState = stateForAge(dataAgeMs, policy);
  return {
    trusted: true,
    stale: maxState === 'estimated',
    dataAgeMs,
    maxState,
    reason: `age-${maxState}`,
  };
}

/**
 * Clamp a freshness state produced elsewhere so it is never FRESHER than the guard permits.
 * Downgrade-only: returns the staler of `state` and `guard.maxState` on the recency ladder;
 * non-ladder states (fallback / closed / unavailable) are already non-live and pass through.
 *
 * @param {string} state  The freshness state proposed by the policy.
 * @param {{ maxState?: string }} guard  Result of {@link assessQuoteFreshness}.
 * @returns {string}
 */
export function clampStateToGuard(state, guard) {
  if (!guard || !guard.maxState) return state;
  if (!RECENCY_LADDER.includes(state)) return state; // fallback/closed/unavailable unchanged
  return ladderIndex(guard.maxState) > ladderIndex(state) ? guard.maxState : state;
}

/** Whether the stale-price guard is enabled for the live price path (owner-gated, default OFF). */
export function isStalePriceGuardEnabled() {
  return isFeatureEnabled('STALE_PRICE_GUARD_ENABLED');
}
