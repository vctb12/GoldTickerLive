# Gold Ticker Live — Active Task Plan

> This file is the persistent task tracker for AI agents and human contributors. Agents: read this
> before starting any task. Update it after completing work. Last updated: 2026-05-31

---

## 🔴 In Progress

<!-- Active tasks go here -->

---

## 🟡 Up Next

- [ ] Replace hardcoded hex colors in CSS with design tokens (565 instances across styles/) —
      priority: medium — context: improves maintainability and dark mode consistency
- [ ] Add visibilitychange cleanup to insights.js sparkline/charts if added — priority: low —
      context: prevent stale chart renders
- [ ] Migrate `window.confirm()` in developer.js to a custom modal — priority: low — context: 2
      confirm dialogs for destructive key actions

---

## ✅ Recently Completed

- [x] BUILD 7: Shops Directory — Map view (Leaflet.js) + compare shops (up to 3, side-by-side
      modal) + lat/lng data for 27 shops + 9 new tests — completed: 2026-05-31 — PR: (draft)
- [x] BUILD 6: Compare Countries — standalone interactive `compare.html` (sortable table, karat
      tabs, country chips, side-by-side detail with per-karat bar chart, cheapest-to-buy callout,
      hash deep links) backed by pure `src/pages/compare/compare-core.js` + 13 tests — completed:
      2026-05-31 — PR: (draft)
- [x] BUILD 2: Country Pages Market Intelligence Panel — per-country
      VAT/making-charge/retail-estimate panel + "Should I Buy Today?" indicator on every country
      page (`src/config/market-intel.js`, `countries/country-page.js`, `styles/country-page.css`,
      `tests/market-intel.test.js`) — completed: 2026-05-31 — PR: (draft)
- [x] BUILD 10: Price Alert System — full feature build (alert engine, manager drawer, trigger
      dialog, sound, import/export, WhatsApp share, 18 tests) — completed: 2026-05-30 — PR: (draft)
- [x] Visual excellence session 7b (full-surface interaction rollout) — completed: 2026-05-30 — PR:
      (pending)
- [x] Audit session 8 — memory leak fixes, alert() removal, lint cleanup, SEO h1 — completed:
      2026-05-30 — PR: (draft open)
- [x] Visual excellence session 7 (global interactions + homepage polish) — completed: 2026-05-30 —
      PR: #376
- [x] Launch push session 6 (content standardization, learn/insights) — completed: 2026-05-30 — PR:
      #375

- [x] Deep clean session 3: broken links, invest safe-dom, learn/insights split, cache.getPreference
      — completed: 2026-05-29 — PR: (pending)
- [x] Autonomous cleanup: gold-prices ref sweep, city stub rebuild, invest.js extraction, dead-code
      trim — completed: 2026-05-29 — PR: #371
- [x] Country URL consolidation (~345 pages removed, gold-rate hubs) — completed: 2026-05-29 — PR:
      #370

<!-- Last 10 completed items — older ones get archived -->
<!-- Format: - [x] Task description — completed: YYYY-MM-DD — PR: #NNN -->

---

## 🚫 Blocked / On Hold

<!-- Tasks waiting on external input or decisions -->

---

## 📌 Permanent Context for Agents

- Production site: https://goldtickerlive.com/
- Repo: vctb12/GoldTickerLive
- X account: @GoldTickerLive (hourly posting — treat as production-critical)
- AED peg: 1 USD = 3.6725 AED (fixed — never change)
- Troy ounce: 31.1034768 grams (immutable)
- Primary data source: goldpricez.com API
- Test command: npm test (delete playwright-report/ first)
- Validate command: npm run validate
- PR workflow only — no direct commits to main
- Dry-run any X posting change before merging

## 📋 Audit Notes (2026-05-30)

### ✅ Clean

- No `console.log` debug statements in src/
- No `var` declarations — all code uses `const`/`let`
- All `.then()` chains have `.catch()` error handlers
- All pages have meta description, OG tags, skip links, lang attrs
- `font-display: swap` and `tabular-nums` properly applied
- home.js, tracker-pro.js, invest.js all properly clean up intervals

### ⚠️ Fixed This Session

- **Memory leaks**: insights.js and calculator.js setInterval calls now paused on visibilitychange /
  pagehide
- **alert() calls**: Replaced 4 browser alert() calls with showCopyToast() in developer.js,
  export.js, shops/actions.js
- **Lint warning**: Removed unused `copyWithToast` import in calculator.js
- **SEO**: Added static `<h1>` to learn.html (was previously JS-only rendered)

### ⚠️ Pre-existing (Not Fixed)

- 44 content pages missing webpage-schema (pre-existing test failures)
- 3 pre-existing test failures (provider-failover, cache-revalidation, audit-content-pages)
- 565 hardcoded hex colors in CSS (large effort — tracked in backlog)
- `window.confirm()` used in developer.js for destructive actions (acceptable UX)

## 🏆 Big Build Catalog Status

- [x] BUILD 1: Ticker Strip — done (existing `src/components/ticker.js` + `MarketSummaryTicker.js`)
- [x] BUILD 2: Country Pages — **done this session** (Market Intelligence Panel + buy indicator)
- [x] BUILD 3: Price Chart — done (existing `src/components/chart.js` with 24H–ALL ranges)
- [x] BUILD 4: Calculator Tabs — done (5 tabs: value, scrap, zakat, buying power, converter)
- [x] BUILD 5: PWA — done (sw.js, manifest.json, offline.html, install prompt)
- [x] BUILD 6: Compare Tool — **done this session** (standalone `compare.html` + `compare-core.js`)
- [x] BUILD 7: Shops Directory — **done this session** (map view + compare feature)
- [ ] BUILD 8: Insights Feed — partial (exists, needs category filter, masonry, search)
- [ ] BUILD 9: Homepage Overhaul — partial (recent polish sessions improved it significantly)
- [x] BUILD 10: Alert System — **done this session** (engine + drawer + dialog + sound + tests)

## Notes for Next Agent

- BUILD 7 Map View: Leaflet loads lazily from CDN on first "Map" button click; pins use shop
  `lat`/`lng` from `data/shops.js`. Supabase-sourced shops may not have coordinates — map only shows
  shops where both lat/lng are present. `initShopsMap()` returns false if CDN fails → list view
  continues to work.
- BUILD 7 Compare: Max 3 shops. State is in-memory only (not persisted). Compare module is
  initialized in `init()` of `src/pages/shops.js`; the sticky bar renders in `#shops-compare-bar`
  (fixed bottom). CSS at `styles/components/shops-map.css`.
- Next recommended build: BUILD 8 (Insights Feed — category filter, masonry grid, client-side
  search) or BUILD 9 (Homepage Overhaul — hero redesign, sparkline strip, country grid).
