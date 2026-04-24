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

export function formatPrice(amount, currency, decimals = 2) {
  if (amount === null || amount === undefined || isNaN(amount)) return '—';
  const sym = CURRENCY_SYMBOLS[currency] || currency;
  const formatted = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
  return `${formatted} ${sym}`;
}

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

export function formatCountdown(ms) {
  if (!ms || ms <= 0) return '0s';
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min > 0) return `${min}m ${sec}s`;
  return `${sec}s`;
}

export function formatPercentChange(change, base) {
  if (change == null || !base || base === 0) return { text: '—', direction: 'neutral' };
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

export function formatKarat(karat, lang) {
  return lang === 'ar' ? karat.labelAr : karat.labelEn;
}

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
