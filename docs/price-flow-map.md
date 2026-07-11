# Price-data flow map

_Single reference for how the gold spot price reaches every public surface: source, fetch
location, resolver, cache, fallback, timestamp, freshness state, and refresh/visibility
behaviour. Written for the Stage-2 shared-price-state work; keep in sync when a surface's
price path changes._

Last mapped: 2026-07-11.

## 1. One canonical source, one resolver (non-Tracker surfaces)

Every non-Tracker surface reads the same value through one memoized read point:

- **Source of truth:** `/data/gold_price.json` — committed by the hourly
  `gold-price-fetch.yml` workflow (minute :02, market hours). Fields consumed:
  `xau_usd_per_oz`, `timestamp_utc`, `fetched_at_utc`, `is_fresh`, `is_fallback`,
  `freshness_seconds`, `max_freshness_seconds`.
- **Fetch layer:** `src/lib/api.js` → `fetchGold()`.
  - URL is cache-busted per call: `/data/gold_price.json?t=<Date.now()>`.
  - Retry with exponential back-off (`retryWithBackoff`, 2 retries, 1s/2s).
  - Timeout via `fetchWithTimeout` (`CONSTANTS.GOLD_FETCH_TIMEOUT`), abortable via `signal`.
  - Optional versioned backend (`/api/v1/prices/latest`) is probed **only** when
    `CONSTANTS.API_BACKEND_ENABLED` (false on static Pages, so no guaranteed 404).
  - **Fallback:** on total fetch failure, `getFallbackGoldPrice()` returns the last
    `localStorage` cache with `source: 'cache-fallback'`. If that too is empty, `fetchGold`
    throws `NetworkError` (offline with no cache → surface shows its error/unavailable state,
    never a fabricated number).
- **Resolver:** `src/lib/spot-resolver.js` → `getCanonicalSpot()`.
  - Single-flight memoization: concurrent callers share ONE in-flight fetch and ONE
    `_snapshot`, so surfaces cannot diverge within a render.
  - `_snapshot` has **no TTL** — it is cached until `getCanonicalSpot({ force: true })` is
    called. Periodic refreshers therefore pass `force: true`; the initial paint uses the
    memoized read.
  - `deriveFromSpot(spot)` applies the immutable invariants (troy-oz 31.1035, AED peg 3.6725,
    karat purity = code/24) — never re-derived anywhere else.
  - `buildSnapshot()` returns `{ ok, spotUsdPerOz, usdPerGram24k, aedPerGram24k, karats[],
    freshness }`.

## 2. Freshness vocabulary (the authoritative state set)

Per `docs/freshness-contract.md`, the full state set is:
`live · cached · delayed · estimated · stale · fallback · closed · unavailable`.

Three modules emit subsets of it — no surface should branch on raw age itself:

| Module | Function | States it emits | Used by |
| --- | --- | --- | --- |
| `spot-resolver.js` | `classifyFreshness(gold)` | live, delayed, cached, fallback, unavailable | `snapshot.freshness` on every canonical surface |
| `live-status.js` | `getLiveFreshness(opts)` | live, delayed, cached, stale, fallback, unavailable | ticker + label layer; adds the age-based `stale` |
| `live-status.js` | `applyMarketClosedOverlay(key)` | overlays `closed` | ticker, hero, tracker |
| `freshness-policy.js` | `evaluateFreshnessState(opts)` | closed, live, cached, delayed, estimated, fallback | policy/engine-side evaluation |

Note the split: `classifyFreshness` (what the snapshot carries) does **not** itself emit
`stale`, `estimated`, or `closed` — those are added by the label layer
(`getLiveFreshness` + `applyMarketClosedOverlay`) at render time. Surfaces feed the snapshot's
`freshness.updatedAt` / `isFallback` / (`state !== 'live'` → `hasLiveFailure`) into the label
layer so the displayed state is honest and market-closed-aware.

Mandatory disclosure per block: **state label + source label + UTC timestamp**.
Trust invariants: reference estimates are never shown as retail quotes; a closed market reads
`closed` even with recent data; cached/fallback stays visibly non-live; AED peg stays 3.6725.

**Market-closed overlay is mandatory on every price surface.** `classifyFreshness` and
`getLiveFreshness` are pure data-freshness signals — neither emits `closed`. Any surface that
renders a freshness pill MUST wrap its resolved state key in `applyMarketClosedOverlay(key)`
(from `live-status.js`) before mapping to a label/dot, so a freshly-fetched quote during a
closed market never reads "Live". The shared ticker + spot bar, home, compare, and portfolio
did this; an audit (2026-07-11) found market/dubai/shops/heatmap/invest and the calculator's
inline note derived their pill from the raw state without the overlay — they could show "Live"
while the same page's ticker read "Closed". Fixed so all nine non-Tracker surfaces apply the
overlay (guarded by `tests/market-closed-overlay-coverage.test.js`). Each surface's freshness
label map now carries a bilingual `closed` entry ("Closed"/"مغلق").

## 3. Per-surface map

All "canonical" surfaces below call `getCanonicalSpot()` for the initial paint and
`getCanonicalSpot({ force: true })` on refresh. Timestamp source = `snapshot.freshness.updatedAt`
(the committed `timestamp_utc`/`fetched_at_utc`).

