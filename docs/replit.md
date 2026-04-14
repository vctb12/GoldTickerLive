# GoldPrices

A bilingual (English and Arabic) live gold intelligence platform focused on the UAE, GCC, and
broader Arab markets.

## Overview

Provides real-time XAU/USD spot-linked pricing, currency conversions, historical data, and practical
calculation tools. Features regional relevance, transparent pricing methodology, and offline
resilience using browser-side caching (Service Worker + LocalStorage).

## Tech Stack

- **Frontend:** Vanilla HTML5, CSS3, JavaScript (ES6+ modules)
- **Build Tool:** Vite 5.4
- **Package Manager:** npm
- **APIs:** Gold API (live XAU/USD), ExchangeRate-API (currency), GDELT DOC API (news), DataHub
  (historical data)
- **PWA:** Service Worker + manifest.json for offline support and installability

## Project Layout

- `index.html` — Homepage with live gold prices
- `tracker.html` / `tracker-pro.js` — Live price tracker workspace
- `calculator.html` / `calculator.js` — Gold price calculator
- `shops.html` / `shops.js` — Gold shop directory
- `learn.html`, `insights.html`, `methodology.html`, `invest.html` — Informational pages
- `countries/` — Country-specific landing pages (UAE, Saudi Arabia, Egypt, etc.)
- `countries/[country]/cities/` — City-level pages (Dubai, Abu Dhabi, etc.)
- `countries/[country]/markets/` — Gold souk/market guides
- `guides/` — Buying guides
- `lib/` — Shared utilities (API fetching, caching, formatting, pricing)
- `components/` — Reusable UI components (nav, footer, charts, ticker)
- `config/` — Constants, country/karat definitions, translations
- `assets/` — Static assets (SVGs, screenshots)
- `sw.js` — Service Worker for offline support

## Development

```bash
npm install
npm run dev       # Dev server at http://localhost:5000
npm run build     # Build to dist/
npm run preview   # Preview production build
```

## Design System

The site uses a premium gold-themed design language with CSS custom properties for all design
tokens:

- **Gold palette:** `--color-gold` (#c4993e base), `--color-gold-dark` (#8a6420),
  `--color-gold-deep` (#5e4210), `--color-gold-light` (#e0b84a)
- **Premium gradients:** `--gradient-gold`, `--gradient-gold-subtle`, `--gradient-dark`,
  `--gradient-surface`
- **Luxury shadows:** `--shadow-gold`, `--shadow-gold-lg`, `--shadow-card-hover`, `--shadow-xl`
- **Transitions:** `--transition-md` (0.3s luxury easing), `--transition-bounce` (bouncy spring),
  `--transition-slow`
- **Nav:** Frosted glass (blur 14px + saturate 1.6) with gold accent line
- **Cards:** Surface gradients with gold top-border reveals on hover, elevated shadow depth
- **Ticker:** Dark glass effect with gold separators
- **Footer:** Rich gradient background with gold accent top line

## Configuration

- `vite.config.js` — Multi-page build with 26+ HTML entry points; dev server on `0.0.0.0:5000` with
  `allowedHosts: true` for Replit proxy compatibility
- `base` is set to `/` for dev (was `/Gold-Prices/` in original GitHub Pages config)

## Deployment

Configured as a **static** deployment:

- Build command: `npm run build`
- Public directory: `dist/`
