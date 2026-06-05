import { BaseQuoteProvider } from './base-provider.js';

/**
 * Tries an ordered list of quote providers; returns the first successful quote.
 */
export class ChainedQuoteProvider extends BaseQuoteProvider {
  constructor({ providerId = 'chained-primary', providers = [], timeoutMs = 5000 } = {}) {
    super({ providerId, timeoutMs });
    if (!Array.isArray(providers) || providers.length === 0) {
      throw new Error('ChainedQuoteProvider requires at least one provider');
    }
    this.providers = providers;
  }

  async fetchQuote(context = {}) {
    let lastError = null;

    for (const provider of this.providers) {
      try {
        const quote = await provider.fetchQuote(context);
        return {
          ...quote,
          providerId: quote.providerId || provider.providerId,
          source: quote.source || provider.providerId,
        };
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError || new Error(`${this.providerId}: all providers failed`);
  }
}
