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
});

/**
 * @param {keyof FEATURE_FLAGS} name
 * @returns {boolean}
 */
export function isFeatureEnabled(name) {
  return FEATURE_FLAGS[name] === true;
}
