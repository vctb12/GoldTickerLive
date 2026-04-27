/**
 * Landing page entry point.
 * Fetches live gold + FX data in parallel, renders the hero live card
 * and GCC quick-price grid. Cache-first: shows cached data instantly.
 */
import { CONSTANTS, BASE_PATH, KARATS, COUNTRIES, TRANSLATIONS } from '../config/index.js';
import * as api from '../lib/api.js';
import * as cache from '../lib/cache.js';
import * as calc from '../lib/price-calculator.js';
import * as fmt from '../lib/formatter.js';
import { getMarketStatus } from '../lib/live-status.js';
import { injectNav, updateNavLang } from '../components/nav.js';
import { injectFooter } from '../components/footer.js';
import { injectTicker, updateTicker, updateTickerLang } from '../components/ticker.js';
import { injectSpotBar, updateSpotBar, updateSpotBarLang } from '../components/spotBar.js';
import { renderAdSlot } from '../components/adSlot.js';
import '../lib/reveal.js';
import { countUp } from '../lib/count-up.js';
import { clear, el, safeHref } from '../lib/safe-dom.js';

// ── Constants ──────────────────────────────────────────────────────────────
const LANG_KEY = 'user_prefs';
const SKELETON_TIMEOUT_MS = 8000;

// ── State ──────────────────────────────────────────────────────────────────
let lang = 'en';
let goldPrice = null;
let dayOpenPrice = null;
let rates = {};
let goldUpdatedAt = null;
let priceSourceLabel = 'cached/fallback';
let _refreshTimer = null;

function getLang() {
  try {
    const p = JSON.parse(localStorage.getItem(LANG_KEY) || '{}');
    return p.lang || 'en';
  } catch {
    return 'en';
  }
}

function saveLang(l) {
  try {
    const p = JSON.parse(localStorage.getItem(LANG_KEY) || '{}');
    p.lang = l;
    localStorage.setItem(LANG_KEY, JSON.stringify(p));
  } catch {}
}

// ── Market status ──────────────────────────────────────────────────────────
// Canonical gold-market schedule (Sun 22:00 UTC – Fri 21:00 UTC) lives in
// `src/lib/live-status.js`. Phase 4 of §22b removed the duplicate local
// implementation; this page consumes the shared primitive directly.

// ── Translations ────────────────────────────────────────────────────────────
function tx(key) {
  const fullKey = 'home.' + key;
  return TRANSLATIONS[lang]?.[fullKey] ?? TRANSLATIONS.en?.[fullKey] ?? key;
}

// ── Regional groupings for homepage display ────────────────────────────────
const GCC = COUNTRIES.filter((c) => c.group === 'gcc');
const MENA = COUNTRIES.filter((c) => ['gcc', 'levant', 'africa'].includes(c.group));
const GLOBAL = COUNTRIES;
// Complete map of country-code → countries/ directory slug.
// Only codes listed here have a dedicated page; the rest are rendered without a link.
const COUNTRY_SLUGS = {
  AE: 'uae',
  SA: 'saudi-arabia',
  KW: 'kuwait',
  QA: 'qatar',
  BH: 'bahrain',
  OM: 'oman',
  JO: 'jordan',
  LB: 'lebanon',
  IQ: 'iraq',
  SY: 'syria',
  PS: 'palestine',
  YE: 'yemen',
  EG: 'egypt',
  LY: 'libya',
  TN: 'tunisia',
  DZ: 'algeria',
  MA: 'morocco',
  SD: 'sudan',
  TR: 'turkey',
  PK: 'pakistan',
  IN: 'india',
};
let homeRegion = (() => {
  try {
    return JSON.parse(localStorage.getItem('user_prefs') || '{}').homeRegion || 'gcc';
  } catch {
    return 'gcc';
  }
})();

// ── Render helpers ─────────────────────────────────────────────────────────
function setTextById(id, text) {
  const target = document.getElementById(id);
  if (target) target.textContent = text;
}

