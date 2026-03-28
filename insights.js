/**
 * Insights page entry point.
 * Handles nav injection, language toggle, live mini price bar, and bilingual content.
 */

import * as cache from './lib/cache.js';
import * as api from './lib/api.js';
import { injectNav, updateNavLang } from './components/nav.js';
import { injectFooter } from './components/footer.js';
import { CONSTANTS } from './config/index.js';

const AED_PEG      = CONSTANTS.AED_PEG;       // 3.6725
const TROY_GRAMS   = CONSTANTS.TROY_OZ_GRAMS; // 31.1035
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
    'hero-tag':               'Market Analysis & Buying Guides',
    'insights-h1':            'Gold Insights & Analysis',
    'insights-sub':           'Expert commentary, buying guides, and market context for UAE & GCC gold buyers',

    // Price bar
    'price-bar-label':        'Live Gold Price',

    // Featured article
    'featured-tag-label':     'Featured Article',
    'featured-date':          'March 10, 2026',
    'featured-read-time':     '5 min read',

    // Insight grid heading
    'insights-grid-h2':       'Latest Insights',

    // Read-more links
    'read-more-1':            'Read more →',
    'read-more-2':            'Read more →',
    'read-more-3':            'Read more →',
    'read-more-4':            'Read more →',
    'read-more-5':            'Read more →',
    'read-more-6':            'Read more →',

    // Weekly brief
    'weekly-brief-label':     'This Week in Gold',
    'weekly-brief-date':      'Week of March 24, 2026',
    'weekly-brief-disclaimer':'Based on global market trends at time of writing. Not financial advice.',

    // Guides
    'guides-h2':              'Essential Guides',
    'guide-title-1':          'Gold Karats Explained',
    'guide-desc-1':           '24K, 22K, 21K, 18K — what the numbers mean and which karat is right for your purchase.',
    'guide-title-2':          'How the AED Peg Protects Your Gold Value',
    'guide-desc-2':           'Why the UAE Dirham\'s fixed peg to the USD eliminates currency risk for local gold buyers.',
    'guide-title-3':          'Zakat Calculation Guide',
    'guide-desc-3':           'Step-by-step guide to calculating Zakat on your gold holdings using today\'s live price.',
    'guide-title-4':          'Understanding Gold Hallmarks',
    'guide-desc-4':           'How to read UAE, BIS, and UK hallmarks — and why you should always check before buying.',
  },
  ar: {
    // Hero
    'hero-tag':               'تحليل السوق وأدلة الشراء',
    'insights-h1':            'رؤى وتحليلات الذهب',
    'insights-sub':           'تعليقات متخصصة وأدلة شراء وسياق السوق لمشتري الذهب في الإمارات والخليج',

    // Price bar
    'price-bar-label':        'سعر الذهب المباشر',

    // Featured article
    'featured-tag-label':     'المقال المميز',
    'featured-date':          '١٠ مارس ٢٠٢٦',
    'featured-read-time':     'قراءة ٥ دقائق',

    // Insight grid heading
    'insights-grid-h2':       'أحدث الرؤى',

    // Read-more links
    'read-more-1':            'اقرأ المزيد →',
    'read-more-2':            'اقرأ المزيد →',
    'read-more-3':            'اقرأ المزيد →',
    'read-more-4':            'اقرأ المزيد →',
    'read-more-5':            'اقرأ المزيد →',
    'read-more-6':            'اقرأ المزيد →',

    // Weekly brief
    'weekly-brief-label':     'هذا الأسبوع في عالم الذهب',
    'weekly-brief-date':      'أسبوع ٢٤ مارس ٢٠٢٦',
    'weekly-brief-disclaimer':'استناداً إلى اتجاهات السوق العالمية وقت الكتابة. ليست نصيحة مالية.',

    // Guides
    'guides-h2':              'الأدلة الأساسية',
    'guide-title-1':          'شرح عيارات الذهب',
    'guide-desc-1':           '٢٤ قيراط، ٢٢، ٢١، ١٨ — ما تعنيه الأرقام وأي عيار يناسب مشترياتك.',
    'guide-title-2':          'كيف يحمي ربط الدرهم قيمة ذهبك',
    'guide-desc-2':           'لماذا يُلغي الربط الثابت للدرهم بالدولار مخاطر الصرف لمشتري الذهب المحليين.',
    'guide-title-3':          'دليل حساب الزكاة',
    'guide-desc-3':           'دليل خطوة بخطوة لحساب زكاة محفظتك الذهبية بناءً على السعر المباشر اليوم.',
    'guide-title-4':          'فهم دمغة الذهب',
    'guide-desc-4':           'كيف تقرأ دمغات الإمارات وBIS والمملكة المتحدة — ولماذا يجب التحقق دائماً قبل الشراء.',
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
  document.documentElement.dir  = lang === 'ar' ? 'rtl' : 'ltr';
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
  const valEl   = document.getElementById('price-bar-value');
  const aedEl   = document.getElementById('price-bar-aed');
  const freshEl = document.getElementById('price-bar-freshness');

  if (!valEl) return;

  if (priceUsd > 0) {
    valEl.textContent = formatUsd(priceUsd);
    valEl.classList.toggle('price-bar-stale', !!stale);

    const aed22 = calcAed22kPerGram(priceUsd);
    if (aedEl) aedEl.textContent = aed22.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
  document.documentElement.dir  = STATE.lang === 'ar' ? 'rtl' : 'ltr';

  const navResult = injectNav(STATE.lang, 0);
  injectFooter(STATE.lang, 0);

  navResult.getLangToggleButtons().forEach(btn => {
    btn.addEventListener('click', () => {
      STATE.lang = STATE.lang === 'en' ? 'ar' : 'en';
      cache.savePreference('lang', STATE.lang);
      updateNavLang(STATE.lang);
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
