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

## T1.1 update — client-side wiring (still OFF by default)

Follow-on `T1.1` wires the dormant detection into the client live lane, **entirely behind the same
`CROSS_VALIDATION_ENABLED` flag (still OFF)** plus a `?debug=true` preview toggle. Nothing runs in
production until the owner flips the flag. What T1.1 adds:

| File                                                                   | Role                                                                                                                                                                                                                                       |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/lib/quote-providers/cross-validation.js`                          | `downgradeFreshnessForDivergence(key, evaluation)` — pure map from an `under-review` result to the existing `live-status.js` vocabulary (`live` → `delayed`, downgrade-only).                                                              |
| `src/lib/quote-providers/secondary-spot-check.js`                      | Lazy, throttled, fire-and-forget secondary **reference** spot check (freegoldapi.com, keyless/CORS). Same-day-fresh only → never a false positive from a stale daily close. `?debug=true` force + `setSimulateGoldFail`-safe orchestrator. |
| `src/components/spotBar.js`                                            | Reads the last cached evaluation synchronously and downgrades the live pill when the flag/debug is active. No new fetch on the poll path.                                                                                                  |
| `src/config/translations.js`                                           | `crossValidation.divergence.tooltip` — EN + AR, semantic parity.                                                                                                                                                                           |
| `tests/secondary-spot-check.test.js`, `tests/cross-validation.test.js` | Threshold boundary (just-under vs just-over 0.75%), divergence→label mapping, forced primary failure via `setSimulateGoldFail`, `?debug=true`, reference selection/staleness.                                                              |

**Honesty note:** freegoldapi is a _daily reference_, not a live feed. Enabling this therefore errs
conservative — during normal intraday drift the reference can differ by >0.75%, downgrading `live` →
`delayed` rather than risking an unlabelled "Live" a second source disagrees with. Tuning the
threshold (or swapping in a proven-live secondary) is an owner decision at enable-time. No peg
(3.6725) or troy (31.1035) math is touched; both come from `CONSTANTS` only.
