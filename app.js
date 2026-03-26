import { CONSTANTS, KARATS, COUNTRIES, TRANSLATIONS } from './config/index.js';
import * as cache from './lib/cache.js';
import * as api from './lib/api.js';
import * as calc from './lib/price-calculator.js';
import * as fmt from './lib/formatter.js';
import * as search from './lib/search.js';
import * as exp from './lib/export.js';
import * as history from './lib/history.js';
import * as debug from './lib/debug.js';

// ═══════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════
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
  offlineQueue: [],
  cacheHealthScore: 0,
  history: [],
  volatility7d: null,
  volatility30d: null,
};

// Cached price matrix — recalculated on each fetch
let _prices = {};
let _goldRefreshTimestamp = 0; // ms when last gold fetch happened

// ═══════════════════════════════════════════════
// TRANSLATION HELPER
// ═══════════════════════════════════════════════
function t(key) {
  return TRANSLATIONS[STATE.lang]?.[key] || TRANSLATIONS.en[key] || key;
}

// ═══════════════════════════════════════════════
// DATA FETCHING
// ═══════════════════════════════════════════════
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

    // Save daily snapshot for history
    cache.saveHistorySnapshot(STATE);
    history.updateVolatility(STATE);
  } catch (err) {
    console.error('fetchGoldData failed:', err.message);
    STATE.status.goldError = err.message;
    STATE.status.goldStale = true;
    const fallback = cache.getFallbackGoldPrice();
    if (fallback && !STATE.goldPriceUsdPerOz) {
      STATE.goldPriceUsdPerOz = fallback.price;
      STATE.freshness.goldUpdatedAt = fallback.updatedAt;
    }
  }
}

async function fetchFXData() {
  if (Date.now() < STATE.fxMeta.nextUpdateUtc) {
    return; // Not stale yet
  }
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
    console.error('fetchFXData failed:', err.message);
    STATE.status.fxError = err.message;
    STATE.status.fxStale = true;
    const fallback = cache.getFallbackFXRates();
    if (fallback && Object.keys(STATE.rates).length === 0) {
      STATE.rates = fallback.rates || {};
    }
  }
}

function recalcPrices() {
  _prices = calc.calculateAllPrices(
    STATE.goldPriceUsdPerOz,
    STATE.rates,
    KARATS,
    COUNTRIES
  );
}

// ═══════════════════════════════════════════════
// RENDER — HEADER
// ═══════════════════════════════════════════════
function renderHeader() {
  // Gold freshness
  const goldTime = document.getElementById('gold-freshness-time');
  if (goldTime) {
    goldTime.textContent = STATE.freshness.goldUpdatedAt
      ? fmt.formatTimestampShort(STATE.freshness.goldUpdatedAt, STATE.lang)
      : '—';
  }

  // FX freshness
  const fxTime = document.getElementById('fx-freshness-time');
  if (fxTime) {
    fxTime.textContent = STATE.freshness.fxUpdatedAt
      ? fmt.formatTimestamp(STATE.freshness.fxUpdatedAt, STATE.lang)
      : '—';
  }

  // FX next refresh
  const fxNext = document.getElementById('fx-next-time');
  if (fxNext && STATE.fxMeta.nextUpdateUtc) {
    fxNext.textContent = fmt.formatTimestamp(
      new Date(STATE.fxMeta.nextUpdateUtc).toISOString(),
      STATE.lang
    );
  }

  // Status banners
  const offlineBanner = document.getElementById('offline-banner');
  if (offlineBanner) offlineBanner.hidden = STATE.isOnline;

  const errorBanner = document.getElementById('error-banner');
  const errorText = document.getElementById('error-banner-text');
  if (errorBanner && errorText) {
    const msg = STATE.status.goldError ? t('status.goldError') + ' '
      : STATE.status.fxError ? t('status.fxError') + ' ' : '';
    errorBanner.hidden = !msg;
    errorText.textContent = msg;
  }

  // Cache health
  const healthRow = document.getElementById('cache-health-row');
  const healthVal = document.getElementById('cache-health-value');
  if (healthRow && healthVal && (STATE.status.goldStale || STATE.status.fxStale)) {
    healthRow.hidden = false;
    healthVal.textContent = `${STATE.cacheHealthScore}%`;
  } else if (healthRow) {
    healthRow.hidden = true;
  }
}

