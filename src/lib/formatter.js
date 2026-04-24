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
