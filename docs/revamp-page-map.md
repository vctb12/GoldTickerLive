# Gold Ticker Live revamp page map

Phase 1 goal: every public surface should support one clear journey instead of feeling like a loose
set of pages.

## Primary user journey

1. **Check price now** — start at `index.html`, `tracker.html`, or `countries/uae/`.
2. **Understand price** — use `methodology.html`, `learn.html`, and spot-vs-retail guide content.
3. **Calculate value** — use `calculator.html` and related tool pages.
4. **Compare countries** — use `countries/`, country pages, and tracker compare mode.
5. **Find shops** — use `shops.html`, market guides, and submit-shop flow.
6. **Set alert** — use tracker alerts panel.
7. **Learn / invest** — use `learn.html`, `insights.html`, `invest.html`, and guide content.

## Header IA

| Header label | Destination         | Purpose                                                                          |
| ------------ | ------------------- | -------------------------------------------------------------------------------- |
| Live Prices  | `/tracker.html`     | Main live workspace for checking, filtering, comparing, exporting, and alerting. |
| UAE Prices   | `/countries/uae/`   | Fast UAE/AED entry point for Dubai, Abu Dhabi, and GCC users.                    |
| Countries    | Dropdown            | Country, city, market, and country-comparison discovery.                         |
| Calculator   | `/calculator.html`  | Weight, karat, Zakat, scrap, and conversion tools.                               |
| Shops        | `/shops.html`       | Directory and market discovery.                                                  |
| Learn        | Dropdown            | Education, insights, investing, FAQ, and buyer context.                          |
| Methodology  | `/methodology.html` | Trust center for sources, freshness, AED peg, and formulas.                      |

Dropdowns are limited to areas where users need grouped discovery: **Countries**, **Tools**, and
**Learn**.

## Public page-purpose map

