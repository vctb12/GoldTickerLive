// tracker/state.js
import { CONSTANTS } from '../config/index.js';
import { COUNTRIES } from '../config/index.js';
import * as cache from '../lib/cache.js';
import { showStorageQuotaWarning } from '../lib/cache.js';
import { getLiveFreshness } from '../lib/live-status.js';
import {
  emitTrackerChange,
  emitGoldPriceUpdate,
  emitFreshnessChange,
  getPriceDirection,
  isLiveFreshness,
} from '../lib/animation.js';

export const STORAGE_KEYS = {
  core: 'tracker_pro_state_v5',
  presets: 'tracker_pro_presets_v5',
  wire: 'tracker_pro_wire_v5',
  watchlist: 'tracker_pro_favorites_v5',
};

export const VALID_MODES = new Set(['live', 'compare', 'archive', 'exports', 'method']);
export const VALID_PANELS = new Set(['alerts', 'planner']);

export const DEFAULT_STATE = {
  lang: 'en',
  mode: 'live',
  workspaceLevel: 'basic',
  selectedCurrency: 'AED',
  selectedKarat: '24',
  selectedUnit: 'gram',
  compareCurrency: 'USD',
  compareCountries: ['AE', 'SA', 'KW'],
  compareKarats: ['24', '22', '21'],
  comparePreset: 'gcc-core',
  range: '30D',
  historyMonth: '',
  metric: 'selected',
  autoRefresh: true,
  favoritesOnly: false,
  liveWireOn: true,
  activeRegion: 'gcc',
  panel: null,
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
  const validCountryCodes = new Set(COUNTRIES.map((country) => country.code));

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
    base.history = stub.history
      .map((row) => ({
        date: new Date(row.date || row.timestamp || row.ts),
        spot: Number(row.price || row.spot || 0),
        source: row.source || 'session-cache',
      }))
      .filter((r) => Number.isFinite(r.date.getTime()) && r.spot > 0);
  }

  // Tracker-specific saved state
  const saved = readLocal(STORAGE_KEYS.core, {});
  base.lang = saved.lang || readLanguagePref() || base.lang;
  base.mode = (VALID_MODES.has(saved.mode) ? saved.mode : null) || base.mode;
  base.workspaceLevel = saved.workspaceLevel === 'advanced' ? 'advanced' : base.workspaceLevel;
  base.selectedCurrency = saved.selectedCurrency || base.selectedCurrency;
  base.selectedKarat = saved.selectedKarat || base.selectedKarat;
  base.selectedUnit = saved.selectedUnit || base.selectedUnit;
  base.compareCurrency = saved.compareCurrency || base.compareCurrency;
  base.compareCountries =
    Array.isArray(saved.compareCountries) && saved.compareCountries.length
      ? saved.compareCountries.filter((code) => !code || validCountryCodes.has(code)).slice(0, 3)
      : base.compareCountries;
  base.compareKarats =
    Array.isArray(saved.compareKarats) && saved.compareKarats.length
      ? saved.compareKarats.slice(0, 4)
      : base.compareKarats;
  base.comparePreset = saved.comparePreset || base.comparePreset;
  base.range = saved.range || base.range;
  base.historyMonth = saved.historyMonth || base.historyMonth;
  base.metric = saved.metric || base.metric;
  base.autoRefresh = saved.autoRefresh !== false;
  base.favoritesOnly = !!saved.favoritesOnly;
  base.liveWireOn = saved.liveWireOn !== false;
  base.activeRegion = saved.activeRegion || base.activeRegion;
  base.panel = null;

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
    workspaceLevel: state.workspaceLevel === 'advanced' ? 'advanced' : 'basic',
    selectedCurrency: state.selectedCurrency,
    selectedKarat: state.selectedKarat,
    selectedUnit: state.selectedUnit,
    compareCurrency: state.compareCurrency,
    compareCountries: state.compareCountries,
    compareKarats: state.compareKarats,
    comparePreset: state.comparePreset,
    range: state.range,
    historyMonth: state.historyMonth,
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

export function syncUrlFromState(state, _panel = null) {
  const url = new URL(window.location.href);
  const params = new URLSearchParams();
  params.set('mode', VALID_MODES.has(state.mode) ? state.mode : 'live');
  params.set('cur', state.selectedCurrency);
  params.set('k', state.selectedKarat);
  params.set('u', state.selectedUnit);
  params.set('r', state.range);
  params.set('cmp', state.compareCurrency);
  params.set('lang', state.lang);
  if (state.historyMonth) params.set('month', state.historyMonth);
  if (state.panel && VALID_PANELS.has(state.panel)) params.set('panel', state.panel);
  url.hash = params.toString();
  history.replaceState(null, '', url.toString());
}

