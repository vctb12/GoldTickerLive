import { getMetal, metalKeys } from '../../config/metals.js';
import { BaseQuoteProvider } from './base-provider.js';
import { fetchWithProviderTimeout, ProviderFetchError } from './fetch-utils.js';

const ENDPOINT_ROOT = 'https://api.gold-api.com/price';
const MAX_AGE_MS = 15 * 60 * 1000;
const PRICE_BOUNDS_USD_PER_OZ = Object.freeze({
  XAU: [1000, 10000],
  XAG: [1, 500],
  XPT: [100, 10000],
  XPD: [100, 10000],
});

function isSaneMetalSpot(symbol, price) {
  const [minimum, maximum] = PRICE_BOUNDS_USD_PER_OZ[symbol] || [];
  return Number.isFinite(price) && Number.isFinite(minimum) && price >= minimum && price <= maximum;
}

/**
 * Isolated pilot provider for a single precious metal. It is intentionally not part of the gold
 * provider chain and cannot change the production workflow or fallback order.
 */
export class GoldApiComMetalQuoteProvider extends BaseQuoteProvider {
  constructor({ metalKey, timeoutMs = 4000 } = {}) {
    const normalizedKey = String(metalKey || '').toLowerCase();
    if (!metalKeys().includes(normalizedKey)) throw new Error(`Unsupported metal: ${metalKey}`);
    const metal = getMetal(normalizedKey);
    super({ providerId: `gold_api_com_${metal.symbol.toLowerCase()}`, timeoutMs });
    this.metalKey = normalizedKey;
    this.symbol = metal.symbol;
  }

  async fetchQuote({ signal, timeoutMs } = {}) {
    const startedAt = Date.now();
    const effectiveTimeout =
      Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : this.timeoutMs;
    const response = await fetchWithProviderTimeout(`${ENDPOINT_ROOT}/${this.symbol}`, {
      signal,
      timeoutMs: effectiveTimeout,
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new ProviderFetchError(`gold-api.com ${this.symbol} HTTP ${response.status}`, {
        code: response.status === 429 ? 'rate_limited' : 'http_error',
      });
    }

    let body;
    try {
      body = await response.json();
    } catch (error) {
      throw new ProviderFetchError(`gold-api.com ${this.symbol} returned invalid JSON`, {
        cause: error,
        code: 'malformed_json',
      });
    }

    const price = Number(body?.price);
    if (!isSaneMetalSpot(this.symbol, price)) {
      throw new ProviderFetchError(`gold-api.com ${this.symbol} price out of range: ${price}`, {
        code: 'sanity_range_failed',
      });
    }
    if (body?.symbol && String(body.symbol).toUpperCase() !== this.symbol) {
      throw new ProviderFetchError(`gold-api.com symbol mismatch: expected ${this.symbol}`, {
        code: 'symbol_mismatch',
      });
    }

    const providerTimestamp = body?.updatedAt;
    const providerTsMs = new Date(providerTimestamp || 0).getTime();
    if (!Number.isFinite(providerTsMs) || providerTsMs <= 0) {
      throw new ProviderFetchError(`gold-api.com ${this.symbol} missing updatedAt`, {
        code: 'missing_timestamp',
      });
    }
    const ageMs = Date.now() - providerTsMs;
    if (ageMs > MAX_AGE_MS) {
      throw new ProviderFetchError(`gold-api.com ${this.symbol} data too old`, {
        code: 'stale_data',
        ageMs,
      });
    }

    const normalized = this.normalizeQuote({
      price,
      providerTimestamp,
      fetchedAt: new Date().toISOString(),
      providerRaw: body,
      providerPathSuccessful: true,
      latencyMs: Date.now() - startedAt,
      isFresh: true,
      isFallback: false,
    });
    return {
      ...normalized,
      metalKey: this.metalKey,
      symbol: this.symbol,
      source: 'Gold-API.com',
      sourceId: this.providerId,
    };
  }
}

export { isSaneMetalSpot, PRICE_BOUNDS_USD_PER_OZ };
