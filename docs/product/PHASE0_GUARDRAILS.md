# Phase 0 — Product Guardrails (Must Land First)

## Purpose

Create non-negotiable product rules for trust language before any broad visual or UX revamp.

This phase ensures the site remains explicit about what prices represent and what they do **not**
represent.

## Scope

- Copy and labeling standards for all pages that show prices, rates, listings, or market
  comparisons.
- Shared trust wording patterns for banners, cards, and detail panels.
- Verification checklist for PR review.

Out of scope:

- Major layout redesigns
- Framework migrations
- Large structural rewrites

---

## Core Trust Rules

1. **Always separate reference prices from retail outcomes.**
   - Use “spot-linked reference estimate” for computed values.
   - Never label computed values as “shop price” unless sourced from a real store feed.

2. **Always label data freshness and source layer.**
   - Every critical price surface must indicate one of:
     - `Live`
     - `Cached`
     - `Fallback`
     - `Derived estimate`

3. **Always expose timing context.**
   - Show timestamp/age where possible (e.g., “Updated 3 min ago”).
   - If stale, show “Delayed” or “Stale” state explicitly.

4. **Never imply store verification without evidence.**
   - For market clusters or area listings, use wording such as:
     - “Market-area listing”
     - “Directory reference profile”

5. **Always include user next-step guidance.**
   - On shops/listings surfaces, include:
     - “Confirm final prices, making charges, and VAT directly with seller.”

---

## Global Label Taxonomy

Use these canonical labels across UI:

- `Spot/reference estimate`
- `Retail price (from seller)`
- `Live data`
- `Cached data`
- `Fallback value`
- `Derived value`
- `Last reviewed`
- `Methodology`

Avoid ambiguous terms:

- “accurate retail now”
- “verified price” (unless provenance is explicit)
- “official market price” (unless the source is named)

---

## Required Trust Elements by Page Type

### Tracker pages

Must include:

- source-layer label (live/cached/fallback)
- methodology link
- spot-vs-retail distinction
- timestamp or age indicator

### Shops directory and listing detail modal

Must include:

- listing-type clarity (store vs market area)
- details availability badge (full/partial/limited)
- “confirm directly with seller” disclaimer
- last reviewed date for directory content

### Country/city/market guide pages

Must include:

- clear separation between benchmark prices and local retail variability
- links to methodology and relevant tracker/shops pages

---

## Copy Pattern Rules

- Use short, explicit sentences over marketing-heavy claims.
- Prefer “estimate”, “reference”, “indicative”, “derived” where applicable.
- Keep disclaimers informative and actionable.
- Avoid fear language and avoid overconfidence claims.

---

## PR Review Checklist (Phase 0 Gate)

For any PR touching pricing/listing UI, reviewers must confirm:

- [ ] Spot/reference vs retail is explicit on the changed surface.
- [ ] Live/cached/fallback/derived status is visible where relevant.
- [ ] Timestamp or recency context is present or intentionally not applicable.
- [ ] Trust disclaimer is present and not vague.
- [ ] Methodology link remains discoverable.
- [ ] No wording implies verification without supporting data.

If any item fails, PR should not be marked complete.
