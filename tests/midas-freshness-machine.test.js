'use strict';

/**
 * Midas phase 7 — freshness label state machine (BREAKER suite).
 *
 * The site runs TWO freshness engines plus one canonical classifier
 * (docs/plans/midas/ARCHITECTURE_MAP.md "Freshness: two engines"):
 *
 *   1. `src/lib/freshness-policy.js` `evaluateFreshnessState` — realtime
 *      engine path (home/tracker realtime panels). Budgets: live ≤ 5 s,
 *      cached ≤ 60 s, delayed ≤ 300 s, then `estimated`. Also emits
 *      `fallback` (provider unhealthy) and `closed` (market closed).
 *   2. `src/lib/live-status.js` `getLiveFreshness` — hourly committed-JSON
 *      path (hero, ticker, spot bar, badges). Age path: live ≤ 30 min,
 *      delayed ≤ 75 min, then `stale`; hard guards `fallback`
 *      (isFallback), `stale` (upstream isFresh:false), `unavailable`
 *      (missing timestamp); `cached` on local fetch failure. The
 *      isFresh:true branch borrows the tighter FRESHNESS_POLICY budgets.
 *      `getFXFreshness`: live / cached ≤ 26 h, then `stale`.
 *   3. `src/lib/spot-resolver.js` `classifyFreshness` — canonical snapshot
 *      classifier. Age-aware since phase 7: effective age = max(recomputed
 *      timestamp age, frozen commit-time freshness_seconds); `live` requires
 *      a verifiable timestamp within `max_freshness_seconds`.
 *
 * This suite enumerates the reachable state vocabulary of each engine, locks
 * every threshold boundary (exactly-at vs +1 ms), covers clock skew,
 * tab-asleep re-evaluation, offline→online recovery and partial (gold vs FX)
 * degradation, and finishes with a fuzzed unreachability proof: no input with
 * data older than the applicable live threshold may yield `live` through any
 * engine's public API.
 */

