import { CONSTANTS, KARATS, COUNTRIES, TRANSLATIONS } from './config/index.js';
import * as cache from './lib/cache.js';
import * as api from './lib/api.js';
import * as calc from './lib/price-calculator.js';
import * as fmt from './lib/formatter.js';
import * as search from './lib/search.js';
import * as exp from './lib/export.js';
import * as history from './lib/history.js';
import * as debug from './lib/debug.js';

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

    return `<tr class="${rowCls}">
      <td class="karat-label-cell"><strong>${label}</strong></td>
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
          aria-label="${isFav ? 'Remove from favourites' : 'Add to favourites'}"
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
      </div>
      <div class="cc-price-secondary">
        ${secondary} <span class="cc-price-unit">${secondaryUnit}</span>
      </div>
      <div class="cc-actions">
        <button class="copy-btn"
          data-price="${gramFmt}" data-currency="${country.currency}"
          data-karat="${karat}" data-country="${country.code}"
          aria-label="Copy ${name} price">${t('card.copy')}</button>
      </div>
    </article>`;
  }).join('');
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
  // Gold auto-refresh
  setInterval(async () => {
    if (!STATE.isOnline) return;
    await fetchGoldData();
    await fetchFXData();
    recalcPrices();
    renderAll();
  }, CONSTANTS.GOLD_REFRESH_MS);

  // Countdown tick
  setInterval(updateCountdown, 1000);
}

// ─────────────────────────────────────────────────────────────────────────────
// EVENT LISTENERS
// ─────────────────────────────────────────────────────────────────────────────

function setupEventListeners() {
  // Guard: never register twice (e.g. when retry re-runs init)
  if (_listenersSetup) return;
  _listenersSetup = true;

  // ── Language toggle ──────────────────────────────────────────────────────
  document.getElementById('lang-toggle')?.addEventListener('click', () => {
    STATE.lang = STATE.lang === 'en' ? 'ar' : 'en';
    cache.savePreference('lang', STATE.lang);
    applyLanguage();
  });

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

  // ── Export ───────────────────────────────────────────────────────────────
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
  // ① Attach all event listeners FIRST.
  //    Delegated handlers (document.addEventListener) will work on any dynamic
  //    content rendered later. Static-target handlers (getElementById) work now
  //    because we're inside DOMContentLoaded.
  setupEventListeners();

  // ② Restore saved preferences and cached prices from localStorage.
  cache.loadState(STATE);

  // ③ Sync UI control visual states (unit buttons, tabs, sort select) to match
  //    the values just loaded from cache before first render.
  syncUIFromState();

  // ④ Apply language: sets html[lang/dir], translates all [data-i18n] nodes,
  //    and calls renderAll() to show skeleton / loading state immediately.
  applyLanguage();

  // ⑤ Fetch live data (parallel-ish: gold first, then FX conditional on staleness).
  if (STATE.isOnline) {
    await fetchGoldData();
    await fetchFXData();
  } else {
    const banner = document.getElementById('offline-banner');
    if (banner) banner.hidden = false;
  }

  // ⑥ Recalculate price matrix and do the final render with real data.
  recalcPrices();
  renderAll();

  // ⑦ Show no-data state only if we truly have nothing to display.
  const noDataEl = document.getElementById('no-data-state');
  if (noDataEl) noDataEl.hidden = !!STATE.goldPriceUsdPerOz;

  // ⑧ Start auto-refresh and countdown timers.
  startTimers();

  // ⑨ Debug panel (opt-in via ?debug=true).
  if (new URLSearchParams(location.search).get('debug') === 'true') {
    debug.initDebugPanel(STATE, renderAll);
  }
}

document.addEventListener('DOMContentLoaded', init);
