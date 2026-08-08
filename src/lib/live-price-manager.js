import * as cache from './cache.js';
import { createRealtimePricingEngine } from './realtime-pricing-engine.js';
import { REALTIME_POLLING_DEFAULTS } from './realtime-config.js';
import {
  createBrowserQuoteProviders,
  createSecondaryQuoteProvider,
} from './quote-providers/create-providers.js';
import { isSaneGoldSpotUsd } from './quote-providers/fetch-utils.js';

const LKG_KEY = 'gold_price_live_lkg_v1';
const CHANNEL_NAME = 'goldtickerlive-price-v1';
const LEASE_KEY = 'goldtickerlive-price-leader-v1';
const LEASE_MS = 10_000;
const HEARTBEAT_MS = 2_000;
const CIRCUIT_FAILURES = 3;
const CIRCUIT_COOLDOWN_MS = 30_000;
const RECOVERY_SUCCESSES = 2;
const MAX_LIVE_DEVIATION_PCT = 0.05;

function isoNow(nowFn) {
  return new Date(nowFn()).toISOString();
}

function timestampMs(value) {
  const ms = new Date(value || 0).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function safeRead(key) {
  try {
    return typeof localStorage === 'undefined'
      ? null
      : JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
}

function safeWrite(key, value) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    // A full/private storage area must never stop live requests.
  }
}

function relativeDeviation(a, b) {
  if (!Number.isFinite(a) || !Number.isFinite(b) || a <= 0 || b <= 0) return 0;
  return Math.abs(a - b) / b;
}

class BrowserProviderPool {
  constructor({ nowFn = () => Date.now(), logger = console } = {}) {
    this.nowFn = nowFn;
    this.logger = logger;
    this.providers = createBrowserQuoteProviders();
    this.health = new Map(
      this.providers.map((provider) => [
        provider.providerId,
        {
          providerId: provider.providerId,
          circuit: 'closed',
          consecutiveFailures: 0,
          consecutiveSuccesses: 0,
          lastSuccessAt: null,
          lastFailureAt: null,
          nextProbeAt: null,
          lastLatencyMs: null,
          lastErrorCode: null,
        },
      ])
    );
    this.lastTrustedQuote = null;
  }

  entry(providerId) {
    return this.health.get(providerId);
  }

  canTry(entry) {
    if (!entry || entry.circuit === 'closed') return true;
    if (entry.circuit === 'open' && this.nowFn() < (entry.nextProbeAt || 0)) return false;
    entry.circuit = 'half-open';
    entry.consecutiveSuccesses = 0;
    return true;
  }

  recordFailure(entry, error) {
    entry.consecutiveFailures += 1;
    entry.consecutiveSuccesses = 0;
    entry.lastFailureAt = this.nowFn();
    entry.lastErrorCode = error?.code || error?.name || 'provider_error';
    if (entry.consecutiveFailures >= CIRCUIT_FAILURES) {
      entry.circuit = 'open';
      entry.nextProbeAt = this.nowFn() + CIRCUIT_COOLDOWN_MS;
    }
  }

  recordSuccess(entry, latencyMs) {
    entry.lastSuccessAt = this.nowFn();
    entry.lastLatencyMs = latencyMs;
    entry.lastErrorCode = null;
    entry.consecutiveFailures = 0;
    entry.consecutiveSuccesses += 1;
    if (entry.circuit === 'half-open' && entry.consecutiveSuccesses >= RECOVERY_SUCCESSES) {
      entry.circuit = 'closed';
      entry.nextProbeAt = null;
    }
  }

