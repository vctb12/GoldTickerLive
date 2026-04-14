# Codebase Structural Audit

Generated: 2026-04-13

## 1. Routing Strategy

**Type: File-based static site with Vite build**

- Static HTML pages served directly — no SPA router
- URL structure: `/{country}/{city}/gold-prices/index.html` (clean URLs via index.html)
- Country-level: `/{country}/gold-price/index.html`
- Karat-specific: `/{country}/{city}/gold-rate/{karat}-karat/index.html`
- Shop pages: `/{country}/{city}/gold-shops/index.html`
- Route registry: `routes/routeRegistry.js` — resolves URL paths to metadata
- Leaf pages (country/city/karat/shops) are excluded from Vite build and copied as-is by deploy
  workflow

## 2. Build System

**Vite 5.4.0 with Terser minification**

- Config: `vite.config.js`
- Plugins: None (zero-dependency)
- Output: `dist/` directory
- Base path: `/Gold-Prices/` in production (GitHub Pages), `/` locally
- Manual chunks: `vendor` (lightweight-charts), `utils` (cache, api, price-calculator, formatter)
- Excluded from Vite: 15 country dirs, `admin/`, `embed/`, `dist/`, `node_modules/`
- These excluded dirs are copied by `.github/workflows/deploy.yml`
- CSS minification: enabled
- JS minification: Terser with `drop_debugger`, removes `console.warn` and `console.log`

## 3. URL Patterns

| Pattern              | Example                                      | Count    |
| -------------------- | -------------------------------------------- | -------- |
| Homepage             | `/`                                          | 1        |
| Country gold price   | `/{country}/gold-price/`                     | 15       |
| City gold prices     | `/{country}/{city}/gold-prices/`             | ~55      |
| City gold shops      | `/{country}/{city}/gold-shops/`              | ~55      |
| City karat rate      | `/{country}/{city}/gold-rate/{karat}-karat/` | ~220     |
| Legacy country pages | `/countries/{country}.html`                  | 15       |
| Legacy city pages    | `/countries/{country}/cities/{city}.html`    | 5        |
| Legacy market pages  | `/countries/{country}/markets/{market}.html` | 2        |
| Calculator           | `/calculator.html`                           | 1        |
| Tracker              | `/tracker.html`                              | 1        |
| Shops (main)         | `/shops.html`                                | 1        |
| Order gold           | `/order-gold/`                               | 1        |
| X Post Generator     | `/social/x-post-generator.html`              | 1        |
| Search               | `/search/`                                   | 1        |
| Gold price history   | `/gold-price-history/`                       | 1        |
| Guides               | `/guides/*.html`                             | 7        |
| Tools                | `/tools/*.html`                              | 3        |
| Learn                | `/learn.html`                                | 1        |
| Insights             | `/insights.html`                             | 1        |
| Invest               | `/invest.html`                               | 1        |
| Methodology          | `/methodology.html`                          | 1        |
| Terms                | `/terms.html`                                | 1        |
| Privacy              | `/privacy.html`                              | 1        |
| Embed widget         | `/embed/gold-ticker.html`                    | 1        |
| Offline              | `/offline.html`                              | 1        |
| Admin panel          | `/admin/*`                                   | 9 pages  |
| Feed                 | `/feed.xml`                                  | 1        |
| Sitemap              | `/sitemap.xml`                               | 1        |
| **Total HTML pages** |                                              | **~380** |

### Redirect Rules (.htaccess)

7 redirects from old flat city URLs to hierarchical structure:

- `cities/dubai.html` → `countries/uae/cities/dubai.html` (301)
- `cities/abu-dhabi.html` → `countries/uae/cities/abu-dhabi.html` (301)
- etc.

## 4. External API Calls

