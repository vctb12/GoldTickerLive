# DataCore DC-1 — verified shared history and provider control plane

**Date:** 2026-08-25
**Branch:** `codex/datacore-dc1-historical-truth-2026-08-25`
**Base:** `origin/main` at `6516084307`
**PR:** [#772](https://github.com/vctb12/GoldTickerLive/pull/772) (draft)
**Production state:** not merged, not deployed, migrations not applied

## 1. Executive result

DC-1 now provides a gold-only, metal-neutral v2 observation and provider-control plane: immutable
raw rows, additive correction lineage, provider-attempt telemetry, deterministic provenance-rich
rollups, a formal quality gate, staged workflow enforcement, bounded static fallback, and a safe
optional API. The current quote provider priority, gold value, pricing formulas/constants,
`data/gold_price.json`, X posting, service worker, billing, dependencies, and non-gold production
flags are unchanged.

The implementation is code-complete and locally verified. Production readiness still requires the
owner-controlled Supabase apply/RLS proof and an observation continuity window.

## 2. Verified live state

- Last 100 Gold Price Fetch runs: 100 successful conclusions in
  2026-08-20T14:04:38Z–2026-08-25T08:02:26Z.
- Schedule target: five minutes. Observed median gap: 36.55 minutes; 693 of 793 expected open-market
  slots had no observed run start (87.39%).
- Sampled runs 32824567656, 32820645354, and 32816400139 all logged an unavailable
  `@supabase/supabase-js` module and `supabase_not_configured`; durable writes were 0/3.
- Production returns 200 for `data/gold_price.json` and the separate legacy UAE daily history, but
  404 for the DC-1 manifest and optional history API because this PR is not deployed.
- Public Supabase REST returned `PGRST205` for expected DataCore relations. Physical table presence
  and row counts remain unverified without administrative access.

## 3. Existing architecture retained

The existing Python consensus writer remains authoritative for the published current gold reference
quote. DC-1 runs after that writer and never changes provider selection, price/karat/FX calculation,
or the committed quote contract. The homepage daily-history workflow, tracker baseline/browser
history, legacy `record-price-history.yml`, and draft PR #770 non-gold preview remain separate.
`post_gold.yml` is untouched.

## 4. Data contract

Schema v2 uses:

- `metal_symbol`, `quote_currency`, `price_usd_per_oz`, and optional `price_aed_per_gram`;
- provider, fetched, and ingested UTC timestamps;
- five-minute slot start plus explicit resolution;
- market state, freshness state, quality state, and machine-readable quality flags;
- selection method, provider deviation, and immutable source identity;
- optional `correction_of_observation_id` and `is_correction`.

Exact replay produces the same observation ID. A changed value at the same provider timestamp
creates a new linked correction; no prior row is overwritten. XAU compatibility aliases are
populated only for XAU. A database check and tests prevent future XAG/XPT/XPD values from entering
XAU-named fields.

## 5. Database and migration

Migration 006 creates the initial three relations. Migration 007 additively backfills legacy rows,
adds the neutral/correction/quality fields, creates metal/time/correction indexes, changes provider
health identity to metal + provider, and narrows grants. `supabase/schema.sql` contains the same
final state.

The local machine has no Supabase CLI, Docker, or psql, so no real SQL apply was claimed. A
committed pgTAP suite and static migration tests cover clean-chain shape, legacy backfill,
RLS/grants, private fields, and append-only triggers. Owner commands are documented in
`docs/datacore-dc1-migration-rollback.md`.

## 6. Workflow and idempotency

`gold-price-fetch.yml` invokes the dependency-free PostgREST sync and exposes separate outputs for
schema state, sync reason, insert/duplicate counts, provider telemetry, gate status, missing slots,
maximum gap, and block decisions. Supported owner-controlled modes are:

1. `observe-only` — report gate state without blocking;
2. `warn` — retain writes/exports and surface warnings;
3. `block-history-write` — reject failed input before raw/history mutation;
4. `block-public-export` — retain accepted raw history but freeze public exports on a failed dataset
   gate.

The default is `observe-only`. Current quote publication is not coupled to stricter DataCore modes.

## 7. Provider control plane

Every provider attempt is represented in `provider_runs` with status, selection, latency, HTTP
status, error code, provider time, normalized value, freshness, divergence, and circuit state.
`provider_health` derives 24-hour attempt/success/stale/fallback/divergence counts, success rate,
average/p95 latency, p95 freshness, current status, and circuit transitions. No provider was added,
removed, reprioritized, or enabled.

## 8. History and rollups

The canonical archive retains accepted immutable observations and correction lineage. Public
derivations are deterministic:

- `data/history/XAU/intraday-7d.json` — selected five-minute observations;
- `data/history/XAU/hourly-90d.json` — hourly OHLC/average/median;
- `data/history/XAU/daily.json` — daily OHLC/average/median with five-year retention;
- `data/history/XAU/quality.json` — coverage and gate evidence;
- `data/history/manifest.json` — paths, bytes, and SHA-256 hashes.

Rollups preserve providers/count/distribution, contributor observation IDs/hash, freshness/quality
distribution, and incomplete/mixed-provider flags. Gaps are measured and never filled.

## 9. Static fallback and API

The optional `GET /api/v1/prices/history` supports `1d`, `7d`, `30d`, `90d`, `1y`, and `all`;
rejects invalid ranges and non-gold activation; prefers selected Supabase observations, then the
matching DC-1 static grain, then the labelled legacy baseline/current snapshot; and returns an
explicit empty response when no source exists. History has a dedicated IP limit and
`Cache-Control: public, max-age=60, stale-while-revalidate=300`. Manifest cache is five minutes.
Public snapshots omit raw hashes and workflow IDs.

GitHub Pages can consume the static JSON directly. DC-1 does not deploy an Express backend or wire
the frontend to this API.

## 10. Data-quality evidence

The committed bootstrap contains one verified XAU/USD observation from `gold_api_com`. The static
gate is `warn`, not `pass`, because one point is insufficient continuity evidence. Current bootstrap
metrics are one expected/observed open-market slot, zero missing slots, zero duplicates, zero
invalid/future/late/out-of-order/correction/fallback/stale observations, zero maximum gap, and one
provider. These values prove contract/reproducibility only; they do not establish production
continuity.

The live workflow baseline separately shows the 87.39% missing-run-slot rate. Workflow starts and
durable observations are deliberately not conflated.

## 11. Security and RLS

- Raw observation and provider-run writes are service-role-only.
- Update/delete triggers reject mutation of raw rows.
- Anonymous/authenticated observation reads are restricted by RLS to selected accepted/warning rows
  and by column-level grants to approved normalized fields.
- Raw payload hashes, workflow IDs, and provider attempts/errors are not public Data API columns.
- Public static observation archives also omit operational-only hash/workflow/latency fields.
- Provider health exposes only reviewed aggregate/status columns.
- No credential, secret, key, or token was added or printed by the implementation.

The grants follow current Supabase guidance that new public-schema tables require explicit exposure
and that RLS plus least-privilege grants must be tested.

## 12. Verification

| Check                                   | Result                                                                                                        |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Focused DC-1/migration/API suite        | pass — 45/45                                                                                                  |
| `npm.cmd run lint`                      | pass — no errors or warnings                                                                                  |
| `npm.cmd run build`                     | pass — 310 modules                                                                                            |
| Full test suite                         | 1,879 pass, 4 fail, 1 skip (1,884 total); failures match baseline                                             |
| `npm.cmd run validate`                  | governed checks pass through analytics externalization, then pre-existing stale SEO inventory stops the chain |
| Static artifact replay                  | pass — identical hashes on exact replay                                                                       |
| JSON/JS/YAML/whitespace checks          | pass                                                                                                          |
| Local migration apply / pgTAP execution | environment-blocked — Supabase CLI, Docker, and psql absent                                                   |
| Production migration/workflow proof     | not run — owner-gated                                                                                         |

## 13. Files changed

- Workflow: `.github/workflows/gold-price-fetch.yml`.
- Contract/sync/derivation: `server/lib/datacore-observations.js`,
  `scripts/node/datacore-sync-v2.js`, `scripts/node/datacore-history-v2.js`, plus compatibility
  entrypoints.
- API: `server/routes/api-v1.js`.
- Database: schema, migrations 006/007, and `supabase/tests/datacore_rls.test.sql`.
- Static evidence: `data/history/**` and `data/provider-health/summary.json`.
- Tests: DataCore, migration, snapshot, and API route suites.
- Documentation: baseline audit, plan, ADR 0008, rollback, tracker, PR #770 360 review, and this
  handoff.

## 14. Baseline failures

The four unchanged failures are:

1. Windows path-traversal test expects 404 but the existing static 404 path returns 500.
2. Python provider constant test cannot spawn `python3` on this Windows environment.
3. Python history-recorder precision test cannot spawn `python3`.
4. UAE live-history audit cannot use outbound network inside the restricted sandbox.

Validation's stale `reports/seo/inventory.json` is also pre-existing and outside DC-1. None of these
failures touch the DC-1 implementation paths.

## 15. Owner decisions

1. Approve backup, local/staging migration apply, pgTAP/RLS proof, and then production migration
   006/007.
2. Approve the initial `observe-only` workflow variable and any later enforcement progression.
3. Decide whether an optional Express history API will ever be deployed; static JSON is sufficient
   for GitHub Pages.
4. Keep non-gold production disabled until provider licensing, retention, source, and UI review
   gates are separately approved.
5. Review and merge PR #772; no agent merge/deploy is authorized.

## 16. Risks and rollback

Primary risks are legacy backfill/lock duration, incorrect public grants, schema-cache lag, sparse
GitHub schedule delivery, and a gate mode advanced before enough observations exist. Rollback keeps
or returns the workflow to `observe-only`, freezes public artifacts, preserves raw exports/rows,
reverts application code through a PR, and changes database behavior only through an owner-reviewed
migration. Table drops and data deletion are explicitly not incident-response defaults.

## 17. Git and PR

One isolated branch and one draft PR are used. The PR title is
`feat(data): harden shared gold history and provider control plane`. The PR body records What, Why,
How, Data contract, Migration, Workflow behavior, Proof, Production evidence, Security and RLS,
Risks, Rollback, Owner decisions, and Next phase. The branch was rebased onto current `main`; push
uses force-with-lease. No merge or deployment was performed.

## 18. DC-2 handoff

DC-2 may harden multi-provider gold consensus only after DC-1 migration and continuity evidence.
Start from measured provider attempts, divergence, latency/freshness, selection transitions, and gap
metrics. Do not change provider priority or thresholds without owner approval. Do not absorb
multi-metal ingestion: XAG/XPT/XPD history and production activation remain a separate owner-gated
DC-3 decision.
