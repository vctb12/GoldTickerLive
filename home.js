/**
 * Landing page entry point.
 * Fetches live gold + FX data in parallel, renders the hero live card
 * and GCC quick-price grid. Cache-first: shows cached data instantly.
 */
import { CONSTANTS, KARATS, COUNTRIES } from './config/index.js';
import * as api from './lib/api.js';
import * as cache from './lib/cache.js';
import * as calc from './lib/price-calculator.js';
import * as fmt from './lib/formatter.js';
import { injectNav, updateNavLang } from './components/nav.js';
import { injectFooter } from './components/footer.js';
import { injectTicker, updateTicker, updateTickerLang } from './components/ticker.js';

// ── State ──────────────────────────────────────────────────────────────────
const LANG_KEY = 'user_prefs';
let lang = 'en';
let goldPrice = null;
let dayOpenPrice = null;
let rates = {};
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
const T = {
  en: {
    heroLive: 'Live · Updated every 90s',
    heroTitle: 'Gold Prices Today',
    heroSub: 'UAE, GCC & Arab World',
    heroLead: 'Live spot-linked gold estimates across 24+ countries in 7 karats — in local currencies. Free, transparent, updated every 90 seconds.',
    heroCta1: 'View Live Tracker',
    heroCta2: 'UAE Gold Today',
    heroCta3: 'Calculator',
    heroCta4: 'Set Alert',
    heroCta5: 'Find Gold Shops',
    heroCta5Sub: '26 listings across UAE, Saudi Arabia, India & more — filterable by city and specialty.',
    spotTitle: 'Gold Spot Price',
    perOz: 'per troy ounce',
    lbl24aed: '24K / gram (AED)',
    lbl22usd: '22K / gram (USD)',
    lbl22aed: '22K / gram (AED)',
    lbl21usd: '21K / gram (USD)',
    fetching: 'Fetching...',
    updated: 'Updated',
    changeLabel: 'Today',
    marketOpen: '● Market Open',
    marketClosed: '○ Market Closed',
    gccTitle: 'GCC Gold Prices Now',
    gccSub: 'Live estimates in local currency · 22K per gram',
    buyingGuideTitle: 'How to Buy Gold',
    buyingGuideSub: 'Find shops, compare prices, and understand the market in your region',
    guideShopsTitle: 'Find Trusted Shops',
    guideShopsDesc: 'Browse listed gold shops and markets across countries. Filter by region, city, and specialty.',
    guideShopsCta: 'Explore Shops →',
    guideMarketsTitle: 'Browse by Market',
    guideMarketsDesc: 'View local gold prices, market context, and buying tips for each country.',
    guideMarketsCta: 'View Countries →',
    guideCalcTitle: 'Calculate & Compare',
    guideCalcDesc: 'Use our calculator to compare prices, values, and purchasing power across karats and currencies.',
    guideCalcCta: 'Open Calculator →',
    seeAll: 'See all countries →',
    perGram: 'per gram',
    gccLiveTitle: 'Live Gold Prices',
    gccLiveSub: '22K per gram in local currency · updated every 90 seconds',
    trustLive: 'Live spot data',
    trustLiveSub: 'Updated every 90s',
    trustCountries: '24+ countries',
    trustCountriesSub: 'GCC & Arab world',
    trustKarats: '7 karats',
    trustKaratsSub: '14K through 24K',
    trustAed: 'AED official peg',
    trustAedSub: '3.6725 · always exact',
    trustBilingual: 'Bilingual EN / AR',
    trustBilingualSub: 'Full RTL support',
    trustOffline: 'Works offline',
    trustOfflineSub: 'Cached price data',
    toolsTitle: 'Everything You Need',
    toolsSub: 'Built for buyers, investors and professionals across the Gulf & Arab world',
    alertTitle: 'Set a Price Alert',
    alertDesc: 'Get notified when gold crosses your target price. Free, stored locally — no account needed.',
    alertBtn: 'Set Alert',
    countriesTitle: 'Browse by Country',
    countriesSub: 'Dedicated pages with local context for every major market',
    faqTitle: 'Common Questions',
    whyTitle: 'Why This Tracker',
    why1t: 'GCC & Arab Focus', why1d: 'Built for Gulf buyers. AED uses the official UAE Central Bank peg (3.6725), not a fluctuating API rate. GCC, Levant, and African markets all covered.',
    why2t: 'Genuinely Live',   why2d: 'Gold spot price refreshes every 90 seconds via gold-api.com. FX rates update daily. Countdown shown. Cached locally so it works offline too.',
    why3t: 'Full Bilingual',   why3d: 'Every label, badge, unit, and country name is available in English and Arabic. Full RTL layout switch — not just a font change.',
    why4t: '7 Karats, 24+ Countries', why4d: 'From pure 24K investment gold to 14K jewelry. All 7 standard karats × 24+ countries = a complete price matrix in any unit.',
    countries: { UAE:'UAE', SA:'Saudi Arabia', KW:'Kuwait', QA:'Qatar', BH:'Bahrain', OM:'Oman', EG:'Egypt', JO:'Jordan', MA:'Morocco', IN:'India', more:'More countries →' },
    tools: {
      trackerT:'Live Tracker', trackerD:'Full price matrix — 24+ countries, 7 karats, per gram & per ounce. Refreshed every 90 seconds.', trackerC:'Open Tracker →',
      calcT:'Gold Calculator', calcD:'Gold value, scrap, Zakat, buying power and unit conversion — all in one tool.', calcC:'Open Calculator →',
      uaeT:'UAE Gold Prices', uaeD:'Dedicated UAE page with all karats in AED & USD, plus context for Dubai buyers.', uaeC:'UAE Prices →',
      learnT:'Learn & Glossary', learnD:'What is 22K? Why does spot differ from retail? How does the AED peg work?', learnC:'Read Guide →',
      insightsT:'Gold Insights', insightsD:'Market analysis, price drivers, and context for GCC gold buyers.', insightsC:'Read Insights →',
      methodT:'Methodology', methodD:'Full transparency on data sources, AED peg, karat math, and freshness logic.', methodC:'Read Methodology →',
    },
    history: {
      title: 'Historical Gold Prices',
      sub: 'Explore daily, monthly & annual data — download CSV, look up any date',
      feat1T: 'Price Chart', feat1D: '24H to 1Y range. Interactive chart built from local snapshots.',
      feat2T: 'Monthly Archive', feat2D: 'Browse gold prices month by month with trend context.',
      feat3T: 'Download CSV', feat3D: 'Export price data for any country or karat as a CSV file.',
      feat4T: 'Date Lookup', feat4D: 'Look up what gold was worth on any specific date.',
      feat1L: 'Open Chart →', feat2L: 'Browse Archive →', feat3L: 'Export Data →', feat4L: 'Look Up →',
    },
    faqMore: 'More questions answered on the Learn page →',
    insightsBannerTitle: 'Gold Market Insights',
    insightsBannerDesc: 'Analysis, guides, and market context for Gulf gold buyers',
    insightsBannerLink: 'Read Insights →',
    trackerLink: 'Full Tracker →',
  },
  ar: {
    heroLive: 'مباشر · تحديث كل 90 ثانية',
    heroTitle: 'أسعار الذهب اليوم',
    heroSub: 'الإمارات والخليج والعالم العربي',
    heroLead: 'تقديرات الذهب الفورية عبر 24+ دولة وبـ 7 عيارات — بالعملات المحلية. مجاني وشفاف ويتحدث كل 90 ثانية.',
    heroCta1: 'عرض التتبع المباشر',
    heroCta2: 'ذهب الإمارات اليوم',
    heroCta3: 'الحاسبة',
    heroCta4: 'اضبط تنبيهاً',
    heroCta5: 'ابحث عن محلات الذهب',
    heroCta5Sub: '26 إدراجاً في الإمارات والسعودية والهند وأكثر — مع إمكانية التصفية حسب المدينة والتخصص.',
    spotTitle: 'السعر الفوري للذهب',
    perOz: 'لكل أوقية تروي',
    lbl24aed: 'عيار 24 / غرام (AED)',
    lbl22usd: 'عيار 22 / غرام (USD)',
    lbl22aed: 'عيار 22 / غرام (AED)',
    lbl21usd: 'عيار 21 / غرام (USD)',
    fetching: 'جارٍ التحميل...',
    updated: 'آخر تحديث',
    changeLabel: 'اليوم',
    marketOpen: '● السوق مفتوح',
    marketClosed: '○ السوق مغلق',
    gccTitle: 'أسعار ذهب الخليج الآن',
    gccSub: 'تقديرات بالعملة المحلية · عيار 22 لكل غرام',
    buyingGuideTitle: 'كيف تشتري الذهب',
    buyingGuideSub: 'ابحث عن محلات موثوقة وقارن الأسعار وافهم السوق في منطقتك',
    guideShopsTitle: 'ابحث عن محلات موثوقة',
    guideShopsDesc: 'تصفح محلات الذهب والأسواق المدرجة في جميع الدول. صفّ حسب المنطقة والمدينة والتخصص.',
    guideShopsCta: 'استكشف المحلات ←',
    guideMarketsTitle: 'تصفح حسب السوق',
    guideMarketsDesc: 'اعرض أسعار الذهب المحلية والسياق السوقي والنصائح للشراء في كل دولة.',
    guideMarketsCta: 'عرض الدول ←',
    guideCalcTitle: 'احسب وقارن',
    guideCalcDesc: 'استخدم الحاسبة لمقارنة الأسعار والقيم والقوة الشرائية عبر العيارات والعملات.',
    guideCalcCta: 'افتح الحاسبة ←',
    seeAll: 'عرض كل الدول ←',
    perGram: 'لكل غرام',
    gccLiveTitle: 'أسعار الذهب المباشرة',
    gccLiveSub: 'عيار 22 لكل غرام بالعملة المحلية · تحديث كل 90 ثانية',
    trustLive: 'بيانات فورية مباشرة',
    trustLiveSub: 'تحديث كل 90 ثانية',
    trustCountries: '24+ دولة',
    trustCountriesSub: 'الخليج والعالم العربي',
    trustKarats: '7 عيارات',
    trustKaratsSub: 'من 14 إلى 24 عيارًا',
    trustAed: 'ربط رسمي للدرهم',
    trustAedSub: '3.6725 · دائمًا دقيق',
    trustBilingual: 'ثنائي اللغة عربي / إنجليزي',
    trustBilingualSub: 'دعم كامل لـ RTL',
    trustOffline: 'يعمل دون إنترنت',
    trustOfflineSub: 'بيانات مخزنة محليًا',
    toolsTitle: 'كل ما تحتاجه',
    toolsSub: 'صُمّم للمشترين والمستثمرين والمحترفين في منطقة الخليج والعالم العربي',
    alertTitle: 'اضبط تنبيه سعر',
    alertDesc: 'احصل على إشعار عندما يتجاوز الذهب السعر المستهدف. مجاني ومحلي — لا حساب مطلوب.',
    alertBtn: 'اضبط تنبيهاً',
    countriesTitle: 'تصفح حسب البلد',
    countriesSub: 'صفحات مخصصة بسياق محلي لكل سوق رئيسية',
    faqTitle: 'أسئلة شائعة',
    whyTitle: 'لماذا هذا المتتبع',
    why1t: 'تركيز على الخليج والعرب', why1d: 'مصمم لمشتري الخليج. يستخدم الدرهم الربط الرسمي للبنك المركزي الإماراتي (3.6725). تغطية شاملة لدول الخليج والشام وأفريقيا.',
    why2t: 'مباشر فعلًا', why2d: 'يتحدث السعر الفوري للذهب كل 90 ثانية. أسعار الصرف تتجدد يوميًا. يعمل دون اتصال بالإنترنت أيضًا.',
    why3t: 'ثنائي اللغة الكامل', why3d: 'كل تسمية وشارة ووحدة واسم بلد متاح بالعربية والإنجليزية. تبديل كامل للاتجاه RTL.',
    why4t: '7 عيارات، 24+ دولة', why4d: 'من ذهب الاستثمار 24 عيارًا إلى مجوهرات 14 عيارًا. جميع العيارات السبعة × 24+ دولة = مصفوفة أسعار كاملة.',
    countries: { UAE:'الإمارات', SA:'السعودية', KW:'الكويت', QA:'قطر', BH:'البحرين', OM:'عُمان', EG:'مصر', JO:'الأردن', MA:'المغرب', IN:'الهند', more:'المزيد من الدول ←' },
    tools: {
      trackerT:'تتبع مباشر', trackerD:'مصفوفة أسعار كاملة — 24+ دولة، 7 عيارات، لكل غرام وأوقية. يتجدد كل 90 ثانية.', trackerC:'افتح المتتبع ←',
      calcT:'حاسبة الذهب', calcD:'قيمة الذهب، الخردة، الزكاة، القوة الشرائية، وتحويل الوحدات — في أداة واحدة.', calcC:'افتح الحاسبة ←',
      uaeT:'أسعار الذهب في الإمارات', uaeD:'صفحة مخصصة للإمارات بجميع العيارات بالدرهم والدولار.', uaeC:'أسعار الإمارات ←',
      learnT:'تعلّم والمسرد', learnD:'ما هو عيار 22؟ لماذا يختلف السعر الفوري عن التجزئة؟ كيف يعمل ربط الدرهم؟', learnC:'اقرأ الدليل ←',
      insightsT:'رؤى الذهب', insightsD:'تحليل السوق ومحركات الأسعار وسياق لمشتري الذهب في الخليج.', insightsC:'اقرأ الرؤى ←',
      methodT:'المنهجية', methodD:'شفافية كاملة حول مصادر البيانات وربط الدرهم وحسابات العيار.', methodC:'اقرأ المنهجية ←',
    },
    history: {
      title: 'الأسعار التاريخية للذهب',
      sub: 'استكشف البيانات اليومية والشهرية والسنوية — حمّل CSV وابحث في أي تاريخ',
      feat1T: 'مخطط الأسعار', feat1D: 'نطاق من 24 ساعة إلى سنة. مخطط تفاعلي من لقطات محلية.',
      feat2T: 'أرشيف شهري', feat2D: 'تصفح أسعار الذهب شهرًا بشهر مع سياق الاتجاه.',
      feat3T: 'تحميل CSV', feat3D: 'صدّر بيانات الأسعار لأي دولة أو عيار كملف CSV.',
      feat4T: 'البحث بتاريخ', feat4D: 'ابحث عن سعر الذهب في أي تاريخ محدد.',
      feat1L: 'افتح المخطط ←', feat2L: 'تصفح الأرشيف ←', feat3L: 'تصدير البيانات ←', feat4L: 'ابحث ←',
    },
    faqMore: 'المزيد من الأسئلة المجاب عنها في صفحة التعلّم ←',
    insightsBannerTitle: 'رؤى سوق الذهب',
    insightsBannerDesc: 'تحليلات ومرشدات وسياق السوق لمشتري الذهب في الخليج',
    insightsBannerLink: 'قراءة الرؤى ←',
    trackerLink: 'التتبع الكامل ←',
  },
};

