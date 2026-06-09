# Cursor Cloud Automation prompts

Copy-paste **Agent Instructions** for [Cursor Automations](https://cursor.com/automations).

**Setup guide:** [`docs/CURSOR_AUTOMATIONS_PLAYBOOK.md`](../../../docs/CURSOR_AUTOMATIONS_PLAYBOOK.md)  
**Policy:** [`.cursor/automation-policy.md`](../../../.cursor/automation-policy.md)

| Order | File | Trigger | Launch mode |
| ----- | ---- | ------- | ----------- |
| 1 | [`gold-integrity-agent.prompt.md`](./gold-integrity-agent.prompt.md) | GitHub PR opened/updated | Advisory |
| 2 | [`bilingual-consistency-agent.prompt.md`](./bilingual-consistency-agent.prompt.md) | GitHub PR opened/updated | Advisory |
| 3 | [`serp-structure-agent.prompt.md`](./serp-structure-agent.prompt.md) | GitHub PR opened/updated | Advisory |
| 4 | [`seo-expansion-agent.prompt.md`](./seo-expansion-agent.prompt.md) | Weekly schedule | Proposal-only |
| 5 | [`gold-market-insight-writer.prompt.md`](./gold-market-insight-writer.prompt.md) | Daily schedule | Draft-only |

Paste the full file body (below the YAML frontmatter) into the automation **Agent Instructions** field.
