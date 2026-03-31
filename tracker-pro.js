import { CONSTANTS, KARATS, COUNTRIES } from './config/index.js';
import * as api from './lib/api.js';
import * as cache from './lib/cache.js';
import * as calc from './lib/price-calculator.js';
import * as fmt from './lib/formatter.js';
import { injectNav, updateNavLang } from './components/nav.js';
import { injectFooter } from './components/footer.js';
import { injectTicker, updateTicker, updateTickerLang } from './components/ticker.js';

const STORAGE = {
  state: 'tracker_pro_state_v4',
  alerts: 'tracker_pro_alerts_v4',
  presets: 'tracker_pro_presets_v4',
  favorites: 'tracker_pro_favorites_v4',
  snapshots: 'tracker_pro_snapshots_v4',
  wire: 'tracker_pro_wire_v4',
};

const HISTORY_ENDPOINTS = {
  daily: 'https://freegoldapi.com/data/latest.json',
  monthlyCsv: 'https://datahub.io/core/gold-prices/_r/-/data/monthly-processed.csv',
};

const WIRE = {
  query: '(gold OR bullion OR "gold price" OR "gold prices" OR XAU OR "precious metals")',
  timespan: '24h',
  maxrecords: 18,
};

const LANG = {
  en: {
    heroTitle: 'Gold Tracker Pro',
    heroCopy: 'A full tracker workspace built to live inside your site shell: live spot, Gulf pricing, market wire, archive lookup, alerts, exports, planners, and a stronger compare experience.',
    liveFeedActive: 'Live feed active',
    liveFeedCached: 'Using cached data',
    liveFeedError: 'Live feed unavailable',
    liveBadge: 'Updated',
    marketOpen: 'Gold market open',
    marketClosed: 'Gold market closed',
    autoOn: 'Auto refresh: on',
    autoOff: 'Auto refresh: off',
    selectedView: 'Selected view',
    spotOnly: 'Spot only',
    compareView: 'Compare market',
    loadingWire: 'Loading live market headlines…',
    noWire: 'No recent wire headlines available.',
    selectedSeries: 'Selected series',
    compareSeries: 'Compare market',
    range: 'Range',
    change: 'Change',
    points: 'Visible points',
    dataLogic: 'Data logic',
    current: 'Current',
    high: 'High',
    low: 'Low',
    volatility: 'Volatility',
    chartTitle: 'Live chart workspace',
    watchlistTitle: 'Market watchlist',
    favoritesOnly: 'Favorites only',
    wireHeadlines: 'Wire headlines',
    notificationsGranted: 'Browser notifications enabled.',
    notificationsDenied: 'Notifications were denied.',
    saveAlert: 'Save alert',
    alertSaved: 'Alert saved',
    invalidAlert: 'Enter a valid alert target.',
    savePreset: 'Save current setup',
    presetSaved: 'Preset saved',
    invalidPreset: 'Enter a preset name first.',
    resetDone: 'Tracker view reset to defaults.',
    summaryCopied: 'Quick brief copied to clipboard.',
    shareCopied: 'Shareable tracker URL copied.',
    exportReady: 'Export ready',
    exportChart: 'Visible chart CSV generated.',
    exportArchive: 'Visible archive CSV generated.',
    exportHistory: 'Full history CSV generated.',
    exportWatchlist: 'Watchlist CSV generated.',
    exportBrief: 'Market brief downloaded.',
    historyFallback: 'History fallback loaded',
    historyFallbackBody: 'Long-range history is using the monthly fallback dataset.',
    budgetTitle: 'Budget planner',
    positionTitle: 'Position tracker',
    jewelryTitle: 'Jewelry ticket estimate',
    marketBriefTitle: 'Market brief',
    noPresets: 'No presets saved yet.',
    noAlerts: 'No alerts saved yet.',
    noWatchlist: 'Favorite markets will appear here.',
    noMarkets: 'No markets match the current filter.',
    noArchive: 'No archive rows match the current filter.',
    lookupPrompt: 'Pick a date to begin.',
    loading: 'Loading…',
    closestPoint: 'Closest point',
    lastUpdated: 'Last refresh',
    localSnapshots: 'Local snapshots',
    favorites: 'Favorites',
    liveDeskSummary: 'Live desk summary',
    marketWire: 'Market wire',
    decisionCues: 'Decision cues',
    rangePlayback: 'Range playback',
    visibleNotes: 'Visible range notes',
    liveLayer: 'Live spot source',
    fxLayer: 'FX source',
    histLayer: 'History source',
    source: 'Source',
    target: 'Target',
    scope: 'Scope',
    condition: 'Condition',
    remove: 'Remove',
    load: 'Load',
    favorite: 'Favorite',
    unfavorite: 'Unfavorite',
    details: 'Open country page',
    snapshotJson: 'Snapshot JSON downloaded.',
    spotPerOz: 'Spot XAU/USD',
    uae24: 'UAE 24K / g',
    selectedPrice: 'Selected price',
    lookupDate: 'Matched date',
    matchedPrice: 'Selected price then',
    lookupContext: 'Context',
    layerLive: 'Live cache',
    layerAnchor: 'Live anchor',
    layerMonthly: 'Monthly baseline',
    layerSynthetic: 'Synthetic fallback',
    keyboardHint1: 'R refreshes live data',
    keyboardHint2: 'C copies the quick brief',
    keyboardHint3: 'A jumps to alerts',
    keyboardHint4: 'H jumps to chart',
  },
  ar: {
    heroTitle: 'متتبع الذهب برو',
    heroCopy: 'مساحة عمل كاملة للذهب داخل هيكل موقعك: السعر الفوري، أسعار الخليج، شريط الأخبار، الأرشيف، التنبيهات، التصدير، والحاسبات.',
    liveFeedActive: 'البيانات المباشرة نشطة',
    liveFeedCached: 'يتم استخدام البيانات المخزنة',
    liveFeedError: 'تعذر تحميل البيانات المباشرة',
    liveBadge: 'آخر تحديث',
    marketOpen: 'سوق الذهب مفتوح',
    marketClosed: 'سوق الذهب مغلق',
    autoOn: 'التحديث التلقائي: يعمل',
    autoOff: 'التحديث التلقائي: متوقف',
    selectedView: 'العرض المحدد',
    spotOnly: 'السعر الفوري فقط',
    compareView: 'سوق المقارنة',
    loadingWire: 'جارٍ تحميل عناوين السوق…',
    noWire: 'لا توجد عناوين حديثة متاحة الآن.',
    selectedSeries: 'السلسلة المحددة',
    compareSeries: 'سوق المقارنة',
    range: 'النطاق',
    change: 'التغير',
    points: 'النقاط الظاهرة',
    dataLogic: 'منطق البيانات',
    current: 'الحالي',
    high: 'الأعلى',
    low: 'الأدنى',
    volatility: 'التذبذب',
    chartTitle: 'مساحة الرسم الحي',
    watchlistTitle: 'قائمة المتابعة',
    favoritesOnly: 'المفضلة فقط',
    wireHeadlines: 'شريط الأخبار',
    notificationsGranted: 'تم تفعيل إشعارات المتصفح.',
    notificationsDenied: 'تم رفض إشعارات المتصفح.',
    saveAlert: 'حفظ التنبيه',
    alertSaved: 'تم حفظ التنبيه',
    invalidAlert: 'أدخل رقماً صحيحاً للتنبيه.',
    savePreset: 'حفظ الإعداد الحالي',
    presetSaved: 'تم حفظ الإعداد',
    invalidPreset: 'أدخل اسم الإعداد أولاً.',
    resetDone: 'تمت إعادة ضبط المتتبع.',
    summaryCopied: 'تم نسخ الملخص السريع.',
    shareCopied: 'تم نسخ رابط المتتبع.',
    exportReady: 'الملف جاهز',
    exportChart: 'تم إنشاء CSV للرسم الظاهر.',
    exportArchive: 'تم إنشاء CSV للأرشيف الظاهر.',
    exportHistory: 'تم إنشاء CSV للتاريخ الكامل.',
    exportWatchlist: 'تم إنشاء CSV لقائمة المتابعة.',
    exportBrief: 'تم تنزيل الملخص.',
    historyFallback: 'تم تحميل بديل التاريخ',
    historyFallbackBody: 'التاريخ طويل المدى يستخدم حالياً المصدر الشهري البديل.',
    budgetTitle: 'مخطط الميزانية',
    positionTitle: 'متابعة المركز',
    jewelryTitle: 'تقدير فاتورة المشغولات',
    marketBriefTitle: 'ملخص السوق',
    noPresets: 'لا توجد إعدادات محفوظة بعد.',
    noAlerts: 'لا توجد تنبيهات محفوظة بعد.',
    noWatchlist: 'ستظهر الأسواق المفضلة هنا.',
    noMarkets: 'لا توجد أسواق تطابق الفلتر الحالي.',
    noArchive: 'لا توجد صفوف أرشيف تطابق الفلتر.',
    lookupPrompt: 'اختر تاريخاً للبدء.',
    loading: 'جارٍ التحميل…',
    closestPoint: 'أقرب نقطة',
    lastUpdated: 'آخر تحديث',
    localSnapshots: 'لقطات محلية',
    favorites: 'المفضلة',
    liveDeskSummary: 'ملخص المكتب الحي',
    marketWire: 'شريط الأخبار',
    decisionCues: 'إشارات القرار',
    rangePlayback: 'استعراض النطاق',
    visibleNotes: 'ملاحظات النطاق الظاهر',
    liveLayer: 'مصدر السعر الفوري',
    fxLayer: 'مصدر الصرف',
    histLayer: 'مصدر التاريخ',
    source: 'المصدر',
    target: 'الهدف',
    scope: 'النطاق',
    condition: 'الشرط',
    remove: 'حذف',
    load: 'تحميل',
    favorite: 'إضافة للمفضلة',
    unfavorite: 'إزالة من المفضلة',
    details: 'فتح صفحة الدولة',
    snapshotJson: 'تم تنزيل JSON للحالة الحالية.',
    spotPerOz: 'السعر الفوري XAU/USD',
    uae24: 'الإمارات 24K / غ',
    selectedPrice: 'السعر المحدد',
    lookupDate: 'التاريخ المطابق',
    matchedPrice: 'السعر في ذلك الوقت',
    lookupContext: 'السياق',
    layerLive: 'ذاكرة الجلسة',
    layerAnchor: 'مرساة مباشرة',
    layerMonthly: 'الأساس الشهري',
    layerSynthetic: 'بديل اصطناعي',
    keyboardHint1: 'R لتحديث البيانات',
    keyboardHint2: 'C لنسخ الملخص',
    keyboardHint3: 'A للانتقال للتنبيهات',
    keyboardHint4: 'H للانتقال للرسم',
  }
};

