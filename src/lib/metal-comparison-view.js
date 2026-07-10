/**
 * lib/metal-comparison-view.js — end-to-end multi-metal comparison orchestrator (Phase 66, Theme B).
 *
 * Phases 56–61 shipped the four building blocks as separate, independently-tested modules:
 *   • Phase 57 `metal-feed-adapter`    — parsed feeds → spot map (`buildSpotByMetal`)
 *   • Phase 56 `metal-comparison`      — spot map → honest per-metal rows (`buildMetalComparison`)
 *   • Phase 58 `metal-freshness`       — feed timestamps → per-metal freshness (`buildMetalFreshness`)
 *   • Phase 60 `metal-comparison-render` — rows + freshness → escaped HTML (`renderMetalComparisonTableHtml`)
 *
 * Until all four were on `main` there was no place to wire them together and prove the seam. This
 * module is that single composition: one call takes the raw per-metal feed objects and returns the
 * finished view-model — spot map, comparison rows, per-metal + overall freshness, and the ready-to-
 * mount HTML — with every step flowing through the existing public APIs (no re-implementation, one
 * source of truth per concern).
 *
 * Pure and side-effect-free — it does NOT fetch (callers load the JSON) and mounts nothing. It stays
 * dormant behind `METALS_PILOT_ENABLED` (default OFF): with the pilot off, `renderMetalComparisonTableHtml`
 * returns '' so `html` is empty and nothing renders. It never fabricates a non-gold price — a missing
 * or malformed feed degrades to `pending-data`, never a number. Gold flows through the same
 * `resolveMetalGramPrice` path as the live site; peg (3.6725), troy-oz (31.1035), and the
 * reference-estimate framing are untouched.
 */

import { metalKeys } from '../config/metals.js';
import { METALS_PILOT_ENABLED } from '../config/metals-flags.js';
import { buildSpotByMetal, normalizeMetalFeed } from './metal-feed-adapter.js';
import { buildMetalComparison } from './metal-comparison.js';
import { buildMetalFreshness, overallMetalFreshness } from './metal-freshness.js';
import { renderMetalComparisonTableHtml } from './metal-comparison-render.js';

function pickLang(lang) {
  return lang === 'ar' ? 'ar' : 'en';
}

/**
 * Per-metal freshness metadata (`{ updatedAt }`) for every metal that has a usable feed. Derived from
 * the SAME `normalizeMetalFeed` the spot map uses, so the freshness timestamp and the priced spot can
 * never disagree about which feed they came from. Metals without a valid spot are omitted, mirroring
 * `buildSpotByMetal` — so a `pending-data` row carries no freshness (the render shows '—').
 *
 * @param {Record<string, object|null>} feedsByMetal
 * @returns {Record<string, { updatedAt: string|number|null }>}
 */
function buildFeedMetaByMetal(feedsByMetal = {}) {
  const meta = {};
  for (const key of metalKeys()) {
    if (!feedsByMetal || !(key in feedsByMetal)) continue;
    const norm = normalizeMetalFeed(key, feedsByMetal[key]);
    if (norm.spotUsdPerOz != null) meta[key] = { updatedAt: norm.updatedAt };
  }
  return meta;
}

/**
 * Build the complete multi-metal comparison view-model from raw per-metal feed objects.
 *
 * @param {Record<string, object|null>} feedsByMetal  metalKey → parsed feed JSON (already fetched).
 * @param {object} [options]
 * @param {number} [options.observedAtMs]   When the feeds were read (epoch ms) — required for freshness;
 *                                          omit and freshness is left empty (render shows '—').
 * @param {'en'|'ar'} [options.lang]
 * @param {boolean} [options.pilotEnabled]  Override the pilot flag (defaults to METALS_PILOT_ENABLED, OFF).
 * @param {boolean} [options.marketOpen]
 * @param {Record<string,string>} [options.purityByMetal]  Grade code per metal (defaults to each metal's default).
 * @param {object} [options.policy]         Freshness budgets (defaults to the canonical policy).
 * @returns {{
 *   pilotEnabled: boolean,
 *   rows: object[],
 *   disclaimer: string,
 *   spotByMetal: Record<string, number>,
 *   freshnessByMetal: Record<string, { state: string, ageMs: number, reason: string }>,
 *   overallFreshness: string,
 *   html: string
 * }}
 */
export function buildMetalComparisonView(feedsByMetal = {}, options = {}) {
  const pilotEnabled = options.pilotEnabled ?? METALS_PILOT_ENABLED;
  const lang = pickLang(options.lang);
  const marketOpen = options.marketOpen ?? true;
  const observedAtMs = Number(options.observedAtMs);
  const hasObserved = Number.isFinite(observedAtMs) && observedAtMs > 0;

  // 1. Raw feeds → spot map (only metals with a finite, positive feed).
  const spotByMetal = buildSpotByMetal(feedsByMetal);

  // 2. Raw feeds → freshness metadata (updatedAt per priced metal), from the same normalizer.
  const feedMetaByMetal = buildFeedMetaByMetal(feedsByMetal);

  // 3. Spot map → honest per-metal comparison rows (gold always priced; others gated + pending-data).
  const model = buildMetalComparison(spotByMetal, {
    pilotEnabled,
    lang,
    purityByMetal: options.purityByMetal,
  });

  // 4. Feed timestamps → per-metal freshness via the canonical policy (only when we know when we read).
  const freshnessByMetal = hasObserved
    ? buildMetalFreshness(feedMetaByMetal, {
        observedAtMs,
        marketOpen,
        ...(options.policy ? { policy: options.policy } : {}),
      })
    : {};
  const overallFreshness = overallMetalFreshness(freshnessByMetal);

  // 5. Rows + freshness → escaped HTML. Returns '' while the pilot is off (nothing mounts).
  const html = renderMetalComparisonTableHtml(model, { lang, freshnessByMetal });

  return {
    pilotEnabled: model.pilotEnabled,
    rows: model.rows,
    disclaimer: model.disclaimer,
    spotByMetal,
    freshnessByMetal,
    overallFreshness,
    html,
  };
}

/** Whether the composed comparison view should mount (owner-gated; default OFF via the pilot flag). */
export function isMetalComparisonViewEnabled(opts = {}) {
  return (opts.pilotEnabled ?? METALS_PILOT_ENABLED) === true;
}
