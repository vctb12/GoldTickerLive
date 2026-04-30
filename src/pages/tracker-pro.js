// tracker-pro.js — slim orchestrator
import { CONSTANTS, KARATS, COUNTRIES } from '../config/index.js';
import * as api from '../lib/api.js';
import * as cache from '../lib/cache.js';
import '../lib/reveal.js';
import { createInitialState, persistState } from '../tracker/state.js';
import { el as safeEl } from '../lib/safe-dom.js';
import { track, EVENTS } from '../lib/analytics.js';
// Lazy-load heavy UI modules (ui-shell, events, wire, adSlot) inside init()
let mountShell;
let fetchWire, renderWireModule;
let initEvents, bindCoreEvents;
let renderAdSlot;
// Note: load `export` and `historical-data` lazily to reduce initial parse and network cost
// Render helpers are lazy-loaded inside init() to reduce initial module parse
let initRender,
  renderAll,
  renderChart,
  renderMarkets,
  renderAlerts,
  renderPresets,
  renderPlanners,
  renderArchive;
// render helpers are assigned during init()

const state = createInitialState();
const el = {};

function ui() {
  return {
    refreshBtn: document.getElementById('tp-refresh-btn'),
    shareBtn: document.getElementById('tp-share-btn'),
    resetBtn: document.getElementById('tp-reset-btn'),
    workspaceToggle: document.getElementById('tp-workspace-toggle'),
    language: document.getElementById('tp-language'),
    currency: document.getElementById('tp-currency'),
    karat: document.getElementById('tp-karat'),
    unit: document.getElementById('tp-unit'),
    compare: document.getElementById('tp-compare-country'),
    rangePills: document.querySelectorAll('.tracker-pill[data-range]'),
    autoRefresh: document.getElementById('tp-auto-refresh'),
    liveBadgeText: document.getElementById('tp-live-badge-text'),
    xauUsdValue: document.getElementById('tp-xauusd-value'),
    marketBadge: document.getElementById('tp-market-badge'),
    refreshBadge: document.getElementById('tp-refresh-badge'),
    heroStats: document.getElementById('tp-hero-stats'),
    summaryList: document.getElementById('tp-summary-list'),
    wireTrack: document.getElementById('tp-wire-track'),
    wireRefresh: document.getElementById('tp-wire-refresh'),
    wireToggle: document.getElementById('tp-wire-toggle'),
    chart: document.getElementById('tp-chart'),
    chartWrap: document.querySelector('.tracker-chart-wrap'),
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

// ── Price helpers ─────────────────────────────────────────────────────────────

function currentSpot() {
  return state.live?.price ?? null;
}

function priceFor({ currency, karat, unit, spot }) {
  const s = spot ?? currentSpot();
  if (!s) return null;
  const karatObj = KARATS.find((k) => k.code === String(karat));
  if (!karatObj) return null;
  const usdPerGram = (s / CONSTANTS.TROY_OZ_GRAMS) * karatObj.purity;
  let local;
  if (currency === 'AED') {
    local = usdPerGram * CONSTANTS.AED_PEG;
  } else {
    const rate = state.rates?.[currency];
    if (!rate) return null;
    local = usdPerGram * rate;
  }
  if (unit === 'oz') return local * CONSTANTS.TROY_OZ_GRAMS;
  return local;
}

// ── UI helpers ────────────────────────────────────────────────────────────────

function showToast(msg, durationMs = 3500) {
  if (!el.toastStack) return;
  const toast = document.createElement('div');
  toast.className = 'tracker-toast';
  toast.textContent = msg;
  el.toastStack.appendChild(toast);
  setTimeout(() => toast.remove(), durationMs);
}

function checkAlerts() {
  const spot = currentSpot();
  if (!spot || !state.alerts?.length) return;
  const triggered = [];
  state.alerts.forEach((a) => {
    const hit = a.direction === 'above' ? spot > a.target : spot < a.target;
    if (hit) {
      triggered.push(`${a.scope} ${a.direction} $${a.target}`);
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Gold Price Alert', {
          body: `XAU/USD ${a.direction} ${a.target}: now $${spot.toFixed(2)}`,
        });
      }
    }
  });
  // Announce triggered alerts to screen readers via the aria-live region
  if (triggered.length) {
    const liveRegion = document.getElementById('tp-alert-live-region');
    if (liveRegion) {
      liveRegion.textContent = `Alert triggered: ${triggered.join(', ')} — current price $${spot.toFixed(2)}`;
    }
  }
}

