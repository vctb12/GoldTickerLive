/**
 * Landing page entry point.
 * Fetches live gold + FX data in parallel, renders the hero live card
 * and GCC quick-price grid. Cache-first: shows cached data instantly.
 */
import { CONSTANTS, BASE_PATH, KARATS, COUNTRIES, TRANSLATIONS } from './config/index.js';
import * as api from './lib/api.js';
import * as cache from './lib/cache.js';
import * as calc from './lib/price-calculator.js';
import * as fmt from './lib/formatter.js';
import { injectNav, updateNavLang } from './components/nav.js';
import { injectFooter } from './components/footer.js';
import { injectTicker, updateTicker, updateTickerLang } from './components/ticker.js';

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
  } catch { return 'en'; }
}

function saveLang(l) {
  try {
    const p = JSON.parse(localStorage.getItem(LANG_KEY) || '{}');
    p.lang = l;
    localStorage.setItem(LANG_KEY, JSON.stringify(p));
  } catch {}
}

// ── Market status ──────────────────────────────────────────────────────────
// Gold trades 24/5 (Sun 22:00 UTC – Fri 21:00 UTC approx)
function getMarketStatus() {
  const now = new Date();
  const utcDay  = now.getUTCDay();   // 0=Sun, 5=Fri, 6=Sat
  const utcHour = now.getUTCHours();
  const utcMin  = now.getUTCMinutes();
  const utcTime = utcHour * 60 + utcMin;

  const OPEN_SUN  = 22 * 60;  // Sun 22:00 UTC
  const CLOSE_FRI = 21 * 60;  // Fri 21:00 UTC

  let isOpen = false;
  if (utcDay === 6) { isOpen = false; }                           // Saturday always closed
  else if (utcDay === 5) { isOpen = utcTime < CLOSE_FRI; }        // Friday: open until 21:00
  else if (utcDay === 0) { isOpen = utcTime >= OPEN_SUN; }        // Sunday: open from 22:00
  else { isOpen = true; }                                          // Mon–Thu always open

  return isOpen ? 'open' : 'closed';
}

// ── Translations ────────────────────────────────────────────────────────────
function tx(key) {
  const fullKey = 'home.' + key;
  return TRANSLATIONS[lang]?.[fullKey] ?? TRANSLATIONS.en?.[fullKey] ?? key;
}

// ── Regional groupings for homepage display ────────────────────────────────
const GCC    = COUNTRIES.filter(c => c.group === 'gcc');
const MENA   = COUNTRIES.filter(c => ['gcc', 'levant', 'africa'].includes(c.group));
const GLOBAL = COUNTRIES;
let homeRegion = 'gcc';  // Track which region is currently shown

// ── Render helpers ─────────────────────────────────────────────────────────
function set(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// ── Render hero live card ──────────────────────────────────────────────────
function renderHeroCard() {
  if (!goldPrice) return;
  const k24 = KARATS.find(k => k.code === '24');
  const k22 = KARATS.find(k => k.code === '22');
  const k21 = KARATS.find(k => k.code === '21');

  const usd24oz = goldPrice;
  const aed24g  = calc.usdPerGram(goldPrice, k24.purity) * CONSTANTS.AED_PEG;
  const usd22g  = calc.usdPerGram(goldPrice, k22.purity);
  const aed22g  = usd22g * CONSTANTS.AED_PEG;
  const usd21g  = calc.usdPerGram(goldPrice, k21.purity);

  const priceEl = document.getElementById('hlc-price');
  if (priceEl) {
    priceEl.textContent = fmt.formatPrice(usd24oz, 'USD', 2);
    priceEl.classList.remove('hlc-price--loading');
  }
  document.getElementById('hero-live-card')?.removeAttribute('aria-busy');
  set('hlc-aed24',  fmt.formatPrice(aed24g,  'AED', 2));
  set('hlc-usd22',  fmt.formatPrice(usd22g,  'USD', 2));
  set('hlc-aed22',  fmt.formatPrice(aed22g,  'AED', 2));
  set('hlc-usd21',  fmt.formatPrice(usd21g,  'USD', 2));
  const freshnessTime = goldUpdatedAt || new Date().toISOString();
  const sourceText = priceSourceLabel === 'live' ? 'Live' : 'Cached/Fallback';
  set('hlc-updated', `${tx('updated')}: ${fmt.formatTimestampShort(freshnessTime, lang)} · ${tx('source')}: ${sourceText}`);

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
    const status = getMarketStatus();
    statusEl.textContent = status === 'open' ? tx('marketOpen') : tx('marketClosed');
    statusEl.className = 'hlc-market ' + (status === 'open' ? 'hlc-market--open' : 'hlc-market--closed');
  }

  // Update bottom ticker
  const k18 = KARATS.find(k => k.code === '18');
  updateTicker({
    xauUsd:  goldPrice,
    uae24k:  aed24g,
    uae22k:  calc.usdPerGram(goldPrice, k22.purity) * CONSTANTS.AED_PEG,
    uae21k:  calc.usdPerGram(goldPrice, k21.purity) * CONSTANTS.AED_PEG,
    uae18k:  calc.usdPerGram(goldPrice, k18?.purity ?? 0.75) * CONSTANTS.AED_PEG,
  });

  // Update karat strip
  renderKaratStrip(k18);
}

