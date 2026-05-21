# Phase 0 — Baseline Lock (May 2026)

Baseline artifacts captured as part of the Full Site Revamp Phase 0. These files establish the
starting state for all subsequent phases.

## Contents

| File                    | Description                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------- |
| `page-inventory.json`   | Every `.html` file in the repo: path, bytes, last commit SHA, inbound link count, in-sitemap flag |
| `click-inventory.json`  | Every `<a>`, `<button>`, `<form>`, `[role="button"]`, `[data-action]` across all public pages     |
| `sitemap.xml`           | Snapshot of the sitemap at baseline (generated from `build/generateSitemap.js`)                   |
| `lighthouse/`           | Lighthouse JSON reports for 7 canonical surfaces × 2 form factors × 2 locales (EN/AR)             |
| `lighthouse-summary.md` | Human-readable Lighthouse score table with budget thresholds                                      |

## Lighthouse Status

> ⚠️ The Lighthouse reports in `lighthouse/` currently have `"status": "pending"`. Chrome cannot
> make network connections in the agent sandbox environment.
>
> **To populate real scores:** run the
> [`Phase 0 — Lighthouse Baseline Capture`](./.github/workflows/phase0-lighthouse-baseline.yml)
> workflow manually from GitHub Actions, targeting this branch.

The Lighthouse CI workflow will:

1. Build the site
2. Start a local preview server
3. Run Lighthouse (mobile + desktop) for all 7 pages in EN and AR
4. Commit the populated JSON reports back to this directory

## Regenerating inventories

```bash
# From repo root:
node scripts/node/generate-baseline-inventory.js
```

## Regenerating Lighthouse summary (after CI populates reports)

```bash
node scripts/node/generate-lighthouse-summary.js
```

## Budget Thresholds (Phase 0 → all subsequent phases)

| Metric                 | Budget                   |
| ---------------------- | ------------------------ |
| LCP                    | < 2.5 s (mobile 3G Fast) |
| CLS                    | < 0.05                   |
| TBT                    | < 200 ms                 |
| Lighthouse Performance | ≥ 90 (mobile)            |

Performance regressions against these thresholds block merge in Phase 8.

## Key Numbers (at baseline)

| Metric                             | Value                                                   |
| ---------------------------------- | ------------------------------------------------------- |
| Total HTML files                   | 659                                                     |
| Files in sitemap                   | 40                                                      |
| Total interactive elements         | 3,122                                                   |
| Elements with analytics attributes | 0 (analytics fired via JS modules, not HTML attributes) |
| Sitemap URLs                       | 214                                                     |

## Notes

- `firesAnalyticsEvent: false` on all click-inventory records is correct for this codebase:
  analytics events are dispatched via `src/lib/analytics.js` from JavaScript modules, not via
  `data-analytics` or `onclick` HTML attributes. The click inventory captures the static HTML
  surface; subsequent phases will add `data-testid` and `data-analytics` attributes to interactive
  elements as part of the Click Contract requirement.

- The 619 HTML files NOT in the sitemap are primarily:
  - Country/city/karat sub-pages with `noindex` (expected — SEO governance policy)
  - Admin pages
  - Offline/404 utility pages
