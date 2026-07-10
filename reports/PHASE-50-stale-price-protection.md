# Phase 50 — Stale-price protection layer

**Theme A (trust / data integrity).** A pure, tested guard that refuses to present a spot price as
**live** unless the freshness can be _proven_ from the provider's own data timestamp.
Feature-flagged **OFF** until the owner approves enabling it on the live price path.

## The gap this closes

`realtime-pricing-engine.js` derives a quote's age like this:

```js
function providerTimestampMs(quote) {
  const parsed = new Date(quote?.providerTimestamp || quote?.fetchedAt || 0).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}
const ageMs = Math.max(0, now - providerTimestampMs(state.quote));
```

The existing last-mile guard (`STALE_LIVE_PREVENTED`) catches "policy said live but `ageMs` > 5s".
But `ageMs` itself has two blind spots that can make a **stale** quote read as **live** with age ≈
0:

1. **No provider timestamp** — the age falls back to `quote.fetchedAt` (the _client_ fetch time), so
   a provider serving an hours-old cached quote still looks a few milliseconds old.
2. **Future timestamp** — `Math.max(0, …)` clamps a future-dated (clock-skewed or bad) timestamp to
   age 0, which sails straight through the 5-second guard.

In both cases there is no evidence the underlying spot is recent, yet it is shown as current.

## What shipped

- **`src/lib/stale-price-guard.js`** — pure, side-effect-free.
  - `assessQuoteFreshness({ providerTimestamp, observedAtMs, policy?, clockSkewToleranceMs? })` →
    `{ trusted, stale, dataAgeMs, maxState, reason }`. It derives the age from the **provider's own
    timestamp** (never the fetch time) and returns the freshest state the quote may honestly claim:
    - missing timestamp → `trusted:false`, `maxState:'estimated'`, `reason:'no-provider-timestamp'`
    - future beyond a 2s skew tolerance → `trusted:false`, `reason:'timestamp-in-future'`
    - otherwise the age maps to the same budgets as `freshness-policy.js` (live ≤ 5s / cached ≤ 60s
      / delayed ≤ 300s / else estimated).
  - `clampStateToGuard(state, guard)` — **downgrade-only**: returns the staler of the policy state
    and the guard's ceiling; it never upgrades, and `fallback`/`closed`/`unavailable` pass through.
  - `isStalePriceGuardEnabled()` — reads the owner-gated flag.
- **`src/config/feature-flags.js`** — `STALE_PRICE_GUARD_ENABLED: false`.
- **`tests/stale-price-guard.test.js`** — 10 tests, including one that reproduces the engine gap:
  `evaluateFreshnessState({ ageMs: 0 })` returns `live`, but the guard clamps a timestamp-less quote
  to `estimated`.

## Truth-first & downgrade-only

The guard can only ever make a quote look **older**, never fresher. It never overrides age-based
truth (it _is_ age-based truth, applied to the trustworthy age), never changes the displayed price,
and touches no pricing constants. A genuinely fresh, properly-timestamped quote is unaffected.

## Wiring (owner-gated, not enabled in this PR)

The module is not yet wired into the engine — kept as a small, reviewable, flagged unit. When the
owner approves, enablement is a two-line clamp in `realtime-pricing-engine.js` (`snapshot()` and
`applyQuote()`), guarded by the flag so OFF is byte-for-byte the current behavior:

```js
import {
  assessQuoteFreshness,
  clampStateToGuard,
  isStalePriceGuardEnabled,
} from './stale-price-guard.js';
// after computing `fresh`:
if (isStalePriceGuardEnabled()) {
  const guard = assessQuoteFreshness({
    providerTimestamp: state.quote?.providerTimestamp, // the provider's own timestamp, NOT fetchedAt
    observedAtMs: now,
  });
  fresh = { ...fresh, state: clampStateToGuard(fresh.state, guard) };
}
```

## Verification

- `node --test tests/stale-price-guard.test.js` → 10/10 pass
- `npm test` → 1402/1402 pass
- `npm run lint` → clean
- `npm run build` → success
- `npm run validate` → exit 0

## Owner action

Decide whether to enable `STALE_PRICE_GUARD_ENABLED` and wire the clamp into the engine (snippet
above). No credentials or content review required.