const { test, describe, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

function load(rel) {
  const url = new URL('file://' + path.resolve(__dirname, '..', 'src', 'lib', rel));
  return import(url.href);
}

// Wednesday 12:00 UTC — gold market open (closed window is Fri 21:00 → Sun 22:00).
const NOW_ISO = '2026-07-15T12:00:00.000Z';
const NOW_MS = Date.parse(NOW_ISO);

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

/** Deterministic PRNG (mulberry32) so fuzz failures are reproducible. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const FUZZ_SEED = 0x4d1da5; // "MIDAS"
const FUZZ_ITERATIONS = 300; // >= 200 per engine (brief floor)

function pick(rand, values) {
  return values[Math.floor(rand() * values.length)];
}

afterEach(() => {
  mock.timers.reset();
});

// ───────────────────────────────────────────────────────────────────────────
// 1. State-space enumeration — the vocabulary each engine can actually emit
// ───────────────────────────────────────────────────────────────────────────

describe('state enumeration', () => {
  test('freshness-policy engine emits exactly {live, cached, delayed, estimated, fallback, closed}', async () => {
    const { evaluateFreshnessState } = await load('freshness-policy.js');

    const reached = new Set([
      evaluateFreshnessState({ ageMs: 1000 }).state, // live
      evaluateFreshnessState({ ageMs: 30_000 }).state, // cached
      evaluateFreshnessState({ ageMs: 120_000 }).state, // delayed
      evaluateFreshnessState({ ageMs: 400_000 }).state, // estimated
      evaluateFreshnessState({ ageMs: 1000, providerHealthy: false }).state, // fallback
      evaluateFreshnessState({ ageMs: 1000, marketOpen: false }).state, // closed
    ]);
    assert.deepEqual(
      [...reached].sort(),
      ['cached', 'closed', 'delayed', 'estimated', 'fallback', 'live'].sort()
    );
    // `stale` and `unavailable` belong to the live-status vocabulary, not this engine.
    assert.ok(!reached.has('stale'));
    assert.ok(!reached.has('unavailable'));
  });

  test('live-status engine emits exactly {live, delayed, cached, stale, fallback, unavailable}', async () => {
    mock.timers.enable({ apis: ['Date'], now: NOW_MS });
    const { getLiveFreshness } = await load('live-status.js');

    const at = (ageMs) => new Date(NOW_MS - ageMs).toISOString();
    const reached = new Set([
      getLiveFreshness({ updatedAt: at(60_000) }).key, // live (age path, 1 min)
      getLiveFreshness({ updatedAt: at(40 * MINUTE_MS) }).key, // delayed
      getLiveFreshness({ updatedAt: at(60_000), hasLiveFailure: true }).key, // cached
      getLiveFreshness({ updatedAt: at(2 * HOUR_MS) }).key, // stale
      getLiveFreshness({ updatedAt: at(60_000), isFallback: true }).key, // fallback
      getLiveFreshness({}).key, // unavailable
    ]);
    assert.deepEqual(
      [...reached].sort(),
      ['cached', 'delayed', 'fallback', 'live', 'stale', 'unavailable'].sort()
    );
    // getLiveFreshness never emits closed/estimated — the market-closed overlay
    // and the realtime engine own those states respectively.
    assert.ok(!reached.has('closed'));
    assert.ok(!reached.has('estimated'));
  });

  test('spot-resolver classifier emits exactly {live, delayed, cached, fallback, unavailable}', async () => {
    const { classifyFreshness } = await load('spot-resolver.js');

    const gold = (over = {}) => ({
      price: 4000,
      source: 'gold_api_com',
      isFresh: true,
      isFallback: false,
      freshnessSeconds: 20,
      maxFreshnessSeconds: 900,
      updatedAt: new Date(NOW_MS - 20_000).toISOString(),
      ...over,
    });
    const reached = new Set([
      classifyFreshness(gold(), NOW_MS).state, // live
      classifyFreshness(gold(), NOW_MS + 20 * MINUTE_MS).state, // delayed
      classifyFreshness(gold(), NOW_MS + 3 * HOUR_MS).state, // cached
      classifyFreshness(gold({ isFallback: true }), NOW_MS).state, // fallback
      classifyFreshness(null, NOW_MS).state, // unavailable
    ]);
    assert.deepEqual(
      [...reached].sort(),
      ['cached', 'delayed', 'fallback', 'live', 'unavailable'].sort()
    );
    // classifyFreshness never emits stale/estimated/closed (docs/price-flow-map.md);
    // consumers map onward via getLiveFreshness + the market-closed overlay.
    assert.ok(!reached.has('stale'));
    assert.ok(!reached.has('estimated'));
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 2. Threshold boundary transitions — exactly at, and +1 ms past
// ───────────────────────────────────────────────────────────────────────────

describe('threshold boundaries', () => {
  test('freshness-policy: each budget is inclusive at the boundary, degrades at +1 ms', async () => {
    const { evaluateFreshnessState, FRESHNESS_POLICY } = await load('freshness-policy.js');
    const { liveMaxAgeMs, cachedMaxAgeMs, delayedMaxAgeMs } = FRESHNESS_POLICY;

    assert.equal(evaluateFreshnessState({ ageMs: liveMaxAgeMs }).state, 'live');
    assert.equal(evaluateFreshnessState({ ageMs: liveMaxAgeMs + 1 }).state, 'cached');
    assert.equal(evaluateFreshnessState({ ageMs: cachedMaxAgeMs }).state, 'cached');
    assert.equal(evaluateFreshnessState({ ageMs: cachedMaxAgeMs + 1 }).state, 'delayed');
    assert.equal(evaluateFreshnessState({ ageMs: delayedMaxAgeMs }).state, 'delayed');
    assert.equal(evaluateFreshnessState({ ageMs: delayedMaxAgeMs + 1 }).state, 'estimated');
  });

  test('live-status age path: live→delayed at 30 min boundary, delayed→stale at 75 min boundary', async () => {
    mock.timers.enable({ apis: ['Date'], now: NOW_MS });
    const { getLiveFreshness, GOLD_MARKET } = await load('live-status.js');
    const at = (ageMs) => new Date(NOW_MS - ageMs).toISOString();

    // The threshold comparison is strict (`>`), so exactly-at stays in-state.
    assert.equal(getLiveFreshness({ updatedAt: at(GOLD_MARKET.DELAYED_AFTER_MS) }).key, 'live');
    assert.equal(
      getLiveFreshness({ updatedAt: at(GOLD_MARKET.DELAYED_AFTER_MS + 1) }).key,
      'delayed'
    );
    assert.equal(getLiveFreshness({ updatedAt: at(GOLD_MARKET.STALE_AFTER_MS) }).key, 'delayed');
    assert.equal(getLiveFreshness({ updatedAt: at(GOLD_MARKET.STALE_AFTER_MS + 1) }).key, 'stale');
  });

  test('live-status isFresh:true path: borrows the tight 5 s live budget, still hard-stales past 75 min', async () => {
    mock.timers.enable({ apis: ['Date'], now: NOW_MS });
    const { getLiveFreshness, GOLD_MARKET } = await load('live-status.js');
    const { FRESHNESS_POLICY } = await load('freshness-policy.js');
    const at = (ageMs) => new Date(NOW_MS - ageMs).toISOString();
    const f = (ageMs) => getLiveFreshness({ updatedAt: at(ageMs), isFresh: true }).key;

    assert.equal(f(FRESHNESS_POLICY.liveMaxAgeMs), 'live');
    assert.equal(f(FRESHNESS_POLICY.liveMaxAgeMs + 1), 'cached');
    assert.equal(f(FRESHNESS_POLICY.cachedMaxAgeMs), 'cached');
    assert.equal(f(FRESHNESS_POLICY.cachedMaxAgeMs + 1), 'delayed');
    assert.equal(f(FRESHNESS_POLICY.delayedMaxAgeMs + 1), 'delayed');
    // Hard age ceiling: an eternally-frozen upstream `is_fresh:true` cannot
    // hold "delayed" forever — past the stale window it must read stale.
    assert.equal(f(GOLD_MARKET.STALE_AFTER_MS), 'delayed');
    assert.equal(f(GOLD_MARKET.STALE_AFTER_MS + 1), 'stale');
  });

  test('spot-resolver: live→delayed at max_freshness_seconds boundary, delayed→cached at 2×', async () => {
    const { classifyFreshness } = await load('spot-resolver.js');
    const gold = {
      price: 4000,
      source: 'gold_api_com',
      isFresh: true,
      isFallback: false,
      freshnessSeconds: 20,
      maxFreshnessSeconds: 900,
      updatedAt: NOW_ISO,
    };
    const stateAt = (ageMs) => classifyFreshness(gold, NOW_MS + ageMs).state;

    assert.equal(stateAt(900 * 1000), 'live', 'exactly at the budget is still live');
    assert.equal(stateAt(900 * 1000 + 1), 'delayed', '+1 ms past the budget degrades');
    assert.equal(stateAt(1800 * 1000), 'delayed', 'exactly at 2× budget is still delayed');
    assert.equal(stateAt(1800 * 1000 + 1), 'cached', '+1 ms past 2× budget degrades');
  });

  test('FX freshness: live→stale at the 26 h boundary; cache failure labels cached inside the window', async () => {
    mock.timers.enable({ apis: ['Date'], now: NOW_MS });
    const { getFXFreshness, FX_MARKET } = await load('live-status.js');
    const at = (ageMs) => new Date(NOW_MS - ageMs).toISOString();

    assert.equal(getFXFreshness({ fxUpdatedAt: at(FX_MARKET.FX_STALE_AFTER_MS) }).key, 'live');
    assert.equal(getFXFreshness({ fxUpdatedAt: at(FX_MARKET.FX_STALE_AFTER_MS + 1) }).key, 'stale');
    assert.equal(getFXFreshness({ fxUpdatedAt: at(HOUR_MS), hasCacheFailure: true }).key, 'cached');
    assert.equal(getFXFreshness({}).key, 'unavailable');
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 3. Clock skew — future timestamps must not mint negative age or eternal-live
// ───────────────────────────────────────────────────────────────────────────

describe('clock skew', () => {
  test('live-status getAgeMs: small forward skew clamps to 0, far-future is unverifiable (Infinity)', async () => {
    mock.timers.enable({ apis: ['Date'], now: NOW_MS });
    const { getAgeMs, CLOCK_SKEW_TOLERANCE_MS } = await load('live-status.js');

    const near = getAgeMs(new Date(NOW_MS + 30_000).toISOString());
    assert.equal(near, 0, 'within-tolerance future timestamp clamps to age 0, never negative');
    assert.equal(getAgeMs(new Date(NOW_MS + CLOCK_SKEW_TOLERANCE_MS).toISOString()), 0);
    assert.equal(
      getAgeMs(new Date(NOW_MS + CLOCK_SKEW_TOLERANCE_MS + 1).toISOString()),
      Infinity,
      'beyond-tolerance future timestamp is unverifiable'
    );
  });

  test('live-status: a far-future timestamp degrades to stale — even with upstream isFresh:true — and never turns live as time passes', async () => {
    mock.timers.enable({ apis: ['Date'], now: NOW_MS });
    const { getLiveFreshness } = await load('live-status.js');
    const farFuture = new Date(NOW_MS + 24 * HOUR_MS).toISOString();

    const skewed = getLiveFreshness({ updatedAt: farFuture, isFresh: true });
    assert.notEqual(skewed.key, 'live');
    assert.equal(skewed.key, 'stale');
    assert.ok(skewed.ageMs >= 0, 'age is never negative');

    // Advance the clock 2 h: still inside the bogus-future window, still not live.
    mock.timers.setTime(NOW_MS + 2 * HOUR_MS);
    const later = getLiveFreshness({ updatedAt: farFuture, isFresh: true });
    assert.notEqual(later.key, 'live', 'no eternal-live from a future timestamp');
  });

  test('freshness-policy: negative age (skewed engine input) can never be live', async () => {
    const { evaluateFreshnessState, isLiveEligible } = await load('freshness-policy.js');
    const result = evaluateFreshnessState({ ageMs: -5000 });
    assert.notEqual(result.state, 'live');
    assert.equal(result.state, 'estimated', 'negative age clamps to Infinity → estimated');
    assert.ok(result.ageMs >= 0, 'normalized age is never negative');
    assert.equal(
      isLiveEligible({ ...result, providerHealthy: true, providerPathSuccessful: true }),
      false
    );
  });

  test('spot-resolver: future timestamps clamp within tolerance and degrade beyond it', async () => {
    const { classifyFreshness } = await load('spot-resolver.js');
    const gold = (updatedAt) => ({
      price: 4000,
      source: 'gold_api_com',
      isFresh: true,
      isFallback: false,
      freshnessSeconds: 20,
      maxFreshnessSeconds: 900,
      updatedAt,
    });

    // Small skew (30 s ahead): clamps to age 0 — allowed to be live, never negative.
    const near = classifyFreshness(gold(new Date(NOW_MS + 30_000).toISOString()), NOW_MS);
    assert.equal(near.ageSeconds, 0);
    assert.ok(near.seconds >= 0);

    // Far-future (24 h ahead): unverifiable — must not classify live, now or later.
    const farIso = new Date(NOW_MS + 24 * HOUR_MS).toISOString();
    const far = classifyFreshness(gold(farIso), NOW_MS);
    assert.notEqual(far.state, 'live');
    assert.equal(far.ageSeconds, null, 'far-future age is unverifiable, not negative');
    const farLater = classifyFreshness(gold(farIso), NOW_MS + 2 * HOUR_MS);
    assert.notEqual(farLater.state, 'live', 'no eternal-live from a future timestamp');
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 4. Tab-asleep simulation — state computed at t0 must degrade at t0 + 2 h
// ───────────────────────────────────────────────────────────────────────────

describe('tab asleep (re-evaluation after a long gap)', () => {
  test('live-status: the same payload that read live at t0 reads stale after a 2 h sleep', async () => {
    mock.timers.enable({ apis: ['Date'], now: NOW_MS });
    const { getLiveFreshness } = await load('live-status.js');
    const payload = { updatedAt: new Date(NOW_MS - 60_000).toISOString(), isFallback: false };

    assert.equal(getLiveFreshness(payload).key, 'live');
    mock.timers.setTime(NOW_MS + 2 * HOUR_MS); // laptop lid closed for 2 h
    const woke = getLiveFreshness(payload);
    assert.equal(woke.key, 'stale');
    assert.ok(woke.ageMs > 2 * HOUR_MS - 1);
  });

  test('spot-resolver: the frozen committed snapshot that read live at t0 degrades after a 2 h sleep', async () => {
    const { classifyFreshness } = await load('spot-resolver.js');
    const committed = {
      price: 4000,
      source: 'gold_api_com',
      isFresh: true, // frozen at commit time — never flips client-side
      isFallback: false,
      freshnessSeconds: 19, // frozen at commit time — never ages
      maxFreshnessSeconds: 900,
      updatedAt: new Date(NOW_MS - 60_000).toISOString(),
    };
    assert.equal(classifyFreshness(committed, NOW_MS).state, 'live');
    const woke = classifyFreshness(committed, NOW_MS + 2 * HOUR_MS);
    assert.notEqual(woke.state, 'live', 'frozen flags cannot hold live through a sleep');
    assert.equal(woke.state, 'cached');
  });

  test('freshness-policy: recomputed age after sleep leaves the live budget', async () => {
    const { evaluateFreshnessState } = await load('freshness-policy.js');
    assert.equal(evaluateFreshnessState({ ageMs: 1000 }).state, 'live');
    assert.equal(evaluateFreshnessState({ ageMs: 1000 + 2 * HOUR_MS }).state, 'estimated');
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 5. Offline → online — fallback data upgrades honestly when fresh data lands
// ───────────────────────────────────────────────────────────────────────────

describe('offline → online recovery', () => {
  test('spot-resolver: cache-fallback labels cached while offline, upgrades to live on a fresh fetch', async () => {
    const { classifyFreshness } = await load('spot-resolver.js');

    const offline = classifyFreshness(
      {
        price: 3998.5,
        source: 'cache-fallback',
        updatedAt: new Date(NOW_MS - 45 * MINUTE_MS).toISOString(),
      },
      NOW_MS
    );
    assert.equal(offline.state, 'cached');
    assert.equal(offline.isFallback, true);

    const online = classifyFreshness(
      {
        price: 4001.2,
        source: 'gold_api_com',
        isFresh: true,
        isFallback: false,
        freshnessSeconds: 20,
        maxFreshnessSeconds: 900,
        updatedAt: new Date(NOW_MS - 20_000).toISOString(),
      },
      NOW_MS
    );
    assert.equal(online.state, 'live', 'fresh verified data upgrades the label');
  });

  test('live-status: hasLiveFailure labels cached; clearing it restores live for fresh data only', async () => {
    mock.timers.enable({ apis: ['Date'], now: NOW_MS });
    const { getLiveFreshness } = await load('live-status.js');
    const fresh = new Date(NOW_MS - 60_000).toISOString();
    const old = new Date(NOW_MS - 40 * MINUTE_MS).toISOString();

    assert.equal(getLiveFreshness({ updatedAt: fresh, hasLiveFailure: true }).key, 'cached');
    assert.equal(getLiveFreshness({ updatedAt: fresh, hasLiveFailure: false }).key, 'live');
    // Recovery must not over-upgrade: old data stays delayed even after the failure clears.
    assert.equal(getLiveFreshness({ updatedAt: old, hasLiveFailure: false }).key, 'delayed');
  });

  test('freshness-policy: provider path failure forces fallback/estimated; recovery restores live', async () => {
    const { evaluateFreshnessState } = await load('freshness-policy.js');

    const down = evaluateFreshnessState({ ageMs: 1000, providerPathSuccessful: false });
    assert.equal(down.state, 'fallback');
    const downOld = evaluateFreshnessState({
      ageMs: 10 * MINUTE_MS,
      providerPathSuccessful: false,
    });
    assert.equal(downOld.state, 'estimated');
    const recovered = evaluateFreshnessState({
      ageMs: 1000,
      providerPathSuccessful: true,
      providerHealthy: true,
    });
    assert.equal(recovered.state, 'live');
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 6. Partial data — spot fresh + FX stale degrade independently and honestly
// ───────────────────────────────────────────────────────────────────────────

describe('partial data (gold fresh, FX stale)', () => {
  test('gold and FX freshness are independent signals: fresh gold stays live while 30 h-old FX labels stale', async () => {
    mock.timers.enable({ apis: ['Date'], now: NOW_MS });
    const { getLiveFreshness, getFXFreshness } = await load('live-status.js');

    const goldKey = getLiveFreshness({
      updatedAt: new Date(NOW_MS - 60_000).toISOString(),
    }).key;
    const fxKey = getFXFreshness({
      fxUpdatedAt: new Date(NOW_MS - 30 * HOUR_MS).toISOString(),
    }).key;

    // Locked honest behavior: AED needs no FX rate (fixed 3.6725 peg), so the
    // gold/AED surface may keep its live label; every non-AED conversion
    // surface reads getFXFreshness and must show the stale FX label. A single
    // combined label would either hide the FX staleness (dishonest) or
    // falsely degrade the AED price (inaccurate) — the split is deliberate.
    assert.equal(goldKey, 'live');
    assert.equal(fxKey, 'stale');
  });

  test('the FX label never borrows the gold thresholds: 2 h-old FX is honest live, 2 h-old gold is stale', async () => {
    mock.timers.enable({ apis: ['Date'], now: NOW_MS });
    const { getLiveFreshness, getFXFreshness } = await load('live-status.js');
    const twoHoursAgo = new Date(NOW_MS - 2 * HOUR_MS).toISOString();

    // FX updates daily upstream, so 2 h is fresh there; gold updates hourly,
    // so the same age is past the gold stale window. Same timestamp, two
    // different honest answers — proves the thresholds are not cross-wired.
    assert.equal(getFXFreshness({ fxUpdatedAt: twoHoursAgo }).key, 'live');
    assert.equal(getLiveFreshness({ updatedAt: twoHoursAgo }).key, 'stale');
  });
});

// ───────────────────────────────────────────────────────────────────────────
// 7. UNREACHABILITY — fuzz proof: data older than its live threshold can never
//    label `live` through any engine's public API, whatever the flags say.
// ───────────────────────────────────────────────────────────────────────────

describe('unreachability of dishonest live (fuzz)', () => {
  test(`freshness-policy: ${FUZZ_ITERATIONS} random (age > live budget, flags) combos never yield live`, async () => {
    const { evaluateFreshnessState, isLiveEligible, FRESHNESS_POLICY } =
      await load('freshness-policy.js');
    const rand = mulberry32(FUZZ_SEED);

    for (let i = 0; i < FUZZ_ITERATIONS; i++) {
      const input = {
        // Strictly past the live budget, up to ~30 days old (plus occasional
        // NaN/negative garbage the clamp must also neutralize).
        ageMs:
          i % 10 === 0
            ? pick(rand, [NaN, -1, -HOUR_MS, Infinity])
            : FRESHNESS_POLICY.liveMaxAgeMs + 1 + Math.floor(rand() * 30 * 24 * HOUR_MS),
        providerHealthy: pick(rand, [true, false]),
        providerPathSuccessful: pick(rand, [true, false]),
        marketOpen: pick(rand, [true, false]),
        forcedState: pick(rand, [null, 'cached', 'delayed', 'estimated', 'fallback', 'closed']),
      };
      const result = evaluateFreshnessState(input);
      assert.notEqual(
        result.state,
        'live',
        `iteration ${i} (seed ${FUZZ_SEED}): live leaked for ${JSON.stringify(input)}`
      );
      assert.equal(
        isLiveEligible({
          ...result,
          providerHealthy: input.providerHealthy,
          providerPathSuccessful: input.providerPathSuccessful,
        }),
        false,
        `iteration ${i}: isLiveEligible leaked for ${JSON.stringify(input)}`
      );
    }
  });

  test(`live-status: ${FUZZ_ITERATIONS} random (age > applicable live threshold, flags) combos never yield live`, async () => {
    mock.timers.enable({ apis: ['Date'], now: NOW_MS });
    const { getLiveFreshness, GOLD_MARKET } = await load('live-status.js');
    const { FRESHNESS_POLICY } = await load('freshness-policy.js');
    const rand = mulberry32(FUZZ_SEED + 1);

    for (let i = 0; i < FUZZ_ITERATIONS; i++) {
      const isFresh = pick(rand, [true, false, null]);
      // The live threshold depends on the path: upstream-fresh payloads get the
      // tight 5 s budget, the age-based path gets 30 min. Older than that, no
      // flag combination may produce `live`.
      const liveThresholdMs =
        isFresh === true ? FRESHNESS_POLICY.liveMaxAgeMs : GOLD_MARKET.DELAYED_AFTER_MS;
      const ageMs = liveThresholdMs + 1 + Math.floor(rand() * 30 * 24 * HOUR_MS);
      const input = {
        updatedAt: new Date(NOW_MS - ageMs).toISOString(),
        isFresh,
        isFallback: pick(rand, [true, false, null]),
        hasLiveFailure: pick(rand, [true, false]),
        lang: pick(rand, ['en', 'ar']),
      };
      const result = getLiveFreshness(input);
      assert.notEqual(
        result.key,
        'live',
        `iteration ${i} (seed ${FUZZ_SEED + 1}): live leaked for age ${ageMs}ms ${JSON.stringify(input)}`
      );
    }
  });

  test(`spot-resolver: ${FUZZ_ITERATIONS} random (stale age, frozen-fresh flags) combos never yield live — the frozen-flag hole stays closed`, async () => {
    const { classifyFreshness } = await load('spot-resolver.js');
    const rand = mulberry32(FUZZ_SEED + 2);

    for (let i = 0; i < FUZZ_ITERATIONS; i++) {
      const maxFreshnessSeconds = pick(rand, [300, 900, 3600, null]);
      const budget = maxFreshnessSeconds ?? 900; // classifier default mirrors the pipeline
      const ageSeconds = budget + 1 + Math.floor(rand() * 30 * 24 * 3600);
      const input = {
        price: 3000 + rand() * 2000,
        source: pick(rand, ['gold_api_com', 'twelvedata', 'unknown']),
        // The adversarial part: the FROZEN commit-time metadata always claims
        // perfectly fresh — is_fresh true, tiny freshness_seconds. Only the
        // recomputed timestamp age tells the truth.
        isFresh: pick(rand, [true, null]),
        isFallback: pick(rand, [false, null]),
        freshnessSeconds: Math.floor(rand() * budget),
        maxFreshnessSeconds,
        updatedAt: new Date(NOW_MS - ageSeconds * 1000).toISOString(),
      };
      const result = classifyFreshness(input, NOW_MS);
      assert.notEqual(
        result.state,
        'live',
        `iteration ${i} (seed ${FUZZ_SEED + 2}): live leaked for age ${ageSeconds}s ${JSON.stringify(input)}`
      );
    }
  });

  test('spot-resolver: no timestamp and no flags can substitute for a verifiable fresh age', async () => {
    const { classifyFreshness } = await load('spot-resolver.js');
    const rand = mulberry32(FUZZ_SEED + 3);

    for (let i = 0; i < FUZZ_ITERATIONS; i++) {
      const input = {
        price: 3000 + rand() * 2000,
        isFresh: pick(rand, [true, null]),
        isFallback: pick(rand, [false, null]),
        freshnessSeconds: pick(rand, [0, 1, 20, 899, null]),
        maxFreshnessSeconds: pick(rand, [900, null]),
        // No timestamp at all, garbage, or far-future — all unverifiable.
        updatedAt: pick(rand, [
          null,
          undefined,
          '',
          'not-a-date',
          new Date(NOW_MS + 6 * MINUTE_MS).toISOString(),
          new Date(NOW_MS + 365 * 24 * HOUR_MS).toISOString(),
        ]),
      };
      const result = classifyFreshness(input, NOW_MS);
      assert.notEqual(
        result.state,
        'live',
        `iteration ${i} (seed ${FUZZ_SEED + 3}): live leaked without a verifiable timestamp ${JSON.stringify(input)}`
      );
    }
  });
});
