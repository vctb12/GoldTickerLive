# Gold Ticker Live — Active Task Plan

> This file is the persistent task tracker for AI agents and human contributors. Agents: read this
> before starting any task. Update it after completing work. Last updated: 2026-07-03 (repo-upgrade
> session — docs/tooling/test hardening)

**Master workbook v2 (read first):**
[`docs/GOLD_TICKER_LIVE_MASTER_WORKBOOK.md`](docs/GOLD_TICKER_LIVE_MASTER_WORKBOOK.md) · appendices
[`docs/workbook/`](docs/workbook/) · `@.github/prompts/master-workbook-session.prompt.md`  
**Short hub:**
[`docs/plans/2026-06-01_master-operations-hub.md`](docs/plans/2026-06-01_master-operations-hub.md) ·
Endless prompts:
[`docs/plans/2026-06-01_endless-session-prompts.md`](docs/plans/2026-06-01_endless-session-prompts.md)
· `@.github/prompts/session-pick-next-work.prompt.md`

---

## 🔴 In Progress

### V1-VISUAL stack review follow-up (2026-07-03)

- [x] **PR #488/#490 review feedback pass** - confirmed the pricing "Reference gold prices",
      localized legacy freshness banner, tracker hero-stats aria-label, welcome-chip fallback, and
      featured-market caption fixes are already on `claude/v1-tracker-redesign`; fixed the remaining
      active-language FAQPage JSON-LD gap on country hubs and logged the closure in `PROGRESS.md` +
      `docs/plans/2026-07-01_v1-visual-session.md`.

### 20-Phase Design, Functionality & Page/Dead-Code Cleanup (2026-07-01)

Canonical plan:
[`docs/plans/2026-07-01_20-phase-design-functionality-page-cleanup-revamp.md`](docs/plans/2026-07-01_20-phase-design-functionality-page-cleanup-revamp.md)
· branch `cursor/20-phase-design-page-cleanup-revamp-6c1b` · cross-cutting revamp: design +
functionality + HTML page-count hygiene (390 files; 30 phantom stubs) + dead JS/CSS cleanup. One
phase per PR. Baseline:
[`reports/baseline-2026-07/html-count-summary.md`](reports/baseline-2026-07/html-count-summary.md).

- [x] **Phases 0–20** — see plan §7 phase tracker. **All 20 phases complete** on branch
      `cursor/20-phase-design-page-cleanup-revamp-db3b` (2026-07-02). PR #485.
- [x] **Phase 2** — phantom stub consolidation done out-of-sequence on branch
      `claude/html-reduction-twitter-banner-rekflj`: 30 duplicate `noindex` stubs → 1 generator
      (`scripts/node/generate-internal-index-stubs.js`), tracked HTML 390→360.

### Tracker HTML 50-Phase Flagship Revamp (2026-06-26)

Canonical plan:
[`docs/plans/2026-06-26_tracker-html-50-phase-revamp.md`](docs/plans/2026-06-26_tracker-html-50-phase-revamp.md)
· branch `claude/tracker-html-revamp-bpk97i` · owner-requested full-surface revamp (design / UX /
features / reliability / a11y / RTL / perf / SEO). Self-contained working prompt; 10 tracks × 50
phases; one phase per PR, baseline stays green.

- [ ] **Phases 1–50** — see the plan's §7 phase tracker. Track A (foundation/audit) first.

**Overhaul session 2026-06-26** (see
[`docs/plans/2026-06-26_overhaul-session-report.md`](docs/plans/2026-06-26_overhaul-session-report.md)
for the defect-closure table + verification receipts): 17 gated commits — freshness-honesty export
fix, D1/D2/D5/D6/D8 defects, a11y batch, dead-code, doc reconciliation, and i18n parity
(hero/source/tabs/live-toolbar wired + Batch-0 187 keys; dataset
[`_artifacts/2026-06-26_tracker-i18n-parity-dataset.md`](docs/plans/_artifacts/2026-06-26_tracker-i18n-parity-dataset.md)
ready for Batches 2–6). LOCKED pricing assertion verified (24K=478.03). Baseline 1205→1214 tests.
**Outstanding:** i18n Batches 2–6, Phase C redesign, Phase B regeneration, D4/D7/D9.

### Tracker HTML 30-Phase Visual Revamp (2026-06-25)

Canonical plan:
[`docs/plans/2026-06-25_tracker-30-phase-visual-revamp.md`](docs/plans/2026-06-25_tracker-30-phase-visual-revamp.md)
· branch `cursor/tracker-30-phase-revamp-3c60`

