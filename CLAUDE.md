# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running Locally

No build step is required. Serve the static files directly:

```bash
python3 -m http.server 8080
# Then open http://localhost:8080
```

Append `?debug=true` to any page URL to enable the debug panel (simulates API failures, clears cache, inspects live state).

## Architecture Overview

This is a **zero-dependency, static front-end** gold pricing platform for GCC/Arab markets, written in vanilla ES6 modules — no bundler, no framework, no package manager.

### Data Flow

```
HTML page
  → page-specific JS (home.js, tracker-pro.js, calculator.js, country-page.js, …)
    → lib/ (api.js → cache.js → price-calculator.js → formatter.js)
    → config/ (constants, countries, karats, translations)
    → components/ (nav, footer, ticker, chart)
      → External APIs (gold-api.com for XAU/USD, exchangerate-api.com for FX)
```

### Key Modules

| Path | Role |
|------|------|
| `config/constants.js` | API URLs, timeouts, refresh interval (90 s), cache key names, AED peg (3.6725), troy-oz divisor |
| `config/countries.js` | 24+ countries with codes, names (EN/AR), currencies, flags, regional groups, peg flags |
| `config/karats.js` | 7 karat definitions (24K–14K) with purity fractions and EN/AR labels |
| `config/translations.js` | All UI strings in English and Arabic |
| `lib/api.js` | Fetch with timeout, retry, and simulation hooks for gold price and FX rates |
| `lib/cache.js` | Dual-layer localStorage persistence (primary + fallback) with stale recovery |
| `lib/price-calculator.js` | Core formulas: `usdPerGram(karat) = (spotUsdPerOz / 31.1035) × purity`; local price = USD × FX rate |
| `lib/formatter.js` | Price, date, time, and label formatting |
| `lib/export.js` | CSV / JSON / brief export generators |
| `lib/alerts.js` | Browser-side price alert logic |
| `lib/historical-data.js` | Merges session history with DataHub baseline dataset |
| `lib/search.js` | Bilingual (EN/AR) search and filtering |
| `tracker/state.js` | Tracker workspace state (mode, currency, karat, range, alerts, presets, favorites); synced to URL hash (`#mode=live&cur=AED&k=24&u=gram`) |
| `tracker/ui-shell.js` | UI orchestration for the tracker page |
| `components/chart.js` | Interactive price chart |
| `components/nav.js` | Bilingual navigation bar |
| `data/shops.js` | Hardcoded shop reference data |

### State Management

- **Homepage** (`index.html` / `home.js`): global `STATE` object in `app.js`
- **Tracker** (`tracker.html` / `tracker-pro.js`): `tracker/state.js` module; state also serialised into the URL hash for shareability
- **Persistence**: `lib/cache.js` wraps `localStorage` for gold price, FX rates, history, and user preferences

### Resilience

- Dual cache layers (primary + fallback) prevent data loss on storage errors
- API failures degrade gracefully — stale-data badges shown, last-known values used
- Service worker (`sw.js`) serves static assets cache-first and API calls network-first for offline support
- AED is always computed using the hardcoded peg (3.6725) regardless of FX API response

### Bilingual / RTL Support

- All user-visible strings come from `config/translations.js` (never hard-code UI text)
- Arabic locale flips layout direction via RTL CSS; `config/countries.js` carries both EN and AR country names

### Adding a New Country

1. Add an entry to `config/countries.js` (code, names, currency, group, decimals, peg flag if applicable)
2. Create `countries/<slug>.html` — follow an existing country page as a template; it uses `country-page.js` / `country-page.css`
3. Update `sitemap.xml` and the navigation in `components/nav.js` if the page should appear in menus

### External Data Sources

| Source | Used for |
|--------|----------|
| gold-api.com | Live XAU/USD spot price (~90 s refresh) |
| exchangerate-api.com | Currency conversion rates |
| datahub.io | Historical baseline dataset |
| GDELT DOC API | Market news headlines |
