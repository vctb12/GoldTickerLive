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
import { parseLastGoldPriceSnapshot } from '../lib/quote-providers/last-gold-price-parse.js';
import { referenceMove } from '../lib/reference-move.js';
import { CONSTANTS } from '../config/index.js';
import {
  formatNumber,
  formatCurrency,
  formatTimestampShort,
  formatDate,
  formatRelativeTime,
} from '../lib/formatter.js';

const STATE = { lang: 'en', snapshot: null, prior: null, timer: null };

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

  renderMove();
  card.removeAttribute('aria-busy');
}

function computeMove() {
  const snap = STATE.snapshot;
  const prior = STATE.prior;
  const current = snap?.ok ? snap.spotUsdPerOz : null;
  return referenceMove(current, prior?.price, prior?.ts);
}

function renderMove() {
  const panel = document.getElementById('mkt-worked-move');
  if (!panel) return;
  const move = computeMove();
  if (!move) {
    panel.hidden = true;
    panel.setAttribute('aria-hidden', 'true');
    return;
  }

  const arrow = move.direction === 'up' ? '↑' : move.direction === 'down' ? '↓' : '±';
  const pctStr = formatNumber(Math.abs(move.change) / move.prior, STATE.lang, {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const pctNode = document.getElementById('mkt-move-pct');
  if (pctNode) {
    pctNode.textContent = `${arrow} ${pctStr}`;
    pctNode.className = `mkt-worked-move-pct mkt-worked-move-pct--${move.direction}`;
  }

  const windowNode = document.getElementById('mkt-move-window');
  if (windowNode) {
    const date = formatDate(move.ts, STATE.lang);
    const rel = formatRelativeTime(move.ts, STATE.lang);
    windowNode.textContent = `${date} · ${rel}`;
  }

  const nowNode = document.getElementById('mkt-move-now');
  if (nowNode) nowNode.textContent = formatCurrency(move.current, 'USD', STATE.lang, 2);
  const thenNode = document.getElementById('mkt-move-then');
  if (thenNode) thenNode.textContent = formatCurrency(move.prior, 'USD', STATE.lang, 2);

  panel.hidden = false;
  panel.removeAttribute('aria-hidden');
}

/**
 * Read the last reference we published (`/data/last_gold_price.json`). Reuses the
 * canonical parser (`parseLastGoldPriceSnapshot`) so the price sanity-check and
 * timestamp precedence match the Tracker's fallback tier — no duplicate price
 * logic. Never throws: a missing/old/invalid record just leaves the movement
 * panel hidden, and the static worked example stands on its own.
 * @returns {Promise<{price:number, ts:string|null}|null>}
 */
async function fetchPrior() {
  try {
    const res = await fetch(`/data/last_gold_price.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const parsed = parseLastGoldPriceSnapshot(await res.json());
    if (!parsed) return null;
    return { price: parsed.price, ts: parsed.providerTimestamp };
  } catch {
    return null;
  }
}

async function fetchWorked() {
  try {
    // Prior reference is fetched alongside but independently — fetchPrior never
    // throws, so a missing last_gold_price.json can't block the worked example.
    const [snap, prior] = await Promise.all([getCanonicalSpot({ force: true }), fetchPrior()]);
    if (snap && snap.ok) {
      STATE.snapshot = snap;
      STATE.prior = prior;
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
