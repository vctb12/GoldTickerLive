# Cursor Cloud Automation prompts

Copy-paste **Agent Instructions** for [Cursor Automations](https://cursor.com/automations).

**Setup:** [`docs/CURSOR_AUTOMATIONS_PLAYBOOK.md`](../../../docs/CURSOR_AUTOMATIONS_PLAYBOOK.md)  
**Live config:** [`docs/CURSOR_AUTOMATIONS_REGISTRY.md`](../../../docs/CURSOR_AUTOMATIONS_REGISTRY.md)  
**Policy:** [`.cursor/automation-policy.md`](../../../.cursor/automation-policy.md)  
**Master program:** [`docs/MASTER_IMPROVEMENT_PROGRAM.md`](../../../docs/MASTER_IMPROVEMENT_PROGRAM.md)

## Core automations (build order)

| Order | File | Trigger | Launch mode |
| ----- | ---- | ------- | ----------- |
| 1 | [`gold-integrity-agent.prompt.md`](./gold-integrity-agent.prompt.md) | GitHub PR opened/updated | Advisory |
| 2 | [`bilingual-consistency-agent.prompt.md`](./bilingual-consistency-agent.prompt.md) | GitHub PR opened/updated | Advisory |
| 3 | [`serp-structure-agent.prompt.md`](./serp-structure-agent.prompt.md) | GitHub PR opened/updated | Advisory |
| 4 | [`seo-expansion-agent.prompt.md`](./seo-expansion-agent.prompt.md) | Weekly schedule | Proposal-only |
| 5 | [`gold-market-insight-writer.prompt.md`](./gold-market-insight-writer.prompt.md) | Daily schedule | Draft-only |

## Phase 2+ prompts

| File | When |
| ---- | ---- |
| [`serp-structure-weekly-audit.prompt.md`](./serp-structure-weekly-audit.prompt.md) | SERP PR mode stable → weekly schedule |
| [`seo-expansion-draft-mode.prompt.md`](./seo-expansion-draft-mode.prompt.md) | Registry mode `draft-scaffold` |
| [`automation-tuning-session.prompt.md`](./automation-tuning-session.prompt.md) | After 5–10 automation runs (interactive session) |
| [`ui-ux-ease-of-use-session.prompt.md`](./ui-ux-ease-of-use-session.prompt.md) | One PR of homepage/nav/calculator ease-of-use |

Paste the full file body (below YAML frontmatter) into the automation **Agent Instructions** field.