// ═══════════════════════════════════════════════
// RENDER — UAE SPOTLIGHT
// ═══════════════════════════════════════════════
function renderSpotlightKaratPills() {
  const container = document.getElementById('spotlight-karat-pills');
  if (!container) return;
  const displayKarats = ['24', '22', '21', '18'];
  container.innerHTML = displayKarats.map(code => {
    const k = KARATS.find(k => k.code === code);
    return `<button class="karat-pill ${STATE.selectedKaratSpotlight === code ? 'active' : ''}"
      data-selector="spotlight" data-karat="${code}"
      aria-pressed="${STATE.selectedKaratSpotlight === code}">${code}K</button>`;
  }).join('');
}

function renderSpotlight() {
  renderSpotlightKaratPills();
  const container = document.getElementById('spotlight-grid');
  if (!container) return;

  const k = STATE.selectedKaratSpotlight;
  const priceData = _prices[k];

  if (!priceData) {
    container.innerHTML = `<p class="section-note">${t('status.loading')}</p>`;
    return;
  }

  const cards = [
    {
      label: t('spotlight.perOzUsd'),
      value: fmt.formatPrice(priceData.USD?.oz, 'USD', 2),
      aed: false,
    },
    {
      label: t('spotlight.perOzAed'),
      value: fmt.formatPrice(priceData.AED?.oz, 'AED', 2),
      aed: true,
    },
    {
      label: t('spotlight.perGramUsd'),
      value: fmt.formatPrice(priceData.USD?.gram, 'USD', 2),
      aed: false,
    },
    {
      label: t('spotlight.perGramAed'),
      value: fmt.formatPrice(priceData.AED?.gram, 'AED', 2),
      aed: true,
    },
  ];

  container.innerHTML = cards.map(card => `
    <div class="spotlight-card ${card.aed ? 'aed-card' : ''}">
      <div class="card-label">${card.label}</div>
      <div class="card-price">${card.value}</div>
      ${card.aed ? `<div class="card-badge-row"><span class="freshness-badge badge-fixed" data-i18n="aed.badge">${t('aed.badge')}</span></div>` : ''}
    </div>`).join('');
}

// ═══════════════════════════════════════════════
// RENDER — CHANGE PANEL
// ═══════════════════════════════════════════════
function renderChangePanel() {
  const section = document.getElementById('section-change');
  if (!section) return;

  const prev = STATE.prevGoldPriceUsdPerOz;
  const open = STATE.dayOpenGoldPriceUsdPerOz;
  const curr = STATE.goldPriceUsdPerOz;

  if (!curr || (!prev && !open)) {
    section.hidden = true;
    return;
  }
  section.hidden = false;

  if (prev) {
    const ch = fmt.formatPercentChange(curr - prev, prev);
    const el = document.getElementById('change-prev-value');
    if (el) {
      el.textContent = `${ch.text}  (${ch.value} USD)`;
      el.className = `change-value ${ch.direction}`;
    }
  }

  if (open) {
    const ch = fmt.formatPercentChange(curr - open, open);
    const el = document.getElementById('change-open-value');
    if (el) {
      el.textContent = `${ch.text}  (${ch.value} USD)`;
      el.className = `change-value ${ch.direction}`;
    }
  }
}

// ═══════════════════════════════════════════════
// RENDER — KARAT TABLE
// ═══════════════════════════════════════════════
function renderKaratTable() {
  const tbody = document.getElementById('karat-tbody');
  if (!tbody) return;

  const unit = STATE.selectedUnitTable;

  if (!STATE.goldPriceUsdPerOz) {
    // Keep skeleton
    return;
  }

  tbody.innerHTML = KARATS.map(k => {
    const rowClass = k.code === '24' ? 'row-24k' : k.code === '22' ? 'row-22k' : k.code === '21' ? 'row-21k' : '';
    const usdPrice = unit === 'gram'
      ? calc.usdPerGram(STATE.goldPriceUsdPerOz, k.purity)
      : calc.usdPerOz(STATE.goldPriceUsdPerOz, k.purity);
    const aedPrice = usdPrice * CONSTANTS.AED_PEG;
    const label = STATE.lang === 'ar' ? k.labelAr : k.labelEn;

    return `<tr class="${rowClass}">
      <td><strong>${label}</strong></td>
      <td>${fmt.formatPrice(usdPrice, 'USD', 2)}</td>
      <td>${fmt.formatPrice(aedPrice, 'AED', 2)}</td>
    </tr>`;
  }).join('');
}

