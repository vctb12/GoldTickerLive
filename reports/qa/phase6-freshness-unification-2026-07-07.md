# Phase 6 — Unified freshness/fallback labeling (Track B)

Fixes the confirmed live bug where `shops.html`'s sticky top price bar showed offline
`—`/unavailable while the bottom ticker on the same page showed the (cached) price — by making
**both widgets consume the same freshness/snapshot source**.

## Root cause

`src/pages/shops.js` imported and called **only** `updateTicker(...)`. It mounted the shared sticky
spot bar (`mountSharedShell({ withSpotBar: true })`) but **never called `updateSpotBar(...)`**, so
the bar stayed at its injected default (`data-freshness="unavailable"`, values `—`) forever, while
the ticker was populated from `cache.getFallbackGoldPrice()`. Every other price page (`compare.js`,
`heatmap.js`, home, tracker) calls **both** `updateTicker` and `updateSpotBar` from the same
snapshot — shops was the lone exception.

Confirmed shops has exactly one price-update path (a single cache-populate at init; no live refresh
loop), so a single added `updateSpotBar` call is the complete fix. The spot bar's language is
already handled by the shared shell (`site-shell.js` → `updateSpotBarLang`).

## Fix

In `src/pages/shops.js`, after the existing `updateTicker({...})` populate:

```js
import { updateSpotBar } from '../components/spotBar.js';
…
updateSpotBar({
  xauUsd: spot,
  aed24kGram: aedGram('24'),
  updatedAt: cachedGold.updatedAt || null,
  hasLiveFailure: true, // cached snapshot → labelled cached/fallback, never "Live"
});
```

Both widgets now read the **same** cached snapshot and the **same** freshness classifier
(`getLiveFreshness` in `src/lib/live-status.js`), so their states can no longer diverge. Because the
data is a committed cache entry, `hasLiveFailure: true` keeps the bar honestly labelled
cached/fallback — it is never shown as "Live" (consistent with the Phase 4 finding that the
committed/age path must not claim "Live").

## Not changed

- The two-freshness-system reconciliation (live-API 5/60/300 s vs age 30/75 min) is a documentation
  concern already captured in Phase 4; this phase does not alter thresholds or the `live-status.js`
  / `freshness-policy.js` primitives — it wires shops onto the existing shared source.
- `sw.js` (owner-gated) untouched.

## Verification

`npm run validate` / `npm test` / `npm run build` green. Playwright: with a fresh cached price
seeded in `localStorage`, `shops.html`'s `#spot-price-bar` now renders the cached 24K AED/g +
XAU/USD with a non-`unavailable` freshness state (cached/fallback) instead of `—`.
