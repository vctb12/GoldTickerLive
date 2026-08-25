# DataCore DC-1 — Historical Truth and Provider Control Plane

**PR:** [#772](https://github.com/vctb12/GoldTickerLive/pull/772) (draft)

**Branch:** `codex/datacore-dc1-historical-truth-2026-08-25`

**Production state:** not merged, not deployed, migration not applied

## What

- Audited the observed five-minute workflow delivery, sampled sync logs, and anonymous Supabase Data
  API surface without reading or printing credentials.
- Added canonical, immutable XAU/USD provider observations and provider-attempt telemetry with
  stable identities, duplicate-safe writes, quality metrics, and append-only database controls.
- Added deterministic hourly/daily static rollups, a SHA-256 manifest, provider-health output, and
  explicit historical/reference labels.
- Replaced the unavailable optional Supabase JavaScript client path with dependency-free PostgREST
  calls using the existing service-role secret at runtime.
- Added Supabase-first API reads with bounded static and legacy fallbacks, migration/rollback docs,
  tracker entries, focused tests, and the required 360 px EN/AR review of draft PR #770.

## Why

The workflow could conclude successfully while the snapshot path skipped every sampled remote write.
DC-1 makes workflow completion, remote persistence, continuity, and static fallback quality visible
as separate signals, without changing the production gold-selection path or fabricating history.

## How

- The existing gold consensus payload remains authoritative for the published quote.
- Every valid provider diagnostic becomes a normalized observation; only the existing selected quote
  is marked selected for public rollups.
- Raw observation and provider-run tables reject update/delete, allow service-role writes only, and
  expose public reads only for the intended snapshot/health surfaces.
- Repository history starts with one verified current XAU/USD point. Missing slots remain missing.

## Proof

- Focused DC-1/API tests: 31 passed, 0 failed.
- Lint: passed.
- Build: passed.
- Prettier check, YAML parse, JSON parse, JavaScript syntax, and `git diff --check`: passed.
- Full suite: 1,865 passed, 4 failed, 1 skipped. Two failures are the pre-existing Windows
  `python3`/URL-path test issue; the sandboxed UAE source audit passed when rerun with its needed
  external access; and the unrelated path-traversal test currently receives a 500 while serving the
  existing `dist/404.html` on Windows. DC-1 does not change that server/static path.
- `npm run validate` passed its core, governance, DOM-safety, accessibility, metadata, language,
  service-worker, content, and analytics checks, then stopped at the pre-existing stale generated
  `reports/seo/inventory.json` baseline. Direct follow-on checks also reported stale generated SEO
  governance and analytics inventories. DC-1 does not absorb that unrelated generated churn.

## Risks

- The physical Supabase table inventory and row counts remain unavailable without the owner-approved
  admin path. Anonymous REST returned schema-cache errors and must not be interpreted as zero rows.
- The migration adds backfills, indexes, grants, RLS policies, and append-only triggers. It requires
  a backup, dry run, owner approval, and a monitored manual workflow run before strict mode.
- GitHub scheduled workflows are best-effort; missing-slot metrics must not be treated as a delivery
  guarantee or filled with synthetic prices.

## Rollback

Close the draft PR or revert its commits before merge. After an owner-approved rollout, follow
`docs/datacore-dc1-migration-rollback.md`: keep sync non-strict, preserve raw exports, revert the
application/workflow through a PR, and remove database behavior only through a reviewed migration.

## Owner approval still required

- Review and apply `supabase/migrations/006_datacore_observations.sql` using the documented backup
  and dry-run procedure.
- Dispatch and inspect one manual Gold Price Fetch run, then observe at least 24 open-market hours
  before considering strict remote-sync enforcement.
- Do not enable non-gold ingestion in this phase.