function getFreshnessMeta() {
  const freshnessTime = goldUpdatedAt || new Date().toISOString();
  const ageMs = goldUpdatedAt ? Date.now() - new Date(goldUpdatedAt).getTime() : 0;
  const isStaleByAge = ageMs > 12 * 60 * 1000; // >12 minutes (matches GOLD_MARKET.STALE_AFTER_MS)
  const isLive = priceSourceLabel === 'live' && !isStaleByAge;
  let sourceText;
  if (isLive) {
    sourceText = tx('sourceLive');
  } else if (isStaleByAge && goldUpdatedAt) {
    const mins = Math.floor(ageMs / 60000);
    sourceText =
      mins >= 60
        ? `${tx('sourceStale')} (${Math.floor(mins / 60)}h ${mins % 60}m ago)`
        : `${tx('sourceStale')} (${mins}m ago)`;
  } else if (priceSourceLabel === 'unavailable') {
    sourceText = tx('sourceUnavailable');
  } else {
    sourceText = tx('sourceCached');
  }
  return { freshnessTime, isLive, sourceText };
}

// ── Render hero live card ──────────────────────────────────────────────────
function renderHeroCard() {
  if (!goldPrice) return;
  const k24 = KARATS.find((k) => k.code === '24');
  const k22 = KARATS.find((k) => k.code === '22');
  const k21 = KARATS.find((k) => k.code === '21');

  const usd24oz = goldPrice;
  const aed24g = calc.usdPerGram(goldPrice, k24.purity) * CONSTANTS.AED_PEG;
  const usd22g = calc.usdPerGram(goldPrice, k22.purity);
  const aed22g = usd22g * CONSTANTS.AED_PEG;
  const usd21g = calc.usdPerGram(goldPrice, k21.purity);

  // Update sticky spot bar
  updateSpotBar({
    xauUsd: usd24oz,
    aed24kGram: aed24g,
    updatedAt: goldUpdatedAt,
    hasLiveFailure: priceSourceLabel !== 'live',
  });

  const priceEl = document.getElementById('hlc-price');
  if (priceEl) {
    priceEl.textContent = fmt.formatPrice(usd24oz, 'USD', 2);
    priceEl.classList.remove('hlc-price--loading');
  }
  document.getElementById('hero-live-card')?.removeAttribute('aria-busy');
  setTextById('hlc-aed24', fmt.formatPrice(aed24g, 'AED', 2));
  setTextById('hlc-usd22', fmt.formatPrice(usd22g, 'USD', 2));
  setTextById('hlc-aed22', fmt.formatPrice(aed22g, 'AED', 2));
  setTextById('hlc-usd21', fmt.formatPrice(usd21g, 'USD', 2));
  const { freshnessTime, isLive, sourceText } = getFreshnessMeta();
  setTextById(
    'hlc-updated',
    `${tx('updated')}: ${fmt.formatTimestampShort(freshnessTime, lang)} · ${tx('source')}: ${sourceText}`
  );
  setTextById(
    'karat-strip-updated',
    `${tx('updated')}: ${fmt.formatTimestampShort(freshnessTime, lang)} · ${sourceText}`
  );

  // Change vs day open
  const changeEl = document.getElementById('hlc-change');
  if (changeEl && dayOpenPrice && goldPrice) {
    const chg = ((goldPrice - dayOpenPrice) / dayOpenPrice) * 100;
    const sign = chg >= 0 ? '+' : '';
    changeEl.textContent = `${tx('changeLabel')}: ${sign}${chg.toFixed(2)}%`;
    changeEl.className = 'hlc-change ' + (chg >= 0 ? 'badge-up' : 'badge-down');
    changeEl.hidden = false;
  }

  // Market status
  const statusEl = document.getElementById('hlc-market-status');
  if (statusEl) {
    const { isOpen } = getMarketStatus();
    statusEl.textContent = isOpen ? tx('marketOpen') : tx('marketClosed');
    statusEl.className = 'hlc-market ' + (isOpen ? 'hlc-market--open' : 'hlc-market--closed');
  }

  // Update bottom ticker
  const k18 = KARATS.find((k) => k.code === '18');
  updateTicker({
    xauUsd: goldPrice,
    uae24k: aed24g,
    uae22k: calc.usdPerGram(goldPrice, k22.purity) * CONSTANTS.AED_PEG,
    uae21k: calc.usdPerGram(goldPrice, k21.purity) * CONSTANTS.AED_PEG,
    uae18k: calc.usdPerGram(goldPrice, k18?.purity ?? 0.75) * CONSTANTS.AED_PEG,
    updatedAt: goldUpdatedAt,
    hasLiveFailure: priceSourceLabel !== 'live',
  });

  // Update karat strip
  renderKaratStrip(k18);

  // Update freshness banner
  const bar = document.getElementById('home-freshness-bar');
  const barText = document.getElementById('hfb-text');
  if (bar && barText) {
    const stale = !isLive;
    const timeStr = goldUpdatedAt ? fmt.formatTimestampShort(goldUpdatedAt, lang) : '—';
    bar.classList.toggle('home-freshness-bar--stale', stale);
    barText.textContent = stale
      ? `${tx('sourceCached')} · ${tx('updated')}: ${timeStr}`
      : `${tx('sourceLive')} · ${tx('updated')}: ${timeStr}`;
    bar.removeAttribute('hidden');
  }
}

