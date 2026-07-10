/**
 * lib/metal-feed-adapter.js — multi-metal spot-feed ingestion adapter (Phase 57, Theme B).
 *
 * Phase 56's `buildMetalComparison` needs a `spotByMetal` map. This adapter produces it by reading
 * per-metal price feeds in the **same shape** the gold feed already uses (`data/gold_price.json`,
 * normalized by `api.js`): an optional `{ ok, data }` envelope wrapping `<symbol>UsdPerOz` (e.g.
 * `xauUsdPerOz`, `xagUsdPerOz`) plus timestamp / source metadata. It generalizes that normalization
 * to silver / platinum / palladium so, the moment the owner publishes `data/<metal>_price.json`, each
 * metal flows through with zero code change.
 *
 * Pure and side-effect-free — it does NOT fetch (callers load the JSON); it only normalizes already-
 * read feed objects. It never fabricates a price: a missing, malformed, or non-positive feed yields
 * `spotUsdPerOz: null` / `state: 'pending-data'`. Peg / troy-oz / framing are untouched.
 */

import { getMetal, metalKeys } from '../config/metals.js';

/** Unwrap the `{ ok: true, data: {...} }` API envelope if present, else return the object as-is. */
function unwrapEnvelope(data) {
  return data?.ok === true && data?.data && typeof data.data === 'object' ? data.data : data;
}

/** First finite, positive number among the candidates, else null. */
function firstFinitePositive(...values) {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

/** Conventional static feed path for a metal (gold's is the existing `/data/gold_price.json`). */
export function metalDataUrl(metalKey) {
  return `/data/${getMetal(metalKey).key}_price.json`;
}

/**
 * Normalize one already-read metal feed object into a spot reading. Mirrors the gold feed shape,
 * generalized by the metal's spot symbol (XAU→xau, XAG→xag, …).
 *
 * @param {string} metalKey
 * @param {object|null} rawData  The parsed feed JSON (already fetched by the caller).
 * @returns {{ metalKey: string, spotUsdPerOz: number|null, updatedAt: string|null, source: string|null, state: 'ok'|'pending-data' }}
 */
export function normalizeMetalFeed(metalKey, rawData) {
  const metal = getMetal(metalKey);
  const sym = metal.symbol.toLowerCase(); // xau | xag | xpt | xpd
  const payload = unwrapEnvelope(rawData);
  const obj = payload && typeof payload === 'object' ? payload : {};

  const spotUsdPerOz = firstFinitePositive(
    obj[`${sym}UsdPerOz`],
    obj[`${sym}_usd_per_oz`],
    obj.spotUsdPerOz,
    obj.usdPerOz,
    obj.price,
    obj?.[metal.key]?.ounce_usd // legacy gold shape, generalized
  );

  const updatedAt =
    obj.timestampUtc || obj.timestamp_utc || obj.fetchedAtUtc || obj.fetched_at_utc || null;
  const source = obj.provider || obj.source_provider || obj.source || null;

  return {
    metalKey: metal.key,
    spotUsdPerOz,
    updatedAt,
    source,
    state: spotUsdPerOz == null ? 'pending-data' : 'ok',
  };
}

/**
 * Build the `spotByMetal` map for `buildMetalComparison` from a map of already-read feeds. Metals
 * with no feed — or a malformed one — are omitted, so the comparison shows them as pending-data
 * rather than a fabricated price.
 *
 * @param {Record<string, object|null>} feedsByMetal  metalKey → parsed feed JSON.
 * @returns {Record<string, number>}
 */
export function buildSpotByMetal(feedsByMetal = {}) {
  const spotByMetal = {};
  for (const key of metalKeys()) {
    if (!feedsByMetal || !(key in feedsByMetal)) continue;
    const norm = normalizeMetalFeed(key, feedsByMetal[key]);
    if (norm.spotUsdPerOz != null) spotByMetal[key] = norm.spotUsdPerOz;
  }
  return spotByMetal;
}
