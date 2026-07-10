/**
 * lib/weight-units.js — weight-unit conversion + localized numeric input parsing (Phase 55).
 *
 * A single tested source of truth for the calculator's weight conversions (previously inlined in
 * `pages/calculator.js` and re-declared again in the tests). Also provides `parseLocalizedNumber`,
 * which fixes a real calculator edge case: `parseFloat('١٢')` returns `NaN`, so an Arabic-UI visitor
 * who types native Arabic-Indic (٠-٩) or Persian/Urdu (۰-۹) numerals — or uses a thousands
 * separator — currently gets no result. `parseLocalizedNumber` normalizes those to a plain number
 * while remaining a strict superset of `parseFloat` for ASCII input.
 *
 * Pure and side-effect-free.
 */

import { CONSTANTS } from '../config/index.js';

/** Grams per weight unit. `oz` is the troy ounce from the shared constant (never a duplicate). */
export const UNIT_TO_GRAMS = Object.freeze({
  gram: 1,
  oz: CONSTANTS.TROY_OZ_GRAMS, // 31.1035
  kg: 1000,
  tola: 11.6638,
  masha: 0.972,
  baht: 15.244,
  taels: 37.429,
});

/** Convert `amount` of `unit` to grams. Unknown units fall back to grams (1:1), matching the UI. */
export function toGrams(amount, unit) {
  return amount * (UNIT_TO_GRAMS[unit] ?? 1);
}

/** Convert grams to `unit`. Inverse of {@link toGrams}. */
export function gramsToUnit(grams, unit) {
  return grams / (UNIT_TO_GRAMS[unit] ?? 1);
}

// Arabic-Indic (U+0660–0669) and Extended Arabic-Indic / Persian & Urdu (U+06F0–06F9) digits.
const LOCALIZED_DIGITS = /[٠-٩۰-۹]/g;
function asciiDigit(d) {
  const code = d.charCodeAt(0);
  if (code >= 0x0660 && code <= 0x0669) return String(code - 0x0660);
  if (code >= 0x06f0 && code <= 0x06f9) return String(code - 0x06f0);
  return d;
}

/**
 * Parse a possibly-localized numeric string into a finite number, or `NaN`.
 *
 * Handles Arabic-Indic / Persian-Urdu digits, the Arabic decimal separator (٫ U+066B), the Arabic
 * thousands separator (٬ U+066C), and ASCII grouping (commas / whitespace). For plain ASCII numbers
 * it behaves exactly like `parseFloat` (leading-numeric-prefix), so it is a safe superset.
 *
 * @param {*} raw
 * @returns {number} finite number, or NaN
 */
export function parseLocalizedNumber(raw) {
  if (raw == null) return NaN;
  let s = String(raw).trim();
  if (!s) return NaN;

  // Normalize localized digits → ASCII.
  s = s.replace(LOCALIZED_DIGITS, asciiDigit);
  // Arabic decimal separator → '.'; Arabic thousands + ASCII grouping (commas, spaces) → removed.
  s = s.replace(/٫/g, '.').replace(/[٬,\s]/g, '');

  // Mimic parseFloat: take the leading numeric prefix (sign, digits, single dot).
  const match = s.match(/^[+-]?(?:\d+\.?\d*|\.\d+)/);
  if (!match) return NaN;
  const n = Number(match[0]);
  return Number.isFinite(n) ? n : NaN;
}

/** True when `n` is a usable positive, finite weight/amount. */
export function isPositiveNumber(n) {
  return Number.isFinite(n) && n > 0;
}
