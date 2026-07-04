import { injectNav, updateNavLang } from './nav.js';
import { injectFooter } from './footer.js';
import { injectTicker, updateTickerLang } from './ticker.js';
import { injectSpotBar, updateSpotBarLang } from './spotBar.js';
import { installErrorReporter } from '../lib/error-reporter.js';

/**
 * Run a shell-mounting step in isolation. A failure in one surface (e.g. the
 * spot bar or ticker) must never prevent the others — above all the nav —
 * from mounting. Errors are logged, not thrown, so a single broken feature
 * can't blank the whole page shell.
 * @template T
 * @param {string} label
 * @param {() => T} fn
 * @returns {T | null}
 */
function safeMount(label, fn) {
  try {
    return fn();
  } catch (error) {
    console.error(`[site-shell] ${label} failed to mount:`, error);
    return null;
  }
}

/**
 * Mount shared public shell surfaces. Nav is mounted first and in isolation so
 * it is resilient to any other surface failing.
 * @param {{ lang?: string; depth?: number; withSpotBar?: boolean }} options
 */
export function mountSharedShell(options = {}) {
  const lang = options.lang === 'ar' ? 'ar' : 'en';
  const depth = Number.isInteger(options.depth) ? options.depth : 0;
  const withSpotBar = options.withSpotBar === true;

  safeMount('error-reporter', () => installErrorReporter());

  // Nav is the critical surface — mount it before the optional spot bar so a
  // spot-bar failure can never leave the page without navigation.
  const navCtrl = safeMount('nav', () => injectNav(lang, depth));
  if (withSpotBar) safeMount('spot-bar', () => injectSpotBar(lang, depth));
  safeMount('footer', () => injectFooter(lang, depth));
  safeMount('ticker', () => injectTicker(lang, depth));

  return {
    navCtrl,
    updateLang(nextLang) {
      const lang = nextLang === 'ar' ? 'ar' : 'en';
      safeMount('nav-lang', () => updateNavLang(lang));
      safeMount('ticker-lang', () => updateTickerLang(lang));
      if (withSpotBar) safeMount('spot-bar-lang', () => updateSpotBarLang(lang));
    },
  };
}