| Domain                             | Purpose                          | Files                                        |
| ---------------------------------- | -------------------------------- | -------------------------------------------- |
| `api.gold-api.com`                 | Primary XAU/USD spot price       | `services/goldPriceService.js`, `lib/api.js` |
| `data-asg.goldprice.org`           | Fallback gold price              | `lib/api.js`                                 |
| `open.er-api.com`                  | FX rates (USD base)              | `services/fxService.js`, `lib/api.js`        |
| `nebdpxjazlnsrfmlpgeq.supabase.co` | Supabase (shops, settings, auth) | `config/supabase.js`, `lib/supabase-data.js` |
| `api.gdeltproject.org`             | Market news headlines            | `scripts/pages/insights.js`                  |
| `raw.githubusercontent.com`        | Historical gold data (DataHub)   | `lib/historical-data.js`                     |

### API Waterfall (Gold Price)

1. Primary: `api.gold-api.com/price/XAU` (requires API key header)
2. Fallback: `data-asg.goldprice.org/dbXRates/USD`
3. Cache: localStorage with stale recovery
4. Failure: Show last known price with warning label

## 5. CSS Architecture

**16 CSS files, page-specific architecture**

| File                           | Size | Scope                              |
| ------------------------------ | ---- | ---------------------------------- |
| `style.css`                    | 100K | Global base styles, dark mode, RTL |
| `styles/pages/home.css`        | 35K  | Homepage-specific                  |
| `styles/pages/shops.css`       | 45K  | Shops page                         |
| `styles/pages/tracker-pro.css` | 41K  | Tracker page                       |
| `styles/pages/invest.css`      | 23K  | Invest page                        |
| `styles/pages/calculator.css`  | 19K  | Calculator page                    |
| `styles/pages/insights.css`    | 20K  | Insights page                      |
| `styles/pages/methodology.css` | 9.7K | Methodology page                   |
| `styles/pages/learn.css`       | 7.2K | Learn page                         |
| `styles/pages/terms.css`       | 4.9K | Terms/Privacy pages                |
| `countries/country-page.css`   | 13K  | Country landing pages              |
| `cities/city-page.css`         | 6.5K | Legacy city pages                  |
| `markets/market-page.css`      | 6.8K | Legacy market pages                |
| `guides/guide-page.css`        | 9.4K | Guide articles                     |
| `order-gold/order.css`         | 12K  | Order page                         |
| `admin/admin.css`              | 20K  | Admin panel                        |

**Total raw CSS**: ~368K **Potential issues**: No shared component CSS system — each page file may
duplicate base component styles (buttons, cards, forms).

## 6. JavaScript Module Graph

**68 JS files total (excluding node_modules/dist)**

### Core library modules (lib/)

- `api.js` — fetch with timeout, retry, simulation hooks
- `cache.js` — dual-layer localStorage (primary + fallback)
- `price-calculator.js` — USD/gram × purity formulas
- `formatter.js` — price/date/label formatting
- `export.js` — CSV/JSON export generators
- `alerts.js` — browser price alert logic
- `historical-data.js` — DataHub baseline merge
- `search.js` — bilingual EN/AR search
- `page-hydrator.js` — leaf page price injection
- `errors.js` — centralized error classes
- `auth.js` — JWT auth (server-side)
- `audit-log.js` — audit logging
- `supabase-client.js` — Supabase lazy init
- `supabase-data.js` — Supabase REST data fetcher

### Services (services/)

- `goldPriceService.js` — multi-provider gold fetch
- `fxService.js` — multi-provider FX rates
- `pricingEngine.js` — karat/unit price calculations
- `apiAdapter.js` — generic fetch wrapper with retry

### Components (components/)

- `nav.js` — bilingual navigation bar
- `footer.js` — site footer
- `chart.js` — interactive price chart
- `ticker.js` — price ticker
- `breadcrumbs.js` — auto breadcrumbs
- `adSlot.js` — AdSense ad slots
- `internalLinks.js` — auto internal links
- `nav-data.js` — navigation menu data

### No circular dependencies detected in core modules.

## 7. State Management

### Global State Objects

