# DataCore DC-1 baseline audit — verified shared history and provider control plane

**Audit time:** 2026-08-25 UTC
**Branch:** `codex/datacore-dc1-historical-truth-2026-08-25`
**Refreshed base:** `origin/main` at `6516084307`
**Draft PR:** [#772](https://github.com/vctb12/GoldTickerLive/pull/772)
**Production activation:** none

Evidence is limited to repository code, GitHub metadata/logs, public production files, and the
repository-published Supabase anonymous REST surface. No service-role credential was read or
printed, no database write was attempted, and no migration was applied.

## 1. Executive finding

The production gold workflow publishes the current `data/gold_price.json`, but there is no verified
shared observation history. A green workflow conclusion currently does not prove a durable history
write: all three sampled runs skipped the optional Supabase path after the Node client module failed
to load. The configured five-minute schedule is also delivered sparsely, so history must record
actual provider observations and gaps without interpolation.

## 2. Repository and PR state

- Current `main` advanced only through committed price/automation telemetry snapshots after the
  first DC-1 draft; the DC-1 branch rebased without code conflicts.
- PR #772 remains the single draft DC-1 PR. PR #759 retains freshness scope; draft PR #770 retains
  gated multi-metal chart scope. DC-1 does not absorb either.
- PR #770 keeps non-gold production disabled and explicitly forbids fabricated or persisted
  XAG/XPT/XPD history pending an owner-approved source contract.
- The separate 360 px EN/AR review is recorded in `docs/audits/2026-08-25_pr770-360-review.md`; its
  UI findings are not DC-1 changes.

## 3. Workflow architecture

`.github/workflows/gold-price-fetch.yml` fetches the existing gold provider consensus, writes
`data/gold_price.json`, then invokes `scripts/node/sync-price-snapshot.js`. The sync is non-strict,
and the workflow commits the price file plus any DataCore static outputs. The X-posting workflow is
separate and outside DC-1.

## 4. Workflow-run evidence

| Measure                |                            Verified value | Denominator / interpretation                     |
| ---------------------- | ----------------------------------------: | ------------------------------------------------ |
| Conclusions            |                    100 success / 100 runs | Recent Gold Price Fetch runs                     |
| Window                 | 2026-08-20T14:04:38Z–2026-08-25T08:02:26Z | GitHub run creation timestamps                   |
| Configured cadence     |                                 5 minutes | Workflow schedule target                         |
| Expected open slots    |                                       793 | Five-minute slots during configured market hours |
| Observed run slots     |                                       100 | Workflow starts; not durable observations        |
| Missing open slots     |                              693 / 87.39% | Expected slots without an observed run start     |
| Observed median gap    |                             36.55 minutes | 99 adjacent run gaps                             |
| Observed min / max gap |                  15.53 / 2,898.77 minutes | Max spans the market-closed/weekend interval     |
| Sampled durable sync   |                                     0 / 3 | Runs 32824567656, 32820645354, 32816400139       |

Each sample logged `Cannot find module '@supabase/supabase-js'` and
`snapshot_sync_reason=supabase_not_configured`. The schedule is best-effort; run success and
observation continuity must remain separate signals.

## 5. Supabase inventory

The public Data API returned `404 PGRST205` for `price_snapshots`, `provider_runs`,
`provider_health`, `price_history`, and the control probe `shop_listings`. This proves that these
relations are not available through the configured public REST schema. Anonymous evidence cannot
distinguish a physically absent table from a table intentionally unexposed from PostgREST.
Administrative inventory, row counts, first/last observations, and applied-migration state remain
owner-gated and must be reported as unavailable, not zero.

The local environment has no `supabase`, `docker`, or `psql` executable, so a real clean/legacy SQL
apply is not possible in this session. DC-1 must provide exact migration and pgTAP commands for an
owner-controlled environment.

## 6. Data-quality baseline

The first draft contains one verified seed observation only. It is sufficient for deterministic
format and replay tests, but not for trend, continuity, provider stability, or production coverage
claims. The strengthened gate must report expected/observed open-market slots, missing-slot rate,
maximum gap, duplicates, invalid/future/late/out-of-order observations, provider distribution,
fallback/stale states, and explicit warnings/failures. Missing prices must never be filled.

## 7. API and read path

The optional Express API currently prefers Supabase rows, then a DC-1 rollup, then the legacy
monthly baseline, then the current JSON snapshot. Production GitHub Pages returns 404 for
`/api/v1/prices/history`; consumers therefore require stable static JSON first. History responses
need bounded ranges, explicit no-data semantics, cache headers, rate limiting, and approved public
columns only.

## 8. Frontend history-source map

| Consumer                 | Current source                                                                | DC-1 decision                                  |
| ------------------------ | ----------------------------------------------------------------------------- | ---------------------------------------------- |
| Tracker chart/archive    | `src/lib/historical-data.js`: monthly baseline + browser/provider daily cache | Retain; do not wire DC-1 into UI in this phase |
| Homepage UAE chart       | `data/historical/xau-usd-daily.json` from its separate daily workflow         | Retain; do not replace or relabel              |
| Optional Express API     | Supabase / DC-1 file / legacy baseline / current JSON                         | Harden fallback semantics only                 |
| Browser quote surfaces   | `data/gold_price.json` plus existing live/fallback chain                      | Unchanged                                      |
| PR #770 non-gold preview | current quote only; no non-gold history                                       | Unchanged and production-gated off             |

## 9. Duplication and writer map

| Writer                                                                | Target                                          | Status / risk                                                       |
| --------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------- |
| `gold-price-fetch.yml`                                                | `data/gold_price.json`                          | Authoritative current committed reference quote; unchanged contract |
| `sync-price-snapshot.js`                                              | DataCore raw/provider tables and static exports | DC-1 canonical writer                                               |
| `record-price-history.yml` + `scripts/python/record_price_history.py` | legacy `price_history`                          | Separate legacy writer; not a DC-1 source of truth                  |
| UAE daily history workflow                                            | `data/historical/xau-usd-daily.json`            | Separate verified daily dataset                                     |
| Browser local storage                                                 | recent client history                           | Per-browser cache, never shared truth                               |

DC-1 must document coexistence and avoid dual-writing the legacy table.

## 10. Security and RLS

Raw observations and provider attempts must be append-only and service-role-write-only. Public reads
must be limited to approved observation and provider-health columns. Workflow identifiers, raw
payload hashes, provider error details, and attempt telemetry are not public. Update/delete
operations must fail even for accidental service-role application code, with controlled rollback
requiring trigger removal by an owner.

## 11. Gap ranking

| Severity | File or page                   | Issue                                                                                                                         | Impact                                                                 | Exact fix                                                                                                  | Repeat pattern                            |
| -------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| block    | Workflow sync path             | Green runs skip durable writes because an unavailable optional module is loaded                                               | Historical truth and provider telemetry are absent                     | Use dependency-free PostgREST, expose explicit sync/gate outputs, and stage enforcement                    | Green workflow masking optional-path skip |
| high     | Canonical observation contract | First draft uses XAU-named canonical columns and lacks correction, ingestion, resolution, market-state, and quality lineage   | XAG cannot be added safely later; late/corrected records are ambiguous | Introduce metal-neutral v2 columns and additive correction linkage while keeping XAU compatibility aliases | Multi-metal owner gate                    |
| high     | Static rollups                 | Missing median/average, contributor IDs/hash, provider count/list, completeness/mixed-provider flags, and formal quality gate | Public aggregates cannot be independently audited                      | Produce deterministic intraday/hourly/daily outputs and `quality.json`; never gap-fill                     | Existing provenance-honesty pattern       |
| high     | Supabase RLS/grants            | Broad table reads expose workflow/hash fields                                                                                 | Operational metadata leakage and over-broad public surface             | Use column-level grants plus RLS; service-role-only writes                                                 | Protected Supabase surface                |
| medium   | History API                    | Limited ranges and no explicit history cache/rate contract                                                                    | Operational and consumer ambiguity                                     | Add bounded ranges, cache headers, rate limiter, and no-data tests                                         | Existing API hardening pattern            |

## 12. Architecture decision

Keep one metal-neutral canonical observation table (`price_snapshots`) for compatibility, with
provider attempts and mutable derived health in separate tables. Raw rows are immutable. A replay
uses a stable content identity; a changed correction is a new row linked to its predecessor. Public
static exports are deterministic derived views, not a second source of truth. XAU compatibility
columns remain populated only for XAU; future XAG values must use neutral columns and never enter
XAU-named fields. The decision is recorded in ADR 0008.

## 13. Owner gates

- Apply migration 006, reload the Data API schema, run pgTAP/RLS tests, and verify grants.
- Set the initial workflow enforcement mode and approve later progression after continuity evidence.
- Decide whether/when an optional Express backend is deployed; GitHub Pages uses static JSON.
- Approve any future XAG/XPT/XPD provider, history, retention, redistribution, or production flag.
- Merge and deploy remain owner actions.

## 14. Baseline test results

| Check                  | Baseline result                                                                                                        |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Focused DC-1/API tests | pass — 31/31                                                                                                           |
| `npm.cmd run lint`     | pass                                                                                                                   |
| `npm.cmd run build`    | pass                                                                                                                   |
| Full `npm.cmd test`    | 1,865 pass, 4 fail, 1 skip; four known Windows/network baseline failures                                               |
| `npm.cmd run validate` | core/governance/DOM/a11y/SEO/language/SW/content gates pass, then stale `reports/seo/inventory.json` stops the command |
| Local SQL apply        | blocked: Supabase CLI, Docker, and psql unavailable                                                                    |

## 15. Recommended implementation

Implement a v2 metal-neutral observation contract with correction lineage and quality flags;
deterministic, provenance-complete 7-day intraday, 90-day hourly, and daily exports; formal quality
gates with staged workflow enforcement; service-role-only append paths and approved public-read
columns; a bounded/cacheable/rate-limited API fallback; migration/pgTAP/static governance tests; and
owner-ready rollout/rollback commands. Keep production gold only and do not alter provider priority,
pricing formulas/constants, `data/gold_price.json`, `post_gold.yml`, or `sw.js`.
