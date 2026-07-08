/**
 * secondary-spot-check.js — lazy client-side secondary cross-check for the live lane (T1.1).
 *
 * Reduces single-source fragility on the client live lane by comparing the primary XAU/USD spot
 * against an independent *reference* second opinion (freegoldapi.com — keyless, CORS, daily). If the
 * two diverge beyond the configured threshold, the consumer downgrades the freshness label from
 * "live" → "delayed" via `downgradeFreshnessForDivergence` (existing `live-status.js` vocabulary), so
 * a number a second source disagrees with is never shown as unlabelled "Live".
 *
 * Non-negotiables honoured:
 *   • LAZY — never fetches on every 5 s poll. `ensureFreeGoldReference()` fetches at most once per
 *     session (24 h local cache); this module additionally throttles the *compare* to
 *     `SECONDARY_CHECK_MIN_INTERVAL_MS`. It is fire-and-forget: callers read the last cached
 *     evaluation synchronously and never block a render on it.
 *   • REFERENCE / DERIVED — the secondary is labelled honestly and is only used when it is same-day
 *     fresh. A stale daily reference is treated as `insufficient-data` (no false-positive downgrade),
 *     never as a live disagreement.
 *   • FLAG-GATED, OFF by default — the whole feature is dormant unless
 *     `FEATURE_FLAGS.CROSS_VALIDATION_ENABLED` is on OR `?debug=true` forces the divergence display.
 *     It is non-authoritative: it never changes the displayed price, the AED peg, or troy math.
 */

import { ensureFreeGoldReference, getCachedFreeGoldReference } from '../freegoldapi.js';
import { isSaneGoldSpotUsd } from './fetch-utils.js';
import { fetchGold } from '../api.js';
import {
  evaluateCrossValidation,
  isCrossValidationEnabled,
  DEFAULT_DIVERGENCE_THRESHOLD_PCT,
} from './cross-validation.js';

/** Throttle window for the compare — the secondary is a coarse cross-check, not a per-poll fetch. */
export const SECONDARY_CHECK_MIN_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Max age for the reference to count as a live-lane second opinion. freegoldapi refreshes daily
 * (~06:00 UTC), so anything older than ~a day is not "today's" price and must not be compared to an
 * intraday live spot — doing so would flag normal daily drift as a divergence. Kept a touch above 24 h
 * to tolerate the refresh lag.
 */
export const REFERENCE_MAX_AGE_MS = 26 * 60 * 60 * 1000;

/** Idle sentinel — no comparison has run yet; consumers must treat this as "no downgrade". */
const IDLE_EVALUATION = Object.freeze({
  status: 'idle',
  divergencePct: null,
  underReview: false,
  secondaryUsd: null,
  secondaryUpdatedAt: null,
  source: null,
});

let _lastCheckAt = 0;
let _lastEvaluation = IDLE_EVALUATION;
let _inFlight = null;

/** `?debug=true` forces the divergence display (preview the downgraded label without a real divergence). */
export function isCrossValidationDebugForced() {
  if (typeof location === 'undefined') return false;
  try {
    return new URLSearchParams(location.search).get('debug') === 'true';
  } catch {
    return false;
  }
}

/** Whether the cross-check should run at all: build flag ON, or `?debug=true`. OFF by default. */
export function isCrossValidationActive() {
  return isCrossValidationEnabled() || isCrossValidationDebugForced();
}

/**
 * Newest same-day-fresh reference spot from freegoldapi rows, or `null`.
 *
 * Rows are ascending by date (see `normalizeFreeGoldRows`), so the last row is newest. Returns `null`
 * when there are no rows, the price is out of the sane band, or the row is older than
 * `REFERENCE_MAX_AGE_MS` — in every "not a trustworthy live-lane second opinion" case the caller then
 * sees `insufficient-data` rather than a false divergence.
 *
 * @param {Array<{ date: string, price: number, source?: string }>} [records]
 * @param {number} [now]  Reference epoch ms (default `Date.now()`).
 * @returns {{ price: number, updatedAt: string, source: string, derived: true }|null}
 */
export function getSecondaryReferenceSpotUsd(
  records = getCachedFreeGoldReference(),
  now = Date.now()
) {
  if (!Array.isArray(records) || records.length === 0) return null;
  const newest = records[records.length - 1];
  const price = Number(newest?.price);
  if (!isSaneGoldSpotUsd(price)) return null;
  const ts = new Date(newest?.date || 0).getTime();
  if (!Number.isFinite(ts) || ts <= 0) return null;
  if (now - ts > REFERENCE_MAX_AGE_MS) return null;
  return {
    price,
    updatedAt: newest.date,
    source: 'freegoldapi-reference',
    derived: true,
  };
}

