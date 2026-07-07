'use strict';

/**
 * Shared translate helper — proves it reproduces the app's inline
 * `TRANSLATIONS[locale]?.[key] ?? TRANSLATIONS.en?.[key] ?? key` chain exactly (so EN/AR output is
 * unchanged), plus `{token}` interpolation and the bound-translator shape.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const I18N = new URL('../src/lib/i18n.js', `file://${__filename}`).href;
const CFG = new URL('../src/config/index.js', `file://${__filename}`).href;

// Synthetic fixture for edge cases we can control precisely.
const DICT = {
  en: { greet: 'Hello', only_en: 'English only', tpl: '{n} of {total}' },
  ar: { greet: 'مرحبا' }, // no `only_en`, no `tpl` → must fall back to en
};

test('i18n: locale hit returns the locale string', async () => {
  const { translate } = await import(I18N);
  assert.equal(translate(DICT, 'ar', 'greet'), 'مرحبا');
  assert.equal(translate(DICT, 'en', 'greet'), 'Hello');
});

test('i18n: missing key in locale falls back to English, then to the key', async () => {
  const { translate } = await import(I18N);
  assert.equal(translate(DICT, 'ar', 'only_en'), 'English only'); // en fallback
  assert.equal(translate(DICT, 'ar', 'nope'), 'nope'); // key fallback
  assert.equal(translate(DICT, 'ar', 'nope', { fallback: '—' }), '—'); // explicit fallback
});

test('i18n: unknown locale falls back to English', async () => {
  const { translate } = await import(I18N);
  assert.equal(translate(DICT, 'fr', 'greet'), 'Hello');
});

test('i18n: interpolation fills {token} and {{token}}, leaves unknown tokens', async () => {
  const { translate, interpolate } = await import(I18N);
  assert.equal(translate(DICT, 'en', 'tpl', { vars: { n: 3, total: 9 } }), '3 of 9');
  assert.equal(interpolate('{{a}}-{b}', { a: 'x', b: 'y' }), 'x-y');
  assert.equal(interpolate('{missing} kept', {}), '{missing} kept');
});

test('i18n: createTranslator binds dict + locale into t(key, vars)', async () => {
  const { createTranslator } = await import(I18N);
  const t = createTranslator(DICT, 'ar');
  assert.equal(t('greet'), 'مرحبا');
  assert.equal(t('only_en'), 'English only');
  assert.equal(t('tpl', { n: 1, total: 2 }), '1 of 2');
});

test('i18n: matches the legacy inline chain across a sweep of real TRANSLATIONS keys', async () => {
  const { translate } = await import(I18N);
  const { TRANSLATIONS } = await import(CFG);
  const legacy = (locale, key) => TRANSLATIONS[locale]?.[key] ?? TRANSLATIONS.en?.[key] ?? key;

  const keys = Object.keys(TRANSLATIONS.en);
  assert.ok(keys.length > 50, 'expected a substantial EN dictionary');
  for (const locale of ['en', 'ar', 'fr']) {
    for (const key of keys) {
      assert.equal(
        translate(TRANSLATIONS, locale, key),
        legacy(locale, key),
        `divergence at ${locale}:${key}`
      );
    }
  }
});
