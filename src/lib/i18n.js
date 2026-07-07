/**
 * lib/i18n.js — the canonical translation lookup, factored out of 30+ inline call sites.
 *
 * Phase 38 (N-locale i18n scaffolding). Across the app the same fallback chain is hand-written:
 *   `TRANSLATIONS[locale]?.[key] ?? TRANSLATIONS.en?.[key] ?? fallback`
 * This module makes that chain a single tested helper so new locales (French/Urdu) inherit identical
 * fallback semantics for free, and so `{token}` interpolation is consistent. It changes no behaviour
 * on its own — it is the shared implementation the pilots adopt. EN/AR output is unchanged.
 */

import { DEFAULT_LOCALE } from '../config/locales.js';

/**
 * Interpolate `{token}` / `{{token}}` placeholders from a vars map. Missing tokens are left as-is.
 * @param {string} template
 * @param {Record<string, string|number>} vars
 * @returns {string}
 */
export function interpolate(template, vars) {
  if (!vars || typeof template !== 'string') return template;
  return template.replace(/\{\{?\s*(\w+)\s*\}?\}/g, (match, token) =>
    Object.prototype.hasOwnProperty.call(vars, token) ? String(vars[token]) : match
  );
}

/**
 * Look up a translation with the canonical locale → default-locale → fallback chain.
 *
 * @param {Record<string, Record<string, string>>} translations  e.g. the `TRANSLATIONS` map.
 * @param {string} locale  Target locale code.
 * @param {string} key     Dot-namespaced translation key.
 * @param {{ fallback?: string, vars?: Record<string, string|number> }} [options]
 *   `fallback` is used when neither the locale nor the default locale has the key (defaults to the
 *   key itself, matching the app's existing `?? key` behaviour); `vars` interpolates placeholders.
 * @returns {string}
 */
export function translate(translations, locale, key, options = {}) {
  const dicts = translations || {};
  const raw = dicts[locale]?.[key] ?? dicts[DEFAULT_LOCALE]?.[key] ?? options.fallback ?? key;
  return options.vars ? interpolate(raw, options.vars) : raw;
}

/**
 * Bind a `translations` map and `locale` into a reusable `t(key, vars?)` function — the shape most
 * page modules already expose locally, now sourced from one implementation.
 *
 * @param {Record<string, Record<string, string>>} translations
 * @param {string} locale
 * @returns {(key: string, vars?: Record<string, string|number>) => string}
 */
export function createTranslator(translations, locale) {
  return (key, vars) => translate(translations, locale, key, { vars });
}