async function exportArchiveData() {
  if (!state.history.length) {
    showToast('No archive data available.');
    return;
  }
  const records = state.history.map((r) => ({
    date: r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date),
    price: r.spot,
    source: r.source,
    granularity: r.granularity,
  }));
  try {
    const expMod = await import('../lib/export.js');
    expMod.exportHistoricalCSV(records, state.selectedKarat);
  } catch (_e) {
    showToast('Export failed');
  }
}

function exportHistoryData() {
  // keep synchronous facade; archive export is async but not awaited here
  exportArchiveData();
}

async function exportChartData() {
  if (!state.history.length) {
    showToast('No chart data available yet.');
    return;
  }
  const flat = state.history.map((r) => ({
    date: r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date),
    spot: r.spot,
    price: r.spot,
    source: r.source,
  }));
  const spot = currentSpot();
  // Filter to the visible range before exporting so the CSV matches what the user sees
  const { filterByRange } = await import('../lib/historical-data.js');
  const rangeFiltered = state.range ? filterByRange(flat, state.range) : flat;
  const rows = rangeFiltered.filter(Boolean);
  if (spot)
    rows.push({ date: new Date().toISOString().slice(0, 10), spot, price: spot, source: 'live' });
  try {
    const expMod = await import('../lib/export.js');
    expMod.exportChartCSV(rows, state.range, state.selectedKarat);
    showToast('Chart CSV downloaded');
  } catch (_e) {
    showToast('Export failed');
  }
}

async function exportWatchlistData() {
  const spot = currentSpot();
  if (!spot) {
    showToast('Waiting for live price data.');
    return;
  }
  if (!state.favorites?.length) {
    showToast('No favorites in watchlist. Add currencies via Compare tab.');
    return;
  }
  try {
    const expMod = await import('../lib/export.js');
    expMod.exportWatchlistCSV({
      favorites: state.favorites,
      countries: COUNTRIES,
      karatCode: state.selectedKarat,
      priceFor,
      spot,
      selectedUnit: state.selectedUnit,
      selectedCurrency: state.selectedCurrency,
      lang: state.lang,
    });
    showToast('Watchlist CSV downloaded');
  } catch (_e) {
    showToast('Export failed');
  }
}

async function exportCurrentViewData() {
  const spot = currentSpot();
  if (!spot) {
    showToast('Waiting for live price data.');
    return;
  }
  try {
    const expMod = await import('../lib/export.js');
    expMod.exportCurrentViewCSV({
      countries: COUNTRIES,
      karatCode: state.selectedKarat,
      priceFor,
      spot,
      selectedUnit: state.selectedUnit,
      selectedCurrency: state.selectedCurrency,
      lang: state.lang,
    });
    showToast('Current view CSV downloaded');
  } catch (_e) {
    showToast('Export failed');
  }
}

async function exportBriefData() {
  const headline = el.briefHeadline?.textContent;
  const body = el.briefCopy?.textContent;
  if (!headline || headline.startsWith('Waiting')) {
    showToast('Waiting for live data.');
    return;
  }
  try {
    const expMod = await import('../lib/export.js');
    expMod.exportBriefText(headline, body);
    showToast('Brief downloaded');
  } catch (_e) {
    showToast('Export failed');
  }
}

async function exportJsonData() {
  const spot = currentSpot();
  const prices = {};
  if (spot) {
    KARATS.forEach((k) => {
      prices[k.code] = {};
      [...new Set(COUNTRIES.map((c) => c.currency))].forEach((cur) => {
        const p = priceFor({ currency: cur, karat: k.code, unit: 'gram', spot });
        if (p) prices[k.code][cur] = { gram: p, oz: p * CONSTANTS.TROY_OZ_GRAMS };
      });
    });
  }
  const exportState = {
    goldPriceUsdPerOz: spot || null,
    freshness: {
      goldUpdatedAt: state.live?.updatedAt || new Date().toISOString(),
      fxUpdatedAt: state.fxMeta?.lastUpdateUtc || new Date().toISOString(),
    },
    rates: state.rates,
    lang: state.lang,
  };
  try {
    const expMod = await import('../lib/export.js');
    expMod.exportJSON(exportState, prices);
  } catch (_e) {
    showToast('Export failed');
  }
}

// ── Auto-refresh ──────────────────────────────────────────────────────────────

let _autoRefreshTimer = null;
let _countdownTimer = null;
let _countdownValue = 0;
let _fetchInFlight = false; // guard against overlapping auto-refresh ticks