const state = {
  lang: 'en',
  selectedCurrency: 'AED',
  selectedKarat: '24',
  selectedUnit: 'gram',
  compareCurrency: 'USD',
  range: '30D',
  metric: 'selected',
  autoRefresh: true,
  favoritesOnly: false,
  liveWireOn: true,
  live: null,
  rates: {},
  fxMeta: {},
  history: [],
  snapshots: [],
  alerts: [],
  presets: [],
  favorites: [],
  wireItems: [],
  timers: { live: null, wire: null, playback: null },
  lastRangeRows: [],
  lastArchiveRows: [],
  playbackIndex: null,
  hasLiveFailure: false,
};

const el = {};

function t(key) {
  return LANG[state.lang]?.[key] ?? LANG.en[key] ?? key;
}

function safeJsonParse(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function persist(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function readLocal(key, fallback) {
  try {
    return safeJsonParse(localStorage.getItem(key), fallback);
  } catch {
    return fallback;
  }
}

function currencyLabel(currency) {
  const country = COUNTRIES.find(item => item.currency === currency);
  return country ? `${country.currency} · ${state.lang === 'ar' ? country.nameAr : country.nameEn}` : currency;
}

function selectedKaratObj() {
  return KARATS.find(k => k.code === state.selectedKarat) || KARATS[0];
}

function selectedUnitFactor(unit = state.selectedUnit) {
  if (unit === 'gram') return 1 / CONSTANTS.TROY_OZ_GRAMS;
  if (unit === 'kilo') return 32.1507465686;
  return 1;
}

function selectedUnitShort(unit = state.selectedUnit) {
  return unit === 'gram' ? 'g' : unit === 'kilo' ? 'kg' : 'oz';
}

function selectedUnitLabel(unit = state.selectedUnit) {
  if (state.lang === 'ar') {
    if (unit === 'gram') return 'لكل غرام';
    if (unit === 'kilo') return 'لكل كيلو';
    return 'لكل أوقية';
  }
  if (unit === 'gram') return 'Per gram';
  if (unit === 'kilo') return 'Per kilogram';
  return 'Per ounce';
}

function isMarketOpen(now = new Date()) {
  const utcDay = now.getUTCDay();
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const sundayOpen = 22 * 60;
  const fridayClose = 21 * 60;
  if (utcDay === 6) return false;
  if (utcDay === 5) return utcMinutes < fridayClose;
  if (utcDay === 0) return utcMinutes >= sundayOpen;
  return true;
}

function number(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function currentSpot() {
  if (number(state.live?.price) > 0) return number(state.live.price);
  if (Array.isArray(state.snapshots) && state.snapshots.length) return number(state.snapshots[state.snapshots.length - 1].spot);
  if (Array.isArray(state.history) && state.history.length) return number(state.history[state.history.length - 1].spot);
  return 0;
}

function fxRate(currency) {
  if (currency === 'USD') return 1;
  if (currency === 'AED') return CONSTANTS.AED_PEG;
  return number(state.rates?.[currency]);
}

function priceFor({ currency = state.selectedCurrency, karat = state.selectedKarat, unit = state.selectedUnit, spot = currentSpot() } = {}) {
  const karatObj = KARATS.find(item => item.code === String(karat)) || KARATS[0];
  const usd = unit === 'gram'
    ? calc.usdPerGram(spot, karatObj.purity)
    : unit === 'kilo'
      ? calc.usdPerGram(spot, karatObj.purity) * 1000
      : calc.usdPerOz(spot, karatObj.purity);
  const rate = fxRate(currency);
  if (!rate || !usd) return 0;
  return usd * rate;
}

function formatPrice(amount, currency = state.selectedCurrency, decimals = 2) {
  return fmt.formatPrice(amount, currency, decimals);
}

function formatDelta(value, withClass = false) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return withClass ? { text: '—', cls: 'tracker-neutral' } : '—';
  }
  const sign = value > 0 ? '+' : '';
  const text = `${sign}${value.toFixed(2)}%`;
  const cls = value > 0 ? 'tracker-pos' : value < 0 ? 'tracker-neg' : 'tracker-neutral';
  return withClass ? { text, cls } : text;
}

function newestSnapshotTime() {
  if (state.live?.updatedAt) return new Date(state.live.updatedAt);
  if (state.snapshots.length) return new Date(state.snapshots[state.snapshots.length - 1].ts);
  return null;
}

function percentFrom(base, current) {
  if (!base || !current) return null;
  return ((current - base) / base) * 100;
}

function rangeStart(range) {
  const now = new Date();
  const copy = new Date(now);
  if (range === '24H') copy.setHours(copy.getHours() - 24);
  if (range === '7D') copy.setDate(copy.getDate() - 7);
  if (range === '30D') copy.setDate(copy.getDate() - 30);
  if (range === '90D') copy.setDate(copy.getDate() - 90);
  if (range === '1Y') copy.setFullYear(copy.getFullYear() - 1);
  if (range === '3Y') copy.setFullYear(copy.getFullYear() - 3);
  if (range === '5Y') copy.setFullYear(copy.getFullYear() - 5);
  if (range === 'ALL') copy.setFullYear(2000);
  return copy;
}

function ui() {
  return {
    refreshBtn: document.getElementById('tp-refresh-btn'),
    shareBtn: document.getElementById('tp-share-btn'),
    resetBtn: document.getElementById('tp-reset-btn'),
    language: document.getElementById('tp-language'),
    currency: document.getElementById('tp-currency'),
    karat: document.getElementById('tp-karat'),
    unit: document.getElementById('tp-unit'),
    compare: document.getElementById('tp-compare-country'),
    range: document.getElementById('tp-range'),
    autoRefresh: document.getElementById('tp-auto-refresh'),
    liveBadgeText: document.getElementById('tp-live-badge-text'),
    marketBadge: document.getElementById('tp-market-badge'),
    refreshBadge: document.getElementById('tp-refresh-badge'),
    heroStats: document.getElementById('tp-hero-stats'),
    summaryList: document.getElementById('tp-summary-list'),
    wireTrack: document.getElementById('tp-wire-track'),
    wireRefresh: document.getElementById('tp-wire-refresh'),
    chart: document.getElementById('tp-chart'),
    tooltip: document.getElementById('tp-tooltip'),
    legendMain: document.getElementById('tp-legend-main'),
    legendCompare: document.getElementById('tp-legend-compare'),
    miniStrip: document.getElementById('tp-mini-strip'),
    chartStats: document.getElementById('tp-chart-stats'),
    rangeNotes: document.getElementById('tp-range-notes'),
    playbackStrip: document.getElementById('tp-playback-strip'),
    playbackBtn: document.getElementById('tp-playback-btn'),
    karatTable: document.getElementById('tp-karat-table'),
    marketFilter: document.getElementById('tp-market-filter'),
    marketSort: document.getElementById('tp-market-sort'),
    marketBoard: document.getElementById('tp-market-board'),
    watchlistGrid: document.getElementById('tp-watchlist-grid'),
    decisionCues: document.getElementById('tp-decision-cues'),
    alertScope: document.getElementById('tp-alert-scope'),
    alertDirection: document.getElementById('tp-alert-direction'),
    alertTarget: document.getElementById('tp-alert-target'),
    alertList: document.getElementById('tp-alert-list'),
    saveAlert: document.getElementById('tp-save-alert'),
    enableNotifications: document.getElementById('tp-enable-notifications'),
    presetName: document.getElementById('tp-preset-name'),
    savePreset: document.getElementById('tp-save-preset'),
    copyUrl: document.getElementById('tp-copy-url'),
    presetList: document.getElementById('tp-preset-list'),
    budgetAmount: document.getElementById('tp-budget-amount'),
    budgetFee: document.getElementById('tp-budget-fee'),
    budgetResults: document.getElementById('tp-budget-results'),
    positionEntry: document.getElementById('tp-position-entry'),
    positionQty: document.getElementById('tp-position-qty'),
    positionResults: document.getElementById('tp-position-results'),
    jewelryWeight: document.getElementById('tp-jewelry-weight'),
    jewelryKarat: document.getElementById('tp-jewelry-karat'),
    jewelryMaking: document.getElementById('tp-jewelry-making'),
    jewelryPremium: document.getElementById('tp-jewelry-premium'),
    jewelryVat: document.getElementById('tp-jewelry-vat'),
    jewelryResults: document.getElementById('tp-jewelry-results'),
    briefHeadline: document.getElementById('tp-brief-headline'),
    briefCopy: document.getElementById('tp-brief-copy'),
    downloadBrief: document.getElementById('tp-download-brief'),
    archiveRange: document.getElementById('tp-archive-range'),
    archiveSearch: document.getElementById('tp-archive-search'),
    archiveBody: document.getElementById('tp-archive-body'),
    exportArchive: document.getElementById('tp-export-archive'),
    exportHistory: document.getElementById('tp-export-history'),
    lookupDate: document.getElementById('tp-lookup-date'),
    runLookup: document.getElementById('tp-run-lookup'),
    lookupResults: document.getElementById('tp-lookup-results'),
    exportChart: document.getElementById('tp-export-chart'),
    exportWatchlist: document.getElementById('tp-export-watchlist'),
    downloadJson: document.getElementById('tp-download-json'),
    toastStack: document.getElementById('tp-toast-stack'),
  };
}

function buildStateStub() {
  return {
    lang: state.lang,
    goldPriceUsdPerOz: null,
    rates: {},
    fxMeta: { nextUpdateUtc: 0 },
    status: {},
    freshness: {},
    favorites: [],
    history: [],
    selectedKaratSpotlight: state.selectedKarat,
    selectedKaratCountries: state.selectedKarat,
    selectedUnitTable: state.selectedUnit === 'gram' ? 'gram' : 'oz',
    sortOrder: 'high-low',
    searchQuery: '',
    activeTab: 'gcc',
    prevGoldPriceUsdPerOz: null,
    dayOpenGoldPriceUsdPerOz: null,
    isOnline: navigator.onLine,
    volatility7d: null,
    cacheHealthScore: 0,
  };
}

function loadPersistentState() {
  const saved = readLocal(STORAGE.state, {});
  state.lang = saved.lang || readLanguagePref() || 'en';
  state.selectedCurrency = saved.selectedCurrency || 'AED';
  state.selectedKarat = saved.selectedKarat || '24';
  state.selectedUnit = saved.selectedUnit || 'gram';
  state.compareCurrency = saved.compareCurrency || 'USD';
  state.range = saved.range || '30D';
  state.metric = saved.metric || 'selected';
  state.autoRefresh = saved.autoRefresh !== false;
  state.favoritesOnly = !!saved.favoritesOnly;
  state.liveWireOn = saved.liveWireOn !== false;
  state.alerts = readLocal(STORAGE.alerts, []);
  state.presets = readLocal(STORAGE.presets, []);
  state.favorites = readLocal(STORAGE.favorites, ['AED', 'USD', 'SAR']);
  state.snapshots = readLocal(STORAGE.snapshots, []);
  state.wireItems = readLocal(STORAGE.wire, []);
}

function savePersistentState() {
  persist(STORAGE.state, {
    lang: state.lang,
    selectedCurrency: state.selectedCurrency,
    selectedKarat: state.selectedKarat,
    selectedUnit: state.selectedUnit,
    compareCurrency: state.compareCurrency,
    range: state.range,
    metric: state.metric,
    autoRefresh: state.autoRefresh,
    favoritesOnly: state.favoritesOnly,
    liveWireOn: state.liveWireOn,
  });
  persist(STORAGE.alerts, state.alerts);
  persist(STORAGE.presets, state.presets.slice(0, 20));
  persist(STORAGE.favorites, state.favorites.slice(0, 24));
  persist(STORAGE.snapshots, state.snapshots.slice(-1200));
  persist(STORAGE.wire, state.wireItems.slice(0, 30));
}

function readLanguagePref() {
  try {
    const prefs = JSON.parse(localStorage.getItem(CONSTANTS.CACHE_KEYS.userPrefs) || '{}');
    return prefs.lang;
  } catch {
    return null;
  }
}

function saveLanguagePref(lang) {
  cache.savePreference('lang', lang);
}

function mountSharedShell() {
  const navCtrl = injectNav(state.lang, 0);
  navCtrl.getLangToggleButtons().forEach(btn => {
    btn.addEventListener('click', () => {
      state.lang = state.lang === 'en' ? 'ar' : 'en';
      saveLanguagePref(state.lang);
      savePersistentState();
      updateNavLang(state.lang);
      updateTickerLang(state.lang);
      document.documentElement.lang = state.lang;
      document.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
      if (el.language) el.language.value = state.lang;
      renderAll();
    });
  });
  injectFooter(state.lang, 0);
  injectTicker(state.lang, 0);
}

async function initDataFromSharedCache() {
  const stub = buildStateStub();
  cache.loadState(stub);
  if (stub.goldPriceUsdPerOz) {
    state.live = { price: stub.goldPriceUsdPerOz, updatedAt: stub.freshness.goldUpdatedAt || new Date().toISOString(), raw: {} };
  }
  if (stub.rates && Object.keys(stub.rates).length) {
    state.rates = stub.rates;
    state.fxMeta = stub.fxMeta || {};
  }
  if (Array.isArray(stub.history) && stub.history.length) {
    state.history = stub.history
      .map(row => ({
        date: new Date(row.date || row.timestamp || row.ts),
        spot: number(row.price || row.spot),
        source: row.source || 'session-cache',
      }))
      .filter(row => Number.isFinite(row.date.getTime()) && row.spot > 0);
  }
}

function setSelectOptions() {
  el.language.value = state.lang;
  el.currency.innerHTML = [
    ...new Map(COUNTRIES.map(item => [item.currency, item])).values()
  ].map(item => `<option value="${item.currency}">${item.currency} · ${state.lang === 'ar' ? item.nameAr : item.nameEn}</option>`).join('');

  el.compare.innerHTML = [
    ...new Map(COUNTRIES.map(item => [item.currency, item])).values()
  ].map(item => `<option value="${item.currency}">${item.currency} · ${state.lang === 'ar' ? item.nameAr : item.nameEn}</option>`).join('');

  el.karat.innerHTML = KARATS.map(item => `<option value="${item.code}">${state.lang === 'ar' ? item.labelAr : item.labelEn}</option>`).join('');
  el.jewelryKarat.innerHTML = KARATS.map(item => `<option value="${item.code}">${state.lang === 'ar' ? item.labelAr : item.labelEn}</option>`).join('');

  el.unit.innerHTML = `
    <option value="gram">${selectedUnitLabel('gram')}</option>
    <option value="oz">${selectedUnitLabel('oz')}</option>
    <option value="kilo">${selectedUnitLabel('kilo')}</option>
  `;

  el.currency.value = state.selectedCurrency;
  el.compare.value = state.compareCurrency;
  el.karat.value = state.selectedKarat;
  el.jewelryKarat.value = state.selectedKarat;
  el.unit.value = state.selectedUnit;
  el.range.value = state.range;
  el.autoRefresh.textContent = state.autoRefresh ? t('autoOn') : t('autoOff');
  el.autoRefresh.setAttribute('aria-pressed', state.autoRefresh ? 'true' : 'false');

  document.querySelectorAll('.tracker-chip[data-metric]').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.metric === state.metric);
  });

  document.querySelectorAll('.tracker-chip[data-toggle="favorites"]').forEach(btn => {
    btn.classList.toggle('is-active', state.favoritesOnly);
  });

  document.querySelectorAll('.tracker-chip[data-toggle="wire"]').forEach(btn => {
    btn.classList.toggle('is-active', state.liveWireOn);
  });
}

