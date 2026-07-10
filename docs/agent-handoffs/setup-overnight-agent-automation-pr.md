# Handoff — Setup overnight agent automation

Ready-to-paste PR title + body for the branch `claude/overnight-agent-automation-i6l4dc`. **Do not
merge** — owner review required.

---

## Title

`Phase: Setup overnight agent automation`

## What changed

Tooling + docs only. No product code, no pricing logic, no workflows-in-place edits.

- **`scripts/agent-night-run.sh`** — SAFE overnight runner. Keeps the Mac awake via `caffeinate`
  when available, works on an isolated non-`main` branch (or `git worktree` with
  `AGENT_WORKTREE=1`), starts the agent in SAFE mode (no `--dangerously-skip-permissions`), and logs
  every run to `logs/agent-night/<timestamp>.log`. Refuses to run against `main`/`master`.
- **`scripts/agent-status.sh`** — read-only session snapshot: branch, short status, recent commits,
  files changed vs base, `gh` PR hints (if installed), and a tracker status summary.
- **`.claude/settings.json`** — permission policy. ALLOWS safe repo work (read/edit source, run npm
  scripts, commit, push to `cowork/**` `claude/**` `agent/**`). DENIES dangerous work: push/
  force-push to `main`, merge, deploy, editing `.env`/secrets/credentials, editing
  `gold-price-fetch.yml`, `post_gold.yml`, `sw.js`, and `src/config/constants.js` (the AED peg).
- **`.github/workflows/agent-ci.yml`** — NEW additive CI for agent branches only (lint / test /
  build, `--if-present`). No deploy, no secrets, no scheduled price jobs. The existing `ci.yml`
  merge gate is left untouched.
- **`.github/codex/prompts/review.md`** — Codex/secondary-reviewer prompt that enforces the
  financial-site guardrails (spot ≠ retail, peg 3.6725, disclaimers, RTL/bilingual, no secrets, no
  merge/deploy) and a priority-ordered review checklist.
- **`docs/agent-handoffs/`** — new directory + README explaining owner-facing handoff notes (this
  file is the first one).
- **`AGENTS.md`**, **`CLAUDE.md`** — compact "Overnight autonomous agent" guardrail sections.
- **`docs/AGENT_MASTER_TRACKER.md`** — Current Active Phase row + Maintenance Log entry for this
  phase.
- **`.gitignore`** — ignore `logs/agent-night/` and `.worktrees/`.

## Why it matters

Lets the owner run agents unattended overnight with a hard, auditable safety envelope: nothing gets
merged, deployed, or pushed to `main`; no secrets are touched; and the pricing invariants (peg
3.6725, troy 31.1034768 g, karat/FX formulas, source-priority) cannot be edited by the agent. Two
independent layers enforce this (the runner script + `.claude/settings.json` deny rules).

## Pages affected

None — tooling & docs only. No public HTML/CSS/JS behavior changes.

## Tests run (real results)

- `npm ci` — OK, 349 packages, **0 vulnerabilities**.
- `npm run lint` (eslint) — **PASS**.
- `npm test` — **PASS**, 1407 tests, 0 failures.
- `npm run validate` — **PASS** (non-fatal pre-existing `seo-governance` "stale report" notice; gate
  still exits 0).
- `npm run build` — **PASS**, `dist/index.html` present. Build regenerated `public/sitemap.xml` (a
  generated file); that drift was reverted and is not part of this PR.
- `npm run format:check` — **pre-existing repo-wide failure** (152 files, e.g.
  `tests/price-motion.test.js`, unrelated to this branch). The files added/edited here are
  prettier-clean (`npx prettier --check` on them passes). Not fixed here to keep the diff minimal
  and on-scope.

## Risks

- Low. Additive files + doc appends. The new `agent-ci.yml` only triggers on agent branches and
  `workflow_dispatch`, so it cannot affect `main` CI or deploys.
- `.claude/settings.json` deny globs are best-effort defense-in-depth; the runner script and branch
  protection remain the primary stop for main/force-push.

## Rollback plan

Nothing is merged. To undo: close this PR / delete the branch. Individually, each file is
independent and safe to `git revert`; deleting `.github/workflows/agent-ci.yml` fully removes the
new CI. No data, secrets, or production surfaces are involved.

## What still needs owner approval

- Turning on any real overnight cadence (scheduling, machine, model/API budget).
- Any future agent phase that is owner-gated in the tracker (paid APIs, secrets, Supabase
  RLS/signup, billing, production workflow changes) — these stay in the Owner-Gated Decision Queue,
  not in code.
- Optional: repo-wide `npm run format` cleanup for the 152 pre-existing prettier warnings (separate
  PR, out of scope here).
