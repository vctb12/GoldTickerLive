---
mode: agent
description: Platform Upgrade — read the program plan, pick one unblocked task, ship one PR.
related_instructions:
  - AGENTS.md
  - docs/plans/2026-06-09_platform-upgrade-program.md
---

# Platform Upgrade — Bootstrap (pick one task)

Before reviewing or editing anything, read and follow:

- [`AGENTS.md`](../../AGENTS.md)
- [`.cursor/rules/non-negotiable-rules.mdc`](../../.cursor/rules/non-negotiable-rules.mdc)
- [`.cursor/rules/pricing-trust.mdc`](../../.cursor/rules/pricing-trust.mdc)
- [`.cursor/rules/bilingual-content.mdc`](../../.cursor/rules/bilingual-content.mdc)
- [`.cursor/rules/seo-structure.mdc`](../../.cursor/rules/seo-structure.mdc)

You are the lead engineer for **Gold Ticker Live** (`vctb12/GoldTickerLive`).

## Required reading

1. [`AGENTS.md`](../../AGENTS.md)
2. [`PLAN.md`](../../PLAN.md)
3. [`docs/plans/2026-06-09_platform-upgrade-program.md`](../../docs/plans/2026-06-09_platform-upgrade-program.md) — **Progress registry**
4. Open PRs: do not duplicate scope (especially [#421](https://github.com/vctb12/GoldTickerLive/pull/421) fix-first if still open)

## Your job

1. From the progress registry, pick **one** task marked ⬜ or 🟡 (skip ✅ unless gap-fill).
2. Copy that task's **Session prompt** from the plan into your work plan.
3. Restate task → impacted files → numbered plan → **stop for approval** if the user asked for plan-first mode; otherwise document plan in PR body.
4. Branch: `cursor/<task-slug>-131d`
5. Implement smallest correct diff; verify per plan §10 Definition of done.
6. Update progress registry + `PLAN.md` in the same PR when the task completes.

## Default next task (if user did not specify)

**T0.3** — `@.github/prompts/platform-upgrade-t03-secrets.prompt.md`

## Return format

What / Why / How / Proof / Risks + which registry row you updated.
