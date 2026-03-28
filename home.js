/**
 * Landing page entry point.
 * Fetches live gold + FX data, renders the hero live card and GCC quick-price grid.
 */
import { CONSTANTS, KARATS, COUNTRIES } from './config/index.js';
import * as api from './lib/api.js';
import * as cache from './lib/cache.js';
import * as calc from './lib/price-calculator.js';
import * as fmt from './lib/formatter.js';
import { injectNav, updateNavLang } from './components/nav.js';
import { injectFooter } from './components/footer.js';

// ── State ──────────────────────────────────────────────────────────────────
const LANG_KEY = 'user_prefs';
let lang = 'en';

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

// ── Translations (home-specific strings) ──────────────────────────────────
const T = {
  en: {
    heroLive: 'Live · Updated every 90s',
    heroTitle: 'Gold Prices Today',
    heroSub: 'UAE, GCC & Arab World',
    heroLead: 'Live spot-linked gold estimates across 24 countries in 7 karats — from 24K pure to 14K — in local currencies. Free, transparent, updated every 90 seconds.',
    heroCta1: 'View Live Tracker',
    heroCta2: 'UAE Gold Today',
    heroCta3: 'Calculator',
    spotTitle: 'Gold Spot Price',
    perOz: 'per troy ounce',
    lbl24aed: '24K / gram (AED)',
    lbl22usd: '22K / gram (USD)',
    lbl22aed: '22K / gram (AED)',
    lbl21usd: '21K / gram (USD)',
    fetching: 'Fetching...',
    updated: 'Updated',
    gccTitle: 'GCC Gold Prices Now',
    gccSub: 'Live estimates in local currency · 22K per gram',
    seeAll: 'See all countries →',
    perGram: 'per gram',
    trustLive: 'Live spot data',
    trustCountries: '24 countries',
    trustKarats: '7 karats (14K–24K)',
    trustAed: 'AED official peg',
    trustBilingual: 'Bilingual EN / AR',
    trustRefresh: '90s refresh',
    toolsTitle: 'Everything You Need',
    toolsSub: 'Built for buyers, investors and professionals across the Gulf & Arab world',
    alertTitle: 'Set a Price Alert',
    alertDesc: 'Get notified when UAE 24K crosses your target price. Free, stored locally — no account needed.',
    alertBtn: 'Set Alert',
    countriesTitle: 'Browse by Country',
    countriesSub: 'Dedicated pages with local context for every major market',
    faqTitle: 'Common Questions',
    whyTitle: 'Why This Tracker',
    why1t: 'GCC & Arab Focus', why1d: 'Built for Gulf buyers. AED uses the official UAE Central Bank peg (3.6725), not a fluctuating API rate. GCC, Levant, and African markets all covered.',
    why2t: 'Genuinely Live',   why2d: 'Gold spot price refreshes every 90 seconds via gold-api.com. FX rates update daily. Cached locally so it works offline too.',
    why3t: 'Full Bilingual',   why3d: 'Every label, badge, unit, and country name is available in English and Arabic. Full RTL layout switch — not just a font change.',
    why4t: '7 Karats, 24 Countries', why4d: 'From pure 24K investment gold to 14K jewelry. All 7 standard karats × 24 countries = a complete price matrix in any unit.',
    countries: { UAE:'UAE', SA:'Saudi Arabia', KW:'Kuwait', QA:'Qatar', BH:'Bahrain', OM:'Oman', EG:'Egypt', JO:'Jordan', MA:'Morocco', IN:'India', more:'14 more' },
    tools: {
      trackerT:'Live Tracker', trackerD:'Full price matrix — 24 countries, 7 karats, per gram & per ounce. Refreshed every 90 seconds.', trackerC:'Open Tracker →',
      calcT:'Gold Calculator', calcD:'Calculate value by weight, karat and currency. Scrap gold, jewelry value, buying power and more.', calcC:'Open Calculator →',
      uaeT:'UAE Gold Prices', uaeD:'Dedicated UAE page with all karats in AED & USD, plus context for Dubai buyers.', uaeC:'UAE Prices →',
      learnT:'Learn & Glossary', learnD:'What is 22K? Why does spot differ from retail? How does the AED peg work? Clear, honest answers.', learnC:'Read Guide →',
    },
    faqMore: 'More questions answered on the Learn page →',
  },
  ar: {
    heroLive: 'مباشر · تحديث كل 90 ثانية',
    heroTitle: 'أسعار الذهب اليوم',
    heroSub: 'الإمارات والخليج والعالم العربي',
    heroLead: 'تقديرات الذهب الفورية عبر 24 دولة وبـ 7 عيارات — من عيار 24 الخالص إلى 14 — بالعملات المحلية. مجاني وشفاف ويتحدث كل 90 ثانية.',
    heroCta1: 'عرض التتبع المباشر',
    heroCta2: 'ذهب الإمارات اليوم',
    heroCta3: 'الحاسبة',
    spotTitle: 'السعر الفوري للذهب',
    perOz: 'لكل أوقية تروي',
    lbl24aed: 'عيار 24 / غرام (AED)',
    lbl22usd: 'عيار 22 / غرام (USD)',
    lbl22aed: 'عيار 22 / غرام (AED)',
    lbl21usd: 'عيار 21 / غرام (USD)',
    fetching: 'جارٍ التحميل...',
    updated: 'آخر تحديث',
    gccTitle: 'أسعار ذهب الخليج الآن',
    gccSub: 'تقديرات بالعملة المحلية · عيار 22 لكل غرام',
    seeAll: 'عرض كل الدول ←',
    perGram: 'لكل غرام',
    trustLive: 'بيانات فورية مباشرة',
    trustCountries: '24 دولة',
    trustKarats: '7 عيارات (14–24)',
    trustAed: 'ربط رسمي للدرهم',
    trustBilingual: 'ثنائي اللغة عربي / إنجليزي',
    trustRefresh: 'تحديث كل 90 ثانية',
    toolsTitle: 'كل ما تحتاجه',
    toolsSub: 'صُمّم للمشترين والمستثمرين والمحترفين في منطقة الخليج والعالم العربي',
    alertTitle: 'اضبط تنبيه سعر',
    alertDesc: 'احصل على إشعار عندما يتجاوز ذهب الإمارات عيار 24 السعر المستهدف. مجاني ومحلي — لا حساب مطلوب.',
    alertBtn: 'اضبط تنبيهاً',
    countriesTitle: 'تصفح حسب البلد',
    countriesSub: 'صفحات مخصصة بسياق محلي لكل سوق رئيسية',
    faqTitle: 'أسئلة شائعة',
    whyTitle: 'لماذا هذا المتتبع',
    why1t: 'تركيز على الخليج والعرب', why1d: 'مصمم لمشتري الخليج. يستخدم الدرهم الربط الرسمي للبنك المركزي الإماراتي (3.6725)، وليس سعرًا متغيرًا. تغطية شاملة لدول الخليج والشام وأفريقيا.',
    why2t: 'مباشر فعلًا', why2d: 'يتحدث السعر الفوري للذهب كل 90 ثانية عبر gold-api.com. أسعار الصرف تتجدد يوميًا. يعمل دون اتصال بالإنترنت أيضًا.',
    why3t: 'ثنائي اللغة الكامل', why3d: 'كل تسمية وشارة ووحدة واسم بلد متاح بالعربية والإنجليزية. تبديل كامل للاتجاه RTL.',
    why4t: '7 عيارات، 24 دولة', why4d: 'من ذهب الاستثمار 24 عيارًا إلى مجوهرات 14 عيارًا. جميع العيارات السبعة × 24 دولة = مصفوفة أسعار كاملة.',
    countries: { UAE:'الإمارات', SA:'السعودية', KW:'الكويت', QA:'قطر', BH:'البحرين', OM:'عُمان', EG:'مصر', JO:'الأردن', MA:'المغرب', IN:'الهند', more:'14 أخرى' },
    tools: {
      trackerT:'تتبع مباشر', trackerD:'مصفوفة أسعار كاملة — 24 دولة، 7 عيارات، لكل غرام وأوقية. يتجدد كل 90 ثانية.', trackerC:'افتح المتتبع ←',
      calcT:'حاسبة الذهب', calcD:'احسب القيمة حسب الوزن والعيار والعملة. ذهب خردة وقيمة مجوهرات وقوة شراء والمزيد.', calcC:'افتح الحاسبة ←',
      uaeT:'أسعار الذهب في الإمارات', uaeD:'صفحة مخصصة للإمارات بجميع العيارات بالدرهم والدولار مع سياق لمشتري دبي.', uaeC:'أسعار الإمارات ←',
      learnT:'تعلّم والمسرد', learnD:'ما هو عيار 22؟ لماذا يختلف السعر الفوري عن التجزئة؟ كيف يعمل ربط الدرهم؟ إجابات واضحة وأمينة.', learnC:'اقرأ الدليل ←',
    },
    faqMore: 'المزيد من الأسئلة المجاب عنها في صفحة التعلّم ←',
  },
};

