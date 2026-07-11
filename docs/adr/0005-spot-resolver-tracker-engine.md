# ADR-0005 — Canonical spot resolver ⟂ tracker live engine

**Status:** Accepted (codifies shipped architecture) · **Date:** 2026-07-11

## Context

Every visible price must be traceable to one calculation path and honest freshness (see `AGENTS.md`
non-negotiables). Most surfaces need a simple, consistent read of the current spot-derived reference
price. The flagship Tracker additionally needs a stronger, multi-tier live-polling engine. These are
different needs and must not be conflated into duplicate pricing paths.

## Decision

Two clearly separated layers, sharing pure math but not merged:

- **Canonical spot resolver** — `src/lib/spot-resolver.js` (`getCanonicalSpot`, `deriveFromSpot`,
  `karatPerGram`) reads `/data/gold_price.json` via `src/lib/api.js` (cache-bust, retry,
  localStorage fallback, throw-on-empty). It is the single read point for non-Tracker surfaces
  (home, calculator, compare, portfolio, market, dubai, shops, …). Pure conversions live in
  `src/lib/price-calculator.js`; the metals layer in `src/lib/metal-pricing.js`.
- **Tracker live engine** — `src/lib/realtime-pricing-engine.js` (`createRealtimePricingEngine`)
  with `realtime-config.js`, `realtime-poll-interval.js`, and `provider-health.js`
  (live/static/fallback poll tiers, backoff), wired in `src/pages/tracker-pro.js`. It is
  intentionally stronger and is **not** weakened, duplicated, or replaced to make other surfaces
  look consistent.

Shared invariants come from `src/config/constants.js` (**AED peg 3.6725**, troy **31.1034768 g**)
and karat factors from `src/config/karats.js` — never inlined elsewhere.

## Alternatives considered

- **One engine for everything** — rejected: either over-serves simple pages (cost/complexity) or
  weakens the Tracker.
- **Per-page ad-hoc pricing** — rejected: creates untraceable numbers and freshness drift; forbidden
  by the charter.
- **Move the peg/karat constants inline** — rejected: they are single-source, owner-gated
  invariants.

## Consequences

- Non-Tracker surfaces converge on `getCanonicalSpot`; a second independent pricing path is a review
  block.
- The Tracker keeps its own engine; changes there are isolated from the canonical resolver.
- Constants are owner-gated (`AGENTS.md`): the peg/troy/karat/FX formulas need owner approval.

## Invariants

- AED peg **3.6725**; troy **31.1034768 g**; karat factors from `karats.js`. Reference price ≠
  retail quote. Local currency = USD/gram × current FX (not USD→AED→local). Every number is
  traceable to source + timestamp + freshness state.

## Relevant files

`src/lib/spot-resolver.js`, `price-calculator.js`, `metal-pricing.js`, `api.js`,
`src/lib/realtime-pricing-engine.js` (+ `realtime-config.js`, `realtime-poll-interval.js`,
`provider-health.js`), `src/pages/tracker-pro.js`, `src/config/constants.js`,
`src/config/karats.js`, `data/gold_price.json`.

## Verification mechanism

Unit tests under `tests/` (pricing/karat/FX; a LOCKED assertion pins a known 24K value), plus
`tests/e2e/calculator-accuracy.spec.js` and `freshness-labels.spec.js`. `docs/price-flow-map.md`
documents the full flow.

## Supersession policy

Provider strategy, caching, or a resolver/engine change must be an owner-approved decision and a new
ADR — not an inline edit. Constants and the two modules are authoritative.
