'use strict';

/**
 * chart-fallback-i18n.test.js
 *
 * Guards the i18n relocation of the GoldChart fallback + attribution strings
 * (src/components/chart.js). Previously `_showFallback` and
 * `_injectTradingViewAttribution` hardcoded EN/AR copy in inline ternaries;
 * per repo rule ALL user-facing strings live in src/config/translations.js as
 * flat dot-keys resolved via translate(). This test proves:
 *   1. the chart.fallback.* / chart.attribution.* keys exist and are
 *      non-empty in BOTH the EN and AR tables (pattern follows
 *      tests/translations-new-keys.spec.test.js);
 *   2. chart.js references the keys and carries no hardcoded Arabic script
 *      or English attribution literal (the regression this fix removed);
 *   3. the visible no-data fallback (chart.fallback.noData) and the SR
 *      summary sentence (chart.summary.noData) make the same honest
 *      "no data yet" claim in each language.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

async function loadTranslations() {
  const url = new URL(
    'file://' + path.resolve(__dirname, '..', 'src', 'config', 'translations.js')
  );
  const mod = await import(url.href);
  return mod.TRANSLATIONS;
}

const REQUIRED_KEYS = [
  'chart.fallback.loadError',
  'chart.fallback.noData',
  'chart.attribution.tradingView',
];

test('chart fallback/attribution keys exist and are non-empty in EN and AR', async () => {
  const translations = await loadTranslations();
  for (const key of REQUIRED_KEYS) {
    for (const lang of ['en', 'ar']) {
      const value = translations[lang][key];
      assert.equal(typeof value, 'string', `Missing ${lang.toUpperCase()} key: ${key}`);
      assert.ok(value.trim().length > 0, `Empty ${lang.toUpperCase()} value for key: ${key}`);
    }
  }
});

test('chart.js resolves these strings via keys — no hardcoded EN/AR literals', () => {
  const src = fs.readFileSync(
    path.resolve(__dirname, '..', 'src', 'components', 'chart.js'),
    'utf8'
  );
  for (const key of REQUIRED_KEYS) {
    assert.ok(src.includes(`'${key}'`), `chart.js must reference translation key ${key}`);
  }
  // The AR copy must live in translations.js only — any Arabic script in the
  // component source means an inline ternary crept back in.
  assert.ok(
    !/[؀-ۿ]/.test(src),
    'chart.js must not contain Arabic-script literals (use translations.js)'
  );
  assert.ok(
    !src.includes('Charts by TradingView'),
    'attribution text must come from translations.js, not a hardcoded literal'
  );
});

test('visible fallback and SR summary no-data copy make the same honest claim', async () => {
  const translations = await loadTranslations();
  // EN: both sentences state that no data exists yet — the visible fallback
  // additionally sets the expectation that data populates as updates arrive.
  const enVisible = translations.en['chart.fallback.noData'];
  const enSr = translations.en['chart.summary.noData'];
  for (const text of [enVisible, enSr]) {
    assert.ok(
      /no\b.*\bdata|data.*\bno\b/i.test(text),
      `EN no-data copy must state absence: ${text}`
    );
    assert.ok(/yet/i.test(text), `EN no-data copy must say "yet" (honest, not permanent): ${text}`);
  }
  // AR: both open with the same honest "لا تتوفر بيانات" (no data available)
  // statement and carry "بعد" (yet).
  const arVisible = translations.ar['chart.fallback.noData'];
  const arSr = translations.ar['chart.summary.noData'];
  for (const text of [arVisible, arSr]) {
    assert.ok(text.includes('لا تتوفر بيانات'), `AR no-data copy must state absence: ${text}`);
    assert.ok(text.includes('بعد'), `AR no-data copy must say "yet": ${text}`);
  }
});
