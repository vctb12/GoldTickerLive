/**
 * config/growth-experiments.js
 *
 * Client-side, $0 registry of **additive growth experiments** — all OFF by default.
 *
 * This is deliberately separate from the Supabase-backed feature flags in `src/lib/site-settings.js`
 * (which the owner controls via the admin panel). Those toggle owner-gated product features;
 * *these* are purely client-side, no-cost growth ideas that a future phase can build behind the flag
 * and enable without any backend, account, or recurring cost.
 *
 * Rules for anything added here:
 *   1. Default MUST be `false` — nothing here changes the live site until deliberately enabled. The
 *      `growth-experiments.test.js` guard fails the build if any default flips to `true`.
 *   2. $0 only — no newsletter automation, no WhatsApp Business API, no payments, no new recurring
 *      cost. Local/client-side behaviour only (localStorage, Web Share, DOM nudges).
 *   3. Every price/trust surface stays honest — a growth nudge may never overstate data or imply
 *      endorsement.
 *
 * Enabling for local testing only: append `?growth=<key>` (or a comma list) to the URL. This never
 * persists and is ignored unless the key exists below, so it can't accidentally ship anything on.
 */

/**
 * @typedef {Object} GrowthExperiment
 * @property {boolean} enabled      Live default — MUST be false.
 * @property {string}  summary      One line: what shipping it would add.
 * @property {string}  rationale    Why it's a $0-safe growth lever.
 * @property {string}  readiness    What building it would touch when enabled.
 */

/** @type {Record<string, GrowthExperiment>} */
export const GROWTH_EXPERIMENTS = {
  shareNudge: {
    enabled: false,
    summary: 'Dismissible "share this tool" prompt on the calculator/tracker result surfaces.',
    rationale:
      'Word-of-mouth is the only $0 acquisition channel available; reuses the existing native Web Share path (Phase 23), no dependency.',
    readiness:
      'Add a gated, dismissible prompt near the result actions; persists dismissal in localStorage.',
  },
  relatedToolsRail: {
    enabled: false,
    summary: 'Cross-tool recommendation rail ("people comparing prices also use the calculator").',
    rationale:
      'Increases session depth across the free tools with purely internal links — no data, no cost.',
    readiness: 'Render a gated rail from a static internal-links map already present in the shell.',
  },
  priceMoveBadge: {
    enabled: false,
    summary: 'A subtle "▲ x% today" badge on landing surfaces to pull returning visitors back.',
    rationale:
      'Uses data already computed for the tracker (session move vs. baseline); retention lever at $0.',
    readiness:
      'Reuse the freshness/move engine; must carry the same reference-estimate labelling as every price surface.',
  },
  saveComparisonLink: {
    enabled: false,
    summary: 'One-tap "save this comparison" that copies the URL-state deep link with a toast.',
    rationale:
      'Encourages return visits and sharing of a specific comparison; the deep-link state already exists.',
    readiness:
      'Gated button on compare/calculator; reuses existing URL-state serialisation + copy toast.',
  },
};

/** Keys that may be force-enabled via `?growth=` for local testing (all of them). */
const OVERRIDABLE = new Set(Object.keys(GROWTH_EXPERIMENTS));

function urlOverrides() {
  try {
    if (typeof location === 'undefined' || !location.search) return new Set();
    const raw = new URLSearchParams(location.search).get('growth');
    if (!raw) return new Set();
    return new Set(
      raw
        .split(',')
        .map((s) => s.trim())
        .filter((s) => OVERRIDABLE.has(s))
    );
  } catch {
    return new Set();
  }
}

/**
 * Is a growth experiment active for this page load? Live default is always the registry's `enabled`
 * (false for everything today); a `?growth=<key>` URL param can force it on for local testing only.
 * @param {string} key
 * @returns {boolean}
 */
export function isGrowthExperimentEnabled(key) {
  const exp = GROWTH_EXPERIMENTS[key];
  if (!exp) return false;
  if (exp.enabled) return true;
  return urlOverrides().has(key);
}

/** All registry keys (for tooling/tests). */
export function growthExperimentKeys() {
  return Object.keys(GROWTH_EXPERIMENTS);
}