// ── Render karat price strip ───────────────────────────────────────────────
function renderKaratStrip(k18Ref) {
  if (!goldPrice) return;
  const AED = CONSTANTS.AED_PEG;
  const k18 = k18Ref || KARATS.find((k) => k.code === '18');
  const k21 = KARATS.find((k) => k.code === '21');
  const k22 = KARATS.find((k) => k.code === '22');
  const k24 = KARATS.find((k) => k.code === '24');
  const k14 = KARATS.find((k) => k.code === '14');

  // Skip rendering if required core karat data is not available; 14K is optional.
  if (!k18 || !k21 || !k22 || !k24) return;

  const prices = {
    24: calc.usdPerGram(goldPrice, k24.purity) * AED,
    22: calc.usdPerGram(goldPrice, k22.purity) * AED,
    21: calc.usdPerGram(goldPrice, k21.purity) * AED,
    18: calc.usdPerGram(goldPrice, k18.purity) * AED,
  };
  if (k14) prices[14] = calc.usdPerGram(goldPrice, k14.purity) * AED;

  for (const [k, v] of Object.entries(prices)) {
    const valueElement = document.getElementById(`kstrip-${k}-val`);
    if (valueElement) {
      valueElement.className = 'karat-strip-v';
      // Smooth count-up with directional flash when price changes.
      countUp(valueElement, v, {
        decimals: 2,
        format: (n) => fmt.formatPrice(n, 'AED', 2),
      });
    }
  }
}

// ── Render GCC grid ────────────────────────────────────────────────────────
function renderGCCGrid() {
  const grid = document.getElementById('gcc-quick-grid');
  if (!grid || !goldPrice) return;
  const k22 = KARATS.find((k) => k.code === '22');

  // Select countries based on current region filter
  const regionLists = { gcc: GCC, mena: MENA, global: GLOBAL };
  const countries = regionLists[homeRegion] || GCC;
  const { sourceText } = getFreshnessMeta();
  const fragment = document.createDocumentFragment();

  clear(grid);
  countries.forEach((c) => {
    let price = '—';
    if (c.currency === 'AED') {
      price = fmt.formatPrice(calc.usdPerGram(goldPrice, k22.purity) * CONSTANTS.AED_PEG, 'AED', 2);
    } else if (rates[c.currency]) {
      price = fmt.formatPrice(
        calc.usdPerGram(goldPrice, k22.purity) * rates[c.currency],
        c.currency,
        c.decimals
      );
    }
    const name = lang === 'ar' ? c.nameAr : c.nameEn;
    const slug = COUNTRY_SLUGS[c.code] ?? null;

    const headerChildren = [
      el('span', { class: 'gcc-flag', 'aria-hidden': 'true' }, c.flag),
      el('div', { class: 'gcc-meta' }, [
        el('span', { class: 'gcc-name' }, name),
        el('span', { class: 'gcc-currency' }, c.currency),
      ]),
    ];
    if (dayOpenPrice && goldPrice) {
      const chg = ((goldPrice - dayOpenPrice) / dayOpenPrice) * 100;
      const sign = chg >= 0 ? '+' : '';
      const cls = chg >= 0 ? 'badge-up' : 'badge-down';
      headerChildren.push(
        el('span', { class: `gcc-change badge ${cls}` }, `${sign}${chg.toFixed(2)}%`)
      );
    }

    const cardChildren = [
      el('div', { class: 'gcc-card-header' }, headerChildren),
      el('div', { class: 'gcc-price' }, price),
      el('div', { class: 'gcc-unit' }, `${tx('perGram')} · 22K`),
      el('div', { class: 'gcc-source' }, sourceText),
    ];
    const card = slug
      ? el('a', { href: safeHref(`./countries/${slug}/`), class: 'gcc-card' }, cardChildren)
      : el('div', { class: 'gcc-card gcc-card--no-link' }, cardChildren);

    fragment.append(
      el('div', { class: 'gcc-card-wrapper' }, [
        card,
        el(
          'button',
          {
            class: 'gcc-copy-btn',
            dataset: { copy: price },
            'aria-label': `${tx('copyPrice')} ${name}`,
            type: 'button',
          },
          '⎘'
        ),
      ])
    );
  });
  grid.append(fragment);
}

