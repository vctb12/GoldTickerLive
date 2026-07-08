# Phase 33 — Silver on tracker + calculator (Yellow)

Silver-on-the-tools is genuinely blocked on two things this session cannot safely do: live **silver
spot data** (owner-gated — it must come from `gold-price-fetch.yml`, which we never touch), and a
risky rewrite of the flagship calculator/tracker pricing paths for a feature that can't work yet.
Per the operating guardrails, this phase ships the **safe, tested resolution layer + a default-OFF
pilot flag** that make the eventual wiring trivial, and documents that wiring — without changing
gold or advertising a dead feature.

> Depends on the Phase 32 metals foundation (PR #569); this branch is based on it.

## Shipped (safe, no live change)

- **`src/config/metals-flags.js`** — `METALS_PILOT_ENABLED = false`. The single switch for the
  non-gold metals UI. Gold is never gated by it.
- **`src/lib/metal-pricing.js`** — `resolveMetalGramPrice(metalKey, purityCode, spotByMetal, opts)`,
  pure and side-effect-free, returning one honest tagged result:
  - `{ state: 'ok', usdPerGram, aedPerGram, … }` — priced (gold today; other metals once enabled),
    using the byte-identical `metalUsdPerGram` from the registry so **gold's numbers can't move**;
  - `{ state: 'pending-data' }` — an enabled metal with no spot feed yet (never a fake price);
  - `{ state: 'disabled' }` — a non-gold metal while the pilot is off. Plus `availableMetalKeys()` →
    `['gold']` today, all four when enabled.
- **`tests/metal-pricing.test.js`** (8) — pilot ships OFF; only gold offered while off; gold prices
  identically to the registry formula and 24K matches the direct value; silver is `disabled` while
  off, prices when on + data present, and is `pending-data` (not fake) when enabled without data.
- Neither module is imported by a live page — the bundler tree-shakes them out; **zero behaviour
  change** on the calculator, tracker, or anywhere else.

## Wiring design (for when the pilot is greenlit)

Once the owner adds silver spot (below) and flips `METALS_PILOT_ENABLED`:

1. **Metal switcher** (default **gold**) on the calculator and tracker — a segmented control built
   from `availableMetalKeys()`; when it returns only `['gold']` the control simply doesn't render,
   so the tools stay exactly as today.
2. **Pricing** — the calculator/tracker call `resolveMetalGramPrice(metal, grade, spotByMetal)`
   instead of the inline gold expression. For gold the result is byte-identical (proven), so the
   switch is a no-op for the default path.
3. **Honest states** — `pending-data` renders a "Silver pricing is being added" note (no number);
   `disabled` never appears in the UI (the metal isn't offered). No metal ever shows a fabricated
   price.
4. **Purity labels** — the switcher swaps the karat list for the metal's fineness grades (silver
   .999/.925/.900, etc.) from the registry.

## Owner-gated dependency (recommend-only — not done here)

Live silver needs `data/silver_price.json` (mirroring `gold_price.json`) written by the owner-gated
`gold-price-fetch.yml`, fetching the `XAG` spot symbol already registered in `metals.js`. That
workflow is **not modified**. Until it exists, `spotByMetal.silver` is absent and the resolver
correctly reports `pending-data`.

## Constraints honoured

Gold byte-identical (test-proven); AED peg / troy-oz immutable; pilot default OFF (no live change,
no dead feature advertised); no owner-gated files touched; $0.

## Gate

`npm run build` + `npm run validate` + `npm test` (1302 pass, +8) + `npm run lint` — all green.
