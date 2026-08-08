import * as api from '../api.js';
import { BaseQuoteProvider } from './base-provider.js';

/** Runtime REST lane used when SSE is unavailable. */
export class BackendQuoteProvider extends BaseQuoteProvider {
  constructor({ providerId = 'runtime-api', timeoutMs = 2500 } = {}) {
    super({ providerId, timeoutMs });
  }

  async fetchQuote({ signal, timeoutMs } = {}) {
    const startedAt = Date.now();
    const data = await api.fetchGold({ signal, timeoutMs, backendOnly: true });

    return this.normalizeQuote({
      price: data.price,
      providerTimestamp: data.sourceTimestamp || data.updatedAt,
      fetchedAt: data.updatedAt || new Date().toISOString(),
      providerId: this.providerId,
      source: data.source || this.providerId,
      providerRaw: data.raw || null,
      providerPathSuccessful: data.isFallback !== true,
      forcedState: data.isFallback === true ? 'fallback' : null,
      latencyMs: Date.now() - startedAt,
      isFresh: data.isFresh ?? null,
      isFallback: data.isFallback ?? null,
    });
  }
}