// ── Render karat price strip ───────────────────────────────────────────────
function renderKaratStrip(k18Ref) {
  if (!goldPrice) return;
  const AED = CONSTANTS.AED_PEG;
  const k18 = k18Ref || KARATS.find(k => k.code === '18');
  const k21 = KARATS.find(k => k.code === '21');
  const k22 = KARATS.find(k => k.code === '22');
  const k24 = KARATS.find(k => k.code === '24');

  // Skip rendering if required karat data is not available
  if (!k18 || !k21 || !k22 || !k24) return;

  const prices = {
    '24': calc.usdPerGram(goldPrice, k24.purity) * AED,
    '22': calc.usdPerGram(goldPrice, k22.purity) * AED,
    '21': calc.usdPerGram(goldPrice, k21.purity) * AED,
    '18': calc.usdPerGram(goldPrice, k18.purity) * AED,
  };

  for (const [k, v] of Object.entries(prices)) {
    const el = document.getElementById(`kstrip-${k}-val`);
    if (el) {
      el.className = 'karat-strip-v';
      el.textContent = fmt.formatPrice(v, 'AED', 2);
    }
  }
}

// ── Render GCC grid ────────────────────────────────────────────────────────
function renderGCCGrid() {
  const grid = document.getElementById('gcc-quick-grid');
  if (!grid || !goldPrice) return;
  const k22 = KARATS.find(k => k.code === '22');

  // Select countries based on current region filter
  const regionLists = { gcc: GCC, mena: MENA, global: GLOBAL };
  const countries = regionLists[homeRegion] || GCC;

  grid.innerHTML = countries.map(c => {
    let price = '—';
    if (c.currency === 'AED') {
      price = fmt.formatPrice(calc.usdPerGram(goldPrice, k22.purity) * CONSTANTS.AED_PEG, 'AED', 2);
    } else if (rates[c.currency]) {
      price = fmt.formatPrice(calc.usdPerGram(goldPrice, k22.purity) * rates[c.currency], c.currency, c.decimals);
    }
    const name = lang === 'ar' ? c.nameAr : c.nameEn;
    const slug = { AE:'uae', SA:'saudi-arabia', KW:'kuwait', QA:'qatar', BH:'bahrain', OM:'oman' }[c.code] ?? c.code.toLowerCase();

    // Change badge from day open
    let changeBadge = '';
    if (dayOpenPrice && goldPrice) {
      const chg = ((goldPrice - dayOpenPrice) / dayOpenPrice) * 100;
      const sign = chg >= 0 ? '+' : '';
      const cls  = chg >= 0 ? 'badge-up' : 'badge-down';
      changeBadge = `<span class="gcc-change badge ${cls}">${sign}${chg.toFixed(2)}%</span>`;
    }

    return `<a href="countries/${slug}.html" class="gcc-card">
      <div class="gcc-card-header">
        <span class="gcc-flag" aria-hidden="true">${c.flag}</span>
        <div class="gcc-meta">
          <span class="gcc-name">${name}</span>
          <span class="gcc-currency">${c.currency}</span>
        </div>
        ${changeBadge}
      </div>
      <div class="gcc-price">${price}</div>
      <div class="gcc-unit">${tx('perGram')} · 22K</div>
    </a>`;
  }).join('');
}

