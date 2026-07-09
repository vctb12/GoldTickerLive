'use strict';

/**
 * Hindi pilot — proves Hindi is a live, LTR locale that reuses the default LTR infra; the pilot only
 * translates keys that exist in EN (no orphan strings); covered keys render Hindi while everything
 * else falls back to English; the pilot mirrors the French/Urdu pilots' key set; and the
 * reference-estimate framing survives translation.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const HI = new URL('../src/i18n/hi-pilot.js', `file://${__filename}`).href;
const FR = new URL('../src/i18n/fr-pilot.js', `file://${__filename}`).href;
const LOC = new URL('../src/config/locales.js', `file://${__filename}`).href;
const I18N = new URL('../src/lib/i18n.js', `file://${__filename}`).href;
const CFG = new URL('../src/config/index.js', `file://${__filename}`).href;

test('hi-pilot: Hindi is an active, LTR locale (reuses default LTR infra)', async () => {
  const { isActiveLocale, isRtlLocale, resolveLocale, getLocaleDir, getLocaleMeta } = await import(
    LOC
  );
  assert.equal(isActiveLocale('hi'), true);
  assert.equal(isRtlLocale('hi'), false); // Hindi is left-to-right.
  assert.equal(getLocaleDir('hi'), getLocaleDir('en')); // identical ltr handling
  assert.equal(resolveLocale('hi'), 'hi');
  assert.equal(getLocaleMeta('hi').endonym, 'हिन्दी');
});

test('hi-pilot: every pilot key exists in TRANSLATIONS.en (no orphan strings)', async () => {
  const { HI_PILOT_KEYS } = await import(HI);
  const { TRANSLATIONS } = await import(CFG);
  const enKeys = new Set(Object.keys(TRANSLATIONS.en));
  const orphans = HI_PILOT_KEYS.filter((k) => !enKeys.has(k));
  assert.deepEqual(orphans, [], 'pilot must only translate existing EN keys');
  assert.ok(HI_PILOT_KEYS.length >= 50, 'pilot should cover the core-pages surface');
});

test('hi-pilot: covers the same key set as the French pilot', async () => {
  const { HI_PILOT_KEYS } = await import(HI);
  const { FR_PILOT_KEYS } = await import(FR);
  assert.deepEqual([...HI_PILOT_KEYS].sort(), [...FR_PILOT_KEYS].sort());
});

test('hi-pilot: all Hindi values are non-empty strings and mostly differ from English', async () => {
  const { HI_PILOT } = await import(HI);
  const { TRANSLATIONS } = await import(CFG);
  let differ = 0;
  for (const [key, value] of Object.entries(HI_PILOT)) {
    assert.equal(typeof value, 'string');
    assert.ok(value.trim().length > 0, `empty Hindi value for ${key}`);
    if (value !== TRANSLATIONS.en[key]) differ += 1;
  }
  assert.ok(differ >= Object.keys(HI_PILOT).length - 3, 'most keys must be actually translated');
});

test('hi-pilot: withHindiPilot yields Hindi for covered keys, English for the rest', async () => {
  const { withHindiPilot } = await import(HI);
  const { translate } = await import(I18N);
  const { TRANSLATIONS } = await import(CFG);
  const dict = withHindiPilot(TRANSLATIONS);

  assert.equal(translate(dict, 'hi', 'nav.home'), 'होम');
  assert.equal(translate(dict, 'hi', 'card.copy'), 'कॉपी');
  // Not covered by the pilot → English fallback (not a raw key, not another locale).
  const uncovered = Object.keys(TRANSLATIONS.en).find(
    (k) => k.startsWith('tracker.') && TRANSLATIONS.en[k]
  );
  assert.equal(translate(dict, 'hi', uncovered), TRANSLATIONS.en[uncovered]);
  assert.equal(TRANSLATIONS.hi, undefined); // input not mutated
});

test('hi-pilot: reference-estimate framing is preserved in Hindi', async () => {
  const { HI_PILOT } = await import(HI);
  // "not financial advice" carries into both disclaimers.
  assert.match(HI_PILOT['footer.disclaimer'], /वित्तीय सलाह नहीं/);
  assert.match(HI_PILOT['karat.disclaimer'], /वित्तीय सलाह नहीं/);
  // Estimated bullion-equivalent framing.
  assert.match(HI_PILOT['spotlight.note'], /बुलियन-समतुल्य/);
});
