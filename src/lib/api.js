import { CONSTANTS } from '../config/index.js';
import { getFallbackGoldPrice, getFallbackFXRates } from './cache.js';
import { isSaneGoldSpotUsd } from './quote-providers/fetch-utils.js';
import { getLiveFreshness, getFXFreshness } from './live-status.js';
import { emitGoldPriceUpdate, emitFxUpdate, emitFreshnessChange } from './animation.js';

/**
 * Liveness telemetry trackers. These let the data layer publish the substrate
 * events (`goldprice:update`, `fx:update`, `freshness:change`) with a correct
 * `previous` value and detect freshness transitions across successive fetches.
 * They are intentionally private; reset them via `_resetLivenessTracking()`.
 */
let _lastGoldPrice = null;
let _lastGoldFreshness = null;
let _lastFxRates = null;
let _lastFxFreshness = null;

/**
 * Reset the liveness trackers (used by tests and the debug panel so a fresh
 * session starts with no remembered "previous" value or freshness state).
 */
export function _resetLivenessTracking() {
  _lastGoldPrice = null;
  _lastGoldFreshness = null;
  _lastFxRates = null;
  _lastFxFreshness = null;
}

/**
 * Publish liveness events for a resolved gold quote and update the trackers.
 * Freshness is derived via the sanctioned `getLiveFreshness` so the trust rule
 * (no flash on non-live data) is enforced centrally. Telemetry must never break
 * the data path, so all of this is best-effort.
 *
 * @template {{ price: number, updatedAt: string, isFresh?: boolean|null, isFallback?: boolean|null }} T
 * @param {T} result
 * @param {{ hasLiveFailure?: boolean }} [opts]
 * @returns {T} the same `result`, unchanged.
 */
function emitGoldResolved(result, { hasLiveFailure = false } = {}) {
  try {
    const { key } = getLiveFreshness({
      updatedAt: result.updatedAt,
      isFresh: result.isFresh ?? null,
      isFallback: result.isFallback ?? null,
      hasLiveFailure,
    });
    emitGoldPriceUpdate({
      previous: _lastGoldPrice,
      current: result.price,
      freshness: key,
      timestamp: result.updatedAt,
    });
    if (_lastGoldFreshness !== null && _lastGoldFreshness !== key) {
      emitFreshnessChange({ previous: _lastGoldFreshness, current: key, kind: 'gold' });
    }
    _lastGoldFreshness = key;
    if (Number.isFinite(result.price)) _lastGoldPrice = result.price;
  } catch {
    // Liveness telemetry is non-essential — never let it break price delivery.
  }
  return result;
}

/**
 * Publish liveness events for a resolved FX payload and update the trackers.
 *
 * @template {{ rates: object, time_last_update_utc: string|null }} T
 * @param {T} result
 * @param {{ hasCacheFailure?: boolean }} [opts]
 * @returns {T} the same `result`, unchanged.
 */
function emitFxResolved(result, { hasCacheFailure = false } = {}) {
  try {
    const { key } = getFXFreshness({
      fxUpdatedAt: result.time_last_update_utc,
      hasCacheFailure,
    });
    emitFxUpdate({
      previous: _lastFxRates,
      current: result.rates,
      freshness: key,
      timestamp: result.time_last_update_utc,
    });
    if (_lastFxFreshness !== null && _lastFxFreshness !== key) {
      emitFreshnessChange({ previous: _lastFxFreshness, current: key, kind: 'fx' });
    }
    _lastFxFreshness = key;
    if (result.rates) _lastFxRates = result.rates;
  } catch {
    // Liveness telemetry is non-essential — never let it break FX delivery.
  }
  return result;
}

class NetworkError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'NetworkError';
  }
}
class TimeoutError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'TimeoutError';
  }
}
class DataError extends Error {
  constructor(msg) {
    super(msg);
    this.name = 'DataError';
  }
}

/**
 * When true, `fetchGold()` throws a NetworkError immediately.
 * Set via `setSimulateGoldFail()` for tests and the debug panel.
 * @type {boolean}
 */
export let _simulateGoldFail = false;

/**
 * When true, `fetchFX()` throws a NetworkError immediately.
 * Set via `setSimulateFxFail()` for tests and the debug panel.
 * @type {boolean}
 */
export let _simulateFxFail = false;

/**
 * Toggle gold-API failure simulation.
 * @param {boolean} v  Pass `true` to make `fetchGold()` throw; `false` to restore normal behaviour.
 */
export function setSimulateGoldFail(v) {
  _simulateGoldFail = v;
}

/**
 * Toggle FX-API failure simulation.
 * @param {boolean} v  Pass `true` to make `fetchFX()` throw; `false` to restore normal behaviour.
 */
export function setSimulateFxFail(v) {
  _simulateFxFail = v;
}