function bindEvents() {
  el.refreshBtn.addEventListener('click', () => refreshAll(true));
  el.shareBtn.addEventListener('click', copyQuickBrief);
  el.resetBtn.addEventListener('click', resetState);
  el.wireRefresh.addEventListener('click', () => loadWire(true));
  el.language.addEventListener('change', event => {
    state.lang = event.target.value;
    saveLanguagePref(state.lang);
    savePersistentState();
    updateNavLang(state.lang);
    updateTickerLang(state.lang);
    document.documentElement.lang = state.lang;
    document.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
    renderAll();
  });
  el.currency.addEventListener('change', event => { state.selectedCurrency = event.target.value; onControlChange(); });
  el.karat.addEventListener('change', event => { state.selectedKarat = event.target.value; el.jewelryKarat.value = state.selectedKarat; onControlChange(); });
  el.unit.addEventListener('change', event => { state.selectedUnit = event.target.value; onControlChange(); });
  el.compare.addEventListener('change', event => { state.compareCurrency = event.target.value; onControlChange(); });
  el.range.addEventListener('change', event => { state.range = event.target.value; onControlChange(false); });

  document.querySelectorAll('.tracker-chip[data-metric]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.metric = btn.dataset.metric;
      onControlChange(false);
    });
  });

  document.querySelectorAll('.tracker-chip[data-toggle="favorites"]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.favoritesOnly = !state.favoritesOnly;
      onControlChange(false);
    });
  });

  document.querySelectorAll('.tracker-chip[data-toggle="wire"]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.liveWireOn = !state.liveWireOn;
      renderWire();
      savePersistentState();
    });
  });

  el.autoRefresh.addEventListener('click', () => {
    state.autoRefresh = !state.autoRefresh;
    updateTimers();
    setSelectOptions();
    savePersistentState();
  });

  el.marketFilter.addEventListener('input', renderMarkets);
  el.marketSort.addEventListener('change', renderMarkets);

  el.saveAlert.addEventListener('click', saveAlert);
  el.enableNotifications.addEventListener('click', requestNotifications);
  el.savePreset.addEventListener('click', savePreset);
  el.copyUrl.addEventListener('click', copyShareUrl);

  [
    el.budgetAmount, el.budgetFee, el.positionEntry, el.positionQty, el.jewelryWeight,
    el.jewelryKarat, el.jewelryMaking, el.jewelryPremium, el.jewelryVat
  ].forEach(node => node.addEventListener(node.tagName === 'SELECT' || node.type === 'checkbox' ? 'change' : 'input', renderPlanners));

  el.archiveRange.addEventListener('change', renderArchive);
  el.archiveSearch.addEventListener('input', renderArchive);
  el.runLookup.addEventListener('click', runLookup);

  el.exportChart.addEventListener('click', exportVisibleChartCsv);
  el.exportArchive.addEventListener('click', exportVisibleArchiveCsv);
  el.exportHistory.addEventListener('click', exportFullHistoryCsv);
  el.exportWatchlist.addEventListener('click', exportWatchlistCsv);
  el.downloadJson.addEventListener('click', exportSnapshotJson);
  el.downloadBrief.addEventListener('click', downloadBrief);
  el.playbackBtn.addEventListener('click', togglePlayback);

  window.addEventListener('resize', renderChart);
  window.addEventListener('popstate', () => {
    readUrlState();
    renderAll();
  });

  window.addEventListener('keydown', event => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
    if (event.key.toLowerCase() === 'r') {
      event.preventDefault();
      refreshAll(true);
    }
    if (event.key.toLowerCase() === 'c') {
      event.preventDefault();
      copyQuickBrief();
    }
    if (event.key.toLowerCase() === 'a') {
      event.preventDefault();
      document.getElementById('section-alerts')?.scrollIntoView({ behavior: 'smooth' });
    }
    if (event.key.toLowerCase() === 'h') {
      event.preventDefault();
      document.getElementById('section-chart')?.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

function onControlChange(save = true) {
  if (save) savePersistentState();
  syncUrlState();
  renderAll();
}

function updateTimers() {
  if (state.timers.live) clearInterval(state.timers.live);
  if (state.autoRefresh) {
    state.timers.live = setInterval(() => refreshAll(false), CONSTANTS.GOLD_REFRESH_MS);
  }
}

function toast(title, body) {
  const node = document.createElement('div');
  node.className = 'tracker-toast';
  node.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(body)}</span>`;
  el.toastStack.appendChild(node);
  setTimeout(() => {
    node.style.opacity = '0';
    node.style.transform = 'translateY(6px)';
  }, 3600);
  setTimeout(() => node.remove(), 4200);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

async function refreshAll(showToast = false) {
  await Promise.allSettled([refreshLive(), ensureHistory(), maybeRefreshWire()]);
  captureSnapshot();
  updateTickerFromState();
  renderAll();
  runAlerts();
  if (showToast) toast(t('liveFeedActive'), `${t('lastUpdated')}: ${fmt.formatTimestampShort(newestSnapshotTime()?.toISOString(), state.lang)}`);
}

async function refreshLive() {
  const results = await Promise.allSettled([api.fetchGold(), api.fetchFX()]);
  const gold = results[0];
  const fx = results[1];

  if (gold.status === 'fulfilled') {
    state.live = {
      price: gold.value.price,
      updatedAt: gold.value.updatedAt || new Date().toISOString(),
      raw: gold.value,
    };
    cache.saveGoldPrice(state.live.price, state.live.updatedAt);
    state.hasLiveFailure = false;
    cache.checkDayOpenReset({
      goldPriceUsdPerOz: state.live.price,
      dayOpenGoldPriceUsdPerOz: currentSpot(),
    });
  } else if (!state.live) {
    state.hasLiveFailure = true;
  }

  if (fx.status === 'fulfilled') {
    state.rates = { ...fx.value.rates };
    state.fxMeta = {
      lastUpdateUtc: fx.value.time_last_update_utc,
      nextUpdateUtc: fx.value.time_next_update_utc ? new Date(fx.value.time_next_update_utc).getTime() : 0,
    };
    cache.saveFXRates(state.rates, state.fxMeta);
  } else if (!Object.keys(state.rates).length) {
    state.hasLiveFailure = true;
  }
}

async function ensureHistory() {
  if (state.history.length > 100) return;
  const rows = [];
  try {
    const response = await fetch(HISTORY_ENDPOINTS.monthlyCsv, { cache: 'force-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const csv = await response.text();
    rows.push(...parseHistoryCsv(csv));
  } catch {
    rows.push(...buildSyntheticHistory());
    toast(t('historyFallback'), t('historyFallbackBody'));
  }

  if (state.snapshots.length) {
    rows.push(...state.snapshots.map(item => ({
      date: new Date(item.ts),
      spot: item.spot,
      source: 'snapshot',
    })));
  }

  const dedup = new Map();
  rows.forEach(row => {
    if (!row || !row.spot || !row.date || Number.isNaN(row.date.getTime())) return;
    const key = row.date.toISOString().slice(0, 10);
    dedup.set(key, row);
  });
  state.history = [...dedup.values()].sort((a, b) => a.date - b.date);
}

function parseHistoryCsv(csv) {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const head = lines[0].split(',');
  const dateIndex = head.findIndex(h => /date/i.test(h));
  const priceIndex = head.findIndex(h => /price/i.test(h));
  return lines.slice(1).map(line => {
    const cells = line.split(',');
    return {
      date: new Date(cells[dateIndex]),
      spot: number(cells[priceIndex]),
      source: 'monthly',
    };
  }).filter(row => Number.isFinite(row.date.getTime()) && row.spot > 0);
}

function buildSyntheticHistory() {
  const out = [];
  let base = 1275;
  const now = new Date();
  for (let y = 2010; y <= now.getFullYear(); y += 1) {
    for (let m = 0; m < 12; m += 1) {
      if (y === now.getFullYear() && m > now.getMonth()) break;
      const seasonal = Math.sin((m / 12) * Math.PI * 2) * 36;
      const drift = (y - 2010) * 70;
      const noise = Math.sin((y * 7 + m) * 0.45) * 28;
      base += Math.sin((y + m) * 0.13) * 4;
      out.push({
        date: new Date(Date.UTC(y, m, 1)),
        spot: Math.round((base + drift + seasonal + noise) * 100) / 100,
        source: 'synthetic',
      });
    }
  }
  return out;
}

function captureSnapshot() {
  const spot = currentSpot();
  if (!spot) return;
  const snapshot = {
    ts: Date.now(),
    spot,
    selected: priceFor(),
    uae24: priceFor({ currency: 'AED', karat: '24', unit: 'gram', spot }),
    compare: priceFor({ currency: state.compareCurrency, karat: state.selectedKarat, unit: state.selectedUnit, spot }),
  };
  state.snapshots.push(snapshot);
  const cutoff = Date.now() - (1000 * 60 * 60 * 24 * 21);
  state.snapshots = state.snapshots.filter(item => item.ts >= cutoff);
  savePersistentState();
}

async function maybeRefreshWire() {
  const shouldRefresh = !state.wireItems.length || !readLocal(STORAGE.state, {}).wireFetchedAt || (Date.now() - number(readLocal(STORAGE.state, {}).wireFetchedAt) > 1000 * 60 * 20);
  if (shouldRefresh) await loadWire(false);
}

function loadWire(force = false) {
  return new Promise(resolve => {
    if (!force && state.wireItems.length) {
      renderWire();
      resolve();
      return;
    }

    const callbackName = `__trackerWire_${Date.now().toString(36)}`;
    const script = document.createElement('script');
    const timeout = setTimeout(() => {
      cleanup();
      if (!state.wireItems.length) {
        state.wireItems = [];
        renderWire();
      }
      resolve();
    }, 12000);

    function cleanup() {
      clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = payload => {
      cleanup();
      const articles = Array.isArray(payload?.articles) ? payload.articles : [];
      state.wireItems = articles
        .map(item => ({
          title: item.title || item.seendate || 'Gold headline',
          url: item.url || item.url_mobile || '',
          domain: item.domain || item.sourcecountry || '',
          seenDate: item.seendate || item.date || '',
        }))
        .filter(item => item.title)
        .slice(0, WIRE.maxrecords);
      const existing = readLocal(STORAGE.state, {});
      persist(STORAGE.state, { ...existing, wireFetchedAt: Date.now() });
      savePersistentState();
      renderWire();
      resolve();
    };

    const query = encodeURIComponent(WIRE.query);
    script.src = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=artlist&maxrecords=${WIRE.maxrecords}&timespan=${WIRE.timespan}&format=jsonp&callback=${callbackName}`;
    script.async = true;
    document.body.appendChild(script);
  });
}

