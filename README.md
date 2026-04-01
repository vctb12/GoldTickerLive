<div align="center">

# GoldPrices
### Live Gold Intelligence Platform for UAE, GCC, Arab Markets, and Global Reference Pricing
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
  <a href="https://github.com/vctb12/Gold-Prices/wiki">
    <img src="https://img.shields.io/badge/Wiki-Full%20Documentation-6F42C1?style=for-the-badge&logo=github&logoColor=white" alt="Wiki" />
  </a>
</p>

<p>
  <img src="https://img.shields.io/badge/Language-English%20%2F%20Arabic-8B5CF6?style=flat-square" alt="Bilingual" />
  <img src="https://img.shields.io/badge/Markets-24%2B-C2410C?style=flat-square" alt="Markets" />
  <img src="https://img.shields.io/badge/Karats-7-F59E0B?style=flat-square" alt="Karats" />
  <img src="https://img.shields.io/badge/Exports-CSV%20%2B%20JSON-059669?style=flat-square" alt="Exports" />
  <img src="https://img.shields.io/badge/Offline-Friendly-111827?style=flat-square" alt="Offline Friendly" />
  <img src="https://img.shields.io/badge/PWA-Ready-0EA5E9?style=flat-square" alt="PWA" />
  <img src="https://img.shields.io/badge/License-MIT-2563EB?style=flat-square" alt="License" />
</p>

</div>

---

## Overview

**GoldPrices** is a front-end gold pricing platform built for the UAE, GCC, the wider Arab world, and selected global reference markets.

It is designed to answer a simple problem well:

> most gold sites are either too narrow, too messy, too static, too ad-heavy, or too unclear about how their numbers are formed.

GoldPrices is built to be cleaner, more transparent, more bilingual, and more useful in practice.

It combines:

- live **XAU/USD spot-linked pricing**
- **local currency estimates**
- **7 purity-adjusted karat views**
- **historical archive and date lookup**
- **browser-based alerts and presets**
- **practical gold calculators**
- **country-specific market pages**
- **CSV / JSON exports**
- **English + Arabic support with RTL**
- **offline-friendly, local-first behavior**

The result is a product that feels less like a single quote widget and more like a usable gold tracking workspace.

---

## Why this project stands out

GoldPrices is not trying to be just another price page.

It is designed around five ideas:

### 1) Regional relevance
Most price tools are written with a generic global audience in mind. GoldPrices is structured for users in the UAE, GCC, Levant, North & East Africa, and adjacent Arabic-speaking markets.

### 2) Practical utility
The platform does not stop at showing one live number. It helps users compare, calculate, estimate, browse history, and export data.

### 3) Bilingual usability
Arabic is not treated as an afterthought. The product supports English and Arabic, including RTL handling and bilingual search-friendly structure.

### 4) Transparent methodology
Numbers are framed as **spot-linked bullion-equivalent estimates**, not disguised retail jewelry quotes. The site makes the logic understandable instead of hiding it.

### 5) Resilient front-end architecture
The experience is designed to remain usable even when live data is stale or unavailable, with cache-aware fallbacks and browser-side persistence.

---

## Quick Links

