# Agent Phase Index — what is shipped / in-flight / parked / owner-gated

> Purpose: a single place every agent checks **before** starting work so no one duplicates a shipped
> feature, collides with an open PR, resurrects a parked lane, or edits an owner-gated file. Created
> 2026-07-07 (Phase 1 of `docs/plans/2026-07-07_30-phase-revamp.md`). Keep it current.

## How to use

1. Search this file for your feature/area first.
2. If it's **Shipped** → don't rebuild; extend or fix instead.
3. If it's **In-flight** → rebase/reconcile on top of that PR; do not redo its diff.
4. If it's **Parked** → leave it parked (owner decision required to revive).
5. If it's **Owner-gated** → audit/recommend only; never modify the file.

---

## 🟢 Shipped (do not rebuild — extend/fix only)

| Area                           | Where                                                                            | Notes                                                            |
| ------------------------------ | -------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Live pricing pipeline          | `src/lib/price-calculator.js`, `src/config/constants.js`, `src/config/karats.js` | AED peg 3.6725, troy 31.1034768 — immutable                      |
| Freshness contract             | `docs/freshness-contract.md`, `src/lib/live-status.js`, `src/lib/freshness*.js`  | live/updated/cached/delayed/stale/fallback/unavailable           |
| Methodology page               | `methodology.html`                                                               | Full formula, 5-tier fallback, AED-peg rationale, VAT-by-country |
| Calculator (5 tabs)            | `calculator.html`, `src/pages/calculator*`                                       | value/scrap/zakat/buying-power/converter; shareable URL state    |
| Tracker (command center)       | `tracker.html`, `src/tracker/*`, `styles/pages/tracker-pro.css`                  | 30-phase visual revamp complete (PR #440); DOM-safe              |
| Compare tool                   | `compare.html`, `src/pages/compare/compare-core.js`                              | BUILD 6 — sortable, hash deep-links, retail-estimate model       |
| Insights feed                  | `insights` pages, `src/lib/insights-feed-core.js`                                | BUILD 8 — category filter + masonry + search                     |
| Portfolio tracker MVP          | `portfolio.html`, `src/pages/portfolio/portfolio-core.js`                        | Roadmap item 6 — local-only, honest gain rules, 16 tests         |
| World heatmap                  | `heatmap.html`, `src/pages/heatmap/heatmap-core.js`                              | Roadmap item 7 — inline-SVG world map, no new deps, 10 tests     |
| Alert system (browser-only)    | `src/*alert*`, `gtl_alerts_v2` localStorage                                      | BUILD 10 — engine + drawer + dialog; **browser-local only**      |
| Navigation rebuild (Track B)   | `src/components/nav.js`, `nav-data.js`                                           | Command-palette search, mobile drawer, dark-mode parity          |
| Central site identity          | `src/config/site.js`, `src/config/canonical.js`                                  | drift-guard tests                                                |
| Site-wide error reporting      | `src/lib/error-reporter.js`                                                      | window error/unhandledrejection → governed analytics             |
| SEO governance / schema inject | `scripts/node/seo-governance.js`, `scripts/node/inject-schema.js`                | runs in `npm run validate`                                       |
| Security policy docs           | `SECURITY.md`, `docs/SECURITY.md`                                                | secrets inventory, rotation checklist                            |
| Dependabot / CodeQL            | `.github/dependabot.yml`, `.github/workflows/codeql.yml`                         |                                                                  |
| Lighthouse budget gate         | `lighthouserc.json`, `budget.json`                                               | a11y/best-practices/SEO ≥0.90                                    |

## 🟡 In-flight (open PRs — reconcile, do not collide)

| PR   | Branch                                         | Scope                                                                                                                                          | Reconciliation                                                             |
| ---- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| #536 | `claude/price-display-css-phase-3-n4s409`      | sitemap → committed `public/sitemap.xml`; hreflang alternates → `?lang=ar`; single generator `scripts/node/generate-sitemap.js`                | **Phase 12** rebases on top; Phase 10 adopts the `?lang=ar` hreflang model |
| #535 | `claude/product-roadmap-implementation-4oopr4` | calculator quick-preset/mode-toggle scoping; "Save to account"→"Save calculation"; shops mobile density; calculator mobile-primer desktop-hide | **Phases 5/6/23/27** scope by concern; avoid re-touching these exact edits |

## 🅿️ Parked (owner decision required to revive — do NOT resurrect)

| Lane                                       | Why parked                                                      |
| ------------------------------------------ | --------------------------------------------------------------- |
| Newsletter automation                      | Recurring cost / backend; parked                                |
| WhatsApp Business API alerts               | Recurring cost / paid API; parked (browser-local alerts remain) |
| Stripe payments / billing                  | Monetization RED zone; owner-gated                              |
| Cross-device accounts                      | Retired — calculator "save" is `localStorage` only              |
| Backend-in-production (Express admin live) | Owner gate; static site stays static                            |

## ⛔ Owner-gated files (audit/recommend only — NEVER modify)

- `.github/workflows/gold-price-fetch.yml` — price fetch cron
- `.github/workflows/post_gold.yml` — hourly X posting (production-critical)
- `sw.js` — service worker (cache correctness / offline)
- Any billing config
- Supabase RLS / signup config; **no production DB writes** (migrations may be authored as files
  only)
- Production-critical constants: `data/gold_price.json`, `src/config/constants.js` (AED peg, troy
  oz)

## Related plans (do not duplicate)

- `docs/revamp/MASTER-50-PHASE-PLAN.md` — 50-phase tracker/site program
- `docs/audits/MASTER_GOLDTICKERLIVE_WEBSITE_AUDIT_AND_20_PHASE_PLAN.md` — 20-phase audit
- `docs/plans/2026-07-04_product-roadmap.md` — 17-item product roadmap
- `docs/plans/2026-07-07_30-phase-revamp.md` — **this program**
