# Phase 56 — Multi-metal comparison view-model (Theme B start)

**Theme B (multi-metal).** The first increment of the multi-metal build-out: a pure, tested
view-model that renders gold, silver, platinum and palladium side by side — **code-complete,
awaiting owner feed credentials** for the non-gold spot feeds. Gated by `METALS_PILOT_ENABLED`
(default OFF).

## Where Theme B stands

The foundation from Phases 32–35 already exists: the `metals.js` registry (all four metals with
purities), `resolveMetalGramPrice`, and the `METALS_PILOT_ENABLED` gate. But those building blocks
are **not consumed anywhere** — nothing renders a side-by-side view. This phase adds that view-model
without duplicating the foundation.

## What shipped

- **`src/lib/metal-comparison.js`** — pure, side-effect-free.
  - `buildMetalComparison(spotByMetal, { pilotEnabled?, lang?, purityByMetal? })` → one row per
    metal (gold-first) at its default grade, each carrying a **truthful state**:
    - `ok` — has a spot feed → real `usdPerGram` / `aedPerGram` (via `resolveMetalGramPrice`);
    - `pending-data` — pilot on but no feed yet → prices `null`;
    - `disabled` — pilot off → prices `null`. It **never fabricates a non-gold price**.
  - `normalizeSpotMap(raw)` — keeps only finite, positive spot values, so a missing / corrupt feed
    degrades to `pending-data` rather than a bogus number.
  - `renderMetalComparison(model)` — returns `''` while the pilot is off (nothing mounts); otherwise
    a human-readable, bilingual, disclaimer-framed render.
  - `isMetalComparisonEnabled()` — reflects `METALS_PILOT_ENABLED`.
- **`tests/metal-comparison.test.js`** — 8 tests.

## Gold is untouched

The gold row comes from the same `resolveMetalGramPrice('gold', '24', …)` path — a test asserts its
`usdPerGram` / `aedPerGram` are **byte-identical** to calling that function directly. The peg
(3.6725), troy-oz (31.1035), and the reference-estimate / not-financial-advice framing are
unchanged.

## Fully wired, flagged OFF

The model calls the real pricing path and is ready to render, but `renderMetalComparison` returns
`''` and non-gold rows are `disabled` until `METALS_PILOT_ENABLED` is flipped **and** a non-gold
spot feed exists. As feeds arrive, metals flip `pending-data → ok` automatically, no code change.

## Owner action (blocker)

**Non-gold spot feeds.** Silver / platinum / palladium have no live spot source. Enabling the pilot
needs (a) the owner's XAG / XPT / XPD spot feed wired into the price pipeline (owner-gated
`gold-price-fetch.yml` → `data/*_price.json`, which I do not touch), and (b) flipping
`METALS_PILOT_ENABLED`. Until then this ships dormant.

## Verification

- `node --test tests/metal-comparison.test.js` → 8/8 pass
- `npm test` → 1400/1400 pass
- `npm run lint` → clean
- `npm run build` → success
- `npm run validate` → exit 0
