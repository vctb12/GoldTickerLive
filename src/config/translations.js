/**
 * translations.js — the combined bilingual UI string table (EN + AR, eager).
 *
 * The locale blocks now live in per-locale modules (`translations.en.js` /
 * `translations.ar.js`); this file re-composes them into the historical
 * `TRANSLATIONS` shape so every synchronous consumer keeps working unchanged:
 * Node scripts (generate-ar-homepage, render-learn-static-fallback), the test
 * suite's parity/coverage guards, and the lazily-loaded search index (which
 * needs both locales at once and only ever loads inside the on-demand search
 * chunk).
 *
 * Browser page code should NOT import this module — importing it ships the
 * Arabic half to every visitor. Import `translations-runtime.js` (directly or
 * via `config/index.js`) instead: it starts EN-only and grafts AR on demand
 * through `ensureLocale()`.
 */
import { EN } from './translations.en.js';
import { AR } from './translations.ar.js';

export const TRANSLATIONS = {
  en: EN,
  ar: AR,
};
