/**
 * Dubai / UAE gold-rate landing page entry point.
 *
 * The rich guidance content is authored as static, bilingual HTML in
 * dubai-gold-price.html (twin `data-lang-block` en/ar blocks toggled purely by
 * CSS on `html[lang]`), so it renders with zero JavaScript. This entry mounts
 * the shared shell, breadcrumbs, and language toggle, localizes the hero, and
 * hydrates the live reference-price panel from the shared canonical resolver.
 *
 * F-1: the live panel reads getCanonicalSpot() — the SAME memoized snapshot as
 * the homepage / calculator / compare / portfolio / learn — so the Dubai page's
 * headline rate can never diverge from the rest of the site. Freshness is honest
 * (live / delayed / cached / stale), straight from the snapshot.
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

const TOLA_GRAMS = 11.6638;

const STATE = { lang: 'en', snapshot: null, timer: null };

const T = {
  en: {
    'dubai-eyebrow': 'UAE · Dubai gold rate',
    'dubai-h1': 'Gold Rate in Dubai & the UAE',
    'dubai-sub':
      'A spot-linked reference for the gold price in Dubai and across the UAE, in AED and USD — plus how the dirham peg, karats, making charges and VAT shape the number you actually pay at the counter.',
    'dubai-jump-label': 'Jump to a section',
    docTitle:
      'Gold Rate in Dubai & UAE — Price per Gram in AED (24K/22K/21K/18K) | Gold Ticker Live',
    freshLive: 'Live',
    freshDelayed: 'Delayed',
    freshCached: 'Cached',
    freshStale: 'Stale',
    freshClosed: 'Closed',
    updated: 'Updated',
  },
  ar: {
    'dubai-eyebrow': 'الإمارات · سعر الذهب في دبي',
    'dubai-h1': 'سعر الذهب في دبي والإمارات',
    'dubai-sub':
      'مرجع مرتبط بالسعر الفوري لسعر الذهب في دبي وعبر الإمارات، بالدرهم والدولار — مع شرح كيف يشكّل ربط الدرهم والعيارات وأجور الصياغة وضريبة القيمة المضافة الرقم الذي تدفعه فعلاً.',
    'dubai-jump-label': 'الانتقال إلى قسم',
    docTitle: 'سعر الذهب في دبي والإمارات — سعر الجرام بالدرهم (24/22/21/18) | Gold Ticker Live',
    freshLive: 'مباشر',
    freshDelayed: 'متأخر',
    freshCached: 'مخزّن',
    freshStale: 'قديم',
    freshClosed: 'مغلق',
    updated: 'آخر تحديث',
  },
};

function t(key) {
  return T[STATE.lang]?.[key] ?? T.en[key] ?? key;
}

const FRESH_KEY = {
  live: 'freshLive',
  delayed: 'freshDelayed',
  cached: 'freshCached',
  fallback: 'freshStale',
  unavailable: 'freshStale',
  closed: 'freshClosed',
};

function aedCell(id, value) {
  const node = document.getElementById(id);
  if (!node) return;
  node.textContent =
    value != null && Number.isFinite(value)
      ? formatNumber(value, STATE.lang, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '—';
}

function renderLive() {
  const card = document.getElementById('dubai-live-card');
  const snap = STATE.snapshot;
  const errorEl = document.getElementById('dubai-live-error');

  if (!snap || !snap.ok) {
    // Nothing to show yet. Surface the quiet, honest error only when the resolver
    // actually returned an unusable snapshot (not while the first fetch is still
    // in flight and STATE.snapshot is null).
    if (errorEl && snap && !snap.ok) errorEl.hidden = false;
    return;
  }
  if (errorEl) errorEl.hidden = true;

  const byCode = new Map((snap.karats || []).map((k) => [k.code, k.aedPerGram]));
  aedCell('dl-24', byCode.get('24') ?? snap.aedPerGram24k);
  aedCell('dl-22', byCode.get('22'));
  aedCell('dl-21', byCode.get('21'));
  aedCell('dl-18', byCode.get('18'));
  aedCell('dl-tola', (snap.aedPerGram24k ?? 0) * TOLA_GRAMS);

  const spotNode = document.getElementById('dl-spot');
  if (spotNode) {
    spotNode.textContent = snap.spotUsdPerOz
      ? formatCurrency(snap.spotUsdPerOz, 'USD', STATE.lang, 2)
      : '—';
  }

  // Honest freshness pill — state + data timestamp, never the render time.
  const fresh = snap.freshness || {};
  const pill = document.getElementById('dubai-fresh');
  const dot = document.getElementById('dubai-fresh-dot');
  const text = document.getElementById('dubai-fresh-text');
  // Apply the market-closed overlay so a closed-market quote never reads "Live"
  // (freshness contract) — mirrors home/compare/portfolio and the shared ticker.
  const displayState = applyMarketClosedOverlay(fresh.state || 'unavailable');
  const key = FRESH_KEY[displayState];
  if (pill && dot && text && key) {
    dot.className = `dubai-fresh-dot dubai-fresh-dot--${displayState}`;
    const stamp = fresh.updatedAt ? formatTimestampShort(fresh.updatedAt, STATE.lang) : '';
    text.textContent = stamp ? `${t(key)} · ${t('updated')}: ${stamp}` : t(key);
    pill.hidden = false;
  }

  if (card) card.removeAttribute('aria-busy');
}

async function fetchLive() {
  if (!navigator.onLine && !STATE.snapshot) return;
  try {
    const snap = await getCanonicalSpot({ force: true });
    if (snap && snap.ok) STATE.snapshot = snap;
    else if (!STATE.snapshot) STATE.snapshot = snap; // record failure for error state
  } catch {
    // Leave STATE.snapshot as-is; renderLive() shows the honest error only when
    // the resolver returned an unusable snapshot.
  }
  renderLive();
}

function applyLang() {
  document.documentElement.lang = STATE.lang;
  document.documentElement.dir = STATE.lang === 'ar' ? 'rtl' : 'ltr';
  ['dubai-eyebrow', 'dubai-h1', 'dubai-sub', 'dubai-jump-label'].forEach((id) => {
    const node = document.getElementById(id);
    if (node) node.textContent = t(id);
  });
  document.title = t('docTitle');
  // Re-format the live numbers + freshness in the newly active language.
  renderLive();
}

function init() {
  const urlLang = new URLSearchParams(location.search).get('lang');
  if (urlLang === 'ar' || urlLang === 'en') STATE.lang = urlLang;
  else if (cache.getPreference('lang') === 'ar') STATE.lang = 'ar';

  document.documentElement.lang = STATE.lang;
  document.documentElement.dir = STATE.lang === 'ar' ? 'rtl' : 'ltr';

  const shell = mountSharedShell({ lang: STATE.lang, depth: 0 });
  initPageEnter('#main-content');
  injectBreadcrumbs('dubai');

  shell.navCtrl.getLangToggleButtons().forEach((btn) => {
    btn.addEventListener('click', () => {
      STATE.lang = STATE.lang === 'en' ? 'ar' : 'en';
      cache.savePreference('lang', STATE.lang);
      shell.updateLang(STATE.lang);
      applyLang();
    });
  });

  applyLang();

  fetchLive();
  // Visibility-aware refresh: pause polling while the tab is hidden, catch up
  // on re-show. Replaces a bare setInterval that polled even in a background tab.
  if (STATE.refreshCtrl) STATE.refreshCtrl.stop();
  STATE.refreshCtrl = startVisibilityAwareRefresh(fetchLive, {
    intervalMs: CONSTANTS.GOLD_REFRESH_MS,
  });
}

init();
