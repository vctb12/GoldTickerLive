/**
 * feature-flags.js — build-time feature flags for opt-in, owner-gated capabilities.
 *
 * Every flag defaults to OFF. Flipping one to `true` enables the feature site-wide on the next
 * build. Kept deliberately separate from `constants.js` so toggling a flag never touches the
 * owner-gated pricing constants (AED peg, troy ounce). Enabling any flag that changes what users
 * see about pricing is an owner decision.
 */
export const FEATURE_FLAGS = Object.freeze({
  /**
   * Secondary-provider cross-validation (Phase 8). When `true`, the pricing layer compares the
   * primary and secondary provider spot prices and surfaces an "under review" trust state if they
   * diverge beyond the configured threshold. OFF until the owner approves enabling it live — it must
   * not change the peg/troy math or the displayed price, only add a review signal.
   */
  CROSS_VALIDATION_ENABLED: false,

  /**
   * FX-rate integrity (Phase 52). When `true`, the live USD→currency rates fetched from the FX feed
   * are sanitized by `../lib/fx-integrity.js` before they are applied to any displayed price: rates
   * that are non-finite, non-positive, or wildly out of a plausible band are dropped (no price is
   * shown for that currency rather than a corrupted one), and AED is always forced to the fixed
   * `AED_PEG` regardless of what the feed carries. Non-authoritative — it never invents a rate and
   * never touches the peg/troy math; it only rejects untrustworthy feed values. OFF until the owner
   * approves enabling it on the live price path.
   */
  FX_INTEGRITY_ENABLED: false,
});

/**
 * @param {keyof FEATURE_FLAGS} name
 * @returns {boolean}
 */
export function isFeatureEnabled(name) {
  return FEATURE_FLAGS[name] === true;
}
