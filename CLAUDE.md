# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

> **🛑 Revamp work?** If the task is part of the homepage / nav / tracker revamp (branch
> `copilot/revamp-tracker-html-page` or successor), open and read
> [`docs/REVAMP_PLAN.md`](docs/REVAMP_PLAN.md) **before doing anything else**. That file is the
> single source of truth for the revamp's scope, commit discipline, done/pending status, and the
> update protocol. Every `report_progress` call and every merged PR on the revamp must update it in
> the same commit.
>
> **🗂️ Any new prompt / channel?** Before acting, read
> [`docs/plans/README.md`](docs/plans/README.md) and then
> [`docs/REVAMP_PLAN.md`](docs/REVAMP_PLAN.md). All plans live under `docs/`. Raw proposals from
> prompts are captured in `docs/plans/` and are **not executable** until they have been reconciled
> via the priority matrix in `docs/plans/README.md` and slotted into the master plan. If a task is
> not already in `REVAMP_PLAN.md`, stop and reconcile it first.

## Running Locally

The public site is static and can be browsed without a build for quick inspection:

```bash
python3 -m http.server 8080
# Then open http://localhost:8080
```

For the full developer experience (HMR, ES-module bundling, Vite plugins) use:

```bash
npm install
npm run dev       # Vite dev server (recommended for editing)
```

Production bundle and preview:

```bash
npm run build     # runs extract-baseline → normalize-shops → vite build → dist/
npm run preview
```

The Node/Express admin backend runs separately:

```bash
# Required env vars — server/lib/auth.js throws at startup if any is missing
export JWT_SECRET=<random 32+ char string>
export ADMIN_PASSWORD=<bcrypt-hash-able string>
export ADMIN_ACCESS_PIN=<6+ digit numeric PIN>
npm start         # node server.js — Express admin API on :3000
```

Append `?debug=true` to any page URL to enable the debug panel (simulates API failures, clears
cache, inspects live state).

## Architecture Overview

GoldPrices is a **bilingual, multi-page static front-end** (vanilla ES modules, no SPA) plus an
**optional Node/Express admin backend**. The public site is 100% static after `npm run build`; the
server is only required for the admin surface.

- **Front-end build:** Vite 8 bundles HTML + ES modules from repo root into `dist/`. Pre-build Node
  scripts (`scripts/node/extract-baseline.js`, `scripts/node/normalize-shops.js`) seed data files
  that are then consumed at runtime.
- **Front-end runtime:** vanilla ES6 modules under `src/`, loaded directly by each page's HTML.
- **Admin backend:** Express 5 app in `server.js` + `server/` (auth via JWT + bcrypt, Helmet CSP,
  `express-rate-limit`, `lowdb` JSON store). Mounted at `/api/*` and `/admin/*`.
- **Deploy:** `.github/workflows/deploy.yml` runs `npm ci` → `npm run build` → publishes `dist/` to
  GitHub Pages. The admin server is **not** deployed via Pages — it is self-hosted or run inside a
  dedicated environment.

### Data Flow (public pages)

```
HTML page
  → page-specific JS (src/pages/home.js, src/pages/tracker-pro.js, src/pages/calculator.js, …)
    → src/lib/ (api.js → cache.js → price-calculator.js → formatter.js → safe-dom.js)
    → src/config/ (constants, countries, karats, translations)
    → src/components/ (nav, footer, ticker, chart, breadcrumbs)
      → External APIs (gold-api.com for XAU/USD, exchangerate-api.com for FX)
```

### Key Modules

| Path                            | Role                                                                                                                                      |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `src/config/constants.js`       | API URLs, timeouts, refresh interval (90 s), cache key names, AED peg (3.6725), troy-oz divisor                                           |
| `src/config/countries.js`       | 24+ countries with codes, names (EN/AR), currencies, flags, regional groups, peg flags                                                    |
| `src/config/karats.js`          | 7 karat definitions (24K–14K) with purity fractions and EN/AR labels                                                                      |
| `src/config/translations.js`    | All UI strings in English and Arabic                                                                                                      |
| `src/lib/api.js`                | Fetch with timeout, retry, and simulation hooks for gold price and FX rates                                                               |
| `src/lib/cache.js`              | Dual-layer localStorage persistence (primary + fallback) with stale recovery                                                              |
| `src/lib/price-calculator.js`   | Core formulas: `usdPerGram(karat) = (spotUsdPerOz / 31.1035) × purity`; local price = USD × FX rate                                       |
| `src/lib/formatter.js`          | Price, date, time, and label formatting                                                                                                   |
| `src/lib/export.js`             | CSV / JSON / brief export generators                                                                                                      |
| `src/lib/safe-dom.js`           | Canonical escape/safeHref/safeTel/el helpers — the single allowed home for `innerHTML`                                                    |
| `src/lib/historical-data.js`    | Merges session history with DataHub baseline dataset                                                                                      |
| `src/lib/search.js`             | Bilingual (EN/AR) search and filtering                                                                                                    |
| `src/tracker/state.js`          | Tracker workspace state (mode, currency, karat, range, alerts, presets, favorites); synced to URL hash (`#mode=live&cur=AED&k=24&u=gram`) |
| `src/tracker/ui-shell.js`       | UI orchestration for the tracker page                                                                                                     |
| `src/components/nav.js`         | Bilingual navigation bar — consumes `src/components/nav-data.js`                                                                          |
| `src/components/nav-data.js`    | Nav IA: solo links (home, shops) + groups (prices, tools, learn, more) in EN + AR                                                         |
| `src/components/chart.js`       | Interactive price chart                                                                                                                   |
| `server/lib/auth.js`            | JWT + bcrypt auth for admin; requires `JWT_SECRET`, `ADMIN_PASSWORD`, `ADMIN_ACCESS_PIN`                                                  |
| `server/lib/circuit-breaker.js` | CLOSED→OPEN→HALF_OPEN breaker for upstream API calls                                                                                      |
| `data/shops.js`                 | Hardcoded shop reference data                                                                                                             |

