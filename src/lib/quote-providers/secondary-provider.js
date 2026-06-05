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

/**
 * Parse `/data/last_gold_price.json` — supports both the tweet-guard schema
 * (`price` + `posted_at_utc`) and legacy nested `gold.ounce_usd` payloads.
 * @param {unknown} payload
 * @returns {{ price: number, providerTimestamp: string|null, providerRaw: object }|null}
 */
export function parseLastGoldPriceSnapshot(payload) {
  if (!payload || typeof payload !== 'object') return null;

  const nested = payload?.gold?.ounce_usd;
  const flat = payload?.price;
  const rawPrice = Number.isFinite(Number(nested)) && Number(nested) > 0 ? nested : flat;
  const price = Number(rawPrice);

  if (!Number.isFinite(price) || price <= 0) return null;

  const providerTimestamp =
    payload?.posted_at_utc ||
    payload?.updatedAt ||
    payload?.timestamp_utc ||
    payload?.fetched_at_utc ||
    null;

  return { price, providerTimestamp, providerRaw: payload };
}

async function tryFetchLastSnapshot({ signal, timeoutMs } = {}) {
  try {
    const response = await fetchWithProviderTimeout(`${LAST_PRICE_PATH}?t=${Date.now()}`, {
      signal,
      timeoutMs,
    });
    if (!response.ok) return null;
    const payload = await response.json();
    return parseLastGoldPriceSnapshot(payload);
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