- **Homepage**: `STATE` object in `scripts/pages/home.js`
- **Tracker**: `tracker/state.js` — serialized to URL hash `#mode=live&cur=AED&k=24&u=gram`
- **Shops**: State in `scripts/pages/shops.js` (filters, shortlist)

### localStorage Keys

| Key                     | Purpose                             | TTL         |
| ----------------------- | ----------------------------------- | ----------- |
| `goldprices_gold_*`     | Cached gold prices                  | 90s refresh |
| `goldprices_fx_*`       | Cached FX rates                     | 1h          |
| `user_prefs`            | User preferences (region, language) | Permanent   |
| `gp_pref_lang`          | Language preference                 | Permanent   |
| `shops_shortlist`       | Saved shops list                    | Permanent   |
| `tracker_*`             | Tracker UI preferences              | Permanent   |
| `pwa_install_dismissed` | PWA install prompt state            | Permanent   |
| `CHART_CACHE_KEY`       | Chart snapshot data                 | Session     |
| `sb-*-auth-token`       | Supabase auth session               | 12h         |
| `gp_admin_shops`        | Admin shops data                    | Permanent   |

## 8. Admin System

### Authentication

- **Method**: Supabase GitHub OAuth
- **Config**: `admin/supabase-config.js` (real Supabase URL + anon key)
- **Guard**: `admin/supabase-auth.js` — `requireAuth()` checks email whitelist
- **Allowed email**: `vctb12@gmail.com`
- **Session**: Supabase auth tokens in localStorage

### Protected Routes

All `/admin/*` pages call `requireAuth()` at module load:

- `/admin/` — Dashboard
- `/admin/login/` — GitHub OAuth login
- `/admin/shops/` — Shop CRUD
- `/admin/pricing/` — Price management
- `/admin/orders/` — Order management
- `/admin/social/` — X Post Command Center
- `/admin/settings/` — Site settings
- `/admin/analytics/` — Analytics dashboard
- `/admin/content/` — Content CMS

### Admin Data Storage

- Primary: Supabase (shops, settings)
- Fallback: localStorage (`gp_admin_shops`)

## 9. SEO Layer

### Meta Tags

- **Pages with canonical tags**: 369/380 (97%)
- **Pages with unique meta descriptions**: 369/380 (100% unique)
- **Pages with og:title/description**: All main pages
- **hreflang tags**: Present in sitemap.xml (en + ar alternates)

### JSON-LD Structured Data

| Schema Type            | Pages                                          |
| ---------------------- | ---------------------------------------------- |
| WebSite + SearchAction | Homepage                                       |
| Organization           | Homepage                                       |
| BreadcrumbList         | All non-home pages (via breadcrumbs component) |
| FAQPage                | Calculator, some city pages                    |
| HowTo                  | Methodology                                    |
| Dataset                | Some data pages                                |

### Sitemap

- Location: `/sitemap.xml`
- Format: Standard XML with xhtml:link hreflang alternates
- Includes: All main pages, country/city pages
- Priority: 1.0 (home) → 0.95 (tracker) → 0.85 (shops) → 0.75 (calculator) → 0.65 (learn)

### robots.txt

```
Allow: /
Disallow: /admin.html, /admin/, /server/, /tests/, /node_modules/, /supabase/, /repositories/, /dist/
Sitemap: https://vctb12.github.io/Gold-Prices/sitemap.xml
```

## 10. Translation System

### Architecture

- Translation file: `config/translations.js`
- Languages: English (en) and Arabic (ar)
- Mechanism: Static JSON object, loaded at page init
- RTL support: CSS rules for `[dir="rtl"]` in `style.css`
- Language switching: `?lang=ar` query parameter or localStorage `gp_pref_lang`

### Coverage

- Navigation labels ✅
- Price labels ✅
- Freshness labels ✅
- Disclaimers ✅
- Country/city names ✅ (in `config/countries.js`)
- Admin panel: English only ❌
- Error messages: Partial ⚠️

