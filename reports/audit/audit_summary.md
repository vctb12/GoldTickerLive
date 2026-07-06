# GoldTickerLive — Diagnosis Summary (UX Repair brief, Phase B)

```yaml
date: 2026-07-04
scope: owner-reported broken pages, verified against current main
environment-limits:
  sandbox blocks (a) Playwright→production (chromium ERR_CONNECTION_RESET), (b) all external
  Supabase/FX hosts. Live production browser + real GTL DB could NOT be inspected from here — see
  Blockers.
```

## Headline

Built from current `main` and probed with a headless browser, **the functional symptoms the owner
reported are largely already resolved** (this session shipped nav consolidation + page fixes across
PRs #496–#528). The genuine remaining work is **design/UX**, plus **two hard blockers** that require
the owner (production/DB access + a Supabase project mismatch).

## Per-symptom diagnosis (evidence-backed)

| Page                                     | Reported                              | Class                       | Root cause / current state                                                                                                                                                                                                                                                                                                                                       | Evidence (local build of `main`)                                                      |
| ---------------------------------------- | ------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| compare                                  | blank "Add country" picker; no nav    | JS/render (not data)        | **Not reproduced.** Picker driven by static `COUNTRIES`; renders 25 options; nav present. Likely a pre-deploy symptom.                                                                                                                                                                                                                                           | Playwright: `addCountrySelectOptions: 25`, `navPresent: true`, 74 rows                |
| heatmap                                  | doesn't load; empty jump list; no nav | JS/render (not data)        | **Not reproduced.** Renders 128 SVG country paths, 29-option jump list, table fallback, nav.                                                                                                                                                                                                                                                                     | Playwright: `svgPaths: 128`, `jumpOptions: [29]`, `tableRows: 44`, `navPresent: true` |
| shops                                    | frozen tab; 0 listings despite facets | render/filter or data-shape | **Renders 6 fallback listings on `main`.** `shops.js:2419` only replaces the curated fallback when `remote.length > 0`, so an empty/failed Supabase read cannot cause 0. If prod still shows 0, it is a `nebdpxjazlnsrfmlpgeq` **data-shape** issue (mapped `listing_type` not matching the default "Verified" tab) — **UNVERIFIABLE from here** (see Blockers). | Playwright: `listings: 6`, `activeTab: "Verified Shops"`, `countryFacets: 80`         |
| glossary                                 | orphan (not in nav)                   | reachability                | **Resolved.** `glossary.html` is in `nav-data.js`. No true orphans; legal pages in footer.                                                                                                                                                                                                                                                                       | orphan scan: only privacy/terms, both footer-linked                                   |
| portfolio / calculator / learn / tracker | no nav / too long / weak UX           | **design (D)**              | Nav present; the real issues are UX density & layout, not function. Legitimate redesign work.                                                                                                                                                                                                                                                                    | pages load 200, nav present                                                           |
| global nav                               | missing/inconsistent                  | —                           | Already a single JS-injected source of truth (`nav-data.js` → `nav.js`).                                                                                                                                                                                                                                                                                         | inventory §Navigation                                                                 |

**Console-error note:** the only errors seen locally are environment artifacts —
`assets/analytics.js` 404 (not copied in local serve), `data/gold_price.json` 404 (committed file
not in the local `dist` serve root), and `ERR_CONNECTION_RESET` to Supabase/`open.er-api.com`
(sandbox host block). None are product bugs; all resolve in production where those hosts/files are
served.

## 🚧 Blockers (owner action needed — §12.4)

1. **Cannot inspect the live GoldTickerLive database.** The frontend queries Supabase project
   **`nebdpxjazlnsrfmlpgeq`** (`src/config/supabase.js:11`). The only project reachable via the
   connected Supabase tooling is **`lulqcytwhtjdsbzslpiw`**, which is an **unrelated Prisma app**
   (`Store`/`Product`/`Listing`/`PriceHistory` tables — a Vercel template), _not_ GoldTickerLive. So
   the real `shop_listings` / `site_settings` rows, RLS, and "verified shops" state could not be
   confirmed. **This is very likely the root of the "shops not wired to admin / 0 listings"
   complaint** — if the admin panel writes to one project and the site reads another, they never
   sync.
   - **Owner action:** confirm the canonical GTL project ref, and grant DB access to that project
     (not the Prisma one) so the shops data path can be verified/fixed. Do NOT let me repoint
     `SUPABASE_URL` blind — that changes which DB the whole site reads (shops, site_settings,
     accounts, analytics) and can break working flows.
2. **Cannot drive live production in a browser from this sandbox** (chromium → `goldtickerlive.com`
   resets; only `curl` works). So I can't confirm whether production is currently serving the latest
   deploy the owner saw broken. **Owner action:** hard-refresh / bypass Cloudflare cache and
   re-check compare/heatmap/shops; if still broken there, capture the browser console so the
   prod-only cause can be pinned.

## ⚠️ Security note (surfaced per Supabase advisory)

The connected project `lulqcytwhtjdsbzslpiw` has **RLS disabled on all 5 tables** (anon can
read/write every row). If that project is in use anywhere, it is wide open. (It appears unrelated to
GTL, but flagging it since the tooling surfaced it.)

## Genuine remaining work (design/UX — does NOT need prod/DB, safe to proceed)

Verifiable locally; the real substance of the owner's request once function is confirmed:

- **calculator:** 5 modes → clean segmented control, only active tool visible (currently one long
  scroll).
- **shops:** collapse the oversized filter panel into a compact sidebar / mobile drawer with
  active-filter chips; listings get the main space.
- **learn:** reduce prose density → scannable featured-grid + category filters.
- **tracker:** timeframe selector + prominent freshness pill polish.
- **compare / heatmap / portfolio:** trim length, strengthen hierarchy, ensure trust labels stay
  prominent.
- Design-token / shell consistency pass across all pages.

These are the next execution block (they don't touch the blocked data path).