function updateTickerFromState() {
  const spot = currentSpot();
  if (!spot) return;
  updateTicker({
    xauUsd: spot,
    uae24k: priceFor({ currency: 'AED', karat: '24', unit: 'gram', spot }),
    uae22k: priceFor({ currency: 'AED', karat: '22', unit: 'gram', spot }),
    uae21k: priceFor({ currency: 'AED', karat: '21', unit: 'gram', spot }),
    uae18k: priceFor({ currency: 'AED', karat: '18', unit: 'gram', spot }),
  });
}

function renderAll() {
  document.documentElement.lang = state.lang;
  document.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
  document.title = state.lang === 'ar' ? 'متتبع الذهب برو' : 'Gold Tracker Pro — Live Workspace';
  document.getElementById('tp-hero-title').textContent = t('heroTitle');
  document.getElementById('tp-hero-copy').textContent = t('heroCopy');
  setSelectOptions();
  renderHero();
  renderMiniStrip();
  renderChart();
  renderKaratTable();
  renderMarkets();
  renderWatchlist();
  renderDecisionCues();
  renderAlerts();
  renderPresets();
  renderPlanners();
  renderArchive();
  renderWire();
  renderBrief();
}

function renderHero() {
  const spot = currentSpot();
  const selected = priceFor();
  const compare = priceFor({ currency: state.compareCurrency });
  const uae24 = priceFor({ currency: 'AED', karat: '24', unit: 'gram', spot });
  const snapshots = state.snapshots.length;
  const timestamp = newestSnapshotTime();
  const open = isMarketOpen();

  const dayChange = nearestChange(1);
  const monthChange = nearestChange(30);
  const yearChange = nearestChange(365);

  const cards = [
    { k: t('spotPerOz'), v: spot ? formatPrice(spot, 'USD', 2) : '—', s: 'USD / oz' },
    { k: t('selectedPrice'), v: selected ? formatPrice(selected, state.selectedCurrency, 2) : '—', s: `${state.selectedCurrency} · ${state.selectedKarat} · ${selectedUnitShort()}` },
    { k: t('uae24'), v: uae24 ? formatPrice(uae24, 'AED', 2) : '—', s: 'AED / g' },
    { k: '30D', v: monthChange === null ? '—' : formatDelta(monthChange), s: 'Historical baseline move' },
  ];

  el.heroStats.innerHTML = cards.map(card => `
    <article class="tracker-hero-stat">
      <div class="tracker-hero-k">${escapeHtml(card.k)}</div>
      <div class="tracker-hero-v ${monthChange > 0 ? '' : ''}">${escapeHtml(card.v)}</div>
      <div class="tracker-hero-s">${escapeHtml(card.s)}</div>
    </article>
  `).join('');

  const summaryRows = [
    `${t('lastUpdated')}: ${timestamp ? fmt.formatTimestampShort(timestamp.toISOString(), state.lang) : '—'}`,
    `${t('localSnapshots')}: ${snapshots}`,
    `${t('current')}: ${selected ? formatPrice(selected, state.selectedCurrency, 2) : '—'}`,
    `${t('compareSeries')}: ${compare ? formatPrice(compare, state.compareCurrency, 2) : '—'}`,
    `1D: ${dayChange === null ? '—' : formatDelta(dayChange)}`,
    `1Y: ${yearChange === null ? '—' : formatDelta(yearChange)}`,
  ];

  el.summaryList.innerHTML = summaryRows.map(item => `<div class="tracker-side-item">${escapeHtml(item)}</div>`).join('');

  el.liveBadgeText.textContent = state.hasLiveFailure ? t('liveFeedCached') : t('liveFeedActive');
  el.marketBadge.textContent = open ? t('marketOpen') : t('marketClosed');
  el.refreshBadge.textContent = timestamp ? `${t('liveBadge')} · ${fmt.formatTimestampShort(timestamp.toISOString(), state.lang)}` : t('loading');
}

function renderMiniStrip() {
  const strip = [];
  const spot = currentSpot();
  const selected = priceFor();
  const compare = priceFor({ currency: state.compareCurrency });
  const high = visibleRangeStats().high;
  const low = visibleRangeStats().low;
  const vol = visibleRangeStats().volatility;

  strip.push(miniCard(t('current'), selected ? formatPrice(selected, state.selectedCurrency, 2) : '—', `${state.selectedCurrency} ${state.selectedKarat}/${selectedUnitShort()}`));
  strip.push(miniCard(t('high'), high ? formatPrice(high, metricCurrency(), 2) : '—', `${state.range} range`));
  strip.push(miniCard(t('low'), low ? formatPrice(low, metricCurrency(), 2) : '—', `${state.range} range`));
  strip.push(miniCard(t('volatility'), vol === null ? '—' : `${vol.toFixed(2)}%`, 'Visible range stdev'));

  el.miniStrip.innerHTML = strip.join('');
  el.legendMain.textContent = state.metric === 'spot'
    ? t('spotPerOz')
    : state.metric === 'compare'
      ? `${t('compareSeries')} · ${state.compareCurrency}`
      : `${state.selectedCurrency} · ${state.selectedKarat} · ${selectedUnitShort()}`;
  el.legendCompare.textContent = `${t('compareSeries')} · ${state.compareCurrency}`;
}

function miniCard(k, v, s) {
  return `
    <div class="tracker-mini-item">
      <div class="tracker-mini-k">${escapeHtml(k)}</div>
      <div class="tracker-mini-v">${escapeHtml(v)}</div>
      <div class="tracker-mini-s">${escapeHtml(s)}</div>
    </div>
  `;
}

