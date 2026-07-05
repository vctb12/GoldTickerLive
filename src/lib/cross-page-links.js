/**
 * Shared href builders for flagship cross-page flows (home ↔ tracker ↔ calculator ↔ shops).
 * Pure functions — unit-tested; keep pricing/hash contracts documented in docs/tracker-state.md.
 */

const TRACKER_KARATS = new Set(['24', '22', '21', '20', '18', '16', '14']);
const TRACKER_UNITS = new Set(['gram', 'tola', 'oz']);
const TRACKER_MODES = new Set(['live', 'compare', 'archive', 'method', 'exports']);
const ALLOWED_LANG = new Set(['en', 'ar']);
const ISO_CURRENCY_CODE = /^[A-Za-z]{3}$/;
const ALLOWED_CURRENCIES = {
  has(value) {
    return ISO_CURRENCY_CODE.test(String(value));
  },
};
const ALLOWED_RANGES = new Set(['24H', '7D', '30D', '90D', '1Y', '3Y', '5Y', 'ALL']);
const ISO_COUNTRY_CODE = /^[A-Za-z]{2}$/;
const METHODOLOGY_FRAGMENTS = new Set([
  '',
  'not-included',
  'live-formula',
  'gold-data',
  'fx-rates',
  'freshness-states',
  'karat-conversion',
]);

/**
 * @param {{ fragment?: string, lang?: 'en'|'ar', base?: string }} [options]
 * @returns {string}
 */
export function buildMethodologyHref({ fragment, lang, base = 'methodology.html' } = {}) {
  const safeLang = ALLOWED_LANG.has(String(lang)) ? String(lang) : null;
  const frag = String(fragment || '').replace(/^#/, '');
  const safeFrag = METHODOLOGY_FRAGMENTS.has(frag) ? frag : '';
  const params = new URLSearchParams();
  if (safeLang === 'ar') params.set('lang', 'ar');
  const qs = params.toString();
  const hash = safeFrag ? `#${safeFrag}` : '';
  return qs ? `${base}?${qs}${hash}` : `${base}${hash}`;
}

/**
 * @param {{ karat?: string, countryCode?: string, lang?: 'en'|'ar', tab?: string, base?: string }} [options]
 * @returns {string}
 */
export function buildCalculatorHref({
  karat,
  countryCode,
  lang,
  tab,
  base = 'calculator.html',
} = {}) {
  const params = new URLSearchParams();
  const safeK = TRACKER_KARATS.has(String(karat)) ? String(karat) : null;
  if (safeK) params.set('k', safeK);
  const code = String(countryCode || '').trim();
  if (code && ISO_COUNTRY_CODE.test(code)) params.set('country', code.toUpperCase());
  if (ALLOWED_LANG.has(String(lang))) params.set('lang', String(lang));
  if (tab) params.set('tab', String(tab));
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

/**
 * @param {string} currency
 * @param {Array<{ currency: string, code?: string }>} countries
 * @returns {{ code?: string, currency: string } | null}
 */
export function countryForCurrency(currency, countries = []) {
  if (!currency || !Array.isArray(countries)) return null;
  return countries.find((country) => country.currency === currency) ?? null;
}

/**
 * @param {{ countryCode?: string, lang?: 'en'|'ar', base?: string }} [options]
 * @returns {string}
 */
export function buildShopsHref({ countryCode, lang, base = 'shops.html' } = {}) {
  const params = new URLSearchParams();
  const code = String(countryCode || '').trim();
  if (code && ISO_COUNTRY_CODE.test(code)) {
    params.set('country', code.toUpperCase());
  }
  const safeLang = ALLOWED_LANG.has(String(lang)) ? String(lang) : null;
  if (safeLang === 'ar') params.set('lang', 'ar');
  else if (safeLang === 'en' && params.has('country')) params.set('lang', 'en');
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

/**
 * Tracker hash contract: mode, cur, k, u, lang (+ optional r for range).
 * @see docs/tracker-state.md
 */
export function buildTrackerHashHref({
  mode = 'live',
  cur = 'AED',
  k = '24',
  u = 'gram',
  lang = 'en',
  range,
} = {}) {
  const safeMode = TRACKER_MODES.has(String(mode)) ? String(mode) : 'live';
  const safeK = TRACKER_KARATS.has(String(k)) ? String(k) : '24';
  const safeU = TRACKER_UNITS.has(String(u)) ? String(u) : 'gram';
  const safeCur = ALLOWED_CURRENCIES.has(String(cur)) ? String(cur).toUpperCase() : 'AED';
  const safeLang = ALLOWED_LANG.has(String(lang)) ? String(lang) : 'en';
  const params = new URLSearchParams({
    mode: safeMode,
    cur: safeCur,
    k: safeK,
    u: safeU,
    lang: safeLang,
  });
  if (range && ALLOWED_RANGES.has(String(range).toUpperCase())) {
    params.set('r', String(range).toUpperCase());
  }
  return `tracker.html#${params.toString()}`;
}

/**
 * @param {string} [homeTrackerKarat]
 * @param {'gram'|'tola'|'oz'} [unit]
 * @param {string} [lang]
 */
export function buildHomeTrackerHref(homeTrackerKarat = '24', unit = 'gram', lang = 'en') {
  const safeUnit = TRACKER_UNITS.has(unit) ? unit : 'gram';
  const safeK = TRACKER_KARATS.has(String(homeTrackerKarat)) ? String(homeTrackerKarat) : '24';
  return buildTrackerHashHref({ mode: 'live', cur: 'AED', k: safeK, u: safeUnit, lang });
}
