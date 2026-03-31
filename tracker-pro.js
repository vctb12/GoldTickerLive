// tracker-pro.js (top-level structure excerpt)
import { CONSTANTS, KARATS, COUNTRIES } from './config/index.js';
import * as api from './lib/api.js';
import * as cache from './lib/cache.js';
import * as calc from './lib/price-calculator.js';
import * as fmt from './lib/formatter.js';
import * as alertsLib from './lib/alerts.js';
import { createInitialState, persistState } from './tracker/state.js';
import { mountShell, updateShellTickerFromState } from './tracker/ui-shell.js';
import { fetchWire, renderWire as renderWireModule } from './tracker/wire.js';
import { getUnifiedHistory } from './lib/historical-data.js';

// Existing LANG map and helpers can be retained, but should be trimmed over time
// to prefer config/translations.js for static text.

const state = createInitialState();
const el = {};

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
    rangePills: document.querySelectorAll('.tracker-pill[data-range]'),
    autoRefresh: document.getElementById('tp-auto-refresh'),
    liveBadgeText: document.getElementById('tp-live-badge-text'),
    marketBadge: document.getElementById('tp-market-badge'),
    refreshBadge: document.getElementById('tp-refresh-badge'),
    heroStats: document.getElementById('tp-hero-stats'),
    summaryList: document.getElementById('tp-summary-list'),
    wireTrack: document.getElementById('tp-wire-track'),
    wireRefresh: document.getElementById('tp-wire-refresh'),
    wireToggle: document.getElementById('tp-wire-toggle'),
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
    marketView: document.getElementById('tp-market-view'),
    marketBoard: document.getElementById('tp-market-board'),
    marketEmpty: document.getElementById('tp-market-empty'),
    watchlistGrid: document.getElementById('tp-watchlist-grid'),
    decisionCues: document.getElementById('tp-decision-cues'),
    alertScope: document.getElementById('tp-alert-scope'),
    alertDirection: document.getElementById('tp-alert-direction'),
    alertTarget: document.getElementById('tp-alert-target'),
    alertList: document.getElementById('tp-alert-list'),
    alertPermission: document.getElementById('tp-alert-permission'),
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
    accumMonthly: document.getElementById('tp-accum-monthly'),
    accumTarget: document.getElementById('tp-accum-target'),
    accumResults: document.getElementById('tp-accum-results'),
    archiveRange: document.getElementById('tp-archive-range'),
    archiveSearch: document.getElementById('tp-archive-search'),
    archiveBody: document.getElementById('tp-archive-body'),
    archiveMeta: document.getElementById('tp-archive-meta'),
    exportArchive: document.getElementById('tp-export-archive'),
    exportArchive2: document.getElementById('tp-export-archive-2'),
    exportHistory: document.getElementById('tp-export-history'),
    exportHistory2: document.getElementById('tp-export-history-2'),
    lookupDate: document.getElementById('tp-lookup-date'),
    runLookup: document.getElementById('tp-run-lookup'),
    lookupResults: document.getElementById('tp-lookup-results'),
    seasonalResults: document.getElementById('tp-seasonal-results'),
    exportChart: document.getElementById('tp-export-chart'),
    exportChart2: document.getElementById('tp-export-chart-2'),
    exportWatchlist: document.getElementById('tp-export-watchlist'),
    exportCurrent: document.getElementById('tp-export-current'),
    downloadJson: document.getElementById('tp-download-json'),
    downloadJson2: document.getElementById('tp-download-json-2'),
    downloadBrief: document.getElementById('tp-download-brief'),
    briefHeadline: document.getElementById('tp-brief-headline'),
    briefCopy: document.getElementById('tp-brief-copy'),
    toastStack: document.getElementById('tp-toast-stack'),
  };
}

async function init() {
  Object.assign(el, ui());

  document.documentElement.lang = state.lang;
  document.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr';

  const shellCtrl = mountShell(
    state,
    el,
    /* onModeChange */ () => renderAll(),
    /* onLangChange */ () => renderAll(),
  );

  bindCoreEvents();
  await refreshData(false);
  renderAll();
}

async function refreshData(forceLive = true) {
  const tasks = [];
  if (forceLive) tasks.push(fetchLive());
  tasks.push(ensureUnifiedHistory());
  tasks.push(refreshWire());
  await Promise.all(tasks);
  persistState(state);
}

async function fetchLive() {
  try {
    const [goldRes, fxRes] = await Promise.allSettled([
      api.fetchGold(),
      api.fetchFX(),
    ]);
    if (goldRes.status === 'fulfilled') {
      const data = goldRes.value;
      state.live = { price: data.price, updatedAt: data.updatedAt, raw: data };
      cache.saveGoldPrice(data.price, data.updatedAt);
      cache.checkDayOpenReset({ goldPriceUsdPerOz: data.price });
    } else if (!state.live) {
      const fb = cache.getFallbackGoldPrice();
      if (fb) {
        state.live = { price: fb.price, updatedAt: fb.updatedAt, raw: fb };
      } else {
        state.hasLiveFailure = true;
      }
    }

    if (fxRes.status === 'fulfilled') {
      const data = fxRes.value;
      state.rates = data.rates;
      state.fxMeta = {
        lastUpdateUtc: data.time_last_update_utc,
        nextUpdateUtc: new Date(data.time_next_update_utc).getTime(),
      };
      cache.saveFXRates(state.rates, state.fxMeta);
    }
  } catch (e) {
    console.warn('[tracker] refreshData failed', e);
    state.hasLiveFailure = true;
  }
}

async function ensureUnifiedHistory() {
  const unified = await getUnifiedHistory();
  state.history = unified.map(row => ({
    date: new Date(row.date),
    spot: Number(row.price),
    source: row.source,
    granularity: row.granularity,
  }));
}

async function refreshWire() {
  const { items } = await fetchWire(state.wireItems || []);
  state.wireItems = items;
  renderWireModule(el, state);
}

// priceFor, currentSpot, renderHero, renderChart, renderKaratTable, renderMarkets,
// renderWatchlist, renderDecisionCues, renderAlerts, renderPresets, renderPlanners,
// renderArchive, renderBrief, runAlerts, and all helpers from existing tracker-pro.js
// remain, but should now rely on state + new history and wire plumbing.

function renderAll() {
  document.title = state.lang === 'ar'
    ? 'متتبع الذهب برو'
    : 'Gold Tracker Pro — Live Workspace';
  // Reuse existing rendering helpers, but now only show content for active mode
  renderHero();
  if (state.mode === 'live') {
    renderMiniStrip();
    renderChart();
    renderKaratTable();
    renderMarkets();
    renderWatchlist();
    renderDecisionCues();
  } else if (state.mode === 'compare') {
    renderMarkets();
  } else if (state.mode === 'archive') {
    renderArchive();
  } else if (state.mode === 'alerts') {
    renderAlerts();
    renderPresets();
  } else if (state.mode === 'planner') {
    renderPlanners();
  }
  renderBrief();

  const spot = currentSpot();
  updateShellTickerFromState(state, spot, priceFor);
}

init();
