---
mode: agent
description: Endless AI integration (gated) — docs, disclaimers, pure formatters only unless owner approved live LLM.
related_skills:
  - gold-ticker-live-audit
related_instructions:
  - docs/AI_CONTENT_AUTOMATION.md
  - docs/AI_RELEASE_READINESS_PLAYBOOK.md
---

# Prompt: Endless AI Integration (Gated)

Before reviewing or editing anything, read and follow:

- [`AGENTS.md`](../../AGENTS.md)
- [`.cursor/rules/non-negotiable-rules.mdc`](../../.cursor/rules/non-negotiable-rules.mdc)
- [`.cursor/rules/pricing-trust.mdc`](../../.cursor/rules/pricing-trust.mdc)
- [`.cursor/rules/bilingual-content.mdc`](../../.cursor/rules/bilingual-content.mdc)
- [`.cursor/rules/seo-structure.mdc`](../../.cursor/rules/seo-structure.mdc)


## Goal

Advance AI-related product **safely** — one item per run.

## Allowed without new secrets in git

- `translations.js` disclaimer strings for AI-labeled surfaces
- `environment-variables.md` owner steps for API keys
- Pure functions + tests for price-context formatting (newsletter/social templates)
- Documentation improvements in `docs/AI_*.md`

## Not allowed in one PR

- Live LLM calls without owner-approved env, rate limits, and visible disclaimers

## Verification

`npm test` for any new pure functions.

## Return format

Item → change → owner follow-ups → risks.
