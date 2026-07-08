# Phase 35 — Platinum + Palladium rollout (Yellow)

Doubly gated: platinum/palladium need `XPT`/`XPD` spot data (owner-gated, same as silver) **and**
the plan says "only after silver is clean." So this is a spec, not a live rollout — but the heavy
lifting is already done: the Phase 32 foundation registers both metals, and the Phase 33 resolver
already returns `pending-data`/`disabled`/`ok` for them with zero extra code. This phase records the
small, mechanical rollout that follows silver.

## Already in place (Phases 32–33)

- `METALS.platinum` (**XPT**) and `METALS.palladium` (**XPD**) with fineness grades (.999 / .950),
  bilingual names, and gold-identical maths via `metalUsdPerGram`.
- `resolveMetalGramPrice('platinum'|'palladium', …)` already works — `disabled` while the pilot is
  off, `pending-data` when enabled without a feed, `ok` once a feed exists. No new pricing code.
- `availableMetalKeys({pilotEnabled:true})` already returns all four metals.

## Rollout steps (after silver is live and stable)

1. **Data (owner):** add `XPT` and `XPD` to `gold-price-fetch.yml` → `data/platinum_price.json`,
   `data/palladium_price.json` (mirroring gold/silver). Owner-gated — not done here.
2. **Tools:** no code change beyond adding `platinum`/`palladium` to the metal switcher's option
   list (already produced by `availableMetalKeys()`), because the calculator/tracker call the shared
   resolver. Purity labels come from the registry.
3. **Landing pages:** `platinum.html` / `palladium.html` per the **Phase 34 silver spec** (same
   structure, SEO wiring, honesty guardrails) — swap the metal, the fineness grades, and the
   evergreen copy (platinum/palladium are industrial + autocatalyst metals; frame demand
   descriptively, never predictively).
4. **SEO:** canonical, reciprocal hreflang, JSON-LD, sitemap, OG images, internal linking —
   identical checklist to silver; `npm run validate` must be green.

## Why after silver

Sequencing de-risks: silver validates the whole metal path (switcher, resolver, landing template,
SEO) end-to-end with real data before platinum/palladium reuse it verbatim. Rolling all three at
once would multiply the surface under test with no benefit.

## Honesty guardrails

Platinum/palladium are far more volatile and thinly quoted than gold — the pages must lean harder on
"reference estimate, not a dealer quote," show freshness prominently, and avoid any
investment/prediction framing (aligns with Phase 43's descriptive-analysis policy). Never show a
fabricated or stale-as-live price; the resolver's `pending-data` state guarantees this.

## Status

Docs-only. No live rollout, no owner-gated files touched. Everything code-side is already shipped in
PRs #569/#570; this is the sequenced follow-up once data exists.