/** Last cached cross-validation evaluation — synchronous, non-blocking read for render paths. */
export function getLastCrossValidationEvaluation() {
  return _lastEvaluation;
}

/**
 * Lazily (and throttled) run a secondary cross-check against `primaryUsd`, caching the result for
 * synchronous readers. Fire-and-forget: safe to call on every render tick — it no-ops unless the
 * feature is active and the throttle window has elapsed.
 *
 * `?debug=true` short-circuits to a forced `under-review` so the downgraded label can be previewed
 * live, without fetching or a real divergence.
 *
 * @param {{ primaryUsd?: number, thresholdPct?: number, now?: number }} [opts]
 * @returns {Promise<typeof _lastEvaluation>}
 */
export function maybeRunSecondarySpotCheck({
  primaryUsd,
  thresholdPct = DEFAULT_DIVERGENCE_THRESHOLD_PCT,
  now = Date.now(),
} = {}) {
  if (isCrossValidationDebugForced()) {
    _lastEvaluation = {
      status: 'debug-forced',
      divergencePct: null,
      underReview: true,
      forced: true,
      secondaryUsd: null,
      secondaryUpdatedAt: null,
      source: 'debug',
    };
    return Promise.resolve(_lastEvaluation);
  }

  if (!isCrossValidationEnabled()) return Promise.resolve(_lastEvaluation);

  const primary = Number(primaryUsd);
  if (!Number.isFinite(primary) || primary <= 0) return Promise.resolve(_lastEvaluation);

  if (_inFlight) return _inFlight;
  if (now - _lastCheckAt < SECONDARY_CHECK_MIN_INTERVAL_MS) return Promise.resolve(_lastEvaluation);
  _lastCheckAt = now;

  _inFlight = ensureFreeGoldReference()
    .then((records) => {
      const ref = getSecondaryReferenceSpotUsd(records, now);
      const evaluation = evaluateCrossValidation({
        primaryUsd: primary,
        secondaryUsd: ref?.price ?? null,
        thresholdPct,
        enabled: true,
      });
      _lastEvaluation = {
        ...evaluation,
        secondaryUsd: ref?.price ?? null,
        secondaryUpdatedAt: ref?.updatedAt ?? null,
        source: ref?.source ?? null,
      };
      return _lastEvaluation;
    })
    .catch(() => {
      _lastEvaluation = {
        status: 'insufficient-data',
        divergencePct: null,
        underReview: false,
        secondaryUsd: null,
        secondaryUpdatedAt: null,
        source: null,
      };
      return _lastEvaluation;
    })
    .finally(() => {
      _inFlight = null;
    });

  return _inFlight;
}

/**
 * Orchestrated cross-check that resolves the primary itself (default: `fetchGold`) before comparing.
 * A primary-fetch failure (e.g. `setSimulateGoldFail(true)`) yields `insufficient-data` with
 * `primaryFailed: true` — never a fabricated "agree" and never a crash — so the anti-mislabel
 * guarantee holds even when the primary source is down.
 *
 * @param {{ fetchPrimary?: () => Promise<{ price:number }>, thresholdPct?: number, now?: number }} [opts]
 */
export async function crossValidatePrimary({
  fetchPrimary = fetchGold,
  thresholdPct = DEFAULT_DIVERGENCE_THRESHOLD_PCT,
  now = Date.now(),
} = {}) {
  let primaryUsd = null;
  try {
    const primary = await fetchPrimary();
    primaryUsd = Number(primary?.price);
  } catch {
    return {
      status: 'insufficient-data',
      divergencePct: null,
      underReview: false,
      primaryFailed: true,
    };
  }

  const records = await ensureFreeGoldReference().catch(() => []);
  const ref = getSecondaryReferenceSpotUsd(records, now);
  return {
    ...evaluateCrossValidation({
      primaryUsd,
      secondaryUsd: ref?.price ?? null,
      thresholdPct,
      enabled: true,
    }),
    secondaryUsd: ref?.price ?? null,
    primaryFailed: false,
  };
}

/** Test helper — reset module state between cases. */
export function __resetSecondarySpotCheckForTests() {
  _lastCheckAt = 0;
  _lastEvaluation = IDLE_EVALUATION;
  _inFlight = null;
}