// ═══════════════════════════════════════════════
// RENDER — COUNTRY GRID
// ═══════════════════════════════════════════════
function renderCountriesKaratPills() {
  const container = document.getElementById('countries-karat-pills');
  if (!container) return;
  const displayKarats = ['24', '22', '21', '18'];
  container.innerHTML = displayKarats.map(code => {
    return `<button class="karat-pill ${STATE.selectedKaratCountries === code ? 'active' : ''}"
      data-selector="countries" data-karat="${code}"
      aria-pressed="${STATE.selectedKaratCountries === code}">${code}K</button>`;
  }).join('');
}

function sortCountries(a, b, karat) {
  if (STATE.sortOrder === 'alpha') {
    const na = STATE.lang === 'ar' ? a.nameAr : a.nameEn;
    const nb = STATE.lang === 'ar' ? b.nameAr : b.nameEn;
    return na.localeCompare(nb, STATE.lang === 'ar' ? 'ar' : 'en');
  }
  const aPrice = _prices[karat]?.[a.currency]?.gram ?? -1;
  const bPrice = _prices[karat]?.[b.currency]?.gram ?? -1;
  return STATE.sortOrder === 'low-high' ? aPrice - bPrice : bPrice - aPrice;
}

function renderCountryGrid() {
  renderCountriesKaratPills();
  const grid = document.getElementById('country-grid');
  const emptyEl = document.getElementById('country-empty');
  const emptyQuery = document.getElementById('country-empty-query');
  if (!grid) return;

  const karat = STATE.selectedKaratCountries;
  const unit = STATE.selectedUnitTable;

  let filtered = COUNTRIES
    .filter(c => c.group === STATE.activeTab)
    .filter(c => search.matchesQuery(c, STATE.searchQuery, STATE.lang))
    .sort((a, b) => sortCountries(a, b, karat));

  if (filtered.length === 0) {
    grid.innerHTML = '';
    if (emptyEl) {
      emptyEl.hidden = false;
      if (emptyQuery) emptyQuery.textContent = `"${STATE.searchQuery}"`;
    }
    return;
  }
  if (emptyEl) emptyEl.hidden = true;

  const karatObj = KARATS.find(k => k.code === karat);

  grid.innerHTML = filtered.map(country => {
    const priceData = _prices[karat]?.[country.currency];
    const gram = priceData?.gram;
    const oz = priceData?.oz;
    const isFav = STATE.favorites.includes(country.code);
    const isStale = STATE.status.fxStale && !country.fixedPeg;
    const noData = gram === null || gram === undefined;
    const countryName = STATE.lang === 'ar' ? country.nameAr : country.nameEn;
    const volLabel = STATE.volatility7d
      ? history.getVolatilityLabel(STATE.volatility7d, STATE.lang)
      : '';

    const gramFmt = noData ? t('card.noData') : fmt.formatPrice(gram, country.currency, country.decimals);
    const ozFmt   = noData ? '—' : fmt.formatPrice(oz, country.currency, country.decimals);
    const unitLabel = unit === 'gram' ? t('card.perGram') : t('card.perOz');
    const displayPrice = unit === 'gram' ? gramFmt : ozFmt;
    const displaySecondary = unit === 'gram' ? ozFmt : gramFmt;
    const secondaryUnit = unit === 'gram' ? t('card.perOz') : t('card.perGram');

    return `
    <article class="country-card ${isStale ? 'stale-card' : ''} ${noData ? 'no-data' : ''}" role="listitem" aria-label="${countryName}">
      <div class="card-header">
        <span class="card-flag" aria-hidden="true">${country.flag}</span>
        <span class="card-name">${countryName}</span>
        <span class="card-currency">${country.currency}</span>
      </div>
      <div class="card-badges">
        <span class="badge-karat">${karat}K</span>
        ${country.fixedPeg ? `<span class="freshness-badge badge-fixed">${t('aed.badge')}</span>` : ''}
        ${isStale ? `<span class="freshness-badge badge-stale">${t('card.stale')}</span>` : ''}
      </div>
      <div>
        <div class="card-price-main">${displayPrice}</div>
        <div class="card-price-unit">${unitLabel}</div>
      </div>
      <div class="card-price-secondary">${displaySecondary} <span class="card-price-unit">${secondaryUnit}</span></div>
      ${volLabel ? `<div class="section-note">${volLabel}</div>` : ''}
      <div class="card-actions">
        <button class="copy-btn"
          data-price="${gramFmt}"
          data-currency="${country.currency}"
          data-karat="${karat}"
          data-country="${country.code}"
          aria-label="Copy ${countryName} price">${t('card.copy')}</button>
        <button class="fav-btn ${isFav ? 'active' : ''}"
          data-country="${country.code}"
          aria-label="Favourite ${countryName}"
          aria-pressed="${isFav}">${isFav ? '★' : '☆'}</button>
      </div>
    </article>`;
  }).join('');
}