function visibleRows() {
  const start = rangeStart(state.range).getTime();
  const rows = [];

  state.history.forEach(item => {
    if (item.date.getTime() < start) return;
    rows.push(rowFromSpot(item.date, item.spot, item.source || 'monthly'));
  });

  state.snapshots.forEach(item => {
    if (item.ts < start) return;
    rows.push(rowFromSpot(new Date(item.ts), item.spot, 'live-cache'));
  });

  if (currentSpot()) {
    const latest = rowFromSpot(new Date(), currentSpot(), 'live-anchor');
    rows.push(latest);
  }

  const dedup = new Map();
  rows.forEach(row => {
    const key = state.range === '24H'
      ? row.date.toISOString().slice(0, 13)
      : state.range === '7D'
        ? row.date.toISOString().slice(0, 10)
        : row.date.toISOString().slice(0, 7);
    dedup.set(`${key}-${row.source.includes('live') ? 'live' : 'base'}`, row);
  });

  const finalRows = [...dedup.values()].sort((a, b) => a.date - b.date);
  state.lastRangeRows = finalRows;
  return finalRows;
}

function rowFromSpot(date, spot, source) {
  return {
    date,
    source,
    spot,
    selected: priceFor({ currency: state.selectedCurrency, karat: state.selectedKarat, unit: state.selectedUnit, spot }),
    compare: priceFor({ currency: state.compareCurrency, karat: state.selectedKarat, unit: state.selectedUnit, spot }),
  };
}

function metricCurrency() {
  if (state.metric === 'spot') return 'USD';
  if (state.metric === 'compare') return state.compareCurrency;
  return state.selectedCurrency;
}

function valueForRow(row) {
  if (state.metric === 'spot') return row.spot;
  if (state.metric === 'compare') return row.compare;
  return row.selected;
}

function renderChart() {
  const rows = visibleRows();
  const svg = el.chart;
  const tooltip = el.tooltip;

  if (!rows.length) {
    svg.innerHTML = '';
    el.chartStats.innerHTML = `<div class="tracker-empty">${escapeHtml(t('loading'))}</div>`;
    return;
  }

  const width = 1200;
  const height = 430;
  const pad = { top: 26, right: 24, bottom: 42, left: 78 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const values = rows.map(valueForRow);
  const compareValues = rows.map(item => item.compare);
  const min = Math.min(...values, ...(state.metric === 'selected' ? compareValues : []));
  const max = Math.max(...values, ...(state.metric === 'selected' ? compareValues : []));
  const safeMin = min === max ? min * 0.98 : min * 0.995;
  const safeMax = min === max ? max * 1.02 : max * 1.005;
  const x = index => pad.left + (rows.length === 1 ? innerW / 2 : (index / (rows.length - 1)) * innerW);
  const y = value => pad.top + innerH - ((value - safeMin) / (safeMax - safeMin || 1)) * innerH;

  let grid = '';
  const steps = 5;
  for (let i = 0; i <= steps; i += 1) {
    const yy = pad.top + (innerH / steps) * i;
    const level = safeMax - ((safeMax - safeMin) / steps) * i;
    grid += `<line x1="${pad.left}" y1="${yy}" x2="${width - pad.right}" y2="${yy}" stroke="rgba(160,140,110,0.18)" stroke-width="1"/>`;
    grid += `<text x="${pad.left - 12}" y="${yy + 4}" fill="rgba(111,98,79,0.92)" font-size="12" text-anchor="end">${escapeHtml(axisPrice(level))}</text>`;
  }

  let xLabels = '';
  const tickStep = Math.max(1, Math.floor(rows.length / 6));
  rows.forEach((row, index) => {
    if (index !== 0 && index !== rows.length - 1 && index % tickStep !== 0) return;
    const xx = x(index);
    xLabels += `<line x1="${xx}" y1="${height - pad.bottom}" x2="${xx}" y2="${height - pad.bottom + 6}" stroke="rgba(160,140,110,0.22)" stroke-width="1"/>`;
    xLabels += `<text x="${xx}" y="${height - 12}" fill="rgba(111,98,79,0.92)" font-size="12" text-anchor="middle">${escapeHtml(axisDate(row.date))}</text>`;
  });

  const line = rows.map((row, index) => `${index === 0 ? 'M' : 'L'} ${x(index)} ${y(valueForRow(row))}`).join(' ');
  const area = `${line} L ${x(rows.length - 1)} ${pad.top + innerH} L ${x(0)} ${pad.top + innerH} Z`;
  const comparePath = rows.map((row, index) => `${index === 0 ? 'M' : 'L'} ${x(index)} ${y(row.compare)}`).join(' ');

  svg.innerHTML = `
    <defs>
      <linearGradient id="tpArea" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" stop-color="rgba(196,154,68,0.26)"></stop>
        <stop offset="100%" stop-color="rgba(196,154,68,0.03)"></stop>
      </linearGradient>
      <linearGradient id="tpStroke" x1="0" x2="1">
        <stop offset="0%" stop-color="#c49a44"></stop>
        <stop offset="100%" stop-color="#9c7325"></stop>
      </linearGradient>
      <linearGradient id="tpCompare" x1="0" x2="1">
        <stop offset="0%" stop-color="#4d8fe0"></stop>
        <stop offset="100%" stop-color="#1455a4"></stop>
      </linearGradient>
    </defs>
    <rect x="0" y="0" width="${width}" height="${height}" fill="transparent"></rect>
    ${grid}
    <line x1="${pad.left}" y1="${pad.top + innerH}" x2="${width - pad.right}" y2="${pad.top + innerH}" stroke="rgba(160,140,110,0.26)" stroke-width="1.3"></line>
    ${xLabels}
    ${state.metric === 'selected' ? `<path d="${comparePath}" fill="none" stroke="url(#tpCompare)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" opacity="0.9"/>` : ''}
    <path d="${area}" fill="url(#tpArea)"></path>
    <path d="${line}" fill="none" stroke="url(#tpStroke)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>
  `;

  svg.onmousemove = event => {
    const rect = svg.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const index = Math.round(ratio * (rows.length - 1));
    const row = rows[index];
    const cx = x(index) / width * rect.width;
    const cy = y(valueForRow(row)) / height * rect.height;
    tooltip.style.display = 'block';
    tooltip.style.left = `${cx}px`;
    tooltip.style.top = `${cy}px`;
    tooltip.innerHTML = `
      <strong>${escapeHtml(fullAxisDate(row.date))}</strong>
      <div>${escapeHtml(state.metric === 'spot' ? t('spotPerOz') : t('selectedPrice'))}: ${escapeHtml(axisPrice(valueForRow(row), true))}</div>
      <div>${escapeHtml(t('compareSeries'))}: ${escapeHtml(formatPrice(row.compare, state.compareCurrency, 2))}</div>
      <div>${escapeHtml(t('source'))}: ${escapeHtml(describeLayer(row.source))}</div>
    `;
  };
  svg.onmouseleave = () => { tooltip.style.display = 'none'; };

  renderChartStats(rows);
  renderPlayback(rows);
  renderRangeNotes(rows);
}

function axisPrice(value, exact = false) {
  const currency = metricCurrency();
  if (state.metric === 'spot') return formatPrice(value, 'USD', exact ? 2 : value > 1000 ? 0 : 2);
  return formatPrice(value, currency, exact ? 2 : value > 1000 ? 0 : 2);
}

function axisDate(date) {
  if (state.range === '24H') return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(date);
  if (state.range === '7D') return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(date);
  if (['30D', '90D', '1Y'].includes(state.range)) return new Intl.DateTimeFormat(undefined, { month: 'short', year: '2-digit' }).format(date);
  return new Intl.DateTimeFormat(undefined, { year: 'numeric' }).format(date);
}

function fullAxisDate(date) {
  return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
}

function visibleRangeStats(rows = state.lastRangeRows) {
  if (!rows.length) return { high: null, low: null, change: null, volatility: null };
  const values = rows.map(valueForRow);
  const high = Math.max(...values);
  const low = Math.min(...values);
  const change = percentFrom(values[0], values[values.length - 1]);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + ((v - mean) ** 2), 0) / values.length;
  const volatility = mean ? (Math.sqrt(variance) / mean) * 100 : null;
  return { high, low, change, volatility };
}

function renderChartStats(rows) {
  const stats = visibleRangeStats(rows);
  const latest = valueForRow(rows[rows.length - 1]);
  const first = valueForRow(rows[0]);
  const currentClass = latest >= first ? 'tracker-pos' : latest < first ? 'tracker-neg' : 'tracker-neutral';
  const changeInfo = formatDelta(stats.change, true);
  const cards = [
    { k: t('range'), v: (stats.high && stats.low) ? axisPrice(stats.high - stats.low, true) : '—', s: `${t('high')} − ${t('low')}`, cls: 'tracker-neutral' },
    { k: t('change'), v: changeInfo.text, s: `${t('current')} vs start`, cls: changeInfo.cls },
    { k: t('points'), v: String(rows.length), s: 'Visible rows', cls: 'tracker-neutral' },
    { k: t('dataLogic'), v: dominantLayer(rows), s: 'Recent + baseline blend', cls: 'tracker-neutral' },
  ];
  el.chartStats.innerHTML = cards.map(card => `
    <article class="tracker-stat-card">
      <div class="tracker-stat-k">${escapeHtml(card.k)}</div>
      <div class="tracker-stat-v ${card.cls}">${escapeHtml(card.v)}</div>
      <div class="tracker-stat-s">${escapeHtml(card.s)}</div>
    </article>
  `).join('');
}