- **Main Site:** [vctb12.github.io/Gold-Prices](https://vctb12.github.io/Gold-Prices/)
- **Tracker Workspace:** [tracker.html](https://vctb12.github.io/Gold-Prices/tracker.html)
- **Calculator:** [calculator.html](https://vctb12.github.io/Gold-Prices/calculator.html)
- **Insights:** [insights.html](https://vctb12.github.io/Gold-Prices/insights.html)
- **Methodology:** [methodology.html](https://vctb12.github.io/Gold-Prices/methodology.html)
- **Wiki:** [Project Wiki](https://github.com/vctb12/Gold-Prices/wiki)
- **Latest Release:** [Releases](https://github.com/vctb12/Gold-Prices/releases/latest)

---

## Table of Contents

- [Platform Highlights](#platform-highlights)
- [Screenshots](#screenshots)
- [Core Workspaces](#core-workspaces)
- [Supported Markets](#supported-markets)
- [Main Pages](#main-pages)
- [Data Sources](#data-sources)
- [Price Logic](#price-logic)
- [System Resilience and Offline Behavior](#system-resilience-and-offline-behavior)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Technical Capabilities](#technical-capabilities)
- [Roadmap Direction](#roadmap-direction)
- [Documentation](#documentation)
- [License](#license)

---

## Platform Highlights

- **Live gold spot-linked pricing**
- **7 tracker karats** with purity-adjusted valuation
- **24+ supported markets** across GCC, Arab markets, and global references
- **English + Arabic interface**
- **RTL support**
- **Historical archive and date lookup**
- **Browser-based alerts and saved presets**
- **Gold calculators and unit conversion tools**
- **CSV / JSON export support**
- **Offline-friendly behavior with cache fallbacks**
- **Country-specific landing pages**
- **PWA install support**
- **Local persistence with `localStorage`**
- **Static deployment with no build step required**

---

## Screenshots

<p align="center">
  <img src="./assets/screenshots/home.png" alt="Home" width="32%" />
  <img src="./assets/screenshots/calculator.png" alt="Calculator" width="32%" />
  <img src="./assets/screenshots/methodology.png" alt="Methodology" width="32%" />
</p>

> Suggested next upgrade: add a second screenshot row for the tracker workspace, one country page, and a mobile view to make the repo page feel more complete and product-grade.

---

## Core Workspaces

### Live Market Tracking

GoldPrices tracks the live gold market through a spot-linked approach that keeps the platform understandable and responsive.

Main capabilities:

- **Live XAU/USD spot price** refreshed roughly every 90 seconds
- **Daily FX conversion** for supported markets
- **AED fixed peg** using the official `3.6725` AED/USD value
- **Per gram and per ounce** presentation
- **7 supported karats**:
  - 24K
  - 22K
  - 21K
  - 20K
  - 18K
  - 16K
  - 14K
- **Bilingual price context** and regional framing

### Tracker Workspace

The tracker is structured as a multi-mode workspace rather than a single page.

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

The calculator page extends the product beyond market watching.

Included tools:

- **Gold Value Calculator**
- **Scrap Gold Calculator**
- **Zakat on Gold Calculator**
- **Buying Power Calculator**
- **Weight Unit Converter**

### Additional Platform Modules

- **Country-specific pages**
- **Learn / glossary content**
- **Insights and market context pages**
- **Methodology and source transparency page**
- **Local storage-backed persistence**
- **Shareable / preset-friendly browser workflow**

---

## Supported Markets

| Region | Countries |
|--------|-----------|
| **GCC** | UAE, Saudi Arabia, Kuwait, Qatar, Bahrain, Oman |
| **Levant** | Jordan, Lebanon, Syria, Palestine |
| **North & East Africa** | Egypt, Libya, Tunisia, Algeria, Morocco, Sudan, Somalia, Mauritania, Djibouti, Comoros |
| **Global Reference** | USA, United Kingdom, Eurozone, India |

This mix gives the platform a strong regional identity while still anchoring it against major global reference markets.

---

## Main Pages

| Page | Purpose |
|------|---------|
| `index.html` | Landing page and main hub |
| `tracker.html` | Full live gold tracker workspace |
| `calculator.html` | Gold calculators and conversion tools |
| `learn.html` | Educational content and glossary |
| `insights.html` | Market context and gold-related insights |
| `methodology.html` | Sources, formulas, and transparency notes |
| `countries/*.html` | Country-specific gold price pages |

---

## Data Sources

| Source | Used for | Notes |
|--------|----------|-------|
| [Gold API](https://gold-api.com/docs) | Live XAU/USD spot price | Primary live market layer |
| [ExchangeRate-API](https://www.exchangerate-api.com/docs/free) | Currency conversion | FX layer |
| Hardcoded `3.6725` | UAE pricing | Official AED/USD peg |
| [DataHub Gold Prices Dataset](https://datahub.io/core/gold-prices) | Historical baseline | Long-range historical layer |
| [GDELT DOC API](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/amp/) | Market wire / headlines | News strip layer |

> **Important note**  
> Prices shown on the site are **spot-linked bullion-equivalent estimates**, not final jewelry retail prices.  
> Real store prices may differ because of:
>
> - making charges
> - dealer premiums
> - fabrication cost
> - VAT or taxes
> - shop markup

That distinction matters because it makes the project more honest and more useful.

---

## Price Logic

```text
1 troy ounce = 31.1035 grams

usdPerGram(karat) = (spotUsdPerOz / 31.1035) × purity
usdPerOz(karat)   = spotUsdPerOz × purity
localPrice        = usdPrice × fxRate

AED: always usdPrice × 3.6725
```

This keeps the pricing model simple enough to understand, reusable across modules, and transparent to users.

---

## System Resilience and Offline Behavior

GoldPrices is designed to degrade gracefully instead of breaking abruptly when APIs are slow or unavailable.

| State | Gold | FX | Behavior |
|-------|------|----|----------|
| 1 | Live | Live | Full precision, live state |
| 2 | Live | Stale | FX badge shows stale age |
| 3 | Stale | Live | Gold badge shows stale age |
| 4 | Both stale | Both stale | Dual stale indicators, cache-backed rendering |
| 5 | No cache | No cache | Empty state with retry flow |

This is one of the strongest parts of the product because it pushes the site closer to a resilient tool instead of a fragile demo.

---

## Getting Started

### Run locally

```bash
git clone https://github.com/vctb12/Gold-Prices.git
cd Gold-Prices
python3 -m http.server 8080
```

Then open:

```text
http://localhost:8080
```

No build step, no framework setup, and no package install is required for the base site.

### Debug mode

Add `?debug=true` to the URL:

```text
http://localhost:8080/?debug=true
```

This exposes a debug panel for:

- simulating gold API failure
- simulating FX API failure
- clearing local storage cache
- inspecting live state behavior

---

## Project Structure

```text
Gold-Prices/
├── index.html              # Landing page / homepage
├── tracker.html            # Main live gold tracker workspace
├── tracker-pro.js          # Tracker page logic: modes, charts, alerts, archive, planners, exports
├── tracker-pro.css         # Dedicated styling for the tracker workspace
├── calculator.html         # Gold calculator page
├── calculator.js           # Calculator logic: value, scrap, zakat, buying power, unit conversion
├── calculator.css          # Calculator page styling
├── learn.html              # Educational / glossary page
├── learn.js                # Learn page interactions and rendering
├── learn.css               # Learn page styling
├── insights.html           # Gold insights / market context page
├── insights.js             # Insights page logic
├── insights.css            # Insights page styling
├── methodology.html        # Methodology and sources page
├── methodology.js          # Methodology page interactions
├── methodology.css         # Methodology page styling
├── home.js                 # Homepage logic and shared landing-page behavior
├── home.css                # Homepage-specific styling
├── style.css               # Shared global styles, layout, theme, and responsive rules
├── manifest.json           # PWA manifest for installability and app shortcuts
├── sw.js                   # Service worker for caching and offline-friendly behavior
├── sitemap.xml             # Sitemap for search engines
├── robots.txt              # Search engine crawling rules
├── favicon.svg             # Site favicon
├── config/
│   ├── constants.js        # Core constants: API URLs, timing, fixed values, configuration
│   ├── countries.js        # Supported countries, currencies, flags, groups, and search aliases
│   ├── karats.js           # Karat definitions, purity values, and EN/AR labels
│   ├── translations.js     # Interface text in English and Arabic
│   └── index.js            # Central export file for config modules
├── lib/
│   ├── api.js              # Fetching live gold and FX data with retry/fallback handling
│   ├── cache.js            # localStorage caching, persistence, and fallback recovery
│   ├── export.js           # CSV / JSON / brief export helpers
│   ├── formatter.js        # Formatting helpers for prices, dates, times, and labels
│   ├── historical-data.js  # Historical data merging and long-range dataset handling
│   ├── price-calculator.js # Core gold pricing formulas and reusable calculation logic
│   ├── search.js           # Bilingual search and filtering helpers
│   └── alerts.js           # Local browser alert logic and saved alert helpers
├── tracker/                # Tracker-specific modules and UI/state helpers
├── components/             # Shared reusable UI parts
├── countries/              # Country-specific landing pages
├── assets/                 # Images, screenshots, icons, and static assets
└── README.md               # Project documentation
```

---

## Technical Capabilities

### Front-end architecture
- Static multi-page site
- Modular browser-side logic
- No mandatory build step for local use
- Progressive enhancement through modular scripts

### User experience architecture
- English and Arabic interface handling
- Responsive behavior across desktop and mobile
- RTL support
- Local persistence with `localStorage`
- PWA-style manifest and service worker support

### Product utility
- Historical data support
- Country-level pricing views
- Calculator suite
- Exports and brief generation
- Debug mode and resilience testing

### Search and discoverability
- `sitemap.xml`
- `robots.txt`
- country pages for broader surface area
- methodology page for transparency and trust

---

## Documentation

For deeper project documentation, implementation notes, and roadmap detail, use the wiki:

- [Wiki Home](https://github.com/vctb12/Gold-Prices/wiki)
- [Getting Started](https://github.com/vctb12/Gold-Prices/wiki/Getting-Started)
- [Platform Architecture](https://github.com/vctb12/Gold-Prices/wiki/Platform-Architecture)
- [Features and Modules](https://github.com/vctb12/Gold-Prices/wiki/Features-and-Modules)
- [Tracker Workspace](https://github.com/vctb12/Gold-Prices/wiki/Tracker-Workspace)
- [Calculator Engine](https://github.com/vctb12/Gold-Prices/wiki/Calculator-Engine)
- [Historical Data and Exports](https://github.com/vctb12/Gold-Prices/wiki/Historical-Data-and-Exports)
- [Deployment, Hosting, and SEO](https://github.com/vctb12/Gold-Prices/wiki/Deployment,-Hosting,-and-SEO)
- [Roadmap](https://github.com/vctb12/Gold-Prices/wiki/Roadmap)

---

## Roadmap Direction

Strong next directions for the project include:

- richer historical chart ranges and zoom levels
- better archive navigation and comparison flows
- more export formats and dataset packaging
- stronger country coverage and market depth
- improved mobile interaction in tracker-heavy sections
- more advanced alert logic
- deeper SEO around country pages and methodology pages
- more polished screenshot and social preview assets
- public changelog discipline across releases

---

## Why GoldPrices has room to scale

The current structure already supports something bigger than a simple market page.

With stronger polish over time, GoldPrices can grow into:
- a premium regional reference layer for live gold pricing
- a trustworthy Arabic/English market utility tool
- a better public product for search discovery and country-based traffic
- a stronger portfolio project from both UI/UX and product-thinking angles

---

## License

MIT
```
