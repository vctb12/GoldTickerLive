# Phase 47 — Freshness / fallback hardening (flap fix)

Fixes audit item 4: the price-freshness badge flapped between **Live / Cached / Fallback /
SecondaryProvider** on repeated loads. The cause was a single transient failure instantly demoting
the provider; the fix is a hysteresis (Schmitt-trigger) health signal. No owner-gated files touched.

## Root cause

`src/lib/provider-health.js` computed `healthy` from `failureDetectionBreached`, which tripped on
**a single failure within the last 15 s** (`consecutiveFailures > 0 && lastFailureAgeMs <= 15000`).
So one transient gold-api.com timeout or `429` marked the provider unhealthy,
`evaluateFreshnessState` returned `fallback`, and the labels are `SecondaryProvider` for
cache/fallback provider ids (`src/lib/provider-labels.js`). The very next successful poll reset
`consecutiveFailures = 0` and restored `healthy`, so the badge oscillated Live ↔ Fallback ↔
SecondaryProvider across loads.

Confirmed the health signal was the _only_ flap source: `applyQuote` runs only on a **successful**
fetch, so a failed poll keeps the last good quote (its `providerPathSuccessful` stays `true`) — only
`providerHealthy` was flipping.

## Fix — hysteresis health (Schmitt trigger)

`ProviderHealthMonitor` now holds a **sticky** health state:

- **Trip to UNHEALTHY** only after `TRIP_AFTER_FAILURES = 2` _consecutive_ failures — a single blip
  is absorbed.
- **Recover to HEALTHY** only after `RECOVER_AFTER_SUCCESSES = 2` _consecutive_ successes — one good
  poll doesn't instantly flip it back.
- Between thresholds the state is held, so alternating fail/success no longer oscillates the badge.

**This is health smoothing only — it never overrides age-based truth.** Staleness is still governed
by `freshness-policy.js` (live ≤ 5 s / cached ≤ 60 s / delayed ≤ 300 s budgets), so a
smoothed-healthy provider with genuinely old data still downgrades correctly. The change only stops
a lone transient failure from screaming "fallback" when a recent good quote is still within budget —
which is _more_ truthful, not less.

## Logging / observability

`getSnapshot()` now also reports, over the rolling window: `failureCount`, `timeoutCount` (errors of
type `AbortError`/`TimeoutError`), `rateLimitedCount` (`http_429`/`RateLimitError`), and
`consecutiveSuccesses`. These already flow into the pricing engine's emitted telemetry object, so
the owner can see **how often the primary is actually timing out or being rate-limited** — the
diagnostic the audit asked for.

## Tests — `tests/provider-health.test.js` (7)

Starts healthy; a single failure stays healthy (the old bug); two consecutive failures trip
unhealthy; recovery needs two sustained successes (one doesn't); alternating fail/success never
flaps; interleaved successes don't recover without a real run; diagnostics count timeouts and
rate-limits.

## Constraints honoured

No owner-gated files touched (`gold-price-fetch.yml`, `post_gold.yml`, `sw.js`, Supabase); freshness
**age budgets unchanged** (truth preserved); AED peg / troy-oz / reference-estimate framing
untouched; change is confined to the client health signal.

## Gate

`npm run build` + `npm run validate` + `npm test` (**1399 pass, +7**) + `npm run lint` — all green.
