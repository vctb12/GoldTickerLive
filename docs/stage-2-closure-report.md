# Stage 2 closure report

_Product/shared-layer work (shell, price-data state, trust, deploy durability). Concise
evidence-based closeout. Date: 2026-07-11._

## What Stage 2 delivered

Stage 2 transformed the layer **between** pages: shared shell, a single honest price-state
contract, a trust/provenance surface, and deploy durability — on top of the Stage-1 page
redesigns. Shipped, deployed, and live-verified this program:

| Area | PRs | Outcome |
| --- | --- | --- |
| Shell: nav a11y / search / footer / dark mode | #653–#656 | Inert drawer, bilingual search, grouped footer, cohesive dark theme |
| Freshness consistency (ticker fed everywhere) | #657 | Content pages stopped showing "Unavailable" while tools showed a price |
| Content-page transforms (methodology, glossary) | #658–#660 | Premium bilingual trust pages, full EN/AR parity |
| **Price-flow map + visibility-aware polling** | **#661** | `docs/price-flow-map.md`; market/dubai/shops/invest no longer poll a hidden tab |
| **Deploy durability (post-deploy smoke + build-info)** | **#663** | Live commit-match + route/snapshot smoke auto-runs after every deploy; "merged ≠ deployed until verified live" |
| **Market-closed overlay consistency (honesty fix)** | **#665** | 5 surfaces + calc note no longer read "Live" while the market is closed |
| **Trust layer pilot ("About this price")** | **#668** | Unified provenance control (source/basis/spot-vs-retail/methodology) piloted on compare |
| **Stage-2 closure a11y fix (`edu-tag--medium`)** | this PR | Education-table tag now AA (was 4.36:1) |

## Closure audit — evidence

**Repo gate (`main`):** `npm run lint` = 0 · `npm run validate` = 0 · `npm test` = **1618 pass / 0 fail** · `npm run build` = 0, no unexpected HTML mutations.

**Production sweep** (12 key pages × EN/AR × mobile 390 + desktop 1280, Playwright):
- Console errors: **NONE** (benign 3rd-party/pre-existing shop-listings 404 excluded).
- Horizontal overflow: **NONE**.
- axe (wcag2a/2aa, serious/critical) on home/compare/calculator/methodology × light+dark:
  **1 finding** — `compare[light]` 8× `color-contrast` on the shared `.edu-tag--medium`
  education-table tag (#a0671c = 4.36:1, pre-existing, unrelated to the trust component which was
  independently axe-clean). **Fixed in this PR** (switched to the `--color-warning-text` token,
  6.2:1 light / unchanged dark).

**Deploy verified:** live `build-info.json` commit matches `main`; the `Post-deploy smoke` workflow
auto-runs after each deploy and passed with `✓ commit-match` on every Stage-2 deploy.

**Data states:** freshness vocabulary is centralized (live/cached/delayed/estimated/stale/
fallback/closed/unavailable); the market-closed overlay is now mandatory and applied on **every**
non-Tracker price surface (guarded by `tests/market-closed-overlay-coverage.test.js`); the Tracker's
own multi-tier live engine is deliberately preserved.

## Invariants held throughout

AED peg 3.6725 · troy oz 31.1035 · karat purity = code/24 · spot ≠ retail · honest freshness · no
fabricated data. All calculations deterministic. Tracker engine untouched.

## Known, tracked follow-ups (not blockers)

- Roll `priceProvenance` out to portfolio/heatmap; consolidate scattered inline trust copy on
  home/calculator/dubai into it (pattern in `docs/price-flow-map.md` §5).
- `shops.html` emits one pre-existing Supabase `shop_listings` 404 (expected on static Pages;
  falls back to committed data). Cosmetic console noise only.

## Verdict

**Stage 2 is closed.** Shell, price-state contract, trust pilot, and deploy durability are live and
verified; the closure sweep is clean after the one a11y fix in this PR. Next: **Stage 3** (market
dashboard, price-change explainability, country-page canonicalization, tool polish, PWA resilience,
data-quality monitoring, SEO/perf/a11y, alert/API foundations behind mocks).
