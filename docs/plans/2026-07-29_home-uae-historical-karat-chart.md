# Plan: UAE Historical Karat Chart (Homepage)

**Date:** 2026-07-29  
**Branch:** `cursor/home-uae-historical-karat-chart-6a31`  
**Status:** Implementation complete — release blocked pending data freshness, provenance, full QA and visual verification

## Scope

Replace the homepage `home-chart-section` (single-series USD/oz GoldChart + market-insight panel) with a dedicated **UAE Historical Gold Rate Chart (AED/g)** showing four karat series with 1M/3M/6M/12M ranges and line/area modes.

## Architecture

| Layer | File | Role |
|-------|------|------|
| Data | `src/lib/uae-historical-karat-data.js` | Pure transforms from `getUnifiedHistory()` → AED/gram per karat |
| Component | `src/components/UaeHistoricalKaratChart.js` | Multi-series lightweight-charts, controls, table, export |
| Page | `src/pages/home.js` | Lazy IntersectionObserver mount |
| Markup | `index.html` | Refactored `home-chart-section` |
| Styles | `styles/pages/home-redesign.css` | `.uae-hist-chart*` tokens |
| i18n | `translations.en.js` / `translations.ar.js` | `home.uaeHist*` keys |

Tracker chart (`src/tracker/chart.js`, `GoldChart` on tracker) is **unchanged**.

## Data provenance decision (ADR)

| Field | Value |
|-------|-------|
| **Chosen source** | Existing unified history: embedded monthly baseline (provenance unverified) + freegoldapi reference + local snapshots |
| **Source URL** | Embedded `src/data/historical-baseline.json`; optional `https://freegoldapi.com/data/latest.json` |
| **License** | Baseline upstream not documented in git — **not verified LBMA/public domain**; freegoldapi community dataset (derived, stale as of 2026-07-29 audit) |
| **Coverage** | Monthly 2019-01 → 2025-08 baseline; daily freegoldapi ends **2026-02-20** (~159 days stale at audit) |
| **Granularity** | Mixed — monthly for long tail, daily/weekday for recent |
| **Caching** | 24h localStorage for freegoldapi; 90d browser history snapshots |
| **Failure behavior** | Degrade to baseline-only with honest resolution label; retry button on error |
| **Trust label** | "Spot-linked reference" badge + source/resolution line |
| **Limitations** | Not retail shop pricing; weekends may be missing in daily data; 12M view is mixed granularity |
| **Rejected** | Khaleej Times scrape (no legal approval); paid APIs (owner-gated); interpolated daily values |

## Formula

```
AED/g (karat K) = (XAU_USD / CONSTANTS.TROY_OZ_GRAMS) × purity × CONSTANTS.AED_PEG
```

Purity from `src/config/karats.js` only. No inline peg or troy-ounce constants.

## UI defaults

- **Default range:** 6M (balance of legibility and mixed-granularity honesty)
- **Default mode:** Line (clearer with four overlapping series)

## Accessibility

- SR summary updates with range/series
- Data table as equivalent representation
- `aria-pressed` on range/mode/legend controls
- 44px min touch targets
- `prefers-reduced-motion` skeleton fallback

## Tests

- `tests/uae-historical-karat-data.test.js` — math, ranges, dedup, ordering
- `tests/home-uae-history-chart.test.js` — HTML/JS/i18n wiring smoke

## Rollback

Revert `index.html`, `home.js`, remove new component/data files, restore prior chart section from git history. Tracker unaffected.

## Risks

- Mixed monthly/daily granularity in 12M range — mitigated by resolution label
- `TROY_OZ_GRAMS` uses 31.1035 (runtime constant) — consistent with rest of site
- Four-series area mode may reduce legibility — line default + low-opacity fills
