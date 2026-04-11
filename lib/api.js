import { CONSTANTS } from '../config/index.js';

class NetworkError extends Error {
  constructor(msg) { super(msg); this.name = 'NetworkError'; }
}
class TimeoutError extends Error {
  constructor(msg) { super(msg); this.name = 'TimeoutError'; }
}
class DataError extends Error {
  constructor(msg) { super(msg); this.name = 'DataError'; }
}

// Allow tests/debug to override fetch behavior
export let _simulateGoldFail = false;
export let _simulateFxFail = false;
export function setSimulateGoldFail(v) { _simulateGoldFail = v; }
export function setSimulateFxFail(v) { _simulateFxFail = v; }

async function fetchWithTimeout(url, timeoutMs) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) throw new NetworkError(`HTTP ${res.status}: ${url}`);
    return res;
  } catch (e) {
    clearTimeout(id);
    if (e.name === 'AbortError') throw new TimeoutError(`Timeout fetching ${url}`);
    if (e instanceof NetworkError || e instanceof TimeoutError) throw e;
    throw new NetworkError(e.message);
  }
}

async function retryWithBackoff(fn, maxRetries = 2) {
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (attempt < maxRetries) {
        const delay = 1000 << attempt; // Bit-shift optimization: 1000 * 2^attempt
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastErr;
}

const GOLD_FALLBACK_URL = 'https://data-asg.goldprice.org/dbXRates/USD';

export async function fetchGold() {
  if (_simulateGoldFail) throw new NetworkError('Simulated gold API failure');

  // Try primary provider (gold-api.com) with retry/backoff
  try {
    return await retryWithBackoff(async () => {
      const res = await fetchWithTimeout(CONSTANTS.API_GOLD_URL, CONSTANTS.GOLD_FETCH_TIMEOUT);
      const data = await res.json();
      if (typeof data.price !== 'number' || data.price <= 0) {
        throw new DataError('Invalid gold price response');
      }
      return {
        price: data.price,
        updatedAt: data.updatedAt || new Date().toISOString(),
        source: 'gold-api',
      };
    });
  } catch {
    // Primary failed — try secondary provider (goldprice.org)
  }

  try {
    return await retryWithBackoff(async () => {
      const res = await fetchWithTimeout(GOLD_FALLBACK_URL, CONSTANTS.GOLD_FETCH_TIMEOUT);
      const data = await res.json();
      const price = data?.items?.[0]?.xauPrice;
      if (typeof price !== 'number' || price <= 0) {
        throw new DataError('Invalid goldprice-org response');
      }
      return {
        price,
        updatedAt: new Date().toISOString(),
        source: 'goldprice-org',
      };
    });
  } catch {
    // Secondary also failed — return cached fallback
  }

  const { getFallbackGoldPrice } = await import('./cache.js');
  const cached = getFallbackGoldPrice();
  if (cached) {
    return {
      price: cached.price,
      updatedAt: cached.updatedAt,
      source: 'cache-fallback',
    };
  }
  throw new NetworkError('Gold price unavailable — all providers failed');
}

export async function fetchFX() {
  if (_simulateFxFail) throw new NetworkError('Simulated FX API failure');

  return retryWithBackoff(async () => {
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
      time_next_update_utc: data.time_next_update_utc || new Date(Date.now() + 86400000).toUTCString(),
    };
  });
}
