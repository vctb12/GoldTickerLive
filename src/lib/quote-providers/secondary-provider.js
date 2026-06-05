import { BaseQuoteProvider } from './base-provider.js';
import * as cache from '../cache.js';
import { GOLD_MARKET } from '../live-status.js';
import { fetchWithProviderTimeout } from './fetch-utils.js';

const LAST_PRICE_PATH = '/data/last_gold_price.json';

function quoteAgeMs(timestamp) {
  const parsed = new Date(timestamp || 0).getTime();
  if (!Number.isFinite(parsed) || parsed <= 0) return Number.POSITIVE_INFINITY;
  return Math.max(0, Date.now() - parsed);
}

function isRecentEnough(timestamp, maxAgeMs = GOLD_MARKET.STALE_AFTER_MS) {
  return quoteAgeMs(timestamp) <= maxAgeMs;
}

async function tryFetchLastSnapshot({ signal, timeoutMs } = {}) {
  try {
    const response = await fetchWithProviderTimeout(`${LAST_PRICE_PATH}?t=${Date.now()}`, {
      signal,
      timeoutMs,
    });
    if (!response.ok) return null;
    const payload = await response.json();
    const quote = payload?.gold?.ounce_usd;
    if (!Number.isFinite(Number(quote)) || Number(quote) <= 0) return null;
    return {
      price: Number(quote),
      providerTimestamp: payload?.updatedAt || payload?.timestamp_utc || null,
      providerRaw: payload,
    };
  } catch {
    return null;
  }
}

export class SecondaryQuoteProvider extends BaseQuoteProvider {
  constructor({ providerId = 'secondary-provider-cache', timeoutMs = 5000 } = {}) {
    super({ providerId, timeoutMs });
  }

  async fetchQuote({ signal, timeoutMs } = {}) {
    const startedAt = Date.now();
    const effectiveTimeout =
      Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : this.timeoutMs;
    const fallbackFile = await tryFetchLastSnapshot({
      signal,
      timeoutMs: effectiveTimeout,
    });

    if (fallbackFile && isRecentEnough(fallbackFile.providerTimestamp)) {
      return this.normalizeQuote({
        ...fallbackFile,
        fetchedAt: new Date().toISOString(),
        providerId: this.providerId,
        source: this.providerId,
        providerPathSuccessful: false,
        forcedState: 'fallback',
        latencyMs: Date.now() - startedAt,
        isFresh: false,
        isFallback: true,
      });
    }

    const cached = cache.getFallbackGoldPrice();
    if (cached?.price && isRecentEnough(cached.updatedAt || cached.fetchedAt)) {
      return this.normalizeQuote({
        price: cached.price,
        providerTimestamp: cached.updatedAt || cached.fetchedAt || new Date().toISOString(),
        fetchedAt: cached.fetchedAt || new Date().toISOString(),
        providerId: this.providerId,
        source: this.providerId,
        providerRaw: cached,
        providerPathSuccessful: false,
        forcedState: 'fallback',
        latencyMs: Date.now() - startedAt,
        isFresh: false,
        isFallback: true,
      });
    }

    throw new Error('secondary provider unavailable');
  }
}
