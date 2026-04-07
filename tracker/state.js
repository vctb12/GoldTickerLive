// tracker/state.js
import { CONSTANTS } from '../config/index.js';
import * as cache from '../lib/cache.js';
import { showStorageQuotaWarning } from '../lib/cache.js';

export const STORAGE_KEYS = {
  core: 'tracker_pro_state_v5',
  presets: 'tracker_pro_presets_v5',
  wire: 'tracker_pro_wire_v5',
  watchlist: 'tracker_pro_favorites_v5',
};

export const VALID_MODES = new Set(['live', 'compare', 'archive', 'alerts', 'planner', 'exports', 'method']);

export const DEFAULT_STATE = {
  lang: 'en',
  mode: 'live',
  selectedCurrency: 'AED',
  selectedKarat: '24',
  selectedUnit: 'gram',
  compareCurrency: 'USD',
  range: '30D',
  metric: 'selected',
  autoRefresh: true,
  favoritesOnly: false,
  liveWireOn: true,
  activeRegion: 'gcc',
  // Market + history
  live: null,
  rates: {},
  fxMeta: {},
  history: [], // unified history rows
  snapshots: [],
  // User artefacts
  alerts: [],
  presets: [],
  favorites: ['AED', 'USD', 'SAR'],
  wireItems: [],
  // UI
  timers: { live: null, wire: null, playback: null },
  lastRangeRows: [],
  lastArchiveRows: [],
  playbackIndex: null,
  hasLiveFailure: false,
};

export function createInitialState() {
  const base = structuredClone(DEFAULT_STATE);

  // Load shared cache into a stub first so we don't double-maintain logic.
  const stub = {
    lang: base.lang,
    goldPriceUsdPerOz: null,
    rates: {},
    fxMeta: { lastUpdateUtc: null, nextUpdateUtc: 0 },
    status: {},
    freshness: {},
    favorites: [],
    history: [],
    selectedKaratSpotlight: base.selectedKarat,
    selectedKaratCountries: base.selectedKarat,
    selectedUnitTable: base.selectedUnit === 'gram' ? 'gram' : 'oz',
    sortOrder: 'high-low',
    searchQuery: '',
    activeTab: 'gcc',
    prevGoldPriceUsdPerOz: null,
    dayOpenGoldPriceUsdPerOz: null,
    isOnline: navigator.onLine,
    volatility7d: null,
    cacheHealthScore: 0,
  };

  cache.loadState(stub);

  // Seed tracker state from shared cache
  if (stub.goldPriceUsdPerOz) {
    base.live = {
      price: stub.goldPriceUsdPerOz,
      updatedAt: stub.freshness.goldUpdatedAt || new Date().toISOString(),
      raw: {},
    };
  }
  base.rates = stub.rates || {};
  base.fxMeta = stub.fxMeta || {};
  if (Array.isArray(stub.history) && stub.history.length) {
    base.history = stub.history.map(row => ({
      date: new Date(row.date || row.timestamp || row.ts),
      spot: Number(row.price || row.spot || 0),
      source: row.source || 'session-cache',
    })).filter(r => Number.isFinite(r.date.getTime()) && r.spot > 0);
  }

  // Tracker-specific saved state
  const saved = readLocal(STORAGE_KEYS.core, {});
  base.lang = saved.lang || readLanguagePref() || base.lang;
  base.mode = (VALID_MODES.has(saved.mode) ? saved.mode : null) || base.mode;
  base.selectedCurrency = saved.selectedCurrency || base.selectedCurrency;
  base.selectedKarat = saved.selectedKarat || base.selectedKarat;
  base.selectedUnit = saved.selectedUnit || base.selectedUnit;
  base.compareCurrency = saved.compareCurrency || base.compareCurrency;
  base.range = saved.range || base.range;
  base.metric = saved.metric || base.metric;
  base.autoRefresh = saved.autoRefresh !== false;
  base.favoritesOnly = !!saved.favoritesOnly;
  base.liveWireOn = saved.liveWireOn !== false;
  base.activeRegion = saved.activeRegion || base.activeRegion;

  base.alerts = readLocal(CONSTANTS.CACHE_KEYS.alerts || 'gold_price_alerts', []);
  base.presets = readLocal(STORAGE_KEYS.presets, []);
  base.favorites = readLocal(STORAGE_KEYS.watchlist, base.favorites);
  base.snapshots = readLocal(CONSTANTS.CACHE_KEYS.history, []); // re-used as session snapshots
  base.wireItems = readLocal(STORAGE_KEYS.wire, []);

  applyUrlState(base);
  writeLanguagePref(base.lang);

  return base;
}

export function persistState(state) {
  const payload = {
    lang: state.lang,
    mode: state.mode,
    selectedCurrency: state.selectedCurrency,
    selectedKarat: state.selectedKarat,
    selectedUnit: state.selectedUnit,
    compareCurrency: state.compareCurrency,
    range: state.range,
    metric: state.metric,
    autoRefresh: state.autoRefresh,
    favoritesOnly: state.favoritesOnly,
    liveWireOn: state.liveWireOn,
    activeRegion: state.activeRegion,
  };
  writeLocal(STORAGE_KEYS.core, payload);
  writeLocal(CONSTANTS.CACHE_KEYS.alerts, state.alerts.slice(0, 50));
  writeLocal(STORAGE_KEYS.presets, state.presets.slice(0, 20));
  writeLocal(STORAGE_KEYS.watchlist, state.favorites.slice(0, 32));
  writeLocal(STORAGE_KEYS.wire, state.wireItems.slice(0, 32));
}

export function syncUrlFromState(state) {
  const url = new URL(window.location.href);
  url.hash = `mode=${state.mode}&cur=${state.selectedCurrency}&k=${state.selectedKarat}&u=${state.selectedUnit}&r=${state.range}&cmp=${state.compareCurrency}&lang=${state.lang}`;
  history.replaceState(null, '', url.toString());
}

export function applyUrlState(state) {
  const hash = window.location.hash.slice(1);
  if (!hash) return;
  const params = new URLSearchParams(hash);
  const urlMode = params.get('mode');
  if (urlMode && VALID_MODES.has(urlMode)) state.mode = urlMode;
  state.selectedCurrency = params.get('cur') || state.selectedCurrency;
  state.selectedKarat = params.get('k') || state.selectedKarat;
  state.selectedUnit = params.get('u') || state.selectedUnit;
  state.range = params.get('r') || state.range;
  state.compareCurrency = params.get('cmp') || state.compareCurrency;
  const urlLang = params.get('lang');
  if (urlLang === 'en' || urlLang === 'ar') state.lang = urlLang;
}

function readLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Tracker storage write failed (quota?):', e.message);
    showStorageQuotaWarning();
  }
}

function readLanguagePref() {
  try {
    const prefs = JSON.parse(localStorage.getItem(CONSTANTS.CACHE_KEYS.userPrefs) || '{}');
    return prefs.lang;
  } catch {
    return null;
  }
}

function writeLanguagePref(lang) {
  cache.savePreference('lang', lang);
}
