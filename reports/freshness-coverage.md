# Freshness-coverage audit

**Static analysis. Advisory, not a gate.**

Generated from `scripts/node/audit-freshness-coverage.js` on 2026-04-23.

## Scope note

Static analysis only. Does not audit §6.1 spot-vs-retail mixing. Advisory, not a gate.

Plan: [`docs/plans/2026-04-23_freshness-coverage-audit.md`](../docs/plans/2026-04-23_freshness-coverage-audit.md).

## Summary

- Total surfaces: **29**
- Live-status consumers with all three branches (live / cached / stale): **2**
- Consumers missing `stale` literal: **2**
- Consumers missing `cached` literal: **1**
- Consumers missing `live` literal: **0**
- Price-like renderers without any live-status import (after exemptions): **6**
- Documented false-positive exemptions: **19**
- Known real gaps tracked for follow-up: **7**

## Per-surface details

| File | Kind | Imports | Used symbols | Freshness keys | Src / TS | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `src/components/nav-data.js` | component | · | — | — | · / · | EXEMPT: Nav-link metadata; "22k"/"24k" strings are category labels, not prices. |
| `src/components/spotBar.js` | component | ✓ | getLiveFreshness | live, cached, stale, unavailable | · / ✓ |  |
| `src/components/ticker.js` | component | · | — | — | · / · | renders price-like content but no live-status import; renders price-like content but no timestamp label heuristic; KNOWN GAP: Ticker marquee renders spot prices but has no freshness label. Tracked for a follow-up plan. |
| `src/config/countries.js` | config | · | — | — | · / · | EXEMPT: Static country/currency config table; no live values. |
| `src/config/translations.js` | config | · | — | — | ✓ / · | EXEMPT: i18n string catalogue; no live values. |
| `src/lib/api.js` | lib | · | — | — | ✓ / ✓ | renders price-like content but no live-status import; KNOWN GAP: Price fetch layer; source is already tagged ("live" vs "cache-fallback"). Freshness ownership sits with callers who render. |
| `src/lib/count-up.js` | lib | · | — | — | · / · | EXEMPT: Generic number-animation utility; currency-agnostic. |
| `src/lib/export.js` | lib | · | — | — | ✓ / · | EXEMPT: CSV/JSON export helper; ships user-triggered snapshots, not live values. |
| `src/lib/formatter.js` | lib | · | — | live, cached, stale | · / ✓ | EXEMPT: Pure formatter (locale/currency/time); callers own freshness. The three freshness keys appear in source.* translation keys, not as renderer branches. |
| `src/lib/live-status.js` | live-status-module | · | GOLD_MARKET, formatRelativeAge, getAgeMs, getLiveFreshness, getMarketStatus | live, cached, stale, unavailable | · / ✓ |  |
| `src/lib/page-hydrator.js` | lib | · | — | cached, stale | ✓ / ✓ | renders price-like content but no live-status import; KNOWN GAP: Country/city hydrator; now threads hasLiveFailure into updateSpotBar but the karat-card grid itself has no stale badge. Tracked for a follow-up plan. |
| `src/lib/price-calculator.js` | lib | · | — | — | · / · | EXEMPT: Pure math library (purity × grams × spot); no DOM, no time dimension. |
| `src/pages/calculator.js` | page-module | · | — | live | ✓ / ✓ | renders price-like content but no live-status import; KNOWN GAP: Calculator already tracks STATE.spotSource and feeds hasLiveFailure into updateSpotBar. Internal result panels do not yet carry per-panel freshness. |
| `src/pages/home.js` | page-module | ✓ | getMarketStatus | live, unavailable | ✓ / ✓ | missing 'cached' branch literal; missing 'stale' branch literal; KNOWN GAP: Hero card already exposes freshness; surrounding GCC grid and country carousel do not carry freshness branches. |
| `src/pages/learn.js` | page-module | · | — | — | · / · | EXEMPT: Static educational content page; no live prices. |
| `src/pages/methodology.js` | page-module | · | — | — | · / · | EXEMPT: Static methodology page; no live prices. |
| `src/pages/shops.js` | page-module | · | — | — | ✓ / · | renders price-like content but no live-status import; renders price-like content but no timestamp label heuristic; KNOWN GAP: Shops directory page shows spot bar and list cards. Shop cards do not render live prices; page passes through updateSpotBar only. |
| `src/pages/tracker-pro.js` | page-module | · | — | live | ✓ / ✓ | renders price-like content but no live-status import; KNOWN GAP: Tracker-pro workspace; per-panel freshness coverage tracked by follow-up plan. |
| `src/routes/routeRegistry.js` | other | · | — | — | · / · | EXEMPT: Static route metadata (paths, titles, descriptions); no runtime prices. |
| `src/search/searchIndex.js` | search | · | — | live | · / · | EXEMPT: Search index generator; "live" is an entity-type label, not a freshness key. |
| `src/seo/metadataGenerator.js` | other | · | — | — | · / · | EXEMPT: Server-side SEO meta builder (titles, descriptions); static per-page. |
| `src/seo/seoHead.js` | other | · | — | — | · / · | EXEMPT: SEO head snippet emitter; static metadata. |
| `src/social/postTemplates.js` | other | · | — | — | · / · | EXEMPT: Social post copy templates; rendered by scripts/python at post time, not in the browser. |
| `src/tracker/events.js` | tracker-module | · | — | live | · / · | EXEMPT: 'live' is the tracker mode-name (VALID_MODES), not a freshness key. Tracker freshness is owned by src/tracker/render.js. |
| `src/tracker/render.js` | tracker-module | ✓ | getLiveFreshness, getMarketStatus | live, cached, unavailable | ✓ / ✓ | missing 'stale' branch literal |
| `src/tracker/state.js` | tracker-module | · | — | live | ✓ / ✓ | EXEMPT: 'live' is the default tracker mode-name; tracker freshness lives on _state.live.updatedAt and is consumed by render.js. |
| `src/tracker/ui-shell.js` | tracker-module | · | — | live | · / ✓ | EXEMPT: 'live' references are mode-name checks; now forwards hasLiveFailure into updateSpotBar, which owns the freshness label. |
| `src/utils/inputValidation.js` | other | · | — | — | · / · | EXEMPT: Input validators (regex); tokens like "karat" appear in validator names/messages, not prices. |
| `src/utils/slugify.js` | other | · | — | — | · / · | EXEMPT: String utility; currency-agnostic. |

