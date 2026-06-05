import { BaseQuoteProvider } from './base-provider.js';
import { GOLD_MARKET } from '../live-status.js';
import { fetchWithProviderTimeout } from './fetch-utils.js';
import { parseLastGoldPriceSnapshot } from './last-gold-price-parse.js';

const LAST_PRICE_PATH = '/data/last_gold_price.json';

function isRecentEnough(timestamp, maxAgeMs = GOLD_MARKET.STALE_AFTER_MS) {
  const parsed = new Date(timestamp || 0).getTime();
  if (!Number.isFinite(parsed) || parsed <= 0) return false;
  return Math.max(0, Date.now() - parsed) <= maxAgeMs;
}

export class LastGoldPriceQuoteProvider extends BaseQuoteProvider {
  constructor({ providerId = 'last-gold-price', timeoutMs = 4000 } = {}) {
    super({ providerId, timeoutMs });
  }

  async fetchQuote({ signal, timeoutMs } = {}) {
    const startedAt = Date.now();
    const effectiveTimeout =
      Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : this.timeoutMs;

    const response = await fetchWithProviderTimeout(`${LAST_PRICE_PATH}?t=${Date.now()}`, {
      signal,
      timeoutMs: effectiveTimeout,
    });

    if (!response.ok) {
      throw new Error(`last_gold_price.json HTTP ${response.status}`);
    }

    const payload = await response.json();
    const parsed = parseLastGoldPriceSnapshot(payload);
    if (!parsed) {
      throw new Error('last_gold_price.json missing valid price');
    }

    if (!isRecentEnough(parsed.providerTimestamp)) {
      throw new Error('last_gold_price.json snapshot too old');
    }

    return this.normalizeQuote({
      ...parsed,
      fetchedAt: new Date().toISOString(),
      providerId: this.providerId,
      source: this.providerId,
      providerPathSuccessful: true,
      latencyMs: Date.now() - startedAt,
      isFresh: null,
      isFallback: false,
    });
  }
}
