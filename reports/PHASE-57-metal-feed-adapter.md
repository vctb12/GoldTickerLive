# Phase 57 — Multi-metal spot-feed ingestion adapter (Theme B)

**Theme B (multi-metal).** The ingestion layer that feeds Phase 56's comparison view-model: a pure,
tested adapter that reads per-metal price feeds in the **same shape the gold feed already uses** and
produces the `spotByMetal` map. **Code-complete, awaiting owner feed credentials** — the non-gold
`data/<metal>_price.json` files don't exist yet.

## How it fits Theme B

- Phase 56 shipped `buildMetalComparison(spotByMetal, …)` — but nothing produces `spotByMetal` for
  non-gold metals.
- This phase adds the producer: `buildSpotByMetal(feedsByMetal)` → the map Phase 56 consumes.

The two compose cleanly (verified by the output-contract test — a `{ metalKey: positiveNumber }`
map), so once both land, `buildSpotByMetal(...) → buildMetalComparison(...)` is the full pipeline.

## Mirrors the gold feed shape

`api.js` normalizes `data/gold_price.json`: an optional `{ ok, data }` envelope wrapping
`xauUsdPerOz` / `xau_usd_per_oz` (and legacy `gold.ounce_usd`), plus timestamp / source metadata.
This adapter **generalizes that exact normalization** by the metal's spot symbol (XAU→`xau`,
XAG→`xag`, XPT→`xpt`, XPD→`xpd`), so silver/platinum/palladium feeds published in the same format
flow through with zero code change.

## What shipped

- **`src/lib/metal-feed-adapter.js`** — pure, side-effect-free (it does **not** fetch; callers load
  the JSON):
  - `metalDataUrl(metalKey)` → `/data/<metal>_price.json` (the conventional feed path).
  - `normalizeMetalFeed(metalKey, rawData)` →
    `{ metalKey, spotUsdPerOz, updatedAt, source, state }`. Reads `<sym>UsdPerOz` /
    `<sym>_usd_per_oz` / generic `spotUsdPerOz` / `usdPerOz` / `price` / legacy `<metal>.ounce_usd`;
    a missing / malformed / non-positive feed → `spotUsdPerOz: null`, `state: 'pending-data'`.
    **Never fabricates a price.**
  - `buildSpotByMetal(feedsByMetal)` → `spotByMetal` map with only the metals that have a valid
    feed.
- **`tests/metal-feed-adapter.test.js`** — 7 tests (gold shape incl. envelope / snake_case / legacy;
  silver/platinum/palladium symbols + generic keys; missing/malformed → pending-data; map contract;
  empty/null input).

## Fully wired, flagged OFF

The adapter is pure and harmless on its own; the comparison it feeds stays gated by
`METALS_PILOT_ENABLED` (Phase 56). Peg (3.6725), troy-oz (31.1035), and the reference-estimate
framing are untouched; gold's numbers are unchanged.

## Owner action (blocker)

Publish the non-gold spot feeds at `data/silver_price.json`, `data/platinum_price.json`,
`data/palladium_price.json` in the same format as `data/gold_price.json` (owner-gated fetch
pipeline, which I do not touch), then flip `METALS_PILOT_ENABLED`. Until then this ships dormant.

## Verification

- `node --test tests/metal-feed-adapter.test.js` → 7/7 pass
- `npm test` → 1399/1399 pass
- `npm run lint` → clean
- `npm run build` → success
- `npm run validate` → exit 0
