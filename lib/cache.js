import { CONSTANTS } from '../config/index.js';

const { CACHE_KEYS } = CONSTANTS;

function getDubaiDateString() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dubai' }); // YYYY-MM-DD
}

function safeGet(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function showStorageQuotaWarning() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('cache-quota-warning')) return;
  const banner = document.createElement('div');
  banner.id = 'cache-quota-warning';
  banner.setAttribute('role', 'alert');
  banner.style.cssText = [
    'position:fixed',
    'bottom:1rem',
    'left:50%',
    'transform:translateX(-50%)',
    'max-width:420px',
    'width:calc(100% - 2rem)',
    'background:#b91c1c',
    'color:#fff',
    'padding:0.75rem 2.5rem 0.75rem 1rem',
    'border-radius:8px',
    'font-size:0.875rem',
    'line-height:1.4',
    'z-index:10000',
    'box-shadow:0 4px 12px rgba(0,0,0,0.35)',
  ].join(';');
  banner.innerHTML =
    '<strong>Storage full</strong> — your browser\'s storage is nearly full. ' +
    'Price alerts or settings may not have been saved. ' +
    'Try clearing your browser cache or disabling other extensions.<button ' +
    'aria-label="Dismiss" ' +
    'style="position:absolute;top:0.5rem;right:0.625rem;background:none;border:none;' +
    'color:#fff;cursor:pointer;font-size:1.125rem;line-height:1;padding:0" ' +
    'onclick="this.parentElement.remove()">✕</button>';
  document.body?.appendChild(banner);
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('Cache write failed (quota?):', e.message);
    showStorageQuotaWarning();
  }
}

export function loadState(STATE) {
  // Gold price
  const gold = safeGet(CACHE_KEYS.goldPrice) || safeGet(CACHE_KEYS.goldFallback);
  if (gold) {
    STATE.goldPriceUsdPerOz = gold.price;
    STATE.freshness.goldUpdatedAt = gold.updatedAt;
    const ageMs = Date.now() - (gold.fetchedAt || 0);
    STATE.status.goldStale = ageMs > CONSTANTS.GOLD_REFRESH_MS * 2;
  }

  // FX rates
  const fx = safeGet(CACHE_KEYS.fxRates) || safeGet(CACHE_KEYS.fxFallback);
  if (fx) {
    STATE.rates = fx.rates || {};
    STATE.fxMeta.lastUpdateUtc = fx.time_last_update_utc;
    STATE.fxMeta.nextUpdateUtc = fx.time_next_update_utc
      ? new Date(fx.time_next_update_utc).getTime()
      : 0;
    STATE.freshness.fxUpdatedAt = fx.time_last_update_utc;
    STATE.status.fxStale = STATE.fxMeta.nextUpdateUtc > 0 && Date.now() > STATE.fxMeta.nextUpdateUtc;
  }

  // Day open
  const dayOpen = safeGet(CACHE_KEYS.dayOpen);
  if (dayOpen && dayOpen.dubaiDate === getDubaiDateString()) {
    STATE.dayOpenGoldPriceUsdPerOz = dayOpen.price;
  }

  // User preferences
  const prefs = safeGet(CACHE_KEYS.userPrefs);
  if (prefs) {
    if (prefs.lang) STATE.lang = prefs.lang;
    // Support separate spotlight/countries karat prefs; fall back to legacy merged key
    if (prefs.selectedKaratSpotlight) STATE.selectedKaratSpotlight = prefs.selectedKaratSpotlight;
    else if (prefs.selectedKarat)     STATE.selectedKaratSpotlight = prefs.selectedKarat;
    if (prefs.selectedKaratCountries) STATE.selectedKaratCountries = prefs.selectedKaratCountries;
    else if (prefs.selectedKarat)     STATE.selectedKaratCountries = prefs.selectedKarat;
    if (prefs.unit) STATE.selectedUnitTable = prefs.unit;
    if (prefs.activeTab) STATE.activeTab = prefs.activeTab;
    if (prefs.sortOrder) STATE.sortOrder = prefs.sortOrder;
    if (Array.isArray(prefs.favorites)) STATE.favorites = prefs.favorites;
  }

  // History
  const history = safeGet(CACHE_KEYS.history);
  if (Array.isArray(history)) STATE.history = history;

  // Compute cache health score (0–1)
  const goldAge = STATE.freshness.goldUpdatedAt
    ? Math.max(0, 1 - (Date.now() - new Date(STATE.freshness.goldUpdatedAt).getTime()) / (3600000 * 24))
    : 0;
  STATE.cacheHealthScore = Math.round(goldAge * 100);
}

export function saveGoldPrice(price, updatedAt) {
  const payload = { price, updatedAt, fetchedAt: Date.now() };
  // Promote old primary → fallback before overwriting
  const old = safeGet(CACHE_KEYS.goldPrice);
  if (old) safeSet(CACHE_KEYS.goldFallback, old);
  safeSet(CACHE_KEYS.goldPrice, payload);
}

export function saveFXRates(rates, fxMeta) {
  const payload = {
    rates,
    time_last_update_utc: fxMeta.lastUpdateUtc,
    time_next_update_utc: fxMeta.nextUpdateUtc,
    fetchedAt: Date.now(),
  };
  const old = safeGet(CACHE_KEYS.fxRates);
  if (old) safeSet(CACHE_KEYS.fxFallback, old);
  safeSet(CACHE_KEYS.fxRates, payload);
}

export function getFallbackGoldPrice() {
  return safeGet(CACHE_KEYS.goldFallback) || safeGet(CACHE_KEYS.goldPrice);
}

export function getFallbackFXRates() {
  return safeGet(CACHE_KEYS.fxFallback) || safeGet(CACHE_KEYS.fxRates);
}

export function savePreference(key, value) {
  const prefs = safeGet(CACHE_KEYS.userPrefs) || {};
  prefs[key] = value;
  safeSet(CACHE_KEYS.userPrefs, prefs);
}

export function checkDayOpenReset(STATE) {
  const today = getDubaiDateString();
  const stored = safeGet(CACHE_KEYS.dayOpen);

  if (!stored || stored.dubaiDate !== today) {
    if (STATE.goldPriceUsdPerOz) {
      const payload = { price: STATE.goldPriceUsdPerOz, dubaiDate: today };
      safeSet(CACHE_KEYS.dayOpen, payload);
      STATE.dayOpenGoldPriceUsdPerOz = STATE.goldPriceUsdPerOz;
    }
    return true;
  }
  return false;
}

export function saveHistorySnapshot(STATE) {
  const today = getDubaiDateString();
  let history = safeGet(CACHE_KEYS.history) || [];
  // Remove any existing entry for today
  history = history.filter(h => h.date !== today);
  // Add today's snapshot
  history.push({
    date: today,
    price: STATE.goldPriceUsdPerOz,
    rates: STATE.rates,
    timestamp: Date.now(),
  });
  // Keep only last HISTORY_DAYS days
  if (history.length > CONSTANTS.HISTORY_DAYS) {
    history = history.slice(history.length - CONSTANTS.HISTORY_DAYS);
  }
  safeSet(CACHE_KEYS.history, history);
  STATE.history = history;
}

export function clearAllCache() {
  Object.values(CACHE_KEYS).forEach(key => {
    try { localStorage.removeItem(key); } catch {}
  });
}
