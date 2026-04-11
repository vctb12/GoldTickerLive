/**
 * services/apiAdapter.js
 * Generic fetch wrapper used by all gold and FX service calls.
 * Provides: AbortController timeout, exponential backoff retry, typed errors.
 */

export class NetworkError extends Error {
  constructor(msg, status) { super(msg); this.name = 'NetworkError'; this.status = status; }
}
export class TimeoutError extends Error {
  constructor(msg) { super(msg); this.name = 'TimeoutError'; }
}
export class DataError extends Error {
  constructor(msg) { super(msg); this.name = 'DataError'; }
}

/**
 * Fetch with an AbortController timeout.
 * @param {string} url
 * @param {number} timeoutMs
 * @returns {Promise<Response>}
 */
export async function fetchWithTimeout(url, timeoutMs = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    if (!res.ok) throw new NetworkError(`HTTP ${res.status}: ${url}`, res.status);
    return res;
  } catch (e) {
    clearTimeout(id);
    if (e.name === 'AbortError') throw new TimeoutError(`Timeout fetching ${url}`);
    if (e instanceof NetworkError || e instanceof TimeoutError || e instanceof DataError) throw e;
    throw new NetworkError(e.message);
  }
}

/**
 * Retry a function with exponential backoff.
 * @param {() => Promise<T>} fn
 * @param {number} maxRetries  Default 2 (total 3 attempts: 0ms, 2s, 4s)
 * @returns {Promise<T>}
 */
export async function retryWithBackoff(fn, maxRetries = 2) {
  let lastErr;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
      }
    }
  }
  throw lastErr;
}

/**
 * Full API fetch with timeout + retry.
 * @param {string} url
 * @param {{ timeoutMs?: number, maxRetries?: number }} opts
 * @returns {Promise<{ data: any, timestamp: number }>}
 */
export async function apiFetch(url, opts = {}) {
  const { timeoutMs = 5000, maxRetries = 2 } = opts;
  return retryWithBackoff(async () => {
    const res = await fetchWithTimeout(url, timeoutMs);
    const data = await res.json();
    return { data, timestamp: Date.now() };
  }, maxRetries);
}
