# Files Guide

> Every major file in the repository — what it does, when to edit it, and what it depends on.

---

## Table of Contents

- [HTML Pages](#html-pages)
- [JavaScript — Core Library (lib/)](#javascript--core-library-lib)
- [JavaScript — Services (services/)](#javascript--services-services)
- [JavaScript — Components (components/)](#javascript--components-components)
- [JavaScript — Config (config/)](#javascript--config-config)
- [JavaScript — Page Scripts (scripts/pages/)](#javascript--page-scripts-scriptspages)
- [JavaScript — Utilities (utils/)](#javascript--utilities-utils)
- [JavaScript — Routes (routes/)](#javascript--routes-routes)
- [JavaScript — Tracker (tracker/)](#javascript--tracker-tracker)
- [JavaScript — Build & Automation (scripts/)](#javascript--build--automation-scripts)
- [JavaScript — Server (server/)](#javascript--server-server)
- [JavaScript — Data & Repositories](#javascript--data--repositories)
- [JavaScript — Admin](#javascript--admin)
- [CSS Stylesheets](#css-stylesheets)
- [Configuration Files](#configuration-files)
- [Documentation](#documentation)

---

## HTML Pages

### Root Pages

| File | Purpose | When to Edit |
|------|---------|--------------|
| `index.html` | Homepage — live gold prices, country cards, ticker | Change homepage layout, hero section, or country card grid |
| `tracker.html` | Live price tracker workspace — multi-mode (live, compare, archive, exports) | Modify tracker UI layout, add new tracker modes |
| `calculator.html` | Gold calculator tools — value, scrap, Zakat, buying power | Change calculator form layout or add new calculation types |
| `shops.html` | Gold shop & market directory with filtering | Modify shop listing layout or filter controls |
| `learn.html` | Educational content — karats, pricing, history, FAQ | Add new learning sections or FAQ entries |
| `insights.html` | Market analysis — "Why Gold Moved", weekly brief, news | Update insight sections or add new analysis types |
| `invest.html` | Investment guide — rational gold plan | Edit investment advice content or layout |
| `methodology.html` | Data sources & pricing methodology explanation | Update when data sources or calculation methods change |
| `privacy.html` | Privacy policy | Update when privacy practices change |
| `terms.html` | Terms of service | Update when terms change |
| `offline.html` | Offline fallback page (served by service worker) | Change offline user experience |
| `admin.html` | Admin console entry point (redirects to admin/) | Rarely edited — admin logic is in admin/ |

### Country & City Pages

| Pattern | Purpose | When to Edit |
|---------|---------|--------------|
| `countries/index.html` | Country listing page | Add or remove countries from the listing |
| `countries/{country}.html` | Legacy country pages (15 files) | Edit country-specific content; consider migrating to hierarchical structure |
| `countries/{country}/cities/{city}.html` | Legacy city pages | Edit city-specific content |
| `countries/{country}/markets/{market}.html` | Famous market pages (Gold Souk, Khan el-Khalili) | Edit market descriptions and shop listings |
| `{country}/gold-price/index.html` | Country gold price overview (generated) | Edit `build/generatePages.js` template |
| `{country}/{city}/gold-prices/index.html` | City gold prices (generated) | Edit `build/generatePages.js` template |
| `{country}/{city}/gold-rate/{karat}-karat/index.html` | Karat-specific rates (generated) | Edit `build/generatePages.js` template |
| `{country}/{city}/gold-shops/index.html` | City shop listings (generated) | Edit `build/generatePages.js` template |

### Guides (guides/)

| File | Purpose |
|------|---------|
| `guides/buying-guide.html` | Complete gold buying guide |
| `guides/24k-vs-22k.html` | 24K vs 22K gold comparison |
| `guides/gold-karat-comparison.html` | Full karat comparison table |
| `guides/aed-peg-explained.html` | UAE Dirham fixed peg explanation |
| `guides/gcc-market-hours.html` | GCC gold market trading hours |
| `guides/invest-in-gold-gcc.html` | Gold investment guide for GCC |
| `guides/zakat-gold-guide.html` | Zakat on gold rules and calculator |

### Tools (tools/)

| File | Purpose |
|------|---------|
| `tools/weight-converter.html` | Gold weight unit converter |
| `tools/zakat-calculator.html` | Zakat on gold calculator |
| `tools/investment-return.html` | Gold investment return calculator |

---

## JavaScript — Core Library (lib/)

| File | Purpose | Dependencies | When to Edit |
|------|---------|-------------|--------------|
| `lib/api.js` | Fetch gold prices and FX rates with timeout, retry, and simulation hooks | `config/index.js` | Change API endpoints, timeout, or retry logic |
| `lib/cache.js` | Dual-layer localStorage persistence (primary + fallback) with stale recovery | None | Change caching strategy or storage keys |
| `lib/price-calculator.js` | Core pricing formulas: `usdPerGram = (spotPerOz / 31.1035) × purity` | `config/index.js`, `config/karats.js`, `config/countries.js` | Change pricing formulas or add new units |
| `lib/formatter.js` | Format prices, dates, times, countdowns, labels | `config/index.js`, `config/countries.js`, `config/karats.js` | Change display formatting |
| `lib/export.js` | CSV / JSON export generators | `lib/formatter.js` | Add new export formats |
| `lib/historical-data.js` | Merge session history with DataHub baseline dataset | `lib/cache.js` | Change historical data handling |
| `lib/search.js` | Bilingual (EN/AR) search and filtering | `config/translations.js` | Improve search algorithm |
| `lib/page-hydrator.js` | Initialize generated leaf pages with live data | `config/index.js`, `config/countries.js`, `config/karats.js` | Change how leaf pages load data |
| `lib/supabase-client.js` | Lazy Supabase client factory (Node/server) | `@supabase/supabase-js` (optional) | Change Supabase connection settings |
| `lib/supabase-data.js` | Fetch verified shops from Supabase REST API | `config/supabase.js` | Change Supabase data queries |
| `lib/auth.js` | JWT auth + file-based user store (Node/server) | `bcryptjs`, `jsonwebtoken` | Change authentication logic |
| `lib/audit-log.js` | Immutable audit logging (Node/server) | None | Change audit log format or storage |
| `lib/errors.js` | Structured error classes (AppError, ValidationError, etc.) | None | Add new error types |
| `lib/admin/shop-manager.js` | Shop CRUD with confidence scoring (Node/server) | `repositories/shops.repository.js` | Change shop management logic |

---

## JavaScript — Services (services/)

| File | Purpose | Dependencies | When to Edit |
|------|---------|-------------|--------------|
| `services/apiAdapter.js` | API abstraction layer with timeout, retry, and error handling | `config/index.js` | Change API fetching behavior |
| `services/fxService.js` | Fetch FX rates from exchangerate API with AED peg override | `services/apiAdapter.js`, `config/constants.js` | Change FX data source or add currencies |
| `services/goldPriceService.js` | Multi-provider gold spot price fetcher (gold-api.com primary, goldprice.org fallback) | `services/apiAdapter.js`, `config/constants.js` | Change gold price providers or add new ones |
| `services/pricingEngine.js` | Single source of truth for all price calculations across countries and karats | `config/countries.js`, `config/karats.js`, `config/constants.js` | Change pricing calculations |

---

## JavaScript — Components (components/)

| File | Purpose | Dependencies | When to Edit |
|------|---------|-------------|--------------|
| `components/nav.js` | Bilingual navigation bar with dropdowns, mobile hamburger, RTL support | `components/nav-data.js` | Change navigation behavior or styling |
| `components/nav-data.js` | Navigation menu data (all links, labels in EN/AR) | None | Add/remove/reorder navigation items |
| `components/footer.js` | 5-column dark footer with links, brand, legal | None | Change footer layout or links |
| `components/chart.js` | Interactive price chart (lightweight-charts) | External: lightweight-charts CDN | Change chart appearance or behavior |
| `components/ticker.js` | Scrolling price ticker bar | `config/countries.js` | Change ticker display or countries shown |
| `components/breadcrumbs.js` | Navigation breadcrumbs for deep pages | None | Change breadcrumb format or styling |
| `components/internalLinks.js` | Internal link injection for SEO | `config/countries.js` | Change internal linking strategy |
| `components/adSlot.js` | Google AdSense ad slot component | None | Change ad placement or publisher ID |

---

## JavaScript — Config (config/)

| File | Purpose | When to Edit |
|------|---------|--------------|
| `config/constants.js` | API URLs, timeouts, refresh interval (90s), cache keys, AED peg (3.6725), troy-oz divisor (31.1035) | Change API endpoints, timing, or constants |
| `config/countries.js` | 24+ country definitions: code, names (EN/AR), currency, flag, regional group, peg flag, cities list | Add new countries or cities |
| `config/karats.js` | 7 karat definitions (24K, 22K, 21K, 18K, 14K, etc.) with purity fractions and EN/AR labels | Add or modify karat grades |
| `config/translations.js` | All UI strings in English and Arabic | Change UI text or add new translations |
| `config/index.js` | Re-exports all config modules | Rarely edited |
| `config/supabase.js` | Supabase URL and anon key (public, browser-safe) | Change Supabase project |

---

## JavaScript — Page Scripts (scripts/pages/)

Each file is the entry point for one HTML page, loaded via `<script type="module">`.

| File | Page | What It Does |
|------|------|-------------|
| `scripts/pages/home.js` | `index.html` | Initializes homepage: fetches prices, populates country cards, ticker, chart |
| `scripts/pages/tracker-pro.js` | `tracker.html` | Tracker workspace: live mode, compare, archive, exports, alerts |
| `scripts/pages/calculator.js` | `calculator.html` | Calculator tools: value, scrap, Zakat, buying power |
| `scripts/pages/shops.js` | `shops.html` | Shop directory: filtering, search, Supabase data, map integration |
| `scripts/pages/learn.js` | `learn.html` | Learning page: section navigation, FAQ accordion |
| `scripts/pages/insights.js` | `insights.html` | Insights page: news fetching, analysis sections |
| `scripts/pages/methodology.js` | `methodology.html` | Methodology page: interactive examples |
| `scripts/pages/privacy.js` | `privacy.html` | Privacy page: section navigation |
| `scripts/pages/terms.js` | `terms.html` | Terms page: section navigation |

---

## JavaScript — Utilities (utils/)

| File | Purpose | When to Edit |
|------|---------|--------------|
| `utils/routeBuilder.js` | Single source of truth for URL generation: `buildRoute({country, city, karat, page})` | Change URL patterns |
| `utils/routeValidator.js` | Validate country/city/karat parameter combinations | Change validation rules |
| `utils/inputValidation.js` | Shared validation: UAE phone, email, numeric range, text sanitization, URL params, price alerts | Add new validation rules |
| `utils/slugify.js` | URL slug generation | Change slugification rules |

---

## JavaScript — Routes (routes/)

| File | Purpose | When to Edit |
|------|---------|--------------|
| `routes/routeRegistry.js` | Resolve URL paths to page metadata (title, description, breadcrumbs) | Add new routes or change page metadata |

---

## JavaScript — Tracker (tracker/)

| File | Purpose | When to Edit |
|------|---------|--------------|
| `tracker/state.js` | Tracker workspace state management (mode, currency, karat, range); synced to URL hash | Change tracker state shape or URL serialization |
| `tracker/ui-shell.js` | UI orchestration: tab switching, panel rendering | Change tracker layout or add new panels |
| `tracker/render.js` | Render price data into tracker UI elements | Change tracker data display |
| `tracker/events.js` | Event handling for tracker interactions | Change tracker interactivity |
| `tracker/wire.js` | Wire up tracker components on page load | Change tracker initialization |

---

## JavaScript — Build & Automation (scripts/)

| File | Purpose | When to Run |
|------|---------|------------|
| `scripts/validate-build.js` | Pre-build validation: checks required files, HTML issues, imports | `npm run validate` (CI runs this) |
| `scripts/audit-pages.js` | Audit all HTML pages for SEO and structural issues | `npm run audit-pages` |
| `scripts/check-links.js` | Check for broken internal links | `npm run check-links` |
| `scripts/seo-audit.js` | SEO-specific audit (meta tags, structured data, etc.) | `npm run seo-audit` |
| `scripts/generate-sitemap.js` | Generate sitemap.xml from all pages | `npm run generate-sitemap` |
| `scripts/generate-rss.js` | Generate RSS feed (feed.xml) | Manual |
| `scripts/notify-discord.js` | Send notifications to Discord webhook | Called by CI workflows |
| `scripts/notify-telegram.js` | Send notifications to Telegram bot | Called by CI workflows |
| `scripts/price-spike-alert.js` | Detect and alert on gold price spikes | Called by CI workflow |
| `scripts/tweet-gold-price.js` | Post gold price to X/Twitter | Called by CI workflow |
| `scripts/uptime-check.js` | Check site uptime and health | Called by CI workflow |

---

## JavaScript — Server (server/)

| File | Purpose | When to Edit |
|------|---------|--------------|
| `server.js` | Express server: static files, Helmet security, CORS, admin API mount | Change server configuration or middleware |
| `server/routes/admin/index.js` | Admin API routes: shops CRUD, users, auth, audit logs | Add new admin endpoints |

---

## JavaScript — Data & Repositories

| File | Purpose | When to Edit |
|------|---------|--------------|
| `data/shops.js` | Hardcoded shop reference data (browser-side) | Add shops for new regions |
| `repositories/shops.repository.js` | Storage-agnostic shop data access (file or Supabase backend) | Change storage backend behavior |
| `repositories/audit.repository.js` | Storage-agnostic audit log data access | Change audit storage behavior |

---

## JavaScript — Admin

| File | Purpose | When to Edit |
|------|---------|--------------|
| `admin/auth.js` | Admin panel authentication guard | Change admin auth behavior |
| `admin/supabase-auth.js` | Supabase GitHub OAuth for admin login | Change admin auth provider |
| `admin/supabase-config.js` | Admin Supabase credentials (URL, anon key, allowed email) | Change Supabase project or allowed admin |
| `admin/api-client.js` | API client for admin panel requests | Change admin API communication |

---

## CSS Stylesheets

| File | Lines | Purpose | When to Edit |
|------|-------|---------|--------------|
| `style.css` | 4,548 | Global styles: variables, typography, layout, components, responsive | Change site-wide design, colors, or typography |
| `styles/pages/home.css` | 1,460 | Homepage-specific styles | Change homepage visual design |
| `styles/pages/tracker-pro.css` | 2,142 | Tracker workspace styles | Change tracker visual design |
| `styles/pages/shops.css` | 2,040 | Shop directory styles | Change shop listing design |
| `styles/pages/invest.css` | 992 | Investment page styles | Change invest page design |
| `styles/pages/insights.css` | 946 | Insights page styles | Change insights page design |
| `styles/pages/calculator.css` | 865 | Calculator styles | Change calculator design |
| `styles/pages/methodology.css` | 511 | Methodology page styles | Change methodology design |
| `styles/pages/learn.css` | 335 | Learn page styles | Change learn page design |
| `styles/pages/terms.css` | 250 | Terms/privacy page styles | Change legal page design |
| `countries/country-page.css` | 615 | Country page styles | Change country page design |
| `guides/guide-page.css` | 428 | Guide page styles | Change guide design |
| `markets/market-page.css` | 298 | Market page styles | Change market page design |
| `cities/city-page.css` | 284 | City page styles | Change city page design |
| `admin/admin.css` | 1,075 | Admin dashboard styles | Change admin panel design |
| `order-gold/order.css` | 555 | Order page styles | Change order page design |

---

## Configuration Files

| File | Purpose | When to Edit |
|------|---------|--------------|
| `package.json` | Dependencies, scripts, metadata | Add dependencies or scripts |
| `vite.config.js` | Vite build configuration: entry points, chunking, excluded dirs | Change build behavior |
| `eslint.config.mjs` | ESLint rules | Change linting rules |
| `.prettierrc.json` | Prettier formatting rules | Change code formatting |
| `.stylelintrc.json` | Stylelint CSS rules | Change CSS linting rules |
| `.htaccess` | Apache redirect rules (legacy → hierarchical URLs) | Add redirects |
| `manifest.json` | PWA manifest (app name, icons, theme) | Change PWA settings |
| `robots.txt` | Search engine crawl directives | Change crawl rules |
| `sw.js` | Service worker: cache-first for static, network-first for API | Change offline behavior |
| `sitemap.xml` | XML sitemap for search engines | Regenerate with `npm run generate-sitemap` |
| `feed.xml` | RSS feed | Regenerate with `node scripts/generate-rss.js` |
| `playwright.config.yml` | End-to-end test configuration | Change E2E test settings |

---

## Documentation

| File | Purpose |
|------|---------|
| `README.md` | Project overview, features, setup, tech stack |
| `ADMIN_GUIDE.md` | Admin panel user guide |
| `ADMIN_SETUP.md` | Admin panel setup instructions |
| `CONTRIBUTING.md` | Contribution guidelines |
| `CHANGELOG.md` | Version history |
| `DEPENDENCIES.md` | Dependency documentation |
| `docs/ARCHITECTURE.md` | System architecture overview |
| `docs/ERROR_REPORT.md` | Error audit findings and fixes |
| `docs/FILES_GUIDE.md` | This file — explains every major file |
| `docs/EDIT_GUIDE.md` | "Change X → go to Y" quick reference |
| `docs/LIMITATIONS.md` | Technical limitations and bottlenecks |
| `docs/AUTOMATIONS.md` | CI/CD workflow documentation |
| `docs/SEO_CHECKLIST.md` | SEO optimization checklist |
| `docs/SUPABASE_SETUP.md` | Supabase migration guide |
| `docs/environment-variables.md` | Environment variable reference |
| `docs/risks.md` | Active risk log |
| `docs/issues-found.md` | Known issues tracker |
