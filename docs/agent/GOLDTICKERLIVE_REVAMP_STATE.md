# GoldTickerLive — Revamp State Document

**Last verified:** 2026-07-11 · **Verified at commit:** `586f9b5` (branch
`claude/goldtickerlive-premium-revamp-qrq053`) · **Verified by:** Premium Product Revamp session

> Purpose: the fast-orientation snapshot so a new session does **not** re-audit the whole repo. Read
> this + [`GOLDTICKERLIVE_SKILL_ROUTING_MATRIX.md`](./GOLDTICKERLIVE_SKILL_ROUTING_MATRIX.md) first;
> only drill into source when this doc is stale for your task. Canonical phase status stays in
> [`docs/AGENT_MASTER_TRACKER.md`](../AGENT_MASTER_TRACKER.md).

## TL;DR — where the product actually stands

GoldTickerLive is **not** a greenfield or an incohesive "collection of pages." Across many prior
sessions the premium foundation, the global shell, the flagship surfaces, and the bilingual/RTL
experience have already been built to a high standard, and the repo's own gates are green. The
remaining revamp value is **incremental polish + owner-gated growth features**, not a foundation
rebuild. Do not re-pour concrete that is already set. Verify before "fixing" — the `audit-reverify`
skill exists because documented bugs here are often already closed (this session confirmed DP-4b was
already fixed before touching it).

## Verified-green baseline (2026-07-11, this environment)

| Gate                         | Command                            | Result                                                                  |
| ---------------------------- | ---------------------------------- | ----------------------------------------------------------------------- |
| Lint                         | `npm run lint`                     | ✅ 0 problems                                                           |
| Full validate (merge gate)   | `npm run validate`                 | ✅ all ~25 checks pass (a11y, SEO, schema, SW, shell-guard, DOM-safety) |
| Unit/integration tests       | `npm test` (`node --test`)         | ✅ 0 failures across 195 test files (~1400 tests, ~64s)                 |
| i18n leaked-key scan         | `npm run i18n:leaked-scan`         | ✅ 0 leaked keys                                                        |
| Production build             | `npm run build`                    | ✅ built in ~5s, 16 root HTML entries + hashed assets                   |
| RTL/mobile render (Chromium) | 6 core pages × EN/AR × {390, 1280} | ✅ 0 horizontal overflow, correct `dir`/`lang`, localized titles        |

Env vars needed for `npm test`/`npm start` only: `JWT_SECRET` (32+ chars), `ADMIN_PASSWORD`,
`ADMIN_ACCESS_PIN` (names only — never commit values).

### Browser-render evidence (built `dist/`, pre-installed Chromium)

- Homepage EN/AR, tracker EN/AR, calculator EN/AR, compare, portfolio rendered at 390px & 1280px.
- **0 horizontal overflow** on every render. AR pages correctly `dir=rtl`, `lang=ar`, with localized
  `<title>` and fully mirrored nav/hero/CTAs.