| Surface | Controller | Price path | Refresh (every `GOLD_REFRESH_MS`=90s) | Visibility-aware? |
| --- | --- | --- | --- | --- |
| Global bottom ticker | `components/ticker.js` + `site-shell.js` `feedTickerBaseline()` | canonical baseline, **guarded** — only writes while `data-freshness==='unavailable'` so any page that fed real data first wins | fed once at mount; tool controllers re-feed via `updateTicker` | n/a (event-driven) |
| Homepage | `pages/home.js` | **dual**: realtime engine (`createPrimaryQuoteProvider`) for the live-updating spot + `getCanonicalSpot` for static hero/ladder | realtime engine + `_refreshTimer`/`_freshnessTimer` | ✅ engine `setVisibility` |
| Calculator | `pages/calculator.js` | canonical | interval | ✅ inline guard |
| Compare | `pages/compare.js` | canonical | interval | ✅ inline guard |
| Portfolio | `pages/portfolio.js` | canonical | interval | ✅ inline guard |
| Heatmap / world map | `pages/heatmap.js` | canonical | interval | ✅ inline guard |
| Dubai country landing | `pages/dubai-gold-price.js` | canonical | interval | ✅ shared helper _(added 2026-07-11)_ |
| Shops directory | `pages/shops.js` | canonical (`refreshLiveReference`) feeds spot bar + ticker + hero chip | interval | ✅ shared helper _(added 2026-07-11)_ |
| Market explainer | `pages/market.js` | canonical (worked example) | interval | ✅ shared helper _(added 2026-07-11)_ |
| Learn / invest planner | `pages/invest.js` | canonical | interval | ✅ shared helper _(added 2026-07-11)_ |
| Content pages (learn/methodology/glossary) | `site-shell.js` baseline only | canonical baseline via ticker | none (static) | n/a |

`market.js` also uses `showDataStatusBanner`/`hideDataStatusBanner` (invest too) for a
page-level offline/degraded banner.

### Visibility-aware refresh

`src/lib/visibility-refresh.js` → `startVisibilityAwareRefresh(refresh, { intervalMs })`
is the one tested implementation: it polls only while the tab is visible, pauses on
`document.hidden`, runs an immediate catch-up `refresh` when the tab returns to visible, and
tears down on `pagehide`. It mirrors the inline pattern the homepage-family pages
(compare/portfolio/heatmap/calculator) already use; `market/dubai/shops/invest` were migrated
to it (2026-07-11) — before that they polled `/data/gold_price.json` every 90s even in a
background tab (and `shops` never captured its interval handle, so it could never be cleared).

## 4. The Tracker exception (do not migrate)

`tracker.html` (`pages/tracker-pro.js`) runs a **separate, deliberately superior multi-tier
live pricing engine** (`createRealtimePricingEngine` + `createPrimaryQuoteProvider`:
gold-api.com → minted-metal → committed `gold_price.json` → `last_gold_price.json`). It does
NOT read `getCanonicalSpot()` (which is committed-JSON-only); migrating it would be a
regression (live polling → committed-only). Consistency holds anyway because every tier traces
to the same gold-api.com / committed snapshot. The Tracker uses the realtime engine's own
`setVisibility()` for background throttling and its own inline freshness overlay
(`src/tracker/freshness.js`). Leave it untouched.

## 5. Trust/provenance layer ("About this price")

`src/components/priceProvenance.js` → `renderPriceProvenance({ lang, depth, updatedAt,
hasLiveFailure, isFallback, isFresh, open })` is the shared Stage-2C control: a compact
`<details>` whose summary is a freshness chip + "About this price", expanding to disclose
**source** (Gold-API.com + cadence), **updated** (UTC timestamp + relative age), **basis**
(troy-oz 31.1035, USD→AED peg 3.6725, karat purity = code/24), **spot ≠ retail**, and a
**methodology** link. It resolves state through `getLiveFreshness` + `applyMarketClosedOverlay`
(honest, never "Live" while closed) and is built entirely from `data-attribution.js` +
constitutional constants — no new data path. Bilingual EN/AR (RTL), theme-aware, mobile,
keyboard-accessible (native `<details>`, not hover-only); `gtl-`-namespaced CSS in
`styles/components/price-provenance.css`. Styles/tests: `tests/price-provenance.test.js`.

**Rollout pattern** (piloted on `compare.html`): link the component CSS after `design-system.css`;
add an empty mount container in the page HTML; in the page controller, on each price render call
`slot.replaceChildren(renderPriceProvenance({ lang, depth, updatedAt, hasLiveFailure }))`,
preserving the user's open/closed state across refreshes (`open: slot.querySelector('.gtl-provenance')?.hasAttribute('open')`).
Pilot surface = compare (lean hero, no verbose existing trust block). Next candidates: portfolio,
heatmap, then consolidate the scattered inline trust copy on home/calculator/dubai/market into
this one control rather than adding a second disclosure beside them.

## 6. Known follow-ups

- Roll `priceProvenance` out to the remaining tool surfaces (see pattern above); on
  home/calculator/dubai it should **consolidate** existing scattered trust copy, not duplicate it.
- `classifyFreshness` never emits `estimated`; only `evaluateFreshnessState` does. If a surface
  needs to distinguish "provider unavailable, value estimated" from "cached", it must go through
  the policy evaluator, not the snapshot's `freshness.state`.
