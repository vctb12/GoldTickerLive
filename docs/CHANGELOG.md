# Changelog

All notable changes to the Gold-Prices platform are documented here.

## [Unreleased]

### Admin Panel — Supabase Migration

- Migrated admin authentication from JWT/Express to **Supabase GitHub OAuth**
- Admin panel now at `/admin/` with dedicated login, dashboard, shops, settings, pricing, orders,
  content, social, and analytics pages
- **Shops** and **Settings** pages fully connected to Supabase database
- Pricing, Orders, Content, Social, and Analytics pages are UI shells (localStorage) pending
  Supabase migration
- Deprecated `admin/api-client.js` (Express JWT client) — no admin page imports it
- Added `admin/supabase-auth.js` and `admin/supabase-config.js` for Supabase integration

### Twitter / Social Automation

- Added Python-based posting system (`scripts/gold_poster.py`) with support for:
  - Hourly gold price posts
  - Market session open/close events
  - Price spike alerts
  - System health checks
- Added Supabase logging to `gold_prices` and `fetch_logs` tables
- Added GitHub Actions workflows: `hourly_post.yml`, `market_events.yml`, `spike_alert.yml`,
  `health_check.yml`
- Original JavaScript system (`scripts/tweet-gold-price.js`) retained for compatibility

### Infrastructure & Bug Fixes

- Fixed `sync-db-to-git.yml`: corrected secret name (`SUPABASE_SERVICE_KEY` →
  `SUPABASE_SERVICE_ROLE_KEY`) and output format (CommonJS → ES module)
- Created `.env.example` template with all required environment variables
- Added `supabase/schema.sql` with 6 tables: `shops`, `site_settings`, `audit_logs`,
  `user_profiles`, `gold_prices`, `fetch_logs`
- Upgraded Vite to ^8.0.8, express-rate-limit to ^8.3.2 (0 npm audit vulnerabilities)

### Documentation Overhaul

- Rewrote `docs/ADMIN_GUIDE.md` and `docs/ADMIN_SETUP.md` for Supabase auth
- Updated all 20+ docs files for accuracy
- Fixed version contradictions across docs (Vite, express-rate-limit)
- Added comprehensive automation docs covering all 14 GitHub Actions workflows

### Phase 4 — Tracker Fixes

#### tracker-pro.js

- **Fix 1 (DOM guard):** `init()` now waits for `DOMContentLoaded` before proceeding if the document
  is not yet interactive/complete, preventing null-element errors during early script execution.
- **Fix 2 (Countdown timer):** Added `startCountdown()` function that counts down from
  `CONSTANTS.GOLD_REFRESH_MS / 1000` seconds and updates a `#tp-countdown` element. Called at
  startup and on each auto-refresh cycle.
- **Fix 3 (Offline banner):** Added `handleOnlineStatus()` function that injects a fixed red banner
  when the browser goes offline, showing the timestamp of the last cached price. Banner is removed
  automatically when connectivity is restored.
- **Fix 4 (Touch swipe):** Added `touchstart`/`touchend` listeners on `#tp-market-board` to support
  swipe navigation between region tabs (gcc → levant → africa → global) on mobile devices. Minimum
  swipe distance: 50px.

### Phase 8 — SEO Engine

#### seo/metadataGenerator.js (new)

- Created centralized metadata generator for all page types: `home`, `country`, `city-prices`,
  `city-shops`, `city-karat`, `calculator`, `history`, `order`, `tracker`, `shops`.
- Each route produces: `title`, `description`, `canonical`, `hreflang` array, `og` object, and
  `jsonLd` schema.
- JSON-LD output includes `BreadcrumbList` for all routes, plus specialised schema for `calculator`
  (SoftwareApplication), `history` (Dataset), and `order` (Offer).

### Phase 10 — Monetization (Ad Slots)

#### components/adSlot.js (new)

- Lazy-loading Google AdSense slot component using `IntersectionObserver`.
- Supports three ad formats: `leaderboard` (728×90 / 320×50 mobile), `rectangle` (300×250),
  `skyscraper` (160×600, hidden on mobile).
- Reserves space before ad loads via `minHeight` to prevent CLS (Cumulative Layout Shift).
- Skips rendering on admin pages and in SSR/non-browser environments.
- Placeholder publisher ID `ca-pub-XXXXXXXXXX` must be replaced before going live.

### Phase 11 — Navigation & UX Polish

#### components/nav-data.js

- Added to **Tools** group (both `en` and `ar`):
  - Price History → `../gold-price-history/`
  - Order Gold → `../order-gold/`
  - X Post Generator → `../social/x-post-generator.html`

#### components/footer.js

- Added to Tools column (both EN and AR):
  - Price History link → `../gold-price-history/`
  - Order Gold link → `../order-gold/`

#### components/breadcrumbs.js

- Added `generateBreadcrumbSchema(items, baseUrl)` export that returns a
  `<script type="application/ld+json">` string containing a `schema.org/BreadcrumbList` for use in
  page `<head>` sections.

### Phase 12 — Performance & Cleanup

#### index.html

- Added `<link rel="preconnect">` hints for `https://api.goldpricez.com` and
  `https://open.er-api.com` to reduce latency on first API call after page load.