// ═══════════════════════════════════════════════
// RENDER — FULL
// ═══════════════════════════════════════════════
function renderAll() {
  renderHeader();
  renderSpotlight();
  renderChangePanel();
  renderKaratTable();
  renderCountryGrid();
}

// ═══════════════════════════════════════════════
// LANGUAGE TOGGLE
// ═══════════════════════════════════════════════
function applyLanguage() {
  const html = document.documentElement;
  html.lang = STATE.lang;
  html.dir = STATE.lang === 'ar' ? 'rtl' : 'ltr';

  // Update all data-i18n text nodes
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = t(key);
  });

  // Update data-i18n-placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    el.placeholder = t(key);
  });

  // Update select option text
  document.querySelectorAll('#sort-select option[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });

  // Update lang toggle label
  const langBtn = document.getElementById('lang-toggle');
  if (langBtn) langBtn.textContent = t('lang.toggle');

  renderAll();
}

// ═══════════════════════════════════════════════
// COUNTDOWNS & TIMERS
// ═══════════════════════════════════════════════
function updateCountdowns() {
  const goldCountdownEl = document.getElementById('gold-countdown');
  if (goldCountdownEl && _goldRefreshTimestamp > 0) {
    const elapsed = Date.now() - _goldRefreshTimestamp;
    const remaining = Math.max(0, CONSTANTS.GOLD_REFRESH_MS - elapsed);
    goldCountdownEl.textContent = fmt.formatCountdown(remaining);
  }
}

function startTimers() {
  // Gold refresh every 90 seconds
  setInterval(async () => {
    if (!STATE.isOnline) return;
    await fetchGoldData();
    await fetchFXData();
    recalcPrices();
    renderAll();
  }, CONSTANTS.GOLD_REFRESH_MS);

  // Countdown every second
  setInterval(updateCountdowns, 1000);

  // Daily snapshot at Dubai midnight
  scheduleMidnightSnapshot();
}

function scheduleMidnightSnapshot() {
  const nowDubai = new Date().toLocaleString('en-CA', { timeZone: 'Asia/Dubai' });
  const [date] = nowDubai.split(',');
  const midnightDubai = new Date(`${date}T23:59:59`);
  // Convert Dubai time to UTC
  const msUntilMidnight = midnightDubai.getTime() - Date.now() + 60000; // +1min buffer
  const delay = msUntilMidnight > 0 ? msUntilMidnight : 86400000;
  setTimeout(() => {
    cache.saveHistorySnapshot(STATE);
    scheduleMidnightSnapshot(); // Reschedule
  }, delay);
}