function startCountdown() {
  clearInterval(_countdownTimer);
  _countdownValue = Math.floor(CONSTANTS.GOLD_REFRESH_MS / 1000);

  // Query once; reused by every tick and the initial paint.
  const el_countdown = document.getElementById('tp-countdown');

  // Display the initial value immediately so the user sees the full countdown.
  if (el_countdown) el_countdown.textContent = `Next update in ${_countdownValue}s`;

  function tick() {
    _countdownValue--;
    if (_countdownValue <= 0) {
      clearInterval(_countdownTimer);
      if (el_countdown) el_countdown.textContent = '';
      return;
    }
    if (el_countdown) el_countdown.textContent = `Next update in ${_countdownValue}s`;
  }
  _countdownTimer = setInterval(tick, 1000);
}

function startAutoRefresh() {
  if (_autoRefreshTimer) return;
  _autoRefreshTimer = setInterval(async () => {
    if (!state.autoRefresh) return;
    // Skip this tick if the previous fetch hasn't finished yet.
    if (_fetchInFlight) return;
    _fetchInFlight = true;
    startCountdown();
    try {
      await fetchLive();
      checkAlerts();
      renderAll();
    } finally {
      _fetchInFlight = false;
    }
  }, CONSTANTS.GOLD_REFRESH_MS);
}

function stopAutoRefresh() {
  clearInterval(_autoRefreshTimer);
  _autoRefreshTimer = null;
}

// ── Populates dropdowns ───────────────────────────────────────────────────────

