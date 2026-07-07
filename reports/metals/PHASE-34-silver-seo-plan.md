# Phase 34 — Silver SEO + landing page (Green)

A live `silver.html` cannot ship honestly today: there is no silver spot feed (owner-gated — see
Phase 33), so the page's core promise ("silver price") would be empty. Publishing an SEO page that
ranks for "silver price" and shows none is an honesty/UX regression, exactly the kind the shops and
learn phases pushed back on. So this phase delivers the **complete, ready-to-publish spec** for the
silver landing page + SEO wiring, to ship the moment the silver pilot goes live (Phase 33 flag +
owner XAG data). No premature page is published.

## Page spec — `silver.html`

Mirror the structure of `dubai-gold-price.html` / the tool pages so it inherits the shared shell,
theme, bilingual toggle, and validation:

- **Title / H1:** "Silver Price Today — Reference Value by Fineness" / bilingual AR.
- **Above the fold:** the live silver spot badge + the silver value-per-gram table by fineness (.999
  / .925 / .900), sourced from `resolveMetalGramPrice('silver', …)` (Phase 33). While the pilot is
  off, the page **must not publish** — this is why it's a spec, not a live file.
- **Evergreen sections (SEO body, valid even before live pricing):** what moves the silver price;
  fineness vs karat; silver vs gold (volatility, industrial demand, gold/silver ratio — descriptive,
  never predictive); how the reference value is calculated (link to methodology). These reuse the
  `edu-*` component already on compare/portfolio.
- **Trust line:** identical spot-linked reference-estimate disclaimer as every price surface; AED
  via the fixed 3.6725 peg.
- **Cross-links:** calculator (silver mode), tracker (silver), compare, methodology.

## SEO wiring (must all pass `npm run validate`)

- **Canonical:** `https://goldtickerlive.com/silver.html` (self).
- **hreflang:** `en` + `ar` (`?lang=ar`) + `x-default`, reciprocal — the `reference-language-sweep`
  and `inventory-seo` checks enforce this.
- **JSON-LD:** `BreadcrumbList` + a `WebPage`/`Article` for the guide (not `WebApplication` — it's a
  content+tool hybrid; if the live tool ships, add a `FinancialProduct`-style block). Injected via
  `scripts/node/inject-schema.js` (add a `silver.html` mapping there when the page lands).
- **Sitemap:** add `silver.html` to `build/generateSitemap.js` inputs.
- **OG/Twitter:** `assets/og/silver.png` (new OG image needed), `summary_large_image`.
- **Internal linking:** add to nav/footer + the homepage "location/tools" rails so it isn't an
  orphan (the `check-links` / crawl-architecture checks from Phase 13).

## Content honesty guardrails

- No predictive claims ("silver will rise") — descriptive only, matching the Phase 43
  market-analysis policy.
- Silver vs gold framing must not imply investment advice; every figure a reference estimate.
- The gold/silver ratio, if shown, is presented as a historical/descriptive metric, not a signal.

## Dependencies / sequencing

1. **PR #569** (Phase 32 metals foundation) — merged.
2. **PR #570** (Phase 33 pricing-resolution layer + pilot flag) — merged.
3. **Owner:** add `XAG` to `gold-price-fetch.yml` → `data/silver_price.json`; flip
   `METALS_PILOT_ENABLED`.
4. **Then:** publish `silver.html` per this spec + the SEO wiring above; `npm run validate` must be
   green (content-lint, inventory-seo, seo-governance, inject-schema, sitemap).

## Why docs-only here

Shipping the page now means either an empty price table or a fake one — both fail the site's
non-negotiable honesty rule. The spec is complete so publication is a mechanical follow-up once the
data exists; nothing here changes the live site or touches owner-gated files.
