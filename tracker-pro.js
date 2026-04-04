// tracker-pro.js — slim orchestrator
import { CONSTANTS, KARATS, COUNTRIES } from './config/index.js';
import * as api from './lib/api.js';
import * as cache from './lib/cache.js';
import * as exp from './lib/export.js';
import { createInitialState, persistState } from './tracker/state.js';
import { applyUrlState } from './tracker/state.js';
import { mountShell, updateShellTickerFromState } from './tracker/ui-shell.js';
import { fetchWire, renderWire as renderWireModule } from './tracker/wire.js';
import { getUnifiedHistory } from './lib/historical-data.js';
import { initRender, renderAll, renderMarkets, renderAlerts, renderPresets, renderPlanners, renderArchive } from './tracker/render.js';
import { initEvents, bindCoreEvents } from './tracker/events.js';

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

function bindCoreEvents() {
  // Refresh button
  el.refreshBtn?.addEventListener('click', async () => {
    el.refreshBtn.disabled = true;
    el.refreshBtn.textContent = 'Refreshing…';
    await refreshData(true);
    renderAll();
    el.refreshBtn.disabled = false;
    el.refreshBtn.textContent = 'Refresh live data';
  });

  // Reset view
  el.resetBtn?.addEventListener('click', () => {
    state.view = 'live';
    state.activeTool = null;
    state.selectedCurrency = 'AED';
    state.selectedKarat = '24';
    state.selectedUnit = 'gram';
    state.range = '30D';
    persistState(state);
    renderAll();
  });

  // Share brief
  el.shareBtn?.addEventListener('click', () => {
    const spot = currentSpot();
    const txt = spot
      ? `Gold: $${spot.toFixed(2)}/oz · UAE 24K: AED ${priceFor({ currency:'AED', karat:'24', unit:'gram', spot })?.toFixed(2)}/g · ${new Date().toUTCString()}`
      : 'Gold data unavailable';
    navigator.clipboard?.writeText(txt).then(() => {
      showToast('Brief copied to clipboard');
    }).catch(() => {
      showToast('Failed to copy to clipboard');
    });
  });

function currentSpot() {
  return state.live?.price ?? null;
}

function priceFor({ currency, karat, unit, spot }) {
  const s = spot ?? currentSpot();
  if (!s) return null;
  const karatObj = KARATS.find(k => k.code === String(karat));
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
  if (!spot || !(state.alerts?.length)) return;
  state.alerts.forEach(a => {
    const hit = a.direction === 'above' ? spot > a.target : spot < a.target;
    if (hit && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Gold Price Alert', {
        body: `XAU/USD ${a.direction} ${a.target}: now $${spot.toFixed(2)}`,
      });
    }
  });
}

function exportArchiveData() {
  if (!state.history.length) { showToast('No archive data available.'); return; }
  const records = state.history.map(r => ({
    date: r.date instanceof Date ? r.date.toISOString().slice(0, 10) : String(r.date),
    price: r.spot,
    source: r.source,
    granularity: r.granularity,
  }));
  exp.exportHistoricalCSV(records, state.selectedKarat);
}

function exportHistoryData() {
  exportArchiveData();
}

function exportJsonData() {
  const spot = currentSpot();
  const prices = {};
  if (spot) {
    KARATS.forEach(k => {
      prices[k.code] = {};
      [...new Set(COUNTRIES.map(c => c.currency))].forEach(cur => {
        const p = priceFor({ currency: cur, karat: k.code, unit: 'gram', spot });
        if (p) prices[k.code][cur] = { gram: p, oz: p * CONSTANTS.TROY_OZ_GRAMS };
      });
    });
  }
  const exportState = {
    goldPriceUsdPerOz: spot || null,
    freshness: { goldUpdatedAt: state.live?.updatedAt || new Date().toISOString(), fxUpdatedAt: state.fxMeta?.lastUpdateUtc || new Date().toISOString() },
    rates: state.rates,
    lang: state.lang,
  };
  exp.exportJSON(exportState, prices);
}

