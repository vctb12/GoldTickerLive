'use strict';

/**
 * Content-translation policy — proves the "no auto-only indexed" rule is enforced in code: MT-only
 * content is never indexable, only an explicit human review is, and the first French content batch
 * ships pending (→ noindex) while preserving the immutable invariants verbatim.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const STATUS = new URL('../src/i18n/translation-status.js', `file://${__filename}`).href;
const BATCH = new URL('../src/i18n/fr-content-batch-1.js', `file://${__filename}`).href;
const CFG = new URL('../src/config/index.js', `file://${__filename}`).href;

test('policy: MT-only content is never indexable; only human review is', async () => {
  const { MT_ONLY_INDEXABLE, isContentIndexable, REVIEW_STATUS } = await import(STATUS);
  assert.equal(MT_ONLY_INDEXABLE, false);
  assert.equal(isContentIndexable(REVIEW_STATUS.PENDING), false);
  assert.equal(isContentIndexable('anything-else'), false);
  assert.equal(isContentIndexable(undefined), false);
  assert.equal(isContentIndexable(REVIEW_STATUS.REVIEWED), true);
});

test('policy: the first FR content batch ships pending → not indexable', async () => {
  const { isBatchIndexable, indexableContentLocales, contentBatches } = await import(STATUS);
  const { FR_CONTENT_BATCH_1_META } = await import(BATCH);
  assert.equal(FR_CONTENT_BATCH_1_META.status, 'pending-human-review');
  assert.equal(isBatchIndexable(FR_CONTENT_BATCH_1_META.id), false);
  // No content locale is indexable yet (the only batch is pending).
  assert.deepEqual(indexableContentLocales(), []);
  // The batch is registered in the governance registry.
  assert.ok(contentBatches().some((b) => b.id === FR_CONTENT_BATCH_1_META.id));
});

test('policy: unknown batch ids fail closed (not indexable)', async () => {
  const { isBatchIndexable } = await import(STATUS);
  assert.equal(isBatchIndexable('no-such-batch'), false);
});

test('policy: a reviewed status WOULD make it indexable (sign-off path works)', async () => {
  const { isContentIndexable, indexableContentLocales, REVIEW_STATUS } = await import(STATUS);
  // Direct proof the gate opens on review without mutating the shipped (pending) batch.
  assert.equal(isContentIndexable(REVIEW_STATUS.REVIEWED), true);
  // Sanity: with only a pending batch registered, no locale is indexable.
  assert.ok(!indexableContentLocales().includes('fr'));
});

test('fr-content-batch-1: every key exists in TRANSLATIONS.en (no orphan strings)', async () => {
  const { FR_CONTENT_BATCH_1_KEYS } = await import(BATCH);
  const { TRANSLATIONS } = await import(CFG);
  const enKeys = new Set(Object.keys(TRANSLATIONS.en));
  const orphans = FR_CONTENT_BATCH_1_KEYS.filter((k) => !enKeys.has(k));
  assert.deepEqual(orphans, [], 'batch must only translate existing EN keys');
  assert.ok(FR_CONTENT_BATCH_1_KEYS.every((k) => k.startsWith('methodology.')));
});

test('fr-content-batch-1: immutable invariants preserved verbatim in French', async () => {
  const { FR_CONTENT_BATCH_1 } = await import(BATCH);
  // Troy-ounce constant and AED peg carried through exactly.
  assert.match(FR_CONTENT_BATCH_1['methodology.stepGram'], /31\.1035/);
  assert.match(FR_CONTENT_BATCH_1['methodology.stepLocal'], /3\.6725/);
  // The formula is preserved character-for-character.
  assert.equal(
    FR_CONTENT_BATCH_1['methodology.formula'],
    'price_per_gram_local = (XAU/USD ÷ 31.1035) × karat_factor × local_fx'
  );
  // Reference-estimate framing survives translation (not retail).
  assert.match(FR_CONTENT_BATCH_1['methodology.referenceDisclaimer'], /Estimation de référence/i);
});

test('fr-content-batch-1: French values are non-empty and (bar the formula) differ from English', async () => {
  const { FR_CONTENT_BATCH_1 } = await import(BATCH);
  const { TRANSLATIONS } = await import(CFG);
  let differ = 0;
  for (const [key, value] of Object.entries(FR_CONTENT_BATCH_1)) {
    assert.equal(typeof value, 'string');
    assert.ok(value.trim().length > 0, `empty value for ${key}`);
    if (value !== TRANSLATIONS.en[key]) differ += 1;
  }
  // Only the formula (and code-like headers) may legitimately match EN.
  assert.ok(differ >= Object.keys(FR_CONTENT_BATCH_1).length - 2);
});
