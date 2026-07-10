# Phase 62 — Gold-vs-crypto current-snapshot comparison (Theme C start)

**Theme C (crypto comparison).** A pure, tested current-value snapshot for gold-vs-crypto, flagged
OFF via `CRYPTO_PILOT_ENABLED`. **Code-complete, awaiting owner crypto feed credentials.**

## Why a Theme C pivot now (honest note)

Theme B's multi-metal **view-model layer is complete** (Phases 56–61: pricing, feed adapter,
freshness, selector state, table render, SEO). Its remaining natural work — an end-to-end
orchestrator + page wiring — is **blocked**: every one of those modules is on an **unmerged PR**
(#601–#606), so an orchestrator can't import or integration-test them off `main`. Rather than pad
Theme B with a contrived stub, this phase advances the next roadmap theme (C, crypto) with a
genuinely standalone increment that depends only on `crypto-assets.js` (on `main`).

It does **not** duplicate the existing crypto work: Phase 36 (`crypto-history.js`) normalizes
history _series_, and Phase 37 (`gold-crypto-correlation.js`) computes the statistical
_correlation_. Neither produces a current-value snapshot — that's the gap this fills.

## What shipped

- **`src/lib/crypto-snapshot.js`** — pure, side-effect-free.
  - `buildCryptoSnapshot(spotByAsset, { pilotEnabled?, lang? })` → one row per crypto asset (BTC,
    then ETH) with a truthful state: `ok` (has a feed → USD + AED), `pending-data` (pilot on, no
    feed → `null`), `disabled` (pilot off). **Never fabricates a crypto price.**
  - `normalizeCryptoSpotMap(raw)` — keeps only finite, positive spots.
  - `isCryptoSnapshotEnabled()` — reflects `CRYPTO_PILOT_ENABLED`.
- **`tests/crypto-snapshot.test.js`** — 8 tests.

## Honesty guardrails

- **Descriptive only.** Every model carries "for descriptive comparison only — correlation is not
  causation, and this is not a prediction or investment signal. Not financial advice" (EN + AR).
- **No fabricated prices.** An asset without a live feed is `pending-data` / `disabled`, never a
  number.
- **Peg used, not altered.** AED is a plain USD→AED conversion via the fixed `3.6725` peg (the peg
  applies to any USD value); a test re-asserts the peg and troy-oz constants are unchanged. Gold's
  pricing is untouched.

## Fully wired, flagged OFF

Gated by the existing `CRYPTO_PILOT_ENABLED` (default OFF). As the owner's crypto feed arrives,
assets flip `pending-data → ok` automatically, no code change.

## Owner action (blocker)

Publish a crypto spot feed (BTC/USD, optional ETH/USD) into the price pipeline and flip
`CRYPTO_PILOT_ENABLED`. Until then this ships dormant.

## Verification

- `node --test tests/crypto-snapshot.test.js` → 8/8 pass
- `npm test` → 1400/1400 pass
- `npm run lint` → clean
- `npm run build` → success
- `npm run validate` → exit 0
