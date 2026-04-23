# CLAUDE.md

Claude Code reads this file on startup. **The canonical cross-agent charter is
[`AGENTS.md`](./AGENTS.md) — read it first.** Everything below is Claude-specific mechanics that
don't belong in the shared charter.

## Start here

1. [`AGENTS.md`](./AGENTS.md) — what this repo is, core commands, repository map, the Autonomy
   Contract, product-trust guardrails, style, done criteria.
2. [`docs/REVAMP_PLAN.md`](./docs/REVAMP_PLAN.md) — only if your task maps to an active section.
3. [`docs/plans/README.md`](./docs/plans/README.md) — only if your task was captured as a proposal.

Don't preload the whole `docs/` tree. Load files on demand.

## Claude-specific mechanics

- **`report_progress`** — the canonical way to commit and push on this repo. Don't use `git push`
  directly; push is blocked for the task agent. Call `report_progress` before your first edit with a
  checklist, then again at meaningful milestones.
- **`parallel_validation`** — run before finalizing the task. Address valid findings; re-run if you
  made significant changes.
- **`store_memory`** — store durable repo-wide facts (conventions, commands you verified,
  invariants) with citations. Don't store user preferences or session-specific state.
- **Subagents (`task`)** — use `explore` only when a task decomposes into many independent research
  threads in a large codebase. For single-file lookups and known-path reads, use `view` / `grep` /
  `glob` directly.
- **Skills** — the `customize-cloud-agent` skill is available for editing `copilot-setup-steps.yml`
  and related cloud-agent environment config.
- **GitHub MCP tools** — use them for any CI / workflow / PR investigation. Don't claim you can't
  access logs; `get_job_logs`, `list_workflow_runs`, and friends are available.
- **`gh-advisory-database`** — call before adding any new dependency in a supported ecosystem (npm /
  pip / go / actions / maven / …).

## Verification defaults for Claude sessions

When you finish work, run the commands in [`AGENTS.md` §2](./AGENTS.md#2-core-commands) that match
the surface you touched (typically `npm test` + `npm run lint` + `npm run validate`, plus
`npm run build` for any change that touches HTML / CSS / JS). State in the PR body exactly what you
ran vs. what you inferred.

## When the two files disagree

If anything here contradicts `AGENTS.md`, `AGENTS.md` wins. File an edit to reconcile.
