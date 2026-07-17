'use strict';

/**
 * rtl-numeral-policy.test.js — Operation Midas, phase 18 (Arabic/RTL parity audit).
 *
 * SITEWIDE NUMERAL POLICY LOCK.
 *
 * The documented, enforced policy is: **all numeric UI — prices, quantities,
 * percentages, compact figures, dates and relative times — renders with WESTERN
 * (Latin, 0-9) digits in BOTH English and Arabic.** Eastern-Arabic / Persian
 * digits (٠-٩ / ۰-۹) are accepted only as user INPUT (normalised to Western by
 * src/lib/weight-units.js) and must never appear in formatted OUTPUT. This
 * matches how mainstream GCC gold/finance surfaces present prices and keeps a
 * single, unmixed digit script across the product.
 *
 * The policy is realised through the formatter layer:
 *   - formatPrice()            → hard-coded `en-US` grouping  (Western)
 *   - formatNumber/Currency/CompactNumber/RelativeTime/Timestamp/Date()
 *                              → localeFor('ar') === 'ar-AE', whose CLDR default
 *                                numbering system is `latn` (Western).
 *
 * The trap this guards: `ar-EG`, `ar-SA`, or a bare `ar` locale (or an explicit
 * `-u-nu-arab` extension) would silently flip every price and count to
 * Eastern-Arabic digits. Because the switch is a one-word edit in localeFor(),
 * it is exactly the kind of regression that slips through review. Any such flip
 * makes a formatter emit a ٠-٩ / ۰-۹ glyph and fails here.
 *
 * Scope note: this test locks the JS formatter layer, which is the authoritative
 * source for every runtime-rendered number. Hard-coded Eastern-Arabic digits
 * that still live in a handful of STATIC page-HTML blocks (market.html step
 * badges, learn.html stat pill) and one page module (shops.js review date) are
 * documented as follow-ups in docs/plans/midas/RTL_PARITY.md — they are outside
 * the formatter layer and are not asserted here.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// Eastern-Arabic (U+0660–0669) and Persian/Urdu (U+06F0–06F9) digit ranges.
const EASTERN_ARABIC_DIGITS = /[٠-٩۰-۹]/;
// At least one Western digit must be present so we prove the number rendered
// (not that it silently degraded to a dash or empty string).
const WESTERN_DIGIT = /[0-9]/;

async function loadFormatter() {
  const url = new URL('file://' + path.resolve(__dirname, '..', 'src', 'lib', 'formatter.js'));
  return import(url.href);
}

function assertWesternOnly(label, value) {
  const s = String(value);
  assert.ok(
    !EASTERN_ARABIC_DIGITS.test(s),
    `${label} leaked Eastern-Arabic/Persian digits: ${JSON.stringify(s)}`
  );
  assert.ok(
    WESTERN_DIGIT.test(s),
    `${label} produced no Western digit (did the number render?): ${JSON.stringify(s)}`
  );
}

// A UTC instant with digits in day (05), year (2026), hour (13→05 PM), minute (45).
const ISO = '2026-04-05T13:45:30Z';

describe('sitewide numeral policy — Arabic mode renders Western digits only', () => {
  test('formatPrice() uses Western digits (en-US grouping, language-independent)', async () => {
    const { formatPrice } = await loadFormatter();
    assertWesternOnly('formatPrice AED', formatPrice(1234567.89, 'AED'));
    assertWesternOnly('formatPrice USD', formatPrice(2048.5, 'USD'));
  });

  test('formatNumber("ar") uses Western digits', async () => {
    const { formatNumber } = await loadFormatter();
    assertWesternOnly('formatNumber ar', formatNumber(1234567.89, 'ar'));
    assertWesternOnly('formatNumber ar (small)', formatNumber(9, 'ar'));
  });

  test('formatCurrency("ar") uses Western digits', async () => {
    const { formatCurrency } = await loadFormatter();
    assertWesternOnly('formatCurrency ar AED', formatCurrency(1234567.89, 'AED', 'ar'));
    assertWesternOnly('formatCurrency ar USD', formatCurrency(2048.5, 'USD', 'ar'));
  });

  test('formatCompactNumber("ar") uses Western digits', async () => {
    const { formatCompactNumber } = await loadFormatter();
    assertWesternOnly('formatCompactNumber ar', formatCompactNumber(1234567, 'ar'));
  });

  test('formatTimestamp / formatTimestampShort / formatDate ("ar") use Western digits', async () => {
    const { formatTimestamp, formatTimestampShort, formatDate } = await loadFormatter();
    assertWesternOnly('formatTimestamp ar', formatTimestamp(ISO, 'ar'));
    assertWesternOnly('formatTimestampShort ar', formatTimestampShort(ISO, 'ar'));
    assertWesternOnly('formatDate ar', formatDate(ISO, 'ar'));
  });

  test('formatRelativeTime("ar") uses Western digits', async () => {
    const { formatRelativeTime } = await loadFormatter();
    const now = Date.parse(ISO);
    assertWesternOnly(
      'formatRelativeTime ar (minutes)',
      formatRelativeTime(now - 5 * 60_000, 'ar', now)
    );
    assertWesternOnly(
      'formatRelativeTime ar (days)',
      formatRelativeTime(now - 3 * 86_400_000, 'ar', now)
    );
  });

  test('formatPercentChange() delta text uses Western digits', async () => {
    const { formatPercentChange } = await loadFormatter();
    assertWesternOnly('formatPercentChange up', formatPercentChange(12.5, 1000).value);
    assertWesternOnly('formatPercentChange down text', formatPercentChange(-36.3, 1000).text);
  });
});

describe('numeral policy — localeFor Arabic locale defaults to Western numbering', () => {
  // Guards the specific one-word regression: swapping ar-AE for an Eastern-digit
  // Arabic locale. We assert on the OUTPUT of the exported formatters (localeFor
  // is module-private), across a value guaranteed to exercise grouping + decimals.
  test('every Arabic-locale formatter agrees on Western digits for the same value', async () => {
    const fmt = await loadFormatter();
    const V = 87654.32;
    for (const [label, out] of [
      ['formatNumber', fmt.formatNumber(V, 'ar')],
      ['formatCurrency', fmt.formatCurrency(V, 'AED', 'ar')],
      ['formatCompactNumber', fmt.formatCompactNumber(V, 'ar')],
    ]) {
      assertWesternOnly(`ar ${label}`, out);
    }
  });
});