export function applyUrlState(state) {
  const parsed = parseHash(window.location.hash.slice(1));
  state.panel = null;

  if (!parsed.hasHash) return parsed;
  if (parsed.mode) state.mode = parsed.mode;
  if (parsed.panel) state.panel = parsed.panel;

  const params = parsed.params;
  state.selectedCurrency = params.get('cur') || state.selectedCurrency;
  state.selectedKarat = params.get('k') || state.selectedKarat;
  state.selectedUnit = params.get('u') || state.selectedUnit;
  state.range = params.get('r') || state.range;
  state.compareCurrency = params.get('cmp') || state.compareCurrency;
  state.historyMonth = params.get('month') || state.historyMonth;
  const urlLang = params.get('lang');
  if (urlLang === 'en' || urlLang === 'ar') state.lang = urlLang;
  return parsed;
}

export function parseHash(hash) {
  const raw = (hash || '').trim();
  if (!raw) {
    return {
      hasHash: false,
      params: new URLSearchParams(),
      mode: null,
      panel: null,
      shouldCanonicalize: false,
    };
  }

  // Legacy one-token hashes (task-1 compatibility)
  if (raw === 'alerts' || raw === 'section-alerts') {
    return {
      hasHash: true,
      params: new URLSearchParams(),
      mode: 'live',
      panel: 'alerts',
      shouldCanonicalize: true,
    };
  }

  const params = new URLSearchParams(raw);
  const explicitMode = params.get('mode');
  let mode = null;
  let panel = null;
  let shouldCanonicalize = false;

  if (explicitMode === 'alerts') {
    mode = 'live';
    panel = 'alerts';
    shouldCanonicalize = true;
  } else if (explicitMode) {
    if (VALID_MODES.has(explicitMode)) mode = explicitMode;
    else {
      mode = 'live';
      shouldCanonicalize = true;
    }
  }

  const explicitPanel = params.get('panel');
  if (explicitPanel) {
    if (VALID_PANELS.has(explicitPanel)) panel = explicitPanel;
    else shouldCanonicalize = true;
  }

  // Deterministic behavior: panel-only hashes should not depend on persisted mode.
  // Canonical form is live mode + panel.
  if (panel && !mode) {
    mode = 'live';
    shouldCanonicalize = true;
  }

  return { hasHash: true, params, mode, panel, shouldCanonicalize };
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

/* ───────────────────────── Optimistic control updates ──────────────────────── */

/**
 * The user-facing tracker controls that support optimistic updates, mapped to
 * their backing `state` property and a validator. `mode` is constrained to
 * {@link VALID_MODES}; the rest accept any non-empty string (currency/karat/unit
 * vocabularies are owned by config and validated at render time).
 */
const CONTROL_FIELDS = {
  mode: { prop: 'mode', validate: (v) => VALID_MODES.has(v) },
  currency: { prop: 'selectedCurrency', validate: (v) => typeof v === 'string' && v.length > 0 },
  karat: { prop: 'selectedKarat', validate: (v) => typeof v === 'string' && v.length > 0 },
  unit: { prop: 'selectedUnit', validate: (v) => typeof v === 'string' && v.length > 0 },
  range: { prop: 'range', validate: (v) => typeof v === 'string' && v.length > 0 },
};

/** Field names that {@link updateControl} accepts. */
export const CONTROL_FIELD_NAMES = Object.freeze(Object.keys(CONTROL_FIELDS));

/**
 * @typedef {Object} ControlChangeResult
 * @property {string}  field      The control that was targeted.
 * @property {*}       [previous] Prior value (present unless the field is unknown).
 * @property {*}       [current]  New (or unchanged) value.
 * @property {boolean} changed    Whether the value actually changed.
 * @property {boolean} [rejected] Set when the field is unknown or the value invalid.
 * @property {string}  [reason]   Why the update was rejected.
 */

/**
 * Optimistically update a single tracker control, persist it, keep the URL hash
 * in sync, and emit `tracker:change` SYNCHRONOUSLY so the UI can repaint before
 * any async data settles. No event fires when the value is unchanged or invalid.
 *
 * Persistence and URL sync are best-effort and never block the synchronous
 * event — a quota error or missing History API must not stop the optimistic
 * repaint. URL-hash sync delegates to {@link syncUrlFromState}, preserving the
 * `#mode=…&cur=…&k=…&u=…&r=…&cmp=…&lang=…` contract verbatim.
 *
 * @param {object} state
 * @param {'mode'|'currency'|'karat'|'unit'|'range'} field
 * @param {string} value
 * @param {{ persist?: boolean, syncUrl?: boolean, optimistic?: boolean }} [opts]
 * @returns {ControlChangeResult}
 */
export function updateControl(
  state,
  field,
  value,
  { persist = true, syncUrl = true, optimistic = true } = {}
) {
  const cfg = CONTROL_FIELDS[field];
  if (!cfg) {
    return { field, changed: false, rejected: true, reason: 'unknown-field' };
  }
  if (cfg.validate && !cfg.validate(value)) {
    return {
      field,
      previous: state[cfg.prop],
      current: state[cfg.prop],
      changed: false,
      rejected: true,
      reason: 'invalid-value',
    };
  }

  const previous = state[cfg.prop];
  if (previous === value) {
    return { field, previous, current: value, changed: false };
  }

  state[cfg.prop] = value;

  if (persist) {
    try {
      persistState(state);
    } catch {
      // Storage may be unavailable (private mode / quota) — optimistic UI still proceeds.
    }
  }
  if (syncUrl && typeof window !== 'undefined' && window.location) {
    try {
      syncUrlFromState(state);
    } catch {
      // History API may be unavailable — URL sync is non-blocking.
    }
  }

  // Synchronous emission: the UI reacts to this before the next data refresh.
  emitTrackerChange({ field, previous, current: value, optimistic });

  return { field, previous, current: value, changed: true };
}

/** Optimistically change the tracker mode (live/compare/archive/exports/method). */
export function setMode(state, mode, opts) {
  return updateControl(state, 'mode', mode, opts);
}
/** Optimistically change the selected currency. */
export function setCurrency(state, currency, opts) {
  return updateControl(state, 'currency', currency, opts);
}
/** Optimistically change the selected karat. */
export function setKarat(state, karat, opts) {
  return updateControl(state, 'karat', karat, opts);
}
/** Optimistically change the selected unit (gram/oz/…). */
export function setUnit(state, unit, opts) {
  return updateControl(state, 'unit', unit, opts);
}
/** Optimistically change the selected history range. */
export function setRange(state, range, opts) {
  return updateControl(state, 'range', range, opts);
}

/* ─────────────────────────── Live data reconciliation ──────────────────────── */

/**
 * @typedef {Object} LiveUpdateResult
 * @property {number|null} previous          Prior spot the tracker was showing.
 * @property {number|null} current           New spot (or `previous` if invalid).
 * @property {'up'|'down'|'unchanged'} direction  Trust-aware: only non-`unchanged` for a live tick.
 * @property {string} freshness              Resolved freshness key.
 * @property {boolean} freshnessChanged      Whether freshness transitioned.
 * @property {string|null} previousFreshness Prior freshness key (null on first reconcile).
 * @property {boolean} changed               Whether the spot value changed.
 */

/**
 * Reconcile the tracker's live slice with freshly-arrived data, replacing the
 * optimistic view once real data settles. Updates `state.live`,
 * `state.hasLiveFailure`, and the tracked freshness key, and returns a
 * trust-aware summary the caller can feed to {@link import('../lib/animation.js').animateValue}.
 *
 * The trust rule is enforced: `direction` is `'unchanged'` unless the resolved
 * freshness is a genuine LIVE state, so a cached/fallback/estimated value can
 * never drive a directional flash.
 *
 * By default this does NOT dispatch `goldprice:update` — that event is emitted
 * by `lib/api.js` at fetch time, and double-emitting would fire listeners twice.
 * Pass `{ emit: true }` only if the tracker is the sole emission point (e.g. data
 * arrives through a channel other than `lib/api.js`).
 *
 * @param {object} state
 * @param {{ price?: number, updatedAt?: string, isFresh?: boolean|null, isFallback?: boolean|null, hasLiveFailure?: boolean }} [data]
 * @param {{ emit?: boolean }} [opts]
 * @returns {LiveUpdateResult}
 */
export function applyLiveUpdate(
  state,
  { price, updatedAt, isFresh = null, isFallback = null, hasLiveFailure = false } = {},
  { emit = false } = {}
) {
  const previous = state.live && Number.isFinite(state.live.price) ? state.live.price : null;
  const numericPrice = Number(price);
  const hasPrice = Number.isFinite(numericPrice);

  const { key } = getLiveFreshness({ updatedAt, isFresh, isFallback, hasLiveFailure });

  if (hasPrice) {
    state.live = {
      price: numericPrice,
      updatedAt: updatedAt || new Date().toISOString(),
      raw: (state.live && state.live.raw) || {},
    };
  }

  // A cached/fallback/stale read means the live path did not succeed cleanly.
  state.hasLiveFailure =
    Boolean(hasLiveFailure) || key === 'cached' || key === 'fallback' || key === 'stale';

  const direction =
    isLiveFreshness(key) && hasPrice ? getPriceDirection(previous, numericPrice) : 'unchanged';

  const previousFreshness = state._freshnessKey ?? null;
  const freshnessChanged = previousFreshness !== null && previousFreshness !== key;
  state._freshnessKey = key;

  if (emit) {
    emitGoldPriceUpdate({
      previous,
      current: hasPrice ? numericPrice : previous,
      freshness: key,
      timestamp: updatedAt,
    });
    if (freshnessChanged) {
      emitFreshnessChange({ previous: previousFreshness, current: key, kind: 'gold' });
    }
  }

  return {
    previous,
    current: hasPrice ? numericPrice : previous,
    direction,
    freshness: key,
    freshnessChanged,
    previousFreshness,
    changed: hasPrice && previous !== numericPrice,
  };
}
