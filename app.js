import { CONSTANTS, KARATS, COUNTRIES, TRANSLATIONS } from './config/index.js';
import * as cache from './lib/cache.js';
import * as api from './lib/api.js';
import * as calc from './lib/price-calculator.js';
import * as fmt from './lib/formatter.js';
import * as search from './lib/search.js';
import * as exp from './lib/export.js';
import * as history from './lib/history.js';
import * as debug from './lib/debug.js';
import { getUnifiedHistory, getBaselineHistory, getHistoryStats } from './lib/historical-data.js';
import { GoldChart } from './components/chart.js';
import { injectNav, updateNavLang } from './components/nav.js';
import { injectFooter } from './components/footer.js';
import { injectTicker, updateTicker, updateTickerLang } from './components/ticker.js';
import * as alerts from './lib/alerts.js';

// ─────────────────────────────────────────────────────────────────────────────
// COUNTRY PAGE MAP
// ─────────────────────────────────────────────────────────────────────────────

const COUNTRY_PAGES = {
  'AE': 'countries/uae.html',
  'SA': 'countries/saudi-arabia.html',
  'KW': 'countries/kuwait.html',
  'QA': 'countries/qatar.html',
  'BH': 'countries/bahrain.html',
  'OM': 'countries/oman.html',
  'EG': 'countries/egypt.html',
  'JO': 'countries/jordan.html',
  'MA': 'countries/morocco.html',
  'IN': 'countries/india.html',
};

// ─────────────────────────────────────────────────────────────────────────────
// STATE
// ─────────────────────────────────────────────────────────────────────────────

const STATE = {
  lang: 'en',
  activeTab: 'gcc',
  selectedKaratSpotlight: '24',
  selectedKaratCountries: '24',
  selectedUnitTable: 'gram',
  sortOrder: 'high-low',
  searchQuery: '',
  favorites: [],

  goldPriceUsdPerOz: null,
  prevGoldPriceUsdPerOz: null,
  dayOpenGoldPriceUsdPerOz: null,

  rates: {},
  fxMeta: { lastUpdateUtc: null, nextUpdateUtc: 0 },
  freshness: { goldUpdatedAt: null, fxUpdatedAt: null },
  status: { goldStale: false, fxStale: false, goldError: null, fxError: null },

  isOnline: navigator.onLine,
  history: [],
  volatility7d: null,
  cacheHealthScore: 0,
};

let _prices = {};
let _goldRefreshTimestamp = 0;
let _listenersSetup = false; // guard against duplicate registration on retry
let _timerIds = [];          // stored so startTimers() can guard against double-start
let _chart = null;           // GoldChart instance

// ─────────────────────────────────────────────────────────────────────────────
// TRANSLATION
// ─────────────────────────────────────────────────────────────────────────────

