/**
 * services/fxService.js
 * Multi-provider FX rates fetcher with AED peg enforcement.
 * AED is ALWAYS 3.6725 — never from API.
 * FX rates cached for 24 hours.
 *
 * Dependencies: services/apiAdapter.js, config/constants.js
 */
import { CONSTANTS } from '../config/index.js';
import { apiFetch, DataError } from './apiAdapter.js';

const AED_PEG = CONSTANTS.AED_PEG; // 3.6725
const FX_CACHE_KEY = CONSTANTS.CACHE_KEYS.fxRates;
const FX_FALLBACK_KEY = CONSTANTS.CACHE_KEYS.fxFallback;
const FX_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const PROVIDERS = [
  {
    name: 'exchangerate-api',
    url: 'https://open.er-api.com/v6/latest/USD',
    parse(data) {
      if (!data.rates || typeof data.rates !== 'object') throw new DataError('Invalid FX response');
      const rates = { ...data.rates };
      delete rates.AED; // enforce peg
      return {
        rates,
        time_last_update_utc: data.time_last_update_utc || new Date().toUTCString(),
        time_next_update_utc:
          data.time_next_update_utc || new Date(Date.now() + FX_TTL_MS).toUTCString(),
      };
    },
  },
];

function readCache(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

function isFresh(cached) {
  if (!cached || !cached.fetchedAt) return false;
  return Date.now() - cached.fetchedAt < FX_TTL_MS;
}

/**
 * Fetch FX rates. Returns cached if fresh (< 24h). AED always 3.6725.
 * @returns {Promise<{ rates: object, time_last_update_utc: string, source: string, fromCache?: boolean }>}
 */
export async function fetchFXRates() {
  const cached = readCache(FX_CACHE_KEY);
  if (isFresh(cached)) {
    const rates = { ...cached.rates, AED: AED_PEG };
    return {
      rates,
      time_last_update_utc: cached.time_last_update_utc,
      source: 'cache',
      fromCache: true,
    };
  }

  for (const provider of PROVIDERS) {
    try {
      const { data } = await apiFetch(provider.url, { timeoutMs: 8000, maxRetries: 2 });
      const parsed = provider.parse(data);
      const rates = { ...parsed.rates, AED: AED_PEG }; // enforce peg
      return { ...parsed, rates, source: provider.name, fromCache: false };
    } catch {
      // try next provider
    }
  }

  // All failed — return stale cache
  const fallback = readCache(FX_FALLBACK_KEY) || cached;
  if (fallback) {
    const rates = { ...fallback.rates, AED: AED_PEG };
    return {
      rates,
      time_last_update_utc: fallback.time_last_update_utc,
      source: 'cache-fallback',
      fromCache: true,
      cacheAge: Date.now() - (fallback.fetchedAt || 0),
    };
  }
  throw new Error('FX rates unavailable — no cache');
}
