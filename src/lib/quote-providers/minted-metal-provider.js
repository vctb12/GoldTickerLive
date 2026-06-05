import { BaseQuoteProvider } from './base-provider.js';
import { fetchWithProviderTimeout, isSaneGoldSpotUsd, ProviderFetchError } from './fetch-utils.js';

const ENDPOINT = 'https://mintedmetal.com/api/prices.json';

export class MintedMetalQuoteProvider extends BaseQuoteProvider {
  constructor({ providerId = 'minted_metal', timeoutMs = 4000 } = {}) {
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
      throw new ProviderFetchError(`mintedmetal HTTP ${response.status}`, {
        code: 'http_error',
      });
    }

    let body;
    try {
      body = await response.json();
    } catch (error) {
      throw new ProviderFetchError('mintedmetal returned invalid JSON', {
        cause: error,
        code: 'malformed_json',
      });
    }

    const gold = body?.metals?.gold;
    const price = Number(gold?.price);
    if (!isSaneGoldSpotUsd(price)) {
      throw new ProviderFetchError(`mintedmetal price out of range: ${price}`, {
        code: 'sanity_range_failed',
      });
    }

    const providerTimestamp = gold?.fixedAt || body?.updatedAt || null;
    const providerTsMs = new Date(providerTimestamp || 0).getTime();
    if (!Number.isFinite(providerTsMs) || providerTsMs <= 0) {
      throw new ProviderFetchError('mintedmetal missing timestamp', {
        code: 'missing_timestamp',
      });
    }

    return this.normalizeQuote({
      price,
      providerTimestamp,
      fetchedAt: new Date().toISOString(),
      providerId: this.providerId,
      source: this.providerId,
      providerRaw: body,
      providerPathSuccessful: true,
      latencyMs: Date.now() - startedAt,
      isFresh: null,
      isFallback: false,
    });
  }
}
