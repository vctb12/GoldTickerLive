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
    state.mode = 'live';
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
    navigator.clipboard?.writeText(txt).catch(() => {});
  });

  // Toolbar selects
  el.currency?.addEventListener('change', () => { state.selectedCurrency = el.currency.value; persistState(state); renderAll(); });
  el.karat?.addEventListener('change', () => { state.selectedKarat = el.karat.value; persistState(state); renderAll(); });
  el.unit?.addEventListener('change', () => { state.selectedUnit = el.unit.value; persistState(state); renderAll(); });
  el.language?.addEventListener('change', () => { state.lang = el.language.value; persistState(state); renderAll(); });

  // Range pills
  el.rangePills?.forEach(pill => {
    pill.addEventListener('click', () => {
      el.rangePills.forEach(p => p.classList.remove('is-active'));
      pill.classList.add('is-active');
      state.range = pill.dataset.range;
      persistState(state);
      renderAll();
    });
  });

  // Auto-refresh toggle
  el.autoRefresh?.addEventListener('click', () => {
    state.autoRefresh = !state.autoRefresh;
    el.autoRefresh.textContent = `Auto refresh: ${state.autoRefresh ? 'on' : 'off'}`;
    persistState(state);
    if (state.autoRefresh) startAutoRefresh();
    else stopAutoRefresh();
  });

  // Wire controls
  el.wireRefresh?.addEventListener('click', async () => { await refreshWire(); });
  el.wireToggle?.addEventListener('click', () => {
    const track = el.wireTrack;
    if (!track) return;
    const paused = track.style.animationPlayState === 'paused';
    track.style.animationPlayState = paused ? 'running' : 'paused';
    el.wireToggle.textContent = paused ? 'Pause' : 'Resume';
    el.wireToggle.setAttribute('aria-pressed', String(!paused));
  });

  // Alert save
  el.saveAlert?.addEventListener('click', () => {
    const scope = el.alertScope?.value || 'selected';
    const direction = el.alertDirection?.value || 'above';
    const target = parseFloat(el.alertTarget?.value);
    if (!Number.isFinite(target)) return;
    state.alerts = [...(state.alerts || []), { scope, direction, target }];
    persistState(state);
    renderAlerts();
    if (el.alertTarget) el.alertTarget.value = '';
  });

  // Notifications enable
  el.enableNotifications?.addEventListener('click', async () => {
    if (!('Notification' in window)) {
      if (el.alertPermission) el.alertPermission.textContent = 'Browser notifications not supported.';
      return;
    }
    const perm = await Notification.requestPermission();
    if (el.alertPermission) el.alertPermission.textContent = perm === 'granted' ? 'Notifications enabled.' : 'Notifications blocked.';
  });

  // Preset save
  el.savePreset?.addEventListener('click', () => {
    const name = el.presetName?.value?.trim();
    if (!name) return;
    state.presets = [...(state.presets || []), { name, currency: state.selectedCurrency, karat: state.selectedKarat, unit: state.selectedUnit, range: state.range }];
    persistState(state);
    renderPresets();
    if (el.presetName) el.presetName.value = '';
  });

  // Copy URL
  el.copyUrl?.addEventListener('click', () => {
    navigator.clipboard?.writeText(window.location.href).catch(() => {});
  });

  // Archive search
  el.archiveSearch?.addEventListener('input', () => renderArchive());
  el.archiveRange?.addEventListener('change', () => renderArchive());

  // Date lookup
  el.runLookup?.addEventListener('click', () => {
    const dateStr = el.lookupDate?.value;
    if (!dateStr || !el.lookupResults) return;
    const target = dateStr.slice(0, 7);
    const closest = state.history.find(r => {
      const d = r.date instanceof Date ? r.date.toISOString().slice(0, 7) : String(r.date).slice(0, 7);
      return d >= target;
    });
    if (closest) {
      const aed24 = priceFor({ currency: 'AED', karat: '24', unit: 'gram', spot: closest.spot });
      el.lookupResults.innerHTML = `<div class="tracker-result-item"><span>Date</span><strong>${closest.date instanceof Date ? closest.date.toISOString().slice(0, 10) : closest.date}</strong></div>
        <div class="tracker-result-item"><span>Spot</span><strong>$${closest.spot.toFixed(2)}</strong></div>
        <div class="tracker-result-item"><span>UAE 24K/g</span><strong>AED ${aed24 ? aed24.toFixed(2) : '—'}</strong></div>
        <div class="tracker-result-item"><span>Source</span><strong>${closest.source}</strong></div>`;
    } else {
      el.lookupResults.innerHTML = '<p style="color:var(--tp-text-muted)">No data for that date range.</p>';
    }
  });

  // Market filter
  el.marketFilter?.addEventListener('input', () => renderMarkets());
  el.marketSort?.addEventListener('change', () => renderMarkets());

  // Planner inputs
  [el.budgetAmount, el.budgetFee, el.positionEntry, el.positionQty, el.accumMonthly, el.accumTarget].forEach(inp => {
    inp?.addEventListener('input', () => renderPlanners());
  });

  // Export stubs (Phase 2 will wire real CSV generation)
  [el.exportChart, el.exportChart2, el.exportCurrent, el.exportArchive, el.exportArchive2,
   el.exportHistory, el.exportHistory2, el.exportWatchlist, el.downloadJson, el.downloadJson2, el.downloadBrief]
    .forEach(btn => btn?.addEventListener('click', () => alert('Export ready in Phase 2.')));
}