  async fetchQuote(context = {}) {
    let lastError = null;
    for (const provider of this.providers) {
      const health = this.entry(provider.providerId);
      if (!this.canTry(health)) continue;
      const startedAt = this.nowFn();
      try {
        const quote = await provider.fetchQuote(context);
        const price = Number(quote?.price);
        const providerTimestamp = quote?.providerTimestamp;
        const providerAgeMs = Math.max(0, this.nowFn() - timestampMs(providerTimestamp));
        if (!isSaneGoldSpotUsd(price)) throw new Error('provider price outside sanity range');
        if (!timestampMs(providerTimestamp)) throw new Error('provider timestamp missing');

        // A static Pages file or last-known snapshot is useful recovery data,
        // but it is never promoted to the browser-live state.
        const isLiveProvider = provider.providerId === 'gold_api_com';
        if (isLiveProvider && this.lastTrustedQuote) {
          const deviation = relativeDeviation(price, this.lastTrustedQuote.price);
          if (deviation > MAX_LIVE_DEVIATION_PCT) {
            throw new Error(`outlier rejected (${(deviation * 100).toFixed(2)}%)`);
          }
        }

        const latencyMs = Math.max(0, this.nowFn() - startedAt);
        this.recordSuccess(health, latencyMs);
        const normalized = {
          ...quote,
          price,
          providerId: provider.providerId,
          source: isLiveProvider ? 'Gold-API.com' : provider.providerId,
          sourceType: isLiveProvider ? 'browser-live' : 'static-fallback',
          providerTimestamp,
          fetchedAt: quote.fetchedAt || isoNow(this.nowFn),
          receivedAt: isoNow(this.nowFn),
          providerAgeMs,
          networkLatencyMs: latencyMs,
          latencyMs,
          providerPathSuccessful: isLiveProvider,
          isFresh: isLiveProvider && providerAgeMs <= 10_000,
          isFallback: !isLiveProvider,
          forcedState: isLiveProvider ? null : 'fallback',
          fallbackLevel: isLiveProvider ? 0 : this.providers.indexOf(provider),
          isValid: true,
        };
        if (isLiveProvider) this.lastTrustedQuote = normalized;
        return normalized;
      } catch (error) {
        lastError = error;
        this.recordFailure(health, error);
      }
    }
    throw lastError || new Error('all browser price providers are unavailable');
  }

  getSnapshot() {
    return Object.fromEntries([...this.health.entries()].map(([id, entry]) => [id, { ...entry }]));
  }
}

export function validateLiveQuote(quote, now = Date.now()) {
  const price = Number(quote?.price ?? quote?.xauUsdPerOz);
  const providerTimestamp = quote?.providerTimestamp || quote?.updatedAt;
  const ts = timestampMs(providerTimestamp);
  return {
    valid: isSaneGoldSpotUsd(price) && ts > 0 && ts <= now + 30_000,
    price,
    providerTimestamp,
    ageMs: ts ? Math.max(0, now - ts) : Number.POSITIVE_INFINITY,
  };
}

export function selectNewestValidQuote(candidates, now = Date.now()) {
  return (
    (Array.isArray(candidates) ? candidates : [])
      .filter((candidate) => validateLiveQuote(candidate, now).valid)
      .sort(
        (a, b) =>
          timestampMs(b.providerTimestamp || b.updatedAt) -
          timestampMs(a.providerTimestamp || a.updatedAt)
      )[0] || null
  );
}

