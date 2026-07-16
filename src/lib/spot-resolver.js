/**
 * Canonical spot resolver — the SINGLE derivation point for the committed gold
 * spot baseline and every value derived from it (F-1 fix). The homepage's
 * static surfaces (nav price pill, hero, karat ladder/dial, inline calculator,
 * market read) call {@link getCanonicalSpot} so they render ONE value at any
 * instant — the same committed source the calculator uses
 * (`/data/gold_price.json` via {@link fetchGold}).
 *
 * Reality of the live lane (documented, not a contradiction of F-1's intent):
 * the home page and tracker ADDITIONALLY run a realtime pricing engine
 * (`realtime-pricing-engine.js`, wired in `home.js` / `tracker-pro.js`) whose
 * provider chain performs direct browser fetches of third-party quotes —
 * api.gold-api.com (primary live), failing over to mintedmetal.com, then the
 * committed `gold_price.json`, then `last_gold_price.json`, with a
 * localStorage snapshot as the always-labelled-fallback secondary (see
 * `quote-providers/create-providers.js`). That engine layers live quotes ON
 * TOP of this resolver's committed baseline and carries its own freshness
 * labelling (`freshness-policy.js`); this resolver remains the canonical
 * committed-JSON baseline for every surface that does not run the engine.
 *
 * Immutable invariants (never re-derived here): AED peg 3.6725, troy ounce
 * 31.1035 g, karat purity = code/24, spot ≠ retail.
 */
import { CONSTANTS } from '../config/constants.js';
import { KARATS } from '../config/karats.js';
import { fetchGold } from './api.js';

const { AED_PEG, TROY_OZ_GRAMS } = CONSTANTS;

/**
 * Pure derivation of all per-gram karat prices from a spot USD/oz value.
 * Deterministic and side-effect free — the unit-testable core of the resolver.
 *
 * @param {number} spotUsdPerOz XAU/USD per troy ounce
 * @returns {null | {
 *   spotUsdPerOz:number, usdPerGram24k:number, aedPerGram24k:number,
 *   karats: Array<{ code:string, purity:number, usdPerGram:number, aedPerGram:number }>
 * }}
 */
export function deriveFromSpot(spotUsdPerOz) {
  const spot = Number(spotUsdPerOz);
  if (!Number.isFinite(spot) || spot <= 0) return null;

  const usdPerGram24k = spot / TROY_OZ_GRAMS;
  const aedPerGram24k = usdPerGram24k * AED_PEG;

  const karats = KARATS.map((k) => ({
    code: k.code,
    purity: k.purity, // code/24 — never re-derived
    usdPerGram: usdPerGram24k * k.purity,
    aedPerGram: aedPerGram24k * k.purity,
  }));

  return { spotUsdPerOz: spot, usdPerGram24k, aedPerGram24k, karats };
}

/**
 * Look up a single karat's per-gram price from a derived snapshot.
 * @param {ReturnType<typeof deriveFromSpot>} derived
 * @param {string|number} karatCode
 * @param {'aed'|'usd'} [currency]
 * @returns {number|null}
 */
export function karatPerGram(derived, karatCode, currency = 'aed') {
  if (!derived) return null;
  const row = derived.karats.find((k) => k.code === String(karatCode));
  if (!row) return null;
  return currency === 'usd' ? row.usdPerGram : row.aedPerGram;
}

// Pipeline default freshness budget (mirrors `max_freshness_seconds` written by
// scripts/python/fetch_gold_price.py). Used only when a payload omits its own
// `maxFreshnessSeconds` — never loosened at runtime.
const DEFAULT_MAX_FRESHNESS_SECONDS = 900;

// Tolerated forward clock skew between the pipeline/provider clock and the
// visitor's device. A payload timestamp further in the future than this is
// unverifiable (a wildly wrong clock could otherwise pin age at 0 and label
// stale data "live" forever), so classification degrades instead.
const CLOCK_SKEW_TOLERANCE_MS = 5 * 60 * 1000;

/**
 * Classify a normalized gold response into one freshness state so the whole
 * homepage shows one consistent freshness object. Deliberately conservative:
 * an explicit upstream fallback/`is_fresh:false` always downgrades, never
 * mislabels a stale value as live.
 *
 * AGE-AWARE (Midas phase 7 frozen-flag fix): the committed
 * `data/gold_price.json` carries `freshness_seconds` stamped at pipeline
 * write time. That number never ages client-side, so comparing it alone
 * against `max_freshness_seconds` would classify the committed file as
 * `live` forever. This classifier therefore recomputes the effective age
 * from the payload timestamp (`timestamp_utc` / `fetched_at_utc`, normalized
 * to `updatedAt`) against `now`, and takes the WORSE of (recomputed age,
 * frozen commit-time age). `live` is only reachable when a verifiable
 * timestamp proves the data is within the freshness budget:
 *   - no parseable timestamp        → never `live` (frozen flag alone is not
 *                                     proof of freshness; degrade to
 *                                     `delayed`/`cached` by frozen tier)
 *   - timestamp in the far future   → treated as unverifiable (clock-skew
 *                                     guard; small skew clamps to age 0)
 *   - effective age ≤ budget        → `live`
 *   - effective age ≤ 2 × budget    → `delayed`
 *   - older                         → `cached`
 *
 * @param {object} gold normalized `fetchGold()` result
 * @param {number} [now] reference epoch ms (injectable for tests; default `Date.now()`)
 * @returns {{ state:'live'|'delayed'|'cached'|'fallback'|'unavailable', source:string,
 *            seconds:(number|null), updatedAt:(string|null), isFallback:boolean,
 *            upstreamFresh:(boolean|null), ageSeconds:(number|null) }}
 *   `seconds` is the effective (age-aware) freshness age; `ageSeconds` is the
 *   recomputed timestamp age alone (null when unverifiable); `upstreamFresh`
 *   is the raw pipeline `is_fresh` tri-state (true/false/null) so consumers
 *   bridging into `getLiveFreshness({ isFresh })` can pass upstream truth
 *   instead of conflating it with this age-dependent classification.
 */