| Page / area                  | Primary purpose                                         | User job                                                           | Primary CTA       | Secondary CTA                    | IA notes                                                                                       |
| ---------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------ | ----------------- | -------------------------------- | ---------------------------------------------------------------------------------------------- |
| `index.html`                 | Platform landing page and live snapshot                 | Decide where to go in under 10 seconds                             | View Live Tracker | UAE Prices / Calculator          | Homepage should introduce spot-linked reference prices, not act as the only price workspace.   |
| `tracker.html`               | Main live price workspace                               | Check, compare, export, and set alerts                             | Use Live Prices   | Methodology / Calculator         | This is the strongest product page and should always show freshness/source labels near prices. |
| `calculator.html`            | Convert live reference prices into user-specific values | Calculate gold value by weight, karat, and mode                    | Calculate Value   | Methodology / Live Prices        | Calculator outputs are spot-linked estimates, not final shop quotes.                           |
| `countries/`                 | Country discovery hub                                   | Choose a country, city, or market page                             | Browse Countries  | Open Live Tracker                | Keep country grouping short and linked to compare mode.                                        |
| `countries/uae/`             | UAE/AED reference page                                  | Check UAE gold prices and understand AED peg context               | Check UAE Prices  | Dubai / Calculator               | UAE is the priority country page and should explain AED peg and retail-vs-spot.                |
| `countries/*/`               | Country reference pages                                 | Check local reference prices and market context                    | View local prices | Compare Countries / Calculator   | Country pages should not be thin duplicates; add local notes over time.                        |
| `countries/*/cities/*.html`  | City market context                                     | Check city-specific rates and buying notes                         | View city rates   | Related markets / Shops          | City pages should connect to nearby markets and shops.                                         |
| `countries/*/markets/*.html` | Known market guide                                      | Understand a souk/bazaar area before visiting                      | View market guide | Shops / Calculator               | Market pages are informational and must not imply shop verification.                           |
| `shops.html`                 | Shop and market directory                               | Find shops/markets and confirm details                             | Browse Shops      | Submit a Shop / Calculator       | Listings are informational, not endorsements or final quotes.                                  |
| `learn.html`                 | Evergreen education hub                                 | Learn karats, spot pricing, AED peg, Zakat, and retail differences | Read Gold Guide   | Methodology / Calculator         | Keep as the broad primer and link out to deeper guides.                                        |
| `insights.html`              | Market context and practical analysis                   | Understand why prices move and what retail gaps mean               | Read Insights     | Live Prices / Calculator         | Insights should feed users back to tools and country pages.                                    |
| `methodology.html`           | Trust and calculation transparency                      | Verify sources, formulas, freshness, and limitations               | Read Methodology  | Live Prices                      | This is the trust center; do not hide core assumptions elsewhere.                              |
| `invest.html`                | Practical investing guide                               | Compare bullion, jewelry, ETFs, Zakat, and planning                | Build Plan        | Live Prices / Calculator         | Avoid advice guarantees; position as education and planning.                                   |
| `pricing.html`               | Optional paid tiers / monetization                      | Understand paid features if available                              | Choose Plan       | Live Prices                      | Keep claims aligned with actual product availability.                                          |
| `privacy.html`               | Privacy policy                                          | Understand data, analytics, local storage, and rights              | Review Privacy    | Terms                            | Brand as Gold Ticker Live and keep legal language clear.                                       |
| `terms.html`                 | Terms and disclaimers                                   | Understand acceptable use and price limitations                    | Review Terms      | Methodology / Privacy            | Maintain spot/reference and no-financial-advice guardrails.                                    |
| `offline.html`               | Offline recovery state                                  | See cached prices or reconnect                                     | Try Again         | Cached prices                    | Make cached/stale wording visible and honest.                                                  |
| `404.html`                   | Recovery from broken URLs                               | Search or navigate to useful pages                                 | Search            | Live Prices / Calculator / Shops | Quick links should match the main user journey.                                                |
| `content/guides/`            | Guide library                                           | Browse educational articles                                        | Read Guides       | Learn / Methodology              | Keep guide categories aligned with Learn IA.                                                   |
| `content/tools/`             | Standalone tool pages                                   | Solve narrow calculator/conversion tasks                           | Use Tool          | Calculator / Live Prices         | Tools should cross-link back to calculator and tracker.                                        |
| `content/faq/`               | Common questions                                        | Resolve objections quickly                                         | Read FAQ          | Methodology / Live Prices        | Answers should reuse trust taxonomy.                                                           |
| `content/submit-shop/`       | Public shop submission                                  | Suggest a listing for review                                       | Submit Shop       | Shops                            | Submissions go to review, not automatic publication.                                           |
| `content/order-gold/`        | Buyer handoff / lead intent                             | Understand order flow and estimate before contact                  | Start Order       | Calculator / Shops               | Avoid implying guaranteed execution price.                                                     |
| `content/news/`              | Curated updates hub                                     | Follow market updates                                              | Read News         | Insights / Live Prices           | News should be curated, dated, and source-conscious.                                           |
| `content/premium-watch/`     | Retail premium education                                | Understand why shop quotes exceed spot                             | Compare Premiums  | Spot vs Retail / Calculator      | Reinforces trust distinction between reference and retail.                                     |
| `content/compare-countries/` | Country comparison guide                                | Compare country pricing context                                    | Compare Countries | Tracker Compare                  | Complements tracker, not a replacement.                                                        |
| `content/todays-best-rates/` | Best-rates usage guide                                  | Interpret lowest reference prices safely                           | Check Best Rates  | Tracker / Methodology            | Avoid “best deal” claims without shop-level data.                                              |
| `admin/`                     | Operational back office                                 | Manage business data and site operations                           | Open Dashboard    | Shops / Content modules          | Admin should not be required for public static pages to work.                                  |

## CTA rules

- Use one primary CTA per page hero.
- Repeat CTAs only when the user has a new decision point, not as decoration.
- Prefer journey labels over generic labels: “View Live Prices”, “Calculate Value”, “Compare
  Countries”, “Find Shops”, “Read Methodology”.
- Keep trust CTAs visible on price pages: “How this is calculated” or “Methodology”.
- Do not use retail-buying language for spot-linked reference estimates.

## Footer sitemap groups

- **Prices:** live prices, UAE prices, compare markets, history, best rates.
- **Tools:** calculator, alerts, converters, Zakat, exports, premium watch, search.
- **Countries:** all countries, core GCC pages, country comparison.
- **Shops:** directory, submit a shop, major gold souk guides.
- **Learn:** guide, insights, investing, spot vs retail, making charges, FAQ.
- **Trust:** methodology and source/freshness explanations.
- **Legal:** terms and privacy.
