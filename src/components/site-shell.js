import { injectNav, updateNavLang } from './nav.js';
import { injectFooter } from './footer.js';
import { injectTicker, updateTickerLang } from './ticker.js';
import { injectSpotBar, updateSpotBarLang } from './spotBar.js';
import { installErrorReporter } from '../lib/error-reporter.js';

/**
 * Mount shared public shell surfaces.
 * @param {{ lang?: string; depth?: number; withSpotBar?: boolean }} options
 */
export function mountSharedShell(options = {}) {
  const lang = options.lang === 'ar' ? 'ar' : 'en';
  const depth = Number.isInteger(options.depth) ? options.depth : 0;
  const withSpotBar = options.withSpotBar === true;

  installErrorReporter();

  if (withSpotBar) injectSpotBar(lang, depth);
  const navCtrl = injectNav(lang, depth);
  injectFooter(lang, depth);
  injectTicker(lang, depth);

  return {
    navCtrl,
    updateLang(nextLang) {
      const lang = nextLang === 'ar' ? 'ar' : 'en';
      updateNavLang(lang);
      updateTickerLang(lang);
      if (withSpotBar) updateSpotBarLang(lang);
    },
  };
}
