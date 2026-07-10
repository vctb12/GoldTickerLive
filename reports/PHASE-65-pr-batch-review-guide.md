# Phase 65 — Revamp PR batch-review guide (shippable-now, docs-only)

Docs-only, immediately mergeable. Adds a single index of the 20 open revamp PRs (#589–#607, #609,
#610) so they can be reviewed and merged efficiently — targeting the actual bottleneck (owner review
of a large green queue) rather than adding more code.

## Why this

20 tested PRs are open and unmerged. More flagged-OFF-pending-feed modules would just deepen the
pile, and the remaining untested `src/lib` modules are DOM/side-effect-bound (genuinely hard to
unit-test — not an oversight to force). The highest-value thing I can ship right now is a guide that
helps the owner **unblock the whole queue**.

## What shipped

- **`reports/REVAMP-PR-BATCH-REVIEW-GUIDE.md`** — for every open revamp PR: phase, what it adds, its
  flag (all default OFF), whether merging changes behavior, and the owner action to activate it.
  Plus:
  - a **suggested merge order** (behavior-improving first, then test-only, then pure libs, then
    flagged-OFF);
  - the **one expected merge conflict** — #591/#594/#596/#600 each append a distinct flag to the
    same `feature-flags.js` frozen block; resolution is "keep all flags";
  - the **owner-action backlog** (feeds, VAT, French review, GitHub re-auth) that keeps flagged work
    dormant;
  - what merging **#601–#606** unblocks (the multi-metal orchestrator).

## Verification

- `npm test` → all pass (docs-only change)
- `npm run lint` → clean
- `npm run build` → success
- `npm run validate` → exit 0

## Cadence note

After this phase I'm lengthening the self-check-in interval: hourly production has hit diminishing
returns with 20 PRs queued. I'll slow the pace while staying immediately responsive to PR CI/review
webhooks and to your review/merge activity.
