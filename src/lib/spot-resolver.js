/**
 * Canonical spot resolver — the SINGLE read point for the gold spot price and
 * every value derived from it (F-1 fix). The homepage's redesigned surfaces
 * (nav price pill, hero, karat ladder/dial, inline calculator, market read) all
 * call {@link getCanonicalSpot} so they render ONE value at any instant — the
 * same committed source the calculator uses (`/data/gold_price.json` via
 * {@link fetchGold}). No surface performs its own live third-party fetch.
 *
 * Design decision (owner-approved, F-1 bundling): the canonical source is the
 * hourly-committed data file — identical to the calculator — not a divergent
 * client-side live API. If a live path is added later it must feed THIS resolver
 * so every surface still reads one value.
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

/**
 * Classify a normalized gold response into one freshness state so the whole
 * homepage shows one consistent freshness object. Deliberately conservative:
 * an explicit upstream fallback/`is_fresh:false` always downgrades, never
 * mislabels a stale value as live.
 *
 * @param {object} gold normalized `fetchGold()` result
 * @returns {{ state:'live'|'delayed'|'cached'|'fallback'|'unavailable', source:string,
 *            seconds:(number|null), updatedAt:(string|null), isFallback:boolean }}
 */
export function classifyFreshness(gold) {
  if (!gold || !Number.isFinite(Number(gold.price))) {
    return {
      state: 'unavailable',
      source: 'none',
      seconds: null,
      updatedAt: null,
      isFallback: true,
    };
  }
  const source = gold.source || 'unknown';
  const seconds = Number.isFinite(gold.freshnessSeconds) ? gold.freshnessSeconds : null;
  const maxSeconds = Number.isFinite(gold.maxFreshnessSeconds) ? gold.maxFreshnessSeconds : null;
  const updatedAt = gold.updatedAt || null;
  const isFallback = gold.isFallback === true || source === 'cache-fallback';

  let state;
  if (isFallback) {
    state = source === 'cache-fallback' ? 'cached' : 'fallback';
  } else if (gold.isFresh === false) {
    state = 'delayed';
  } else if (seconds != null && maxSeconds != null) {
    if (seconds <= maxSeconds) state = 'live';
    else if (seconds <= maxSeconds * 2) state = 'delayed';
    else state = 'cached';
  } else {
    state = 'live';
  }
  return { state, source, seconds, updatedAt, isFallback };
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
