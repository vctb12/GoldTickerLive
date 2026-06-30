/**
 * Shared fetch helper for browser quote providers.
 * Re-throws AbortError as a distinguishable timeout error.
 */

export class ProviderFetchError extends Error {
  constructor(message, { cause, code = 'provider_error' } = {}) {
    super(message);
    this.name = 'ProviderFetchError';
    this.code = code;
    if (cause) this.cause = cause;
  }
}

/**
 * @param {string} url
 * @param {{ signal?: AbortSignal, timeoutMs?: number, headers?: Record<string,string> }} [options]
 * @returns {Promise<Response>}
 */
export async function fetchWithProviderTimeout(url, { signal, timeoutMs = 5000, headers } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const onExternalAbort = () => controller.abort();
  if (signal?.aborted) {
    onExternalAbort();
  } else if (signal) {
    signal.addEventListener('abort', onExternalAbort, { once: true });
  }

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal,
      headers,
    });
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onExternalAbort);
    return response;
  } catch (error) {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onExternalAbort);
    if (error?.name === 'AbortError') {
      throw new ProviderFetchError(`Timeout fetching ${url}`, { cause: error, code: 'timeout' });
    }
    throw new ProviderFetchError(error?.message || `Network error fetching ${url}`, {
      cause: error,
      code: 'network_error',
    });
  }
}

/**
 * Client-side sanity band for XAU/USD spot. The upper bound (10000) matches the
 * Python adapter (`gold_providers/base.py` DEFAULT_MAX_VALID_XAU_USD); the lower
 * bound is intentionally tighter than Python's (1000 vs the Python 500 floor) —
 * the browser only consumes already-validated snapshots, so a stricter floor
 * adds defense-in-depth without rejecting any real quote.
 * @param {number} price
 */
export function isSaneGoldSpotUsd(price) {
  return Number.isFinite(price) && price >= 1000 && price <= 10000;
}
