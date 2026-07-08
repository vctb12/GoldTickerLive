# Phase 7 — Methodology as source of truth + deep links (Track B)

Verifies the methodology page's formulas match the code **exactly** (no math change), and upgrades
the plain methodology CTAs on the tools that still linked to the top of the page into **section deep
links**.

## Formula parity — exact match (no change made)

| Methodology statement                       | Code                                                                           | Match    |
| ------------------------------------------- | ------------------------------------------------------------------------------ | -------- |
| `÷ 31.1035` (troy ounce → gram)             | `CONSTANTS.TROY_OZ_GRAMS = 31.1035` (`price-calculator.js` `usdPerGram`)       | ✅       |
| `× (karat ÷ 24)`                            | `karats.js` purity = literally `22/24`, `21/24`, … (24K = 1.0)                 | ✅ exact |
| `× FX`                                      | `localPrice(usdPrice, fxRate) = usdPrice * fxRate`                             | ✅       |
| AED = fixed **3.6725** peg (never from API) | `CONSTANTS.AED_PEG = 3.6725`; FX AED value stripped and replaced at call sites | ✅       |

Additionally, methodology.html renders a **live** formula (`#method-formula-pipeline` via
`methodology.js`) computed through the same pipeline, so the displayed formula and the live prices
share one code path — parity is guaranteed by construction, not by manual sync. **No pricing
constant or karat factor was touched** (they are owner-gated).

Anchor validity: every methodology anchor the tools link to (`#gold-data`, `#fx-rates`,
`#karat-conversion`, `#not-included`, `#fallback`, `#disclaimer`, `#live-formula`, `#aed-peg`,
`#freshness-states`, `#before-you-shop`) exists as a real section id — no broken deep links.

## Deep-link upgrades (this phase)

Tracker already deep-links to specific methodology sections (the gold-standard pattern). Brought two
more tools up to that standard:

| Tool       | Before                                          | After                                                                            |
| ---------- | ----------------------------------------------- | -------------------------------------------------------------------------------- |
| portfolio  | `methodology.html` "How prices work →"          | `methodology.html#live-formula`                                                  |
| calculator | `methodology.html` "Spot vs retail explained →" | `methodology.html#not-included` (the section on making charges / premiums / VAT) |

## Deferred (collision-avoidance, not skipped)

`compare.html` and `heatmap.html` also have a plain `methodology.html` "How prices work →" link —
but that link sits inside the exact `<p class="*-trust-note">` block **already modified by Phase 5
(PR #542)**. To avoid a merge conflict between the two open PRs, their anchor upgrade to
`#live-formula` is deferred; apply it when #542 merges (one-line `href` change each). Logged here so
it isn't lost.

## Verification

`npm run validate` / `npm test` / `npm run build` green. Links resolve to existing methodology
section ids.
