# GoldTickerLive — Site Inventory (UX Repair brief, Phase A)

```yaml
date: 2026-07-04
built-from: main (post audit-remediation, PRs #496–#528)
method:
  local production build (NODE_ENV=production npm run build) served from dist/ + Playwright
  DOM/console probes
```

## Build / serve (verified)

- Build: `NODE_ENV=production npm run build` → `dist/` (exit 0, ~40 HTML pages).
- Country leaf pages are copied separately (mirrors `deploy.yml`): `cp -r countries dist/`.
- Local serve for diagnosis: `python3 -m http.server` in `dist/`.

## Page inventory (top-level indexable HTML)

| Page                    | In shared nav (`nav-data.js`)? | Notes                                |
| ----------------------- | ------------------------------ | ------------------------------------ |
| index.html              | ✅ (brand/home)                | landing                              |
| tracker.html            | ✅ (CTA)                       | flagship                             |
| calculator.html         | ✅                             | 5 modes                              |
| compare.html            | ✅                             | cross-country                        |
| heatmap.html            | ✅                             | world map                            |
| portfolio.html          | ✅                             | local-first                          |
| shops.html              | ✅                             | directory                            |
| learn.html              | ✅                             | hub                                  |
| glossary.html           | ✅                             | **was reported orphan — now in nav** |
| market.html             | ✅                             | how gold is priced                   |
| dubai-gold-price.html   | ✅                             | UAE landing                          |
| methodology.html        | ✅                             | trust                                |
| privacy.html            | footer only                    | legal (conventional)                 |
| terms.html              | footer only                    | legal (conventional)                 |
| 404.html / offline.html | n/a                            | error/offline                        |

**Orphan audit result:** no true orphans. Every content page is reachable from the shared nav; legal
pages are linked from the shared footer (`src/components/footer.js`). The owner's "glossary is
orphan" symptom is **already resolved** on `main`.

## Navigation mechanism

- **Single source of truth:** `src/components/nav-data.js` (`NAV_DATA` en/ar). Rendered/injected by
  `src/components/nav.js` (`injectNav`) via the shared shell (`mountSharedShell` →
  `src/components/site-shell.js`). This is already a consolidated, JS-injected nav — not per-page
  copies.
- Footer likewise derives from the same data via `src/components/footer.js`.

## Data sources per page

| Data               | Source                                                                            | Key  | Used by                                |
| ------------------ | --------------------------------------------------------------------------------- | ---- | -------------------------------------- |
| Countries / karats | **static** `src/config/countries.js` (import)                                     | —    | compare, heatmap, shops, calculator    |
| World map shapes   | **static** `src/pages/heatmap/world-map-data.js`                                  | —    | heatmap                                |
| Spot gold price    | `data/gold_price.json` (committed, hourly) + live provider chain                  | —    | tracker, home, compare, heatmap badges |
| FX rate            | `open.er-api.com` (live) w/ fallback                                              | —    | currency conversion                    |
| Shop listings      | **Supabase** `shop_listings` (REST, anon) → falls back to curated `data/shops.js` | anon | shops                                  |
| Site settings      | **Supabase** `site_settings` (REST, anon)                                         | anon | site-settings.js                       |
| Analytics          | **Supabase** `analytics_events`                                                   | anon | analytics.js                           |

- **Frontend Supabase project:** `SUPABASE_URL = https://nebdpxjazlnsrfmlpgeq.supabase.co`
  (`src/config/supabase.js:11`).
- compare/heatmap country pickers are driven by the **static** `COUNTRIES` array — they do **not**
  depend on any fetch, so a "blank picker" is a render/JS bug, never a data-fetch failure.