// ═══════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════
function setupEventListeners() {
  // Language toggle
  document.getElementById('lang-toggle')?.addEventListener('click', () => {
    STATE.lang = STATE.lang === 'en' ? 'ar' : 'en';
    cache.savePreference('lang', STATE.lang);
    applyLanguage();
  });

  // Unit toggle (Per Gram / Per Ounce)
  document.getElementById('unit-gram')?.addEventListener('click', () => setUnit('gram'));
  document.getElementById('unit-oz')?.addEventListener('click', () => setUnit('oz'));

  function setUnit(unit) {
    STATE.selectedUnitTable = unit;
    cache.savePreference('unit', unit);
    document.querySelectorAll('.unit-btn').forEach(b => b.classList.toggle('active', b.dataset.unit === unit));
    renderKaratTable();
    renderCountryGrid();
  }

  // Karat pills (delegated)
  document.addEventListener('click', e => {
    const btn = e.target.closest('.karat-pill');
    if (!btn) return;
    const karat = btn.dataset.karat;
    const selector = btn.dataset.selector;
    if (selector === 'spotlight') {
      STATE.selectedKaratSpotlight = karat;
      cache.savePreference('selectedKarat', karat);
      renderSpotlight();
    } else if (selector === 'countries') {
      STATE.selectedKaratCountries = karat;
      cache.savePreference('selectedKarat', karat);
      renderCountryGrid();
    }
  });

  // Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      STATE.activeTab = tab.dataset.tab;
      cache.savePreference('activeTab', STATE.activeTab);
      document.querySelectorAll('.tab').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === STATE.activeTab);
        t.setAttribute('aria-selected', t.dataset.tab === STATE.activeTab);
      });
      renderCountryGrid();
    });
  });

  // Sort
  document.getElementById('sort-select')?.addEventListener('change', e => {
    STATE.sortOrder = e.target.value;
    cache.savePreference('sortOrder', STATE.sortOrder);
    renderCountryGrid();
  });

  // Search
  document.getElementById('search-input')?.addEventListener('input', e => {
    STATE.searchQuery = e.target.value;
    renderCountryGrid();
  });

  // Copy button (delegated)
  document.addEventListener('click', e => {
    const btn = e.target.closest('.copy-btn');
    if (!btn) return;
    const text = `${btn.dataset.price} ${t('card.perGram')} (${btn.dataset.karat}K)`;
    navigator.clipboard.writeText(text).then(() => {
      const orig = btn.textContent;
      btn.textContent = t('card.copied');
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = orig;
        btn.classList.remove('copied');
      }, 1200);
    }).catch(() => {});
  });

  // Favourite button (delegated)
  document.addEventListener('click', e => {
    const btn = e.target.closest('.fav-btn');
    if (!btn) return;
    const code = btn.dataset.country;
    if (STATE.favorites.includes(code)) {
      STATE.favorites = STATE.favorites.filter(c => c !== code);
    } else {
      STATE.favorites.push(code);
    }
    cache.savePreference('favorites', STATE.favorites);
    renderCountryGrid();
  });

  // Export CSV
  document.getElementById('export-csv-btn')?.addEventListener('click', () => {
    const tabCountries = COUNTRIES.filter(c => c.group === STATE.activeTab);
    exp.exportCSV(tabCountries, STATE.selectedKaratCountries, _prices, STATE.lang);
  });

  // Export JSON
  document.getElementById('export-json-btn')?.addEventListener('click', () => {
    exp.exportJSON(STATE, _prices);
  });

  // Retry button
  document.getElementById('retry-btn')?.addEventListener('click', () => {
    document.getElementById('no-data-state').hidden = true;
    init();
  });

  // Network events
  window.addEventListener('online', () => {
    STATE.isOnline = true;
    document.getElementById('offline-banner').hidden = true;
    fetchGoldData().then(() => fetchFXData()).then(() => { recalcPrices(); renderAll(); });
  });
  window.addEventListener('offline', () => {
    STATE.isOnline = false;
    document.getElementById('offline-banner').hidden = false;
  });
}

// ═══════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════
async function init() {
  // 1. Restore from cache
  cache.loadState(STATE);

  // 2. Apply saved language immediately
  applyLanguage();

  // 3. Fetch live data
  if (STATE.isOnline) {
    await fetchGoldData();
    await fetchFXData();
  } else {
    document.getElementById('offline-banner').hidden = false;
  }

  // 4. Calculate prices
  recalcPrices();

  // 5. Render everything
  if (!STATE.goldPriceUsdPerOz && !STATE.isOnline) {
    document.getElementById('no-data-state').hidden = false;
  }
  renderAll();

  // 6. Start timers
  startTimers();

  // 7. Debug mode
  if (new URLSearchParams(location.search).get('debug') === 'true') {
    debug.initDebugPanel(STATE, renderAll);
  }
}

document.addEventListener('DOMContentLoaded', init);
