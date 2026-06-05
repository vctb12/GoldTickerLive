import { BaseQuoteProvider } from './base-provider.js';
import { fetchWithProviderTimeout, isSaneGoldSpotUsd, ProviderFetchError } from './fetch-utils.js';

const ENDPOINT = 'https://api.gold-api.com/price/XAU';

export class GoldApiComQuoteProvider extends BaseQuoteProvider {
  constructor({ providerId = 'gold_api_com', timeoutMs = 4000 } = {}) {
    super({ providerId, timeoutMs });
  }

  async fetchQuote({ signal, timeoutMs } = {}) {
    const startedAt = Date.now();
    const effectiveTimeout =
      Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : this.timeoutMs;

    const response = await fetchWithProviderTimeout(ENDPOINT, {
      signal,
      timeoutMs: effectiveTimeout,
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new ProviderFetchError(`gold-api.com HTTP ${response.status}`, {
        code: response.status === 429 ? 'rate_limited' : 'http_error',
      });
    }

    let body;
    try {
      body = await response.json();
    } catch (error) {
      throw new ProviderFetchError('gold-api.com returned invalid JSON', {
        cause: error,
        code: 'malformed_json',
      });
    }

    const price = Number(body?.price);
    if (!isSaneGoldSpotUsd(price)) {
      throw new ProviderFetchError(`gold-api.com price out of range: ${price}`, {
        code: 'sanity_range_failed',
      });
    }

    const providerTimestamp = body?.updatedAt || new Date().toISOString();

    return this.normalizeQuote({
      price,
      providerTimestamp,
      fetchedAt: new Date().toISOString(),
      providerId: this.providerId,
      source: this.providerId,
      providerRaw: body,
      providerPathSuccessful: true,
      latencyMs: Date.now() - startedAt,
      isFresh: true,
      isFallback: false,
    });
  }
}