## 11. Unused / Orphan Files

| File                                   | Status        | Notes                                    |
| -------------------------------------- | ------------- | ---------------------------------------- |
| `admin.html`                           | Redirect stub | Redirects to `/admin/`                   |
| `countries/*.html` (15 files)          | Legacy        | Old flat country pages, still accessible |
| `countries/*/cities/*.html` (5 files)  | Legacy        | Old city pages, redirected via .htaccess |
| `countries/*/markets/*.html` (2 files) | Legacy        | Old market pages                         |
| `replit.md`                            | Unused        | Replit-specific docs                     |
| `.replit`                              | Unused        | Replit config                            |
| `build/` directory                     | Unused        | Empty/stale build artifacts              |

## 12. Dependency Audit

### Production Dependencies (package.json)

| Package            | Version | Purpose          | Status                |
| ------------------ | ------- | ---------------- | --------------------- |
| bcryptjs           | ^3.0.3  | Password hashing | Used by `lib/auth.js` |
| cors               | ^2.8.6  | CORS middleware  | Used by `server.js`   |
| express            | ^5.2.1  | HTTP server      | Used by `server.js`   |
| express-rate-limit | ^7.5.0  | Rate limiting    | Used by `server.js`   |
| helmet             | ^8.1.0  | Security headers | Used by `server.js`   |
| jsonwebtoken       | ^9.0.3  | JWT auth         | Used by `lib/auth.js` |
| lowdb              | ^1.0.0  | JSON database    | Used by repositories  |
| morgan             | ^1.10.1 | HTTP logging     | Used by `server.js`   |
| uuid               | ^13.0.0 | UUID generation  | Used by services      |

### Dev Dependencies

| Package | Version | Purpose         |
| ------- | ------- | --------------- |
| terser  | ^5.46.1 | JS minification |
| vite    | ^5.4.0  | Build tool      |

### Vulnerability Report (npm audit)

- **2 moderate vulnerabilities** in esbuild ≤0.24.2 (bundled with vite)
- Issue: esbuild dev server allows cross-origin requests
- Fix: Upgrade vite to ≥6.4.2 (breaking change)
- **Risk**: Low — only affects local dev server, not production

### No high or critical vulnerabilities.

## 13. Bundle Size

**Not measured** — Vite production build would need to be run. The raw source totals:

- Total JS: ~350K (source, pre-minification)
- Total CSS: ~368K (source, pre-minification)
- Expected production: ~60-80% reduction with Terser + CSS minification

## 14. CI/CD Pipelines

| Workflow                  | Trigger             | Purpose                        |
| ------------------------- | ------------------- | ------------------------------ |
| `ci.yml`                  | PR to main          | Validate + Build + Test        |
| `deploy.yml`              | Push to main        | Build + Deploy to GitHub Pages |
| `gold-price-tweet.yml`    | Hourly              | Post gold prices to X/Twitter  |
| `hourly_post.yml`         | Hourly              | Alternative tweet posting      |
| `post_gold.yml`           | Every 3h            | Python tweet posting           |
| `gold-price-discord.yml`  | Daily 08:00 UTC     | Discord price updates          |
| `gold-price-telegram.yml` | 3x daily            | Telegram price updates         |
| `gold-price-spike.yml`    | Hourly              | Detect 2%+ price moves         |
| `spike_alert.yml`         | Every 15 min        | Spike detection                |
| `health_check.yml`        | Daily 04:00 UTC     | System health check            |
| `market_events.yml`       | Market open/close   | Market event triggers          |
| `uptime-monitor.yml`      | Every 30 min        | Uptime monitoring              |
| `weekly-link-check.yml`   | Monday 06:00 UTC    | Link validation                |
| `sync-db-to-git.yml`      | Repository dispatch | Sync Supabase to git           |
| `setup-mcp.yml`           | Manual              | MCP setup                      |