function dominantLayer(rows) {
  const counts = new Map();
  rows.forEach(row => {
    const key = describeLayer(row.source);
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || t('loading');
}

function describeLayer(source) {
  const value = String(source || '').toLowerCase();
  if (value.includes('snapshot') || value.includes('live-cache')) return t('layerLive');
  if (value.includes('anchor') || value.includes('live')) return t('layerAnchor');
  if (value.includes('synthetic')) return t('layerSynthetic');
  return t('layerMonthly');
}

function renderPlayback(rows) {
  const sample = rows.filter((_, index) => index === 0 || index === rows.length - 1 || index % Math.max(1, Math.floor(rows.length / 5)) === 0).slice(0, 6);
  const activeIndex = state.playbackIndex;
  el.playbackStrip.innerHTML = sample.map((row, index) => `
    <div class="tracker-playback-item ${activeIndex === index ? 'is-active' : ''}">
      <strong>${escapeHtml(axisDate(row.date))}</strong>
      <span>${escapeHtml(axisPrice(valueForRow(row), true))}</span>
    </div>
  `).join('') || `<div class="tracker-empty">${escapeHtml(t('loading'))}</div>`;
}

function renderRangeNotes(rows) {
  const notes = [];
  const stats = visibleRangeStats(rows);
  const latest = rows[rows.length - 1];
  const earliest = rows[0];
  notes.push(`${t('current')}: ${axisPrice(valueForRow(latest), true)} · ${fullAxisDate(latest.date)}`);
  notes.push(`${t('high')}: ${stats.high ? axisPrice(stats.high, true) : '—'} · ${t('low')}: ${stats.low ? axisPrice(stats.low, true) : '—'}`);
  notes.push(`${t('change')}: ${stats.change === null ? '—' : formatDelta(stats.change)}`);
  notes.push(`${t('source')}: ${describeLayer(latest.source)} · ${dominantLayer(rows)}`);
  notes.push(`${t('keyboardHint1')} · ${t('keyboardHint2')}`);
  notes.push(`${t('keyboardHint3')} · ${t('keyboardHint4')}`);
  el.rangeNotes.innerHTML = notes.map(item => `<div class="tracker-note-item">${escapeHtml(item)}</div>`).join('');
}

function togglePlayback() {
  if (state.timers.playback) {
    clearInterval(state.timers.playback);
    state.timers.playback = null;
    state.playbackIndex = null;
    renderPlayback(state.lastRangeRows);
    return;
  }
  const rows = state.lastRangeRows;
  if (!rows.length) return;
  const sample = rows.filter((_, index) => index === 0 || index === rows.length - 1 || index % Math.max(1, Math.floor(rows.length / 5)) === 0).slice(0, 6);
  let index = 0;
  state.playbackIndex = index;
  renderPlayback(rows);
  state.timers.playback = setInterval(() => {
    index = (index + 1) % sample.length;
    state.playbackIndex = index;
    renderPlayback(rows);
  }, 900);
}

function renderKaratTable() {
  const spot = currentSpot();
  const base24 = priceFor({ currency: state.selectedCurrency, karat: '24', unit: state.selectedUnit, spot });
  el.karatTable.innerHTML = KARATS.map(karat => {
    const value = priceFor({ currency: state.selectedCurrency, karat: karat.code, unit: state.selectedUnit, spot });
    const diff = base24 ? ((value - base24) / base24) * 100 : null;
    const diffInfo = diff === null ? { text: '—', cls: 'tracker-neutral' } : (diff === 0 ? { text: 'Base', cls: 'tracker-neutral' } : formatDelta(diff, true));
    return `
      <tr>
        <td class="tracker-cell-strong">${escapeHtml(state.lang === 'ar' ? karat.labelAr : karat.labelEn)}</td>
        <td>${escapeHtml((karat.purity * 100).toFixed(2))}%</td>
        <td class="tracker-cell-strong">${escapeHtml(formatPrice(value, state.selectedCurrency, 2))}</td>
        <td class="${diffInfo.cls}">${escapeHtml(diffInfo.text)}</td>
      </tr>
    `;
  }).join('');
}

function marketRows() {
  const spot = currentSpot();
  return [...new Map(COUNTRIES.map(item => [item.currency, item])).values()].map(item => {
    const price = priceFor({ currency: item.currency, karat: state.selectedKarat, unit: state.selectedUnit, spot });
    const compareBase = priceFor({ currency: state.selectedCurrency, karat: state.selectedKarat, unit: state.selectedUnit, spot });
    const diff = compareBase ? ((price - compareBase) / compareBase) * 100 : null;
    return { ...item, price, diff };
  });
}

function renderMarkets() {
  const filter = el.marketFilter.value.trim().toLowerCase();
  const sort = el.marketSort.value;
  let rows = marketRows().filter(row => {
    if (!state.favoritesOnly) return true;
    return state.favorites.includes(row.currency);
  }).filter(row => {
    if (!filter) return true;
    const hay = [
      row.currency,
      row.nameEn,
      row.nameAr,
      row.code,
      ...row.searchAliases || []
    ].join(' ').toLowerCase();
    return hay.includes(filter);
  });

  rows.sort((a, b) => {
    if (sort === 'low') return a.price - b.price;
    if (sort === 'alpha') return (state.lang === 'ar' ? a.nameAr : a.nameEn).localeCompare(state.lang === 'ar' ? b.nameAr : b.nameEn);
    if (sort === 'favorites') {
      const af = state.favorites.includes(a.currency) ? 0 : 1;
      const bf = state.favorites.includes(b.currency) ? 0 : 1;
      if (af !== bf) return af - bf;
      return b.price - a.price;
    }
    return b.price - a.price;
  });

  if (!rows.length) {
    el.marketBoard.innerHTML = `<div class="tracker-empty">${escapeHtml(t('noMarkets'))}</div>`;
    return;
  }

  el.marketBoard.innerHTML = rows.map(row => {
    const favorite = state.favorites.includes(row.currency);
    const diff = row.diff === null ? { text: '—', cls: 'tracker-neutral' } : formatDelta(row.diff, true);
    const slug = countrySlug(row);
    return `
      <article class="tracker-market-card ${favorite ? 'is-highlight' : ''}">
        <div class="tracker-market-top">
          <div class="tracker-market-title">
            <strong>${escapeHtml(state.lang === 'ar' ? row.nameAr : row.nameEn)}</strong>
            <span>${escapeHtml(`${row.currency} · ${state.selectedKarat} · ${selectedUnitShort()}`)}</span>
          </div>
          <div class="tracker-market-value">
            <strong>${escapeHtml(formatPrice(row.price, row.currency, 2))}</strong>
            <span>${escapeHtml(diff.text)}</span>
          </div>
        </div>
        <div class="tracker-market-bottom">
          <div class="tracker-market-links">
            <a href="countries/${slug}.html">${escapeHtml(t('details'))}</a>
            <button type="button" class="tracker-icon-btn ${favorite ? 'is-favorite' : ''}" data-favorite="${row.currency}" aria-pressed="${favorite ? 'true' : 'false'}" title="${favorite ? t('unfavorite') : t('favorite')}">★</button>
          </div>
          <span class="tracker-pill ${diff.cls.includes('pos') ? 'up' : diff.cls.includes('neg') ? 'down' : 'gold'}">${escapeHtml(diff.text === '—' ? row.currency : diff.text)}</span>
        </div>
      </article>
    `;
  }).join('');

  el.marketBoard.querySelectorAll('[data-favorite]').forEach(btn => {
    btn.addEventListener('click', () => toggleFavorite(btn.dataset.favorite));
  });
}

function countrySlug(country) {
  const map = {
    AE: 'uae',
    SA: 'saudi-arabia',
    KW: 'kuwait',
    QA: 'qatar',
    BH: 'bahrain',
    OM: 'oman',
    EG: 'egypt',
    JO: 'jordan',
    MA: 'morocco',
    IN: 'india',
    US: 'united-states',
    GB: 'united-kingdom',
    EU: 'eurozone',
  };
  return map[country.code] || country.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function toggleFavorite(currency) {
  if (state.favorites.includes(currency)) {
    state.favorites = state.favorites.filter(item => item !== currency);
  } else {
    state.favorites.unshift(currency);
  }
  savePersistentState();
  renderMarkets();
  renderWatchlist();
}

function renderWatchlist() {
  const rows = marketRows().filter(row => state.favorites.includes(row.currency)).sort((a, b) => state.favorites.indexOf(a.currency) - state.favorites.indexOf(b.currency));
  if (!rows.length) {
    el.watchlistGrid.innerHTML = `<div class="tracker-empty">${escapeHtml(t('noWatchlist'))}</div>`;
    return;
  }
  el.watchlistGrid.innerHTML = rows.map(row => `
    <article class="tracker-watch-card">
      <div class="tracker-watch-top">
        <div class="tracker-watch-title">
          <strong>${escapeHtml(state.lang === 'ar' ? row.nameAr : row.nameEn)}</strong>
          <span>${escapeHtml(`${row.currency} · ${state.selectedKarat} · ${selectedUnitShort()}`)}</span>
        </div>
        <div class="tracker-watch-value">
          <strong>${escapeHtml(formatPrice(row.price, row.currency, 2))}</strong>
          <span>${escapeHtml(formatDelta(row.diff ?? 0))}</span>
        </div>
      </div>
    </article>
  `).join('');
}

function renderDecisionCues() {
  const cues = [];
  const oneDay = nearestChange(1);
  const thirty = nearestChange(30);
  const year = nearestChange(365);
  const current = priceFor();
  if (thirty !== null) {
    cues.push(`${t('selectedPrice')}: ${formatPrice(current, state.selectedCurrency, 2)} · 30D ${formatDelta(thirty)}`);
  }
  if (oneDay !== null && thirty !== null) {
    if (oneDay > 1.5 && thirty > 4) cues.push('Momentum is strong across both short and medium windows.');
    else if (oneDay < -1.5 && thirty < -4) cues.push('Short-term and medium-term pressure are both negative right now.');
    else cues.push('The market is mixed. Shop premium and timing matter more than trend-chasing.');
  }
  if (year !== null) cues.push(`1Y move: ${formatDelta(year)}.`);
  cues.push(`${t('favorites')}: ${state.favorites.join(', ') || '—'}`);
  el.decisionCues.innerHTML = cues.map(text => `<div class="tracker-note-item">${escapeHtml(text)}</div>`).join('');
}

function nearestChange(days) {
  const target = Date.now() - days * 86400000;
  const rows = state.lastRangeRows.length ? state.lastRangeRows : visibleRows();
  if (!rows.length) return null;
  let best = rows[0];
  let bestDiff = Infinity;
  rows.forEach(row => {
    const diff = Math.abs(row.date.getTime() - target);
    if (diff < bestDiff) {
      best = row;
      bestDiff = diff;
    }
  });
  const current = valueForRow(rows[rows.length - 1]);
  const base = state.metric === 'spot'
    ? best.spot
    : state.metric === 'compare'
      ? best.compare
      : best.selected;
  return percentFrom(base, current);
}

function saveAlert() {
  const target = number(el.alertTarget.value);
  if (!target) {
    toast(t('saveAlert'), t('invalidAlert'));
    return;
  }
  const alert = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    scope: el.alertScope.value,
    direction: el.alertDirection.value,
    target,
    createdAt: Date.now(),
    config: {
      currency: state.selectedCurrency,
      karat: state.selectedKarat,
      unit: state.selectedUnit,
    },
    triggered: false,
  };
  state.alerts.unshift(alert);
  savePersistentState();
  renderAlerts();
  toast(t('alertSaved'), `${t('target')}: ${target}`);
  el.alertTarget.value = '';
}

function renderAlerts() {
  if (!state.alerts.length) {
    el.alertList.innerHTML = `<div class="tracker-empty">${escapeHtml(t('noAlerts'))}</div>`;
    return;
  }
  el.alertList.innerHTML = state.alerts.map(alert => {
    const current = alertValue(alert);
    const scope = alert.scope === 'spot'
      ? t('spotPerOz')
      : alert.scope === 'uae24'
        ? t('uae24')
        : `${alert.config.currency} · ${alert.config.karat} · ${alert.config.unit}`;
    return `
      <article class="tracker-stack-item">
        <div class="tracker-stack-top">
          <strong>${escapeHtml(alert.direction === 'above' ? 'Above' : 'Below')} ${escapeHtml(formatAlertValue(alert.target, alert))}</strong>
          <div class="tracker-row-actions">
            <button type="button" class="tracker-icon-btn" data-remove-alert="${alert.id}">×</button>
          </div>
        </div>
        <p>${escapeHtml(scope)} · ${escapeHtml(fullAxisDate(new Date(alert.createdAt)))}${alert.triggered ? ' · Triggered' : ''}${current ? ` · ${formatAlertValue(current, alert)}` : ''}</p>
      </article>
    `;
  }).join('');

  el.alertList.querySelectorAll('[data-remove-alert]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.alerts = state.alerts.filter(item => item.id !== btn.dataset.removeAlert);
      savePersistentState();
      renderAlerts();
    });
  });
}