- [x] **Phases 0–30** — complete visual revamp (tokens → per-mode polish → RTL/dark/motion/a11y)

### Real-time tracker + Motion Universe — 20-phase program (2026-06-09)

Canonical plan:
[`docs/plans/2026-06-09_realtime-tracker-motion-revamp-20-phase.md`](docs/plans/2026-06-09_realtime-tracker-motion-revamp-20-phase.md)
· reconciled in `REVAMP_PLAN.md` §22b Track 6.

- [x] **Phase 0** — Motion foundation (`price-motion.js`, `motion-boot.js`, `motion-advanced.css`)
- [x] **Phases 1–4** — SLO + parallel race provider + 5 s freshness + backoff cap (PR-B)
- [ ] **Phases 5–20** — Tracker shell, Spot Terminal, quote bus, sitewide adoption (PR-C–F)

### Master workbook — WB-102 cross-page deep links (2026-06-01)

- [ ] **WB-102** — home karat → tracker/calculator hash; calculator → shops by country; shared
      `cross-page-links.js` + tests — branch `cursor/wb-102-cross-page-deeplinks-cb21`

### Post–UI/UX audit — next tracks (2026-06-01 hub)

> UI/UX Sessions **0–5 merged**
> ([#387](https://github.com/vctb12/GoldTickerLive/pull/387)–[#393](https://github.com/vctb12/GoldTickerLive/pull/393)).
> Program (Tracks B–E):
> [`docs/plans/2026-06-01_ui-ux-audit-remediation-program.md`](docs/plans/2026-06-01_ui-ux-audit-remediation-program.md)

- [ ] **Track D1** — cross-page integration wiring (WB-102 in flight; remaining: shops city
      spot-check, related guides, EN↔AR parity audit)
- [ ] **NEXT_PR_SEQUENCE PR 1** — GDPR export/delete + dashboard + alerts docs (see
      [`docs/audits/NEXT_PR_SEQUENCE.md`](docs/audits/NEXT_PR_SEQUENCE.md))

---

## 🟡 Up Next

### Product Roadmap (2026-07-04)

Canonical plan:
[`docs/plans/2026-07-04_product-roadmap.md`](docs/plans/2026-07-04_product-roadmap.md) —
owner-supplied 17-item near/medium/long-term roadmap mapped to existing repo assets, blockers, and
owner gates. Suggested first PRs: T1.1 secondary gold cross-validation → newsletter digest →
~~portfolio tracker MVP~~ ✅ → ~~SVG heatmap~~ ✅ → owner decision on backend-in-production +
billing RED zone.

- [x] **Item 6 — Portfolio tracker MVP** (2026-07-04, branch
      `claude/product-roadmap-implementation-4oopr4`): `portfolio.html` + `src/pages/portfolio.js` +
      pure core `src/pages/portfolio/portfolio-core.js` (16 tests). Local-only `gtl_portfolio_v1`
      holdings, reference valuation (karat table + AED peg), honest gain rules (no cross-currency or
      partial-cost-basis totals), value-over-time from `gold_price_history` snapshots, CSV/JSON
      export + restore, EN/AR + RTL, dialogs via `<dialog>`, zero DOM sinks.
- [x] **Item 7 — World heatmap** (same session): `heatmap.html` + `src/pages/heatmap.js` + pure core
      `src/pages/heatmap/heatmap-core.js` (10 tests). Generated inline-SVG world map
      (`scripts/node/generate-world-map.js` → `src/pages/heatmap/world-map-data.js`, Natural Earth
      1:110m, no new deps, Eurozone merged into the EU pseudo-country, markers for BH/KM). 5-bucket
      one-hue gold ramp per theme (validated ordinal ramps), karat switcher, `#k=&c=` deep links,
      keyboard countries + jump select + table fallback, EN/AR.
- [x] **Item 10 interim — Sheets `GOLDPRICE()` docs** (same session): `docs/API_PRODUCT.md` § Google
      Sheets — Apps Script custom function + formula-only recipe against the committed
      `data/gold_price.json`, with freshness-honesty notes. Real add-on remains blocked on backend
      enablement.

### Platform Upgrade Program (2026-06-09)

Canonical plan:
[`docs/plans/2026-06-09_platform-upgrade-program.md`](docs/plans/2026-06-09_platform-upgrade-program.md)
· Bootstrap: [`prompts/platform-upgrade.md`](prompts/platform-upgrade.md) · one task per session.

- [x] **F1** License Apache-2.0 — [#421](https://github.com/vctb12/GoldTickerLive/pull/421)
- [x] **F2** Source truth gold-api.com — [#421](https://github.com/vctb12/GoldTickerLive/pull/421)
- [x] **T0.1** Dependabot (npm, actions, pip) —
      [#421](https://github.com/vctb12/GoldTickerLive/pull/421)
- [x] **T0.2** CodeQL — already in `.github/workflows/codeql.yml`
- [x] **T0.3** Secret scanning docs — `docs/SECURITY.md` created (secrets inventory, enable steps,
      push protection bypass, emergency rotation checklist) — 2026-06-30
- [ ] **T1.1** Secondary gold cross-validation —
      `@.github/prompts/platform-upgrade-t11-secondary-gold.prompt.md`
- [x] **T2.1** Lighthouse budget gate — `budget.json` created; `lighthouserc.json` updated with
      budget reference + accessibility/best-practices/SEO raised to `error` at 0.90 — 2026-06-30
- [ ] **T2.2** axe-core Playwright —
      `@.github/prompts/platform-upgrade-t22-a11y-playwright.prompt.md`
- [x] **T3.1** JSON-LD complete — `inject-schema.js` extended: `tracker.html` + `compare.html` now
      get `WebApplication` JSON-LD schemas (FinanceApplication, featureList, inLanguage, publisher)
      — 2026-06-30
- [ ] **T3.2** Sitemap gaps (28) — `@.github/prompts/platform-upgrade-t32-sitemap.prompt.md`

- [ ] **Track B1–B4** — visual polish (nav, homepage, tracker terminal, hover rollout) — after D1
- [x] **NEXT_PR_SEQUENCE PR 2** — noindex applied to the 8 stub karat pages
      (`gold-price/{18,21,22,24}k/` + `ar/gold-price/*`), self-canonicals kept, no deletions —
      2026-07-04
- [ ] Replace hardcoded hex colors in CSS with design tokens (565 instances across styles/) —
      priority: medium — context: improves maintainability and dark mode consistency
- [ ] Add visibilitychange cleanup to insights.js sparkline/charts if added — priority: low —
      context: prevent stale chart renders
- [x] Migrate `window.confirm()` in developer.js to a custom modal — `confirmAction()` using HTML5
      `<dialog>` API + safe DOM only — 2026-06-30

---

## ✅ Recently Completed

- [x] **Repo-upgrade session (2026-07-03)** — plan:
      [`docs/plans/2026-07-03_repo-upgrade-session.md`](docs/plans/2026-07-03_repo-upgrade-session.md).
      Central site identity `src/config/site.js` (canonical.js now derives `CANONICAL_BASE` from it;
      drift-guard vs `inject-schema.js` in `tests/site-config.test.js`); site-wide error reporting
      `src/lib/error-reporter.js` (window `error` + `unhandledrejection` → governed analytics
      `error` event, deduped/capped, wired via `site-shell.js`); locale-aware formatter additions
      (`formatNumber`, `formatCurrency`, `formatCompactNumber`, `formatRelativeTime`); first unit
      tests for runtime SEO modules (`tests/seo-runtime-helpers.test.js`); root `SECURITY.md`
      policy; `docs/INTEGRATIONS.md` (live/scaffolded/inert map + MCP rules);
      `docs/environment-variables.md` rewritten (~35 missing vars added; client-side constants
      correctly reclassified). Verified full green gate: tests 1282+new, lint, validate, build.
- [x] **X follow banner + brand favicon refresh (2026-07-01)** — Higgsfield-generated homepage
      banner linking to [x.com/GoldTickerLive](https://x.com/GoldTickerLive) at the top of
      `index.html` (EN/AR parity, `assets/social/x-follow-banner-{960,1920}.webp`); site-wide
      favicon family regenerated (`favicon.svg` + `assets/favicon-*`, `apple-touch-icon.png`) from a
      new gold-diamond/ticker/bullion mark, applied automatically across all ~360 pages via the
      shared filenames. Plus Phase 2 phantom-stub consolidation (see above) — branch
      `claude/html-reduction-twitter-banner-rekflj`.
- [x] **Multi-task session 2026-06-30** — T0.3 (SECURITY.md), T2.1 (budget.json +
      lighthouserc.json), T3.1 (tracker/compare JSON-LD), F2b (archival doc banners), Phase 2
      (tracker architecture audit → `docs/audits/2026-06-26_tracker-architecture-audit.md`), Phase 5
      (guard tests → `tests/tracker-ia-guard.test.js` +5 tests), developer.js dialog modal, 69-city
      relative-path depth fix, home FAQ i18n (14 keys EN/AR + data-i18n on h2 + 7 summaries),
      UPGRADE_SUMMARY.md, PLAN.md updated. Tests: 1270/1273.
- [x] **Premium redesign baseline** — tokens.css re-valued to neutral-base + restrained gold system
      (light + dark), legacy palette swept sitewide (hex + rgb + theme-color + manifest),
      nav/drawer/spot-bar ink-first restyle with condense-on-scroll, warm hero gradients → shared
      `--gradient-dark`, `?lang=ar` honored on home/invest/404, AA contrast fix for faint text, hero
      price CLS guard — completed: 2026-06-10 — branch `claude/funny-brown-98dp0p`. NOTE for Motion
      Universe phases 5–20: the visual baseline changed (palette only — DOM contracts, motion
      tokens, and freshness semantics untouched).
- [x] **Cursor Automations playbook** — five Cloud Automation prompts, policy, registry, master
      improvement program, ESLint clean, homepage karat-strip UX — completed: 2026-06-09 — PR:
      [#420](https://github.com/vctb12/GoldTickerLive/pull/420)
- [x] **GitHub control center** — setup plan, `master-rerun`, `REPOS_TO_STEAL_FROM`, issue
      templates, `link-check.yml`, `lighthouserc.json`, `labels.yml` + `sync-labels.yml`,
      README/AGENTS wiring — completed: 2026-06-09 — PR:
      [#411](https://github.com/vctb12/GoldTickerLive/pull/411)
- [x] **WB-102** (partial — PR open) — home karat selection → tracker `#mode=live&cur=AED&k=&u=`;
      calculator shops CTA with `?country=`; `src/lib/cross-page-links.js` — 2026-06-01
- [x] **Repo C1a** — docs archive (`docs/archive/2026-06/`) + supersession index + plan stubs (no
      URL moves) — completed: 2026-06-01 —
      [`docs/plans/2026-06-01_repo-reorganization-program.md`](docs/plans/2026-06-01_repo-reorganization-program.md)
- [x] **D1 Calculator → Shops handoff** — `calc-find-shops-link` and related card now pass
      `?country=<code>` (+ `lang=ar`) from calculator country/currency context;
      `src/pages/calculator/shops-handoff.js` + `tests/calculator-shops-handoff.test.js` —
      completed: 2026-06-01 — PR: (pending)
- [x] **Repo C1a** — docs archive scaffold + supersession index refresh (no plan file moves) —
      completed: 2026-06-01 — see
      [`docs/plans/ARCHIVE_AND_SUPERSESSION_INDEX.md`](docs/plans/ARCHIVE_AND_SUPERSESSION_INDEX.md)
- [x] **UI/UX audit Sessions 0–5** — first paint through CSS partials + a11y CI — completed:
      2026-06-01 — PRs:
      [#387](https://github.com/vctb12/GoldTickerLive/pull/387)–[#393](https://github.com/vctb12/GoldTickerLive/pull/393)
- [x] BUILD 8: Insights Market Analysis Feed — rebuilt the insights guide grid into a filterable,
      searchable CSS-masonry feed (category strip with counts, debounced search, read-time,
      bilingual cards, dynamic live "price context" card at position 3) backed by pure
      `src/pages/insights/insights-data.js` + renderer `src/pages/insights/insights-feed.js` and 10
      tests (`tests/insights-data.test.js`) — completed: 2026-05-31 — PR: (draft)
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

- 44 content pages missing webpage-schema — **since resolved**: `inject-schema.js --check` passes
  clean in `npm run validate` (re-verified 2026-07-03)
- 3 pre-existing test failures (provider-failover, cache-revalidation, audit-content-pages) —
  **since resolved**: full suite green 1282/1282 (re-verified 2026-07-03)
- 565 hardcoded hex colors in CSS (large effort — tracked in backlog)
- `window.confirm()` used in developer.js for destructive actions — **since resolved** via
  `<dialog>` modal (see Up Next, 2026-06-30)

## 🏆 Big Build Catalog Status

- [x] BUILD 1: Ticker Strip — done (existing `src/components/ticker.js` + `MarketSummaryTicker.js`)
- [x] BUILD 2: Country Pages — **done** (Market Intelligence Panel + buy indicator)
- [x] BUILD 3: Price Chart — done (existing `src/components/chart.js` with 24H–ALL ranges)
- [x] BUILD 4: Calculator Tabs — done (5 tabs: value, scrap, zakat, buying power, converter)
- [x] BUILD 5: PWA — done (sw.js, manifest.json, offline.html, install prompt)
- [x] BUILD 6: Compare Tool — **done** (standalone `compare.html` + `compare-core.js`)
- [ ] BUILD 7: Shops Directory — partial (list + filter, needs map, card redesign)
- [x] BUILD 8: Insights Feed — **done this session** (category filter + masonry + search + live
      context card)
- [ ] BUILD 9: Homepage Overhaul — partial (recent polish sessions improved it significantly)
- [x] BUILD 10: Alert System — **done** (engine + drawer + dialog + sound + tests)

## Notes for Next Agent

- BUILD 8 Insights Feed: `src/config/insights-articles.js` defines 15 bilingual articles across 6
  categories. `src/pages/insights.js` renders them as a masonry grid with category filtering,
  client-side search (200ms debounce), and a contextual price callout inserted at position 3. The
  callout updates on each 90s price tick via `refreshContextCallout()`.
- Feed cards use `data-reveal` for scroll-triggered entrance animations (shared IntersectionObserver
  from `src/lib/reveal.js`). The reveal module is lazy-loaded to avoid import-order issues.
- To add new articles: add entries to the `INSIGHTS_ARTICLES` array in
  `src/config/insights-articles.js`. Category must match a key in `INSIGHT_CATEGORIES`.
- BUILD 7 Map View: Leaflet loads lazily from CDN on first "Map" button click; pins use shop
  `lat`/`lng` from `data/shops.js`. Supabase-sourced shops may not have coordinates — map only shows
  shops where both lat/lng are present. `initShopsMap()` returns false if CDN fails → list view
  continues to work.
- BUILD 7 Compare: Max 3 shops. State is in-memory only (not persisted). Compare module is
  initialized in `init()` of `src/pages/shops.js`; the sticky bar renders in `#shops-compare-bar`
  (fixed bottom). CSS at `styles/components/shops-map.css`.
- Next recommended build: BUILD 8 (Insights Feed — category filter, masonry grid, client-side
  search) or BUILD 9 (Homepage Overhaul — hero redesign, sparkline strip, country grid).
- BUILD 8 Insights Feed: content model lives in `src/config/insights-data.js`
  (`INSIGHT_CATEGORIES` + `INSIGHTS`, each linking to an existing `content/guides/` page). Pure
  filter/search/read-time/price-context logic is in `src/lib/insights-feed-core.js` (18 tests in
  `tests/insights-feed-core.test.js`). Rendering is `src/components/insights-feed.js`
  (`mountInsightsFeed`), mounted from `src/pages/insights.js` into `#insights-feed-mount`. The live
  "Related to current gold price" card only renders when a ~7-day-ago daily snapshot exists in
  localStorage (honest week-over-week); it is fed via `feed.setPriceContext()` on each refresh. CSS
  additions are at the bottom of `styles/pages/insights.css`.
- BUILD 2 Market Intelligence Panel is injected by `countries/country-page.js` via
  `ensureMarketIntelMount()` (no per-page HTML edits) and styled in `styles/country-page.css`.
  Reference data lives in `src/config/market-intel.js` keyed by ISO code with a generic fallback.
- The "Should I Buy Today?" indicator reads the shared `gtl_history` daily snapshots; country pages
  now call `cache.saveHistorySnapshot(STATE)` so the 7-day average builds over repeat visits.
- Alert engine is wired into tracker-pro.js `applyRealtimeSnapshot` — fires on every 90s price tick
- Alert manager drawer CSS is at `styles/components/alert-manager.css` — imported only in
  tracker.html
- New localStorage key `gtl_alerts_v2` — migrates from legacy `gold_price_alerts` automatically
- BUILD 6 Compare tool: standalone page `compare.html` + orchestrator `src/pages/compare.js` + pure
  logic `src/pages/compare/compare-core.js` (DOM-free, unit-tested). Cross-country comparison keys
  off an all-in **retail estimate** = gold value × (1 + median making charge) × (1 + VAT), because
  the spot-linked gold value per gram is globally identical in USD. `fxRateFor` returns the
  hardcoded AED peg for AED and never the live rates object. Hash deep-link format:
  `#compare=ae,sa,kw,qa&k=22` (codes + active karat). Footer/breadcrumb/sitemap/translations wired.
- Next recommended build: BUILD 7 (Shops Directory — add map view, card redesign, advanced filters,
  detail modal) or BUILD 9 (Homepage Overhaul — asymmetric hero, sparkline strip, market context).
