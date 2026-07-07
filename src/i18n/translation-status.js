/**
 * i18n/translation-status.js — governance for translated *content* indexability (Phase 41).
 *
 * Codifies the one rule that keeps machine/agent-drafted translations out of the search index:
 * **content is indexable only after a human review sign-off.** Everything else — a fresh batch, an
 * MT draft — is `pending-human-review` and is treated as `noindex` by the SEO layer.
 *
 * This is the enforceable half of `docs/i18n/content-translation-policy.md`: pages, sitemap, and
 * hreflang emission consult `isBatchIndexable()` / `indexableContentLocales()` so no un-reviewed
 * translation can leak into indexable surfaces. UI-shell pilots (Phases 39/40) are a separate tier —
 * hand-authored chrome, not indexable *content* — and are not governed here.
 */

import { REVIEW_STATUS } from './review-status.js';
import { FR_CONTENT_BATCH_1_META } from './fr-content-batch-1.js';

export { REVIEW_STATUS };

/**
 * Policy invariant: machine-translated-only (i.e. not-yet-human-reviewed) content is NEVER indexable.
 * This constant exists so the rule is a single, testable source of truth rather than scattered logic.
 */
export const MT_ONLY_INDEXABLE = false;

/**
 * Static registry of every known content batch, keyed by id. New content batches are added here by
 * importing their `*_META`. UI-shell pilots are intentionally absent (different tier).
 * @type {Record<string, { id: string, locale: string, tier: string, status: string, keyCount: number }>}
 */
const CONTENT_BATCHES = Object.freeze(
  [FR_CONTENT_BATCH_1_META].reduce((acc, meta) => {
    acc[meta.id] = meta;
    return acc;
  }, {})
);

/** All registered content batches. */
export function contentBatches() {
  return Object.values(CONTENT_BATCHES);
}

/**
 * Whether a given review status makes content indexable. Only an explicit human review does; the
 * MT-only default is governed by {@link MT_ONLY_INDEXABLE} (false).
 * @param {string} status
 * @returns {boolean}
 */
export function isContentIndexable(status) {
  if (status === REVIEW_STATUS.REVIEWED) return true;
  return MT_ONLY_INDEXABLE; // pending / unknown → the MT-only policy (false)
}

/** Whether a specific registered batch is indexable. Unknown batch → false (fail closed). */
export function isBatchIndexable(batchId) {
  const batch = CONTENT_BATCHES[batchId];
  return batch ? isContentIndexable(batch.status) : false;
}

/**
 * Locales that have at least one human-reviewed content batch — i.e. locales whose translated content
 * may appear in indexable surfaces (sitemap entries, indexable hreflang alternates). Un-reviewed
 * locales are excluded, so the SEO layer can `noindex` them.
 * @returns {string[]}
 */
export function indexableContentLocales() {
  const locales = new Set();
  for (const batch of contentBatches()) {
    if (isContentIndexable(batch.status)) locales.add(batch.locale);
  }
  return [...locales];
}