function tx(key) { return T[lang]?.[key] ?? T.en[key] ?? key; }

// ── GCC countries ──────────────────────────────────────────────────────────
const GCC = COUNTRIES.filter(c => c.group === 'gcc');

// ── Prices ────────────────────────────────────────────────────────────────
let goldPrice = null;
let rates = {};

// ── Render helpers ─────────────────────────────────────────────────────────
function set(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}
function setHtml(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function renderHeroCard() {
  if (!goldPrice) return;
  const k24 = KARATS.find(k => k.code === '24');
  const k22 = KARATS.find(k => k.code === '22');
  const k21 = KARATS.find(k => k.code === '21');

  const usd24oz = goldPrice; // 24K = spot
  const aed24g  = calc.usdPerGram(goldPrice, k24.purity) * CONSTANTS.AED_PEG;
  const usd22g  = calc.usdPerGram(goldPrice, k22.purity);
  const aed22g  = usd22g * CONSTANTS.AED_PEG;
  const usd21g  = calc.usdPerGram(goldPrice, k21.purity);

  set('hlc-price', fmt.formatPrice(usd24oz, 'USD', 2));
  set('hlc-aed24',  fmt.formatPrice(aed24g,  'AED', 2));
  set('hlc-usd22',  fmt.formatPrice(usd22g,  'USD', 2));
  set('hlc-aed22',  fmt.formatPrice(aed22g,  'AED', 2));
  set('hlc-usd21',  fmt.formatPrice(usd21g,  'USD', 2));
  set('hlc-updated', `${tx('updated')}: ${fmt.formatTimestampShort(new Date().toISOString(), lang)}`);
}

function renderGCCGrid() {
  const grid = document.getElementById('gcc-quick-grid');
  if (!grid || !goldPrice) return;
  const k22 = KARATS.find(k => k.code === '22');

  grid.innerHTML = GCC.map(c => {
    let price = '—';
    if (c.currency === 'AED') {
      price = fmt.formatPrice(calc.usdPerGram(goldPrice, k22.purity) * CONSTANTS.AED_PEG, 'AED', 2);
    } else if (rates[c.currency]) {
      price = fmt.formatPrice(calc.usdPerGram(goldPrice, k22.purity) * rates[c.currency], c.currency, c.decimals);
    }
    const name = lang === 'ar' ? c.nameAr : c.nameEn;
    const slug = c.code === 'AE' ? 'uae' : c.code === 'SA' ? 'saudi-arabia' : c.code === 'KW' ? 'kuwait' :
                 c.code === 'QA' ? 'qatar' : c.code === 'BH' ? 'bahrain' : 'oman';
    return `<a href="countries/${slug}.html" class="gcc-card">
      <div class="gcc-card-header">
        <span class="gcc-flag" aria-hidden="true">${c.flag}</span>
        <div class="gcc-meta">
          <span class="gcc-name">${name}</span>
          <span class="gcc-currency">${c.currency}</span>
        </div>
      </div>
      <div class="gcc-price">${price}</div>
      <div class="gcc-unit">${tx('perGram')} · 22K</div>
    </a>`;
  }).join('');
}

function applyLangToPage() {
  const isAr = lang === 'ar';
  document.documentElement.lang = lang;
  document.documentElement.dir = isAr ? 'rtl' : 'ltr';

  set('hero-live-label', tx('heroLive'));
  set('hero-title-main', tx('heroTitle'));
  set('hero-title-sub',  tx('heroSub'));
  set('hero-lead',       tx('heroLead'));
  set('hero-cta-tracker', tx('heroCta1'));
  set('hero-cta-uae',     tx('heroCta2'));
  set('hero-cta-calc',    tx('heroCta3'));
  set('hlc-title',  tx('spotTitle'));
  set('hlc-sub',    tx('perOz'));
  set('hlc-label-aed24', tx('lbl24aed'));
  set('hlc-label-usd22', tx('lbl22usd'));
  set('hlc-label-aed22', tx('lbl22aed'));
  set('hlc-label-usd21', tx('lbl21usd'));
  set('hlc-updated', tx('fetching'));
  set('gcc-section-title', tx('gccTitle'));
  set('gcc-section-sub',   tx('gccSub'));
  set('gcc-see-all',       tx('seeAll'));
  set('trust-live',       tx('trustLive'));
  set('trust-countries',  tx('trustCountries'));
  set('trust-karats',     tx('trustKarats'));
  set('trust-aed',        tx('trustAed'));
  set('trust-bilingual',  tx('trustBilingual'));
  set('trust-refresh',    tx('trustRefresh'));
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
  set('tool-tracker-title', tl.trackerT); set('tool-tracker-desc', tl.trackerD); set('tool-tracker-cta', tl.trackerC);
  set('tool-calc-title',    tl.calcT);    set('tool-calc-desc',    tl.calcD);    set('tool-calc-cta',    tl.calcC);
  set('tool-uae-title',     tl.uaeT);     set('tool-uae-desc',     tl.uaeD);     set('tool-uae-cta',     tl.uaeC);
  set('tool-learn-title',   tl.learnT);   set('tool-learn-desc',   tl.learnD);   set('tool-learn-cta',   tl.learnC);

  renderHeroCard();
  renderGCCGrid();
}

// ── Init ───────────────────────────────────────────────────────────────────
async function init() {
  lang = getLang();

  // Nav + footer
  const navCtrl = injectNav(lang, 0);
  navCtrl.getLangToggleButtons().forEach(btn => {
    btn.addEventListener('click', () => {
      lang = lang === 'en' ? 'ar' : 'en';
      saveLang(lang);
      updateNavLang(lang);
      applyLangToPage();
    });
  });
  injectFooter(lang, 0);

  applyLangToPage();

  // Try loading from cache first for instant render
  const STATE_STUB = { lang, goldPriceUsdPerOz: null, rates: {}, fxMeta: { nextUpdateUtc: 0 }, status: {}, freshness: {}, favorites: [], history: [], selectedKaratSpotlight:'24', selectedKaratCountries:'24', selectedUnitTable:'gram', sortOrder:'high-low', searchQuery:'', activeTab:'gcc', prevGoldPriceUsdPerOz:null, dayOpenGoldPriceUsdPerOz:null, isOnline: navigator.onLine, volatility7d:null, cacheHealthScore:0 };
  cache.loadState(STATE_STUB);
  if (STATE_STUB.goldPriceUsdPerOz) {
    goldPrice = STATE_STUB.goldPriceUsdPerOz;
    rates = STATE_STUB.rates;
    renderHeroCard();
    renderGCCGrid();
  }

  // Fetch live
  if (navigator.onLine) {
    try {
      const data = await api.fetchGold();
      goldPrice = data.price;
      renderHeroCard();
    } catch {}
    try {
      const fx = await api.fetchFX();
      rates = fx.rates;
      renderGCCGrid();
    } catch {}
  }
}

document.addEventListener('DOMContentLoaded', init);
