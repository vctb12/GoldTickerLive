'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../..');
const SNAPSHOT_FILE = path.join(ROOT, 'data', 'gold_price.json');
const DEFAULT_ORDER = 'gold_api_com,goldapi_io,twelvedata_xauusd,fmp_gcusd,minted_metal';
const DEFAULT_INTERVAL_MS = 5000;
const DEFAULT_TIMEOUT_MS = Number(process.env.REALTIME_PROVIDER_TIMEOUT_MS) || 1800;
const LIVE_MAX_AGE_MS = 60_000;

function number(value) {
  const result = Number(value);
  return Number.isFinite(result) && result > 0 ? result : null;
}

function timestamp(value) {
  const result = new Date(value || 0);
  return Number.isFinite(result.getTime()) ? result.toISOString() : null;
}

function env(name, fallback = '') {
  return process.env[name] || fallback;
}

function configuredProviders() {
  return env('REALTIME_PROVIDER_ORDER', DEFAULT_ORDER)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function normalizeQuote(provider, price, providerTimestamp, fetchedAt, extra = {}) {
  const normalizedPrice = number(price);
  const sourceTimestamp = timestamp(providerTimestamp);
  if (!normalizedPrice || !sourceTimestamp) return null;
  const ageMs = Math.max(0, Date.now() - Date.parse(sourceTimestamp));
  return {
    xauUsdPerOz: normalizedPrice,
    timestampUtc: sourceTimestamp,
    fetchedAtUtc: fetchedAt,
    provider,
    sourceType: 'spot_reference',
    freshnessSeconds: Math.floor(ageMs / 1000),
    maxFreshnessSeconds: Math.floor(LIVE_MAX_AGE_MS / 1000),
    isFresh: ageMs <= LIVE_MAX_AGE_MS,
    isFallback: false,
    ...extra,
  };
}

async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || DEFAULT_TIMEOUT_MS);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

const PROVIDERS = {
  async gold_api_com() {
    const body = await fetchJson('https://api.gold-api.com/price/XAU');
    return normalizeQuote('gold_api_com', body?.price, body?.updatedAt, new Date().toISOString());
  },
  async goldapi_io() {
    const key = env('GOLDAPI_IO_KEY');
    if (!key) throw new Error('GOLDAPI_IO_KEY is not configured');
    const body = await fetchJson('https://www.goldapi.io/api/XAU/USD', {
      headers: { 'x-access-token': key, Accept: 'application/json' },
    });
    return normalizeQuote('goldapi_io', body?.price, body?.timestamp, new Date().toISOString(), {
      bid: number(body?.bid),
      ask: number(body?.ask),
    });
  },
  async twelvedata_xauusd() {
    const key = env('TWELVEDATA_API_KEY');
    if (!key) throw new Error('TWELVEDATA_API_KEY is not configured');
    const symbol = encodeURIComponent(env('TWELVEDATA_SYMBOL', 'XAU/USD'));
    const body = await fetchJson(
      `https://api.twelvedata.com/time_series?symbol=${symbol}&interval=1min&outputsize=1&apikey=${encodeURIComponent(key)}`
    );
    const row = Array.isArray(body?.values) ? body.values[0] : null;
    return normalizeQuote('twelvedata_xauusd', row?.close, row?.datetime, new Date().toISOString());
  },
  async fmp_gcusd() {
    const key = env('FMP_API_KEY');
    if (!key) throw new Error('FMP_API_KEY is not configured');
    const symbol = encodeURIComponent(env('FMP_SYMBOL', 'GCUSD'));
    const body = await fetchJson(
      `https://financialmodelingprep.com/stable/quote?symbol=${symbol}&apikey=${encodeURIComponent(key)}`
    );
    const row = Array.isArray(body) ? body[0] : null;
    return normalizeQuote(
      'fmp_gcusd',
      row?.price,
      row?.timestamp || row?.datetime,
      new Date().toISOString()
    );
  },
  async minted_metal() {
    const body = await fetchJson('https://mintedmetal.com/api/prices.json');
    const gold = body?.metals?.gold;
    return normalizeQuote(
      'minted_metal',
      gold?.price,
      gold?.fixedAt || body?.updatedAt,
      new Date().toISOString()
    );
  },
};

function readSnapshot() {
  try {
    const payload = JSON.parse(fs.readFileSync(SNAPSHOT_FILE, 'utf8'));
    const price = payload?.xau_usd_per_oz ?? payload?.gold?.ounce_usd;
    const updatedAt = payload?.timestamp_utc || payload?.fetched_at_utc;
    if (!number(price) || !timestamp(updatedAt)) return null;
    const maxFreshnessSeconds = Number(payload?.max_freshness_seconds) || null;
    const ageMs = Math.max(0, Date.now() - Date.parse(updatedAt));
    const isFresh =
      payload?.is_fresh === true &&
      (maxFreshnessSeconds == null || ageMs <= maxFreshnessSeconds * 1000);
    return {
      xauUsdPerOz: number(price),
      timestampUtc: timestamp(updatedAt),
      fetchedAtUtc: timestamp(payload?.fetched_at_utc) || timestamp(updatedAt),
      provider: payload?.provider || 'snapshot',
      sourceType: 'spot_reference',
      freshnessSeconds: Math.floor(ageMs / 1000),
      maxFreshnessSeconds,
      isFresh,
      isFallback: true,
    };
  } catch {
    return null;
  }
}

function createRealtimePriceService({
  intervalMs = Number(env('REALTIME_POLL_MS', DEFAULT_INTERVAL_MS)),
} = {}) {
  const listeners = new Set();
  const failures = new Map();
  let current = readSnapshot();
  let timer = null;
  let inFlight = false;

  function publish(quote) {
    if (!quote) return;
    const previous = current;
    current = quote;
    listeners.forEach((listener) => listener(current, previous));
  }

  async function poll() {
    if (inFlight) return current;
    inFlight = true;
    try {
      for (const provider of configuredProviders()) {
        const fetcher = PROVIDERS[provider];
        if (!fetcher) continue;
        try {
          const quote = await fetcher();
          if (quote?.isFresh) {
            failures.delete(provider);
            publish(quote);
            return quote;
          }
          failures.set(provider, (failures.get(provider) || 0) + 1);
        } catch {
          failures.set(provider, (failures.get(provider) || 0) + 1);
        }
      }
      return current;
    } finally {
      inFlight = false;
    }
  }

  function start() {
    if (timer) return;
    poll().catch(() => {});
    timer = setInterval(() => poll().catch(() => {}), intervalMs);
    timer.unref?.();
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  return {
    start,
    stop,
    poll,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot() {
      return current;
    },
    getProviderFailures() {
      return Object.fromEntries(failures.entries());
    },
  };
}

module.exports = { createRealtimePriceService, normalizeQuote, readSnapshot };