// ── Apply full page language ───────────────────────────────────────────────
function applyLangToPage() {
  const isAr = lang === 'ar';
  document.documentElement.lang = lang;
  document.documentElement.dir = isAr ? 'rtl' : 'ltr';

  setTextById('hero-live-label', tx('heroLive'));
  setTextById('hero-title-main', tx('heroTitle'));
  setTextById('hero-title-sub', tx('heroSub'));
  setTextById('hero-lead', tx('heroLead'));
  setTextById('hero-cta-tracker', tx('heroCta1'));
  setTextById('hero-cta-calculator', tx('heroCtaCalculator'));
  setTextById('hero-cta-countries', tx('heroCta2'));
  setTextById('hero-cta-shops', tx('heroCta4'));
  setTextById('hero-cta-alert', tx('heroCta5'));
  setTextById('hero-cta-methodology', tx('heroCtaMethodology'));
  setTextById('hero-trust-line', tx('heroTrustLine'));
  setTextById('hlc-trust-line', tx('heroTrustShort'));
  setTextById('hlc-tracker-link', tx('trackerLink'));
  setTextById('hlc-title', tx('spotTitle'));
  setTextById('hlc-sub', tx('perOz'));
  setTextById('hlc-label-aed24', tx('lbl24aed'));
  setTextById('hlc-label-usd22', tx('lbl22usd'));
  setTextById('hlc-label-aed22', tx('lbl22aed'));
  setTextById('hlc-label-usd21', tx('lbl21usd'));
  setTextById('hlc-updated', tx('fetching'));
  setTextById('gcc-section-title', tx('gccLiveTitle'));
  setTextById('gcc-section-sub', tx('gccLiveSub'));
  setTextById('gcc-see-all', tx('seeAll'));
  setTextById('trust-live', tx('trustLive'));
  setTextById('trust-live-sub', tx('trustLiveSub'));
  setTextById('trust-countries', tx('trustCountries'));
  setTextById('trust-countries-sub', tx('trustCountriesSub'));
  setTextById('trust-karats', tx('trustKarats'));
  setTextById('trust-karats-sub', tx('trustKaratsSub'));
  setTextById('trust-aed', tx('trustAed'));
  setTextById('trust-aed-sub', tx('trustAedSub'));
  setTextById('trust-bilingual', tx('trustBilingual'));
  setTextById('trust-bilingual-sub', tx('trustBilingualSub'));
  setTextById('trust-offline', tx('trustOffline'));
  setTextById('trust-offline-sub', tx('trustOfflineSub'));
  setTextById('karat-strip-label', tx('karatStripLabel'));
  setTextById('karat-strip-title', tx('karatStripTitle'));
  setTextById('karat-strip-sub', tx('karatStripSub'));
  setTextById('karat-strip-cta', tx('karatStripCta'));
  setTextById('tools-title', tx('toolsTitle'));
  setTextById('tools-sub', tx('toolsSub'));
  setTextById('tool-tracker-title', tx('toolTrackerTitle'));
  setTextById('tool-tracker-desc', tx('toolTrackerDesc'));
  setTextById('tool-tracker-cta', tx('toolTrackerCta'));
  setTextById('tool-calc-title', tx('toolCalcTitle'));
  setTextById('tool-calc-desc', tx('toolCalcDesc'));
  setTextById('tool-calc-cta', tx('toolCalcCta'));
  setTextById('tool-uae-title', tx('toolUaeTitle'));
  setTextById('tool-uae-desc', tx('toolUaeDesc'));
  setTextById('tool-uae-cta', tx('toolUaeCta'));
  setTextById('tool-shops-title', tx('toolShopsTitle'));
  setTextById('tool-shops-desc', tx('toolShopsDesc'));
  setTextById('tool-shops-cta', tx('toolShopsCta'));
  setTextById('tool-countries-title', tx('toolCountriesTitle'));
  setTextById('tool-countries-desc', tx('toolCountriesDesc'));
  setTextById('tool-countries-cta', tx('toolCountriesCta'));
  setTextById('tool-learn-title', tx('toolLearnTitle'));
  setTextById('tool-learn-desc', tx('toolLearnDesc'));
  setTextById('tool-learn-cta', tx('toolLearnCta'));
  setTextById('tool-insights-title', tx('toolInsightsTitle'));
  setTextById('tool-insights-desc', tx('toolInsightsDesc'));
  setTextById('tool-insights-cta', tx('toolInsightsCta'));
  setTextById('tool-method-title', tx('toolMethodTitle'));
  setTextById('tool-method-desc', tx('toolMethodDesc'));
  setTextById('tool-method-cta', tx('toolMethodCta'));
  setTextById('tool-invest-title', tx('toolInvestTitle'));
  setTextById('tool-invest-desc', tx('toolInvestDesc'));
  setTextById('tool-invest-cta', tx('toolInvestCta'));
  setTextById('tools-alert-text', tx('alertRowText'));
  setTextById('tools-alert-btn', tx('alertBtn'));
  setTextById('trust-banner-title', tx('trustBannerTitle'));
  setTextById('trust-banner-copy', tx('trustBannerCopy'));
  setTextById('trust-banner-source-tail', tx('trustBannerSourceTail'));
  setTextById('trust-banner-methodology', tx('trustBannerMethodology'));
  setTextById('countries-quick-title', tx('countriesTitle'));
  setTextById('countries-quick-sub', tx('countriesSub'));
  setTextById('countries-see-all', tx('seeAllCountries'));
  setTextById('social-follow-text', tx('socialFollowText'));
  setTextById('social-follow-cta', tx('socialFollowCta'));
  setTextById('explainer-spot-title', tx('explainerSpotTitle'));
  setTextById('explainer-spot-desc', tx('explainerSpotDesc'));
  setTextById('explainer-karat-title', tx('explainerKaratTitle'));
  setTextById('explainer-karat-desc', tx('explainerKaratDesc'));
  setTextById('explainer-local-title', tx('explainerLocalTitle'));
  setTextById('explainer-local-desc', tx('explainerLocalDesc'));
  setTextById('faq-title', tx('faqTitle'));
  setTextById('faq-more-link', tx('faqMore'));

  // Country tiles — use localised names from COUNTRIES data
  const countryMap = {
    'ct-uae': 'AE',
    'ct-sa': 'SA',
    'ct-kw': 'KW',
    'ct-qa': 'QA',
    'ct-bh': 'BH',
    'ct-om': 'OM',
    'ct-eg': 'EG',
    'ct-jo': 'JO',
    'ct-ma': 'MA',
    'ct-in': 'IN',
  };
  for (const [elId, code] of Object.entries(countryMap)) {
    const c = COUNTRIES.find((x) => x.code === code);
    if (c) setTextById(elId, isAr ? c.nameAr : c.nameEn);
  }
  setTextById('ct-more', tx('seeAllCountries'));

  renderHeroCard();
  renderGCCGrid();
}

