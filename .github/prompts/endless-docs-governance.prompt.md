---
mode: agent
description: Endless docs governance — fix stale plan status, duplicate rules, or broken doc links. One issue per run.
related_skills:
  - gold-ticker-live-audit
related_instructions:
  - AGENTS.md
---

# Prompt: Endless Docs Governance

Before reviewing or editing anything, read and follow:

- [`AGENTS.md`](../../AGENTS.md)
- [`.cursor/rules/non-negotiable-rules.mdc`](../../.cursor/rules/non-negotiable-rules.mdc)
- [`.cursor/rules/pricing-trust.mdc`](../../.cursor/rules/pricing-trust.mdc)
- [`.cursor/rules/bilingual-content.mdc`](../../.cursor/rules/bilingual-content.mdc)
- [`.cursor/rules/seo-structure.mdc`](../../.cursor/rules/seo-structure.mdc)


## Goal

Keep documentation **truthful vs `main`** — one fix per run.

## Required inspection

1. [`docs/plans/ARCHIVE_AND_SUPERSESSION_INDEX.md`](../../docs/plans/ARCHIVE_AND_SUPERSESSION_INDEX.md)
2. [`docs/plans/README.md`](../../docs/plans/README.md)
3. [`PLAN.md`](../../PLAN.md)

## Pick one

- Stale checkbox/status in a plan file
- Duplicate guardrail block → pointer to `AGENTS.md`
- Missing index entry in `docs/README.md`
- `REVAMP_PLAN.md` out of sync with merged PR

## Not allowed

- Delete historical proposals without archive index entry

## Verification

Ripgrep for broken relative links in edited markdown.

## Return format

Doc → drift found → fix → follow-ups.