export function classifyFreshness(gold, now = Date.now()) {
  if (!gold || !Number.isFinite(Number(gold.price))) {
    return {
      state: 'unavailable',
      source: 'none',
      seconds: null,
      updatedAt: null,
      isFallback: true,
      upstreamFresh: null,
      ageSeconds: null,
    };
  }
  const source = gold.source || 'unknown';
  const frozenSeconds = Number.isFinite(gold.freshnessSeconds) ? gold.freshnessSeconds : null;
  const maxSeconds = Number.isFinite(gold.maxFreshnessSeconds) ? gold.maxFreshnessSeconds : null;
  const updatedAt = gold.updatedAt || null;
  const isFallback = gold.isFallback === true || source === 'cache-fallback';
  const upstreamFresh = gold.isFresh === true ? true : gold.isFresh === false ? false : null;

  // Recompute the age from the payload timestamp — never trust the frozen
  // commit-time freshness_seconds alone. Small forward skew clamps to 0;
  // far-future timestamps are unverifiable (null) and can never be `live`.
  let ageSeconds = null;
  if (updatedAt != null) {
    const timestampMs = new Date(updatedAt).getTime();
    if (Number.isFinite(timestampMs) && now - timestampMs >= -CLOCK_SKEW_TOLERANCE_MS) {
      ageSeconds = Math.max(0, now - timestampMs) / 1000;
    }
  }
  const seconds = ageSeconds != null ? Math.max(ageSeconds, frozenSeconds ?? 0) : frozenSeconds;
  const budgetSeconds = maxSeconds != null ? maxSeconds : DEFAULT_MAX_FRESHNESS_SECONDS;

  let state;
  if (isFallback) {
    state = source === 'cache-fallback' ? 'cached' : 'fallback';
  } else if (gold.isFresh === false) {
    state = 'delayed';
  } else if (ageSeconds == null) {
    // No verifiable timestamp: the frozen flag/seconds alone must never grant
    // `live`. Tier by the frozen age when present, otherwise degrade one notch.
    state = seconds != null && seconds > budgetSeconds * 2 ? 'cached' : 'delayed';
  } else if (seconds <= budgetSeconds) {
    state = 'live';
  } else if (seconds <= budgetSeconds * 2) {
    state = 'delayed';
  } else {
    state = 'cached';
  }
  return { state, source, seconds, updatedAt, isFallback, upstreamFresh, ageSeconds };
}

/**
 * Build the full canonical snapshot every homepage surface reads.
 * @param {object} gold normalized `fetchGold()` result
 */
export function buildSnapshot(gold) {
  const derived = deriveFromSpot(gold?.price);
  if (!derived) {
    return {
      ok: false,
      freshness: classifyFreshness(gold),
      spotUsdPerOz: null,
      usdPerGram24k: null,
      aedPerGram24k: null,
      karats: [],
      raw: gold?.raw ?? null,
    };
  }
  return {
    ok: true,
    ...derived,
    freshness: classifyFreshness(gold),
    raw: gold?.raw ?? null,
  };
}

// ── Single-flight memoization ──────────────────────────────────────────────
// Concurrent callers (nav pill, hero, ladder, calculator) share ONE in-flight
// fetch + one snapshot so they cannot diverge within a render.
let _inflight = null;
let _snapshot = null;

/**
 * Resolve the canonical spot snapshot. Shares a single fetch across concurrent
 * callers; pass `{ force: true }` to bypass the in-flight/cached snapshot (e.g.
 * a periodic refresh).
 *
 * @param {{ signal?: AbortSignal, force?: boolean }} [opts]
 * @returns {Promise<ReturnType<typeof buildSnapshot>>}
 */
export async function getCanonicalSpot({ signal, force = false } = {}) {
  if (!force && _snapshot) return _snapshot;
  if (!force && _inflight) return _inflight;

  _inflight = (async () => {
    const gold = await fetchGold({ signal });
    _snapshot = buildSnapshot(gold);
    return _snapshot;
  })();

  try {
    return await _inflight;
  } finally {
    _inflight = null;
  }
}

/** Most recent resolved snapshot (or null). Synchronous read for late subscribers. */
export function getCachedSnapshot() {
  return _snapshot;
}

/** Testing/refresh hook — clears the memoized snapshot + in-flight promise. */
export function resetCanonicalSpot() {
  _inflight = null;
  _snapshot = null;
}
