/**
 * cross-validation.js — pure secondary-provider divergence detection (Phase 8, feature-flagged).
 *
 * Compares the primary and secondary provider spot prices (XAU/USD) and classifies whether they
 * agree or diverge enough to warrant an "under review" trust signal. This module is:
 *   • pure — math only; no fetching, no DOM, no timers, no side effects;
 *   • non-authoritative — it never changes the peg/troy math or the displayed price, it only
 *     produces a review status a consumer may surface;
 *   • dormant by default — gated by FEATURE_FLAGS.CROSS_VALIDATION_ENABLED (OFF). Enabling it live
 *     is an owner decision (see reports/data/phase8-cross-validation-2026-07-07.md).
 *
 * The repo already carries the plumbing this hooks into: `secondary-provider.js` and the
 * `secondaryHealth` snapshot in `realtime-pricing-engine.js`. This adds only the comparison logic.
 */
import { isFeatureEnabled } from '../../config/feature-flags.js';

/** Divergence (percent) beyond which two provider prices are flagged "under review". */
export const DEFAULT_DIVERGENCE_THRESHOLD_PCT = 0.75;

/** @returns {boolean} whether cross-validation is enabled by the build flag. */
export function isCrossValidationEnabled() {
  return isFeatureEnabled('CROSS_VALIDATION_ENABLED');
}

/**
 * Symmetric percentage divergence between two positive prices (relative to their mean), or `null`
 * when either input is not a valid positive number.
 * @param {number} primaryUsd
 * @param {number} secondaryUsd
 * @returns {number|null}
 */
export function computeDivergencePct(primaryUsd, secondaryUsd) {
  const a = Number(primaryUsd);
  const b = Number(secondaryUsd);
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) return null;
  const mid = (a + b) / 2;
  return (Math.abs(a - b) / mid) * 100;
}

/**
 * Classify the primary vs secondary spot prices.
 *
 * @param {object}  [opts]
 * @param {number}  [opts.primaryUsd]     Primary provider XAU/USD spot.
 * @param {number}  [opts.secondaryUsd]   Secondary provider XAU/USD spot.
 * @param {number}  [opts.thresholdPct]   Divergence threshold (%). Defaults to 0.75%.
 * @param {boolean} [opts.enabled]        Override the flag (mainly for tests).
 * @returns {{ status:'disabled'|'insufficient-data'|'agree'|'under-review', divergencePct:number|null, underReview:boolean }}
 */
export function evaluateCrossValidation({
  primaryUsd,
  secondaryUsd,
  thresholdPct = DEFAULT_DIVERGENCE_THRESHOLD_PCT,
  enabled = isCrossValidationEnabled(),
} = {}) {
  if (!enabled) return { status: 'disabled', divergencePct: null, underReview: false };
  const divergencePct = computeDivergencePct(primaryUsd, secondaryUsd);
  if (divergencePct == null) {
    return { status: 'insufficient-data', divergencePct: null, underReview: false };
  }
  const threshold =
    Number.isFinite(thresholdPct) && thresholdPct > 0
      ? thresholdPct
      : DEFAULT_DIVERGENCE_THRESHOLD_PCT;
  const underReview = divergencePct > threshold;
  return { status: underReview ? 'under-review' : 'agree', divergencePct, underReview };
}
