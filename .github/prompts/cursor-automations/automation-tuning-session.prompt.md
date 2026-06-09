---
mode: agent
description: Tune Cursor Cloud Automations after first runs — reduce noise, tighten block criteria, update registry.
related_instructions:
  - docs/CURSOR_AUTOMATIONS_PLAYBOOK.md
  - docs/CURSOR_AUTOMATIONS_REGISTRY.md
  - .cursor/automation-policy.md
---

# Session: Cursor Automation tuning

Read `docs/CURSOR_AUTOMATIONS_REGISTRY.md` and the last 3–5 PR comments from each active automation
(via GitHub MCP or PR history).

## Goal

Improve signal quality — not add more automations.

## Per automation

1. **Gold Integrity** — list false positives; propose prompt edits to `.github/prompts/cursor-automations/gold-integrity-agent.prompt.md` only if needed; tighten `BLOCK` to trust/math/indexability only.
2. **Bilingual** — list missed mismatches vs noise; add glossary rows to registry memory index.
3. **SERP** — list duplicate-title catches vs nitpicks; confirm weekly audit readiness.
4. **SEO Expansion / Insight Writer** — confirm still proposal/draft-only unless registry mode upgraded.

## Deliverables

- Updated registry tuning log rows (dates + results)
- Prompt diff only if a pattern repeats 3+ times
- One paragraph recommendation: which automation to pause vs upgrade

## Verification

Docs-only unless prompt files change — `npm run lint` if any JS touched.

## Return format

**Automation / Issue / Fix / Registry update**
