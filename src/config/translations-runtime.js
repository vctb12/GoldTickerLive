/**
 * translations-runtime.js — the browser-facing translation table (EN eager, AR lazy).
 *
 * `TRANSLATIONS` starts with only the English dictionary so English visitors
 * never download the Arabic half (~28 KB gz). Page boots call
 * `ensureLocale(lang)` after resolving the language and before the first
 * dictionary-driven render; the Arabic module is dynamic-imported once and
 * grafted onto the SAME object, so every consumer that reads
 * `TRANSLATIONS[lang]` lazily (they all do) sees it with no further wiring.
 *
 * All lookups keep their `?? TRANSLATIONS.en` fallback, so a missed or failed
 * `ensureLocale()` degrades to English text — never to raw keys.
 */
import { EN } from './translations.en.js';

export const TRANSLATIONS = {
  en: EN,
};

/** @type {Promise<void> | null} */
let arLoadPromise = null;

/**
 * Ensure the dictionary for `locale` is present on `TRANSLATIONS`.
 *
 * Resolves immediately for `en` (always loaded) and for unknown locales
 * (their consumers fall back to EN). For `ar` it dynamic-imports the Arabic
 * module exactly once (per page load) and grafts it as `TRANSLATIONS.ar`.
 * Never rejects: on a failed import it logs, leaves the EN fallback in
 * place, and allows a later call to retry.
 *
 * @param {string} locale  Resolved page language (e.g. 'en' | 'ar').
 * @returns {Promise<void>}
 */
export function ensureLocale(locale) {
  if (locale !== 'ar' || TRANSLATIONS.ar) return Promise.resolve();
  arLoadPromise ??= import('./translations.ar.js')
    .then((mod) => {
      TRANSLATIONS.ar = mod.AR;
    })
    .catch((error) => {
      arLoadPromise = null; // allow retry — consumers keep the EN fallback meanwhile
      console.error('[i18n] Failed to load the Arabic dictionary', error);
    });
  return arLoadPromise;
}