/**
 * Fetch `url` and reject if the response is not received within `timeoutMs`.
 * Re-throws `AbortError` as `TimeoutError` so callers can distinguish timeouts
 * from general network failures.
 * @param {string} url
 * @param {number} timeoutMs
 * @returns {Promise<Response>}
 */
async function fetchWithTimeout(url, timeoutMs, { signal } = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  const abortFromExternalSignal = () => controller.abort();
  if (signal?.aborted) {
    abortFromExternalSignal();
  } else if (signal) {
    signal.addEventListener('abort', abortFromExternalSignal, { once: true });
  }
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    if (signal) signal.removeEventListener('abort', abortFromExternalSignal);
    if (!res.ok) throw new NetworkError(`HTTP ${res.status}: ${url}`);
    return res;
  } catch (e) {
    clearTimeout(id);
    if (signal) signal.removeEventListener('abort', abortFromExternalSignal);
    if (e.name === 'AbortError') throw new TimeoutError(`Timeout fetching ${url}`);
    if (e instanceof NetworkError || e instanceof TimeoutError) throw e;
    throw new NetworkError(e.message);
  }
}

/**
 * Call `fn` up to `maxRetries + 1` times with exponential back-off between
 * attempts (1 s, 2 s, …). Returns the first successful result or re-throws
 * the last error.
 * @template T
 * @param {() => Promise<T>} fn
 * @param {number} [maxRetries=2]
 * @returns {Promise<T>}
 */
