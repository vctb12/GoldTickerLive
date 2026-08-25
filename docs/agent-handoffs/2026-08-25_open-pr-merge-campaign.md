# Open-PR Review, Repair, Ordered Merge, and Release Campaign Handoff

- **Date:** 2026-08-25
- **Branch:** `codex/open-pr-merge-campaign-2026-08-25`
- **Frozen set:** #754, #759, #767, #768, #770, #772, #774
- **Outcome:** `gated-pending-owner-decision`; stopped before the first merge
- **Canonical record:** `docs/audits/2026-08-25_open-pr-merge-audit.md`

## What

The campaign froze the execution-time open-PR set, reviewed repository settings and every candidate,
mapped overlap/order, repaired safe in-scope defects, refreshed each review record, and prepared an
owner-safe resume sequence.

No candidate was marked ready or merged. No deployment, production smoke, production database
migration, production activation, secret change, service-worker change, non-gold flag change, or
repository-setting change was performed.

## Why

GitHub reports workflow ID `260164546`, the repository's canonical `CI` merge gate, as
`disabled_manually`. `AGENTS.md` requires that workflow's lint/test/validate/build evidence before
merge. Available CodeQL and Perf/QA checks do not replace the missing gate, and `main` currently has
no branch protection or required-status enforcement.

The campaign therefore stopped before #768 rather than weakening the exact-head proof standard or
silently changing an owner-controlled repository setting.

## How

- #768 was refreshed twice; exact head `c4cb80eef57f61f89807a12f60853b50fc3269c3` has green
  available CodeQL/Perf proof, but no canonical CI and no merge permission.
- #759 received caller-level fixed-time freshness propagation proof at
  `8a82c613925d8759b87ee7a04f8eb9f52f691f43`.
- #754 and #767 received honest dependency/security/order dispositions; neither branch was refreshed
  or merged because #768 never cleared the first gate.
- #770 repaired the three mobile multi-metal trust/parity findings at
  `ea01bf50a3e01a093b75348d9876881b898ba610`. The pilot remains off.
- #772 repaired correction, identity, migration, least-privilege, pagination, blocking-gate,
  duplicate/rehydration, API, and provenance defects at `4801fd538357f5ad75d8568addaca4848ec62024`.
  It remains draft and database-unapplied.
- #774 remains a blocked draft because it edits production-critical
  `.github/workflows/post_gold.yml`. Its PR body now states that it must not be updated, marked
  ready, or merged through this campaign.

## Proof

- #759: 34/34 focused unit tests and 1/1 Chromium regression passed; lint and build passed.
- #770: 73/73 focused tests, lint, and build passed. Exact 360 px EN/AR/RTL Silver and Palladium
  states were verified in the user's in-app browser; before/after evidence is stored in
  `docs/audits/evidence/2026-08-25_pr770/`.
- #772: 61/61 focused tests, lint, and build passed. Full suite: 1,899 passed, four known
  environment/baseline failures, one skipped out of 1,904. Validation cleared substantive checks and
  stopped at the pre-existing stale SEO inventory report. All five available exact-head CodeQL and
  Perf/QA checks passed at `4801fd5383`; canonical CI remains absent.
- No Supabase database was accessed or migrated. #772's 54-assertion pgTAP suite was not executed
  against PostgreSQL; staging RLS/grant/advisor/rollback/continuity proof remains outstanding.
- GitHub checks are evidence only for their recorded exact heads. Canonical CI remains absent, so
  none is merge proof.

## Risks

- Re-enabling CI can expose new failures; every PR must be updated and re-reviewed at its new exact
  head rather than relying on this checkpoint's local proof.
- Scheduled data commits move `main`, so stale-head and expected-head checks are mandatory
  immediately before every merge.
- #754 and #767 share package/lockfile surfaces and must remain ordered.
- #770 must remain production-disabled until provider licensing, retention, and non-gold history
  terms are separately approved.
- #772 changes production-critical gold-fetch/DataCore surfaces. Source repair is not database or
  workflow continuity proof.
- #774 can affect posting retries and duplicate prevention; it needs a separate protected-workflow
  campaign if the owner wants it reconsidered.

## Owner resume sequence

1. Decide whether to re-enable canonical CI and configure `main` branch protection/required checks.
2. Restart the conveyor at #768. Update onto current `main`, re-review, require green canonical CI
   for the exact head, apply the expected-head guard, then merge only if every gate passes.
3. Continue in order: #759 → #754 → #767 → #770 → #772. Repeat current-main update, review,
   exact-head CI, guarded merge, resulting-main verification, and production smoke after each merge.
4. Before #772 merge consideration, run the migrations and pgTAP/RLS/advisor/rollback/continuity
   proof in an owner-controlled disposable or staging Supabase project. Do not apply production DB
   changes from this handoff.
5. Keep #774 outside the conveyor unless a separate workflow-specific campaign is explicitly
   authorized.
6. Merge this documentation reconciliation only after canonical CI is restored and its exact head is
   green.

## Rollback

No rollback action was needed because no merge or deployment occurred. If a resumed merge later
fails production smoke, stop the conveyor, create a focused revert branch/PR for that merge, rerun
the full gate and smoke, and do not proceed to the next candidate until recovery is verified.