- Console "errors" seen locally are **environment artifacts, not product bugs**:
  `api.gold-api.com/price/XAU` aborts (no outbound network in sandbox → app shows the honest "Live
  feed unavailable — showing last cached price" degraded state), and `assets/analytics.js` +
  `*.woff2` 404 because a plain `npm run build` skips the deploy-only "Copy root-level statics" step
  (`cp -r assets sw.js styles src data dist/` lives in `.github/workflows/deploy.yml`, not in
  `npm run build`). Production resolves these correctly.
- To reproduce renders: `npm run build`, `python3 -m http.server 8099 --directory dist`, then drive
  Chromium at `executablePath: /opt/pw-browsers/chromium-1194/chrome-linux/chrome` (the pinned
  `@playwright/test` browser build is absent; use the pre-installed one).

## Architecture map (canonical paths — do not duplicate these systems)

| System                     | Canonical location                                                                                                                                                                                                                                                         |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Design tokens              | `styles/partials/tokens.css` (colors/status/dark, WCAG-annotated) + `styles/design-system.css` (`--gtl-*` type/space/radius/motion). Doc: `docs/DESIGN_TOKENS.md`.                                                                                                         |
| CSS barrel                 | `styles/global.css` `@import`s partials (fonts→price-display→shell→skeleton→tokens→base→layout→components→utilities). Page CSS in `styles/pages/*`. **No inline `<style>` in big pages.**                                                                                  |
| Typography                 | `styles/partials/fonts.css` — self-hosted (no Google Fonts): Source Sans 3 (UI/tabular), Playfair Display (Latin display), Cairo (Arabic + display in RTL). Critical subsets `<link rel=preload>`.                                                                         |
| Theme / dark mode          | `data-theme` on `<html>`; dark block `styles/partials/tokens.css:404` + `prefers-color-scheme` mirror. Persist `localStorage user_prefs.theme`. FOUC pre-init injected at build by `scripts/node/inject-theme-preinit.js` (CI-checked). Toggle in `src/components/nav.js`. |
| Global shell (JS-injected) | Pages carry **no** nav/header/footer markup. `src/components/site-shell.js` `mountSharedShell()`; parts: `nav.js` (nav+drawer+search+theme), `footer.js`, `ticker.js`, `spotBar.js`, data `nav-data.js`. Guard: `scripts/node/check-shell-guard.js`.                       |
| Global search              | `src/search/searchEngine.js` + `searchIndex.js`; UI in `nav.js` (keyboard + mobile trigger, grouped results, ARIA).                                                                                                                                                        |
| Freshness / data-status    | `src/lib/freshness-policy.js` (`evaluateFreshnessState`), `src/lib/live-status.js`, shared UI `src/lib/data-status-banner.js`, `src/components/FreshnessBadge.js`, `MarketStatusPanel.js`, `QuoteMetaPanel.js`. Contract: `docs/freshness-contract.md`.                    |
| Canonical spot resolver    | `src/lib/spot-resolver.js` (`getCanonicalSpot`, `deriveFromSpot`, `karatPerGram`) → `/data/gold_price.json` via `src/lib/api.js`. Pure math `src/lib/price-calculator.js`; metals `src/lib/metal-pricing.js`.                                                              |
| Tracker live engine        | `src/lib/realtime-pricing-engine.js` (`createRealtimePricingEngine`) + `realtime-config.js`, `realtime-poll-interval.js`, `provider-health.js`. Wired in `src/pages/tracker-pro.js`. **Do not weaken/duplicate.**                                                          |
| Pricing invariants         | `src/config/constants.js` (**AED peg 3.6725**, troy oz **31.1034768 g**) — owner-gated. Karat factors `src/config/karats.js`. UI strings `src/config/translations.js` (207KB — never hardcode UI text elsewhere).                                                          |
| Build                      | Vite (`vite.config.js`, `discoverHtmlEntries()`). Pipeline: internal-stubs→extract-baseline→normalize-shops→learn-fallback→**inject-theme-preinit**→**inject-schema**→sitemap→`vite build`. Deploy statics copied in `deploy.yml`.                                         |
| Tests                      | `tests/*.test.js` (node:test, ~195 files) + `tests/e2e/*.spec.js` (Playwright; CI runs chromium vs `dist` on :8080).                                                                                                                                                       |

## Owner-gated / do-not-touch surfaces (audit-only)

`.github/workflows/gold-price-fetch.yml`, `post_gold.yml`, `data/gold_price.json`, `sw.js`,
`src/config/constants.js` (peg/troy), karat factors/FX formulas, Supabase RLS/signup, billing, paid
APIs / new deps (advisory check + owner ask required). Never push to `main`; never force-merge red
CI. Full list: `AGENTS.md` → Operational guardrails + Overnight agent scope.

## This session's changes

- **New regression guard:** `tests/e2e/rtl-mobile-overflow.spec.js` — locks no-horizontal-overflow
  - correct `dir=rtl`/`lang=ar` at 390px for the 6 core Arabic surfaces (home, tracker, calculator,
    shops, methodology, compare). Fills a real gap: `mobile-smoke.spec.js` guarded overflow mostly
    in EN/LTR (only calculator had a forced-RTL check). Verified 6/6 green via the Playwright
    runner.
- **Governance docs:** this state doc, the skill-routing matrix, and the master revamp plan
  (`docs/revamp/2026-07-11_PREMIUM_PRODUCT_UI_UX_REVAMP.md`).

## Suggested next workstreams (evidence-based, incremental)

1. **Extend the RTL/mobile overflow guard** to the remaining public pages (learn, glossary, market,
   heatmap, portfolio, dubai-gold-price) — same proven pattern, all currently overflow-free.
2. **Codify foundational decisions as ADRs** (tokens, typography, theme, shell, freshness vocab,
   motion) so future sessions stop re-litigating settled choices. No ADR directory exists yet.
3. **Tracker offline-state polish** — the freshness badge + fallback subtitle can read as duplicated
   text in the fully-offline state; confirm intent vs. de-dupe (flagship — coordinate with any
   in-progress tracker branch first).
4. **Owner-gated growth** (alerts, signup, premium, API, AI-explanations) stays in the tracker's
   Owner-Gated Decision Queue — do not start without an owner decision.