let _autoRefreshTimer = null;

function startAutoRefresh() {
  if (_autoRefreshTimer) return;
  _autoRefreshTimer = setInterval(async () => {
    if (!state.autoRefresh) return;
    await fetchLive();
    renderAll();
    if (el.refreshBadge) {
      el.refreshBadge.textContent = `Updated ${new Date().toLocaleTimeString()}`;
    }
  }, CONSTANTS.GOLD_REFRESH_MS);
}

function stopAutoRefresh() {
  clearInterval(_autoRefreshTimer);
  _autoRefreshTimer = null;
}

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
  await refreshData(false);
  renderAll();
  if (state.autoRefresh) startAutoRefresh();
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
  // Pass the cached daily snapshots so getUnifiedHistory() can merge them with
  // the monthly baseline. Previously called with no arguments, which always gave
  // an empty cachedDaily array and threw away all localStorage history.
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

// ─────────────────────────────────────────────────────────────────────────────
// PRICE HELPERS
// Phase 1: minimal implementations that make render functions safe to call.
// Phase 2 will replace these with the full render implementations.
// ─────────────────────────────────────────────────────────────────────────────

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
  return local; // gram default
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDER STUBS
// These prevent ReferenceError crashes while Phase 2 build-out is pending.
// Each stub writes a meaningful status into its target element(s).
// ─────────────────────────────────────────────────────────────────────────────

