# DataCore DC-1 — Historical Truth and Provider Control Plane

**Date:** 2026-08-25

**Branch:** `codex/datacore-dc1-historical-truth-2026-08-25`

**Base:** `origin/main` at `6390719489`

**Status:** implementation and local verification complete; draft PR
[#772](https://github.com/vctb12/GoldTickerLive/pull/772) open; owner rollout pending

## Outcome

Establish a gold-only, auditable market-observation control plane that records immutable provider
observations, reports workflow continuity honestly, derives deterministic hourly/daily rollups, and
ships a bounded static fallback. DC-1 does not activate non-gold production ingestion.

## Verified starting state

- PR #759 and draft PR #770 have green/neutral checks and are conflict-free against the refreshed
  base. Their freshness and gated chart-preview work remains separate.
- The configured public Supabase project returns `PGRST205` for `price_history`, `price_snapshots`,
  `provider_runs`, and `provider_health`.
- Sampled Gold Price Fetch runs complete successfully while logging
  `Cannot find module '@supabase/supabase-js'` and `snapshot_sync_reason=supabase_not_configured`.
- The last 100 workflow runs span 2026-08-20T12:17:04Z–2026-08-25T06:18:31Z: 100/100 concluded
  successfully, but 693 of 793 expected open-market five-minute slots had no run (87.39% missing).
  These are workflow-run slots, not durable observations; durable Supabase observation count is
  unavailable because the public Data API path is unusable and the physical table inventory was not
  accessible without administrative authorization.

## Implementation slices

1. Define a versioned canonical XAU/USD observation identity and provider-run telemetry shape.
2. Replace the workflow's unavailable optional client path with dependency-free PostgREST sync,
   explicit schema/access diagnostics, and honest GitHub outputs.
3. Persist a bounded, append-only monthly observation snapshot in the repository and generate
   deterministic hourly/daily rollups, a manifest, and provider-health summary.
4. Add an additive Supabase migration with immutable raw rows, service-role-only writes, public read
   only where required, provider quality columns, and rollback instructions. Do not apply it.
5. Make the API prefer selected Supabase observations, then DataCore static rollups, then the
   existing explicitly labelled reference baseline/single-point fallback.
6. Add focused unit/integration/governance tests and a technical audit report.

## Proof gates

- Canonical IDs and five-minute slots are stable across key order and retries.
- Replaying the same observation does not mutate or duplicate prior raw rows.
- Hourly/daily rollups are byte-reproducible from the same reviewed observations.
- Quality output states observation counts, coverage, duplicates, missing open-market slots,
  provider distribution, latency/freshness, divergence, fallback, and circuit transitions.
- Static fallback never labels historical or stale data as live.
- RLS/grants permit public reads only on intended read surfaces and writes only via service role.
- Focused tests, lint, validate, build, and the full test suite are run with baseline failures
  separated from DC-1 failures.

## Rollout and rollback boundary

This PR authors code and a migration only. It does not apply the migration, merge, deploy, expose a
secret, enable paid providers, change gold pricing constants/formulas, or activate production
multi-metal flags. Rollout requires owner review, migration backup/apply, a manual workflow run, and
post-run continuity verification. Rollback is documented separately and preserves raw exports before
disabling the DC-1 sync path.
