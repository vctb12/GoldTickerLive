---
mode: agent
description: Bootstrap every session — read PLAN.md, pick one PR-sized slice, verify, return What/Why/How/Proof/Risks.
related_skills:
  - gold-ticker-live-audit
related_instructions:
  - AGENTS.md
---

# Prompt: Master Rerun

Before reviewing or editing anything, read and follow:

- [`AGENTS.md`](../../AGENTS.md)
- [`.cursor/rules/non-negotiable-rules.mdc`](../../.cursor/rules/non-negotiable-rules.mdc)
- [`.cursor/rules/pricing-trust.mdc`](../../.cursor/rules/pricing-trust.mdc)
- [`.cursor/rules/bilingual-content.mdc`](../../.cursor/rules/bilingual-content.mdc)
- [`.cursor/rules/seo-structure.mdc`](../../.cursor/rules/seo-structure.mdc)


Canonical copy-paste body: [`prompts/master-rerun.md`](../../prompts/master-rerun.md)

## Goal

Run a structured Gold Ticker Live session from checked-in instructions — not from chat memory.

## Required inspection

1. [`AGENTS.md`](../../AGENTS.md)
2. [`PLAN.md`](../../PLAN.md)
3. [`docs/plans/2026-06-01_master-operations-hub.md`](../../docs/plans/2026-06-01_master-operations-hub.md)
4. Platform upgrade backlog (if applicable):
   [`docs/plans/2026-06-09_platform-upgrade-program.md`](../../docs/plans/2026-06-09_platform-upgrade-program.md)
5. Open PRs: `gh pr list --state open`

## Pick one slice

Ship one PR-sized improvement. Route to `@.github/prompts/session-pick-next-work.prompt.md` if the
task is unclear.

External repos: [`docs/REPOS_TO_STEAL_FROM.md`](../../docs/REPOS_TO_STEAL_FROM.md) — study or borrow
one feature; never full-site template swap.

## Verification

`npm test`, `npm run lint`, `npm run validate`, `npm run build` — as applicable. State what you
skipped.

## Return format

**What / Why / How / Proof / Risks** + `PLAN.md` diff summary.
