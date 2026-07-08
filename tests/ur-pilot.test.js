'use strict';

/**
 * Urdu pilot — proves Urdu is a live, RTL locale that reuses the Arabic RTL infra; the pilot only
 * translates keys that exist in EN (no orphan strings); covered keys render Urdu while everything
 * else falls back to English; the pilot mirrors the French pilot's key set; and the
 * reference-estimate framing survives translation.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const UR = new URL('../src/i18n/ur-pilot.js', `file://${__filename}`).href;
const FR = new URL('../src/i18n/fr-pilot.js', `file://${__filename}`).href;
const LOC = new URL('../src/config/locales.js', `file://${__filename}`).href;
const I18N = new URL('../src/lib/i18n.js', `file://${__filename}`).href;
const CFG = new URL('../src/config/index.js', `file://${__filename}`).href;

test('ur-pilot: Urdu is an active, RTL locale (reuses AR direction infra)', async () => {
  const { isActiveLocale, isRtlLocale, resolveLocale, getLocaleDir, getLocaleMeta } = await import(
    LOC
  );
  assert.equal(isActiveLocale('ur'), true);
  assert.equal(isRtlLocale('ur'), true); // Urdu is right-to-left, same as Arabic.
  assert.equal(getLocaleDir('ur'), getLocaleDir('ar')); // identical rtl handling
  assert.equal(resolveLocale('ur'), 'ur');
  assert.equal(getLocaleMeta('ur').endonym, 'اردو');
});

test('ur-pilot: every pilot key exists in TRANSLATIONS.en (no orphan strings)', async () => {
  const { UR_PILOT_KEYS } = await import(UR);
  const { TRANSLATIONS } = await import(CFG);
  const enKeys = new Set(Object.keys(TRANSLATIONS.en));
  const orphans = UR_PILOT_KEYS.filter((k) => !enKeys.has(k));
  assert.deepEqual(orphans, [], 'pilot must only translate existing EN keys');
  assert.ok(UR_PILOT_KEYS.length >= 50, 'pilot should cover the core-pages surface');
});

test('ur-pilot: covers the same key set as the French pilot', async () => {
  const { UR_PILOT_KEYS } = await import(UR);
  const { FR_PILOT_KEYS } = await import(FR);
  assert.deepEqual([...UR_PILOT_KEYS].sort(), [...FR_PILOT_KEYS].sort());
});

test('ur-pilot: all Urdu values are non-empty strings and mostly differ from English', async () => {
  const { UR_PILOT } = await import(UR);
  const { TRANSLATIONS } = await import(CFG);
  let differ = 0;
  for (const [key, value] of Object.entries(UR_PILOT)) {
    assert.equal(typeof value, 'string');
    assert.ok(value.trim().length > 0, `empty Urdu value for ${key}`);
    if (value !== TRANSLATIONS.en[key]) differ += 1;
  }
  assert.ok(differ >= Object.keys(UR_PILOT).length - 3, 'most keys must be actually translated');
});

test('ur-pilot: withUrduPilot yields Urdu for covered keys, English for the rest', async () => {
  const { withUrduPilot } = await import(UR);
  const { translate } = await import(I18N);
  const { TRANSLATIONS } = await import(CFG);
  const dict = withUrduPilot(TRANSLATIONS);

  assert.equal(translate(dict, 'ur', 'nav.home'), 'ہوم');
  assert.equal(translate(dict, 'ur', 'card.copy'), 'کاپی');
  // Not covered by the pilot → English fallback (not a raw key, not Arabic).
  const uncovered = Object.keys(TRANSLATIONS.en).find(
    (k) => k.startsWith('tracker.') && TRANSLATIONS.en[k]
  );
  assert.equal(translate(dict, 'ur', uncovered), TRANSLATIONS.en[uncovered]);
  assert.equal(TRANSLATIONS.ur, undefined); // input not mutated
});

test('ur-pilot: reference-estimate framing is preserved in Urdu', async () => {
  const { UR_PILOT } = await import(UR);
  // "not financial advice" carries into both disclaimers.
  assert.match(UR_PILOT['footer.disclaimer'], /مالی مشورہ نہیں/);
  assert.match(UR_PILOT['karat.disclaimer'], /مالی مشورہ نہیں/);
  // Estimated bullion-equivalent framing.
  assert.match(UR_PILOT['spotlight.note'], /بُلین کے مساوی/);
});
