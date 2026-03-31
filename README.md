# GoldPrices - Live Gold Tracker for UAE, GCC & Arab Markets | أسعار الذهب المباشرة

A bilingual (English/Arabic) gold price platform for tracking live XAU/USD-linked gold prices across the UAE, GCC, Levant, North & East Africa, and selected global reference markets.
Built as a lightweight static site, GoldPrices combines live spot pricing, local-currency estimates, historical views, alerts, calculators, exports, and country pages in a fast, offline-friendly experience.

## Live Demo

- **Main site:** [Open the site](https://vctb12.github.io/Gold-Prices/)
- **Live tracker:** [tracker.html](https://vctb12.github.io/Gold-Prices/tracker.html)
- **Calculator:** [calculator.html](https://vctb12.github.io/Gold-Prices/calculator.html)

## Highlights

- Live gold spot pricing
- Karat-based calculations
- Multi-country local currency estimates
- English + Arabic UI with RTL support
- Historical views, charts, and date lookup
- Alerts, presets, planners, and exports
- Offline-friendly behavior with service worker caching
- Country-specific pages and SEO-friendly structure

## Screenshots

<p align="center">
  <img src="./assets/screenshots/home.png" alt="Home" width="32%" />
  <img src="./assets/screenshots/calculator.png" alt="Calculator" width="32%" />
  <img src="./assets/screenshots/methodology.png" alt="Methodology" width="32%" />
</p>

## Features

### Live Market Tracking
- **Live XAU/USD spot price** — refreshed roughly every 90 seconds
- **Daily FX conversions** — local currency conversion across supported markets
- **AED fixed peg** — UAE pricing uses the official AED/USD peg of `3.6725`
- **7 tracker karats** — 24K, 22K, 21K, 20K, 18K, 16K, 14K
- **Per gram and per ounce** — switch between major units
- **Price context** — compare against prior values and market context
- **Bilingual UI** — English (default) and Arabic with full RTL layout
- **Offline-first behavior** — graceful fallback through cache and stored state

### Tracker Workspace
The live tracker is organized into multiple modes:

- **Live** — chart, live metrics, karat ladder, watchlist, and decision cues
- **Compare** — compare supported markets and rank by selected view
- **Archive** — browse historical data, search ranges, and run date lookup
- **Alerts** — save local browser alerts and presets
- **Planner** — budgeting, position tracking, jewelry estimate, accumulation planning
- **Exports** — visible chart CSV, archive CSV, history CSV, JSON snapshot, market brief
- **Method** — transparent explanation of sources, pricing logic, and limitations

### Calculator Tools
The calculator page includes:

- **Gold Value**
- **Scrap Gold**
- **Zakat on Gold**
- **Buying Power**
- **Unit Converter**

### Platform Features
- **PWA-ready** manifest and installable shortcuts
- **Service worker caching** for offline resilience
- **Country landing pages** for major markets
- **Learn / glossary content**
- **Insights and methodology pages**
- **CSV and JSON exports**
- **Shareable preset / URL workflow**
- **Local browser persistence** using `localStorage`

## Supported Markets

| Region | Countries |
|--------|-----------|
| **GCC** | UAE, Saudi Arabia, Kuwait, Qatar, Bahrain, Oman |
| **Levant** | Jordan, Lebanon, Syria, Palestine |
| **North & East Africa** | Egypt, Libya, Tunisia, Algeria, Morocco, Sudan, Somalia, Mauritania, Djibouti, Comoros |
| **Global Reference** | USA, United Kingdom, Eurozone, India |

## Main Pages

| Page | Purpose |
|------|---------|
| `index.html` | Landing page and product overview |
| `tracker.html` | Full live gold workspace |
| `calculator.html` | Gold calculators and converters |
| `learn.html` | Educational content and glossary |
| `insights.html` | Gold-related market context and insights |
| `methodology.html` | Pricing logic, sources, and transparency notes |
| `countries/*.html` | Country-specific gold price pages |

## Data Sources

| Source | Used for | Notes |
|--------|----------|-------|
| [Gold API](https://gold-api.com/docs) | Live XAU/USD spot price | Live market layer |
| [ExchangeRate-API](https://www.exchangerate-api.com/docs/free) | FX conversion | Daily conversion layer |
| Hardcoded `3.6725` | UAE AED conversion | Official AED/USD peg |
| [DataHub Gold Prices Dataset](https://datahub.io/core/gold-prices) | Historical baseline | Long-range historical layer |
| [GDELT DOC API](https://blog.gdeltproject.org/gdelt-doc-2-0-api-debuts/amp/) | Market wire / headlines | News strip and wire layer |

> **Note:** Prices shown on the site are **spot-linked bullion-equivalent estimates**, not final jewelry retail prices. Real retail prices can differ because of making charges, dealer premiums, taxes, and store markups. This project is for estimation, tracking, and comparison only — not financial advice.

## Getting Started

```bash
git clone https://github.com/vctb12/Gold-Prices.git
cd Gold-Prices
python3 -m http.server 8080
# Open http://localhost:8080
```

No build step, no dependencies, no API keys required.

## File Structure

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
├── components/             # Shared reusable UI parts (nav, footer, ticker, etc.)
├── countries/              # Country-specific landing pages
├── assets/                 # Images, screenshots, icons, and other static assets
└── README.md               # Project documentation
```

## Price Calculations

```
1 troy ounce = 31.1035 grams

usdPerGram(karat) = (spotUsdPerOz / 31.1035) × purity
usdPerOz(karat)   = spotUsdPerOz × purity
localPrice        = usdPrice × fxRate

AED: always usdPrice × 3.6725 
```

## Caching & Offline Behavior

| State | Gold | FX | Behavior |
|-------|------|----|----------|
| 1 | Live | Live | Full precision, green/amber badges |
| 2 | Live | Stale | FX amber badge, "FX X hours old" |
| 3 | Stale | Live | Gold amber badge, prices still work |
| 4 | Both stale | Both stale | Dual badges, renders from cache |
| 5 | No cache | No cache | Empty state + retry button |

## Debug Mode

Add `?debug=true` to the URL:

```
http://localhost:8080/?debug=true
```

Shows a panel with:
- Simulate gold API failure
- Simulate FX API failure
- Clear all localStorage cache
- Live STATE inspector

## Browser Support

Chrome 90+, Firefox 88+, Safari 14+, iOS Safari 14+, Android Chrome 90+

Requires: ES6 modules, `fetch`, `localStorage`, `navigator.clipboard`, `Intl`

## License

MIT
