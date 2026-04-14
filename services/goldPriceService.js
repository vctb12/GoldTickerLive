/**
 * services/goldPriceService.js
 * Multi-provider gold spot price fetcher with priority fallback.
 * Provider 1: api.gold-api.com (primary)
 * Provider 2: data-asg.goldprice.org (fallback)
 * If both fail: returns cached value with stale flag.
 *
 * Dependencies: services/apiAdapter.js, config/constants.js
 */
import { CONSTANTS } from '../config/index.js';
import { apiFetch, DataError } from './apiAdapter.js';

const PROVIDERS = [
  {
    name: 'gold-api',
    url: 'https://api.gold-api.com/price/XAU',
    parse(data) {
      if (typeof data.price !== 'number' || data.price <= 0)
        throw new DataError('Invalid gold-api price');
      return { price: data.price, updatedAt: data.updatedAt || new Date().toISOString() };
    },
  },
  {
    name: 'goldprice-org',
    url: 'https://data-asg.goldprice.org/dbXRates/USD',
    parse(data) {
      const price = data?.items?.[0]?.xauPrice;
      if (typeof price !== 'number' || price <= 0)
        throw new DataError('Invalid goldprice-org response');
      return { price, updatedAt: new Date().toISOString() };
    },
  },
];

/** localStorage key for gold cache (mirrors CONSTANTS.CACHE_KEYS.goldPrice) */
const GOLD_CACHE_KEY = CONSTANTS.CACHE_KEYS.goldPrice;
const GOLD_FALLBACK_KEY = CONSTANTS.CACHE_KEYS.goldFallback;

function readCache(key) {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
}

/**
 * Fetch live gold spot price. Tries providers in order, falls back to cache.
 * @returns {Promise<{ price: number, updatedAt: string, source: string, fromCache?: boolean, cacheAge?: number }>}
 */
export async function fetchGoldPrice() {
  for (const provider of PROVIDERS) {
    try {
      const { data, timestamp } = await apiFetch(provider.url, { timeoutMs: 8000, maxRetries: 2 });
      const parsed = provider.parse(data);
      return { ...parsed, source: provider.name, fromCache: false };
    } catch {
      // try next provider
    }
  }
  // All providers failed — return cache
  const cached = readCache(GOLD_CACHE_KEY) || readCache(GOLD_FALLBACK_KEY);
  if (cached) {
    return {
      price: cached.price,
      updatedAt: cached.updatedAt,
      source: 'cache-fallback',
      fromCache: true,
      cacheAge: Date.now() - (cached.fetchedAt || 0),
    };
  }
  throw new Error('Gold price unavailable — no cache');
}
