/**
 * Gold Market page entry point ("How gold is priced, spot to street").
 *
 * The explanatory content is authored as static, bilingual HTML in market.html
 * (twin `data-lang-block` en/ar blocks toggled purely by CSS on `html[lang]`),
 * so it renders with zero JavaScript. This entry mounts the shared shell,
 * breadcrumbs, and language toggle, localizes the hero, and hydrates the live
 * "worked example" panel that grounds the abstract price chain in today's real
 * numbers.
 *
 * F-1: the worked example reads getCanonicalSpot() — the SAME memoized snapshot
 * as every other price surface on the site — so the numbers used to illustrate
 * the chain can never diverge from the tracker, calculator, or country pages.
 * Steps 1–3 are pure arithmetic we can show honestly; the retail step is
 * shop-set and deliberately never fabricated.
 */

import { mountSharedShell } from '../components/site-shell.js';
import { injectBreadcrumbs } from '../components/breadcrumbs.js';
import * as cache from '../lib/cache.js';
import { initPageEnter } from '../lib/page-enter.js';
import { getCanonicalSpot } from '../lib/spot-resolver.js';
import { applyMarketClosedOverlay } from '../lib/live-status.js';
import { startVisibilityAwareRefresh } from '../lib/visibility-refresh.js';
import { CONSTANTS } from '../config/index.js';
import { formatNumber, formatCurrency, formatTimestampShort } from '../lib/formatter.js';

const STATE = { lang: 'en', snapshot: null, timer: null };

const T = {
  en: {
    'market-eyebrow': 'How gold pricing works',
    'market-h1': 'How gold is priced',
    'market-sub':
      'Follow a single global number — the spot price — as it becomes the figure on your local jeweller’s counter. This is the chain, the marketplaces behind it, and why retail rarely matches spot.',
    docTitle: 'How Gold Is Priced — Spot to Street | Gold Ticker Live',
    freshLive: 'Live',
    freshDelayed: 'Delayed',
    freshCached: 'Cached',
    freshStale: 'Stale',
    freshClosed: 'Closed',
    updated: 'Updated',
  },
  ar: {
    'market-eyebrow': 'كيف يعمل تسعير الذهب',
    'market-h1': 'كيف يُسعَّر الذهب',
    'market-sub':
      'تابع رقماً عالمياً واحداً — السعر الفوري — وهو يتحوّل إلى الرقم المعروض على واجهة صائغك المحلي. هذه هي السلسلة، والأسواق الكامنة وراءها، ولماذا نادراً ما يطابق سعر التجزئة السعر الفوري.',
    docTitle: 'كيف يُسعَّر الذهب — من السوق العالمي إلى المحل | Gold Ticker Live',
    freshLive: 'مباشر',
    freshDelayed: 'متأخر',
    freshCached: 'مخزّن',
    freshStale: 'قديم',
    freshClosed: 'مغلق',
    updated: 'آخر تحديث',
  },
};

const FRESH_KEY = {
  live: 'freshLive',
  delayed: 'freshDelayed',
  cached: 'freshCached',
  fallback: 'freshStale',
  unavailable: 'freshStale',
  closed: 'freshClosed',
};

function t(key) {
  return T[STATE.lang]?.[key] ?? T.en[key] ?? key;
}

function num(id, value, decimals) {
  const node = document.getElementById(id);
  if (!node) return;
  node.textContent =
    value != null && Number.isFinite(value)
      ? formatNumber(value, STATE.lang, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : '—';
}

function renderWorked() {
  const card = document.getElementById('mkt-worked');
  const snap = STATE.snapshot;
  if (!card || !snap || !snap.ok || !snap.spotUsdPerOz) return;

  const spotNode = document.getElementById('mkt-w-spot');
  if (spotNode) spotNode.textContent = formatCurrency(snap.spotUsdPerOz, 'USD', STATE.lang, 2);
  num('mkt-w-usdg', snap.usdPerGram24k, 2);
  num('mkt-w-aedg', snap.aedPerGram24k, 2);

  const fresh = snap.freshness || {};
  const pill = document.getElementById('mkt-worked-fresh');
  const dot = document.getElementById('mkt-worked-dot');
  const text = document.getElementById('mkt-worked-fresh-text');
  // Apply the market-closed overlay so a closed-market quote never reads "Live"
  // (freshness contract) — mirrors home/compare/portfolio and the shared ticker.
  const displayState = applyMarketClosedOverlay(fresh.state || 'unavailable');
  const key = FRESH_KEY[displayState];
  if (pill && dot && text && key) {
    dot.className = `mkt-worked-dot mkt-worked-dot--${displayState}`;
    const stamp = fresh.updatedAt ? formatTimestampShort(fresh.updatedAt, STATE.lang) : '';
    text.textContent = stamp ? `${t(key)} · ${t('updated')}: ${stamp}` : t(key);
    pill.hidden = false;
  }

  card.removeAttribute('aria-busy');
}

async function fetchWorked() {
  try {
    const snap = await getCanonicalSpot({ force: true });
    if (snap && snap.ok) {
      STATE.snapshot = snap;
      renderWorked();
    }
  } catch {
    // Leave the skeleton in place; the static explanation stands on its own.
  }
}

function applyLang() {
  document.documentElement.lang = STATE.lang;
  document.documentElement.dir = STATE.lang === 'ar' ? 'rtl' : 'ltr';
  ['market-eyebrow', 'market-h1', 'market-sub'].forEach((id) => {
    const node = document.getElementById(id);
    if (node) node.textContent = t(id);
  });
  document.title = t('docTitle');
  // Re-format the worked-example numbers + freshness in the active language.
  renderWorked();
}

function init() {
  const urlLang = new URLSearchParams(location.search).get('lang');
  if (urlLang === 'ar' || urlLang === 'en') STATE.lang = urlLang;
  else if (cache.getPreference('lang') === 'ar') STATE.lang = 'ar';

  document.documentElement.lang = STATE.lang;
  document.documentElement.dir = STATE.lang === 'ar' ? 'rtl' : 'ltr';

  const shell = mountSharedShell({ lang: STATE.lang, depth: 0 });
  initPageEnter('#main-content');
  injectBreadcrumbs('market');

  shell.navCtrl.getLangToggleButtons().forEach((btn) => {
    btn.addEventListener('click', () => {
      STATE.lang = STATE.lang === 'en' ? 'ar' : 'en';
      cache.savePreference('lang', STATE.lang);
      shell.updateLang(STATE.lang);
      applyLang();
    });
  });

  applyLang();

  fetchWorked();
  // Visibility-aware refresh: pause polling while the tab is hidden, catch up
  // on re-show. Replaces a bare setInterval that polled even in a background tab.
  if (STATE.refreshCtrl) STATE.refreshCtrl.stop();
  STATE.refreshCtrl = startVisibilityAwareRefresh(fetchWorked, {
    intervalMs: CONSTANTS.GOLD_REFRESH_MS,
  });
}

init();
