# Plan: Cursor Automations Playbook

> **Status:** ✅ Shipped (docs-only)  
> **Date:** 2026-06-09  
> **Branch:** `cursor/cursor-automations-playbook-09fe`

## What

Implementation guide for five Cursor Cloud Automations on Gold Ticker Live:

1. Gold Integrity Agent (PR review)
2. Bilingual Consistency Agent (PR review)
3. SERP Structure Agent (PR review)
4. SEO Expansion Agent (weekly schedule, proposal-only)
5. Gold Market Insight Writer (daily schedule, draft-only)

## Why

The site’s public promise depends on pricing trust, bilingual clarity, and search structure before
volume content automation. Cursor Automations need repo-specific prompts, triggers, and policies —
not generic “SEO bot” instructions.

## Deliverables

| File                                             | Purpose                                      |
| ------------------------------------------------ | -------------------------------------------- |
| `docs/CURSOR_AUTOMATIONS_PLAYBOOK.md`            | Main operating guide                         |
| `.cursor/automation-policy.md`                   | Stable “good” definition for all automations |
| `.github/prompts/cursor-automations/*.prompt.md` | Copy-paste Agent Instructions (×5)           |

## Done checklist

- [x] Automation policy with non-negotiables and production-critical file list
- [x] Five prompt files with mission, workflow, hard rules, output format, do-nothing paths
- [x] Playbook with exact Cursor field values, test checklists, success criteria per automation
- [x] Launch order and memory strategy documented
- [x] Wired into `CURSOR_HANDOVER.md` and `AI_AGENT_OPERATING_SYSTEM.md`

## Out of scope (human setup in Cursor UI)

- Creating automations in https://cursor.com/automations (owner action)
- Connecting Slack workspace and channel routing
- Enabling GitHub App permissions for the repo
- Tuning schedules after first-run review

## Rollback

Delete or revert the files above. No runtime or CI impact — docs and prompts only.

## Risks

| Risk                                 | Mitigation                                                                         |
| ------------------------------------ | ---------------------------------------------------------------------------------- |
| Automation auto-merges bad PRs       | Prompts say comment-only; governance rule blocks prod file auto-merge              |
| Overlap with `pr-review.prompt.md`   | Documented relationship; tune Integrity prompt to reduce duplicate noise           |
| Growth agents publish without review | Launch in proposal/draft-only mode; `AI_CONTENT_AUTOMATION.md` enforces human gate |
