<div align="center">

# GoldPrices
### Live Gold Intelligence Platform for UAE, GCC, Arab Markets & Global Reference Pricing
### منصة أسعار الذهب المباشرة والتحليلية

A bilingual gold-price platform built for users who need more than a basic spot quote — combining live spot-linked pricing, market comparison, calculator tools, historical views, exports, alerts, country pages, and Arabic-first accessibility.

<p>
  <a href="https://vctb12.github.io/Gold-Prices/">
    <img src="https://img.shields.io/badge/Live%20Site-Open%20Now-C9A227?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Live Site" />
  </a>
  <a href="https://vctb12.github.io/Gold-Prices/tracker.html">
    <img src="https://img.shields.io/badge/Tracker-Live%20Workspace-1F6FEB?style=for-the-badge&logo=dependabot&logoColor=white" alt="Tracker Workspace" />
  </a>
  <a href="https://vctb12.github.io/Gold-Prices/calculator.html">
    <img src="https://img.shields.io/badge/Calculator-Gold%20Tools-2DA44E?style=for-the-badge&logo=calculator&logoColor=white" alt="Calculator" />
  </a>
  <a href="https://vctb12.github.io/Gold-Prices/shops.html">
    <img src="https://img.shields.io/badge/Shops-Directory-E67E22?style=for-the-badge&logo=google-maps&logoColor=white" alt="Shops" />
  </a>
  <a href="https://github.com/vctb12/Gold-Prices/wiki">
    <img src="https://img.shields.io/badge/Wiki-Full%20Docs-6F42C1?style=for-the-badge&logo=github&logoColor=white" alt="Wiki" />
  </a>
</p>

<p>
  <a href="#platform-highlights">
    <img src="https://img.shields.io/badge/Language-English%20%2F%20Arabic-8B5CF6?style=flat-square" alt="Bilingual" />
  </a>
  <a href="#supported-markets">
    <img src="https://img.shields.io/badge/Markets-24%2B-C2410C?style=flat-square" alt="Markets" />
  </a>
  <a href="#platform-highlights">
    <img src="https://img.shields.io/badge/Karats-7-F59E0B?style=flat-square" alt="Karats" />
  </a>
  <a href="#core-workspaces">
    <img src="https://img.shields.io/badge/Exports-CSV%20%2B%20JSON-059669?style=flat-square" alt="Exports" />
  </a>
  <a href="#automation--social-posting">
    <img src="https://img.shields.io/badge/Automation-8%20Workflows-FF6B6B?style=flat-square" alt="Automation" />
  </a>
  <a href="#system-resilience-and-offline-behavior">
    <img src="https://img.shields.io/badge/Offline-Friendly-111827?style=flat-square" alt="Offline Friendly" />
  </a>
  <a href="#system-resilience-and-offline-behavior">
    <img src="https://img.shields.io/badge/PWA-Ready-0EA5E9?style=flat-square" alt="PWA" />
  </a>
  <a href="#license">
    <img src="https://img.shields.io/badge/License-MIT-2563EB?style=flat-square" alt="License" />
  </a>
</p>

</div>

---

## Table of Contents

