# See.io-inspired multi-metal tracker synthesis

**Date:** 2026-08-24
**Branch:** `codex/seeio-multimetal-synthesis-2026-08-24`
**Tracker item:** Roadmap 2
**Status:** Complete — safe slice only; production activation remains owner-gated

## Outcome

Upgrade the existing tracker chart in place with the safest production-grade portion of the owner's
See.io synthesis brief. Preserve the gold workspace and all trust surfaces, while adding a single
provider-neutral historical point contract, deterministic quality metadata, a truthful
current-anchor rule, the missing `6M` range, and a feature-gated four-metal chart interaction.

The phase does not activate unsupported non-gold history. In the pilot, a non-gold metal may show
only its validated current reference point and an explicit partial-coverage state until an approved
historical source exists.

## Verified baseline

- Base: `origin/main` at `db66de97b2`.
- Open PRs inspected: #768 and #767 dependency maintenance; #759 calculator/shops freshness; #754
  dependency maintenance. None implements tracker multi-metal history.
- Production tracker: gold-only chart controls (`24H`, `7D`, `30D`, `90D`, `1Y`, `3Y`, `5Y`, `All`)
  with strong freshness/source copy, exports, watchlist, alerts, and monthly/daily layering.
- Reference: compact four-metal and six-range segmented controls, current price, period move, canvas
  tooltip, and a visually focused chart; it also claims to pin history to spot, which will not be
  copied.
- Existing repo foundation: metal registry, purity/fineness, feature flag, spot-feed normalization,
  comparison view models, freshness, SEO, and URL selection are present but not wired to the
  tracker.
- Baseline verification:
  - `npm.cmd run lint`: pass.
  - `npm.cmd run build`: pass.
  - `npm.cmd test`: 1,847 pass, 4 fail, 1 skipped. Existing failures: Windows `python3` unavailable
    (2), network-blocked UAE history audit (1), server traversal expected 404 but received 500 (1).
  - `npm.cmd run validate`: existing stale `reports/seo/inventory.json` check failure.
  - `npm.cmd ci --cache .npm-cache`: npm CLI `Exit handler never called` on two attempts; the
    existing workspace dependency tree was sufficient to run the gates.

## Architecture decision

Use the existing tracker and SVG first-paint chart. Add a pure `metal-series` layer between source
adapters and rendering:

```text
legacy gold history / approved metal source / current quote
                         |
                         v
normalize -> validate -> sort -> deterministic dedupe -> quality flags
                         |
                         v
range filter -> truthful current anchor -> series metadata
                         |
                         v
existing tracker SVG + tooltip + summary + export
```

Gold remains on the existing live manager and historical layers. A separate no-secret gold-api.com
adapter is allowed only for the feature-gated non-gold pilot. It does not alter the gold provider
chain. Production activation remains controlled by `METALS_PILOT_ENABLED`; local review may use an
explicit preview gate.

## Implementation slices

1. Data contract and quality engine
   - immutable normalized point and series metadata;
   - UTC timestamps, positive finite values, monotonic sorting, deterministic dedupe;
   - gap, stale-final-point, partial-coverage, mixed-source, outlier-review flags;
   - current anchors appended only when valid, newer, metal-compatible, and freshness-labelled;
   - no historical shifting or interpolation.
2. Tracker integration
   - add `6M` without breaking legacy range values;
   - add four-metal tab UI behind the pilot gate;
   - update the existing chart readout, accessible name, tooltip, summary, and source note together;
   - gold keeps karats; non-gold pilot readout uses fineness and USD/troy-ounce context;
   - non-gold without history shows a current-only/partial-coverage warning.
3. State and exports
   - validated metal + grade hash state with backward-compatible gold defaults;
   - per-metal in-memory quote cache only; no service-worker change;
   - visible chart CSV carries metal, symbol, resolution, source, provider timestamp, freshness,
     derived/verified flags, and the reference-price disclaimer.
4. Verification and handoff
   - unit/DOM/integration tests;
   - EN/AR and 360 px browser checks;
   - lint, targeted tests, validate, build, and the full suite with baseline failures separated;
   - update tracker, audit, architecture/methodology notes where needed, and owner handoff.

## Protected surfaces avoided

- `.github/workflows/gold-price-fetch.yml`
- `.github/workflows/post_gold.yml`
- `sw.js`
- `src/config/constants.js`
- `src/config/karats.js`
- billing, Supabase/RLS, secrets, dependencies, canonical/sitemap/CNAME

## Owner gates

1. Approve and implement a production history ingestion path for XAG/XPT/XPD before claiming
   multi-range non-gold history.
2. Confirm that gold-api.com's current terms cover production display and retention for platinum and
   palladium; its terms page currently describes gold and silver while its assets page lists all
   four metals.
3. Decide whether the final production pilot flag should be enabled after PR review. This phase
   leaves it off.

## Rollback

Revert the single phase commit/PR. With the pilot flag off, the only visible default change is the
additive `6M` range; gold's provider, formula, cache, and existing ranges remain unchanged.

## Completion evidence

- Implemented the normalized series contract, deterministic de-duplication and quality annotations,
  provider-timestamp current anchor, `6M`, normalized visible-row export, and exact advanced-chart
  synchronization for gold.
- Implemented a localhost-only four-metal preview with EN/AR tab and fineness semantics, source,
  provider time, canonical freshness, and an explicit current-only state for non-gold metals.
- Kept `METALS_PILOT_ENABLED` false. No non-gold historical values are generated, interpolated,
  shifted, or enabled in production.
- Targeted implementation tests: 93 passed. Lint, build, DOM-safety, basic accessibility, and
  `git diff --check` passed. The full suite added no confirmed regression; baseline and environment
  failures are separated in the owner handoff.
- Browser review verified production-default gold behavior, local preview selection, keyboard-ready
  tab semantics, Arabic RTL copy, non-gold current-only disclosure, and gold headline/chart value
  agreement. Exact 360 px viewport emulation was unavailable; responsive stacking and 44 px targets
  are covered structurally and remain a final human visual check.
