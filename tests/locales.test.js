'use strict';

/**
 * Locale registry — proves the scaffolding is additive and, crucially, that `resolveLocale` is
 * byte-for-byte identical to the legacy `x === 'ar' ? 'ar' : 'en'` while only en/ar are active,
 * so EN/AR behaviour is unchanged. Parked pilots (fr/ur) are declared but disabled.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const LOC = new URL('../src/config/locales.js', `file://${__filename}`).href;

test('locales: en/ar/fr/ur are all active (ur live in Phase 40)', async () => {
  const { LOCALES, ACTIVE_LOCALE_CODES, SUPPORTED_LOCALE_CODES, isActiveLocale } = await import(
    LOC
  );
  assert.equal(LOCALES.en.enabled, true);
  assert.equal(LOCALES.ar.enabled, true);
  assert.equal(LOCALES.fr.enabled, true); // Phase 39 — French pilot activated.
  assert.equal(LOCALES.ur.enabled, true); // Phase 40 — Urdu pilot activated.
  assert.deepEqual(ACTIVE_LOCALE_CODES, ['en', 'ar', 'fr', 'ur']);
  assert.deepEqual(SUPPORTED_LOCALE_CODES.sort(), ['ar', 'en', 'fr', 'ur']);
  assert.equal(isActiveLocale('fr'), true);
  assert.equal(isActiveLocale('ur'), true);
  assert.equal(isActiveLocale('ar'), true);
});

test('locales: direction metadata matches the app (ar/ur rtl, en/fr ltr)', async () => {
  const { getLocaleDir, isRtlLocale } = await import(LOC);
  assert.equal(getLocaleDir('en'), 'ltr');
  assert.equal(getLocaleDir('ar'), 'rtl');
  assert.equal(getLocaleDir('fr'), 'ltr');
  assert.equal(getLocaleDir('ur'), 'rtl');
  assert.equal(isRtlLocale('ar'), true);
  assert.equal(isRtlLocale('en'), false);
  // Unknown code falls back to the default locale's direction.
  assert.equal(getLocaleDir('zz'), 'ltr');
});

test('locales: EN/AR resolution is unchanged; fr/ur now resolve to themselves', async () => {
  const { resolveLocale, DEFAULT_LOCALE } = await import(LOC);
  assert.equal(DEFAULT_LOCALE, 'en');
  // EN/AR (and every unknown value) behave exactly as the legacy `x === 'ar' ? 'ar' : 'en'`.
  const enArLegacy = (x) => (x === 'ar' ? 'ar' : 'en');
  for (const input of ['ar', 'en', '', 'AR', 'EN', 'xx', 'arabic', null, undefined]) {
    assert.equal(
      resolveLocale(input),
      enArLegacy(input),
      `resolveLocale(${JSON.stringify(input)})`
    );
  }
  // Pilots are live, so the resolver now returns them (exact-match only).
  assert.equal(resolveLocale('fr'), 'fr');
  assert.equal(resolveLocale('ur'), 'ur');
});

test('locales: unknown codes still resolve to the default', async () => {
  const { resolveLocale } = await import(LOC);
  assert.equal(resolveLocale('de'), 'en');
  assert.equal(resolveLocale('zz'), 'en');
});

test('locales: getLocaleMeta returns full metadata and default-falls-back', async () => {
  const { getLocaleMeta } = await import(LOC);
  assert.equal(getLocaleMeta('ar').endonym, 'العربية');
  assert.equal(getLocaleMeta('fr').englishName, 'French');
  assert.equal(getLocaleMeta('nope').code, 'en'); // unknown → default meta
});
