'use strict';

/**
 * French pilot — proves French is a live, LTR locale; the pilot only translates keys that exist in
 * EN (no orphan/new strings); covered keys render French while everything else falls back to English
 * via the shared translate helper; and the reference-estimate framing survives translation.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const FR = new URL('../src/i18n/fr-pilot.js', `file://${__filename}`).href;
const LOC = new URL('../src/config/locales.js', `file://${__filename}`).href;
const I18N = new URL('../src/lib/i18n.js', `file://${__filename}`).href;
const CFG = new URL('../src/config/index.js', `file://${__filename}`).href;

test('fr-pilot: French is an active, LTR locale', async () => {
  const { isActiveLocale, isRtlLocale, resolveLocale, getLocaleMeta } = await import(LOC);
  assert.equal(isActiveLocale('fr'), true);
  assert.equal(isRtlLocale('fr'), false); // French is left-to-right.
  assert.equal(resolveLocale('fr'), 'fr');
  assert.equal(getLocaleMeta('fr').endonym, 'Français');
});

test('fr-pilot: every pilot key exists in TRANSLATIONS.en (no orphan strings)', async () => {
  const { FR_PILOT_KEYS } = await import(FR);
  const { TRANSLATIONS } = await import(CFG);
  const enKeys = new Set(Object.keys(TRANSLATIONS.en));
  const orphans = FR_PILOT_KEYS.filter((k) => !enKeys.has(k));
  assert.deepEqual(orphans, [], 'pilot must only translate existing EN keys');
  assert.ok(FR_PILOT_KEYS.length >= 50, 'pilot should cover the core-pages surface');
});

test('fr-pilot: all French values are non-empty strings and mostly differ from English', async () => {
  const { FR_PILOT } = await import(FR);
  const { TRANSLATIONS } = await import(CFG);
  let differ = 0;
  for (const [key, value] of Object.entries(FR_PILOT)) {
    assert.equal(typeof value, 'string');
    assert.ok(value.trim().length > 0, `empty French value for ${key}`);
    if (value !== TRANSLATIONS.en[key]) differ += 1;
  }
  // A handful (e.g. 'USD') are legitimately identical; the vast majority must be real translations.
  assert.ok(differ >= Object.keys(FR_PILOT).length - 3, 'most keys must be actually translated');
});

test('fr-pilot: withFrenchPilot yields French for covered keys, English for the rest', async () => {
  const { withFrenchPilot } = await import(FR);
  const { translate } = await import(I18N);
  const { TRANSLATIONS } = await import(CFG);
  const dict = withFrenchPilot(TRANSLATIONS);

  // Covered → French.
  assert.equal(translate(dict, 'fr', 'nav.home'), 'Accueil');
  assert.equal(translate(dict, 'fr', 'card.copied'), 'Copié !');
  // Not covered by the pilot → English fallback (not a raw key, not Arabic).
  const uncovered = Object.keys(TRANSLATIONS.en).find(
    (k) => k.startsWith('tracker.') && TRANSLATIONS.en[k]
  );
  assert.equal(translate(dict, 'fr', uncovered), TRANSLATIONS.en[uncovered]);
  // Input map is not mutated.
  assert.equal(TRANSLATIONS.fr, undefined);
});

test('fr-pilot: reference-estimate framing is preserved in French', async () => {
  const { FR_PILOT } = await import(FR);
  // "Not financial advice" carries into both disclaimers.
  assert.match(FR_PILOT['footer.disclaimer'], /conseil financier/i);
  assert.match(FR_PILOT['karat.disclaimer'], /conseil financier/i);
  // Estimated bullion-equivalent framing, not retail.
  assert.match(FR_PILOT['spotlight.note'], /estimée équivalente en lingots/i);
});
