'use strict';

/**
 * Midas phase 6 gate — total spot-source failure must degrade HONESTLY.
 *
 * Simulates the worst case: every realtime provider rejected AND the committed
 * JSON fetch rejected. The resulting state/label must be a labelled fallback
 * (cached / fallback / unavailable) — NEVER 'live', and NEVER an unlabelled
 * number. Follows the tier/labelling patterns of tests/fallback-chain.test.js,
 * but exercises the REAL modules (api.js, spot-resolver.js, freshness-policy,
 * realtime-pricing-engine, quote-provider chain) instead of a simulator.
 */

const { describe, test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function loadModules() {
  const base = path.resolve(__dirname, '..', 'src', 'lib');
  const api = await import('file://' + path.join(base, 'api.js'));
  const resolver = await import('file://' + path.join(base, 'spot-resolver.js'));
  const policy = await import('file://' + path.join(base, 'freshness-policy.js'));
  const engineMod = await import('file://' + path.join(base, 'realtime-pricing-engine.js'));
  const providers = await import(
    'file://' + path.join(base, 'quote-providers', 'create-providers.js')
  );
  return { api, resolver, policy, engineMod, providers };
}

// Fixed "now": Wednesday 2026-07-15 12:00 UTC — gold market OPEN, so the
// honest-degradation guarantee is tested in the state where mislabelling as
// 'live' would actually be reachable (a closed market masks the label).
const MARKET_OPEN_NOW = Date.parse('2026-07-15T12:00:00Z');

const originalFetch = global.fetch;

function installLocalStorage(seed = {}) {
  const store = new Map(Object.entries(seed));
  global.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}

function failingProvider(providerId) {
  return {
    providerId,
    fetchQuote: async () => {
      throw new Error(`${providerId}: total outage`);
    },
  };
}

/** Build an engine whose timers never auto-fire — polls are driven manually. */
function buildEngine(engineMod, { seedQuote = null } = {}) {
  const engine = engineMod.createRealtimePricingEngine({
    primaryProvider: failingProvider('stub-primary'),
    secondaryProvider: failingProvider('stub-secondary'),
    nowFn: () => MARKET_OPEN_NOW,
    setTimeoutFn: () => 0, // swallow scheduling — the test drives refreshNow()
    clearTimeoutFn: () => {},
    logger: { info() {}, warn() {}, error() {} },
  });
  if (seedQuote) engine.seedFromCache(seedQuote);
  return engine;
}

beforeEach(() => {
  delete global.localStorage;
});

afterEach(async () => {
  global.fetch = originalFetch;
  delete global.localStorage;
  const { api, resolver } = await loadModules();
  api.setSimulateGoldFail(false);
  api.setSimulateFxFail(false);
  resolver.resetCanonicalSpot();
});

describe('freshness policy — failure states can never classify as live', () => {
  test('a failed provider path is fallback/estimated even at age 0', async () => {
    const { policy } = await loadModules();

    const pathFailed = policy.evaluateFreshnessState({
      ageMs: 0,
      providerPathSuccessful: false,
      providerHealthy: true,
      marketOpen: true,
    });
    assert.notEqual(pathFailed.state, 'live');
    assert.equal(pathFailed.state, 'fallback');

    const unhealthy = policy.evaluateFreshnessState({
      ageMs: 0,
      providerPathSuccessful: true,
      providerHealthy: false,
      marketOpen: true,
    });
    assert.notEqual(unhealthy.state, 'live');

    for (const evaluation of [pathFailed, unhealthy]) {
      assert.equal(
        policy.isLiveEligible({
          state: evaluation.state,
          ageMs: evaluation.ageMs,
          providerHealthy: false,
          providerPathSuccessful: false,
        }),
        false
      );
    }
  });

  test('an unknown/unparseable age is never live', async () => {
    const { policy } = await loadModules();
    for (const ageMs of [NaN, undefined, -1, Number.POSITIVE_INFINITY]) {
      const evaluation = policy.evaluateFreshnessState({ ageMs, marketOpen: true });
      assert.notEqual(evaluation.state, 'live', `ageMs=${ageMs} must not be live`);
    }
  });
});

describe('committed-JSON lane — total fetch failure', () => {
  test('fetchGold with network down and NO cache rejects (no unlabelled number)', async () => {
    global.fetch = async () => {
      throw new Error('network down');
    };

    const { api } = await loadModules();
    await assert.rejects(
      () => api.fetchGold(),
      (err) => err.name === 'NetworkError'
    );
  });

  test('fetchGold with network down and a cached snapshot returns a LABELLED fallback', async () => {
    const cachedAt = new Date(MARKET_OPEN_NOW - 45 * 60 * 1000).toISOString();
    installLocalStorage({
      gold_price_cache: JSON.stringify({
        price: 3998.5,
        updatedAt: cachedAt,
        fetchedAt: MARKET_OPEN_NOW - 45 * 60 * 1000,
      }),
    });
    global.fetch = async () => {
      throw new Error('network down');
    };

    const { api, resolver } = await loadModules();
    const result = await api.fetchGold();

    // The number is present but explicitly labelled as cache fallback…
    assert.equal(result.price, 3998.5);
    assert.equal(result.source, 'cache-fallback');
    assert.equal(result.updatedAt, cachedAt);

    // …and the canonical classifier degrades it — never 'live'.
    const freshness = resolver.classifyFreshness(result);
    assert.equal(freshness.state, 'cached');
    assert.equal(freshness.isFallback, true);
    assert.notEqual(freshness.state, 'live');
  });

  test('classifyFreshness/buildSnapshot with no data at all is a labelled unavailable', async () => {
    const { resolver } = await loadModules();

    const freshness = resolver.classifyFreshness(null);
    assert.equal(freshness.state, 'unavailable');
    assert.equal(freshness.isFallback, true);

    const snapshot = resolver.buildSnapshot(null);
    assert.equal(snapshot.ok, false);
    assert.equal(snapshot.spotUsdPerOz, null); // no unlabelled number
    assert.equal(snapshot.freshness.state, 'unavailable');
  });
});

describe('realtime provider chain — every tier rejected', () => {
  test('the full production chain rejects when all sources are down (no fabricated quote)', async () => {
    global.fetch = async () => {
      throw new Error('total outage');
    };
    // No localStorage either — the committed-JSON tier has no cache fallback.

    const { providers } = await loadModules();
    const chain = providers.createPrimaryQuoteProvider();
    await assert.rejects(() => chain.fetchQuote({ timeoutMs: 500 }));
  });
});

describe('realtime engine — total failure surfaces honest states only', () => {
  test('no quote ever received → state is unavailable, never live', async () => {
    const { engineMod } = await loadModules();
    const engine = buildEngine(engineMod);

    const seenStates = [];
    const unsubscribe = engine.subscribe((snap) => {
      seenStates.push(snap.freshness.state);
      if (snap.quote) seenStates.push(snap.quote.status);
    });

    engine.start();
    await engine.refreshNow('midas-gate');
    await engine.refreshNow('midas-gate-2');
    const snap = engine.getSnapshot();
    engine.stop();
    unsubscribe();

    assert.equal(snap.quote, null); // no unlabelled/fabricated number
    assert.equal(snap.freshness.state, 'unavailable');
    assert.ok(snap.metrics.consecutiveFailures >= 2);
    assert.ok(
      seenStates.every((s) => s !== 'live'),
      `no emitted state may be 'live', saw: ${seenStates.join(',')}`
    );
  });

  test('seeded from cache, then total failure → stays a labelled cached fallback', async () => {
    const { engineMod, policy } = await loadModules();
    const seededAt = new Date(MARKET_OPEN_NOW - 10 * 60 * 1000).toISOString();
    const engine = buildEngine(engineMod, {
      seedQuote: {
        price: 4001.2,
        updatedAt: seededAt,
        providerId: 'cache',
        source: 'cache',
      },
    });

    engine.start();
    await engine.refreshNow('midas-gate');
    const snap = engine.getSnapshot();
    engine.stop();

    // The seeded number survives but is force-labelled cached fallback.
    assert.equal(snap.quote.price, 4001.2);
    assert.equal(snap.quote.isFallback, true);
    assert.equal(snap.quote.providerPathSuccessful, false);
    assert.equal(snap.freshness.state, 'cached');
    assert.notEqual(snap.freshness.state, 'live');
    assert.equal(
      policy.isLiveEligible({
        state: snap.freshness.state,
        ageMs: snap.freshness.ageMs,
        providerHealthy: false,
        providerPathSuccessful: false,
      }),
      false
    );
  });
});

describe('FX lane — total failure degrades honestly too', () => {
  test('fetchFX with network down and NO cache rejects; with cache it is labelled', async () => {
    global.fetch = async () => {
      throw new Error('network down');
    };

    const { api } = await loadModules();
    await assert.rejects(
      () => api.fetchFX(),
      (err) => err.name === 'NetworkError'
    );

    installLocalStorage({
      fx_rates_cache: JSON.stringify({
        rates: { EUR: 0.91, GBP: 0.78 },
        time_last_update_utc: new Date(MARKET_OPEN_NOW - 3600_000).toUTCString(),
        time_next_update_utc: new Date(MARKET_OPEN_NOW + 3600_000).toUTCString(),
        fetchedAt: MARKET_OPEN_NOW - 3600_000,
      }),
    });
    const cached = await api.fetchFX();
    assert.equal(cached.source, 'cache-fallback');
    assert.equal(cached.rates.EUR, 0.91);
  });
});
