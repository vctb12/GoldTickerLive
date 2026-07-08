# Phase 8 — Secondary-provider cross-validation (Track B · 🟡 flagged, owner-gated to enable)

Adds **divergence detection** between the primary and secondary gold providers, behind a build
feature flag that is **OFF by default**. Enabling it live — and surfacing the "under review" state
to users — is an **owner decision** (it changes what users are told about price trust). No peg/troy
math is touched; the displayed price is never altered by this module.

## What ships (dormant)

| File                                          | Role                                                                                                  |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `src/config/feature-flags.js`                 | New flags module (separate from the owner-gated `constants.js`). `CROSS_VALIDATION_ENABLED: false`.   |
| `src/lib/quote-providers/cross-validation.js` | Pure comparison logic: `computeDivergencePct`, `evaluateCrossValidation`, `isCrossValidationEnabled`. |
| `tests/cross-validation.test.js`              | 8 unit tests (disabled default, agree/under-review, insufficient-data, threshold math).               |

## Behaviour

`evaluateCrossValidation({ primaryUsd, secondaryUsd })` returns one of:

- `disabled` — the flag is OFF (production default). **Nothing changes.**
- `insufficient-data` — a secondary price isn't available or is invalid → **no false positives**.
- `agree` — divergence ≤ threshold (default **0.75%**, symmetric vs the mean).
- `under-review` — divergence > threshold → a consumer may show an "under review" trust chip.

Divergence is symmetric (`|a−b| / mean × 100`), so it doesn't matter which provider is "primary".

## Why this is safe now

- **Flag defaults OFF** — the module short-circuits to `disabled`, so no runtime path, UI, or price
  changes until the owner flips one boolean and rebuilds.
- **Non-authoritative** — it produces a _status_, never a price. The peg (3.6725) and troy (31.1035)
  constants are untouched (and their file was not edited).
- **Builds on existing plumbing** — `secondary-provider.js` and the `secondaryHealth` snapshot in
  `realtime-pricing-engine.js` already exist; this only adds the comparison.

## Owner gate — to enable live (do NOT do without owner approval)

1. Set `CROSS_VALIDATION_ENABLED: true` in `src/config/feature-flags.js`.
2. Wire it where both provider quotes are in scope — e.g. in `realtime-pricing-engine.js`'s flag
   computation, call `evaluateCrossValidation({ primaryUsd, secondaryUsd })` and, on `under-review`,
   push a warning flag (e.g. `provider_divergence_under_review`) alongside the existing SLO flags.
3. Optionally surface an "under review" freshness chip on price surfaces (reuse the freshness pill).
4. Confirming the **secondary provider is populated in production** requires the owner-gated
   `gold-price-fetch.yml` (writes `data/gold_price.json` provider fields) — **not changed here**.

Until then, the detection is tested and ready but inert.