function t(key) {
  return TRANSLATIONS[STATE.lang]?.[key] ?? TRANSLATIONS.en[key] ?? key;
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA FETCHING
// ─────────────────────────────────────────────────────────────────────────────

async function fetchGoldData() {
  try {
    const data = await api.fetchGold();
    STATE.prevGoldPriceUsdPerOz = STATE.goldPriceUsdPerOz;
    STATE.goldPriceUsdPerOz = data.price;
    STATE.freshness.goldUpdatedAt = data.updatedAt;
    STATE.status.goldError = null;
    STATE.status.goldStale = false;
    _goldRefreshTimestamp = Date.now();
    cache.saveGoldPrice(data.price, data.updatedAt);
    cache.checkDayOpenReset(STATE);
    cache.saveHistorySnapshot(STATE);
    history.updateVolatility(STATE);
    if (_chart) _chart.addPoint(data.price, data.updatedAt);
    alerts.checkAlerts(data.price);
  } catch (err) {
    console.warn('[gold] fetch failed:', err.message);
    STATE.status.goldError = err.message;
    STATE.status.goldStale = true;
    if (!STATE.goldPriceUsdPerOz) {
      const fb = cache.getFallbackGoldPrice();
      if (fb) {
        STATE.goldPriceUsdPerOz = fb.price;
        STATE.freshness.goldUpdatedAt = fb.updatedAt;
      }
    }
  }
}

async function fetchFXData() {
  if (STATE.fxMeta.nextUpdateUtc && Date.now() < STATE.fxMeta.nextUpdateUtc) return;
  try {
    const data = await api.fetchFX();
    STATE.rates = data.rates;
    STATE.fxMeta.lastUpdateUtc = data.time_last_update_utc;
    STATE.fxMeta.nextUpdateUtc = new Date(data.time_next_update_utc).getTime();
    STATE.freshness.fxUpdatedAt = data.time_last_update_utc;
    STATE.status.fxError = null;
    STATE.status.fxStale = false;
    cache.saveFXRates(data.rates, {
      lastUpdateUtc: data.time_last_update_utc,
      nextUpdateUtc: data.time_next_update_utc,
    });
  } catch (err) {
    console.warn('[fx] fetch failed:', err.message);
    STATE.status.fxError = err.message;
    STATE.status.fxStale = true;
    if (!Object.keys(STATE.rates).length) {
      const fb = cache.getFallbackFXRates();
      if (fb) STATE.rates = fb.rates || {};
    }
  }
}

function recalcPrices() {
  _prices = calc.calculateAllPrices(STATE.goldPriceUsdPerOz, STATE.rates, KARATS, COUNTRIES);
}

// ─────────────────────────────────────────────────────────────────────────────
// MARKET STATUS
// ─────────────────────────────────────────────────────────────────────────────

function getMarketStatus() {
  const now     = new Date();
  const utcDay  = now.getUTCDay(); // 0=Sun … 6=Sat
  const utcHour = now.getUTCHours();
  const utcMin  = now.getUTCMinutes();
  const utcTime = utcHour * 60 + utcMin;

  const OPEN_SUN  = 22 * 60; // Sun 22:00 UTC
  const CLOSE_FRI = 21 * 60; // Fri 21:00 UTC

  if (utcDay === 6) return 'closed';                      // Saturday always closed
  if (utcDay === 5 && utcTime >= CLOSE_FRI) return 'closed'; // Fri after 21:00 UTC
  if (utcDay === 0 && utcTime < OPEN_SUN)  return 'closed'; // Sun before 22:00 UTC
  return 'open';
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDER — HEADER
// ─────────────────────────────────────────────────────────────────────────────

function renderHeader() {
  // Gold time chip
  const goldTime = document.getElementById('gold-freshness-time');
  if (goldTime) {
    goldTime.textContent = STATE.freshness.goldUpdatedAt
      ? fmt.formatTimestampShort(STATE.freshness.goldUpdatedAt, STATE.lang)
      : '—';
  }

  // FX date chip
  const fxTime = document.getElementById('fx-freshness-time');
  if (fxTime) {
    fxTime.textContent = STATE.freshness.fxUpdatedAt
      ? fmt.formatDate(STATE.freshness.fxUpdatedAt, STATE.lang)
      : '—';
  }

  // Market status chip
  const marketChip = document.getElementById('market-status-chip');
  if (marketChip) {
    const status = getMarketStatus();
    const isAr = STATE.lang === 'ar';
    const labels = {
      open:   isAr ? '● السوق مفتوح' : '● Market Open',
      closed: isAr ? '○ السوق مغلق' : '○ Market Closed',
    };
    marketChip.textContent = labels[status] ?? labels.closed;
    marketChip.className = `freshness-chip chip-market chip-market--${status}`;
    marketChip.hidden = false;
  }

  // Offline banner — only when truly offline
  const offlineBanner = document.getElementById('offline-banner');
  if (offlineBanner) offlineBanner.hidden = STATE.isOnline;

  // Error/stale banner — show only when stale AND had a real error
  const errBanner = document.getElementById('error-banner');
  const errText = document.getElementById('error-banner-text');
  if (errBanner && errText) {
    const msgs = [];
    if (STATE.status.goldStale && STATE.status.goldError) msgs.push(t('status.goldStale'));
    if (STATE.status.fxStale && STATE.status.fxError) msgs.push(t('status.fxStale'));
    errBanner.hidden = msgs.length === 0;
    errText.textContent = msgs.join(' · ');
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDER — UAE SPOTLIGHT
// ─────────────────────────────────────────────────────────────────────────────

function renderSpotlightPills() {
  const c = document.getElementById('spotlight-karat-pills');
  if (!c) return;
  c.innerHTML = ['24', '22', '21', '18'].map(code => `
    <button class="karat-pill${STATE.selectedKaratSpotlight === code ? ' active' : ''}"
      data-selector="spotlight" data-karat="${code}"
      aria-pressed="${STATE.selectedKaratSpotlight === code}">${code}K</button>
  `).join('');
}

function renderSpotlight() {
  renderSpotlightPills();
  const grid = document.getElementById('spotlight-grid');
  if (!grid) return;

  const k = STATE.selectedKaratSpotlight;
  const p = _prices[k];

  if (!p) {
    // Leave skeleton cards in place while loading
    return;
  }

  const purityMap = { '24': '99.9%', '22': '91.7%', '21': '87.5%', '18': '75.0%' };
  const purityNote = purityMap[k] || '';

  const cards = [
    { labelKey: 'spotlight.perOzUsd',   val: p.USD?.oz,   cur: 'USD', aed: false },
    { labelKey: 'spotlight.perOzAed',   val: p.AED?.oz,   cur: 'AED', aed: true  },
    { labelKey: 'spotlight.perGramUsd', val: p.USD?.gram, cur: 'USD', aed: false },
    { labelKey: 'spotlight.perGramAed', val: p.AED?.gram, cur: 'AED', aed: true  },
  ];

  grid.innerHTML = cards.map(card => `
    <div class="spotlight-card${card.aed ? ' aed-card' : ''}">
      <div class="sc-label">${t(card.labelKey)}</div>
      <div class="sc-price">${fmt.formatPrice(card.val, card.cur, 2)}</div>
      <div class="sc-purity">${purityNote} pure</div>
      ${card.aed ? `<div class="sc-badge"><span class="badge badge-fixed">${t('aed.badge')}</span></div>` : ''}
    </div>
  `).join('');
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDER — CHANGE PANEL
// ─────────────────────────────────────────────────────────────────────────────

function renderChangePanel() {
  const section = document.getElementById('section-change');
  if (!section) return;

  const curr = STATE.goldPriceUsdPerOz;
  const prev = STATE.prevGoldPriceUsdPerOz;
  const open = STATE.dayOpenGoldPriceUsdPerOz;

  if (!curr || (!prev && !open)) { section.hidden = true; return; }
  section.hidden = false;

  function applyChange(elId, delta, base) {
    const el = document.getElementById(elId);
    if (!el) return;
    const r = fmt.formatPercentChange(delta, base);
    el.textContent = `${r.text}  (${r.value} USD)`;
    el.className = `change-value ${r.direction}`;
  }

  if (prev) applyChange('change-prev-value', curr - prev, prev);
  if (open) applyChange('change-open-value', curr - open, open);

  const noteEl = document.getElementById('change-context-note');
  if (noteEl && STATE.goldPriceUsdPerOz) {
    const roundedPrice = Math.round(STATE.goldPriceUsdPerOz);
    noteEl.textContent = `Current: $${roundedPrice.toLocaleString()} XAU/USD`;
    noteEl.hidden = false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDER — KARAT TABLE
// ─────────────────────────────────────────────────────────────────────────────

function renderKaratTable() {
  const tbody = document.getElementById('karat-tbody');
  if (!tbody || !STATE.goldPriceUsdPerOz) return;

  const unit = STATE.selectedUnitTable;

  tbody.innerHTML = KARATS.map(k => {
    const usdVal = unit === 'gram'
      ? calc.usdPerGram(STATE.goldPriceUsdPerOz, k.purity)
      : calc.usdPerOz(STATE.goldPriceUsdPerOz, k.purity);
    const aedVal = usdVal * CONSTANTS.AED_PEG;
    const rowCls = k.code === '24' ? 'row-24k' : k.code === '22' ? 'row-22k' : k.code === '21' ? 'row-21k' : '';
    const label = STATE.lang === 'ar' ? k.labelAr : k.labelEn;

    const purityPct = Math.round(k.purity * 100);
    const barWidth  = Math.round(k.purity * 80); // max 80px
    return `<tr class="${rowCls}">
      <td class="karat-label-cell">
        <strong>${label}</strong>
        <span class="karat-purity-bar" style="width:${barWidth}px" aria-hidden="true"></span>
        <span class="karat-purity-label">${purityPct}%</span>
      </td>
      <td class="num-col">${fmt.formatPrice(usdVal, 'USD', 2)}</td>
      <td class="num-col">${fmt.formatPrice(aedVal, 'AED', 2)}</td>
    </tr>`;
  }).join('');
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDER — COUNTRY GRID
// ─────────────────────────────────────────────────────────────────────────────

function renderCountriesPills() {
  const c = document.getElementById('countries-karat-pills');
  if (!c) return;
  c.innerHTML = ['24', '22', '21', '18'].map(code => `
    <button class="karat-pill${STATE.selectedKaratCountries === code ? ' active' : ''}"
      data-selector="countries" data-karat="${code}"
      aria-pressed="${STATE.selectedKaratCountries === code}">${code}K</button>
  `).join('');
}

function sortCountries(a, b, karat) {
  if (STATE.sortOrder === 'alpha') {
    const na = STATE.lang === 'ar' ? a.nameAr : a.nameEn;
    const nb = STATE.lang === 'ar' ? b.nameAr : b.nameEn;
    return na.localeCompare(nb, STATE.lang === 'ar' ? 'ar' : 'en');
  }
  const fallback = STATE.sortOrder === 'low-high' ? Infinity : -1;
  const pa = _prices[karat]?.[a.currency]?.gram ?? fallback;
  const pb = _prices[karat]?.[b.currency]?.gram ?? fallback;
  return STATE.sortOrder === 'low-high' ? pa - pb : pb - pa;
}

function renderCountryGrid() {
  renderCountriesPills();
  const grid = document.getElementById('country-grid');
  const emptyEl = document.getElementById('country-empty');
  const emptyQuery = document.getElementById('country-empty-query');
  if (!grid) return;

  const karat = STATE.selectedKaratCountries;
  const unit = STATE.selectedUnitTable;

  const filtered = COUNTRIES
    .filter(c => c.group === STATE.activeTab)
    .filter(c => search.matchesQuery(c, STATE.searchQuery, STATE.lang))
    .sort((a, b) => sortCountries(a, b, karat));

  if (filtered.length === 0) {
    grid.innerHTML = '';
    if (emptyEl) {
      emptyEl.hidden = false;
      if (emptyQuery) emptyQuery.textContent = STATE.searchQuery ? `"${STATE.searchQuery}"` : '';
    }
    return;
  }
  if (emptyEl) emptyEl.hidden = true;

  grid.innerHTML = filtered.map(country => {
    const pd = _prices[karat]?.[country.currency];
    const gram = pd?.gram;
    const oz = pd?.oz;
    const isFav = STATE.favorites.includes(country.code);
    const isStale = STATE.status.fxStale && !country.fixedPeg;
    const noData = gram == null;
    const name = STATE.lang === 'ar' ? country.nameAr : country.nameEn;

    const gramFmt = noData ? t('card.noData') : fmt.formatPrice(gram, country.currency, country.decimals);
    const ozFmt   = noData ? '—' : fmt.formatPrice(oz, country.currency, country.decimals);
    const primary       = unit === 'gram' ? gramFmt : ozFmt;
    const secondary     = unit === 'gram' ? ozFmt   : gramFmt;
    const primaryUnit   = unit === 'gram' ? t('card.perGram') : t('card.perOz');
    const secondaryUnit = unit === 'gram' ? t('card.perOz')   : t('card.perGram');

    // Small movement indicator using day open
    const dayOpenUsd = STATE.dayOpenGoldPriceUsdPerOz;
    const currentUsd = STATE.goldPriceUsdPerOz;
    let movementHtml = '';
    if (dayOpenUsd && currentUsd && !noData) {
      const pct = ((currentUsd - dayOpenUsd) / dayOpenUsd) * 100;
      if (Math.abs(pct) >= 0.01) {
        const dir = pct >= 0 ? 'up' : 'down';
        const arrow = pct >= 0 ? '▲' : '▼';
        const sign = pct >= 0 ? '+' : '';
        movementHtml = `<span class="cc-movement cc-movement--${dir}" aria-label="${sign}${pct.toFixed(2)}%">${arrow} ${sign}${pct.toFixed(2)}%</span>`;
      }
    }

    // Country page link
    const countryPageHref = COUNTRY_PAGES[country.code];
    const countryPageHtml = countryPageHref
      ? `<a href="${countryPageHref}" class="cc-country-link" tabindex="0">${STATE.lang === 'ar' ? 'صفحة التفاصيل →' : 'Details →'}</a>`
      : '';

    return `
    <article class="country-card${isStale ? ' stale-card' : ''}${noData ? ' no-data-card' : ''}"
      role="listitem" aria-label="${name}">
      <div class="cc-header">
        <span class="cc-flag" aria-hidden="true">${country.flag}</span>
        <div class="cc-meta">
          <span class="cc-name">${name}</span>
          <span class="cc-currency">${country.currency}</span>
        </div>
        <button class="fav-btn${isFav ? ' active' : ''}" data-country="${country.code}"
          aria-label="${isFav ? t('card.removeFavorite') : t('card.addFavorite')}"
          aria-pressed="${isFav}">${isFav ? '★' : '☆'}</button>
      </div>
      <div class="cc-badges">
        <span class="badge badge-karat">${karat}K</span>
        ${country.fixedPeg ? `<span class="badge badge-fixed">${t('aed.badge')}</span>` : ''}
        ${isStale ? `<span class="badge badge-stale">${t('card.stale')}</span>` : ''}
      </div>
      <div class="cc-price-block">
        <div class="cc-price-main">${primary}</div>
        <div class="cc-price-unit">${primaryUnit}</div>
        ${movementHtml}
      </div>
      <div class="cc-price-secondary">
        ${secondary} <span class="cc-price-unit">${secondaryUnit}</span>
      </div>
      <div class="cc-actions">
        <button class="copy-btn"
          data-price="${gramFmt}" data-currency="${country.currency}"
          data-karat="${karat}" data-country="${country.code}"
          aria-label="${t('card.copy')} ${name}">${t('card.copy')}</button>
      </div>
      ${countryPageHtml}
    </article>`;
  }).join('');
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDER — TICKER
// ─────────────────────────────────────────────────────────────────────────────

function renderTicker() {
  if (!STATE.goldPriceUsdPerOz) return;
  const karatPurities = { '24': 1, '22': 22/24, '21': 21/24, '18': 18/24 };
  const TROY_OZ_GRAMS = 31.1035;
  const AED_PEG = 3.6725;
  updateTicker({
    xauUsd:  STATE.goldPriceUsdPerOz,
    uae24k:  (STATE.goldPriceUsdPerOz * karatPurities['24'] / TROY_OZ_GRAMS) * AED_PEG,
    uae22k:  (STATE.goldPriceUsdPerOz * karatPurities['22'] / TROY_OZ_GRAMS) * AED_PEG,
    uae21k:  (STATE.goldPriceUsdPerOz * karatPurities['21'] / TROY_OZ_GRAMS) * AED_PEG,
    uae18k:  (STATE.goldPriceUsdPerOz * karatPurities['18'] / TROY_OZ_GRAMS) * AED_PEG,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDER — ALL
// ─────────────────────────────────────────────────────────────────────────────

function renderAll() {
  renderHeader();
  renderSpotlight();
  renderChangePanel();
  renderKaratTable();
  renderCountryGrid();
  renderTicker();
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDER — HISTORY STATS STRIP
// ─────────────────────────────────────────────────────────────────────────────

function renderHistoryStats() {
  const statsEl = document.getElementById('history-stats-strip');
  if (!statsEl) return;

  const records = getUnifiedHistory(STATE.history || []);
  const stats   = getHistoryStats(records);

  function fmtPct(v) {
    if (v == null) return '—';
    const sign = v >= 0 ? '+' : '';
    return `${sign}${v.toFixed(1)}%`;
  }
  function fmtPrice(v) {
    if (v == null) return '—';
    return `$${Math.round(v).toLocaleString()}`;
  }

  statsEl.innerHTML = `
    <div class="hs-item">
      <span class="hs-label">${t('stats.ath')}</span>
      <span class="hs-value">${fmtPrice(stats.allTimeHigh)}</span>
    </div>
    <div class="hs-item">
      <span class="hs-label">${t('stats.ytd')}</span>
      <span class="hs-value hs-value--${stats.ytdChange >= 0 ? 'up' : 'down'}">${fmtPct(stats.ytdChange)}</span>
    </div>
    <div class="hs-item">
      <span class="hs-label">${t('stats.yoy')}</span>
      <span class="hs-value hs-value--${stats.yoyChange >= 0 ? 'up' : 'down'}">${fmtPct(stats.yoyChange)}</span>
    </div>
    <div class="hs-item">
      <span class="hs-label">${t('stats.since2019')}</span>
      <span class="hs-value">${fmtPrice(1286)} → ${fmtPrice(stats.latest)}</span>
    </div>
  `;
  statsEl.hidden = false;
}

// ─────────────────────────────────────────────────────────────────────────────
// LANGUAGE
// ─────────────────────────────────────────────────────────────────────────────

function applyLanguage() {
  document.documentElement.lang = STATE.lang;
  document.documentElement.dir = STATE.lang === 'ar' ? 'rtl' : 'ltr';

  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('#sort-select option[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  const langBtn = document.getElementById('lang-toggle');
  if (langBtn) langBtn.textContent = t('lang.toggle');

  renderAll();
}

// ─────────────────────────────────────────────────────────────────────────────
// SYNC UI FROM STATE
// Restores visual state of buttons/selects from loaded STATE after page load.
// ─────────────────────────────────────────────────────────────────────────────

function syncUIFromState() {
  // Unit toggle buttons
  document.querySelectorAll('.unit-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.unit === STATE.selectedUnitTable);
  });
  // Tab active state
  document.querySelectorAll('[data-tab]').forEach(tab => {
    const active = tab.dataset.tab === STATE.activeTab;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
  });
  // Sort select
  const sortEl = document.getElementById('sort-select');
  if (sortEl) sortEl.value = STATE.sortOrder;
}

// ─────────────────────────────────────────────────────────────────────────────
// COUNTDOWN
// ─────────────────────────────────────────────────────────────────────────────

function updateCountdown() {
  const el = document.getElementById('gold-countdown');
  if (!el || _goldRefreshTimestamp === 0) return;
  const remaining = Math.max(0, CONSTANTS.GOLD_REFRESH_MS - (Date.now() - _goldRefreshTimestamp));
  el.textContent = fmt.formatCountdown(remaining);
}

// ─────────────────────────────────────────────────────────────────────────────
// TIMERS
// ─────────────────────────────────────────────────────────────────────────────

function startTimers() {
  if (_timerIds.length) return; // guard: never start twice
  _timerIds.push(setInterval(async () => {
    if (!STATE.isOnline) return;
    await fetchGoldData();
    await fetchFXData();
    recalcPrices();
    renderAll();
  }, CONSTANTS.GOLD_REFRESH_MS));
  _timerIds.push(setInterval(updateCountdown, 1000));
}

// ─────────────────────────────────────────────────────────────────────────────
// EVENT LISTENERS
// ─────────────────────────────────────────────────────────────────────────────

function setupEventListeners() {
  // Guard: never register twice (e.g. when retry re-runs init)
  if (_listenersSetup) return;
  _listenersSetup = true;

  // Language toggle is wired via nav component in init()

  // ── Unit toggle (Per Gram / Per Ounce) ───────────────────────────────────
  function setUnit(unit) {
    STATE.selectedUnitTable = unit;
    cache.savePreference('unit', unit);
    document.querySelectorAll('.unit-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.unit === unit);
    });
    renderKaratTable();
    renderCountryGrid();
  }
  document.getElementById('unit-gram')?.addEventListener('click', () => setUnit('gram'));
  document.getElementById('unit-oz')?.addEventListener('click', () => setUnit('oz'));

  // ── Karat pills — delegated (works on dynamically rendered pills) ─────────
  document.addEventListener('click', e => {
    const btn = e.target.closest('.karat-pill');
    if (!btn) return;
    const { karat, selector } = btn.dataset;
    if (selector === 'spotlight') {
      STATE.selectedKaratSpotlight = karat;
      cache.savePreference('selectedKaratSpotlight', karat);
      renderSpotlight();
    } else if (selector === 'countries') {
      STATE.selectedKaratCountries = karat;
      cache.savePreference('selectedKarat', karat);
      renderCountryGrid();
    }
  });

  // ── Country tabs ─────────────────────────────────────────────────────────
  document.querySelectorAll('[data-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      STATE.activeTab = tab.dataset.tab;
      cache.savePreference('activeTab', STATE.activeTab);
      // Clear search when switching tabs for clean UX
      STATE.searchQuery = '';
      const searchInput = document.getElementById('search-input');
      if (searchInput) searchInput.value = '';
      document.querySelectorAll('[data-tab]').forEach(t => {
        const isActive = t.dataset.tab === STATE.activeTab;
        t.classList.toggle('active', isActive);
        t.setAttribute('aria-selected', String(isActive));
      });
      renderCountryGrid();
    });
  });

  // ── Sort ─────────────────────────────────────────────────────────────────
  document.getElementById('sort-select')?.addEventListener('change', e => {
    STATE.sortOrder = e.target.value;
    cache.savePreference('sortOrder', STATE.sortOrder);
    renderCountryGrid();
  });

  // ── Search ───────────────────────────────────────────────────────────────
  document.getElementById('search-input')?.addEventListener('input', e => {
    STATE.searchQuery = e.target.value;
    renderCountryGrid();
  });

  // ── Copy button — delegated ───────────────────────────────────────────────
  document.addEventListener('click', e => {
    const btn = e.target.closest('.copy-btn');
    if (!btn) return;
    const text = `${btn.dataset.price} ${t('card.perGram')} (${btn.dataset.karat}K · ${btn.dataset.currency})`;
    navigator.clipboard?.writeText(text).then(() => {
      const orig = btn.textContent;
      btn.textContent = t('card.copied');
      btn.classList.add('copied');
      setTimeout(() => {
        // Only update if button is still in DOM
        if (btn.isConnected) { btn.textContent = orig; btn.classList.remove('copied'); }
      }, 1400);
    }).catch(() => {});
  });

  // ── Favourite — delegated ─────────────────────────────────────────────────
  document.addEventListener('click', e => {
    const btn = e.target.closest('.fav-btn');
    if (!btn) return;
    const code = btn.dataset.country;
    STATE.favorites = STATE.favorites.includes(code)
      ? STATE.favorites.filter(c => c !== code)
      : [...STATE.favorites, code];
    cache.savePreference('favorites', STATE.favorites);
    renderCountryGrid();
  });

  // ── Workspace tabs (chart/archive/downloads) ──────────────────
  function switchWorkspace(panelId) {
    document.querySelectorAll('.workspace-tab').forEach(t => {
      const isActive = t.dataset.workspace === panelId;
      t.classList.toggle('active', isActive);
      t.setAttribute('aria-selected', String(isActive));
    });
    document.querySelectorAll('.workspace-panel').forEach(p => {
      p.classList.toggle('active', p.dataset.workspacePanel === panelId);
    });
    if (panelId === 'archive') renderArchivePanel();
  }

  document.querySelectorAll('.workspace-tab').forEach(tab => {
    tab.addEventListener('click', () => switchWorkspace(tab.dataset.workspace));
  });

  function renderArchivePanel() {
    const list     = document.getElementById('archive-list');
    const emptyEl  = document.getElementById('archive-empty');
    const countEl  = document.getElementById('archive-count');
    if (!list) return;

    const karat  = document.getElementById('archive-karat-select')?.value || '24';
    const unit   = document.getElementById('archive-unit-select')?.value || 'gram';
    const range  = document.getElementById('archive-range-select')?.value || 'ALL';
    const purity = { '24': 1, '22': 22/24, '21': 21/24, '18': 18/24 }[karat] || 1;
    const TROY   = CONSTANTS.TROY_OZ_GRAMS;
    const AED    = CONSTANTS.AED_PEG;

    // Use unified history: monthly baseline + daily cache
    const allRecords = getUnifiedHistory(STATE.history || []);
    const records    = range === 'ALL' ? allRecords : allRecords.filter(r => {
      const days = { '30D':30, '90D':90, '1Y':365, '3Y':365*3, '5Y':365*5 }[range] || Infinity;
      const cutoff = new Date(Date.now() - days * 86400000).toISOString().slice(0,10);
      return r.date >= cutoff;
    });

    if (countEl) countEl.textContent = `${records.length} ${records.length === 1 ? 'entry' : 'entries'}`;

    if (records.length === 0) {
      list.innerHTML = '';
      if (emptyEl) emptyEl.hidden = false;
      return;
    }
    if (emptyEl) emptyEl.hidden = true;

    const rows = [...records].reverse().map(snap => {
      const pricePerOz = snap.price * purity;
      const usdVal     = unit === 'gram' ? pricePerOz / TROY : pricePerOz;
      const aedVal     = usdVal * AED;
      const isBaseline = snap.granularity === 'monthly';
      const sourceTag  = isBaseline
        ? `<span class="archive-row-source archive-row-source--baseline">monthly avg</span>`
        : `<span class="archive-row-source archive-row-source--local">daily</span>`;

      return `
        <div class="archive-history-row">
          <span class="archive-row-date">${snap.date}</span>
          <div class="archive-row-prices">
            <span class="archive-row-price">$${usdVal.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
            <span class="archive-row-aed">${aedVal.toLocaleString('en-AE', {minimumFractionDigits:2, maximumFractionDigits:2})} AED</span>
          </div>
          <span class="archive-row-unit">${karat}K ${unit === 'gram' ? '/g' : '/oz'}</span>
          ${sourceTag}
        </div>`;
    }).join('');
    list.innerHTML = rows;
  }

  // Wire archive selects
  document.getElementById('archive-karat-select')?.addEventListener('change', renderArchivePanel);
  document.getElementById('archive-unit-select')?.addEventListener('change', renderArchivePanel);
  document.getElementById('archive-range-select')?.addEventListener('change', renderArchivePanel);

  // Archive CSV export (daily cached snapshots)
  document.getElementById('export-archive-csv-btn')?.addEventListener('click', () => {
    const karat = document.getElementById('archive-karat-select')?.value || '24';
    exp.exportArchiveCSV(STATE.history || [], karat, CONSTANTS.AED_PEG);
  });

  // Historical baseline CSV export (monthly 2019-present + daily merged)
  document.getElementById('export-historical-csv-btn')?.addEventListener('click', () => {
    const karat   = document.getElementById('archive-karat-select')?.value || '24';
    const records = getUnifiedHistory(STATE.history || []);
    exp.exportHistoricalCSV(records, karat);
  });

  // ── Export (current snapshot) ────────────────────────────────────────────
  document.getElementById('export-csv-btn')?.addEventListener('click', () => {
    exp.exportCSV(
      COUNTRIES.filter(c => c.group === STATE.activeTab),
      STATE.selectedKaratCountries,
      _prices,
      STATE.lang
    );
  });
  document.getElementById('export-json-btn')?.addEventListener('click', () => {
    exp.exportJSON(STATE, _prices);
  });

  // ── Alerts UI ────────────────────────────────────────────────────────────
  const alertAddBtn    = document.getElementById('alert-add-btn');
  const alertForm      = document.getElementById('alert-form');
  const alertSaveBtn   = document.getElementById('alert-save-btn');
  const alertCancelBtn = document.getElementById('alert-cancel-btn');
  const alertDirEl     = document.getElementById('alert-direction');
  const alertPriceEl   = document.getElementById('alert-price');
  const alertNotifStat = document.getElementById('alert-notif-status');

  function renderAlerts() {
    const list  = document.getElementById('alerts-list');
    const empty = document.getElementById('alerts-empty');
    if (!list) return;
    const all = alerts.loadAlerts();
    if (all.length === 0) {
      list.innerHTML = '';
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;
    list.innerHTML = all.map(a => {
      const dirLabel = STATE.lang === 'ar'
        ? (a.direction === 'above' ? 'يتجاوز' : 'ينخفض عن')
        : (a.direction === 'above' ? 'goes above' : 'drops below');
      const cls = a.direction === 'above' ? 'alert-direction-above' : 'alert-direction-below';
      const status = a.active ? '' : ' alert-item--muted';
      return `
        <div class="alert-item${status}" data-id="${a.id}">
          <div class="alert-item-info">
            <span class="alert-direction-badge ${cls}">${dirLabel}</span>
            <span class="alert-item-price">$${a.targetUsd.toLocaleString()}</span>
            ${a.label ? `<span class="alert-item-label">${a.label}</span>` : ''}
          </div>
          <div class="alert-item-actions">
            <button class="alert-btn alert-btn-toggle" data-id="${a.id}"
              aria-label="${a.active ? 'Disable' : 'Enable'} alert">
              ${a.active ? '◉' : '○'}
            </button>
            <button class="alert-btn alert-btn-delete" data-id="${a.id}" aria-label="Delete alert">✕</button>
          </div>
        </div>`;
    }).join('');
  }

  if (alertAddBtn && alertForm) {
    alertAddBtn.addEventListener('click', async () => {
      alertForm.hidden = !alertForm.hidden;
      if (!alertForm.hidden) {
        // Pre-fill with current price
        if (STATE.goldPriceUsdPerOz && alertPriceEl) {
          alertPriceEl.value = Math.round(STATE.goldPriceUsdPerOz);
        }
        // Check notification permission
        const perm = await alerts.requestPermission();
        const granted = perm === 'granted';
        if (alertNotifStat) {
          alertNotifStat.textContent = granted
            ? (STATE.lang === 'ar' ? '✓ الإشعارات مفعّلة' : '✓ Notifications enabled')
            : (STATE.lang === 'ar' ? '✗ الإشعارات معطّلة' : '✗ Notifications blocked');
          alertNotifStat.style.color = granted ? '#4caf50' : '#e57373';
        }
      }
    });
  }

  if (alertSaveBtn) {
    alertSaveBtn.addEventListener('click', () => {
      const price = parseFloat(alertPriceEl?.value);
      const dir   = alertDirEl?.value || 'above';
      if (!price || price <= 0) {
        if (alertPriceEl) alertPriceEl.focus();
        return;
      }
      alerts.addAlert(dir, price);
      if (alertForm) alertForm.hidden = true;
      if (alertPriceEl) alertPriceEl.value = '';
      renderAlerts();
    });
  }

  if (alertCancelBtn) {
    alertCancelBtn.addEventListener('click', () => {
      if (alertForm) alertForm.hidden = true;
    });
  }

  // Delegated: toggle + delete
  document.addEventListener('click', e => {
    const toggleBtn = e.target.closest('.alert-btn-toggle');
    if (toggleBtn) { alerts.toggleAlert(toggleBtn.dataset.id); renderAlerts(); return; }
    const deleteBtn = e.target.closest('.alert-btn-delete');
    if (deleteBtn) { alerts.removeAlert(deleteBtn.dataset.id); renderAlerts(); return; }
  });

  // Alert fired toast
  window.addEventListener('goldAlertFired', e => {
    const { alert: firedAlert } = e.detail || {};
    const toast = document.createElement('div');
    toast.className = 'alert-fired-toast';
    const dirLabel = firedAlert?.direction === 'above' ? '▲ Above' : '▼ Below';
    toast.innerHTML = `<strong>🔔 Price Alert</strong><br>${dirLabel} $${firedAlert?.targetUsd?.toLocaleString() ?? '—'}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4500);
    renderAlerts();
  });

  // Initial render of saved alerts
  renderAlerts();

  // ── Retry ────────────────────────────────────────────────────────────────
  document.getElementById('retry-btn')?.addEventListener('click', async () => {
    const noDataEl = document.getElementById('no-data-state');
    if (noDataEl) noDataEl.hidden = true;
    await fetchGoldData();
    await fetchFXData();
    recalcPrices();
    renderAll();
    if (noDataEl) noDataEl.hidden = !!STATE.goldPriceUsdPerOz;
  });

  // ── Network events ───────────────────────────────────────────────────────
  window.addEventListener('online', () => {
    STATE.isOnline = true;
    const banner = document.getElementById('offline-banner');
    if (banner) banner.hidden = true;
    fetchGoldData()
      .then(() => fetchFXData())
      .then(() => { recalcPrices(); renderAll(); });
  });
  window.addEventListener('offline', () => {
    STATE.isOnline = false;
    const banner = document.getElementById('offline-banner');
    if (banner) banner.hidden = false;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────────────────────

async function init() {
  // ① Inject shared nav and footer
  const navCtrl = injectNav(STATE.lang, 0);
  navCtrl.getLangToggleButtons().forEach(btn => {
    btn.addEventListener('click', () => {
      STATE.lang = STATE.lang === 'en' ? 'ar' : 'en';
      cache.savePreference('lang', STATE.lang);
      updateNavLang(STATE.lang);
      updateTickerLang(STATE.lang);
      applyLanguage();
    });
  });
  injectFooter(STATE.lang, 0);
  injectTicker(STATE.lang, 0);

  // ② Attach all event listeners FIRST.
  setupEventListeners();

  // ③ Restore saved preferences and cached prices from localStorage.
  cache.loadState(STATE);

  // ④ Sync UI control visual states from loaded STATE.
  syncUIFromState();

  // ⑤ Apply language: sets html[lang/dir], translates [data-i18n], calls renderAll.
  applyLanguage();

  // ⑥ Init chart with historical data (loads lib async)
  if (document.getElementById('chart-container')) {
    _chart = new GoldChart('chart-container', STATE.lang);
    _chart.setDailyHistory(STATE.history); // inject daily cache for merged view
    setupChartControls();
    renderHistoryStats();
  }

  // ⑦ Fetch live data.
  if (STATE.isOnline) {
    await fetchGoldData();
    await fetchFXData();
  } else {
    const banner = document.getElementById('offline-banner');
    if (banner) banner.hidden = false;
  }

  // ⑧ Recalculate and final render.
  recalcPrices();
  renderAll();
  renderHistoryStats();

  // ⑨ No-data state.
  const noDataEl = document.getElementById('no-data-state');
  if (noDataEl) noDataEl.hidden = !!STATE.goldPriceUsdPerOz;

  // ⑩ Start timers.
  startTimers();

  // ⑪ Debug panel.
  if (new URLSearchParams(location.search).get('debug') === 'true') {
    debug.initDebugPanel(STATE, renderAll);
  }
}

function setupChartControls() {
  document.querySelectorAll('.chart-range-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.chart-range-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      if (_chart) _chart.setRange(btn.dataset.range);
    });
  });
}

document.addEventListener('DOMContentLoaded', init);

// Register service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/Gold-Prices/sw.js').catch(() => {});
}