function renderHero() {
  const spot = currentSpot();
  const staleBadge = state.hasLiveFailure ? ' (cached)' : '';

  if (el.liveBadgeText) {
    el.liveBadgeText.textContent = spot
      ? `Live · XAU/USD ${spot.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${staleBadge}`
      : state.hasLiveFailure ? 'Live feed unavailable — showing cached data' : 'Connecting…';
  }
  if (el.marketBadge) {
    const now = new Date();
    const day = now.getUTCDay();
    const h = now.getUTCHours() * 60 + now.getUTCMinutes();
    const open = !(day === 6 || (day === 5 && h >= 21 * 60) || (day === 0 && h < 22 * 60));
    el.marketBadge.textContent = open ? '● Market open' : '○ Market closed';
  }
  if (el.heroStats && spot) {
    const aed24 = priceFor({ currency: 'AED', karat: '24', unit: 'gram', spot });
    const aed22 = priceFor({ currency: 'AED', karat: '22', unit: 'gram', spot });
    const usd24g = (spot / CONSTANTS.TROY_OZ_GRAMS) * (KARATS.find(k => k.code === '24')?.purity ?? 1);
    el.heroStats.innerHTML = [
      { label: 'XAU/USD', value: `$${spot.toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: 'per troy oz · live' },
      { label: 'UAE 24K', value: aed24 ? `AED ${aed24.toFixed(2)}` : '—', sub: 'per gram' },
      { label: 'UAE 22K', value: aed22 ? `AED ${aed22.toFixed(2)}` : '—', sub: 'per gram' },
      { label: 'USD/g 24K', value: usd24g ? `$${usd24g.toFixed(3)}` : '—', sub: 'per gram' },
    ].map(item => `<div class="tracker-hero-stat">
      <div class="tracker-hero-stat-label">${item.label}</div>
      <div class="tracker-hero-stat-value">${item.value}</div>
      <div class="tracker-hero-stat-sub">${item.sub}</div>
    </div>`).join('');
  }
}

function renderMiniStrip() {
  if (!el.miniStrip) return;
  const spot = currentSpot();
  if (!spot) { el.miniStrip.textContent = 'Waiting for live data…'; return; }
  const selected = priceFor({ currency: state.selectedCurrency, karat: state.selectedKarat, unit: state.selectedUnit, spot });
  el.miniStrip.textContent = selected
    ? `${state.selectedCurrency} ${state.selectedKarat}K / ${state.selectedUnit}: ${selected.toFixed(2)}`
    : '—';
}

function renderChart() {
  if (!el.chart) return;
  const spot = currentSpot();
  if (!state.history.length && !spot) {
    if (el.chartEmpty) el.chartEmpty.hidden = false;
    return;
  }
  if (el.chartEmpty) el.chartEmpty.hidden = true;
  // Phase 1: render a minimal SVG sparkline from history + live spot anchor.
  // Phase 2 will replace this with the full interactive chart.
  const rows = state.history.slice(-120); // last 120 points
  if (spot) rows.push({ date: new Date(), spot, source: 'live' });
  if (rows.length < 2) { el.chart.innerHTML = '<text x="50%" y="50%" text-anchor="middle" fill="#9d8c72" font-size="14">Collecting data…</text>'; return; }
  const prices = rows.map(r => r.spot);
  const min = Math.min(...prices) * 0.998;
  const max = Math.max(...prices) * 1.002;
  const W = 1200, H = 430;
  const pts = rows.map((r, i) => {
    const x = (i / (rows.length - 1)) * W;
    const y = H - ((r.spot - min) / (max - min)) * (H - 40) - 20;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const sourceLabel = state.hasLiveFailure ? 'cached' : 'live';
  el.chart.innerHTML = `
    <polyline points="${pts}" fill="none" stroke="#c49a44" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
    <text x="8" y="18" fill="#9d8c72" font-size="11">High: ${max.toFixed(0)}</text>
    <text x="8" y="${H - 6}" fill="#9d8c72" font-size="11">Low: ${min.toFixed(0)}</text>
    <text x="${W - 8}" y="${H - 6}" text-anchor="end" fill="#9d8c72" font-size="11">Source: ${sourceLabel} · ${rows.length} points</text>
  `;
  if (el.chartStats) {
    el.chartStats.innerHTML = `<div class="tracker-stat-item"><span>Points shown</span><strong>${rows.length}</strong></div>
      <div class="tracker-stat-item"><span>Source</span><strong>${sourceLabel}</strong></div>
      <div class="tracker-stat-item"><span>Baseline coverage</span><strong>2019–Mar 2025</strong></div>`;
  }
}

function renderKaratTable() {
  if (!el.karatTable) return;
  const spot = currentSpot();
  if (!spot) { el.karatTable.innerHTML = '<tr><td colspan="4">Waiting for live data…</td></tr>'; return; }
  const price24 = priceFor({ currency: state.selectedCurrency, karat: '24', unit: state.selectedUnit, spot });
  el.karatTable.innerHTML = KARATS.map(k => {
    const p = priceFor({ currency: state.selectedCurrency, karat: k.code, unit: state.selectedUnit, spot });
    const vs = price24 && p ? `${((p / price24) * 100).toFixed(1)}%` : '—';
    return `<tr>
      <td>${k.code}K</td>
      <td>${(k.purity * 100).toFixed(1)}%</td>
      <td>${p ? p.toFixed(2) : '—'} ${state.selectedCurrency}</td>
      <td>${vs}</td>
    </tr>`;
  }).join('');
}

function renderMarkets() {
  if (!el.marketBoard) return;
  const spot = currentSpot();
  if (!spot) { el.marketBoard.innerHTML = '<p style="padding:1rem;color:var(--tp-text-muted)">Waiting for live data…</p>'; return; }
  const filtered = COUNTRIES.filter(c => {
    if (el.marketFilter?.value) {
      const q = el.marketFilter.value.toLowerCase();
      if (!c.nameEn.toLowerCase().includes(q) && !c.currency.toLowerCase().includes(q)) return false;
    }
    return true;
  }).slice(0, 30);
  el.marketBoard.innerHTML = filtered.map(c => {
    const cur = c.currency;
    const p = priceFor({ currency: cur, karat: state.selectedKarat, unit: state.selectedUnit, spot });
    const isFav = (state.favorites || []).includes(cur);
    return `<div class="tracker-board-card${isFav ? ' is-fav' : ''}">
      <div class="tracker-board-flag">${c.flag}</div>
      <div class="tracker-board-name">${c.nameEn}</div>
      <div class="tracker-board-cur">${cur}</div>
      <div class="tracker-board-price">${p ? p.toFixed(2) : '—'}</div>
    </div>`;
  }).join('');
  if (el.marketEmpty) el.marketEmpty.hidden = filtered.length > 0;
}

function renderWatchlist() {
  if (!el.watchlistGrid) return;
  const spot = currentSpot();
  const favs = state.favorites || [];
  if (!favs.length || !spot) { el.watchlistGrid.innerHTML = '<p style="color:var(--tp-text-muted);font-size:0.85rem">No favorites set. Add currencies via the Compare tab.</p>'; return; }
  el.watchlistGrid.innerHTML = favs.map(cur => {
    const country = COUNTRIES.find(c => c.currency === cur);
    const p = priceFor({ currency: cur, karat: state.selectedKarat, unit: state.selectedUnit, spot });
    return `<div class="tracker-watchlist-item">
      <span>${country?.flag ?? ''} ${cur}</span>
      <strong>${p ? p.toFixed(2) : '—'}</strong>
    </div>`;
  }).join('');
}

function renderDecisionCues() {
  if (!el.decisionCues) return;
  const spot = currentSpot();
  if (!spot) { el.decisionCues.innerHTML = ''; return; }
  const lines = [
    `Live spot: $${spot.toFixed(2)} / troy oz`,
    state.hasLiveFailure ? '⚠ Data source: cached — API unreachable' : '✓ Data source: live API',
    `History coverage: 2019–Mar 2025 (LBMA baseline) + session snapshots`,
  ];
  el.decisionCues.innerHTML = lines.map(l => `<div class="tracker-note-item">${l}</div>`).join('');
}

function renderAlerts() {
  if (!el.alertList) return;
  const alerts = state.alerts || [];
  el.alertList.innerHTML = alerts.length
    ? alerts.map((a, i) => `<div class="tracker-stack-item">${a.scope} ${a.direction} ${a.target} <button data-idx="${i}" class="tracker-remove-btn">×</button></div>`).join('')
    : '<p style="color:var(--tp-text-muted);font-size:0.85rem">No alerts set.</p>';
}

function renderPresets() {
  if (!el.presetList) return;
  const presets = state.presets || [];
  el.presetList.innerHTML = presets.length
    ? presets.map((p, i) => `<div class="tracker-stack-item">${p.name} <button data-idx="${i}" class="tracker-remove-btn">×</button></div>`).join('')
    : '<p style="color:var(--tp-text-muted);font-size:0.85rem">No presets saved.</p>';
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

  // Accumulation
  if (el.accumResults) {
    const monthly = parseFloat(el.accumMonthly?.value) || 0;
    const target = parseFloat(el.accumTarget?.value) || 0;
    const p = priceFor({ currency: state.selectedCurrency, karat: state.selectedKarat, unit: 'gram', spot });
    if (p && monthly && target) {
      const gramsPerMonth = monthly / p;
      const months = target / gramsPerMonth;
      el.accumResults.innerHTML = `<div class="tracker-result-item"><span>Grams / month</span><strong>${gramsPerMonth.toFixed(3)} g</strong></div>
        <div class="tracker-result-item"><span>Months to target</span><strong>${months.toFixed(1)}</strong></div>`;
    } else {
      el.accumResults.innerHTML = '<p style="color:var(--tp-text-muted)">Enter values above.</p>';
    }
  }
}

function renderArchive() {
  if (!el.archiveBody) return;
  const rows = state.history.slice().reverse().slice(0, 200);
  if (!rows.length) {
    el.archiveBody.innerHTML = '<tr><td colspan="5">No archive data available yet.</td></tr>';
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
      <td><span class="tracker-source-badge tracker-source-badge--${r.source}">${r.source}</span></td>
    </tr>`;
  }).join('');
  if (el.archiveMeta) {
    el.archiveMeta.textContent = `${rows.length} records · newest first · sources: LBMA-baseline, local-snapshot, live`;
  }
  void spot; // silence unused warning — spot used indirectly via priceFor
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
    + `History: LBMA monthly baseline 2019–Mar 2025 + session snapshots.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDER ALL
// ─────────────────────────────────────────────────────────────────────────────

function renderAll() {
  document.title = state.lang === 'ar'
    ? 'متتبع الذهب برو — مساحة العمل المباشرة'
    : 'Gold Tracker Pro — Live Price Workspace';

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