// ── Fetch live data in parallel ────────────────────────────────────────────
async function fetchLiveData() {
  if (!navigator.onLine) return;

  const [goldRes, fxRes] = await Promise.allSettled([api.fetchGold(), api.fetchFX()]);

  if (goldRes.status === 'fulfilled') {
    goldPrice = goldRes.value.price;
    goldUpdatedAt = goldRes.value.updatedAt || new Date().toISOString();
    priceSourceLabel = goldRes.value.source === 'cache-fallback' ? 'cached/fallback' : 'live';
    cache.saveGoldPrice(goldRes.value.price, goldRes.value.updatedAt);
    renderHeroCard();
  } else if (!goldPrice) {
    priceSourceLabel = 'unavailable';
    // Show explicit unavailable state in hero
    const priceEl = document.getElementById('hlc-price');
    if (priceEl) {
      priceEl.classList.remove('hlc-price--loading');
      priceEl.textContent = '—';
    }
    const updEl = document.getElementById('hlc-updated');
    if (updEl) updEl.textContent = tx('priceUnavailableApi');
    document.getElementById('hero-live-card')?.removeAttribute('aria-busy');
  }

  if (fxRes.status === 'fulfilled') {
    rates = fxRes.value.rates ?? {};
    cache.saveFXRates(rates, {
      lastUpdateUtc: fxRes.value.time_last_update_utc,
      nextUpdateUtc: fxRes.value.time_next_update_utc,
    });
    renderGCCGrid();
  }
}