async function retryWithBackoff(fn, maxRetries = 2) {
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (attempt < maxRetries) {
        const delay = 1000 << attempt; // Bit-shift optimization: 1000 * 2^attempt
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastErr;
}

const GOLD_DATA_URL = '/data/gold_price.json';
const GOLD_BACKEND_URL = '/api/v1/prices/latest';

function unwrapApiEnvelope(data) {
  return data?.ok === true && data?.data && typeof data.data === 'object' ? data.data : data;
}

function normalizeGoldResponse(data) {
  if (!data || typeof data !== 'object') return null;

  const payload = unwrapApiEnvelope(data);
  const normalizedPrice = Number(payload?.xauUsdPerOz ?? payload?.xau_usd_per_oz);
  const legacyPrice = Number(payload?.gold?.ounce_usd);
  const price =
    Number.isFinite(normalizedPrice) && normalizedPrice > 0
      ? normalizedPrice
      : Number.isFinite(legacyPrice) && legacyPrice > 0
        ? legacyPrice
        : null;

  if (!isSaneGoldSpotUsd(price)) return null;

  const updatedAt =
    payload?.timestampUtc ||
    payload?.timestamp_utc ||
    payload?.fetchedAtUtc ||
    payload?.fetched_at_utc ||
    new Date().toISOString();

  const source =
    payload?.provider ||
    payload?.source_provider ||
    payload?.source ||
    data?.meta?.source ||
    'gold_api_com';

  // Pipe upstream truth metadata through so the client freshness engine can
  // honor anti-mislabel guards (isFallback, isFresh) instead of relying on
  // age alone. The provider-adapter writes these into data/gold_price.json
  // and the backend forwards them via /api/v1/prices/latest.
  const isFresh =
    payload?.isFresh === true || payload?.is_fresh === true
      ? true
      : payload?.isFresh === false || payload?.is_fresh === false
        ? false
        : null;
  const isFallback =
    payload?.isFallback === true || payload?.is_fallback === true
      ? true
      : payload?.isFallback === false || payload?.is_fallback === false
        ? false
        : null;
  const freshnessSeconds = Number(payload?.freshnessSeconds ?? payload?.freshness_seconds);
  const maxFreshnessSeconds = Number(
    payload?.maxFreshnessSeconds ?? payload?.max_freshness_seconds
  );
  const sourceTimestamp =
    payload?.sourceTimestamp || payload?.source_updated_at_gmt || payload?.timestamp_source || null;

  return {
    price,
    updatedAt,
    source,
    isFresh,
    isFallback,
    freshnessSeconds: Number.isFinite(freshnessSeconds) ? freshnessSeconds : null,
    maxFreshnessSeconds: Number.isFinite(maxFreshnessSeconds) ? maxFreshnessSeconds : null,
    sourceTimestamp,
    raw: data,
  };
}

/**
 * Fetch the current gold spot price (XAU/USD) from the committed static data
 * file `/data/gold_price.json`, which is refreshed hourly during market hours
 * by the `gold-price-fetch.yml` GitHub Actions workflow. Falls back to the
 * most-recent `localStorage` cache entry if the network request fails.
 *
 * @returns {Promise<{ price: number, updatedAt: string, source: string, raw?: object }>}
 * @throws {NetworkError} When both the data file fetch and the local cache fail.
 */
export async function fetchGold({ signal, timeoutMs } = {}) {
  if (_simulateGoldFail) throw new NetworkError('Simulated gold API failure');
  const effectiveTimeoutMs =
    Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : CONSTANTS.GOLD_FETCH_TIMEOUT;

  // Prefer the versioned backend API when it is actually deployed (same-origin
  // `/api/v1/*`), then fall back to static JSON. On static GitHub Pages there is
  // no backend, so this probe is gated behind CONSTANTS.API_BACKEND_ENABLED to
  // avoid a guaranteed 404 on every load; the committed JSON below is the source
  // of truth there.
  if (CONSTANTS.API_BACKEND_ENABLED) {
    try {
      const backendRes = await fetchWithTimeout(
        GOLD_BACKEND_URL,
        Math.min(effectiveTimeoutMs, 4000),
        { signal }
      );
      const backendData = await backendRes.json();
      const normalized = normalizeGoldResponse(backendData);
      if (normalized) return emitGoldResolved(normalized);
    } catch {
      // Backend unavailable or invalid; continue to static fallback.
    }
  }

  try {
    const normalized = await retryWithBackoff(async () => {
      const res = await fetchWithTimeout(`${GOLD_DATA_URL}?t=${Date.now()}`, effectiveTimeoutMs, {
        signal,
      });
      const data = await res.json();
      const result = normalizeGoldResponse(data);
      if (!result) throw new DataError('Invalid gold price data file');
      return result;
    });
    return emitGoldResolved(normalized);
  } catch {
    // Fetching the static data file failed — fall through to cached fallback.
  }

  const cached = getFallbackGoldPrice();
  if (cached) {
    // Local live fetch failed — this is a cached value, never a live tick.
    return emitGoldResolved(
      {
        price: cached.price,
        updatedAt: cached.updatedAt,
        source: 'cache-fallback',
      },
      { hasLiveFailure: true }
    );
  }
  throw new NetworkError('Gold price unavailable — data file could not be read');
}

/**
 * Fetch current FX exchange rates against USD from `open.er-api.com`.
 * The AED rate is removed from the response and replaced by the fixed UAE
 * Central Bank peg (`CONSTANTS.AED_PEG`) at the call sites, so the API
 * cannot accidentally override it.
 *
 * @returns {Promise<{ rates: Record<string, number>, time_last_update_utc: string, time_next_update_utc: string }>}
 * @throws {NetworkError|DataError} When the API is unreachable or the response is malformed.
 */
export async function fetchFX() {
  if (_simulateFxFail) throw new NetworkError('Simulated FX API failure');

  try {
    const result = await retryWithBackoff(async () => {
      const res = await fetchWithTimeout(CONSTANTS.API_FX_URL, CONSTANTS.FX_FETCH_TIMEOUT);
      const data = await res.json();
      if (!data.rates || typeof data.rates !== 'object') {
        throw new DataError('Invalid FX rates response');
      }
      // Never allow AED from API — enforce hardcoded peg
      const rates = { ...data.rates };
      delete rates.AED;
      return {
        rates,
        time_last_update_utc: data.time_last_update_utc || new Date().toUTCString(),
        time_next_update_utc:
          data.time_next_update_utc || new Date(Date.now() + 86400000).toUTCString(),
        source: 'live',
      };
    });
    return emitFxResolved(result);
  } catch {
    // Live FX fetch failed — fall through to localStorage cache.
  }

  const cached = getFallbackFXRates();
  if (cached && cached.rates) {
    return emitFxResolved(
      {
        rates: cached.rates,
        time_last_update_utc: cached.time_last_update_utc || null,
        time_next_update_utc: cached.time_next_update_utc || null,
        source: 'cache-fallback',
      },
      { hasCacheFailure: true }
    );
  }
  throw new NetworkError('FX rates unavailable — live fetch and cache both failed');
}

/**
 * Fetch gold spot and FX rates in parallel (no waterfall).
 * Individual fetchers still apply cache fallbacks; this helper surfaces partial success.
 *
 * @param {{ signal?: AbortSignal, timeoutMs?: number }} [options]
 * @returns {Promise<{
 *   gold: Awaited<ReturnType<typeof fetchGold>>|null,
 *   fx: Awaited<ReturnType<typeof fetchFX>>|null,
 *   errors: { gold: Error|null, fx: Error|null }
 * }>}
 */
export async function fetchGoldAndFX(options = {}) {
  const [goldRes, fxRes] = await Promise.allSettled([fetchGold(options), fetchFX(options)]);

  return {
    gold: goldRes.status === 'fulfilled' ? goldRes.value : null,
    fx: fxRes.status === 'fulfilled' ? fxRes.value : null,
    errors: {
      gold: goldRes.status === 'rejected' ? goldRes.reason : null,
      fx: fxRes.status === 'rejected' ? fxRes.reason : null,
    },
  };
}