export function createLivePriceManager({ nowFn = () => Date.now(), logger = console } = {}) {
  const pool = new BrowserProviderPool({ nowFn, logger });
  const engine = createRealtimePricingEngine({
    primaryProvider: {
      providerId: 'browser-live-pool',
      fetchQuote: (context) => pool.fetchQuote(context),
    },
    secondaryProvider: createSecondaryQuoteProvider(),
    config: { ...REALTIME_POLLING_DEFAULTS, streamUrl: null },
    nowFn,
    logger,
  });
  const subscribers = new Set();
  const id = `${Math.random().toString(36).slice(2)}-${nowFn()}`;
  let channel = null;
  let heartbeat = null;
  let started = false;
  let leader = false;
  let online = typeof navigator === 'undefined' ? true : navigator.onLine !== false;

  function getLease() {
    const lease = safeRead(LEASE_KEY);
    return lease && typeof lease === 'object' ? lease : null;
  }

  function writeLease() {
    safeWrite(LEASE_KEY, { id, expiresAt: nowFn() + LEASE_MS });
  }

  function publish(snapshot) {
    if (!leader || !snapshot?.quote || !channel) return;
    try {
      channel.postMessage({ type: 'quote', quote: snapshot.quote });
    } catch {
      // Cross-tab sharing is an optimization; polling remains the recovery path.
    }
  }

  function notify(snapshot = getSnapshot()) {
    subscribers.forEach((subscriber) => {
      try {
        subscriber(snapshot);
      } catch (error) {
        logger.error?.('[live-price-manager] subscriber error', error);
      }
    });
  }

  function engineSnapshot(snapshot) {
    if (snapshot?.quote?.providerPathSuccessful === true) {
      safeWrite(LKG_KEY, {
        schemaVersion: 1,
        price: snapshot.quote.price,
        provider: snapshot.quote.providerId,
        providerTimestamp: snapshot.quote.providerTimestamp,
        receivedAt: snapshot.quote.receivedAt || isoNow(nowFn),
      });
    }
    publish(snapshot);
    notify(getSnapshot());
  }

  function tryBecomeLeader() {
    const lease = getLease();
    if (!lease || lease.expiresAt <= nowFn() || lease.id === id) {
      writeLease();
      leader = true;
      if (online && !engine.getSnapshot().running) engine.start();
    } else if (leader && lease.id !== id) {
      leader = false;
      engine.stop();
    }
  }

  function onMessage(event) {
    if (event?.data?.type !== 'quote' || leader) return;
    const incoming = event.data.quote;
    if (!validateLiveQuote(incoming, nowFn()).valid) return;
    const current = engine.getSnapshot().quote;
    if (
      current &&
      timestampMs(incoming.providerTimestamp) <= timestampMs(current.providerTimestamp)
    )
      return;
    engine.seedQuote(incoming);
  }

  function onVisibility() {
    const visible = typeof document === 'undefined' ? true : !document.hidden;
    if (visible) tryBecomeLeader();
    if (leader) engine.setVisibility(visible);
  }

  function onOnline() {
    online = true;
    tryBecomeLeader();
    if (leader) void engine.refreshNow('online-recovery');
  }

  function onOffline() {
    online = false;
    if (leader) engine.stop();
    notify(getSnapshot());
  }

  function attach() {
    if (typeof globalThis.BroadcastChannel !== 'undefined') {
      channel = new globalThis.BroadcastChannel(CHANNEL_NAME);
      channel.addEventListener('message', onMessage);
    }
    if (typeof document !== 'undefined')
      document.addEventListener('visibilitychange', onVisibility);
    if (typeof window !== 'undefined') {
      window.addEventListener('online', onOnline);
      window.addEventListener('offline', onOffline);
    }
    heartbeat = setInterval(() => {
      tryBecomeLeader();
      if (leader) writeLease();
    }, HEARTBEAT_MS);
  }

  function detach() {
    if (heartbeat) clearInterval(heartbeat);
    heartbeat = null;
    if (typeof document !== 'undefined')
      document.removeEventListener('visibilitychange', onVisibility);
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    }
    channel?.removeEventListener?.('message', onMessage);
    channel?.close?.();
    channel = null;
    if (getLease()?.id === id) safeWrite(LEASE_KEY, { id: null, expiresAt: 0 });
  }

  function restore() {
    const lkg = safeRead(LKG_KEY);
    const cached = cache.getFallbackGoldPrice();
    const best = selectNewestValidQuote(
      [
        lkg && {
          ...lkg,
          providerId: lkg.provider || 'Gold-API.com',
          providerTimestamp: lkg.providerTimestamp,
          isFallback: false,
          providerPathSuccessful: true,
        },
        cached && {
          ...cached,
          providerId: 'cache',
          providerTimestamp: cached.updatedAt || cached.fetchedAt,
          isFallback: true,
          providerPathSuccessful: false,
        },
      ],
      nowFn()
    );
    if (best) engine.seedQuote(best);
  }

  function start() {
    if (started) return;
    started = true;
    restore();
    attach();
    tryBecomeLeader();
    notify(getSnapshot());
  }

  function stop() {
    if (!started) return;
    started = false;
    engine.stop();
    detach();
    leader = false;
  }

  function subscribe(listener) {
    if (typeof listener !== 'function') return () => {};
    subscribers.add(listener);
    listener(getSnapshot());
    if (subscribers.size === 1) start();
    return () => {
      subscribers.delete(listener);
      if (subscribers.size === 0) stop();
    };
  }

  function getSnapshot() {
    const snapshot = engine.getSnapshot();
    return {
      ...snapshot,
      online,
      leader,
      providerHealth: { ...snapshot.providerHealth, ...pool.getSnapshot() },
      transport: { mode: 'browser-polling', connected: leader && online },
    };
  }

  const unsubscribeEngine = engine.subscribe(engineSnapshot);

  return {
    start,
    stop,
    refreshNow: (reason = 'manual') =>
      leader && online ? engine.refreshNow(reason) : Promise.resolve(),
    subscribe,
    setVisibility: (visible) => {
      if (leader) engine.setVisibility(visible);
    },
    seedFromCache: (quote) => engine.seedFromCache(quote),
    seedQuote: (quote) => engine.seedQuote(quote),
    getSnapshot,
    getProviderHealth: () => pool.getSnapshot(),
    destroy: () => {
      unsubscribeEngine();
      stop();
    },
  };
}

let singleton = null;

export function getLivePriceManager() {
  if (!singleton) singleton = createLivePriceManager();
  return singleton;
}

export function resetLivePriceManagerForTests() {
  singleton?.destroy?.();
  singleton = null;
}