// ── Init ───────────────────────────────────────────────────────────────────
async function init() {
  lang = getLang();

  // Apply language direction immediately
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

  // Nav + footer + spot bar
  injectSpotBar(lang, 0);
  const navCtrl = injectNav(lang, 0);
  navCtrl.getLangToggleButtons().forEach((btn) => {
    btn.addEventListener('click', () => {
      lang = lang === 'en' ? 'ar' : 'en';
      saveLang(lang);
      updateNavLang(lang);
      updateTickerLang(lang);
      updateSpotBarLang(lang);
      applyLangToPage();
    });
  });
  injectFooter(lang, 0);
  injectTicker(lang, 0);

  // Render ad slots
  renderAdSlot('ad-top', 'leaderboard');
  renderAdSlot('ad-bottom', 'rectangle');

  // Bind region tab filters
  document.querySelectorAll('.gcc-region-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      homeRegion = tab.dataset.region;
      try {
        const p = JSON.parse(localStorage.getItem('user_prefs') || '{}');
        p.homeRegion = homeRegion;
        localStorage.setItem('user_prefs', JSON.stringify(p));
      } catch (_) {}
      document.querySelectorAll('.gcc-region-tab').forEach((t) => {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
      renderGCCGrid();
    });
    if (tab.dataset.region === homeRegion) {
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');
    }
  });

  // Freshness bar dismiss
  document.getElementById('hfb-dismiss')?.addEventListener('click', () => {
    document.getElementById('home-freshness-bar')?.setAttribute('hidden', '');
  });

  // Copy price button (event delegation)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.gcc-copy-btn');
    if (!btn) return;
    const text = btn.dataset.copy;
    if (!text || text === '—') return;
    navigator.clipboard
      ?.writeText(text)
      .then(() => {
        const orig = btn.textContent;
        btn.textContent = '✓';
        setTimeout(() => {
          btn.textContent = orig;
        }, 1500);
      })
      .catch(() => {});
  });

  // Load cache first for instant render
  const cacheState = {
    lang,
    goldPriceUsdPerOz: null,
    rates: {},
    fxMeta: { nextUpdateUtc: 0 },
    status: {},
    freshness: {},
    favorites: [],
    history: [],
    prevGoldPriceUsdPerOz: null,
    dayOpenGoldPriceUsdPerOz: null,
    isOnline: navigator.onLine,
  };
  cache.loadState(cacheState);

  if (cacheState.goldPriceUsdPerOz) {
    goldPrice = cacheState.goldPriceUsdPerOz;
    dayOpenPrice = cacheState.dayOpenGoldPriceUsdPerOz;
    rates = cacheState.rates;
    goldUpdatedAt = cacheState.freshness?.goldUpdatedAt || null;
    priceSourceLabel = 'cached/fallback';
  }

  applyLangToPage();

  // Render cached data immediately for instant content (non-blocking)
  if (goldPrice) {
    renderHeroCard();
    renderGCCGrid();
  }

  // Fetch live data (non-blocking)
  fetchLiveData();

  // Auto-refresh every 90 seconds
  if (_refreshTimer) clearInterval(_refreshTimer);
  _refreshTimer = setInterval(fetchLiveData, CONSTANTS.GOLD_REFRESH_MS);

  // Clean up timer on page unload to prevent memory leaks
  window.addEventListener(
    'pagehide',
    () => {
      if (_refreshTimer) {
        clearInterval(_refreshTimer);
        _refreshTimer = null;
      }
    },
    { once: true }
  );

  // Register service worker for offline support
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register(BASE_PATH + 'sw.js').catch(() => {});
  }

  // PWA install prompt — capture the beforeinstallprompt event and show a
  // subtle banner after 30 seconds if the user hasn't dismissed it before.
  initPwaInstallPrompt();
  // Skeleton timeout: if price still loading after 8s, show unavailable state
  setTimeout(() => {
    const priceEl = document.getElementById('hlc-price');
    if (priceEl && priceEl.classList.contains('hlc-price--loading')) {
      priceEl.classList.remove('hlc-price--loading');
      priceEl.textContent = '—';
      const updEl = document.getElementById('hlc-updated');
      if (updEl) updEl.textContent = tx('priceUnavailableConnection');
      document.getElementById('hero-live-card')?.removeAttribute('aria-busy');
    }
    // GCC grid skeleton timeout
    document.querySelectorAll('.gcc-card.skeleton-card').forEach((card) => {
      card.classList.remove('skeleton-card');
      card.textContent = '—';
    });
  }, SKELETON_TIMEOUT_MS);
}

