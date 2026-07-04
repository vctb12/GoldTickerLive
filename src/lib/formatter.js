const CURRENCY_SYMBOLS = {
  USD: '$',
  AED: 'د.إ',
  SAR: 'ر.س',
  KWD: 'د.ك',
  QAR: 'ر.ق',
  BHD: '.د.ب',
  OMR: 'ر.ع',
  JOD: 'د.أ',
  LBP: 'ل.ل',
  SYP: 'ل.س',
  ILS: '₪',
  EGP: 'ج.م',
  LYD: 'د.ل',
  TND: 'د.ت',
  DZD: 'دج',
  MAD: 'د.م',
  SDG: 'ج.س',
  SOS: 'Sh',
  MRU: 'أ.م',
  DJF: 'Fdj',
  KMF: 'CF',
  GBP: '£',
  EUR: '€',
  INR: '₹',
  IQD: 'ع.د',
  YER: 'ر.ي',
  TRY: '₺',
  PKR: '₨',
};

/**
 * Format a numeric price with a currency symbol.
 * Returns `'—'` for `null`, `undefined`, or `NaN` inputs.
 *
 * @param {number|null|undefined} amount    Numeric price value.
 * @param {string}                currency  ISO 4217 currency code (e.g. `'AED'`, `'USD'`).
 * @param {number}               [decimals=2]  Number of decimal places.
 * @returns {string}  Formatted string like `"3 245.12  د.إ"`.
 */
export function formatPrice(amount, currency, decimals = 2) {
  if (amount === null || amount === undefined || isNaN(amount)) return '—';
  const sym = CURRENCY_SYMBOLS[currency] || currency;
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
  return `${formatted} ${sym}`;
}

/**
 * Format a UTC timestamp as a human-readable date-time string in the given
 * language and timezone. Defaults to `Asia/Dubai`.
 * Returns `'—'` for missing or invalid inputs.
 *
 * @param {string|null|undefined} utcString  ISO-8601 UTC string.
 * @param {'en'|'ar'}            [lang]      Display language.
 * @param {string}               [timezone]  IANA timezone identifier.
 * @returns {string}
 */
export function formatTimestamp(utcString, lang, timezone = 'Asia/Dubai') {
  if (!utcString) return '—';
  try {
    const date = new Date(utcString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleString(lang === 'ar' ? 'ar-AE' : 'en-AE', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: timezone,
    });
  } catch {
    return '—';
  }
}

/**
 * Format a UTC timestamp as a short HH:MM:SS time string (no date).
 * Defaults to `Asia/Dubai`.
 * Returns `'—'` for missing or invalid inputs.
 *
 * @param {string|null|undefined} utcString  ISO-8601 UTC string.
 * @param {'en'|'ar'}            [lang]      Display language.
 * @param {string}               [timezone]  IANA timezone identifier.
 * @returns {string}
 */
export function formatTimestampShort(utcString, lang, timezone = 'Asia/Dubai') {
  if (!utcString) return '—';
  try {
    const date = new Date(utcString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleString(lang === 'ar' ? 'ar-AE' : 'en-AE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: timezone,
    });
  } catch {
    return '—';
  }
}

/**
 * Format a millisecond countdown as a human-readable string (`"2m 30s"` or `"45s"`).
 * Returns `'0s'` for zero or negative values.
 *
 * @param {number} ms  Duration in milliseconds.
 * @returns {string}
 */
export function formatCountdown(ms) {
  if (!ms || ms <= 0) return '0s';
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min > 0) return `${min}m ${sec}s`;
  return `${sec}s`;
}

/**
 * Format a price change as a signed percentage with directional arrow.
 * Returns `{ text: '—', direction: 'neutral' }` when the change or base is missing.
 *
 * @param {number|null} change  Absolute price change (new − old).
 * @param {number|null} base    Original / reference price.
 * @returns {{ text: string, value: string, direction: 'up'|'down'|'neutral' }}
 */
export function formatPercentChange(change, base) {
  if (change == null || !base) return { text: '—', direction: 'neutral' };
  const pct = (change / base) * 100;
  const sign = change > 0 ? '+' : '';
  const arrow = change > 0 ? '↑' : change < 0 ? '↓' : '—';
  const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
  return {
    text: `${arrow} ${sign}${pct.toFixed(2)}%`,
    value: `${sign}${change.toFixed(2)}`,
    direction,
  };
}

/**
 * Format a UTC timestamp as a short date string (`"Apr 24"` style).
 * Defaults to `Asia/Dubai`.
 * Returns `'—'` for missing or invalid inputs.
 *
 * @param {string|null|undefined} utcString  ISO-8601 UTC string.
 * @param {'en'|'ar'}            [lang]      Display language.
 * @param {string}               [timezone]  IANA timezone identifier.
 * @returns {string}
 */
export function formatDate(utcString, lang, timezone = 'Asia/Dubai') {
  if (!utcString) return '—';
  try {
    const date = new Date(utcString);
    if (isNaN(date.getTime())) return '—';
    return date.toLocaleDateString(lang === 'ar' ? 'ar-AE' : 'en-AE', {
      month: 'short',
      day: 'numeric',
      timeZone: timezone,
    });
  } catch {
    return '—';
  }
}

/**
 * Return the localised label for a karat (e.g. `"22K"` in English, `"٢٢ قيراط"` in Arabic).
 *
 * @param {{ labelEn: string, labelAr: string }} karat
 * @param {'en'|'ar'} lang
 * @returns {string}
 */
