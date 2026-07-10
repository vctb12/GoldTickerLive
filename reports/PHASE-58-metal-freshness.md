# Phase 58 — Per-metal freshness view-model (Theme B)

**Theme B (multi-metal).** Gives each metal in the comparison an honest freshness state, judged by
the **same canonical policy as gold** — no second source of truth. **Code-complete, awaiting owner
feed credentials** (non-gold feeds carry the `updatedAt` this model reads).

## How it fits Theme B

- Phase 56 (`buildMetalComparison`) prices each metal.
- Phase 57 (`metal-feed-adapter`) carries an `updatedAt` per metal.
- This phase turns those timestamps into a freshness state per metal, so the comparison can label
  each row live / cached / delayed / estimated once feeds exist.

## Reuses the canonical policy (not a copy)

`assessMetalFreshness` computes the age from the feed's `updatedAt` and hands it to the **existing**
`evaluateFreshnessState` from `freshness-policy.js` — the same live ≤ 5s / cached ≤ 60s / delayed ≤
300s budgets the gold badge already uses. A test asserts the result is **identical** to calling
`evaluateFreshnessState` directly, so a metal's freshness can never drift from gold's.

## What shipped

- **`src/lib/metal-freshness.js`** — pure, side-effect-free.
  - `assessMetalFreshness({ updatedAt, observedAtMs, marketOpen?, policy? })` →
    `{ state, ageMs, reason }`. A missing / invalid timestamp → `state: 'unavailable'`
    (`reason: 'no-timestamp'`), never a faked freshness; a future timestamp clamps to age 0;
    market-closed → `closed`.
  - `buildMetalFreshness(feedMetaByMetal, { observedAtMs, … })` → freshness per metal.
  - `overallMetalFreshness(freshnessByMetal)` → the **stalest** metal's state, so an overall badge
    is never fresher than the least-fresh metal it summarizes (`STALENESS_RANK` exported for reuse).
- **`tests/metal-freshness.test.js`** — 7 tests (budget mapping; parity with
  `evaluateFreshnessState`; ISO + future clamp; no-timestamp → unavailable; market-closed;
  multi-metal map; stalest aggregate).

## Fully wired, flagged OFF

Pure and harmless on its own; the comparison it augments stays gated by `METALS_PILOT_ENABLED`
(Phase 56). Peg (3.6725), troy-oz (31.1035), and the reference-estimate framing are untouched;
gold's numbers are unchanged.

## Owner action (blocker)

Same as Phases 56–57: publish `data/{silver,platinum,palladium}_price.json` (with `updatedAt`
timestamps, like `data/gold_price.json`) via the owner-gated fetch pipeline, then flip
`METALS_PILOT_ENABLED`.

## Verification

- `node --test tests/metal-freshness.test.js` → 7/7 pass
- `npm test` → 1399/1399 pass
- `npm run lint` → clean
- `npm run build` → success
- `npm run validate` → exit 0
