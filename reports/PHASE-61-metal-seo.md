# Phase 61 — Registry-driven per-metal SEO / JSON-LD (Theme B)

**Theme B (multi-metal).** A pure, tested generator that turns the metals registry into per-metal
page SEO (title, description) and a schema.org `WebPage` JSON-LD — bilingual and honesty-framed.
**Not feed-blocked** (SEO needs no spot feed), so unlike the Phase 56–60 view-models this is
immediately useful, not dormant.

## Why this (and an honest note on the orchestrator)

Phases 56–60 built the multi-metal view-model layer (feed adapter → comparison → freshness →
selector → render). The natural next step is an **end-to-end orchestrator** that composes them into
one entry a page calls — but every one of those modules lives on an **unmerged PR** (#601–#605), not
on `main`, so an orchestrator can't import or integration-test them yet. Rather than ship a
contrived stub, this phase does the last genuinely-standalone metals item: SEO. It depends only on
`metals.js` (on `main`), so it stands alone and is testable today. Once the metals PRs merge, the
orchestrator becomes a clean follow-up.

## What shipped

- **`src/lib/metal-seo.js`** — pure, side-effect-free.
  - `buildMetalSeo(metalKey, { lang?, siteName? })` → `{ metal, lang, title, description, jsonLd }`,
    all derived from the registry (name EN/AR, spot symbol, purity grades).
  - `buildAllMetalSeo(options)` → SEO for every registry metal, gold first.
  - `renderMetalJsonLd(seo)` → the JSON-LD string for a `<script type="application/ld+json">` tag.
- **`tests/metal-seo.test.js`** — 6 tests.

## Honesty guardrails

- **No Offer / price in the JSON-LD.** The schema is a `WebPage` about the metal as a `Thing` —
  deliberately not a `Product`/`Offer`, because the site publishes spot-linked _reference
  estimates_, not offers to sell. A test asserts the JSON-LD contains no `Offer`/`Product`/`price`.
- **"Live" only for gold.** Gold has a live feed today; silver/platinum/palladium are described as
  reference resources, not "live" prices (they have no feed yet). A test locks this in.
- **Framing preserved.** Every description carries "reference estimate — not retail pricing and not
  financial advice" (EN + AR).

## Adoption

The existing metal pages (Phases 34–35) can adopt this generator for a single, registry-driven
source of SEO instead of hand-maintained inline tags — consistent metadata that updates when the
registry does. Not wired here (pure utility); peg / troy-oz / framing untouched; gold's numbers
unchanged.

## Verification

- `node --test tests/metal-seo.test.js` → 6/6 pass
- `npm test` → 1398/1398 pass
- `npm run lint` → clean
- `npm run build` → success
- `npm run validate` → exit 0

## Owner action

None required (SEO is not feed-gated). The non-gold spot feeds remain the blocker for the _pricing_
view-models (Phases 56–60), not for this SEO metadata.
