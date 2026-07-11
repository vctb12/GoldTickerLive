import { injectNav, updateNavLang } from './nav.js';
import { injectFooter } from './footer.js';
import { injectTicker, updateTicker, updateTickerLang } from './ticker.js';
import { injectSpotBar, updateSpotBarLang } from './spotBar.js';
import { getCanonicalSpot, karatPerGram } from '../lib/spot-resolver.js';
import { installErrorReporter } from '../lib/error-reporter.js';

/**
 * Feed the shared price ticker a canonical-snapshot baseline so EVERY page
 * shows one consistent freshness state — not just the tool pages whose own
 * controllers call updateTicker(). Content pages (learn, market, methodology,
 * glossary, country) previously left the ticker stuck at "Unavailable" even
 * though the exact same snapshot was available elsewhere, contradicting the
 * honest-freshness promise.
 *
 * Guarded so it never regresses richer data: it only writes while the ticker
 * is still in its initial `unavailable` state, so any page that fed real data
 * first — above all the Tracker's multi-tier live engine — always wins, and a
 * late-resolving baseline is skipped. Failures leave the honest "Unavailable"
 * state untouched.
 */
async function feedTickerBaseline() {
  const bar = document.getElementById('gold-ticker');
  if (!bar || bar.getAttribute('data-freshness') !== 'unavailable') return;
  const snap = await getCanonicalSpot();
  if (!snap || !snap.ok) return;
  const current = document.getElementById('gold-ticker');
  // Re-check after the await — a page controller may have fed live data meanwhile.
  if (!current || current.getAttribute('data-freshness') !== 'unavailable') return;
  updateTicker({
    xauUsd: snap.spotUsdPerOz,
    uae24k: snap.aedPerGram24k,
    uae22k: karatPerGram(snap, '22', 'aed'),
    uae21k: karatPerGram(snap, '21', 'aed'),
    uae18k: karatPerGram(snap, '18', 'aed'),
    updatedAt: snap.freshness.updatedAt,
    hasLiveFailure: snap.freshness.state !== 'live',
    isFallback: snap.freshness.isFallback,
  });
}

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
  // Baseline freshness for every page (esp. content pages without their own
  // price controller). Fire-and-forget; guarded to never clobber live data.
  feedTickerBaseline().catch((error) => {
    console.error('[site-shell] ticker baseline feed failed:', error);
  });

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