// ── Auto-refresh ──────────────────────────────────────────────────────────────

let _autoRefreshTimer = null;

function startAutoRefresh() {
  if (_autoRefreshTimer) return;
  _autoRefreshTimer = setInterval(async () => {
    if (!state.autoRefresh) return;
    await fetchLive();
    checkAlerts();
    renderAll();
    if (el.refreshBadge) {
      const now = new Date().toLocaleTimeString();
      el.refreshBadge.textContent = state.hasLiveFailure
        ? `Last update ${now} (fallback)`
        : `Live · synced ${now}`;
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
    const currencies = [...new Set(COUNTRIES.map(c => c.currency))].sort();
    el.currency.innerHTML = currencies.map(c => `<option value="${c}"${c === state.selectedCurrency ? ' selected' : ''}>${c}</option>`).join('');
  }
  if (el.karat) {
    el.karat.innerHTML = KARATS.map(k => `<option value="${k.code}"${k.code === state.selectedKarat ? ' selected' : ''}>${k.code}K — ${(k.purity * 100).toFixed(1)}%</option>`).join('');
  }
  if (el.unit) {
    el.unit.innerHTML = ['gram','oz'].map(u => `<option value="${u}"${u === state.selectedUnit ? ' selected' : ''}>${u}</option>`).join('');
  }
  if (el.language) el.language.value = state.lang;
  if (el.jewelryKarat) {
    el.jewelryKarat.innerHTML = KARATS.map(k => `<option value="${k.code}">${k.code}K</option>`).join('');
  }
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

  populateSelects();
  bindCoreEvents();

  // Restore trust banner dismissal state
  if (localStorage.getItem('tracker_trust_banner_dismissed')) {
    const trustSection = document.querySelector('.tracker-data-trust-section');
    if (trustSection) trustSection.style.display = 'none';
  }

  // Initialize region tabs active state
  const regionTabs = document.querySelectorAll('.tracker-region-pill[data-region]');
  regionTabs.forEach(btn => {
    const isActive = btn.dataset.region === (state.activeRegion || 'gcc');
    btn.classList.toggle('is-active', isActive);
  });

  await refreshData(false);
  renderAll();
  if (state.autoRefresh) startAutoRefresh();

  // Add hashchange listener for back/forward button support
  window.addEventListener('hashchange', () => {
    applyUrlState(state);
    shellCtrl.updateTabsAndPanels();
    renderAll();
  });
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
      state.hasLiveFailure = false;
      cache.saveGoldPrice(data.price, data.updatedAt);
      cache.checkDayOpenReset({ goldPriceUsdPerOz: data.price });
      const today = new Date().toISOString().slice(0, 10);
      const alreadySaved = (state.snapshots || []).some(s => s.date === today);
      if (!alreadySaved) {
        state.snapshots = [...(state.snapshots || []), { date: today, price: data.price, timestamp: Date.now() }];
      }
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
  const cachedDaily = Array.isArray(state.snapshots) ? state.snapshots : [];
  const unified = await getUnifiedHistory(cachedDaily);
  state.history = unified.map(row => ({
    date: new Date(row.date.length === 7 ? `${row.date}-01` : row.date),
    spot: Number(row.price),
    source: row.source,
    granularity: row.granularity,
  })).filter(r => r.spot > 0 && Number.isFinite(r.date.getTime()));
}

async function refreshWire() {
  const { items } = await fetchWire(state.wireItems || []);
  state.wireItems = items;
  renderWireModule(el, state);
}

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  Object.assign(el, ui());

  document.documentElement.lang = state.lang;
  document.documentElement.dir = state.lang === 'ar' ? 'rtl' : 'ltr';

  // Init sub-modules with their dependencies
  initRender({ state, el, priceFor, currentSpot, showToast });
  initEvents({
    state, el,
    refreshData, renderAll,
    renderMarkets, renderAlerts, renderPresets, renderPlanners, renderArchive,
    showToast, currentSpot, priceFor,
    startAutoRefresh, stopAutoRefresh,
    populateSelects, refreshWire,
    exportArchiveData, exportHistoryData, exportJsonData,
  });

  mountShell(
    state,
    el,
    /* onModeChange */ () => { populateSelects(); renderAll(); },
    /* onLangChange */ () => renderAll(),
  );

  populateSelects();
  bindCoreEvents();

  if (localStorage.getItem('tracker_trust_banner_dismissed')) {
    const trustSection = document.querySelector('.tracker-data-trust-section');
    if (trustSection) trustSection.style.display = 'none';
  }

  const regionTabs = document.querySelectorAll('.tracker-region-pill[data-region]');
  regionTabs.forEach(btn => {
    const isActive = btn.dataset.region === (state.activeRegion || 'gcc');
    btn.classList.toggle('is-active', isActive);
  });

  if (el.marketEmpty) el.marketEmpty.hidden = filtered.length > 0;
}

function renderWatchlist() {
  if (!el.watchlistGrid) return;
  const spot = currentSpot();
  const favs = state.favorites || [];
  if (!favs.length || !spot) {
    el.watchlistGrid.innerHTML = '<p style="color:var(--tp-text-muted);font-size:0.85rem">No favorites set. Add currencies via the Compare tab. Your watchlist will appear here for quick reference.</p>';
    return;
  }
  el.watchlistGrid.innerHTML = favs.map(cur => {
    const country = COUNTRIES.find(c => c.currency === cur);
    const p = priceFor({ currency: cur, karat: state.selectedKarat, unit: state.selectedUnit, spot });
    const name = state.lang === 'ar' ? (country?.nameAr || country?.nameEn) : country?.nameEn;
    const isCurrent = state.selectedCurrency === cur;
    return `<div class="tracker-watch-card${isCurrent ? ' is-highlight' : ''}">
      <div class="tracker-watch-top">
        <div class="tracker-watch-title">
          <strong>${country?.flag ?? ''} ${name ?? cur}</strong>
          <span>${cur}${isCurrent ? ' · selected' : ''}</span>
        </div>
        <div class="tracker-watch-value">
          <strong>${p ? p.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}</strong>
          <span>${state.selectedKarat}K / ${state.selectedUnit}</span>
        </div>
      </div>
    </div>`;
  }).join('');
}

function renderDecisionCues() {
  if (!el.decisionCues) return;
  const spot = currentSpot();
  if (!spot) { el.decisionCues.innerHTML = ''; return; }
  const lines = [
    `Live spot: $${spot.toFixed(2)} / troy oz`,
    state.hasLiveFailure
      ? `⚠ Data source: fallback — using cache (API unreachable — live may return soon)`
      : `✓ Data source: live · last API fetch successful`,
    `History coverage: 2019–Aug 2025 (LBMA baseline) + ${state.snapshots?.length || 0} session snapshots`,
  ];
  el.decisionCues.innerHTML = lines.map(l => `<div class="tracker-note-item">${l}</div>`).join('');
}

function renderAlerts() {
  if (!el.alertList) return;
  const alerts = state.alerts || [];
  const spot = currentSpot();
  el.alertList.innerHTML = alerts.length
    ? alerts.map((a, i) => {
        const hit = spot && (a.direction === 'above' ? spot > a.target : spot < a.target);
        let proximity = '';
        let proximityClass = '';
        if (spot) {
          const distance = Math.abs(spot - a.target);
          const pct = (distance / a.target) * 100;
          if (pct < 1) {
            proximity = '⚡ very close';
            proximityClass = ' is-alert-imminent';
          } else if (pct < 3) {
            proximity = '● nearby';
            proximityClass = ' is-alert-close';
          }
        }
        return `<div class="tracker-stack-item${hit ? ' is-triggered' : ''}${proximityClass}">
          <div style="flex:1">
            <span>${a.scope} ${a.direction} <strong>$${a.target}</strong>${hit ? ' ✓ triggered' : ''}</span>
            ${proximity ? `<div style="font-size:0.8rem;color:var(--tp-text-muted);margin-top:0.25rem">${proximity}</div>` : ''}
          </div>
          <button data-idx="${i}" class="tracker-remove-btn" aria-label="Delete alert">×</button>
        </div>`;
      }).join('')
    : '<p style="color:var(--tp-text-muted);font-size:0.85rem">No alerts set.</p>';
}

function renderPresets() {
  if (!el.presetList) return;
  const presets = state.presets || [];
  el.presetList.innerHTML = presets.length
    ? presets.map((p, i) => {
        const isCurrent = state.selectedCurrency === p.currency &&
                         state.selectedKarat === p.karat &&
                         state.selectedUnit === p.unit &&
                         state.range === p.range;
        return `<div class="tracker-stack-item${isCurrent ? ' is-highlight' : ''}">
        <div style="flex:1">
          <div><strong>${p.name}</strong></div>
          <div style="font-size:0.8rem;color:var(--tp-text-muted);margin-top:0.25rem">
            ${p.karat}K · ${p.currency}/${p.unit} · ${p.range} range
            ${isCurrent ? ' · <span style="color:var(--tp-accent)">● current</span>' : ''}
          </div>
        </div>
        <span>
          <button data-idx="${i}" class="tracker-load-btn tracker-pill">Load</button>
          <button data-idx="${i}" class="tracker-remove-btn" aria-label="Delete preset">×</button>
        </span>
      </div>`;
      }).join('')
    : '<p style="color:var(--tp-text-muted);font-size:0.85rem">No presets saved. Save the current view via the form above.</p>';
}

function renderPlanners() {
  const spot = currentSpot();
  if (!spot) return;

  // Budget
  if (el.budgetResults) {
    const budget = parseFloat(el.budgetAmount?.value) || 0;
    const fee = parseFloat(el.budgetFee?.value) || 0;
    const net = budget / (1 + fee / 100);
    const p = priceFor({ currency: state.selectedCurrency, karat: state.selectedKarat, unit: 'gram', spot });
    el.budgetResults.innerHTML = p && net
      ? `<div class="tracker-result-item"><span>Net budget</span><strong>${net.toFixed(2)} ${state.selectedCurrency}</strong></div>
         <div class="tracker-result-item"><span>Gold you can buy</span><strong>${(net / p).toFixed(3)} g (${state.selectedKarat}K)</strong></div>`
      : '<p style="color:var(--tp-text-muted)">Enter a budget above.</p>';
  }

  // Position
  if (el.positionResults) {
    const entry = parseFloat(el.positionEntry?.value) || 0;
    const qty = parseFloat(el.positionQty?.value) || 0;
    const p = priceFor({ currency: state.selectedCurrency, karat: state.selectedKarat, unit: 'gram', spot });
    if (entry && qty && p) {
      const entryValue = entry * qty;
      const currentValue = p * qty;
      const gainLoss = currentValue - entryValue;
      const gainLossPercent = (gainLoss / entryValue) * 100;
      el.positionResults.innerHTML = `<div class="tracker-result-item"><span>Entry value</span><strong>${entryValue.toFixed(2)} ${state.selectedCurrency}</strong></div>
        <div class="tracker-result-item"><span>Current value</span><strong>${currentValue.toFixed(2)} ${state.selectedCurrency}</strong></div>
        <div class="tracker-result-item"><span>Gain / loss</span><strong style="color:${gainLoss >= 0 ? 'var(--tp-live)' : 'var(--tp-danger)'}">${gainLoss >= 0 ? '+' : ''}${gainLoss.toFixed(2)} ${state.selectedCurrency} (${gainLossPercent >= 0 ? '+' : ''}${gainLossPercent.toFixed(1)}%)</strong></div>`;
    } else {
      el.positionResults.innerHTML = '<p style="color:var(--tp-text-muted)">Enter entry price and quantity above.</p>';
    }
  }

  // Jewelry
  if (el.jewelryResults) {
    const weight = parseFloat(el.jewelryWeight?.value) || 0;
    const karatCode = el.jewelryKarat?.value || state.selectedKarat;
    const making = parseFloat(el.jewelryMaking?.value) || 0;
    const premium = parseFloat(el.jewelryPremium?.value) || 0;
    const vat = el.jewelryVat?.checked ? 0.05 : 0;
    const karat = KARATS.find(k => k.code === karatCode);
    const p = priceFor({ currency: state.selectedCurrency, karat: karatCode, unit: 'gram', spot });
    if (weight && p && karat) {
      const goldValue = p * weight;
      const makingTotal = making * weight;
      const premiumTotal = (goldValue * premium) / 100;
      const subtotal = goldValue + makingTotal + premiumTotal;
      const vatAmount = subtotal * vat;
      const total = subtotal + vatAmount;
      el.jewelryResults.innerHTML = `<div class="tracker-result-item"><span>Gold value</span><strong>${goldValue.toFixed(2)} ${state.selectedCurrency}</strong></div>
        <div class="tracker-result-item"><span>Making charge</span><strong>${makingTotal.toFixed(2)} ${state.selectedCurrency}</strong></div>
        ${premium ? `<div class="tracker-result-item"><span>Premium</span><strong>${premiumTotal.toFixed(2)} ${state.selectedCurrency}</strong></div>` : ''}
        <div class="tracker-result-item"><span>Subtotal</span><strong>${subtotal.toFixed(2)} ${state.selectedCurrency}</strong></div>
        ${vat ? `<div class="tracker-result-item"><span>VAT (5%)</span><strong>${vatAmount.toFixed(2)} ${state.selectedCurrency}</strong></div>` : ''}
        <div class="tracker-result-item"><span>Total</span><strong style="color:var(--tp-accent)">${total.toFixed(2)} ${state.selectedCurrency}</strong></div>`;
    } else {
      el.jewelryResults.innerHTML = '<p style="color:var(--tp-text-muted)">Enter weight and select karat above.</p>';
    }
  }

  // Accumulation
  if (el.accumResults) {
    const monthly = parseFloat(el.accumMonthly?.value) || 0;
    const target = parseFloat(el.accumTarget?.value) || 0;
    const p = priceFor({ currency: state.selectedCurrency, karat: state.selectedKarat, unit: 'gram', spot });
    if (p && monthly && target) {
      const gramsPerMonth = monthly / p;
      const months = target / gramsPerMonth;
      const years = months / 12;
      el.accumResults.innerHTML = `<div class="tracker-result-item"><span>Grams / month</span><strong>${gramsPerMonth.toFixed(3)} g</strong></div>
        <div class="tracker-result-item"><span>Months to target</span><strong>${months.toFixed(1)}</strong></div>
        <div class="tracker-result-item"><span>Years to target</span><strong>${years.toFixed(2)}</strong></div>`;
    } else {
      el.accumResults.innerHTML = '<p style="color:var(--tp-text-muted)">Enter monthly contribution and target quantity above.</p>';
    }
  }
}

function renderArchive() {
  if (!el.archiveBody) return;
  let rows = state.history.slice().reverse();

  // Apply range filter
  const range = el.archiveRange?.value || 'ALL';
  if (range !== 'ALL') {
    const daysBack = {
      '30D': 30, '90D': 90, '1Y': 365, '3Y': 1095, '5Y': 1825
    }[range] || 0;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysBack);
    rows = rows.filter(r => {
      const d = r.date instanceof Date ? r.date : new Date(r.date);
      return d >= cutoff;
    });
  }

  // Apply search filter
  const query = el.archiveSearch?.value?.toLowerCase() || '';
  if (query) {
    rows = rows.filter(r => {
      const dateStr = r.date instanceof Date ? r.date.toISOString() : String(r.date);
      return dateStr.includes(query) || r.source.toLowerCase().includes(query);
    });
  }

  rows = rows.slice(0, 200);

  if (!rows.length) {
    el.archiveBody.innerHTML = '<tr><td colspan="5">No records match filters.</td></tr>';
    if (el.archiveMeta) el.archiveMeta.textContent = '';
    return;
  }
  const spot = currentSpot();
  el.archiveBody.innerHTML = rows.map(r => {
    const aed24 = priceFor({ currency: 'AED', karat: '24', unit: 'gram', spot: r.spot });
    const selected = priceFor({ currency: state.selectedCurrency, karat: state.selectedKarat, unit: state.selectedUnit, spot: r.spot });
    return `<tr>
      <td>${r.date instanceof Date ? r.date.toISOString().slice(0, 10) : r.date}</td>
      <td>$${r.spot.toFixed(2)}</td>
      <td>${selected ? selected.toFixed(2) : '—'}</td>
      <td>${aed24 ? aed24.toFixed(2) : '—'}</td>
      <td><span class="tracker-source-badge tracker-source-badge--${r.source}">${r.source}${r.granularity ? ' · ' + r.granularity : ''}</span></td>
    </tr>`;
  }).join('');
  if (el.archiveMeta) {
    const sourceInfo = state.history.some(r => r.source === 'live' || r.source === 'session-cache')
      ? 'session + baseline'
      : 'baseline';
    el.archiveMeta.textContent = `${rows.length}/${state.history.length} records · ${sourceInfo} · 2019–present · filter by date or source`;
  }
}