export function formatKarat(karat, lang) {
  return lang === 'ar' ? karat.labelAr : karat.labelEn;
}

/**
 * Return the localised name for a country.
 *
 * @param {{ nameEn: string, nameAr: string }} country
 * @param {'en'|'ar'} lang
 * @returns {string}
 */
export function formatCountryName(country, lang) {
  return lang === 'ar' ? country.nameAr : country.nameEn;
}

/**
 * Resolve the Intl locale tag for a display language.
 * Mirrors the `lang === 'ar' ? 'ar-AE' : 'en-AE'` convention used by the
 * timestamp formatters above.
 * @param {'en'|'ar'} [lang]
 * @returns {string}
 */
function localeFor(lang) {
  return lang === 'ar' ? 'ar-AE' : 'en-AE';
}

/**
 * Format a plain number with locale-aware grouping separators.
 * Returns `'—'` for `null`, `undefined`, or `NaN` inputs.
 *
 * @param {number|null|undefined} value
 * @param {'en'|'ar'} [lang]
 * @param {Intl.NumberFormatOptions} [options]  Extra Intl.NumberFormat options.
 * @returns {string}
 */
export function formatNumber(value, lang = 'en', options = {}) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return new Intl.NumberFormat(localeFor(lang), options).format(value);
}

/**
 * Format a value as ISO-4217 currency using Intl (localized symbol placement,
 * grouping, and digits). Unlike formatPrice() — which uses the project's
 * compact symbol map and en-US grouping — this follows the target locale's
 * own conventions. Falls back to formatPrice() when Intl rejects the code.
 *
 * @param {number|null|undefined} value
 * @param {string} currency  ISO 4217 code (e.g. `'AED'`).
 * @param {'en'|'ar'} [lang]
 * @param {number} [decimals=2]
 * @returns {string}
 */
export function formatCurrency(value, currency, lang = 'en', decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  try {
    return new Intl.NumberFormat(localeFor(lang), {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  } catch {
    // Invalid/unknown currency code — fall back to the symbol-map formatter.
    return formatPrice(value, currency, decimals);
  }
}

/**
 * Format a number in compact notation (`"1.2K"`, `"3.4M"`), locale-aware.
 * Returns `'—'` for `null`, `undefined`, or `NaN` inputs.
 *
 * @param {number|null|undefined} value
 * @param {'en'|'ar'} [lang]
 * @param {number} [maxFractionDigits=1]
 * @returns {string}
 */
export function formatCompactNumber(value, lang = 'en', maxFractionDigits = 1) {
  if (value === null || value === undefined || isNaN(value)) return '—';
  return new Intl.NumberFormat(localeFor(lang), {
    notation: 'compact',
    maximumFractionDigits: maxFractionDigits,
  }).format(value);
}

/**
 * Format a timestamp as a localized relative-time phrase ("5 minutes ago" /
 * "قبل ٥ دقائق"). Complements formatFreshness(), which returns the
 * English-only freshness *state* labels used by price surfaces — this helper
 * is the general-purpose, localized variant for non-price UI.
 *
 * @param {string|number|Date|null|undefined} target  Timestamp to describe.
 * @param {'en'|'ar'} [lang]
 * @param {number} [nowMs]  Reference time in ms (injectable for tests).
 * @returns {string}  Relative phrase, or `'—'` for invalid input.
 */
export function formatRelativeTime(target, lang = 'en', nowMs = Date.now()) {
  if (target === null || target === undefined || target === '') return '—';
  const then = new Date(target).getTime();
  if (isNaN(then)) return '—';
  const diffSec = Math.round((then - nowMs) / 1000);
  const abs = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(localeFor(lang), { numeric: 'auto' });
  if (abs < 60) return rtf.format(diffSec, 'second');
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour');
  if (abs < 2592000) return rtf.format(Math.round(diffSec / 86400), 'day');
  if (abs < 31536000) return rtf.format(Math.round(diffSec / 2592000), 'month');
  return rtf.format(Math.round(diffSec / 31536000), 'year');
}

/**
 * Return a freshness label and CSS state class for a price timestamp.
 * Used by every page that displays prices.
 * @param {string|number|Date|null} updatedAt  ISO timestamp, ms, or Date
 * @returns {{ label: string, state: 'live'|'recent'|'stale'|'cached'|'error', ageMs: number }}
 */
export function formatFreshness(updatedAt) {
  if (!updatedAt) return { label: 'Unable to fetch prices', state: 'error', ageMs: Infinity };
  const ageMs = Date.now() - new Date(updatedAt).getTime();
  if (isNaN(ageMs) || ageMs < 0) return { label: 'Live', state: 'live', ageMs: 0 };
  const ageMins = ageMs / 60000;
  if (ageMins < 2) return { label: 'Live', state: 'live', ageMs };
  if (ageMins < 10) return { label: `${Math.floor(ageMins)} min ago`, state: 'recent', ageMs };
  if (ageMins < 60)
    return { label: `Updated ${Math.floor(ageMins)} min ago`, state: 'stale', ageMs };
  const timeStr = new Date(updatedAt).toLocaleTimeString('en-AE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Dubai',
  });
  return { label: `Cached data from ${timeStr}`, state: 'cached', ageMs };
}
