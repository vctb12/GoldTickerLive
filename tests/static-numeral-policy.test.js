'use strict';

/**
 * static-numeral-policy.test.js — Operation Midas, phase 21.
 *
 * Companion to rtl-numeral-policy.test.js. That suite locks the JS *formatter*
 * layer (every runtime-rendered number). This suite locks the STATIC / page-copy
 * surfaces that the formatter never touches: hand-authored HTML text and the
 * translation dictionary. Those are exactly the places where an Eastern-Arabic
 * (٠-٩) or Persian/Urdu (۰-۹) digit can slip into shipped OUTPUT and violate the
 * sitewide "Western digits in both EN and AR" policy.
 *
 * Historic offenders now fixed and guarded here: market.html AR step badges
 * (١-٦ → 1-6), learn.html AR stat pill (٩ → 9), and translations.js
 * markets.title AR (٢٤ → 24). shops.js's review-date locale was moved off
 * `ar-EG` (Eastern default) to `ar-AE` (Western default) and is asserted below.
 *
 * Input-side normalisation code (src/lib/weight-units.js, src/lib/formatter.js,
 * src/config/feature-flags.js) legitimately references Eastern-Arabic glyphs to
 * ACCEPT them as user input, so it is intentionally out of scope here.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

// Eastern-Arabic (U+0660–0669) and Persian/Urdu (U+06F0–06F9) digit ranges.
const EASTERN_DIGITS = /[٠-٩۰-۹]/;

// Output-copy surfaces the formatter never runs over. Each entry is a file that
// ships to users as literal text (page HTML or the translation dictionary).
function outputCopyFiles() {
  const files = [];
  for (const name of fs.readdirSync(ROOT)) {
    if (name.endsWith('.html')) files.push(name);
  }
  files.push('src/config/translations.js');
  for (const dir of ['src/pages', 'src/learn-hub']) {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) continue;
    for (const name of fs.readdirSync(abs)) {
      if (name.endsWith('.js')) files.push(path.join(dir, name));
    }
  }
  return files;
}

function easternDigitLines(rel) {
  const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const bad = [];
  text.split('\n').forEach((line, i) => {
    if (EASTERN_DIGITS.test(line)) bad.push(`${rel}:${i + 1}: ${line.trim().slice(0, 100)}`);
  });
  return bad;
}

describe('static numeral policy — page copy renders Western digits only', () => {
  for (const rel of outputCopyFiles()) {
    test(`${rel} contains no Eastern-Arabic/Persian digit glyphs`, () => {
      const bad = easternDigitLines(rel);
      assert.deepEqual(
        bad,
        [],
        `Eastern-Arabic/Persian digits in shipped copy:\n${bad.join('\n')}`
      );
    });
  }

  test('shops.js formats the review date with a Western-digit Arabic locale', () => {
    const src = fs.readFileSync(path.join(ROOT, 'src/pages/shops.js'), 'utf8');
    assert.ok(
      !/toLocaleDateString\(\s*['"](ar-EG|ar-SA|ar)['"]/.test(src),
      'shops.js uses an Eastern-digit Arabic locale (ar-EG/ar-SA/bare ar) for the review date'
    );
    assert.ok(
      /toLocaleDateString\(\s*['"]ar-AE['"]/.test(src),
      'shops.js should format the Arabic review date with the ar-AE (Western-digit) locale'
    );
  });
});
