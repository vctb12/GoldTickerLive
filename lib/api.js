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
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }
  throw lastErr;
}

export async function fetchGold() {
  if (_simulateGoldFail) throw new NetworkError('Simulated gold API failure');

  return retryWithBackoff(async () => {
    const res = await fetchWithTimeout(CONSTANTS.API_GOLD_URL, CONSTANTS.GOLD_FETCH_TIMEOUT);
    const data = await res.json();
    if (typeof data.price !== 'number' || data.price <= 0) {
      throw new DataError('Invalid gold price response');
    }
    return {
      price: data.price,
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  });
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
