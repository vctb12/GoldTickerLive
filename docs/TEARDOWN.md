<div align="center">

# 🏗️ GoldPrices — Complete Technical Teardown

### The Definitive Guide to Every File, System, and Decision in This Repository

**Version 2.0** · Last Updated: April 2026

---

_This document is written for engineers joining the project, reviewing the codebase, or planning new
features. It covers every file, every system, every limitation, and a complete roadmap for taking
this site from static prototype to production._

</div>

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture at a Glance](#2-architecture-at-a-glance)
3. [Repository Map — Every File Explained](#3-repository-map--every-file-explained)
   - [Root Configuration Files](#31-root-configuration-files)
   - [Core Libraries (`src/lib/`)](#32-core-libraries-srclib)
   - [Components (`src/components/`)](#33-components-srccomponents)
   - [Configuration (`src/config/`)](#34-configuration-srcconfig)
   - [Services Layer (`src/services/`)](#35-services-layer-srcservices)
   - [Page Scripts (`src/pages/`)](#36-page-scripts-srcpages)
   - [Tracker Module (`src/tracker/`)](#37-tracker-module-srctracker)
   - [Utilities & Routing (`src/utils/`, `src/routes/`)](#38-utilities--routing-srcutils-srcroutes)
   - [Build & Generation (`build/`, `scripts/`)](#39-build--generation-build-scripts)
   - [Stylesheets (`styles/global.css`, `styles/`)](#310-stylesheets-stylesglobalcss-styles)
   - [HTML Pages](#311-html-pages)
   - [Country Leaf Pages (SEO Pages)](#312-country-leaf-pages-seo-pages)
   - [Admin Panel (`admin/`)](#313-admin-panel-admin)
   - [Data & Storage (`data/`, `supabase/`)](#314-data--storage-data-supabase)
   - [Search (`content/search/`)](#315-search-contentsearch)
   - [Social & Embed (`content/social/`, `content/embed/`)](#316-social--embed-contentsocial-contentembed)
   - [Server (`server.js`, `server/`)](#317-server-serverjs-server)
   - [Tests (`tests/`)](#318-tests-tests)
   - [CI/CD Workflows (`.github/workflows/`)](#319-cicd-workflows-githubworkflows)
   - [Documentation (`docs/`)](#320-documentation-docs)
4. [Data Flow — How Prices Move Through the System](#4-data-flow--how-prices-move-through-the-system)
5. [Quick Reference: "I Want to Edit X"](#5-quick-reference-i-want-to-edit-x)
6. [Known Limitations & Technical Debt](#6-known-limitations--technical-debt)
7. [Production Readiness Guide](#7-production-readiness-guide)
8. [Moving Beyond Static: Server-Side Architecture Guide](#8-moving-beyond-static-server-side-architecture-guide)
9. [Commands Reference](#9-commands-reference)

---

## 1. Executive Summary

**GoldPrices** is a bilingual (English/Arabic) gold pricing platform serving 15 countries across the
GCC, Levant, North Africa, and India. It provides:

- **Live spot-linked pricing** (refreshed every 90 seconds via gold-api.com)
- **24+ currency conversions** (via exchangerate-api.com)
- **7 karat grades** (24K, 22K, 21K, 18K, 14K, 12K, 10K)
- **380+ SEO-optimized pages** (country → city → karat → shops)
- **Interactive tools** (calculator, weight converter, zakat calculator, investment ROI)
- **Live tracker workspace** (charts, alerts, exports, GCC comparison)
- **Shop directory** (Supabase-backed with admin CRUD)
- **Full RTL Arabic support** with language toggle on every page
- **PWA support** with service worker for offline use

### Tech Stack

| Layer        | Technology                                                  |
| ------------ | ----------------------------------------------------------- |
| **Frontend** | Vanilla ES6 modules, zero framework dependency              |
| **Styling**  | Custom CSS with design tokens, dark mode, RTL support       |
| **Build**    | Vite 8 (for bundled pages), raw ES modules (for leaf pages) |
| **Hosting**  | GitHub Pages (static), optional Express server              |
| **Database** | Supabase (PostgreSQL) for shops + admin data                |
| **Auth**     | Supabase GitHub OAuth for admin panel                       |
| **CI/CD**    | GitHub Actions (build, deploy, tweet, health checks)        |
| **Testing**  | Node.js built-in test runner (205 tests)                    |

### Key Metrics

| Metric                                    | Count               |
| ----------------------------------------- | ------------------- |
| Total files (excluding node_modules/dist) | ~586                |
| HTML pages                                | ~380                |
| JavaScript modules                        | ~90                 |
| CSS files                                 | ~16                 |
| Test files                                | 10 (205 test cases) |
| CI/CD workflows                           | ~16                 |
| Countries covered                         | 15                  |
| Cities covered                            | 50+                 |

---

## 2. Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER                                  │
│                                                                 │
│  ┌──────────┐    ┌──────────────┐    ┌───────────────────────┐  │
│  │ HTML     │───▶│ Page Script  │───▶│ Core Libraries        │  │
│  │ Pages    │    │ (home.js,    │    │ ├── api.js            │  │
│  │          │    │  tracker.js, │    │ ├── cache.js          │  │
│  │          │    │  calc.js)    │    │ ├── price-calculator  │  │
│  │          │    └──────┬───────┘    │ ├── formatter.js      │  │
│  │          │           │            │ └── historical-data   │  │
│  │          │           ▼            └───────────────────────┘  │
│  │          │    ┌──────────────┐    ┌───────────────────────┐  │
│  │          │    │ Components   │    │ Config                │  │
│  │          │    │ ├── nav.js   │    │ ├── constants.js      │  │
│  │          │    │ ├── footer   │    │ ├── countries.js      │  │
│  │          │    │ ├── ticker   │    │ ├── karats.js         │  │
│  │          │    │ └── chart    │    │ └── translations.js   │  │
│  │          │    └──────────────┘    └───────────────────────┘  │
│  └──────────┘                                                   │
│       │              ┌──────────────────────────┐               │
│       │              │ External APIs             │               │
│       └─────────────▶│ ├── gold-api.com (XAU)   │               │
│                      │ ├── er-api.com (FX)       │               │
│                      │ └── DataHub (historical)  │               │
│                      └──────────────────────────┘               │
│                                                                 │
│  ┌──────────────────────────────────┐                           │
│  │ Browser Storage                  │                           │
│  │ ├── localStorage (dual-layer)    │                           │
│  │ └── Service Worker (sw.js)       │                           │
│  └──────────────────────────────────┘                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  OPTIONAL: Express Server (server.js)                           │
│  ├── Helmet security headers                                    │
│  ├── JWT admin auth (lib/auth.js)                               │
│  ├── /api/admin/* routes                                        │
│  └── Repositories → Supabase / file-based                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  CI/CD: GitHub Actions                                          │
│  ├── Build & deploy to GitHub Pages                             │
│  ├── Hourly gold price tweets (@GoldTickerLive)                 │
│  ├── Price spike alerts (Discord/Telegram)                      │
│  ├── Weekly broken-link checks                                  │
│  └── Health monitoring (every 30 min)                           │
└─────────────────────────────────────────────────────────────────┘
```

### Two Build Paths

The repo has a **dual delivery model**:

1. **Vite-bundled pages** — Root-level HTML pages (`index.html`, `calculator.html`, `tracker.html`,
   etc.) are processed by Vite, which bundles and minifies JS/CSS with content hashes.

2. **Raw ES module pages** — Country leaf pages (`countries/uae/dubai/gold-prices/index.html`, etc.)
   are served as-is. They load `src/lib/page-hydrator.js` which imports raw ES modules at runtime.
   These are copied verbatim by the deploy workflow.

**Why?** The leaf pages use top-level `await` and dynamic imports that Vite can't bundle
efficiently. The deploy workflow copies `src/lib/`, `src/config/`, `src/components/`, `data/`, and
`styles/` to `dist/` for these pages to consume.

---

## 3. Repository Map — Every File Explained

### 3.1 Root Configuration Files

| File                   | Purpose                                         | When to Edit                                   |
| ---------------------- | ----------------------------------------------- | ---------------------------------------------- |
| `package.json`         | npm dependencies, scripts, metadata             | Adding dependencies, changing build commands   |
| `vite.config.js`       | Vite bundler: entry points, chunking, base path | Changing build behavior, adding/removing pages |
| `eslint.config.mjs`    | ESLint flat config for JS linting               | Changing code style rules                      |
| `.prettierrc.json`     | Prettier formatting (tabs, quotes, line width)  | Changing formatting preferences                |
| `.stylelintrc.json`    | CSS linting rules                               | Changing CSS conventions                       |
| `.gitignore`           | Git ignore patterns                             | Adding new build artifacts                     |
| `.htaccess`            | Apache redirects & caching rules                | Adding URL redirects                           |
| `.nvmrc`               | Node.js version (24)                            | Upgrading Node                                 |
| `.nojekyll`            | Prevents GitHub Pages Jekyll processing         | Never                                          |
| `.replit`              | Replit deployment config                        | Only if using Replit                           |
| `manifest.json`        | PWA manifest (app name, icons, theme)           | Changing app name, icons                       |
| `robots.txt`           | Search engine crawler rules                     | Blocking/allowing crawlers                     |
| `sitemap.xml`          | Auto-generated site map                         | Generated by `npm run generate-sitemap`        |
| `feed.xml`             | Auto-generated RSS feed                         | Generated by build scripts                     |
| `favicon.svg`          | Site favicon (SVG format)                       | Changing site icon                             |
| `sw.js`                | Service worker (offline caching)                | Changing cache strategy                        |
| `server.js`            | Express server entry point                      | Changing server config, adding API routes      |
| `playwright.config.js` | E2E test configuration                          | Changing test browser settings                 |

### Root-Level Markdown

| File              | Purpose                                |
| ----------------- | -------------------------------------- |
| `README.md`       | Project overview, badges, feature list |
| `AGENTS.md`       | Instructions for AI coding agents      |
| `CLAUDE.md`       | Claude AI context file                 |
| `CHANGELOG.md`    | Version history                        |
| `CONTRIBUTING.md` | Contribution guidelines                |
| `DEPENDENCIES.md` | Dependency documentation               |
| `ADMIN_GUIDE.md`  | Admin panel usage guide                |
| `ADMIN_SETUP.md`  | Admin setup instructions               |
| `LICENSE`         | Open-source license                    |
| `replit.md`       | Replit deployment guide                |

---

### 3.2 Core Libraries (`src/lib/`)

These are the heart of the application — shared modules imported by every page.

| File                               | Lines   | What It Does                                                                                                                                                                | Key Exports                                                                                  |
| ---------------------------------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `src/lib/api.js`                   | ~136    | Fetches gold spot price (XAU/USD) and FX rates with timeout, retry, and simulation hooks. Multi-provider: primary gold-api.com, fallback goldprice.org.                     | `fetchGold()`, `fetchFX()`, `setSimulateGoldFailure()`, `setSimulateFXFailure()`             |
| `src/lib/cache.js`                 | ~193    | Dual-layer localStorage cache with TTL (time-to-live). Primary + fallback keys prevent data loss on storage errors. Stale recovery returns expired data when API fails.     | `get(key)`, `set(key, value, ttl)`, `clear()`, `showStorageQuotaWarning()`                   |
| `src/lib/price-calculator.js`      | ~63     | Core pricing formulas. `usdPerGram(karat) = (spotUsdPerOz / 31.1035) × purity`. Local price = USD × FX rate.                                                                | `usdPerGram(spot, karat)`, `localPerGram(spot, karat, fxRate)`                               |
| `src/lib/formatter.js`             | ~142    | Formats prices with currency symbols, decimal places, and locale. Also formats dates, times, and karat labels for both EN and AR.                                           | `formatPrice(value, currency, lang)`, `formatDate()`, `formatKarat()`, `formatCountryName()` |
| `src/lib/historical-data.js`       | ~286    | Merges session price history with a baseline DataHub dataset. Provides historical ranges for charting.                                                                      | `fetchGoldHistory()`, `getHistoricalRange(period)`                                           |
| `src/lib/export.js`                | ~393    | Generates downloadable CSV and JSON files from current price data. Supports brief (summary) and full (all karats × countries) exports.                                      | `exportToCSV(data)`, `exportToJSON(data)`                                                    |
| `src/lib/page-hydrator.js`         | ~170    | **Critical for leaf pages.** Hydrates static HTML templates with live gold prices. Reads `data-country`, `data-city`, `data-karat` attributes and populates price elements. | `hydratePage()`                                                                              |
| `src/lib/search.js`                | ~12     | Lightweight client-side page search. Builds an index from page metadata.                                                                                                    | `buildSearchIndex()`                                                                         |
| `src/lib/errors.js`                | ~149    | Custom error classes (`ValidationError`, `DataError`, `NetworkError`) with a global error handler.                                                                          | `ValidationError`, `DataError`, `errorHandler()`                                             |
| `server/lib/auth.js`               | ~277    | JWT-based authentication for admin panel. Login, logout, token storage, and `fetchWithAuth()` wrapper.                                                                      | `login()`, `logout()`, `isAuthed()`, `fetchWithAuth()`                                       |
| `server/lib/audit-log.js`          | ~161    | Client-side audit trail. Logs admin actions and syncs to Supabase or file backend.                                                                                          | `logAction()`, `flushAuditLog()`                                                             |
| `server/lib/supabase-client.js`    | ~64     | Supabase JS client wrapper. Creates and caches a Supabase client instance.                                                                                                  | `getSupabaseClient()`                                                                        |
| `src/lib/supabase-data.js`         | ~72     | Query builders for Supabase tables. Fetches verified shops, maps snake_case → camelCase.                                                                                    | `fetchShops()`, `insertAuditLog()`                                                           |
| `server/lib/admin/shop-manager.js` | ~varies | Server-side shop CRUD operations. Used by Express API routes.                                                                                                               | `addShop()`, `editShop()`, `deleteShop()`, `getShops()`                                      |

---

### 3.3 Components (`src/components/`)

Shared UI components injected into pages at runtime via JavaScript.

| File                              | Lines | What It Does                                                                                                                                                             | API                                                                                                                    |
| --------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `src/components/nav.js`           | ~683  | **Main navigation.** Premium bilingual nav with desktop dropdowns and mobile off-canvas drawer. Handles active states, depth-based href resolution, keyboard navigation. | `injectNav(lang, depth)` → returns controller with `getLangToggleButtons()`. `updateNavLang(lang)` for live switching. |
| `src/components/nav-data.js`      | ~189  | Navigation menu data in EN and AR. Defines all dropdown groups (Markets, Tools, Cities, Learn, Insights) with hrefs and labels.                                          | `NAV_DATA` object with `en` and `ar` keys.                                                                             |
| `src/components/footer.js`        | ~143  | 5-column footer with brand, markets, tools, GCC prices, and regional links. Handles depth-based href resolution and language switching.                                  | `injectFooter(lang, depth)`                                                                                            |
| `src/components/ticker.js`        | ~176  | Live price ticker bar at the top of each page. Shows current XAU/USD spot and selected currency.                                                                         | `injectTicker()`, `updateTicker(data)`, `updateTickerLang(lang)`                                                       |
| `src/components/chart.js`         | ~238  | Interactive price chart wrapper around TradingView's Lightweight Charts library.                                                                                         | `createChart(container, data, options)`                                                                                |
| `src/components/breadcrumbs.js`   | ~131  | Auto-generates breadcrumb navigation based on current URL path.                                                                                                          | `injectBreadcrumbs(lang, crumbs)`                                                                                      |
| `src/components/internalLinks.js` | ~86   | Renders "Related Pages" links section for SEO cross-linking.                                                                                                             | `renderRelatedLinks(links, container)`                                                                                 |
| `src/components/adSlot.js`        | ~105  | Google AdSense slot injector.                                                                                                                                            | `renderAdSlot(containerId, slotId)`                                                                                    |

---

### 3.4 Configuration (`src/config/`)

| File                         | What It Defines                                                                                                  |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `src/config/constants.js`    | `TROY_OZ_GRAMS = 31.1035`, `AED_PEG = 3.6725`, API URLs, cache TTLs, refresh interval (90s), all cache key names |
| `src/config/countries.js`    | Array of 15+ country objects: `{ code, name: {en, ar}, currency, flag, group, decimals, isPegged }`              |
| `src/config/karats.js`       | Array of 7 karat objects: `{ code: '24K', purity: 1.0, label: {en, ar} }` down to 14K                            |
| `src/config/translations.js` | All UI strings in EN/AR: button labels, status messages, error messages, section headings                        |
| `src/config/supabase.js`     | Supabase project URL and anon key (public, safe for client-side)                                                 |
| `src/config/index.js`        | Central re-export: `export { CONSTANTS, BASE_PATH, KARATS, COUNTRIES, TRANSLATIONS }`                            |
| `config/twitter_bot/*.json`  | Tweet templates, karat weights, market session times, alert thresholds                                           |

---

### 3.5 Services Layer (`src/services/`)

Higher-level abstraction over `src/lib/api.js`. Used by newer code paths.

| File                               | What It Does                                                                                                                     |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `src/services/goldPriceService.js` | Multi-provider gold spot price fetcher. Primary: gold-api.com, fallback: goldprice.org. Returns `{ price, updatedAt }`.          |
| `src/services/fxService.js`        | Multi-provider FX rate fetcher. Primary: exchangerate-api.com, fallback: openexchangerates.org. Returns currency rate map.       |
| `src/services/apiAdapter.js`       | Shared HTTP client with retry logic, timeout handling, and typed errors (`DataError`, `NetworkError`).                           |
| `src/services/pricingEngine.js`    | Single-source-of-truth price calculator. Takes spot USD/oz + FX rates → outputs keyed prices for all country×karat combinations. |

---

### 3.6 Page Scripts (`src/pages/`)

Each HTML page has a corresponding entry-point JS module:

| Script                     | HTML Page          | What It Does                                                                                                                                               |
| -------------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/pages/home.js`        | `index.html`       | Initializes hero price card, GCC quick-price grid, trend arrows, ticker, nav, footer. Auto-refreshes every 90s.                                            |
| `src/pages/calculator.js`  | `calculator.html`  | 5-tab calculator: gold value, scrap gold, zakat, buying power, weight converter. Live price integration.                                                   |
| `src/pages/tracker-pro.js` | `tracker.html`     | Full workspace: imports `src/tracker/state.js`, `src/tracker/events.js`, `src/tracker/render.js`. Manages modes (live, compare, archive, exports, alerts). |
| `src/pages/shops.js`       | `shops.html`       | Shop directory with filtering by country/city/specialty. Fetches from Supabase with fallback to hardcoded `data/shops.js`.                                 |
| `src/pages/insights.js`    | `insights.html`    | Market analysis page with "Why Gold Moved Today", weekly brief, and news feed (GDELT API).                                                                 |
| `src/pages/learn.js`       | `learn.html`       | Educational content page with FAQ accordion.                                                                                                               |
| `src/pages/methodology.js` | `methodology.html` | Data transparency page explaining price sources and calculation methods.                                                                                   |
| `src/pages/privacy.js`     | `privacy.html`     | Privacy policy page (static content + nav/footer injection).                                                                                               |
| `src/pages/terms.js`       | `terms.html`       | Terms of service page (static content + nav/footer injection).                                                                                             |

---

### 3.7 Tracker Module (`src/tracker/`)

The tracker is the most complex subsystem — a full workspace application within the site.

| File                      | Lines   | Responsibility                                                                                                                                                                                                             |
| ------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/tracker/state.js`    | ~8,230  | Redux-like state management. Tracks current mode (live/compare/archive), selected currency, karat, time range, alerts, presets, watchlist. Syncs state to URL hash (`#mode=live&cur=AED&k=24&u=gram`) for shareable links. |
| `src/tracker/events.js`   | ~11,282 | Event dispatcher. Handles mode switches, alert creation/deletion, export triggers, chart interactions, keyboard shortcuts.                                                                                                 |
| `src/tracker/render.js`   | ~25,258 | UI rendering pipeline. Renders live price cards, comparison tables, historical charts, alert panels, export dialogs. The largest file in the repo.                                                                         |
| `src/tracker/ui-shell.js` | ~7,385  | UI shell management: modals, panels, dialogs, sidebars, toast notifications.                                                                                                                                               |
| `src/tracker/wire.js`     | ~3,374  | Bootstrap function. Hydrates tracker from cache, initiates first API fetch, connects event handlers.                                                                                                                       |

**Note:** The tracker files are very large (55,000+ lines total) and are prime candidates for
refactoring into smaller, focused modules.

---

### 3.8 Utilities & Routing (`src/utils/`, `src/routes/`)

| File                           | Purpose                                                                                                                             |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `src/utils/routeBuilder.js`    | **Single source of truth for URL generation.** `buildRoute({country, city, karat, page})` produces correct paths for any page type. |
| `src/utils/routeValidator.js`  | Validates that a country/city/karat combination exists before navigation.                                                           |
| `src/utils/slugify.js`         | Converts names to URL-safe slugs (e.g., "Abu Dhabi" → "abu-dhabi").                                                                 |
| `src/utils/inputValidation.js` | Form validation: UAE phone numbers, email, numeric ranges, text sanitization, URL param sanitization.                               |
| `src/routes/routeRegistry.js`  | Maps URL paths to metadata (country, city, page type). Resolves slugs to page data.                                                 |

---

### 3.9 Build & Generation (`build/`, `scripts/`)

| File                                | Purpose                                                                              | Run Command                |
| ----------------------------------- | ------------------------------------------------------------------------------------ | -------------------------- |
| `build/generatePages.js`            | Generates all 380+ country/city/karat HTML pages from templates                      | Not typically run manually |
| `build/generateSitemap.js`          | Generates sitemap.xml from all known routes                                          | Not typically run manually |
| `scripts/node/generate-sitemap.js`  | Generates sitemap.xml (used by deploy workflow)                                      | `npm run generate-sitemap` |
| `scripts/node/generate-rss.js`      | Generates feed.xml RSS feed                                                          | Called by deploy workflow  |
| `scripts/validate-build.js`         | Pre-build validation: checks for async/await issues, missing imports, required files | `npm run validate`         |
| `scripts/node/audit-pages.js`       | Crawls all pages, checks HTML validity                                               | `npm run audit-pages`      |
| `scripts/node/check-links.js`       | Checks all internal and external links for 404s                                      | `npm run check-links`      |
| `scripts/node/seo-audit.js`         | Full SEO audit: schema.org, meta tags, canonical URLs                                | `npm run seo-audit`        |
| `scripts/node/uptime-check.js`      | Health check for API endpoints                                                       | CI workflow                |
| `scripts/node/tweet-gold-price.js`  | Posts current gold price to Twitter/X                                                | CI workflow                |
| `scripts/node/price-spike-alert.js` | Detects >$50 price movements, sends alerts                                           | CI workflow                |
| `scripts/node/notify-discord.js`    | Sends Discord webhook messages                                                       | CI workflow                |
| `scripts/node/notify-telegram.js`   | Sends Telegram bot messages                                                          | CI workflow                |
| `scripts/python/gold_poster.py`     | Python: posts gold prices via tweepy                                                 | CI hourly workflow         |
| `scripts/python/post_gold_price.py` | Python: legacy gold price poster                                                     | CI workflow                |

---

### 3.10 Stylesheets (`styles/global.css`, `styles/`)

#### Global: `styles/global.css` (~4,548 lines)

The main CSS file contains:

- **CSS custom properties** (design tokens): colors, shadows, radii, spacing, typography
- **Dark mode** support via `[data-theme='dark']` and `prefers-color-scheme`
- **Navigation styles**: nav bar, dropdowns, mobile drawer, hamburger
- **Footer styles**: 5-column layout, responsive
- **Card components**: price cards, stat cards, feature cards
- **Utility classes**: text alignment, spacing, visibility
- **Print styles** and **reduced motion** preferences
- **RTL support** via `[dir='rtl']` selectors

#### Page-Specific: `styles/pages/`

| File                           | Lines  | Styles For                                                |
| ------------------------------ | ------ | --------------------------------------------------------- |
| `styles/pages/home.css`        | ~1,460 | Homepage hero, GCC grid, feature cards, trust badges      |
| `styles/pages/calculator.css`  | ~865   | Calculator tabs, inputs, result cards                     |
| `styles/pages/tracker-pro.css` | ~2,142 | Tracker workspace: panels, charts, alerts, compare tables |
| `styles/pages/shops.css`       | ~2,040 | Shop cards, filters, map, region selector                 |
| `styles/pages/insights.css`    | ~946   | Insights dashboard, analysis cards                        |
| `styles/pages/invest.css`      | ~992   | Investment page                                           |
| `styles/pages/learn.css`       | ~335   | Learning/educational content                              |
| `styles/pages/methodology.css` | ~511   | Methodology page                                          |
| `styles/pages/terms.css`       | ~250   | Terms and privacy pages                                   |

#### Feature-Specific CSS (scattered)

| File                            | Purpose                      |
| ------------------------------- | ---------------------------- |
| `styles/city-page.css`          | City page layouts            |
| `styles/country-page.css`       | Country page hero and layout |
| `content/guides/guide-page.css` | Guide content styling        |
| `styles/market-page.css`        | Market analysis page         |
| `styles/order.css`              | Order flow UI                |

---

### 3.11 HTML Pages

#### Core Pages (Vite-bundled)

| Path               | Page                                                    | Scripts                    | CSS                                                  |
| ------------------ | ------------------------------------------------------- | -------------------------- | ---------------------------------------------------- |
| `index.html`       | **Homepage** — Live hero price card, GCC grid, features | `src/pages/home.js`        | `styles/global.css` + `styles/pages/home.css`        |
| `calculator.html`  | **Calculator** — 5 gold calculators                     | `src/pages/calculator.js`  | `styles/global.css` + `styles/pages/calculator.css`  |
| `tracker.html`     | **Tracker Pro** — Full price workspace                  | `src/pages/tracker-pro.js` | `styles/global.css` + `styles/pages/tracker-pro.css` |
| `shops.html`       | **Shop Directory** — Gold shops by region               | `src/pages/shops.js`       | `styles/global.css` + `styles/pages/shops.css`       |
| `insights.html`    | **Insights** — Market analysis                          | `src/pages/insights.js`    | `styles/global.css` + `styles/pages/insights.css`    |
| `invest.html`      | **Invest** — Investment guide                           | (inline)                   | `styles/global.css` + `styles/pages/invest.css`      |
| `learn.html`       | **Learn** — Gold education                              | `src/pages/learn.js`       | `styles/global.css` + `styles/pages/learn.css`       |
| `methodology.html` | **Methodology** — Data transparency                     | `src/pages/methodology.js` | `styles/global.css` + `styles/pages/methodology.css` |
| `privacy.html`     | Privacy policy                                          | `src/pages/privacy.js`     | `styles/global.css` + `styles/pages/terms.css`       |
| `terms.html`       | Terms of service                                        | `src/pages/terms.js`       | `styles/global.css` + `styles/pages/terms.css`       |
| `offline.html`     | Offline fallback (service worker)                       | None                       | `styles/global.css`                                  |
| `admin.html`       | Legacy admin redirect                                   | None                       | None                                                 |

#### Guide Pages (`content/guides/`)

| Path                                        | Topic                              |
| ------------------------------------------- | ---------------------------------- |
| `content/guides/buying-guide.html`          | How to buy gold                    |
| `content/guides/24k-vs-22k.html`            | 24K vs 22K gold comparison         |
| `content/guides/gold-karat-comparison.html` | Full karat comparison guide        |
| `content/guides/aed-peg-explained.html`     | Why AED/USD is pegged at 3.6725    |
| `content/guides/gcc-market-hours.html`      | GCC gold market trading hours      |
| `content/guides/invest-in-gold-gcc.html`    | Investing in gold in GCC countries |
| `content/guides/zakat-gold-guide.html`      | Islamic zakat on gold              |

#### Tool Pages (`content/tools/`)

| Path                                   | Tool                             |
| -------------------------------------- | -------------------------------- |
| `content/tools/weight-converter.html`  | Gram ↔ ounce ↔ tola converter    |
| `content/tools/zakat-calculator.html`  | Calculate zakat on gold holdings |
| `content/tools/investment-return.html` | Gold investment ROI calculator   |

#### Other Pages

| Path                                     | Purpose                          |
| ---------------------------------------- | -------------------------------- |
| `countries/index.html`                   | All countries directory          |
| `countries/{code}/index.html`            | Country landing pages (15 pages) |
| `countries/{code}/cities/{city}.html`    | City detail pages (5 pages)      |
| `countries/{code}/markets/{market}.html` | Market detail pages (2 pages)    |
| `content/gold-price-history/index.html`  | Historical gold price data page  |
| `content/search/index.html`              | Site search page                 |
| `content/order-gold/index.html`          | Gold ordering page               |
| `content/social/x-post-generator.html`   | X/Twitter post generator tool    |
| `content/embed/gold-ticker.html`         | Embeddable gold ticker widget    |

---

### 3.12 Country Leaf Pages (SEO Pages)

**~340 auto-generated pages** following this pattern:

```
/{country}/
├── gold-price/index.html              ← Country overview
├── {city}/
│   ├── gold-prices/index.html         ← All karats for this city
│   ├── gold-shops/index.html          ← Gold shops in this city
│   └── gold-rate/
│       ├── 24-karat/index.html        ← 24K price detail
│       ├── 22-karat/index.html        ← 22K price detail
│       ├── 21-karat/index.html        ← 21K price detail
│       └── 18-karat/index.html        ← 18K price detail
```

**Countries:** UAE (7 cities), Saudi Arabia (5), Egypt (3), Qatar (3), Kuwait (3), Bahrain (3), Oman
(3), Jordan (3), Lebanon (3), Morocco (3), Algeria (3), Tunisia (3), Libya (3), Sudan (3), India (3)

**All leaf pages share the same approach:**

- Static HTML template with `data-country`, `data-city`, `data-karat` attributes
- Load `src/lib/page-hydrator.js` as an ES module
- Page hydrator reads attributes → fetches live prices → populates DOM
- Served as raw files (not Vite-bundled)

---

### 3.13 Admin Panel (`admin/`)

| Path                         | Purpose                           | Auth Required        |
| ---------------------------- | --------------------------------- | -------------------- |
| `admin/index.html`           | Main dashboard hub                | Yes (Supabase OAuth) |
| `admin/login/index.html`     | Login page with GitHub OAuth      | No                   |
| `admin/shops/index.html`     | CRUD interface for shops database | Yes                  |
| `admin/analytics/index.html` | Visit stats and spike events      | Yes                  |
| `admin/pricing/index.html`   | Price alert threshold management  | Yes                  |
| `admin/content/index.html`   | Edit page copy and blog content   | Yes                  |
| `admin/orders/index.html`    | Order management (future feature) | Yes                  |
| `admin/settings/index.html`  | API keys, webhooks, integrations  | Yes                  |
| `admin/social/index.html`    | Social media post scheduling      | Yes                  |

**Admin JS modules:**

| File                       | Purpose                                                |
| -------------------------- | ------------------------------------------------------ |
| `admin/supabase-auth.js`   | Supabase authentication (GitHub OAuth, email/password) |
| `admin/supabase-config.js` | Supabase client initialization                         |
| `admin/api-client.js`      | JWT-authenticated API client for all admin pages       |
| `admin/auth.js`            | Legacy JWT auth (pre-Supabase)                         |
| `admin/admin.css`          | Admin panel styles                                     |

---

### 3.14 Data & Storage (`data/`, `supabase/`)

| File                                      | Purpose                                                                                  |
| ----------------------------------------- | ---------------------------------------------------------------------------------------- |
| `data/shops.js`                           | Hardcoded shop data (fallback when Supabase is unavailable)                              |
| `data/shops-data.json`                    | Shop database (JSON, used by Express server)                                             |
| `data/audit-logs.json`                    | Admin action audit trail (JSON)                                                          |
| `supabase/schema.sql`                     | Database schema: `shops`, `site_settings`, `audit_logs`, `user_profiles` tables with RLS |
| `server/repositories/shops.repository.js` | Data access layer for shops (file or Supabase backend)                                   |
| `server/repositories/audit.repository.js` | Data access layer for audit logs                                                         |

---

### 3.15 Search (`content/search/`)

| File                         | Purpose                                            |
| ---------------------------- | -------------------------------------------------- |
| `content/search/index.html`  | Search page UI                                     |
| `src/search/searchEngine.js` | Query parser and matcher (bilingual EN/AR)         |
| `src/search/searchIndex.js`  | Builds client-side search index from page metadata |

---

### 3.16 Social & Embed (`content/social/`, `content/embed/`)

| File                                   | Purpose                                                      |
| -------------------------------------- | ------------------------------------------------------------ |
| `content/social/x-post-generator.html` | Tool to generate formatted gold price tweets/posts           |
| `content/social/postTemplates.js`      | Message templates for Twitter, Discord, Telegram             |
| `content/embed/gold-ticker.html`       | Standalone embeddable gold price ticker (for external sites) |

---

### 3.17 Server (`server.js`, `server/`)

| File                           | Purpose                                                                                                  |
| ------------------------------ | -------------------------------------------------------------------------------------------------------- |
| `server.js`                    | Express server entry point: Helmet (security), CORS, Morgan (logging), static files, admin API routes    |
| `server/routes/admin/index.js` | Admin API endpoints: `/api/admin/prices`, `/api/admin/shops`, `/api/admin/analytics`, `/api/admin/audit` |

**Note:** The Express server is optional. The site works fully on GitHub Pages without it. The
server adds admin API capabilities and server-side data persistence.

---

### 3.18 Tests (`tests/`)

| File                             | Tests | What It Validates                                                 |
| -------------------------------- | ----- | ----------------------------------------------------------------- |
| `tests/formatter.test.js`        | 20+   | Price formatting, date formatting, karat labels, currency symbols |
| `tests/price-calculator.test.js` | 15+   | USD per gram, local per gram, karat purity math                   |
| `tests/pricing-engine.test.js`   | 20+   | Multi-currency pricing, FX rate application, edge cases           |
| `tests/auth.test.js`             | 20+   | JWT login/logout, token storage, expiry                           |
| `tests/audit-log.test.js`        | 15+   | Audit logging, flushing, querying                                 |
| `tests/errors.test.js`           | 18+   | Custom error classes, error handler                               |
| `tests/input-validation.test.js` | 22+   | Email, phone, numeric, text, URL validation                       |
| `tests/repositories.test.js`     | 29+   | Shop CRUD, audit repository                                       |
| `tests/shop-manager.test.js`     | 23+   | Admin shop management                                             |
| `tests/route-utils.test.js`      | 32+   | Route building, slug generation, validation                       |

**Run:** `npm test` (205 tests, ~1s) **Watch:** `npm run test:watch` **Coverage:**
`npm run test:coverage`

---

### 3.19 CI/CD Workflows (`.github/workflows/`)

| Workflow                | Trigger         | What It Does                                     |
| ----------------------- | --------------- | ------------------------------------------------ |
| `ci.yml`                | PR, push        | Run lint, tests, validate build, build with Vite |
| `deploy.yml`            | Push to main    | Build → copy assets → deploy to GitHub Pages     |
| `hourly_post.yml`       | Hourly schedule | Post gold prices to X/Twitter                    |
| `post_gold.yml`         | Every 3 hours   | Python gold price poster (legacy)                |
| `gold-price-tweet.yml`  | Scheduled       | Node.js gold price tweet                         |
| `spike_alert.yml`       | Scheduled       | Price spike detection & alerts                   |
| `market_events.yml`     | Scheduled       | Market event alerts                              |
| `health_check.yml`      | Every 6 hours   | API health monitoring                            |
| `uptime-monitor.yml`    | Every 30 min    | Uptime checks                                    |
| `weekly-link-check.yml` | Weekly          | Broken link detection                            |
| `sync-db-to-git.yml`    | Scheduled       | Supabase → Git backup                            |

---

### 3.20 Documentation (`docs/`)

| File                            | Purpose                                                 |
| ------------------------------- | ------------------------------------------------------- |
| `docs/ARCHITECTURE.md`          | System architecture, data flow, module map              |
| `docs/FILES_GUIDE.md`           | File structure reference (predecessor to this document) |
| `docs/EDIT_GUIDE.md`            | "I want to change X" → go to file Y                     |
| `docs/LIMITATIONS.md`           | Known technical limitations                             |
| `docs/ERROR_REPORT.md`          | Error audit findings                                    |
| `docs/SEO_CHECKLIST.md`         | SEO optimization checklist                              |
| `docs/AUTOMATIONS.md`           | CI/CD workflow documentation                            |
| `docs/SUPABASE_SETUP.md`        | Supabase setup guide                                    |
| `docs/TWITTER_AUTOMATION.md`    | Twitter bot configuration                               |
| `docs/environment-variables.md` | Environment variable reference                          |
| `docs/codebase-audit.md`        | Code quality audit                                      |
| `docs/risks.md`                 | Security and data risks                                 |
| `docs/product/*.md`             | Product decisions, PRD, planning, tasks                 |

---

## 4. Data Flow — How Prices Move Through the System

### Price Refresh Cycle (Every 90 Seconds)

```
1. Timer fires (90s interval)
       │
2. lib/api.js → fetchGold()
       │  ├── Try: api.gold-api.com/v1/XAU/USD
       │  └── Fallback: goldprice.org
       │
3. lib/api.js → fetchFX()
       │  ├── Try: open.er-api.com/v6/latest/USD
       │  └── Fallback: openexchangerates.org
       │
4. lib/cache.js → set('gp_gold_price', data, TTL=120s)
       │  ├── Primary key: gp_gold_price
       │  └── Fallback key: gp_gold_price_fallback
       │
5. lib/price-calculator.js
       │  ├── usdPerGram = (spotUsdPerOz / 31.1035) × karatPurity
       │  └── localPrice = usdPerGram × fxRate[currency]
       │
6. lib/formatter.js → formatPrice(localPrice, currency, lang)
       │
7. DOM update → price cards, ticker, charts
```

### AED Peg Handling

The UAE Dirham (AED) is pegged to USD at **3.6725**. This rate is hardcoded in `config/constants.js`
and is **never** fetched from the FX API. This ensures AED prices are always consistent and accurate
regardless of FX API availability.

### Cache Degradation Strategy

```
API Available?
  ├── YES → fresh data, cache updated, "LIVE" badge shown
  └── NO → check cache
           ├── cache < 2 min old → use cached, "LIVE" badge
           ├── cache < 1 hour → use cached, "DELAYED" badge
           ├── cache < 24 hours → use stale, "STALE" badge + warning
           └── no cache at all → show "Unavailable" message
```

---

## 5. Quick Reference: "I Want to Edit X"

| I Want To...                      | Go To...                                                                                         |
| --------------------------------- | ------------------------------------------------------------------------------------------------ |
| Change the gold spot API provider | `src/lib/api.js` → `fetchGold()` function                                                        |
| Change the FX rate API provider   | `src/lib/api.js` → `fetchFX()` function                                                          |
| Add a new country                 | `src/config/countries.js` → add entry, then run `build/generatePages.js`                         |
| Add a new karat grade             | `src/config/karats.js` → add entry with purity fraction                                          |
| Change refresh interval           | `src/config/constants.js` → `REFRESH_INTERVAL_MS`                                                |
| Change the AED peg rate           | `src/config/constants.js` → `AED_PEG`                                                            |
| Edit navigation menu items        | `src/components/nav-data.js` → `NAV_DATA`                                                        |
| Edit footer links                 | `src/components/footer.js` → `injectFooter()` HTML template                                      |
| Change UI text (English)          | `src/config/translations.js` → `en` section                                                      |
| Change UI text (Arabic)           | `src/config/translations.js` → `ar` section                                                      |
| Edit homepage layout              | `index.html` + `src/pages/home.js` + `styles/pages/home.css`                                     |
| Edit calculator logic             | `src/pages/calculator.js`                                                                        |
| Edit tracker workspace            | `src/tracker/render.js` (UI), `src/tracker/state.js` (state), `src/tracker/events.js` (behavior) |
| Edit shop directory               | `src/pages/shops.js` + `styles/pages/shops.css`                                                  |
| Add a new guide                   | Create `content/guides/your-guide.html`, add to `src/components/nav-data.js`                     |
| Add a new tool                    | Create `content/tools/your-tool.html`, add to `src/components/nav-data.js`                       |
| Edit global styles                | `styles/global.css`                                                                              |
| Edit page-specific styles         | `styles/pages/{page}.css`                                                                        |
| Edit nav appearance               | `styles/global.css` → search for `.nav-` classes                                                 |
| Edit footer appearance            | `styles/global.css` → search for `.footer-` classes                                              |
| Add admin API endpoint            | `server/routes/admin/index.js`                                                                   |
| Edit shop CRUD logic              | `server/repositories/shops.repository.js` + `server/lib/admin/shop-manager.js`                   |
| Change Supabase config            | `src/config/supabase.js` (client), `admin/supabase-config.js` (admin)                            |
| Edit deploy workflow              | `.github/workflows/deploy.yml`                                                                   |
| Edit CI workflow                  | `.github/workflows/ci.yml`                                                                       |
| Add a new country leaf page       | Run `build/generatePages.js` after updating `src/config/countries.js`                            |
| Edit robots.txt / sitemap         | `robots.txt` / run `npm run generate-sitemap`                                                    |
| Change PWA settings               | `manifest.json`                                                                                  |
| Change caching strategy           | `sw.js` (service worker)                                                                         |
| Edit SEO meta tags                | Each HTML file's `<head>` section, or `src/seo/metadataGenerator.js`                             |
| Run all tests                     | `npm test`                                                                                       |
| Run linting                       | `npm run lint`                                                                                   |
| Check code formatting             | `npm run format:check`                                                                           |
| Build for production              | `NODE_ENV=production npm run build`                                                              |

---

## 6. Known Limitations & Technical Debt

### 🔴 Critical Limitations

| #   | Limitation                                | Impact                                                                                                                                       | Where                                       |
| --- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| 1   | **Client-side API keys exposed**          | Gold-api.com and FX API keys are in client-side JS, visible to anyone inspecting the page. Rate limits and costs are borne by the key owner. | `src/lib/api.js`, `src/config/constants.js` |
| 2   | **No server-side rendering**              | Every page load requires client-side JS to fetch prices and hydrate content. Bad for SEO crawlers that don't execute JS.                     | All pages                                   |
| 3   | **Single point of failure: gold-api.com** | If primary API goes down and fallback also fails, prices show "Unavailable". No queued retry or server-side caching.                         | `src/lib/api.js`                            |
| 4   | **No rate limiting on client**            | Every page load fires 2 API calls (gold + FX). 1000 concurrent visitors = 2000 API calls in 90 seconds.                                      | `src/lib/api.js`                            |
| 5   | **localStorage as database**              | User preferences, alerts, and watchlist are stored in browser localStorage. Cleared by browser = data lost.                                  | `src/lib/cache.js`, `src/tracker/state.js`  |

### 🟡 Major Limitations

| #   | Limitation                       | Impact                                                                                                                     | Where                                             |
| --- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 6   | **Tracker module is massive**    | 55,000+ lines across 5 files. Very hard to maintain, debug, or add features.                                               | `src/tracker/*.js`                                |
| 7   | **Dual page-build system**       | Some pages are Vite-bundled, others are raw ES modules. Confusing for developers.                                          | `vite.config.js`, `deploy.yml`                    |
| 8   | **No automated E2E tests**       | Only unit tests exist. No Playwright/Cypress tests verifying actual page behavior.                                         | `tests/`                                          |
| 9   | **Country pages at root level**  | 15 country folders at root clutter the repository. Makes navigation difficult.                                             | `countries/uae/`, `countries/saudi-arabia/`, etc. |
| 10  | **Inconsistent CSS breakpoints** | Media queries use 640px, 768px, 480px, 400px, 360px, 380px, 390px, 600px, 900px, 960px. No consistent mobile-first system. | `styles/global.css`                               |
| 11  | **Hardcoded shop data**          | `data/shops.js` has hardcoded shop entries used as fallback. Can become stale.                                             | `data/shops.js`                                   |
| 12  | **No i18n framework**            | Translations are manual key-value pairs. No pluralization, interpolation, or missing-key detection.                        | `src/config/translations.js`                      |

### 🟢 Minor Limitations

| #   | Limitation                           | Impact                                                                            | Where                                       |
| --- | ------------------------------------ | --------------------------------------------------------------------------------- | ------------------------------------------- |
| 13  | **No TypeScript**                    | No type safety. Errors caught only at runtime.                                    | Entire codebase                             |
| 14  | **No component library**             | UI components are hand-coded HTML strings in JS. No templating system.            | `src/components/*.js`                       |
| 15  | **Admin panel is basic**             | Limited analytics, no real-time dashboards, no bulk operations.                   | `admin/`                                    |
| 16  | **No A/B testing infrastructure**    | Cannot test different UI variations.                                              | N/A                                         |
| 17  | **No error reporting**               | Client-side errors are `console.error` only. No Sentry, LogRocket, etc.           | `src/lib/errors.js`                         |
| 18  | **No CDN for assets**                | Images and fonts served from GitHub Pages. No CloudFront/Cloudflare optimization. | `assets/`                                   |
| 19  | **Python + Node.js dual automation** | Twitter bot has both Python and Node.js implementations. Confusing duplication.   | `scripts/python/*.py` + `scripts/node/*.js` |

---

## 7. Production Readiness Guide

### What's Needed to Go Live on a Custom Domain

#### ✅ Already Done

- [x] SEO meta tags on all pages
- [x] Bilingual (EN/AR) with full RTL support
- [x] Dark mode support
- [x] PWA manifest and service worker
- [x] Structured data (schema.org)
- [x] OpenGraph and Twitter Card meta tags
- [x] Sitemap.xml and robots.txt
- [x] Security headers (CSP, X-Frame-Options, etc.)
- [x] Graceful API failure degradation
- [x] 205 unit tests passing
- [x] CI/CD pipeline with GitHub Actions

#### 🔧 Must Do Before Production

| Priority | Task                                        | Why                                                                      | Effort    |
| -------- | ------------------------------------------- | ------------------------------------------------------------------------ | --------- |
| **P0**   | Move API keys to server-side proxy          | Keys are exposed in client JS. Anyone can steal your API quota.          | 2-3 days  |
| **P0**   | Set up server-side caching                  | Don't hit gold/FX APIs per-visitor. Cache on server, serve to all.       | 1-2 days  |
| **P0**   | Custom domain + HTTPS                       | GitHub Pages uses `vctb12.github.io` which isn't a trustworthy brand.    | 1 hour    |
| **P0**   | Error monitoring (Sentry)                   | You need to know when client-side errors happen.                         | 2-4 hours |
| **P1**   | Server-side rendering for SEO               | Google can crawl JS but it's unreliable. SSR ensures content is indexed. | 1-2 weeks |
| **P1**   | CDN for assets                              | Faster load times worldwide. CloudFront or Cloudflare.                   | 4 hours   |
| **P1**   | Rate limiting proxy                         | Prevent API abuse. CloudFlare Workers or Express middleware.             | 1 day     |
| **P1**   | Analytics (Google Analytics 4 or Plausible) | Know your traffic, popular pages, user behavior.                         | 2 hours   |
| **P2**   | Automated E2E tests                         | Catch regressions before deploy. Playwright tests for key flows.         | 3-5 days  |
| **P2**   | Performance optimization                    | Lighthouse audit, lazy loading, code splitting.                          | 2-3 days  |
| **P2**   | Accessibility audit                         | WCAG 2.1 AA compliance. Screen reader testing.                           | 2-3 days  |
| **P2**   | Legal review                                | Terms of service, privacy policy, data disclaimers for production.       | External  |

#### 📋 Production Checklist

```
□ API keys moved to server-side proxy
□ Custom domain configured with HTTPS
□ Cloudflare or CloudFront CDN in front of origin
□ Error monitoring (Sentry) integrated
□ Google Analytics 4 or Plausible analytics
□ Performance: Lighthouse score > 90 on all pages
□ Accessibility: WCAG 2.1 AA audit passed
□ Load testing: handles 1000 concurrent users
□ Legal: terms/privacy reviewed by legal counsel
□ Backup: database backup strategy confirmed
□ Monitoring: uptime monitoring with PagerDuty/OpsGenie
□ Incident response: runbook for API outages
```

---

## 8. Moving Beyond Static: Server-Side Architecture Guide

### Current State: 100% Client-Side

```
Browser → GitHub Pages (static HTML/JS/CSS)
  └── JS fetches → External APIs (gold-api.com, er-api.com)
       └── Results cached in localStorage
```

**Problems with this approach:**

1. API keys exposed in client JS
2. Every visitor makes their own API calls (wasteful)
3. No server-side caching (can't share data between users)
4. No server-side rendering (SEO depends on JS execution)
5. Can't do complex server-side logic (auth, payments, etc.)

### Target State: Server-Side Architecture

#### Option A: Node.js + Express (Simplest Migration)

```
Browser → CDN → Express Server (Node.js)
  ├── Server fetches → External APIs (cached, shared)
  ├── Server renders → HTML with prices pre-filled (SSR)
  ├── Server exposes → /api/prices (for client refresh)
  └── Supabase → Database (shops, users, audit)
```

**Migration steps:**

1. Move `server.js` to be the primary entry point
2. Add server-side price fetching with in-memory cache (Redis or node-cache)
3. Create API proxy: `/api/gold-price` → fetches from gold-api.com with server key
4. Create API proxy: `/api/fx-rates` → fetches from er-api.com with server key
5. Add template rendering (EJS or Handlebars) for SSR
6. Update client JS to call `/api/gold-price` instead of external APIs
7. Deploy to Railway, Render, or Fly.io

#### Option B: Next.js (Full Framework Migration)

```
Browser → Vercel Edge → Next.js App
  ├── ISR pages (regenerated every 90s)
  ├── API routes (/api/prices, /api/shops)
  ├── React components (replace vanilla JS)
  └── Supabase → Database
```

**Migration steps:**

1. Create Next.js project with App Router
2. Migrate config/ → shared constants
3. Migrate lib/ → server-side utilities
4. Create React components from current HTML templates
5. Implement ISR (Incremental Static Regeneration) for price pages
6. Move API calls to server-side API routes
7. Deploy to Vercel

#### Option C: Cloudflare Workers + Pages (Edge Architecture)

```
Browser → Cloudflare Edge → Workers (API proxy + SSR)
  ├── KV Store (price cache, 90s TTL)
  ├── Pages (static assets)
  └── Supabase → Database
```

**Migration steps:**

1. Create Cloudflare Worker for API proxy
2. Use KV store for shared price cache
3. Deploy static site to Cloudflare Pages
4. Worker intercepts API calls, returns cached data

### Recommendation

**For this project, Option A (Express + Server Proxy) is the best starting point** because:

- Minimal code changes (server.js already exists)
- Keep vanilla JS frontend (no React migration needed)
- Add server-side caching and API proxy immediately
- Can evolve to Option B later if needed

---

## 9. Commands Reference

### Development

```bash
# Start dev server (Vite)
npm run dev

# Start Express server (admin API)
npm start

# Preview production build
npm run preview
```

### Build & Deploy

```bash
# Production build
NODE_ENV=production npm run build

# Validate build output
npm run validate

# Generate sitemap
npm run generate-sitemap
```

### Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

### Code Quality

```bash
# Lint JS
npm run lint
npm run lint:fix

# Format code
npm run format
npm run format:check

# Lint CSS
npm run style
npm run style:fix

# Run all quality checks
npm run quality
```

### Audit & SEO

```bash
# Audit all pages
npm run audit-pages

# Check for broken links
npm run check-links

# Full SEO audit
npm run seo-audit

# Pre-flight check (audit + links)
npm run preflight
```

### Security

```bash
# npm audit + outdated check
npm run security
```

---

<div align="center">

---

_This document is auto-maintained. For questions, check the [README](../README.md) or open an
issue._

**Built with ◈ by the GoldPrices team**

</div>