function populateSelects() {
  if (el.currency) {
    const currencies = [...new Set(COUNTRIES.map((c) => c.currency))].sort();
    const frag = document.createDocumentFragment();
    currencies.forEach((c) => {
      const opt = safeEl('option', { value: c }, [c]);
      if (c === state.selectedCurrency) opt.selected = true;
      frag.appendChild(opt);
    });
    el.currency.replaceChildren(frag);
  }
  if (el.karat) {
    const frag = document.createDocumentFragment();
    KARATS.forEach((k) => {
      const opt = safeEl('option', { value: k.code }, [
        `${k.code}K — ${(k.purity * 100).toFixed(1)}%`,
      ]);
      if (k.code === state.selectedKarat) opt.selected = true;
      frag.appendChild(opt);
    });
    el.karat.replaceChildren(frag);
  }
  if (el.unit) {
    const frag = document.createDocumentFragment();
    ['gram', 'oz'].forEach((u) => {
      const opt = safeEl('option', { value: u }, [u]);
      if (u === state.selectedUnit) opt.selected = true;
      frag.appendChild(opt);
    });
    el.unit.replaceChildren(frag);
  }
  if (el.language) el.language.value = state.lang;
  // Sync range pills with persisted state (HTML default is 24H; state default is 30D).
  if (el.rangePills?.length) {
    el.rangePills.forEach((p) => {
      const active = p.dataset.range === state.range;
      p.classList.toggle('is-active', active);
      p.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }
  if (el.jewelryKarat) {
    const frag = document.createDocumentFragment();
    KARATS.forEach((k) => {
      frag.appendChild(safeEl('option', { value: k.code }, [`${k.code}K`]));
    });
    el.jewelryKarat.replaceChildren(frag);
  }
}

// ── Data fetch ────────────────────────────────────────────────────────────────

async function refreshData(forceLive = true, includeWire = true) {
  const tasks = [];
  if (forceLive) tasks.push(fetchLive());
  tasks.push(ensureUnifiedHistory());
  if (includeWire) tasks.push(refreshWire());
  await Promise.all(tasks);
  // If advanced chart is loaded, give it the updated unified history
  try {
    if (window.__GOLD_CHART && typeof window.__GOLD_CHART.setDailyHistory === 'function') {
      window.__GOLD_CHART.setDailyHistory(state.history || []);
    }
  } catch (_e) {
    console.warn('[chart-hook] setDailyHistory failed', _e);
  }
  persistState(state);
}

async function fetchLive() {
  try {
    const [goldRes, fxRes] = await Promise.allSettled([api.fetchGold(), api.fetchFX()]);
    if (goldRes.status === 'fulfilled') {
      const data = goldRes.value;
      state.live = { price: data.price, updatedAt: data.updatedAt, raw: data };
      state.hasLiveFailure = false;
      cache.saveGoldPrice(data.price, data.updatedAt);
      cache.checkDayOpenReset({ goldPriceUsdPerOz: data.price });
      const today = new Date().toISOString().slice(0, 10);
      const alreadySaved = (state.snapshots || []).some((s) => s.date === today);
      if (!alreadySaved) {
        state.snapshots = [
          ...(state.snapshots || []),
          { date: today, price: data.price, timestamp: Date.now() },
        ];
      }
    } else {
      state.hasLiveFailure = true;
      if (!state.live) {
        const fb = cache.getFallbackGoldPrice();
        if (fb) {
          state.live = { price: fb.price, updatedAt: fb.updatedAt, raw: fb };
          // Push fallback into advanced chart if present
          try {
            if (window.__GOLD_CHART && typeof window.__GOLD_CHART.addPoint === 'function') {
              window.__GOLD_CHART.addPoint(fb.price, fb.updatedAt || Date.now());
            }
          } catch (_e) {}
        }
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
  } catch (_e) {
    console.warn('[tracker] refreshData failed', _e);
    state.hasLiveFailure = true;
  }
  // When live price arrives, update advanced chart if it's loaded
  try {
    if (window.__GOLD_CHART && state.live && typeof window.__GOLD_CHART.addPoint === 'function') {
      window.__GOLD_CHART.addPoint(state.live.price, state.live.updatedAt || Date.now());
    }
  } catch (_e) {
    // non-fatal
  }
}

async function ensureUnifiedHistory() {
  const cachedDaily = Array.isArray(state.snapshots) ? state.snapshots : [];
  const { getUnifiedHistory } = await import('../lib/historical-data.js');
  const unified = await getUnifiedHistory(cachedDaily);
  state.history = unified
    .map((row) => ({
      date: new Date(row.date.length === 7 ? `${row.date}-01` : row.date),
      spot: Number(row.price),
      source: row.source,
      granularity: row.granularity,
    }))
    .filter((r) => r.spot > 0 && Number.isFinite(r.date.getTime()));
}

async function refreshWire() {
  const { items } = await fetchWire(state.wireItems || []);
  state.wireItems = items;
  renderWireModule(el, state);
}

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  // Wait for DOM to be fully ready
  if (document.readyState !== 'complete' && document.readyState !== 'interactive') {
    await new Promise((r) => document.addEventListener('DOMContentLoaded', r, { once: true }));
  }

  Object.assign(el, ui());

  document.documentElement.lang = state.lang;
  document.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr';
  // Lazy-load render helpers and UI modules to reduce initial parse cost
  const [renderMod, uiMod, eventsMod, wireMod, adMod] = await Promise.all([
    import('../tracker/render.js'),
    import('../tracker/ui-shell.js'),
    import('../tracker/events.js'),
    import('../tracker/wire.js'),
    import('../components/adSlot.js'),
  ]);

  ({
    initRender,
    renderAll,
    renderChart,
    renderMarkets,
    renderAlerts,
    renderPresets,
    renderPlanners,
    renderArchive,
  } = renderMod);
  ({ mountShell } = uiMod);
  ({ initEvents, bindCoreEvents } = eventsMod);
  ({ fetchWire, renderWire: renderWireModule } = wireMod);
  ({ renderAdSlot } = adMod);

  // Init sub-modules with their dependencies
  initRender({ state, el, priceFor, currentSpot, showToast });
  initEvents({
    state,
    el,
    refreshData,
    renderAll,
    renderMarkets,
    renderAlerts,
    renderPresets,
    renderPlanners,
    renderArchive,
    showToast,
    currentSpot,
    priceFor,
    startAutoRefresh,
    stopAutoRefresh,
    populateSelects,
    refreshWire,
    exportArchiveData,
    exportHistoryData,
    exportJsonData,
    exportChartData,
    exportWatchlistData,
    exportCurrentViewData,
    exportBriefData,
  });

  mountShell(
    state,
    el,
    /* onModeChange */ () => {
      populateSelects();
      renderAll();
    },
    /* onLangChange */ () => renderAll()
  );

  populateSelects();
  bindCoreEvents();

  if (localStorage.getItem('tracker_trust_banner_dismissed')) {
    const trustSection = document.querySelector('.tracker-data-trust-section');
    if (trustSection) trustSection.style.display = 'none';
  }

  const regionTabs = document.querySelectorAll('.tracker-region-pill[data-region]');
  regionTabs.forEach((btn) => {
    const isActive = btn.dataset.region === (state.activeRegion || 'gcc');
    btn.classList.toggle('is-active', isActive);
  });

  // Skip fetching the market wire during initial load to reduce critical path
  await refreshData(false, false);
  renderAll();
  if (state.autoRefresh) startAutoRefresh();
  startCountdown();

  // Analytics: fire page_view + tracker_view after first data load
  const locale = document.documentElement.lang || 'en';
  track(EVENTS.PAGE_VIEW, { path: location.pathname, locale });
  track(EVENTS.TRACKER_VIEW, {
    karat: state.selectedKarat,
    country: state.selectedCountry,
    currency: state.selectedCurrency,
  });

  // Render ads (ad slot renderer was lazy-loaded above)
  try {
    if (renderAdSlot) {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => renderAdSlot('ad-bottom', 'rectangle'), { timeout: 5000 });
      } else {
        setTimeout(() => renderAdSlot('ad-bottom', 'rectangle'), 1500);
      }
    }
  } catch (_e) {
    console.warn('[ads] failed to render ad slot', _e);
  }

  // Install the chart loader non-blocking; loader itself will lazy-load the heavy chart
  try {
    import('./tracker-chart-loader.js')
      .then((m) => m.installChartLoader({ state, el }))
      .catch(() => {});
  } catch (_e) {
    // silent
  }

  // Mobile swipe for region tabs
  const marketBoard = document.getElementById('tp-market-board');
  if (marketBoard) {
    let touchStartX = 0;
    const REGIONS_ORDER = ['gcc', 'levant', 'africa', 'global'];

    marketBoard.addEventListener(
      'touchstart',
      (e) => {
        touchStartX = e.touches[0].clientX;
      },
      { passive: true }
    );
    marketBoard.addEventListener(
      'touchend',
      (e) => {
        const dx = e.changedTouches[0].clientX - touchStartX;
        if (Math.abs(dx) < 50) return;
        const currentIdx = REGIONS_ORDER.indexOf(state.activeRegion || 'gcc');
        let nextIdx = dx < 0 ? currentIdx + 1 : currentIdx - 1;
        nextIdx = Math.max(0, Math.min(REGIONS_ORDER.length - 1, nextIdx));
        if (nextIdx !== currentIdx) {
          state.activeRegion = REGIONS_ORDER[nextIdx];
          document.querySelectorAll('.tracker-region-pill[data-region]').forEach((btn) => {
            btn.classList.toggle('is-active', btn.dataset.region === state.activeRegion);
          });
          renderMarkets();
        }
      },
      { passive: true }
    );
  }

  // Redraw chart on resize so viewBox stays in sync with container dimensions
  let _resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(_resizeTimer);
    _resizeTimer = setTimeout(() => {
      if (state.mode === 'live') renderChart();
    }, 150);
  });
}

