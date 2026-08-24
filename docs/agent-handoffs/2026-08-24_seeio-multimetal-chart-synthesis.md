# Owner handoff — See.io-inspired multi-metal chart synthesis

**Date:** 2026-08-24
**Branch:** `codex/seeio-multimetal-synthesis-2026-08-24`
**Base:** `origin/main` at `db66de97b2`
**PR:** [#770](https://github.com/vctb12/GoldTickerLive/pull/770) (draft)
**Status:** implementation complete; production non-gold activation remains off

## What shipped

- A provider-neutral metal-series contract with UTC normalization, validation, stable sorting,
  deterministic timestamp de-duplication, gap/outlier/staleness annotations, coverage metadata, and
  explicit resolution/source/freshness fields.
- A truthful current-anchor rule: a quote is appended only when valid, newer, metal-compatible, and
  freshness-labelled. Historical values are never shifted to meet spot.
- One normalized visible-row path for the SVG chart, advanced gold chart, tooltip, summary, and CSV
  export. The advanced chart now agrees with the current headline instead of retaining a stale
  independent series.
- The missing `6M` range, mapped to 183 days without removing legacy aliases.
- An isolated Gold-API.com current-quote adapter for XAG/XPT/XPD, outside the production gold
  provider chain.
- A dynamically loaded EN/AR precious-metal workspace with Gold/Silver/Platinum/Palladium tabs,
  roving arrow/Home/End keyboard behavior, gold karats, non-gold fineness choices, provider,
  freshness/closed state, provider time, and a current-only coverage warning.
- Metal-aware, provenance-rich visible-chart CSV output and additive preview URL state.

## Product and safety boundary

`METALS_PILOT_ENABLED` remains `false`. The preview is available only on localhost with
`?metals=preview`; that query cannot enable it on `goldtickerlive.com`. With the gate off, crafted
`metal`/`grade` hash parameters are ignored and canonicalized away, so production remains gold-only.

No XAG/XPT/XPD history is bundled, fabricated, interpolated, proxied, or persisted. No production
workflow, gold provider priority, pricing/karat/FX formula, constant, service worker, dependency,
secret, billing, Supabase/RLS, canonical, sitemap, merge, or deployment surface changed.

## Browser evidence

- Default URL: pilot stayed hidden, a forced non-gold hash was removed, and the gold accessible
  chart name remained gold-specific.
- Local preview: Silver selected with a canonical `metal=silver&grade=999` hash; switching grade
  offered `.999`, `.925`, and `.900` fineness rather than karats.
- Non-gold state: showed the validated XAG/USD current quote, Gold-API.com source, canonical
  freshness, provider time, and `Current reference quote only · historical coverage unavailable`.
- Arabic: `dir=rtl`, Arabic metal/grade/source/freshness/coverage copy, and the current-only chart
  text all updated together.
- Gold advanced chart: current headline and latest chart point both displayed the same provider
  value after synchronization.
- Exact 360 px viewport emulation was unavailable in the browser harness. The CSS stacks the readout
  at the narrow breakpoint, keeps segmented controls scrollable, and supplies 44 px tab targets;
  final human 360 px EN/AR visual review is still recommended before any flag decision.

## Verification

| Check                         | Result                             | Notes                                                                                                                                                                            |
| ----------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Targeted implementation tests | pass — 93/93                       | Series, provider, export, flags, tracker chart/DOM/hash and related contracts                                                                                                    |
| `npm.cmd run lint`            | pass                               | ESLint after final formatting                                                                                                                                                    |
| `npm.cmd run build`           | pass                               | 318 modules; gated controller remains a separate dynamic chunk                                                                                                                   |
| Unsafe-DOM audit              | pass                               | No new unsafe HTML sink                                                                                                                                                          |
| Basic accessibility audit     | pass                               | Static contract checks pass                                                                                                                                                      |
| `git diff --check`            | pass                               | No whitespace errors                                                                                                                                                             |
| Full `npm.cmd test`           | baseline/environment failures only | 1,865 pass, 5 fail, 1 skip; four failures reproduce the baseline, and one concurrent Windows `EPERM` shop-manager failure passed 19/19 in isolation after the dev server stopped |
| `npm.cmd run validate`        | baseline failure                   | Stops on 22 pre-existing out-of-date theme-preinit pages after generated churn was restored                                                                                      |
| Stylelint                     | environment-blocked                | Partial dependency tree lacks `stylelint-config-standard`; `npm ci --cache .npm-cache` failed twice with npm's `Exit handler never called`                                       |

The four reproducible baseline test failures are two missing-`python3` cases, one network-blocked
UAE history audit, and the server traversal assertion expecting 404 while receiving 500. No
generated report/page churn is included to disguise those baseline conditions.

## Findings and decisions

| Severity | File or page                                   | Issue                                                                                                          | Impact                                                | Exact fix                                                                                         | Repeat pattern                      |
| -------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ----------------------------------- |
| block    | Production XAG/XPT/XPD history                 | No approved historical source, retention, or redistribution contract exists.                                   | Fabricated/proxy data would undermine price trust.    | Owner selects and approves an ingestion/source contract before any history or production flag-on. | Prior metals-feed owner gate.       |
| high     | Gold-API.com platinum/palladium production use | Assets list all four metals, while terms text expressly discusses gold and silver.                             | Terms ambiguity for production PGM display/retention. | Confirm PGM use/attribution in writing or select another source before activation.                | Provider/licensing gate.            |
| high     | `src/tracker/chart.js`                         | The former render-time synthetic row and independently loaded advanced series could diverge from the headline. | Freshness and pricing trust.                          | Completed: provider-time anchor plus one normalized visible series for both charts/export.        | Existing freshness-honesty pattern. |
| medium   | 360 px EN/AR review                            | Exact narrow viewport was not available in the current browser harness.                                        | Possible small-screen layout edge case.               | Human-check 360 px in EN and AR before enabling the pilot; keep flag off until accepted.          | Existing mobile/RTL audit pattern.  |
| low      | Advanced non-gold chart controls               | Current-only non-gold has no meaningful zoom/crosshair history.                                                | Power-user convenience only.                          | Defer until approved history exists; do not invent data to fill the interaction.                  | None.                               |

## Owner decisions required

1. Choose and approve a production XAG/XPT/XPD historical source and ingestion/retention design.
2. Confirm platinum/palladium production terms for Gold-API.com or approve a replacement provider.
3. Review the pilot interaction and 360 px EN/AR layout before deciding whether to turn on the
   production flag.

Provider research: [documentation](https://gold-api.com/docs),
[asset list](https://gold-api.com/assets/), [pricing](https://gold-api.com/pricing), and
[terms](https://gold-api.com/terms).

## Rollback

Revert this PR. Because the pilot flag is off, the only production-default UI addition is `6M`; the
existing gold feed, formulas, cache, history layers, and protected surfaces remain intact.
