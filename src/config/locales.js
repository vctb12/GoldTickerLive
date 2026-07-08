/**
 * config/locales.js — the locale registry and single source of truth for supported languages.
 *
 * Phase 38 (N-locale i18n scaffolding). Today the site is bilingual EN/AR; this registry is the
 * de-risked foundation that lets later phases add French (39) and Urdu (40) by flipping one
 * `enabled` flag and adding a `TRANSLATIONS` block — with **no change to EN/AR behaviour**.
 *
 * Invariant (guarded by tests): while only `en` and `ar` are active, `resolveLocale(x)` is
 * byte-for-byte identical to the legacy inline `x === 'ar' ? 'ar' : 'en'` used across the app. The
 * registry is additive — existing consumers are untouched by this phase; the pilots adopt it.
 */

/** The universal fallback locale. English is the base dictionary everywhere. */
export const DEFAULT_LOCALE = 'en';

/**
 * @typedef {Object} LocaleMeta
 * @property {string} code      BCP-47 primary subtag ('en', 'ar', 'fr', 'ur').
 * @property {string} endonym   Native name, shown in the language switcher.
 * @property {string} englishName
 * @property {'ltr'|'rtl'} dir
 * @property {boolean} enabled  Whether the locale is live. EN/AR true; FR/UR wait for their phase.
 */

/**
 * Registry of every locale the codebase knows about. `enabled: false` entries are declared so the
 * scaffolding (dir handling, switcher, hreflang) is ready, but they are NOT active until their pilot
 * phase turns them on and ships a translation block.
 * @type {Record<string, LocaleMeta>}
 */
export const LOCALES = {
  en: { code: 'en', endonym: 'English', englishName: 'English', dir: 'ltr', enabled: true },
  ar: { code: 'ar', endonym: 'العربية', englishName: 'Arabic', dir: 'rtl', enabled: true },
  // French pilot — activated in Phase 39 (LTR). Ships a curated core-pages dictionary
  // (see src/i18n/fr-pilot.js); uncovered keys fall back to English via the translate helper.
  fr: { code: 'fr', endonym: 'Français', englishName: 'French', dir: 'ltr', enabled: true },
  // Parked pilot — declared, disabled. Flipped on in Phase 40 (ur, reuses AR RTL infra).
  ur: { code: 'ur', endonym: 'اردو', englishName: 'Urdu', dir: 'rtl', enabled: false },
};

/** Every declared locale code, active or parked. */
export const SUPPORTED_LOCALE_CODES = Object.keys(LOCALES);

/** Only the live locale codes (default first), e.g. ['en', 'ar'] today. */
export const ACTIVE_LOCALE_CODES = SUPPORTED_LOCALE_CODES.filter(
  (code) => LOCALES[code].enabled
).sort((a, b) => (a === DEFAULT_LOCALE ? -1 : b === DEFAULT_LOCALE ? 1 : 0));

/** True if `code` is a live locale. */
export function isActiveLocale(code) {
  return Boolean(LOCALES[code]?.enabled);
}

/**
 * Resolve a requested language (typically the raw `?lang=` value) to a live locale code.
 * Unknown, parked, or missing values fall back to {@link DEFAULT_LOCALE}. Exact-match only, so while
 * `en`/`ar` are the active set this is identical to the legacy `req === 'ar' ? 'ar' : 'en'`.
 *
 * @param {string|null|undefined} requested
 * @returns {string} an active locale code
 */
export function resolveLocale(requested) {
  return isActiveLocale(requested) ? requested : DEFAULT_LOCALE;
}

/** Full metadata for a locale, falling back to the default locale's metadata for unknown codes. */
export function getLocaleMeta(code) {
  return LOCALES[code] || LOCALES[DEFAULT_LOCALE];
}

/** Text direction ('ltr' | 'rtl') for a locale; defaults to the default locale's direction. */
export function getLocaleDir(code) {
  return getLocaleMeta(code).dir;
}

/** True if the locale is right-to-left. Mirrors the app's `lang === 'ar'` RTL checks, generalised. */
export function isRtlLocale(code) {
  return getLocaleDir(code) === 'rtl';
}
