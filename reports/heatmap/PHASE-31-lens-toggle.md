# Phase 31 — Heatmap spot/retail lens toggle (Green · optional)

The one genuinely-new heatmap delta (the map itself shipped in Phase 25). Adds a **lens toggle**
that switches the choropleth between the all-in **retail estimate** and the pure **spot value** —
turning the map's core thesis into something the user can see.

## What it does

A segmented toggle above the map ("Colour map by: Retail estimate | Spot value"):

- **Retail lens** (default, unchanged behaviour) — colours each market by its all-in retail estimate
  (USD/g): spot-linked gold value + local VAT + typical making charges. A varied choropleth.
- **Spot lens** (new) — colours by the pure spot-linked gold value (USD/g). Because gold's value per
  gram is **identical worldwide in USD**, every market gets the **same** shade — which is exactly
  the point the page has always made in prose, now shown visually. A caption states it plainly:
  _"Every market shows the same shade: gold's spot-linked value per gram is identical worldwide in
  USD. Switch to the retail lens to see where local VAT and making charges raise the price."_

The legend title, the single-vs-gradient swatch, the caption, the tooltip value, and each region's
`aria-label` all follow the active lens. Default stays **retail** (no change to the first view).

## Implementation

- `STATE.lens` (`'retail'` | `'spot'`), a `renderLens()` toggle (accessible `role="group"` +
  `aria-pressed` buttons, bilingual EN/AR), wired into `render()`.
- `paintMap()` is lens-aware: retail uses the existing equal-interval `computeDomain` buckets; spot
  paints every market with data in one uniform bucket (`SPOT_UNIFORM_BUCKET`, since there is no
  meaningful gradient) and reads `spotUsdPerGram` for the value/aria.
- `renderLegend()` swaps the gradient for a single "identical worldwide" swatch + the lens caption.
- No maths changed — both values come from the already-tested `buildComparisonRows` pipeline; the
  AED peg (3.6725), troy-oz constant, and reference-estimate labelling are untouched.
- `styles/pages/heatmap.css` adds `.heatmap-lens` / `.heatmap-lens-btn` (mirroring the karat toggle)
  - `.heatmap-lens-note`.

## Verification

Headless render of the built page, with FX injected so the map colours:

| Lens     | Bucket distribution                     | Interpretation                               |
| -------- | --------------------------------------- | -------------------------------------------- |
| Retail   | b0×4, b1×3, b2×2, b3×4, b4×3 (+ nodata) | Varied — VAT/making differences              |
| **Spot** | **all 28 markets in one bucket (b3)**   | **Uniform — gold value identical worldwide** |

Also confirmed: toggle buttons render with correct `aria-pressed` states; the legend title switches
between "All-in retail estimate (USD per gram)" and "Spot-linked gold value (USD per gram)"; the
lens caption renders. (The spot lens also lights up markets the retail lens leaves grey — spot USD
value needs no FX, so all 28 tracked markets show.)

## Gate

`npm run build` + `npm run validate` + `npm test` (1286 pass) + `npm run lint` +
`scripts/qa/parity-diff-scan.mjs` — all green.
