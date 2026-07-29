# Plan: UAE Historical Karat Chart (Homepage)

**Date:** 2026-07-29  
**Branch:** `cursor/home-uae-historical-karat-chart-6a31`  
**Status:** Implementation in progress — gold-api.com daily pipeline wired; awaiting live API bootstrap / full QA

## Scope

Replace the homepage `home-chart-section` (single-series USD/oz GoldChart + market-insight panel) with a dedicated **UAE Historical Gold Rate Chart (AED/g)** showing four karat series with 1M/3M/6M/12M ranges and line/area modes.

## Architecture

| Layer | File | Role |
|-------|------|------|
| Contract | `src/lib/gold-api-daily-history-contract.js` | Validation thresholds, parse/normalize |
| Fetch | `scripts/node/fetch-gold-api-history.mjs` | gold-api.com `/history` → committed JSON |
| Data file | `data/historical/xau-usd-daily.json` | Canonical daily XAU/USD averages |
| Loader | `src/lib/uae-historical-source.js` | Fetch + validate JSON → karat rows |
| Transforms | `src/lib/uae-historical-karat-data.js` | AED/gram per karat, ranges, display |
| Component | `src/components/UaeHistoricalKaratChart.js` | Multi-series chart UI |
| Workflow | `.github/workflows/historical-gold-refresh.yml` | Daily refresh (isolated from live fetch) |
| Page | `src/pages/home.js` | Lazy IntersectionObserver mount |
| Markup | `index.html` | Refactored `home-chart-section` |
| Styles | `styles/pages/home-redesign.css` | `.uae-hist-chart*` tokens |
| i18n | `translations.en.js` / `translations.ar.js` | `home.uaeHist*` keys |

Tracker chart (`src/tracker/chart.js`, `GoldChart` on tracker) is **unchanged**.

## Data provenance decision (ADR)

| Field | Value |
|-------|-------|
| **Chosen source** | gold-api.com `/history` — daily average XAU/USD |
| **Endpoint** | `GET https://api.gold-api.com/history?symbol=XAU&groupBy=day&aggregation=avg` |
| **Secret** | `GOLD_API_KEY` (fallback `GOLD_API_COM_KEY`) — server/workflow only |
| **Generated file** | `data/historical/xau-usd-daily.json` |
| **Refresh** | `historical-gold-refresh.yml` daily ~02:45 UTC |
| **License** | Provider ToS — reference only, not retail |
| **Coverage** | ~400 calendar days (≥240 valid observations) |
| **Granularity** | Daily average (not LBMA fix, not retail close) |
| **Failure behavior** | Keep last good file; chart shows stale/unavailable states |
| **Trust label** | "Daily average spot-linked reference" |
| **Rejected for homepage** | FreeGoldAPI (stale), embedded monthly baseline (unverified), Khaleej Times retail |

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
