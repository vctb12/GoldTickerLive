import { BaseQuoteProvider } from './base-provider.js';
import * as cache from '../cache.js';
import { GOLD_MARKET } from '../live-status.js';

function isRecentEnough(timestamp, maxAgeMs = GOLD_MARKET.STALE_AFTER_MS) {
  const parsed = new Date(timestamp || 0).getTime();
  if (!Number.isFinite(parsed) || parsed <= 0) return false;
  return Math.max(0, Date.now() - parsed) <= maxAgeMs;
}

export class SecondaryQuoteProvider extends BaseQuoteProvider {
  constructor({ providerId = 'secondary-provider-cache', timeoutMs = 5000 } = {}) {
    super({ providerId, timeoutMs });
  }

  async fetchQuote({ signal, timeoutMs } = {}) {
    const startedAt = Date.now();
    void signal;
    void timeoutMs;

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
