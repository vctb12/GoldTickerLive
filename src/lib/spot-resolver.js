/**
 * Canonical spot resolver — the SINGLE read point for the gold spot price and
 * every value derived from it. The homepage's redesigned surfaces (nav price
 * pill, hero, karat ladder/dial, inline calculator, market read) all call
 * {@link getCanonicalSpot} so they render ONE value at any instant from the
 * static emergency path. Homepage and Tracker near-realtime updates are owned
 * by the shared browser live-price manager.
 *
 * Committed snapshot data converges here, so every static surface still reads
 * one value and applies the same derivation.
 *
 * Immutable invariants (never re-derived here): AED peg 3.6725, troy ounce
 * 31.1034768 g, karat purity = code/24, spot ≠ retail.
 */
import { CONSTANTS } from '../config/constants.js';
import { KARATS } from '../config/karats.js';
import { fetchGold } from './api.js';
import { getLiveFreshness } from './live-status.js';

// The shared live manager updates its subscribed homepage surfaces; this
// resolver remains the canonical static snapshot reader for other pages.

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

/**
 * Classify a normalized gold response into one freshness state so the whole
 * homepage shows one consistent freshness object. Deliberately conservative:
 * an explicit upstream fallback/`is_fresh:false` always downgrades, never
 * mislabels a stale value as live.
 *
 * @param {object} gold normalized `fetchGold()` result
 * @returns {{ state:'live'|'delayed'|'cached'|'stale'|'fallback'|'unavailable', source:string,
 *            seconds:(number|null), updatedAt:(string|null), isFallback:boolean,
 *            providerFallback:boolean, isFresh:(boolean|null), hasLiveFailure:boolean }}
 */
export function classifyFreshness(gold) {
  if (!gold || !Number.isFinite(Number(gold.price))) {
    return {
      state: 'unavailable',
      source: 'none',
      seconds: null,
      updatedAt: null,
      isFallback: true,
      providerFallback: true,
      isFresh: null,
      hasLiveFailure: true,
    };
  }
  const source = gold.source || 'unknown';
  const updatedAt = gold.updatedAt || null;
  const providerFallback = gold.isFallback === true;
  const hasLiveFailure = source === 'cache-fallback';
  const freshness = getLiveFreshness({
    updatedAt,
    isFallback: providerFallback,
    isFresh: gold.isFresh ?? null,
    hasLiveFailure,
  });

  return {
    state: freshness.key,
    source,
    // Do not replay the producer's frozen freshness_seconds after a static
    // deploy. Canonical age is measured against the current render time.
    seconds: Number.isFinite(freshness.ageMs) ? Math.round(freshness.ageMs / 1000) : null,
    updatedAt,
    isFallback: providerFallback || hasLiveFailure,
    providerFallback,
    isFresh: gold.isFresh ?? null,
    hasLiveFailure,
  };
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