function renderBrief() {
  if (!el.briefHeadline || !el.briefCopy) return;
  const spot = currentSpot();
  if (!spot) {
    el.briefHeadline.textContent = 'Waiting for live data';
    el.briefCopy.textContent = 'Gold price data is loading. If this persists, the API may be temporarily unavailable — last cached price will be shown when available.';
    return;
  }
  const aed24 = priceFor({ currency: 'AED', karat: '24', unit: 'gram', spot });
  const src = state.hasLiveFailure ? 'cached (API unavailable)' : 'live';
  el.briefHeadline.textContent = `Gold at $${spot.toFixed(2)} / troy oz — ${src}`;
  el.briefCopy.textContent = `UAE 24K: AED ${aed24 ? aed24.toFixed(2) : '—'}/g. `
    + `Selected view: ${state.selectedKarat}K in ${state.selectedCurrency} per ${state.selectedUnit}. `
    + `FX source: open.er-api.com (AED uses fixed peg 3.6725). `
    + `History: LBMA monthly baseline 2019–Aug 2025 + session snapshots.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDER ALL
// ─────────────────────────────────────────────────────────────────────────────

function renderAll() {
  document.title = state.lang === 'ar'
    ? 'متتبع الذهب برو — مساحة العمل المباشرة'
    : 'Gold Tracker Pro — Live Price Workspace';

  renderHero();

  // Render view content
  if (state.view === 'live') {
    renderMiniStrip();
    renderChart();
    renderKaratTable();
    renderMarkets();
    renderWatchlist();
    renderDecisionCues();
  } else if (state.view === 'compare') {
    renderMarkets();
  } else if (state.view === 'archive') {
    renderArchive();
  }

  // Render active tool overlay (if any)
  if (state.activeTool === 'alerts') {
    renderAlerts();
    renderPresets();
  } else if (state.activeTool === 'planner') {
    renderPlanners();
  }

  renderBrief();

  const spot = currentSpot();
  updateShellTickerFromState(state, spot, priceFor);
}

init();
