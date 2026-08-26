# Open-PR Review, Repair, Ordered Merge, and Release Campaign

- **Date:** 2026-08-25
- **Status:** `blocked-before-merge`
- **Branch:** `codex/open-pr-merge-campaign-2026-08-25`
- **Reconciliation PR:** [#775](https://github.com/vctb12/GoldTickerLive/pull/775) (draft/unmerged)
- **Audit:** `docs/audits/2026-08-25_open-pr-merge-audit.md`
- **Handoff:** `docs/agent-handoffs/2026-08-25_open-pr-merge-campaign.md`

## Objective

Review the immutable execution-time set of seven open PRs, repair only what is required for safe
integration, rebase and prove each candidate against current `main`, merge eligible work in strict
dependency order, verify production after every merge, and finish with one reconciliation PR.

## Current outcome

The review/repair phase found that GitHub's canonical `CI` workflow is `disabled_manually`. Because
`AGENTS.md` names that workflow as the merge gate, no PR can satisfy the required exact-head
lint/test/validate/build evidence. The campaign therefore stops before merge/release actions:

- no PR was merged, marked ready, or deployed;
- no production smoke or rollback was claimed;
- #774 remains an owner-gated protected-workflow draft;
- #759, #770, and #772 received safe source/test repairs on their existing branches;
- the final reconciliation PR documents the blocked outcome and the evidence needed to resume.

## Guardrails

- Protect reference-price accuracy, freshness truth, EN/AR parity, RTL, provenance, and pricing
  constants.
- Do not merge #774 or modify `.github/workflows/post_gold.yml`.
- Do not activate the non-gold pilot, apply a production database migration, expose secrets, weaken
  repository settings, force-push, or bypass stale/red/missing checks.
- Preserve the user's dirty primary checkout; all campaign work uses isolated worktrees/branches.
- Use an expected-head SHA guard immediately before every merge and proceed one PR at a time.

## Ordered work

1. Freeze the PR set and record settings, overlaps, discussions, risks, and initial dispositions.
2. Review/rebase/prove/merge #768.
3. Verify/repair freshness semantics, rebase/prove/merge #759.
4. Rebase/prove/merge production dependency PR #754.
5. Rebase #767 onto the combined dependency state, then prove/merge it.
6. Repair #770's known multi-metal UX/parity issues, keep the pilot off, rebase, run full visual and
   repository proof, then merge if eligible.
7. Rebase #772 after #770, audit data/Supabase integrity, run focused and full proof, then merge if
   eligible.
8. Keep #774 formally blocked and unmerged.
9. Run final production, integrity, audit, and dependency reconciliation.
10. Open and merge one documentation-only reconciliation PR; update the tracker and owner handoff.

## Stop conditions

Stop the conveyor on any unexpected head change, unresolved review thread, merge conflict whose
correct resolution is ambiguous, failed/currently missing required proof, production regression,
pricing/freshness ambiguity, or newly discovered owner-gated activation.

The manually disabled canonical CI workflow triggered this stop condition for the whole conveyor.

## Verification model

Every merged PR needs change-specific tests, current-head GitHub checks, exact-SHA merge proof, and
post-merge production smoke. Dependency work also needs lockfile and advisory proof; tracker UI work
needs EN/AR, RTL, 360px, keyboard, reduced-motion, and console checks; DataCore work needs migration
review without production application plus provenance/freshness/gap/correction tests.
