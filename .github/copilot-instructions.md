# Copilot instructions

GitHub Copilot (cloud agent, CLI, chat, code review) reads this file. **The canonical charter is [`AGENTS.md`](../AGENTS.md) — read it first.** This file only adds Copilot-specific mechanics.

## Start here

1. [`AGENTS.md`](../AGENTS.md) — repo summary, commands, repository map, the Autonomy Contract, product-trust guardrails, style, done criteria.
2. [`docs/REVAMP_PLAN.md`](../docs/REVAMP_PLAN.md) — only if your task maps to an active section.
3. [`docs/plans/README.md`](../docs/plans/README.md) — only if your task was captured as a proposal.

Don't preload the whole `docs/` tree. Load files on demand.

## Copilot-specific mechanics

- **`report_progress`** is the only way to push on this repo. The task agent cannot `git push`. Call it before your first edit with a plan checklist; call it again at meaningful milestones.
- **GitHub MCP tools** — use them for CI / workflow / PR investigation. `list_workflow_runs`, `get_job_logs`, `pull_request_read`, `get_file_contents`, etc. are available. Don't claim you can't reach logs.
- **`parallel_validation`** — run before you finalize. It runs code review + CodeQL in parallel. Address valid findings; re-run if you made significant changes.
- **`gh-advisory-database`** — call before adding any new dependency in a supported ecosystem.
- **`create_pull_request`** — only on explicit user request (or when the `<agent_instructions>` in the prompt asks for a PR). Draft PRs by default.
- **Code-review truncation** — Copilot code review truncates instruction files at 4 KB. This file is intentionally well under that.

## Verification defaults for Copilot sessions

Run the commands in [`AGENTS.md` §2](../AGENTS.md#2-core-commands) that match the surface you touched. At minimum, for code changes: `npm test`, `npm run lint`, `npm run validate`. For anything that touches HTML / CSS / JS output: also `npm run build`.

## When the two files disagree

`AGENTS.md` wins. File an edit to reconcile.
