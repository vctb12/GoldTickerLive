# DataCore DC-1 — verified shared history and provider control plane

- **Date:** 2026-08-25
- **Branch:** `codex/datacore-dc1-historical-truth-2026-08-25`
- **Original branch point:** `origin/main` at `6516084307`
- **Draft PR:** [#772](https://github.com/vctb12/GoldTickerLive/pull/772)
- **Status:** repaired source locally verified; follows PR #770 and remains blocked from
  merge/rollout

## Objective

Deliver the smallest reviewable gold-only control-plane slice: immutable metal-neutral raw
observations, provider attempts/health, deterministic rollups and static fallback, explicit data
quality gates, a safe optional API read path, and owner-controlled migration/rollback evidence.

## Non-goals and protected boundaries

- Do not merge, deploy, apply a production migration, or change secrets/billing/dependencies.
- Do not edit `post_gold.yml`, `sw.js`, provider priority, the AED peg, troy-ounce constant, karat
  factors, price/FX formulas, or `data/gold_price.json`.
- Do not activate or persist XAG/XPT/XPD. The schema may accept a metal symbol later, but this phase
  writes XAU only.
- Do not wire DC-1 history into the tracker/homepage; those consumers remain separate until DC-4.

## Implementation slices

1. **Contract:** introduce schema v2 metal/quote/value fields, provider/fetch/ingest times,
   five-minute slot and resolution, market/freshness/quality state, stable content identity, and
   additive correction linkage. Preserve XAU aliases only for existing consumers.
2. **Validation:** reject invalid metal/currency/price/timestamps and impossible future data; flag
   late and out-of-order arrivals; accept multiple providers in one slot; classify corrections.
3. **Storage:** harden migration 006 and `schema.sql` for clean and legacy states, append-only raw
   rows, service-role writes, column-level public reads, indexes, and provider telemetry.
4. **Derivation:** build `data/history/manifest.json`, `XAU/intraday-7d.json`,
   `XAU/hourly-90d.json`, `XAU/daily.json`, `XAU/quality.json`, and bounded monthly raw archives.
   Rollups include OHLC, average, median, providers, contributors/hash, completeness, and quality.
5. **Workflow:** add `observe-only`, `warn`, `block-history-write`, and `block-public-export`
   enforcement modes. Failures must be visible without changing the current gold quote output.
6. **API:** serve bounded history ranges with explicit provenance/no-data semantics, cache headers,
   and IP rate limiting. Do not expose hashes, workflow IDs, or provider error detail publicly.
7. **Proof:** add unit/integration/static SQL/pgTAP/governance tests, regenerate only scoped static
   outputs, run verification, and document baseline/environment failures separately.

## Data-quality thresholds and gate semantics

- Invalid price, metal, quote currency, unparseable provider/fetch/ingest timestamp, or provider
  timestamp more than 60 seconds ahead of fetch is a rejection.
- Arrival over 30 minutes after its five-minute slot is `late_arrival`; provider timestamps older
  than the latest prior observation for that provider are `out_of_order` warnings.
- Missing open-market slots and maximum gaps are measured from actual points. Market-closed slots
  are excluded. No observation is interpolated or backfilled.
- The bootstrap dataset may fail continuity thresholds honestly. `observe-only` records the result;
  `warn` also annotates workflow status; `block-history-write` suppresses raw/static history writes
  on a failed input gate; `block-public-export` evaluates a read-only dataset preview and, when it
  fails, returns before remote or filesystem mutation. No raw/history write or public export occurs
  on that failed run.

## Proof gates

- Exact replay preserves observation identity; corrections create linked new rows; update/delete are
  rejected. Current-run duplicate evidence remains truthful rather than being erased.
- Invalid/future observations are rejected; late/out-of-order flags are deterministic;
  multi-provider same-slot observations are preserved.
- Hourly/daily aggregation is stable and includes full contributor/provider provenance.
- Observation archives and rollup data are deterministic for the same effective observation set and
  carry hashes/bytes. Quality and manifest evidence may change on replay to record current-run
  duplicates separately from remote rehydration overlaps.
- API tests cover each range, static/Supabase/no-data fallback, cache, rate limiting, invalid input,
  and absence of operational-only columns.
- Migration tests cover clean and legacy SQL shape, backfill, RLS/grants, and pgTAP instructions;
  real apply is owner-gated if local tooling is unavailable.

## Verification sequence

1. Focused DataCore, price-snapshot, API, migration, and workflow tests.
2. ESLint, formatting/JSON/YAML/syntax/diff checks.
3. Full `npm.cmd test`, `npm.cmd run validate`, and `npm.cmd run build`.
4. Re-run the UAE live audit outside the restricted network when authorized; classify unrelated
   failures against the recorded baseline.
5. Preserve campaign order: after PR #770 completes, refresh PR #772 against the resulting `main`,
   update its evidence, and require current-head canonical CI. Do not merge while CI is disabled or
   any database proof gate is outstanding.

Current local proof after the source repairs is: focused DC-1/migration/API tests 61/61; full suite
1,899 pass, 4 known environment/baseline failures, and 1 skip out of 1,904; lint pass; build pass at
310 modules with existing analytics/Vite warnings only. Validation passes the core, governance, DOM,
shell, accessibility, and metadata checks before the pre-existing stale `reports/seo/inventory.json`
failure stops the chain. The repository's canonical CI workflow is manually disabled, and no staging
migration or pgTAP execution has been performed.

## Rollout and rollback

Owner rollout order is backup → local/staging migration apply → executable pgTAP/RLS proof → schema
reload → `observe-only` manual run → continuity window → staged enforcement decision. Rollback
disables the DataCore enforcement/sync path first, preserves raw exports, freezes public artifacts,
then uses the documented SQL only after an owner approves whether newly written rows are retained.
The current gold JSON pipeline remains independent throughout. Rollout cannot begin while canonical
CI is disabled, and merge consideration must wait for the ordered refresh after PR #770.