// Offline detection
function handleOnlineStatus() {
  const isOnline = navigator.onLine;
  let offlineBanner = document.getElementById('tp-offline-banner');
  if (!isOnline) {
    if (!offlineBanner) {
      offlineBanner = document.createElement('div');
      offlineBanner.id = 'tp-offline-banner';
      offlineBanner.style.cssText =
        'position:fixed;top:0;left:0;right:0;z-index:9999;background:#dc2626;color:white;text-align:center;padding:0.5rem;font-size:0.875rem;font-weight:500;';
      const cached = state.live?.updatedAt
        ? new Date(state.live.updatedAt).toLocaleTimeString()
        : 'unknown';
      offlineBanner.textContent = `⚠️ You're offline — showing cached prices from ${cached}`;
      document.body.prepend(offlineBanner);
    }
  } else {
    offlineBanner?.remove();
  }
}
window.addEventListener('online', handleOnlineStatus);
window.addEventListener('offline', handleOnlineStatus);

// ── Share / copy-URL buttons ──────────────────────────────────────────────
function initShareButtons() {
  function copyUrlToClipboard(btn) {
    const url = window.location.href;
    navigator.clipboard
      ?.writeText(url)
      .then(() => {
        if (!btn) return;
        const orig = btn.textContent;
        btn.textContent = '✓ Copied!';
        setTimeout(() => {
          btn.textContent = orig;
        }, 2000);
      })
      .catch(() => {});
  }
  document
    .getElementById('tp-copy-url')
    ?.addEventListener('click', (e) => copyUrlToClipboard(e.currentTarget));
  document
    .getElementById('tp-share-btn')
    ?.addEventListener('click', (e) => copyUrlToClipboard(e.currentTarget));
}

// ── First-time onboarding overlay ────────────────────────────────────────
function initOnboarding() {
  const SEEN_KEY = 'tracker_onb_seen';
  const overlay = document.getElementById('tracker-onboarding');
  if (!overlay) return;
  try {
    if (localStorage.getItem(SEEN_KEY) === '1') return;
  } catch {
    return;
  }

  setTimeout(() => {
    overlay.removeAttribute('hidden');
  }, 1800);

  function dismiss() {
    overlay.setAttribute('hidden', '');
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {}
  }
  document.getElementById('onb-dismiss')?.addEventListener('click', dismiss);
  document.getElementById('onb-close')?.addEventListener('click', dismiss);
  overlay.querySelector('.onb-backdrop')?.addEventListener('click', dismiss);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.hasAttribute('hidden')) dismiss();
  });
}

init();
initShareButtons();
initOnboarding();
