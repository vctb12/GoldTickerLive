'use strict';

/**
 * Locale registry — proves the scaffolding is additive and, crucially, that `resolveLocale` is
 * byte-for-byte identical to the legacy `x === 'ar' ? 'ar' : 'en'` while only en/ar are active,
 * so EN/AR behaviour is unchanged. Parked pilots (fr/ur) are declared but disabled.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const LOC = new URL('../src/config/locales.js', `file://${__filename}`).href;

test('locales: en/ar are active, fr/ur are declared but parked', async () => {
  const { LOCALES, ACTIVE_LOCALE_CODES, SUPPORTED_LOCALE_CODES, isActiveLocale } = await import(
    LOC
  );
  assert.equal(LOCALES.en.enabled, true);
  assert.equal(LOCALES.ar.enabled, true);
  assert.equal(LOCALES.fr.enabled, false);
  assert.equal(LOCALES.ur.enabled, false);
  assert.deepEqual(ACTIVE_LOCALE_CODES, ['en', 'ar']);
  assert.deepEqual(SUPPORTED_LOCALE_CODES.sort(), ['ar', 'en', 'fr', 'ur']);
  assert.equal(isActiveLocale('fr'), false);
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

test('locales: resolveLocale is byte-identical to the legacy binary for every input', async () => {
  const { resolveLocale, DEFAULT_LOCALE } = await import(LOC);
  assert.equal(DEFAULT_LOCALE, 'en');
  const legacy = (x) => (x === 'ar' ? 'ar' : 'en');
  const inputs = ['ar', 'en', '', 'AR', 'EN', 'fr', 'ur', 'xx', 'arabic', null, undefined];
  for (const input of inputs) {
    assert.equal(resolveLocale(input), legacy(input), `resolveLocale(${JSON.stringify(input)})`);
  }
});

test('locales: parked pilots resolve to the default until enabled', async () => {
  const { resolveLocale } = await import(LOC);
  // fr/ur are declared but disabled → not yet returned by the resolver.
  assert.equal(resolveLocale('fr'), 'en');
  assert.equal(resolveLocale('ur'), 'en');
});

test('locales: getLocaleMeta returns full metadata and default-falls-back', async () => {
  const { getLocaleMeta } = await import(LOC);
  assert.equal(getLocaleMeta('ar').endonym, 'العربية');
  assert.equal(getLocaleMeta('fr').englishName, 'French');
  assert.equal(getLocaleMeta('nope').code, 'en'); // unknown → default meta
});
