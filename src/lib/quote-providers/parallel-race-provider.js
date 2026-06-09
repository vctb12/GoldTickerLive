import { BaseQuoteProvider } from './base-provider.js';

/**
 * Races multiple quote providers in parallel; first valid quote wins.
 * Aborts siblings when a winner is found or when the master budget expires.
 */
export class ParallelQuoteRaceProvider extends BaseQuoteProvider {
  constructor({
    providerId = 'live-race',
    providers = [],
    raceTimeoutMs = 2000,
    masterTimeoutMs = 5000,
  } = {}) {
    super({ providerId, timeoutMs: masterTimeoutMs });
    if (!Array.isArray(providers) || providers.length === 0) {
      throw new Error('ParallelQuoteRaceProvider requires at least one provider');
    }
    this.providers = providers;
    this.raceTimeoutMs = raceTimeoutMs;
    this.masterTimeoutMs = masterTimeoutMs;
  }

  async fetchQuote(context = {}) {
    const masterAbort = new AbortController();
    const masterTimer = setTimeout(() => masterAbort.abort(), this.masterTimeoutMs);
    const controllers = this.providers.map(() => new AbortController());

    const onMasterAbort = () => {
      for (const controller of controllers) {
        if (!controller.signal.aborted) controller.abort();
      }
    };
    masterAbort.signal.addEventListener('abort', onMasterAbort);

    const attempts = this.providers.map((provider, index) =>
      this._raceOne(provider, context, controllers[index], masterAbort.signal)
    );

    try {
      const quote = await Promise.any(attempts);
      for (const controller of controllers) {
        if (!controller.signal.aborted) controller.abort();
      }
      return quote;
    } catch (error) {
      const firstError =
        error?.errors?.[0] || error?.cause || error || new Error(`${this.providerId}: race failed`);
      throw firstError;
    } finally {
      clearTimeout(masterTimer);
      masterAbort.signal.removeEventListener('abort', onMasterAbort);
      onMasterAbort();
    }
  }

  async _raceOne(provider, context, controller, masterSignal) {
    const raceTimer = setTimeout(() => controller.abort(), this.raceTimeoutMs);
    const onMasterAbort = () => controller.abort();
    masterSignal.addEventListener('abort', onMasterAbort);

    try {
      const quote = await provider.fetchQuote({
        ...context,
        signal: controller.signal,
        timeoutMs: this.raceTimeoutMs,
      });
      return {
        ...quote,
        providerId: quote.providerId || provider.providerId,
        source: quote.source || provider.providerId,
        providerPathSuccessful: quote.providerPathSuccessful !== false,
      };
    } finally {
      clearTimeout(raceTimer);
      masterSignal.removeEventListener('abort', onMasterAbort);
    }
  }
}
