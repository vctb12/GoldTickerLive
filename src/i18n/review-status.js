/**
 * i18n/review-status.js — shared review-status constants for translated content (Phase 41).
 *
 * Extracted into its own module so both the content batches and the indexability governance can
 * import it without a circular dependency.
 */

/** Review states a content batch can be in. */
export const REVIEW_STATUS = Object.freeze({
  PENDING: 'pending-human-review',
  REVIEWED: 'human-reviewed',
});
