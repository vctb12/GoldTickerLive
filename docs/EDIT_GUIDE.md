# Edit Guide

> Quick reference: "If you want to change X → go to Y file"

---

## Pricing & Data

| I want to… | Go to… |
|------------|--------|
| Change gold price API endpoint | `config/constants.js` → `API_URLS` section |
| Add a new gold price provider | `services/goldPriceService.js` → add to `PROVIDERS` array |
| Change FX rate API endpoint | `services/fxService.js` |
| Change the AED peg rate | `config/constants.js` → `AED_PEG` (currently 3.6725) |
| Change the price refresh interval | `config/constants.js` → `REFRESH_INTERVAL` (currently 90s) |
| Change pricing formulas | `lib/price-calculator.js` or `services/pricingEngine.js` |
| Add a new weight unit (e.g. baht) | `services/pricingEngine.js` → `calcPrice()` switch cases |
| Change cache duration | `lib/cache.js` |
| Change API timeout/retry settings | `services/apiAdapter.js` |

---

## Countries & Currencies

| I want to… | Go to… |
|------------|--------|
| Add a new country | `config/countries.js` → add entry to `COUNTRIES` array |
| Add cities to a country | `config/countries.js` → add to country's `cities` array |
| Generate leaf pages for new country | Run `node build/generatePages.js` after adding to config |
| Change a country's currency or flag | `config/countries.js` |
| Add a new karat grade | `config/karats.js` → add to `KARATS` array |
| Change karat purity values | `config/karats.js` → edit `purity` field |

---

## Navigation & Layout

| I want to… | Go to… |
|------------|--------|
| Add/remove a navigation menu item | `components/nav-data.js` → `NAV_DATA` object |
| Change navigation behavior/styling | `components/nav.js` |
| Change footer links or layout | `components/footer.js` |
| Change the price ticker | `components/ticker.js` |
| Change breadcrumb format | `components/breadcrumbs.js` |
| Add internal links for SEO | `components/internalLinks.js` |

---

## Pages

| I want to… | Go to… |
|------------|--------|
| Change homepage layout | `index.html` (structure) + `styles/pages/home.css` (style) |
| Change homepage behavior | `scripts/pages/home.js` |
| Change tracker layout | `tracker.html` (structure) + `styles/pages/tracker-pro.css` (style) |
| Change tracker behavior | `scripts/pages/tracker-pro.js` + `tracker/*.js` modules |
| Change calculator | `calculator.html` + `scripts/pages/calculator.js` + `styles/pages/calculator.css` |
| Change shop directory | `shops.html` + `scripts/pages/shops.js` + `styles/pages/shops.css` |
| Change learn page | `learn.html` + `scripts/pages/learn.js` + `styles/pages/learn.css` |
| Change insights page | `insights.html` + `scripts/pages/insights.js` + `styles/pages/insights.css` |
| Change invest page | `invest.html` + `styles/pages/invest.css` |
| Change methodology page | `methodology.html` + `scripts/pages/methodology.js` + `styles/pages/methodology.css` |
| Edit a guide page | `guides/{guide-name}.html` + `guides/guide-page.css` |
| Edit a tool page | `tools/{tool-name}.html` |
| Change the offline page | `offline.html` |
| Change country page template | `countries/country-page.js` + `countries/country-page.css` |
| Change city page template | `cities/city-page.css` + `lib/page-hydrator.js` |
| Change market page template | `markets/market-page.css` |

---

## Styling & Design

| I want to… | Go to… |
|------------|--------|
| Change global colors/fonts | `style.css` → CSS custom properties (`:root` block, top of file) |
| Change global typography | `style.css` → font-size, line-height rules |
| Change dark mode | `style.css` → `@media (prefers-color-scheme: dark)` block |
| Change a page's specific styling | `styles/pages/{page-name}.css` |
| Change responsive breakpoints | `style.css` → `@media` queries (640px, 768px, 960px) |
| Add a new page-specific stylesheet | Create `styles/pages/{name}.css` and link in the HTML `<head>` |
| Change admin panel styling | `admin/admin.css` |
| Change print styles | `style.css` → `@media print` block |
| Change reduced motion behavior | `style.css` → `@media (prefers-reduced-motion: reduce)` block |

---

## Translations & RTL

| I want to… | Go to… |
|------------|--------|
| Add/change UI text (English or Arabic) | `config/translations.js` |
| Change a country name (EN or AR) | `config/countries.js` → `name` / `nameAr` fields |
| Change a karat label (EN or AR) | `config/karats.js` → `label` / `labelAr` fields |
| Change navigation text (EN or AR) | `components/nav-data.js` → `NAV_DATA.en` / `NAV_DATA.ar` |

---

## Shops & Markets

| I want to… | Go to… |
|------------|--------|
| Add hardcoded shop data | `data/shops.js` |
| Change shop directory filtering | `scripts/pages/shops.js` |
| Change shop CRUD logic (server) | `lib/admin/shop-manager.js` |
| Change shop storage backend | `repositories/shops.repository.js` |
| Edit shop confidence scoring | `lib/admin/shop-manager.js` → `calculateConfidenceScore()` |
| Add a shop via admin panel | Admin UI at `/admin/shops/` |
| Manage shops in admin panel | `admin/shops/index.html` (talks directly to Supabase `shops` table) |
| Change Supabase shop fetch (public) | `lib/supabase-data.js` |