document.addEventListener('DOMContentLoaded', () => {
  init().catch((err) => {
    console.error('[home] Initialisation error:', err);
  });
});

// ---------------------------------------------------------------------------
// PWA Install Prompt
// ---------------------------------------------------------------------------
/**
 * Listens for the browser's beforeinstallprompt event and shows a subtle
 * bottom banner after a delay. Respects user dismissal via localStorage.
 * The banner renders itself directly into the DOM — no HTML changes needed.
 */
function initPwaInstallPrompt() {
  // Don't show if user already dismissed or if already installed
  if (localStorage.getItem('pwa_install_dismissed')) return;
  if (window.matchMedia('(display-mode: standalone)').matches) return;

  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    // Show banner after 30 seconds of engagement
    setTimeout(() => {
      if (!deferredPrompt) return;
      if (localStorage.getItem('pwa_install_dismissed')) return;
      showPwaBanner(deferredPrompt);
    }, 30000);
  });
}

function showPwaBanner(deferredPrompt) {
  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-label', tx('pwaInstallLabel'));
  banner.append(
    el('div', { class: 'pwa-banner-inner' }, [
      el('img', {
        src: safeHref(`${BASE_PATH}favicon.svg`),
        width: '32',
        height: '32',
        alt: '',
        'aria-hidden': 'true',
        class: 'pwa-banner-icon',
      }),
      el('div', { class: 'pwa-banner-text' }, [
        el('strong', null, tx('pwaTitle')),
        el('span', null, tx('pwaSubtitle')),
      ]),
      el(
        'button',
        {
          class: 'pwa-banner-install btn btn-primary btn-sm',
          id: 'pwa-install-btn',
          type: 'button',
        },
        tx('pwaInstall')
      ),
      el(
        'button',
        {
          class: 'pwa-banner-dismiss',
          id: 'pwa-dismiss-btn',
          'aria-label': tx('pwaDismiss'),
          type: 'button',
        },
        '✕'
      ),
    ])
  );

  // Inject styles
  if (!document.getElementById('pwa-banner-styles')) {
    const style = document.createElement('style');
    style.id = 'pwa-banner-styles';
    style.textContent = `
      #pwa-install-banner {
        position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999;
        background: #1e293b; color: #f8fafc;
        border-top: 2px solid #d4a017;
        padding: 0.75rem 1rem;
        box-shadow: 0 -4px 24px rgba(0,0,0,0.3);
        animation: pwaSlideUp 0.3s ease;
      }
      @media (max-width: 640px) {
        #pwa-install-banner { bottom: 60px; }
      }
      @keyframes pwaSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      .pwa-banner-inner {
        display: flex; align-items: center; gap: 0.75rem;
        max-width: 960px; margin: 0 auto;
      }
      .pwa-banner-icon { flex-shrink: 0; border-radius: 8px; }
      .pwa-banner-text { flex: 1; min-width: 0; }
      .pwa-banner-text strong { display: block; font-size: 0.875rem; font-weight: 700; }
      .pwa-banner-text span { font-size: 0.78rem; color: #94a3b8; }
      .pwa-banner-install {
        flex-shrink: 0; background: #d4a017; color: #fff; border: none;
        padding: 0.45rem 1rem; border-radius: 6px; font-size: 0.8rem;
        font-weight: 700; cursor: pointer; white-space: nowrap;
      }
      .pwa-banner-install:hover { background: #b8860b; }
      .pwa-banner-dismiss {
        background: none; border: none; color: #94a3b8; cursor: pointer;
        font-size: 1rem; padding: 0.25rem 0.5rem; flex-shrink: 0;
      }
      .pwa-banner-dismiss:hover { color: #f8fafc; }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(banner);

  document.getElementById('pwa-install-btn').addEventListener('click', async () => {
    banner.remove();
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem('pwa_install_dismissed', '1');
    }
    deferredPrompt = null;
  });

  document.getElementById('pwa-dismiss-btn').addEventListener('click', () => {
    banner.remove();
    localStorage.setItem('pwa_install_dismissed', '1');
    deferredPrompt = null;
  });
}