// ── Apply full page language ───────────────────────────────────────────────
function applyLangToPage() {
  const isAr = lang === 'ar';
  document.documentElement.lang = lang;
  document.documentElement.dir = isAr ? 'rtl' : 'ltr';

  set('hero-live-label',    tx('heroLive'));
  set('hero-title-main',    tx('heroTitle'));
  set('hero-title-sub',     tx('heroSub'));
  set('hero-lead',          tx('heroLead'));
  set('hero-cta-tracker',   tx('heroCta1'));
  set('hero-cta-countries', tx('heroCta2'));
  set('hero-cta-shops',     tx('heroCta4'));
  set('hero-cta-alert',     tx('heroCta5'));
  set('hlc-tracker-link',   tx('trackerLink'));
  set('hlc-title',          tx('spotTitle'));
  set('hlc-sub',            tx('perOz'));
  set('hlc-label-aed24',    tx('lbl24aed'));
  set('hlc-label-usd22',    tx('lbl22usd'));
  set('hlc-label-aed22',    tx('lbl22aed'));
  set('hlc-label-usd21',    tx('lbl21usd'));
  set('hlc-updated',        tx('fetching'));
  set('gcc-section-title',  tx('gccLiveTitle'));
  set('gcc-section-sub',    tx('gccLiveSub'));
  set('gcc-see-all',        tx('seeAll'));
  set('trust-live',         tx('trustLive'));
  set('trust-live-sub',     tx('trustLiveSub'));
  set('trust-countries',    tx('trustCountries'));
  set('trust-countries-sub', tx('trustCountriesSub'));
  set('trust-karats',       tx('trustKarats'));
  set('trust-karats-sub',   tx('trustKaratsSub'));
  set('trust-aed',          tx('trustAed'));
  set('trust-aed-sub',      tx('trustAedSub'));
  set('trust-bilingual',    tx('trustBilingual'));
  set('trust-bilingual-sub', tx('trustBilingualSub'));
  set('trust-offline',      tx('trustOffline'));
  set('trust-offline-sub',  tx('trustOfflineSub'));
  set('karat-strip-label',  tx('karatStripLabel'));
  set('karat-strip-cta',    tx('karatStripCta'));
  set('tools-title',        tx('toolsTitle'));
  set('tools-sub',          tx('toolsSub'));
  set('tool-tracker-title',   tx('toolTrackerTitle'));
  set('tool-tracker-desc',    tx('toolTrackerDesc'));
  set('tool-tracker-cta',     tx('toolTrackerCta'));
  set('tool-calc-title',      tx('toolCalcTitle'));
  set('tool-calc-desc',       tx('toolCalcDesc'));
  set('tool-calc-cta',        tx('toolCalcCta'));
  set('tool-uae-title',       tx('toolUaeTitle'));
  set('tool-uae-desc',        tx('toolUaeDesc'));
  set('tool-uae-cta',         tx('toolUaeCta'));
  set('tool-shops-title',     tx('toolShopsTitle'));
  set('tool-shops-desc',      tx('toolShopsDesc'));
  set('tool-shops-cta',       tx('toolShopsCta'));
  set('tool-countries-title', tx('toolCountriesTitle'));
  set('tool-countries-desc',  tx('toolCountriesDesc'));
  set('tool-countries-cta',   tx('toolCountriesCta'));
  set('tool-learn-title',     tx('toolLearnTitle'));
  set('tool-learn-desc',      tx('toolLearnDesc'));
  set('tool-learn-cta',       tx('toolLearnCta'));
  set('tool-insights-title',  tx('toolInsightsTitle'));
  set('tool-insights-desc',   tx('toolInsightsDesc'));
  set('tool-insights-cta',    tx('toolInsightsCta'));
  set('tool-method-title',    tx('toolMethodTitle'));
  set('tool-method-desc',     tx('toolMethodDesc'));
  set('tool-method-cta',      tx('toolMethodCta'));
  set('tools-alert-text',   tx('alertRowText'));
  set('tools-alert-btn',    tx('alertBtn'));
  set('countries-quick-title', tx('countriesTitle'));
  set('countries-quick-sub',   tx('countriesSub'));
  set('countries-see-all',     tx('seeAllCountries'));
  set('faq-more-link',         tx('faqMore'));

  // Country tiles — use localised names from COUNTRIES data
  const countryMap = { 'ct-uae':'AE', 'ct-sa':'SA', 'ct-kw':'KW', 'ct-qa':'QA',
                       'ct-bh':'BH', 'ct-om':'OM', 'ct-eg':'EG', 'ct-jo':'JO',
                       'ct-ma':'MA', 'ct-in':'IN' };
  for (const [elId, code] of Object.entries(countryMap)) {
    const c = COUNTRIES.find(x => x.code === code);
    if (c) set(elId, isAr ? c.nameAr : c.nameEn);
  }
  set('ct-more', tx('seeAllCountries'));

  renderHeroCard();
  renderGCCGrid();
}

