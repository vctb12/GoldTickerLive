/**
 * Insights page entry point.
 * Handles nav injection, language toggle, live mini price bar, and bilingual content.
 */

import * as cache from '../lib/cache.js';
import * as api from '../lib/api.js';
import { injectNav, updateNavLang } from '../components/nav.js';
import { injectFooter } from '../components/footer.js';
import { injectTicker, updateTickerLang } from '../components/ticker.js';
import { injectBreadcrumbs } from '../components/breadcrumbs.js';
import { CONSTANTS } from '../config/index.js';

const AED_PEG = CONSTANTS.AED_PEG; // 3.6725
const TROY_GRAMS = CONSTANTS.TROY_OZ_GRAMS; // 31.1035
const KARAT_22_PURITY = 22 / 24;

const STATE = {
  lang: 'en',
  goldPriceUsdPerOz: 0,
  rates: {},
  fxMeta: { nextUpdateUtc: 0 },
  status: { goldStale: false, fxStale: false },
  freshness: { goldUpdatedAt: null },
  favorites: [],
  history: [],
  activeTab: 'gcc',
  sortOrder: 'default',
  searchQuery: '',
  dayOpenGoldPriceUsdPerOz: 0,
  selectedKaratSpotlight: '22',
  selectedKaratCountries: '22',
  selectedUnitTable: 'gram',
};

// ─────────────────────────────────────────────────────────────────────────────
// BILINGUAL CONTENT
// ─────────────────────────────────────────────────────────────────────────────

const CONTENT = {
  en: {
    // Hero
    'hero-tag': 'Market Intelligence',
    'insights-h1': 'Gold Market Insights',
    'insights-sub': 'Analysis, price drivers and context for GCC gold buyers — updated weekly',

    // Price bar
    'price-bar-label': 'Live Gold Price',

    // Featured article
    'featured-tag-label': 'Featured Analysis',
    'featured-date': 'March 2026',
    'featured-read-time': '4 min read',

    // Insight grid heading
    'insights-grid-h2': 'Gold Market Guides',
    'insights-grid-sub': 'Essential reading for GCC gold buyers',

    // Stats
    'stats-title': 'Gold by the Numbers',
    'stats-sub': 'Key facts for MENA gold buyers',

    // Related tools
    'related-tools-title': 'Related Tools',
  },
  ar: {
    // Hero
    'hero-tag': 'ذكاء السوق',
    'insights-h1': 'رؤى سوق الذهب',
    'insights-sub': 'تحليلات ومحركات الأسعار وسياق السوق لمشتري الذهب في دول الخليج — تحديث أسبوعي',

    // Price bar
    'price-bar-label': 'سعر الذهب المباشر',

    // Featured article
    'featured-tag-label': 'تحليل مميز',
    'featured-date': 'مارس ٢٠٢٦',
    'featured-read-time': 'قراءة ٤ دقائق',

    // Insight grid heading
    'insights-grid-h2': 'أدلة سوق الذهب',
    'insights-grid-sub': 'قراءة أساسية لمشتري الذهب في الخليج',

    // Stats
    'stats-title': 'الذهب بالأرقام',
    'stats-sub': 'حقائق رئيسية لمشتري الذهب في منطقة الشرق الأوسط وشمال أفريقيا',

    // Related tools
    'related-tools-title': 'أدوات ذات صلة',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// LANGUAGE
// ─────────────────────────────────────────────────────────────────────────────

function applyLang(lang) {
  const content = CONTENT[lang] ?? CONTENT.en;
  Object.entries(content).forEach(([id, text]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  });
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
}

// ─────────────────────────────────────────────────────────────────────────────
// PRICE BAR
// ─────────────────────────────────────────────────────────────────────────────

function formatUsd(price) {
  return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function calcAed22kPerGram(usdPerOz) {
  return (usdPerOz / TROY_GRAMS) * KARAT_22_PURITY * AED_PEG;
}

function updatePriceBar(priceUsd, stale) {
  const valEl = document.getElementById('price-bar-value');
  const aedEl = document.getElementById('price-bar-aed');
  const freshEl = document.getElementById('price-bar-freshness');

  if (!valEl) return;

  if (priceUsd > 0) {
    valEl.textContent = formatUsd(priceUsd);
    valEl.classList.toggle('price-bar-stale', !!stale);

    const aed22 = calcAed22kPerGram(priceUsd);
    if (aedEl)
      aedEl.textContent = aed22.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
  }

  if (freshEl) {
    if (stale) {
      freshEl.textContent = STATE.lang === 'ar' ? 'بيانات قديمة' : 'Stale data';
      freshEl.classList.add('price-bar-stale');
    } else {
      const now = new Date();
      const hhmm = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      freshEl.textContent = (STATE.lang === 'ar' ? 'تحديث ' : 'Updated ') + hhmm;
      freshEl.classList.remove('price-bar-stale');
    }
  }
}

async function fetchAndUpdatePriceBar() {
  try {
    const data = await api.fetchGold();
    STATE.goldPriceUsdPerOz = data.price;
    STATE.status.goldStale = false;
    cache.saveGoldPrice(data.price, data.updatedAt);
    updatePriceBar(data.price, false);
  } catch {
    STATE.status.goldStale = true;
    if (STATE.goldPriceUsdPerOz > 0) {
      updatePriceBar(STATE.goldPriceUsdPerOz, true);
    } else {
      const freshEl = document.getElementById('price-bar-freshness');
      if (freshEl) freshEl.textContent = STATE.lang === 'ar' ? 'غير متاح' : 'Unavailable';
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────────────────

async function init() {
  cache.loadState(STATE);

  const urlLang = new URLSearchParams(location.search).get('lang');
  if (urlLang === 'ar' || urlLang === 'en') STATE.lang = urlLang;

  document.documentElement.lang = STATE.lang;
  document.documentElement.dir = STATE.lang === 'ar' ? 'rtl' : 'ltr';

  const navResult = injectNav(STATE.lang, 0);
  injectBreadcrumbs('insights');
  injectFooter(STATE.lang, 0);
  injectTicker(STATE.lang, 0);

  navResult.getLangToggleButtons().forEach((btn) => {
    btn.addEventListener('click', () => {
      STATE.lang = STATE.lang === 'en' ? 'ar' : 'en';
      cache.savePreference('lang', STATE.lang);
      updateNavLang(STATE.lang);
      updateTickerLang(STATE.lang);
      applyLang(STATE.lang);
      // Refresh freshness label in new language
      if (STATE.goldPriceUsdPerOz > 0) {
        updatePriceBar(STATE.goldPriceUsdPerOz, STATE.status.goldStale);
      }
    });
  });

  applyLang(STATE.lang);

  // Show cached price immediately, then fetch fresh
  if (STATE.goldPriceUsdPerOz > 0) {
    updatePriceBar(STATE.goldPriceUsdPerOz, STATE.status.goldStale);
  }

  // Fetch fresh price
  await fetchAndUpdatePriceBar();

  // Refresh every 90 seconds while page is open
  setInterval(fetchAndUpdatePriceBar, CONSTANTS.GOLD_REFRESH_MS);
}

init();