function alertValue(alert) {
  const spot = currentSpot();
  if (!spot) return 0;
  if (alert.scope === 'spot') return spot;
  if (alert.scope === 'uae24') return priceFor({ currency: 'AED', karat: '24', unit: 'gram', spot });
  return priceFor({
    currency: alert.config.currency,
    karat: alert.config.karat,
    unit: alert.config.unit,
    spot,
  });
}

function formatAlertValue(value, alert) {
  if (alert.scope === 'spot') return formatPrice(value, 'USD', 2);
  if (alert.scope === 'uae24') return formatPrice(value, 'AED', 2);
  return formatPrice(value, alert.config.currency, 2);
}

function runAlerts() {
  let changed = false;
  state.alerts.forEach(alert => {
    if (alert.triggered) return;
    const current = alertValue(alert);
    if (!current) return;
    const hit = alert.direction === 'above' ? current >= alert.target : current <= alert.target;
    if (hit) {
      alert.triggered = true;
      changed = true;
      notify(`${t('alertSaved')}: ${alert.scope}`, `${formatAlertValue(current, alert)} / ${formatAlertValue(alert.target, alert)}`);
    }
  });
  if (changed) {
    savePersistentState();
    renderAlerts();
  }
}

async function requestNotifications() {
  if (!('Notification' in window)) {
    toast('Notifications', 'This browser does not support notifications.');
    return;
  }
  const permission = await Notification.requestPermission();
  toast('Notifications', permission === 'granted' ? t('notificationsGranted') : t('notificationsDenied'));
}

function notify(title, body) {
  toast(title, body);
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body });
  }
}

function savePreset() {
  const name = el.presetName.value.trim();
  if (!name) {
    toast(t('savePreset'), t('invalidPreset'));
    return;
  }
  const preset = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name,
    lang: state.lang,
    selectedCurrency: state.selectedCurrency,
    selectedKarat: state.selectedKarat,
    selectedUnit: state.selectedUnit,
    compareCurrency: state.compareCurrency,
    range: state.range,
    metric: state.metric,
    createdAt: Date.now(),
  };
  state.presets.unshift(preset);
  state.presets = state.presets.slice(0, 20);
  savePersistentState();
  renderPresets();
  el.presetName.value = '';
  toast(t('presetSaved'), name);
}

function renderPresets() {
  if (!state.presets.length) {
    el.presetList.innerHTML = `<div class="tracker-empty">${escapeHtml(t('noPresets'))}</div>`;
    return;
  }
  el.presetList.innerHTML = state.presets.map(preset => `
    <article class="tracker-stack-item">
      <div class="tracker-stack-top">
        <strong>${escapeHtml(preset.name)}</strong>
        <div class="tracker-row-actions">
          <button type="button" class="tracker-icon-btn" data-load-preset="${preset.id}">↺</button>
          <button type="button" class="tracker-icon-btn" data-remove-preset="${preset.id}">×</button>
        </div>
      </div>
      <p>${escapeHtml(`${preset.selectedCurrency} · ${preset.selectedKarat} · ${preset.selectedUnit} · ${preset.compareCurrency} · ${preset.range}`)}</p>
    </article>
  `).join('');

  el.presetList.querySelectorAll('[data-load-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      const preset = state.presets.find(item => item.id === btn.dataset.loadPreset);
      if (!preset) return;
      state.lang = preset.lang || state.lang;
      state.selectedCurrency = preset.selectedCurrency;
      state.selectedKarat = preset.selectedKarat;
      state.selectedUnit = preset.selectedUnit;
      state.compareCurrency = preset.compareCurrency;
      state.range = preset.range;
      state.metric = preset.metric;
      saveLanguagePref(state.lang);
      savePersistentState();
      updateNavLang(state.lang);
      updateTickerLang(state.lang);
      renderAll();
      toast(t('presetSaved'), preset.name);
    });
  });

  el.presetList.querySelectorAll('[data-remove-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.presets = state.presets.filter(item => item.id !== btn.dataset.removePreset);
      savePersistentState();
      renderPresets();
    });
  });
}

function renderPlanners() {
  renderBudget();
  renderPosition();
  renderJewelry();
  renderBrief();
}

function renderBudget() {
  const amount = number(el.budgetAmount.value);
  const feePct = number(el.budgetFee.value);
  const current = priceFor();
  const effective = current * (1 + feePct / 100);
  const qty = effective ? amount / effective : 0;
  const grams24 = priceFor({ currency: state.selectedCurrency, karat: '24', unit: 'gram' }) ? amount / priceFor({ currency: state.selectedCurrency, karat: '24', unit: 'gram' }) : 0;

  const cards = [
    cardBlock('Buyable quantity', qty ? `${qty.toFixed(qty >= 10 ? 2 : 4)} ${selectedUnitShort()}` : '—', `At ${state.selectedCurrency} ${state.selectedKarat}`),
    cardBlock('Effective unit price', effective ? formatPrice(effective, state.selectedCurrency, 2) : '—', `Fee ${feePct.toFixed(2)}%`),
    cardBlock('24K benchmark', grams24 ? `${grams24.toFixed(grams24 >= 10 ? 2 : 4)} g` : '—', 'Bullion-equivalent grams'),
  ];
  el.budgetResults.innerHTML = cards.join('');
}

function renderPosition() {
  const entry = number(el.positionEntry.value);
  const qty = number(el.positionQty.value);
  const current = priceFor();
  const currentValue = current * qty;
  const cost = entry * qty;
  const pl = currentValue - cost;
  const plPct = cost ? (pl / cost) * 100 : null;
  const info = formatDelta(plPct, true);

  const cards = [
    cardBlock('Current value', qty ? formatPrice(currentValue, state.selectedCurrency, 2) : '—', 'Live selected price'),
    cardBlock('P/L', qty && entry ? formatPrice(pl, state.selectedCurrency, 2) : '—', 'Absolute change', pl >= 0 ? 'tracker-pos' : pl < 0 ? 'tracker-neg' : 'tracker-neutral'),
    cardBlock('P/L %', plPct === null ? '—' : info.text, 'Versus cost basis', info.cls),
  ];
  el.positionResults.innerHTML = cards.join('');
}

function renderJewelry() {
  const weight = number(el.jewelryWeight.value);
  const karat = el.jewelryKarat.value;
  const making = number(el.jewelryMaking.value);
  const premium = number(el.jewelryPremium.value);
  const vatOn = el.jewelryVat.checked;
  const bullionPerGram = priceFor({ currency: state.selectedCurrency, karat, unit: 'gram' });
  const bullion = bullionPerGram * weight;
  const charges = (making * weight) + (bullion * premium / 100);
  const subtotal = bullion + charges;
  const vat = vatOn ? subtotal * 0.05 : 0;
  const total = subtotal + vat;

  const cards = [
    cardBlock('Bullion value', bullion ? formatPrice(bullion, state.selectedCurrency, 2) : '—', `${weight.toFixed(2)} g · ${karat}`),
    cardBlock('Charges + premium', formatPrice(charges, state.selectedCurrency, 2), `Making + ${premium.toFixed(2)}%`),
    cardBlock('Total ticket', total ? formatPrice(total, state.selectedCurrency, 2) : '—', vatOn ? 'VAT on' : 'VAT off'),
  ];
  el.jewelryResults.innerHTML = cards.join('');
}

function cardBlock(k, v, s, cls = 'tracker-neutral') {
  return `
    <article class="tracker-result-card">
      <div class="tracker-result-k">${escapeHtml(k)}</div>
      <div class="tracker-result-v ${cls}">${escapeHtml(v)}</div>
      <div class="tracker-result-s">${escapeHtml(s)}</div>
    </article>
  `;
}

function renderBrief() {
  const current = priceFor();
  const d7 = nearestHistoricChange(7);
  const d30 = nearestHistoricChange(30);
  const y1 = nearestHistoricChange(365);

  let headline = 'Market brief unavailable';
  let copy = 'Waiting for enough live and history data to generate a clean brief.';
  if (current) {
    const bias = (d7 ?? 0) + (d30 ?? 0) * 0.8;
    if ((d7 ?? 0) > 1.5 && (d30 ?? 0) > 4) headline = state.lang === 'ar' ? 'الزخم لا يزال إيجابياً' : 'Momentum is still positive';
    else if ((d7 ?? 0) < -1.5 && (d30 ?? 0) < -4) headline = state.lang === 'ar' ? 'الضغط قصير الأجل لا يزال واضحاً' : 'Short-term pressure is still visible';
    else headline = state.lang === 'ar' ? 'السوق متوازن أكثر من كونه اتجاهياً' : 'The market is mixed, not one-sided';

    copy = `${state.selectedCurrency} ${state.selectedKarat}/${selectedUnitShort()} is currently ${formatPrice(current, state.selectedCurrency, 2)}. ` +
      `7D: ${d7 === null ? 'n/a' : formatDelta(d7)}, 30D: ${d30 === null ? 'n/a' : formatDelta(d30)}, 1Y: ${y1 === null ? 'n/a' : formatDelta(y1)}. ` +
      `${bias > 5 ? 'Momentum is strong enough that buyers should watch stretch risk.' : bias < -5 ? 'The market is softer than recent periods, which may improve entry levels for patient buyers.' : 'The market is mixed enough that premium, timing, and comparison shopping matter more than chasing a move.'}`;
  }

  el.briefHeadline.textContent = headline;
  el.briefCopy.textContent = copy;
}

function nearestHistoricChange(days) {
  const target = Date.now() - days * 86400000;
  if (!state.history.length) return null;
  let best = state.history[0];
  let diff = Infinity;
  state.history.forEach(row => {
    const current = Math.abs(row.date.getTime() - target);
    if (current < diff) {
      best = row;
      diff = current;
    }
  });
  const now = priceFor();
  const then = priceFor({ currency: state.selectedCurrency, karat: state.selectedKarat, unit: state.selectedUnit, spot: best.spot });
  return percentFrom(then, now);
}