// ── Fetch live data in parallel ────────────────────────────────────────────
async function fetchLiveData() {
  if (!navigator.onLine) return;

  const [goldRes, fxRes] = await Promise.allSettled([
    api.fetchGold(),
    api.fetchFX(),
  ]);

  if (goldRes.status === 'fulfilled') {
    goldPrice = goldRes.value.price;
    goldUpdatedAt = goldRes.value.updatedAt || new Date().toISOString();
    priceSourceLabel = 'live';
    cache.saveGoldPrice(goldRes.value.price, goldRes.value.updatedAt);
    renderHeroCard();
  } else if (!goldPrice) {
    priceSourceLabel = 'cached/fallback';
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

  // Nav + footer
  const navCtrl = injectNav(lang, 0);
  navCtrl.getLangToggleButtons().forEach(btn => {
    btn.addEventListener('click', () => {
      lang = lang === 'en' ? 'ar' : 'en';
      saveLang(lang);
      updateNavLang(lang);
      updateTickerLang(lang);
      applyLangToPage();
    });
  });
  injectFooter(lang, 0);
  injectTicker(lang, 0);

  // Bind region tab filters
  document.querySelectorAll('.gcc-region-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      homeRegion = tab.dataset.region;
      document.querySelectorAll('.gcc-region-tab').forEach(t => {
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
  window.addEventListener('pagehide', () => {
    if (_refreshTimer) { clearInterval(_refreshTimer); _refreshTimer = null; }
  }, { once: true });

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
      if (updEl) updEl.textContent = 'Price unavailable — check connection';
      document.getElementById('hero-live-card')?.removeAttribute('aria-busy');
    }
    // GCC grid skeleton timeout
    document.querySelectorAll('.gcc-card.skeleton-card').forEach(card => {
      card.classList.remove('skeleton-card');
      card.textContent = '—';
    });
  }, SKELETON_TIMEOUT_MS);
}

document.addEventListener('DOMContentLoaded', init);

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
  banner.setAttribute('aria-label', 'Install app');
  banner.innerHTML = `
    <div class="pwa-banner-inner">
      <img src="${BASE_PATH}favicon.svg" width="32" height="32" alt="" aria-hidden="true" class="pwa-banner-icon" />
      <div class="pwa-banner-text">
        <strong>Add GoldPrices to your home screen</strong>
        <span>Live gold prices — works offline too</span>
      </div>
      <button class="pwa-banner-install btn btn-primary btn-sm" id="pwa-install-btn">Install</button>
      <button class="pwa-banner-dismiss" id="pwa-dismiss-btn" aria-label="Dismiss install prompt">✕</button>
    </div>
  `;

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