function tx(key) { return T[lang]?.[key] ?? T.en[key] ?? key; }

// ── Regional groupings for homepage display ────────────────────────────────
const GCC = COUNTRIES.filter(c => c.group === 'gcc');
const MENA = COUNTRIES.filter(c => ['gcc', 'levant', 'africa'].includes(c.group));
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
  set('hlc-updated', `${tx('updated')}: ${fmt.formatTimestampShort(new Date().toISOString(), lang)}`);

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

    // change badge from day open
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

  set('hero-live-label', tx('heroLive'));
  set('hero-title-main', tx('heroTitle'));
  set('hero-title-sub',  tx('heroSub'));
  set('hero-lead',       tx('heroLead'));
  set('hero-cta-tracker',  tx('heroCta1'));
  set('hero-cta-uae',      tx('heroCta2'));
  set('hero-cta-calc',     tx('heroCta3'));
  set('hero-cta-alert',    tx('heroCta4'));
  set('hero-cta-shops',    tx('heroCta5'));
  set('hero-cta-shops-sub', tx('heroCta5Sub'));
  set('hlc-tracker-link',  tx('trackerLink'));
  set('hlc-title',  tx('spotTitle'));
  set('hlc-sub',    tx('perOz'));
  set('hlc-label-aed24', tx('lbl24aed'));
  set('hlc-label-usd22', tx('lbl22usd'));
  set('hlc-label-aed22', tx('lbl22aed'));
  set('hlc-label-usd21', tx('lbl21usd'));
  set('hlc-updated', tx('fetching'));
  set('gcc-section-title', tx('gccLiveTitle'));
  set('gcc-section-sub',   tx('gccLiveSub'));
  set('gcc-see-all',       tx('seeAll'));
  set('buying-guide-title', tx('buyingGuideTitle'));
  set('buying-guide-sub',  tx('buyingGuideSub'));
  set('guide-shops-title', tx('guideShopsTitle'));
  set('guide-shops-desc',  tx('guideShopsDesc'));
  set('guide-shops-cta',   tx('guideShopsCta'));
  set('guide-markets-title', tx('guideMarketsTitle'));
  set('guide-markets-desc',  tx('guideMarketsDesc'));
  set('guide-markets-cta',   tx('guideMarketsCta'));
  set('guide-calc-title',  tx('guideCalcTitle'));
  set('guide-calc-desc',   tx('guideCalcDesc'));
  set('guide-calc-cta',    tx('guideCalcCta'));
  set('trust-live',            tx('trustLive'));
  set('trust-live-sub',        tx('trustLiveSub'));
  set('trust-countries',       tx('trustCountries'));
  set('trust-countries-sub',   tx('trustCountriesSub'));
  set('trust-karats',          tx('trustKarats'));
  set('trust-karats-sub',      tx('trustKaratsSub'));
  set('trust-aed',             tx('trustAed'));
  set('trust-aed-sub',         tx('trustAedSub'));
  set('trust-bilingual',       tx('trustBilingual'));
  set('trust-bilingual-sub',   tx('trustBilingualSub'));
  set('trust-offline',         tx('trustOffline'));
  set('trust-offline-sub',     tx('trustOfflineSub'));
  set('tools-title',      tx('toolsTitle'));
  set('tools-sub',        tx('toolsSub'));
  set('alert-cta-title',  tx('alertTitle'));
  set('alert-cta-desc',   tx('alertDesc'));
  set('alert-cta-btn',    tx('alertBtn'));
  set('countries-quick-title', tx('countriesTitle'));
  set('countries-quick-sub',   tx('countriesSub'));
  set('faq-more-link',    tx('faqMore'));
  set('why-title',        tx('whyTitle'));
  set('why1-title', tx('why1t')); set('why1-desc', tx('why1d'));
  set('why2-title', tx('why2t')); set('why2-desc', tx('why2d'));
  set('why3-title', tx('why3t')); set('why3-desc', tx('why3d'));
  set('why4-title', tx('why4t')); set('why4-desc', tx('why4d'));
  const cn = tx('countries');
  set('ct-uae', cn.UAE); set('ct-sa', cn.SA); set('ct-kw', cn.KW); set('ct-qa', cn.QA);
  set('ct-bh', cn.BH); set('ct-om', cn.OM); set('ct-eg', cn.EG); set('ct-jo', cn.JO);
  set('ct-ma', cn.MA); set('ct-in', cn.IN); set('ct-more', cn.more);
  const tl = tx('tools');
  set('tool-tracker-title',  tl.trackerT); set('tool-tracker-desc',  tl.trackerD); set('tool-tracker-cta',  tl.trackerC);
  set('tool-calc-title',     tl.calcT);    set('tool-calc-desc',     tl.calcD);    set('tool-calc-cta',     tl.calcC);
  set('tool-uae-title',      tl.uaeT);     set('tool-uae-desc',      tl.uaeD);     set('tool-uae-cta',      tl.uaeC);
  set('tool-learn-title',    tl.learnT);   set('tool-learn-desc',    tl.learnD);   set('tool-learn-cta',    tl.learnC);
  set('tool-insights-title', tl.insightsT); set('tool-insights-desc', tl.insightsD); set('tool-insights-cta', tl.insightsC);
  set('tool-method-title',   tl.methodT);   set('tool-method-desc',   tl.methodD);   set('tool-method-cta',   tl.methodC);

  // History section
  const ht = tx('history');
  if (ht) {
    set('history-section-title', ht.title);
    set('history-section-sub',   ht.sub);
    set('hist-feat-1-t', ht.feat1T); set('hist-feat-1-d', ht.feat1D); set('hist-feat-1-l', ht.feat1L);
    set('hist-feat-2-t', ht.feat2T); set('hist-feat-2-d', ht.feat2D); set('hist-feat-2-l', ht.feat2L);
    set('hist-feat-3-t', ht.feat3T); set('hist-feat-3-d', ht.feat3D); set('hist-feat-3-l', ht.feat3L);
    set('hist-feat-4-t', ht.feat4T); set('hist-feat-4-d', ht.feat4D); set('hist-feat-4-l', ht.feat4L);
  }

  // Insights banner
  set('insights-banner-title', tx('insightsBannerTitle'));
  set('insights-banner-desc',  tx('insightsBannerDesc'));
  set('insights-banner-link',  tx('insightsBannerLink'));

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
    cache.saveGoldPrice(goldRes.value.price, goldRes.value.updatedAt);
    renderHeroCard();
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

  // Apply language immediately
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
      document.querySelectorAll('.gcc-region-tab').forEach(t => t.classList.remove('is-active'));
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
  const STATE_STUB = {
    lang, goldPriceUsdPerOz: null, rates: {}, fxMeta: { nextUpdateUtc: 0 },
    status: {}, freshness: {}, favorites: [], history: [],
    selectedKaratSpotlight:'24', selectedKaratCountries:'24', selectedUnitTable:'gram',
    sortOrder:'high-low', searchQuery:'', activeTab:'gcc',
    prevGoldPriceUsdPerOz:null, dayOpenGoldPriceUsdPerOz:null,
    isOnline: navigator.onLine, volatility7d:null, cacheHealthScore:0,
  };
  cache.loadState(STATE_STUB);

  if (STATE_STUB.goldPriceUsdPerOz) {
    goldPrice = STATE_STUB.goldPriceUsdPerOz;
    dayOpenPrice = STATE_STUB.dayOpenGoldPriceUsdPerOz;
    rates = STATE_STUB.rates;
  }

  applyLangToPage();

  // Fetch live data in parallel
  await fetchLiveData();

  // Auto-refresh every 90 seconds
  if (_refreshTimer) clearInterval(_refreshTimer);
  _refreshTimer = setInterval(fetchLiveData, CONSTANTS.GOLD_REFRESH_MS);
}

document.addEventListener('DOMContentLoaded', init);

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/Gold-Prices/sw.js').catch(() => {});
}