- [Overview](#overview)
- [Platform Highlights](#platform-highlights)
- [Screenshots](#screenshots)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [All Pages & Tools](#all-pages--tools)
- [Core Workspaces](#core-workspaces)
- [Supported Markets](#supported-markets)
- [Data Sources & Price Logic](#data-sources--price-logic)
- [Automation & Social Posting](#automation--social-posting)
- [Admin Panel](#admin-panel)
- [System Resilience](#system-resilience-and-offline-behavior)
- [Deployment](#deployment)
- [API Setup](#api-setup)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [License](#license)

---

## Overview

**GoldPrices** is a zero-dependency, static front-end gold pricing platform built for the UAE, GCC, the wider Arab world, and selected global reference markets.

> Most gold sites are either too narrow, too messy, too static, too ad-heavy, or too unclear about how their numbers are formed.

GoldPrices is built to be **cleaner, more transparent, more bilingual, and more useful in practice**, combining:

- Live **XAU/USD spot-linked pricing** refreshed every 90 seconds
- **Local currency estimates** for 24+ markets
- **7 purity-adjusted karat views** (24K → 14K)
- **Historical archive**, date lookup, and price comparison
- **Browser-based alerts** and saved presets
- **Practical gold calculators** (value, scrap, zakat, weight conversion)
- **Country-specific market pages** (395+ HTML pages across 15 countries)
- **Gold shop directory** with city/market browsing
- **Order gold online** feature with live pricing
- **CSV / JSON exports** and shareable URL state
- **English + Arabic** with full RTL support
- **Offline-friendly**, local-first architecture with service worker
- **Automated social posting** to X/Twitter, Telegram, and Discord

---

## Platform Highlights

| Feature | Description |
|---------|-------------|
| 🏷️ **Live Pricing** | XAU/USD spot-linked, refreshed every 90 seconds |
| 💎 **7 Karats** | 24K, 22K, 21K, 20K, 18K, 16K, 14K with purity fractions |
| 🌍 **24+ Markets** | GCC, Levant, North Africa, India, global references |
| 🌐 **Bilingual** | Full English + Arabic interface with RTL |
| 📊 **Tracker Workspace** | Multi-mode: Live, Compare, Archive, Alerts, Planner, Exports |
| 🧮 **Calculator Suite** | Value, Scrap, Zakat, Buying Power, Weight Converter |
| 🏪 **Shop Directory** | Gold shops searchable by country, city, and market |
| 🛒 **Order Gold** | 1g–100g bars, 4 karats, live pricing with VAT |
| 📱 **PWA Ready** | Installable, offline-capable with service worker |
| 🤖 **8 Automated Workflows** | Hourly tweets, Telegram, Discord, spike alerts, uptime monitoring |
| 📰 **RSS Feed** | Auto-generated RSS for price updates |
| 🔍 **Full-text Search** | Bilingual search across countries, cities, and tools |

---

## Screenshots

<p align="center">
  <img src="./assets/screenshots/home.png" alt="Home" width="32%" />
  <img src="./assets/screenshots/calculator.png" alt="Calculator" width="32%" />
  <img src="./assets/screenshots/methodology.png" alt="Methodology" width="32%" />
</p>

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                        HTML Pages                           │
│  index.html · tracker.html · calculator.html · shops.html   │
│  learn.html · insights.html · methodology.html · invest.html│
│  countries/*.html · guides/*.html · order-gold/ · search/   │
├─────────────────────────────────────────────────────────────┤
│              Page-specific JS (scripts/pages/)              │
│  home.js · tracker-pro.js · calculator.js · shops.js · …   │
├─────────────────────────────────────────────────────────────┤
│              Shared Components (components/)                │
│  nav.js · footer.js · ticker.js · breadcrumbs.js · chart.js│
│  adSlot.js (Google AdSense lazy loader)                     │
├─────────────────────────────────────────────────────────────┤
│                Core Libraries (lib/)                        │
│  api.js → cache.js → price-calculator.js → formatter.js    │
│  export.js · historical-data.js · search.js · alerts.js    │
├─────────────────────────────────────────────────────────────┤
│              Configuration (config/)                        │
│  constants.js · countries.js · karats.js · translations.js  │
├─────────────────────────────────────────────────────────────┤
│                External APIs                                │
│  gold-api.com (XAU/USD) · open.er-api.com (FX rates)       │
│  datahub.io (historical) · GDELT (news headlines)           │
└─────────────────────────────────────────────────────────────┘
```

**Data flow:** HTML page → page JS → `lib/api.js` → `lib/cache.js` (dual-layer localStorage) → `lib/price-calculator.js` → `lib/formatter.js` → DOM

---

## Quick Start

### Run locally (no build required)

```bash
git clone https://github.com/vctb12/Gold-Prices.git
cd Gold-Prices
python3 -m http.server 8080
# Open http://localhost:8080
```

### Run with Vite (for development with HMR)

```bash
npm install
npm run dev
# Open http://localhost:5000
```

### Build for production

```bash
npm run build        # Outputs to dist/
npm run preview      # Preview the production build
```

### Debug mode

Append `?debug=true` to any page URL to expose a debug panel for:
- Simulating gold API failure
- Simulating FX API failure
- Clearing localStorage cache
- Inspecting live state

### Run tests

```bash
npm install
npm test             # Runs 66+ tests
```

### Run preflight checks

```bash
npm run preflight    # Runs audit-pages + check-links
npm run seo-audit    # Validates SEO metadata across all pages
```

---

## All Pages & Tools

### Core Pages

| Page | URL | Description |
|------|-----|-------------|
| **Homepage** | [`/`](https://vctb12.github.io/Gold-Prices/) | Live price hero, GCC grid, tool cards |
| **Tracker** | [`/tracker.html`](https://vctb12.github.io/Gold-Prices/tracker.html) | Multi-mode workspace: live, compare, archive, alerts, planner, exports |
| **Calculator** | [`/calculator.html`](https://vctb12.github.io/Gold-Prices/calculator.html) | Value, scrap, zakat, buying power, unit converter |
| **Shops** | [`/shops.html`](https://vctb12.github.io/Gold-Prices/shops.html) | Gold shop directory by country/city/market |
| **Invest** | [`/invest.html`](https://vctb12.github.io/Gold-Prices/invest.html) | Gold investing guide for UAE, Saudi & Egypt |
| **Learn** | [`/learn.html`](https://vctb12.github.io/Gold-Prices/learn.html) | Educational content, glossary, FAQ |
| **Insights** | [`/insights.html`](https://vctb12.github.io/Gold-Prices/insights.html) | Market analysis and weekly briefs |
| **Methodology** | [`/methodology.html`](https://vctb12.github.io/Gold-Prices/methodology.html) | Data sources, formulas, transparency |

### Tools & Features

| Tool | URL | Description |
|------|-----|-------------|
| **Order Gold** | [`/order-gold/`](https://vctb12.github.io/Gold-Prices/order-gold/) | Order 1g–100g bars with live pricing + UAE VAT |
| **X Post Generator** | [`/social/x-post-generator.html`](https://vctb12.github.io/Gold-Prices/social/x-post-generator.html) | Generate ready-to-post X/Twitter updates |
| **Price History** | [`/gold-price-history/`](https://vctb12.github.io/Gold-Prices/gold-price-history/) | Historical gold price data and charts |
| **Search** | [`/search/`](https://vctb12.github.io/Gold-Prices/search/) | Bilingual full-text search |
| **Weight Converter** | [`/tools/weight-converter.html`](https://vctb12.github.io/Gold-Prices/tools/weight-converter.html) | Grams ↔ Troy oz ↔ Tola ↔ Baht ↔ Mithqal |
| **Zakat Calculator** | [`/tools/zakat-calculator.html`](https://vctb12.github.io/Gold-Prices/tools/zakat-calculator.html) | Interactive gold zakat calculation |
| **Investment Return** | [`/tools/investment-return.html`](https://vctb12.github.io/Gold-Prices/tools/investment-return.html) | Historical investment return calculator |
| **Embed Widget** | [`/embed/gold-ticker.html`](https://vctb12.github.io/Gold-Prices/embed/gold-ticker.html) | Embeddable gold price ticker |

### Guides

| Guide | URL |
|-------|-----|
| How to Buy Gold | [`/guides/buying-guide.html`](https://vctb12.github.io/Gold-Prices/guides/buying-guide.html) |
| 24K vs 22K Gold | [`/guides/24k-vs-22k.html`](https://vctb12.github.io/Gold-Prices/guides/24k-vs-22k.html) |
| Gold Karat Comparison | [`/guides/gold-karat-comparison.html`](https://vctb12.github.io/Gold-Prices/guides/gold-karat-comparison.html) |
| AED Peg Explained | [`/guides/aed-peg-explained.html`](https://vctb12.github.io/Gold-Prices/guides/aed-peg-explained.html) |
| GCC Market Hours | [`/guides/gcc-market-hours.html`](https://vctb12.github.io/Gold-Prices/guides/gcc-market-hours.html) |
| Invest in Gold (GCC) | [`/guides/invest-in-gold-gcc.html`](https://vctb12.github.io/Gold-Prices/guides/invest-in-gold-gcc.html) |
| Zakat on Gold | [`/guides/zakat-gold-guide.html`](https://vctb12.github.io/Gold-Prices/guides/zakat-gold-guide.html) |

### Country Pages (15 countries, 45+ cities)

| Country | URL | Cities |
|---------|-----|--------|
| 🇦🇪 UAE | [`/countries/uae.html`](https://vctb12.github.io/Gold-Prices/countries/uae.html) | Dubai, Abu Dhabi, Sharjah, Ajman, Fujairah, RAK, UAQ |
| 🇸🇦 Saudi Arabia | [`/countries/saudi-arabia.html`](https://vctb12.github.io/Gold-Prices/countries/saudi-arabia.html) | Riyadh, Jeddah, Mecca, Medina, Dammam |
| 🇰🇼 Kuwait | [`/countries/kuwait.html`](https://vctb12.github.io/Gold-Prices/countries/kuwait.html) | Kuwait City, Hawalli, Salmiya |
| 🇶🇦 Qatar | [`/countries/qatar.html`](https://vctb12.github.io/Gold-Prices/countries/qatar.html) | Doha, Al Rayyan, Al Wakrah |
| 🇧🇭 Bahrain | [`/countries/bahrain.html`](https://vctb12.github.io/Gold-Prices/countries/bahrain.html) | Manama, Muharraq, Rifaa |
| 🇴🇲 Oman | [`/countries/oman.html`](https://vctb12.github.io/Gold-Prices/countries/oman.html) | Muscat, Salalah, Sohar |
| 🇪🇬 Egypt | [`/countries/egypt.html`](https://vctb12.github.io/Gold-Prices/countries/egypt.html) | Cairo, Alexandria, Giza |
| 🇯🇴 Jordan | [`/countries/jordan.html`](https://vctb12.github.io/Gold-Prices/countries/jordan.html) | Amman, Irbid, Zarqa |
| 🇱🇧 Lebanon | [`/countries/lebanon.html`](https://vctb12.github.io/Gold-Prices/countries/lebanon.html) | Beirut, Tripoli, Sidon |
| 🇲🇦 Morocco | [`/countries/morocco.html`](https://vctb12.github.io/Gold-Prices/countries/morocco.html) | Casablanca, Rabat, Marrakech |
| 🇹🇳 Tunisia | [`/countries/tunisia.html`](https://vctb12.github.io/Gold-Prices/countries/tunisia.html) | Tunis, Sfax, Sousse |
| 🇩🇿 Algeria | [`/countries/algeria.html`](https://vctb12.github.io/Gold-Prices/countries/algeria.html) | Algiers, Oran, Constantine |
| 🇱🇾 Libya | [`/countries/libya.html`](https://vctb12.github.io/Gold-Prices/countries/libya.html) | Tripoli, Benghazi, Misrata |
| 🇸🇩 Sudan | [`/countries/sudan.html`](https://vctb12.github.io/Gold-Prices/countries/sudan.html) | Khartoum, Omdurman, Port Sudan |
| 🇮🇳 India | [`/countries/india.html`](https://vctb12.github.io/Gold-Prices/countries/india.html) | Mumbai, Delhi, Chennai |

---

## Core Workspaces

### Tracker Workspace

| Mode | Purpose |
|------|---------|
| **Live** | Live chart, key metrics, karat ladder, watchlist, and directional cues |
| **Compare** | Compare markets and rank countries by selected view |
| **Archive** | Browse historical data and run date lookup |
| **Alerts** | Save local browser alerts and preset states |
| **Planner** | Budget, jewelry estimate, accumulation, and scenario planning |
| **Exports** | Download CSV, JSON, and brief outputs |
| **Method** | Review sources, pricing assumptions, and methodology |

### Calculator Suite

- **Gold Value Calculator** — Weight × karat × live price
- **Scrap Gold Calculator** — Price old jewelry by weight and purity
- **Zakat on Gold Calculator** — Islamic zakat obligation threshold
- **Buying Power Calculator** — How much gold can you buy with X amount?
- **Weight Unit Converter** — Grams ↔ Troy oz ↔ Tola ↔ Baht ↔ Mithqal

---

## Supported Markets

| Region | Countries |
|--------|-----------|
| **GCC** | UAE, Saudi Arabia, Kuwait, Qatar, Bahrain, Oman |
| **Levant** | Jordan, Lebanon, Syria, Palestine |
| **North & East Africa** | Egypt, Libya, Tunisia, Algeria, Morocco, Sudan, Somalia, Mauritania, Djibouti, Comoros |
| **Global Reference** | USA, United Kingdom, Eurozone, India |

---

## Data Sources & Price Logic

| Source | Used for | Notes |
|--------|----------|-------|
| [Gold API](https://gold-api.com/docs) | Live XAU/USD spot price | Primary live market layer |
| [ExchangeRate-API](https://www.exchangerate-api.com/docs/free) | Currency conversion | FX layer |
| Hardcoded `3.6725` | UAE pricing | Official AED/USD peg |
| [DataHub Gold Prices](https://datahub.io/core/gold-prices) | Historical baseline | Long-range historical layer |
| [GDELT DOC API](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/amp/) | Market wire / headlines | News strip layer |

### Price formulas

```text
1 troy ounce = 31.1035 grams

usdPerGram(karat) = (spotUsdPerOz / 31.1035) × purity
usdPerOz(karat)   = spotUsdPerOz × purity
localPrice        = usdPrice × fxRate
AED price         = usdPrice × 3.6725 (fixed peg)
```

> ⚠️ Prices are **spot-linked bullion-equivalent estimates**, not final retail prices. Real store prices may differ due to making charges, dealer premiums, VAT, and shop markup.

---

## Automation & Social Posting

GoldPrices runs **8 GitHub Actions workflows** for automated operations:

| Workflow | Schedule | Description |
|----------|----------|-------------|
| `gold-price-tweet.yml` | Hourly | Posts live gold prices to X/Twitter with rotating templates |
| `gold-price-telegram.yml` | 3×/day | Posts to Telegram channel (07:00, 12:00, 18:00 UTC) |
| `gold-price-discord.yml` | Daily | Posts to Discord server at noon Dubai time |
| `gold-price-spike.yml` | Hourly | Alerts on >2% intra-day price spikes |
| `uptime-monitor.yml` | Every 30min | Pings the live site and alerts on failure |
| `weekly-link-check.yml` | Weekly (Mon) | Checks for broken internal links |
| `deploy.yml` | On push to main | Builds with Vite and deploys to GitHub Pages |
| `sync-db-to-git.yml` | On dispatch | Syncs Supabase shop data to Git |

### Required GitHub Secrets

| Secret | Used by |
|--------|---------|
| `GOLD_API_KEY` | Tweet, Telegram, Discord, Spike alert workflows |
| `TWITTER_API_KEY` | Tweet workflow |
| `TWITTER_API_SECRET` | Tweet workflow |
| `TWITTER_ACCESS_TOKEN` | Tweet workflow |
| `TWITTER_ACCESS_TOKEN_SECRET` | Tweet workflow |
| `TELEGRAM_BOT_TOKEN` | Telegram workflow |
| `TELEGRAM_CHAT_ID` | Telegram workflow |
| `DISCORD_WEBHOOK_URL` | Discord workflow |

### Tweet template rotation

The tweet script (`scripts/tweet-gold-price.js`) rotates across 10+ templates based on time of day (Dubai timezone):
- 🌅 Morning update (06:00)
- 🕐 Hourly snapshot
- ☀️ Midday report (12:00)
- 🌆 Evening close (20:00)
- 🌙 Daily summary (00:00)
- 🕌 Arabic language post (08:00)
- 📅 Weekend recap (Fri/Sat)
- 📊 Comparison post (vs yesterday)
- 🏆 Milestone post (round numbers)
- 🌍 Country-specific post

---

## Admin Panel

The platform includes a full admin panel at `/admin/` with:

| Module | Path | Description |
|--------|------|-------------|
| Dashboard | `/admin/` | Stats overview, API status, activity timeline |
| Shops | `/admin/shops/` | Manage gold shop directory |
| Orders | `/admin/orders/` | Track gold orders |
| Pricing | `/admin/pricing/` | Price management and overrides |
| Content | `/admin/content/` | Content management |
| Social | `/admin/social/` | Social media management |
| Analytics | `/admin/analytics/` | Traffic and engagement analytics |
| Settings | `/admin/settings/` | Site configuration and ad management |

**Server-side API:** The admin panel is backed by an Express.js server (`server.js`) with JWT authentication, rate limiting, and Helmet security headers.

---

## System Resilience and Offline Behavior

| State | Gold | FX | Behavior |
|-------|------|----|----------|
| ✅ Live | Live | Live | Full precision, live state |
| ⚠️ Partial | Live | Stale | FX badge shows stale age |
| ⚠️ Partial | Stale | Live | Gold badge shows stale age |
| 🔶 Cached | Both stale | Both stale | Dual stale indicators, cache-backed rendering |
| 🔴 Empty | No cache | No cache | Empty state with retry flow |

**Cache strategy:** Dual-layer localStorage persistence (primary + fallback) prevents data loss. Service worker (`sw.js`) serves static assets cache-first and API calls network-first. Offline fallback page shows last-known prices.

---

## Deployment

### GitHub Pages (default)

The site deploys automatically to GitHub Pages on push to `main` via `.github/workflows/deploy.yml`:

1. `npm ci` → `npm run build` (Vite)
2. Auto-regenerates `sitemap.xml` and `feed.xml`
3. Copies static assets, country pages, and ES modules to `dist/`
4. Deploys to GitHub Pages

**Live URL:** `https://vctb12.github.io/Gold-Prices/`

### Custom domain

To use a custom domain:
1. Add a CNAME file to the repo root with your domain
2. Configure DNS: CNAME record pointing to `vctb12.github.io`
3. Enable "Enforce HTTPS" in GitHub Pages settings

### Self-hosted

```bash
npm install
npm run build
# Serve the dist/ directory with any static file server (nginx, Apache, Caddy, etc.)
```

For the admin API:

```bash
npm install
npm start  # Starts Express server on port 3000
```

---

## API Setup

### Gold API (required for live prices)

1. Sign up at [gold-api.com](https://gold-api.com)
2. Get your API key
3. Add as GitHub Secret: `GOLD_API_KEY`
4. The frontend uses this key via `config/constants.js`

### ExchangeRate API (required for FX conversion)

1. Sign up at [exchangerate-api.com](https://www.exchangerate-api.com)
2. Free tier: 1,500 requests/month
3. Configure in `config/constants.js`

### X/Twitter API (for automated tweets)

1. Apply for X Developer account at [developer.twitter.com](https://developer.twitter.com)
2. Create a project with read+write permissions
3. Generate OAuth 1.0a tokens
4. Add 4 secrets: `TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_TOKEN_SECRET`

### Telegram Bot (for channel posts)

1. Create a bot via [@BotFather](https://t.me/BotFather)
2. Add bot to your channel as admin
3. Add secrets: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`

### Discord Webhook (for server posts)

1. Create a webhook in your Discord server's channel settings
2. Add secret: `DISCORD_WEBHOOK_URL`

---

## Project Structure

```text
Gold-Prices/
├── index.html                 # Landing page / homepage
├── tracker.html               # Multi-mode live gold tracker workspace
├── calculator.html            # Gold calculator page (5 calculators)
├── shops.html                 # Gold shop directory
├── learn.html                 # Educational content and glossary
├── insights.html              # Market analysis and insights
├── methodology.html           # Data sources and transparency
├── invest.html                # Gold investing guide
├── offline.html               # Offline fallback page
├── style.css                  # Shared global styles (theme, layout, responsive)
├── sw.js                      # Service worker (cache-first static, network-first API)
├── server.js                  # Express.js admin API server
├── vite.config.js             # Vite build configuration
│
├── scripts/pages/             # Page-specific JavaScript
│   ├── home.js                # Homepage logic
│   ├── tracker-pro.js         # Tracker workspace orchestrator
│   ├── calculator.js          # Calculator logic
│   ├── shops.js               # Shop directory logic
│   ├── learn.js               # Learn page logic
│   ├── insights.js            # Insights page logic
│   └── methodology.js         # Methodology page logic
│
├── styles/pages/              # Page-specific CSS
│   ├── home.css               # Homepage styling
│   ├── tracker-pro.css        # Tracker workspace styling
│   ├── calculator.css         # Calculator styling
│   ├── shops.css              # Shop directory styling
│   ├── learn.css              # Learn page styling
│   ├── insights.css           # Insights page styling
│   ├── methodology.css        # Methodology styling
│   └── invest.css             # Invest page styling
│
├── config/                    # Configuration modules
│   ├── constants.js           # API URLs, timing, AED peg (3.6725), troy oz (31.1035)
│   ├── countries.js           # 24+ countries with codes, names (EN/AR), currencies, flags
│   ├── karats.js              # 7 karat definitions with purity fractions
│   ├── translations.js        # All UI strings in English and Arabic
│   └── index.js               # Central config export
│
├── lib/                       # Core libraries
│   ├── api.js                 # Fetch with timeout, retry, simulation hooks
│   ├── cache.js               # Dual-layer localStorage persistence
│   ├── price-calculator.js    # Core pricing formulas
│   ├── formatter.js           # Price, date, time formatting
│   ├── export.js              # CSV / JSON / brief export
│   ├── historical-data.js     # Merges session history with DataHub baseline
│   ├── search.js              # Bilingual search and filtering
│   └── alerts.js              # Browser-side price alert logic
│
├── components/                # Shared UI components
│   ├── nav.js                 # Bilingual navigation bar (desktop dropdowns + mobile drawer)
│   ├── nav-data.js            # Navigation menu structure (EN/AR)
│   ├── footer.js              # 5-column footer with data source attribution
│   ├── ticker.js              # Live price ticker strip
│   ├── chart.js               # Interactive price chart
│   ├── breadcrumbs.js         # Breadcrumb navigation
│   └── adSlot.js              # Google AdSense lazy-loading ad component
│
├── tracker/                   # Tracker workspace modules
│   ├── state.js               # URL hash-synced state management
│   ├── ui-shell.js            # UI orchestration
│   ├── render.js              # Rendering functions
│   ├── events.js              # Event bindings
│   └── wire.js                # News wire module
│
├── tools/                     # Standalone tool pages
│   ├── weight-converter.html  # Unit conversion tool
│   ├── zakat-calculator.html  # Interactive zakat calculator
│   └── investment-return.html # Historical investment return calculator
│
├── countries/                 # Country landing pages (15 countries)
├── guides/                    # Educational guide articles (7 guides)
├── social/                    # X post generator + templates
├── order-gold/                # Gold ordering feature
├── gold-price-history/        # Historical price data page
├── search/                    # Bilingual search page
├── embed/                     # Embeddable gold ticker widget
├── admin/                     # Admin panel (dashboard, shops, orders, settings, etc.)
│
├── scripts/                   # Automation & build scripts
│   ├── tweet-gold-price.js    # X/Twitter posting (10+ rotating templates)
│   ├── notify-telegram.js     # Telegram channel notifications
│   ├── notify-discord.js      # Discord server notifications
│   ├── price-spike-alert.js   # Price spike detection
│   ├── uptime-check.js        # Site uptime monitoring
│   ├── generate-sitemap.js    # Auto-generate sitemap.xml
│   ├── generate-rss.js        # Auto-generate feed.xml
│   ├── seo-audit.js           # SEO metadata validation
│   ├── check-links.js         # Internal link checker
│   └── audit-pages.js         # Page audit script
│
├── .github/workflows/         # GitHub Actions (8 workflows)
├── data/                      # Static data files (shops, audit logs)
├── assets/                    # Images, screenshots, icons
├── server/                    # Server-side admin routes and middleware
├── services/                  # Backend services (pricing engine, FX, gold API adapter)
├── repositories/              # Data access layer (file + Supabase backends)
├── docs/                      # Extended documentation
└── tests/                     # Test suite (66+ tests)
```

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Code style guide (vanilla ES6, no framework)
- PR workflow and branch naming
- How to add new countries and cities
- How to add new guide pages
- How to add new calculator tools

### Quick rules

- **No frameworks** — vanilla ES6 modules only
- **All UI strings** in `config/translations.js` (never hard-code)
- **Bilingual** — all user-facing features must support EN + AR
- **Test your changes** — `npm test` must pass
- **Preflight before PR** — `npm run preflight` + `npm run seo-audit`

---

## Troubleshooting

### Pages show "No data available"
- Check browser console for API errors
- Verify Gold API key is valid at [gold-api.com](https://gold-api.com)
- Try `?debug=true` to use the debug panel
- Clear localStorage: `localStorage.clear()` then refresh

### Tracker page not loading
- Ensure `scripts/pages/tracker-pro.js` exists (moved from root in v11)
- Check for script tag issues in tracker.html
- Verify `tracker/state.js` and `tracker/ui-shell.js` are accessible

### Service worker serving stale content
- Open DevTools → Application → Service Workers → Unregister
- Hard refresh: Ctrl+Shift+R / Cmd+Shift+R
- Or visit the page with `?debug=true` and click "Clear Cache"

### Build fails with Vite
- Ensure Node.js 24+ is installed (uses `fs.globSync`)
- Run `npm ci` to clean-install dependencies
- Check `vite.config.js` EXCLUDE_DIRS matches your directory structure

### Tests failing
- Run `npm install` first (some tests require `jsonwebtoken` package)
- Pre-existing: `repositories.test.js` may fail if `lib/supabase-client.js` is not present

### Tweet workflow not posting
- Verify all 5 Twitter secrets are set in GitHub repository settings
- Check workflow logs in Actions tab
- Ensure the X API app has read+write permissions

---

## Roadmap

### Near-term
- [ ] Multi-source price aggregation (Kitco + London Fix cross-validation)
- [ ] Silver/Platinum/Palladium price expansion
- [ ] Premium tier with ad-free experience
- [ ] Email newsletter automation (daily/weekly digest)
- [ ] Instagram and LinkedIn post automation
- [ ] Portfolio tracker (track gold holdings over time)

### Medium-term
- [ ] Interactive gold price heatmap (world map, color-coded by country)
- [ ] Crypto-gold correlation tracker
- [ ] WhatsApp Business API integration for price alerts
- [ ] Google Sheets plugin (`=GOLDPRICE("UAE","24K")`)
- [ ] Push notifications via Web Push API
- [ ] Multi-language expansion (French, Urdu, Hindi)

### Long-term
- [ ] Premium API for developers (rate-limited free tier)
- [ ] White-label solution for gold dealers
- [ ] Payment integration (Stripe) for gold ordering
- [ ] Mobile app (PWA or React Native)
- [ ] AI-powered market analysis and price predictions

---

## License

MIT
