# Repos to Steal From — Gold Ticker Live

> Curated catalog of external GitHub repos worth **using**, **forking**, or **studying** for
> GoldTickerLive. One row per clear problem. Check LICENSE before copying code.
>
> **Rule:** if a repo solves one clear GTL problem, it is useful; if it is just “cool,” skip it.

**Modes**

| Mode      | Action                                                   |
| --------- | -------------------------------------------------------- |
| **use**   | Copy a narrow module or pattern (chart, table, alert UX) |
| **fork**  | Keep evolving a close architecture (admin, CI)           |
| **study** | UX flow, file layout, ideas only — no direct import      |

---

## Catalog

| Repo                                                                                | Feature worth copying                          | License              | Confidence | Mode        | Notes                                                                                      |
| ----------------------------------------------------------------------------------- | ---------------------------------------------- | -------------------- | ---------- | ----------- | ------------------------------------------------------------------------------------------ |
| [tradingview/lightweight-charts](https://github.com/tradingview/lightweight-charts) | Canvas price charts, time scales, crosshair    | Apache-2.0           | High       | study → use | GTL already has `src/components/chart.js`; compare API before replacing. Vanilla-friendly. |
| [chartjs/Chart.js](https://github.com/chartjs/Chart.js)                             | Simple line/bar charts, plugins                | MIT                  | Medium     | study       | Heavier than needed for tracker sparklines; good reference for accessibility labels.       |
| [pa11y/pa11y-ci](https://github.com/pa11y/pa11y-ci)                                 | CLI a11y gate in CI                            | LGPL-3.0             | High       | use         | Already wired via `npm run a11y` + `.pa11yci.js`. Extend URL list, do not fork.            |
| [GoogleChrome/lighthouse-ci](https://github.com/GoogleChrome/lighthouse-ci)         | LHCI autorun + artifact upload                 | Apache-2.0           | High       | use         | Pattern in `.github/workflows/lighthouse.yml`.                                             |
| [JustinBeckwith/linkinator](https://github.com/JustinBeckwith/linkinator)           | Recursive link crawl JSON reports              | Apache-2.0           | High       | use         | Already in `package.json` (`linkcheck:dist`).                                              |
| [actions/starter-workflows](https://github.com/actions/starter-workflows)           | CI/CD YAML patterns, permissions, concurrency  | MIT                  | High       | study       | Reference when adding workflows; pin SHAs like existing repo convention.                   |
| [github/docs](https://github.com/github/docs)                                       | Issue/PR templates, workflow docs structure    | CC-BY-4.0            | Medium     | study       | Template wording and `config.yml` patterns only.                                           |
| [goldprice-org/goldprice.org](https://github.com/goldprice-org/goldprice.org)       | Competitor IA — hero price, karat tables       | Unknown / check site | Low        | study       | No code copy; UX benchmark for “reference terminal” feel.                                  |
| [supabase/supabase](https://github.com/supabase/supabase)                           | Admin auth, RLS patterns, JS client usage      | Apache-2.0           | Medium     | study       | GTL admin uses Supabase OAuth; read examples, do not import dashboard.                     |
| [Leaflet/Leaflet](https://github.com/Leaflet/Leaflet)                               | Map pins for shops directory                   | BSD-2-Clause         | High       | use         | BUILD 7 map already lazy-loads Leaflet CDN; borrow marker cluster pattern if needed.       |
| [floating-ui/floating-ui](https://github.com/floating-ui/floating-ui)               | Tooltip/dropdown positioning without framework | MIT                  | Medium     | study       | Useful if nav drawer/tooltips need collision detection; vanilla compatible.                |
| [zloirock/core-js](https://github.com/zloirock/core-js)                             | Polyfills                                      | MIT                  | Low        | study       | GTL targets modern browsers; avoid unless analytics require legacy.                        |
| [vitejs/vite](https://github.com/vitejs/vite)                                       | Static MPA build, preview server               | MIT                  | High       | use         | Already the build tool; read docs for `build.rollupOptions` when splitting chunks.         |
| [expressjs/express](https://github.com/expressjs/express)                           | Admin API patterns (Helmet, rate limit)        | MIT                  | High       | study       | `server.js` already follows this stack; reference security middleware ordering.            |
| [prettier/prettier](https://github.com/prettier/prettier)                           | Format gate                                    | MIT                  | High       | use         | `npm run quality` — no fork.                                                               |
| [eslint/eslint](https://github.com/eslint/eslint)                                   | Lint flat config                               | MIT                  | High       | use         | `eslint.config.mjs` — extend rules, do not fork.                                           |

---

## Workflow repos (CI / quality)

| Repo                                                                          | Feature worth copying      | License    | Confidence | Mode  | Notes                                                           |
| ----------------------------------------------------------------------------- | -------------------------- | ---------- | ---------- | ----- | --------------------------------------------------------------- |
| [treosh/lighthouse-ci-action](https://github.com/treosh/lighthouse-ci-action) | LHCI GitHub Action wrapper | Apache-2.0 | Medium     | study | GTL uses CLI directly; compare if simplifying `lighthouse.yml`. |
| [lycheeverse/lychee](https://github.com/lycheeverse/lychee)                   | Fast link checker (Rust)   | MIT        | Medium     | study | Alternative to linkinator; would need new baseline migration.   |
| [microsoft/playwright](https://github.com/microsoft/playwright)               | E2E smoke tests            | Apache-2.0 | High       | use   | `playwright.config.js` + `ci.yml` e2e job.                      |

---

## UI / design system (study — no full template swap)

| Repo                                                                    | Feature worth copying          | License | Confidence | Mode  | Notes                                                               |
| ----------------------------------------------------------------------- | ------------------------------ | ------- | ---------- | ----- | ------------------------------------------------------------------- |
| [tailwindlabs/tailwindcss](https://github.com/tailwindlabs/tailwindcss) | Utility token thinking         | MIT     | Low        | study | GTL uses `styles/global.css` tokens — borrow naming, not framework. |
| [primer/css](https://github.com/primer/css)                             | Design tokens, contrast        | MIT     | Medium     | study | Reference for `--color-*` scale audits.                             |
| [shadcn-ui/ui](https://github.com/shadcn-ui/ui)                         | Component composition patterns | MIT     | Low        | study | React-only; study card/dialog UX, reimplement in vanilla.           |

---

## How to add a row

1. Name **one** GTL problem the repo solves (e.g. “alert toast UX”, not “nice dashboard”).
2. Verify LICENSE on the repo’s default branch.
3. Set confidence: **High** = used in production elsewhere at scale; **Medium** = plausible fit;
   **Low** = speculative.
4. Prefer **study** until a spike PR proves fit.
5. Open a PR updating this file only — no drive-by dependency adds.

---

## Related docs

- [`docs/plans/2026-06-09_github-control-center-setup.md`](./plans/2026-06-09_github-control-center-setup.md)
- [`.github/workflows/README.md`](../.github/workflows/README.md)
- [`prompts/master-rerun.md`](../prompts/master-rerun.md)