function renderArchive() {
  const range = el.archiveRange.value;
  const search = el.archiveSearch.value.trim().toLowerCase();
  let rows = state.history.map(row => ({
    date: row.date,
    spot: row.spot,
    selected: priceFor({ currency: state.selectedCurrency, karat: state.selectedKarat, unit: state.selectedUnit, spot: row.spot }),
    uae24: priceFor({ currency: 'AED', karat: '24', unit: 'gram', spot: row.spot }),
    source: describeLayer(row.source),
  }));

  if (range !== 'ALL') {
    const start = rangeStart(range).getTime();
    rows = rows.filter(row => row.date.getTime() >= start);
  }

  if (search) {
    rows = rows.filter(row => {
      const hay = `${row.date.toISOString().slice(0, 10)} ${row.source}`.toLowerCase();
      return hay.includes(search);
    });
  }

  rows = rows.sort((a, b) => b.date - a.date).slice(0, 300);
  state.lastArchiveRows = rows;

  if (!rows.length) {
    el.archiveBody.innerHTML = `<tr><td colspan="5"><div class="tracker-empty">${escapeHtml(t('noArchive'))}</div></td></tr>`;
    return;
  }

  el.archiveBody.innerHTML = rows.map(row => `
    <tr>
      <td>${escapeHtml(row.date.toISOString().slice(0, 10))}</td>
      <td>${escapeHtml(formatPrice(row.spot, 'USD', 2))}</td>
      <td>${escapeHtml(formatPrice(row.selected, state.selectedCurrency, 2))}</td>
      <td>${escapeHtml(formatPrice(row.uae24, 'AED', 2))}</td>
      <td>${escapeHtml(row.source)}</td>
    </tr>
  `).join('');
}

function runLookup() {
  const raw = el.lookupDate.value;
  if (!raw) {
    toast(t('closestPoint'), t('lookupPrompt'));
    return;
  }
  const target = new Date(raw).getTime();
  if (!state.history.length) {
    toast(t('closestPoint'), t('loading'));
    return;
  }
  let best = state.history[0];
  let diff = Infinity;
  state.history.forEach(row => {
    const current = Math.abs(row.date.getTime() - target);
    if (current < diff) {
      best = row;
      diff = current;
    }
  });

  const selectedThen = priceFor({ currency: state.selectedCurrency, karat: state.selectedKarat, unit: state.selectedUnit, spot: best.spot });
  const gapDays = Math.round(diff / 86400000);
  const cards = [
    cardBlock(t('lookupDate'), best.date.toISOString().slice(0, 10), gapDays === 0 ? 'Exact match' : `${gapDays} day gap`),
    cardBlock(t('spotPerOz'), formatPrice(best.spot, 'USD', 2), describeLayer(best.source)),
    cardBlock(t('matchedPrice'), formatPrice(selectedThen, state.selectedCurrency, 2), `${state.selectedCurrency} · ${state.selectedKarat}`),
  ];
  el.lookupResults.innerHTML = cards.join('');
}

function renderWire() {
  if (!state.liveWireOn) {
    el.wireTrack.innerHTML = `<span class="tracker-wire-item">${escapeHtml(t('noWire'))}</span>`;
    return;
  }

  if (!state.wireItems.length) {
    el.wireTrack.innerHTML = `<span class="tracker-wire-item">${escapeHtml(t('loadingWire'))}</span>`;
    return;
  }

  const items = [...state.wireItems, ...state.wireItems].map(item => {
    const label = [item.domain, item.seenDate].filter(Boolean).join(' · ');
    return `
      <span class="tracker-wire-item">
        ${item.url ? `<a href="${item.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(item.title)}</a>` : escapeHtml(item.title)}
        ${label ? `<span class="tracker-dense-note">${escapeHtml(label)}</span>` : ''}
      </span>
    `;
  }).join('');
  el.wireTrack.innerHTML = items;
}

function exportVisibleChartCsv() {
  const rows = state.lastRangeRows.map(row => ({
    date: row.date.toISOString(),
    spot_usd_oz: row.spot,
    selected_value: row.selected,
    compare_value: row.compare,
    visible_value: valueForRow(row),
    source: describeLayer(row.source),
  }));
  downloadText(toCsv(rows), `tracker-visible-chart-${stamp()}.csv`, 'text/csv;charset=utf-8');
  toast(t('exportReady'), t('exportChart'));
}

function exportVisibleArchiveCsv() {
  const rows = state.lastArchiveRows.map(row => ({
    date: row.date.toISOString().slice(0, 10),
    spot_usd_oz: row.spot,
    selected_value: row.selected,
    uae24_per_gram: row.uae24,
    source: row.source,
  }));
  downloadText(toCsv(rows), `tracker-visible-archive-${stamp()}.csv`, 'text/csv;charset=utf-8');
  toast(t('exportReady'), t('exportArchive'));
}

function exportFullHistoryCsv() {
  const rows = state.history.map(row => ({
    date: row.date.toISOString().slice(0, 10),
    spot_usd_oz: row.spot,
    source: describeLayer(row.source),
  }));
  downloadText(toCsv(rows), `tracker-full-history-${stamp()}.csv`, 'text/csv;charset=utf-8');
  toast(t('exportReady'), t('exportHistory'));
}

function exportWatchlistCsv() {
  const rows = marketRows().filter(row => state.favorites.includes(row.currency)).map(row => ({
    currency: row.currency,
    country: row.nameEn,
    selected_price: row.price,
    diff_vs_selected_currency_pct: row.diff,
  }));
  downloadText(toCsv(rows), `tracker-watchlist-${stamp()}.csv`, 'text/csv;charset=utf-8');
  toast(t('exportReady'), t('exportWatchlist'));
}

function exportSnapshotJson() {
  const payload = {
    exportedAt: new Date().toISOString(),
    selected: {
      currency: state.selectedCurrency,
      karat: state.selectedKarat,
      unit: state.selectedUnit,
      compareCurrency: state.compareCurrency,
      range: state.range,
      metric: state.metric,
      lang: state.lang,
    },
    live: state.live,
    fxMeta: state.fxMeta,
    currentSpot: currentSpot(),
    favorites: state.favorites,
    alerts: state.alerts,
    visibleRows: state.lastRangeRows,
  };
  downloadText(JSON.stringify(payload, null, 2), `tracker-snapshot-${stamp()}.json`, 'application/json;charset=utf-8');
  toast(t('exportReady'), t('snapshotJson'));
}

function downloadBrief() {
  const lines = [
    `Generated: ${new Date().toISOString()}`,
    `View: ${state.selectedCurrency} ${state.selectedKarat} ${state.selectedUnit}`,
    `Compare: ${state.compareCurrency}`,
    `Current: ${priceFor() ? formatPrice(priceFor(), state.selectedCurrency, 2) : 'n/a'}`,
    `7D: ${nearestHistoricChange(7) === null ? 'n/a' : formatDelta(nearestHistoricChange(7))}`,
    `30D: ${nearestHistoricChange(30) === null ? 'n/a' : formatDelta(nearestHistoricChange(30))}`,
    `1Y: ${nearestHistoricChange(365) === null ? 'n/a' : formatDelta(nearestHistoricChange(365))}`,
    '',
    el.briefHeadline.textContent,
    el.briefCopy.textContent,
  ].join('\n');
  downloadText(lines, `tracker-brief-${stamp()}.txt`, 'text/plain;charset=utf-8');
  toast(t('exportReady'), t('exportBrief'));
}

function copyQuickBrief() {
  const text = [
    'Gold Tracker Pro',
    `${t('spotPerOz')}: ${formatPrice(currentSpot(), 'USD', 2)}`,
    `${t('selectedPrice')}: ${formatPrice(priceFor(), state.selectedCurrency, 2)} (${state.selectedCurrency}/${state.selectedKarat}/${state.selectedUnit})`,
    `7D: ${nearestHistoricChange(7) === null ? 'n/a' : formatDelta(nearestHistoricChange(7))}`,
    `30D: ${nearestHistoricChange(30) === null ? 'n/a' : formatDelta(nearestHistoricChange(30))}`,
  ].join('\n');
  navigator.clipboard.writeText(text).then(() => toast(t('summaryCopied'), text.split('\n')[1]));
}

function copyShareUrl() {
  syncUrlState();
  navigator.clipboard.writeText(location.href).then(() => toast(t('shareCopied'), location.href));
}

function syncUrlState() {
  const url = new URL(location.href);
  url.searchParams.set('currency', state.selectedCurrency);
  url.searchParams.set('karat', state.selectedKarat);
  url.searchParams.set('unit', state.selectedUnit);
  url.searchParams.set('compare', state.compareCurrency);
  url.searchParams.set('range', state.range);
  url.searchParams.set('metric', state.metric);
  url.searchParams.set('lang', state.lang);
  history.replaceState({}, '', url);
}

function readUrlState() {
  const url = new URL(location.href);
  state.selectedCurrency = url.searchParams.get('currency') || state.selectedCurrency;
  state.selectedKarat = url.searchParams.get('karat') || state.selectedKarat;
  state.selectedUnit = url.searchParams.get('unit') || state.selectedUnit;
  state.compareCurrency = url.searchParams.get('compare') || state.compareCurrency;
  state.range = url.searchParams.get('range') || state.range;
  state.metric = url.searchParams.get('metric') || state.metric;
  state.lang = url.searchParams.get('lang') || state.lang;
}

function resetState() {
  state.selectedCurrency = 'AED';
  state.selectedKarat = '24';
  state.selectedUnit = 'gram';
  state.compareCurrency = 'USD';
  state.range = '30D';
  state.metric = 'selected';
  state.favoritesOnly = false;
  state.liveWireOn = true;
  state.autoRefresh = true;
  updateTimers();
  savePersistentState();
  syncUrlState();
  renderAll();
  toast('Tracker', t('resetDone'));
}

function toCsv(rows) {
  if (!rows.length) return '';
  const head = Object.keys(rows[0]);
  const lines = [head.join(',')];
  rows.forEach(row => {
    lines.push(head.map(key => csvCell(row[key])).join(','));
  });
  return lines.join('\n');
}

function csvCell(value) {
  const text = value == null ? '' : String(value);
  return /[,"\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadText(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function stamp() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function init() {
  Object.assign(el, ui());
  loadPersistentState();
  readUrlState();

  document.documentElement.lang = state.lang;
  document.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr';

  mountSharedShell();
  await initDataFromSharedCache();
  setSelectOptions();
  bindEvents();
  updateTimers();
  renderAll();
  await refreshAll(false);
}

init();