### Security / DOM Safety

- **Never add new `innerHTML`, `outerHTML`, `insertAdjacentHTML`, or `document.write` call sites
  without updating the baseline in `scripts/node/check-unsafe-dom.js`.** The regression guard
  (`npm run validate` → `check-unsafe-dom`) counts sinks per file; new sinks fail CI.
- Use helpers from `src/lib/safe-dom.js` (`escape`, `safeHref`, `safeTel`, `el`, `clear`) when you
  need to build HTML from untrusted data. For empty-clear use `node.replaceChildren()`, not
  `node.innerHTML = ''`.
- Admin pages under `admin/` never store raw API keys in localStorage — secrets flow through server
  routes only.

### State Management

- **Homepage** (`index.html` / `src/pages/home.js`): global `STATE` object in `app.js`
- **Tracker** (`tracker.html` / `src/pages/tracker-pro.js`): `src/tracker/state.js` module; state
  also serialised into the URL hash for shareability
- **Persistence**: `src/lib/cache.js` wraps `localStorage` for gold price, FX rates, history, and
  user preferences

### Resilience

- Dual cache layers (primary + fallback) prevent data loss on storage errors
- API failures degrade gracefully — stale-data badges shown, last-known values used
- Service worker (`sw.js`) serves static assets cache-first and API calls network-first for offline
  support
- AED is always computed using the hardcoded peg (3.6725) regardless of FX API response

### Bilingual / RTL Support

- All user-visible strings come from `src/config/translations.js` (never hard-code UI text)
- Arabic locale flips layout direction via RTL CSS; `src/config/countries.js` carries both EN and AR
  country names

### Adding a New Country

1. Add an entry to `src/config/countries.js` (code, names, currency, group, decimals, peg flag if
   applicable)
2. Create `countries/<slug>/index.html` — follow an existing country page as a template; it uses
   `src/pages/country-page.js` / `styles/country-page.css`
3. Update `sitemap.xml` and the navigation in `src/components/nav.js` if the page should appear in
   menus

### External Data Sources

| Source               | Used for                                |
| -------------------- | --------------------------------------- |
| gold-api.com         | Live XAU/USD spot price (~90 s refresh) |
| exchangerate-api.com | Currency conversion rates               |
| datahub.io           | Historical baseline dataset             |
| GDELT DOC API        | Market news headlines                   |

### Tests / Lint / Validate / Build

- `npm test` — runs 231+ Node `node:test` suites under `tests/*.test.js`. Requires `JWT_SECRET`,
  `ADMIN_PASSWORD`, `ADMIN_ACCESS_PIN` env vars (server/lib/auth.js throws at startup otherwise).
- `npm run validate` — runs `scripts/node/validate-build.js` (HTML integrity + module imports) and
  `scripts/node/check-unsafe-dom.js` (DOM-sink regression guard).
- `npm run lint` — ESLint over all JS/MJS via the flat config `eslint.config.mjs`.
- `npm run quality` — lint + `prettier --check` + stylelint.
- `npm run build` — full Vite build.

### Workflows

Key `.github/workflows/` entries:

- `ci.yml` — tests, lint, validate on every push/PR.
- `deploy.yml` — `npm ci` → `npm run build` → publish `dist/` to GitHub Pages.
- `codeql.yml` — JavaScript/TypeScript code scanning.
- `semgrep.yml` — complementary static analysis.
- `lighthouse.yml`, `perf-check.yml` — performance monitoring.
- `post_gold.yml`, `daily-newsletter.yml`, `weekly-newsletter.yml`, `spike_alert.yml`,
  `uptime-monitor.yml`, `health_check.yml`, `sync-db-to-git.yml` — scheduled content / ops jobs.
