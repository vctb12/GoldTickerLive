# Freshness-coverage audit

**Static analysis. Advisory, not a gate.**

Generated from `scripts/node/audit-freshness-coverage.js` on 2026-04-23.

## Scope note

Static analysis only. Does not audit §6.1 spot-vs-retail mixing. Advisory, not a gate.

Plan: [`docs/plans/2026-04-23_freshness-coverage-audit.md`](../docs/plans/2026-04-23_freshness-coverage-audit.md).

## Summary

- Total surfaces: **29**
- Live-status consumers with all three branches (live / cached / stale): **1**
- Consumers missing `stale` literal: **2**
- Consumers missing `cached` literal: **1**
- Consumers missing `live` literal: **0**
- Price-like renderers without any live-status import: **26**

## Per-surface details

| File | Kind | Imports | Used symbols | Freshness keys | Src / TS | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `src/components/nav-data.js` | component | · | — | — | · / · | renders price-like content but no live-status import; renders price-like content but no timestamp label heuristic |
| `src/components/spotBar.js` | component | · | — | — | · / ✓ | renders price-like content but no live-status import |
| `src/components/ticker.js` | component | · | — | — | · / · | renders price-like content but no live-status import; renders price-like content but no timestamp label heuristic |
| `src/config/countries.js` | config | · | — | — | · / · | renders price-like content but no live-status import; renders price-like content but no timestamp label heuristic |
| `src/config/translations.js` | config | · | — | — | ✓ / · | renders price-like content but no live-status import; renders price-like content but no timestamp label heuristic |
| `src/lib/api.js` | lib | · | — | — | ✓ / ✓ | renders price-like content but no live-status import |
| `src/lib/count-up.js` | lib | · | — | — | · / · | renders price-like content but no live-status import; renders price-like content but no timestamp label heuristic |
| `src/lib/export.js` | lib | · | — | — | ✓ / · | renders price-like content but no live-status import; renders price-like content but no timestamp label heuristic |
| `src/lib/formatter.js` | lib | · | — | live, cached, stale | · / ✓ | renders price-like content but no live-status import |
| `src/lib/live-status.js` | live-status-module | · | GOLD_MARKET, formatRelativeAge, getAgeMs, getLiveFreshness, getMarketStatus | live, cached, stale, unavailable | · / ✓ |  |
| `src/lib/page-hydrator.js` | lib | · | — | cached, stale | ✓ / ✓ | renders price-like content but no live-status import |
| `src/lib/price-calculator.js` | lib | · | — | — | · / · | renders price-like content but no live-status import; renders price-like content but no timestamp label heuristic |
| `src/pages/calculator.js` | page-module | · | — | live | ✓ / ✓ | renders price-like content but no live-status import |
| `src/pages/home.js` | page-module | ✓ | getMarketStatus | live, unavailable | ✓ / ✓ | missing 'cached' branch literal; missing 'stale' branch literal |
| `src/pages/learn.js` | page-module | · | — | — | · / · | renders price-like content but no live-status import; renders price-like content but no timestamp label heuristic |
| `src/pages/methodology.js` | page-module | · | — | — | · / · | renders price-like content but no live-status import; renders price-like content but no timestamp label heuristic |
| `src/pages/shops.js` | page-module | · | — | — | ✓ / · | renders price-like content but no live-status import; renders price-like content but no timestamp label heuristic |
| `src/pages/tracker-pro.js` | page-module | · | — | live | ✓ / ✓ | renders price-like content but no live-status import |
| `src/routes/routeRegistry.js` | other | · | — | — | · / · | renders price-like content but no live-status import; renders price-like content but no timestamp label heuristic |
| `src/search/searchIndex.js` | search | · | — | live | · / · | renders price-like content but no live-status import; renders price-like content but no timestamp label heuristic |
| `src/seo/metadataGenerator.js` | other | · | — | — | · / · | renders price-like content but no live-status import; renders price-like content but no timestamp label heuristic |
| `src/seo/seoHead.js` | other | · | — | — | · / · | renders price-like content but no live-status import; renders price-like content but no timestamp label heuristic |
| `src/social/postTemplates.js` | other | · | — | — | · / · | renders price-like content but no live-status import; renders price-like content but no timestamp label heuristic |
| `src/tracker/events.js` | tracker-module | · | — | live | · / · | renders price-like content but no live-status import; renders price-like content but no timestamp label heuristic |
| `src/tracker/render.js` | tracker-module | ✓ | getLiveFreshness, getMarketStatus | live, cached, unavailable | ✓ / ✓ | missing 'stale' branch literal |
| `src/tracker/state.js` | tracker-module | · | — | live | ✓ / ✓ | renders price-like content but no live-status import |
| `src/tracker/ui-shell.js` | tracker-module | · | — | live | · / ✓ | renders price-like content but no live-status import |
| `src/utils/inputValidation.js` | other | · | — | — | · / · | renders price-like content but no live-status import; renders price-like content but no timestamp label heuristic |
| `src/utils/slugify.js` | other | · | — | — | · / · | renders price-like content but no live-status import; renders price-like content but no timestamp label heuristic |