---

## Admin Panel

| I want to… | Go to… |
|------------|--------|
| Change admin authentication | `admin/supabase-auth.js` |
| Change allowed admin email | `admin/supabase-config.js` → `ALLOWED_EMAIL` |
| Add new admin page | Create `admin/{section}/index.html`, link from `admin/index.html` |
| Change admin API routes | `server/routes/admin/index.js` |
| Change admin panel styling | `admin/admin.css` |
| Change Supabase credentials | `admin/supabase-config.js` → `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `ALLOWED_EMAIL` |
| Change admin settings storage | `admin/settings/index.html` (talks directly to Supabase `site_settings` table) |

---

## Supabase & Data

| I want to… | Go to… |
|------------|--------|
| Change Supabase schema | `supabase/schema.sql` (then re-run in Supabase SQL Editor) |
| Change Supabase client config (public) | `config/supabase.js` |
| Change Supabase client config (admin) | `admin/supabase-config.js` |
| Switch storage backend (file ↔ supabase) | Set `STORAGE_BACKEND` env var in `.env` |
| Change shop repository layer | `repositories/shops.repository.js` |
| Change audit log repository layer | `repositories/audit.repository.js` |
| Add environment variables | `.env.example` (template) + `docs/environment-variables.md` (docs) |

---

## SEO & Metadata

| I want to… | Go to… |
|------------|--------|
| Change a page's title/description | Edit `<title>` and `<meta name="description">` in the HTML file |
| Change structured data (JSON-LD) | Edit `<script type="application/ld+json">` in the HTML file |
| Update sitemap | Run `npm run generate-sitemap` (or edit `sitemap.xml` directly) |
| Update RSS feed | Run `node scripts/generate-rss.js` |
| Change canonical URLs | Edit `<link rel="canonical">` in the HTML file |
| Change Open Graph / Twitter cards | Edit `<meta property="og:*">` and `<meta name="twitter:*">` in HTML |
| Change robots.txt | Edit `robots.txt` in repo root |
| Run SEO audit | `npm run seo-audit` |
| Run link checker | `npm run check-links` |

---

## URL Routing

| I want to… | Go to… |
|------------|--------|
| Generate a URL programmatically | `utils/routeBuilder.js` → `buildRoute()` |
| Validate a route's parameters | `utils/routeValidator.js` → `validateRoute()` |
| Change URL patterns | `utils/routeBuilder.js` |
| Add route metadata | `routes/routeRegistry.js` |
| Change redirect rules | `.htaccess` |

---

## Build & CI/CD

| I want to… | Go to… |
|------------|--------|
| Change the build process | `vite.config.js` |
| Add a new HTML page to Vite build | Just create the HTML file — Vite auto-discovers it (unless in excluded dirs) |
| Exclude a directory from Vite | `vite.config.js` → `EXCLUDE_DIRS` array |
| Change pre-build validation | `scripts/validate-build.js` |
| Change CI workflow | `.github/workflows/ci.yml` |
| Change deploy workflow | `.github/workflows/deploy.yml` |
| Run all quality checks | `npm run quality` (lint + format + style check) |
| Run pre-flight checks | `npm run preflight` (audit pages + check links) |

---

## Testing

| I want to… | Go to… |
|------------|--------|
| Run all tests | `npm test` |
| Add a new test file | Create `tests/{name}.test.js` |
| Test pricing formulas | `tests/price-calculator.test.js` |
| Test shop management | `tests/shop-manager.test.js` |
| Test authentication | `tests/auth.test.js` |
| Test error handling | `tests/errors.test.js` |
| Test formatting | `tests/formatter.test.js` |
| Test input validation | `tests/input-validation.test.js` |
| Test route utilities | `tests/route-utils.test.js` |
| Test repositories | `tests/repositories.test.js` |

---

## Automation & Social

| I want to… | Go to… |
|------------|--------|
| Change X/Twitter posting format | `scripts/tweet-gold-price.js` or `scripts/gold_poster.py` |
| Change tweet templates | `config/twitter_bot/tweet_templates.json` |
| Change Discord notifications | `scripts/notify-discord.js` |
| Change Telegram notifications | `scripts/notify-telegram.js` |
| Change price spike alerts | `scripts/price-spike-alert.js` |
| Change uptime monitoring | `scripts/uptime-check.js` |
| Change posting schedule | `.github/workflows/hourly_post.yml` (cron expression) |
| Change Python posting system | `scripts/gold_poster.py` + `scripts/utils/` |
| Change market event detection | `scripts/utils/market_hours.py` + `config/twitter_bot/market_hours.json` |
| Change spike detection | `scripts/utils/spike_detector.py` + `config/twitter_bot/spike_config.json` |
| Change health check workflow | `.github/workflows/health_check.yml` |
| Change DB sync workflow | `.github/workflows/sync-db-to-git.yml` |

---

## Deployment

| I want to… | Go to… |
|------------|--------|
| Change GitHub Pages base path | `vite.config.js` → `base` property |
| Change server port | `server.js` or set `PORT` env var |
| Change security headers | `server.js` → Helmet configuration |
| Change CORS settings | `server.js` → CORS configuration |
| Set up environment variables | See `docs/environment-variables.md` |
| Change PWA settings | `manifest.json` |
| Change service worker behavior | `sw.js` |
