# Agent instruction refresh — plan

_Phase 2 record for the "permissive autonomy charter" rewrite._ _Date: 2026-04-23. Branch:
`copilot/overhaul-agent-instruction-system`._

The repo accumulated a sprawling instruction + planning system: five+ files restating the same
product rules, a 1,656-line master plan with ceremonial top-matter, ~15 "moved — see master plan"
pointer stubs, and agent-addressed language that pushes tiny-diff, permission-seeking behavior. This
plan audits every in-scope file, picks a small canonical set, strips the restrictive patterns, and
keeps the product-trust guardrails the site actually needs.

---

## Inventory

### Agent-instruction files

| File                                        | Lines | Verdict         | Reason                                                                                                                                                                                            |
| ------------------------------------------- | ----: | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AGENTS.md`                                 |   169 | **REWRITE**     | Canonical cross-agent source of truth. Current version is heavy on "smallest correct change / never broad audits / don't touch adjacent files" — the exact anti-patterns the refresh targets.     |
| `CLAUDE.md` (root)                          |   179 | **REWRITE**     | Collapse to thin pointer + Claude-specific mechanics. Currently duplicates architecture overview, module table, DOM-safety rules, and workflow list that belong in the repo README / `AGENTS.md`. |
| `docs/CLAUDE.md`                            |   179 | **DELETE**      | Second Claude rules file with its own `<role>` / `<non_negotiables>` / `<mode_rules>` XML-ish blocks. Adds a third copy of the product rules. Pure drift.                                         |
| `.github/copilot-instructions.md`           |    23 | **REWRITE**     | Keep as thin pointer to `AGENTS.md` plus Copilot-only mechanics, under 4,000 characters.                                                                                                          |
| `.github/instructions/docs.instructions.md` |     8 | **KEEP (slim)** | Genuinely path-scoped (`applyTo: docs/**`). Soften the "do not leave docs stale" phrasing.                                                                                                        |
| `docs/product/MEMORY.md`                    |    12 | **DELETE**      | Agent-addressed "project memory" of preferences. Content already lives in `AGENTS.md` / master plan.                                                                                              |

### Planning / roadmap files

| File                                      | Lines | Verdict             | Reason                                                                                                                                                                                                                                                                             |
| ----------------------------------------- | ----: | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/REVAMP_PLAN.md`                     | 1,656 | **REFACTOR**        | Keep the real plan content. Strip the "🛑 mandatory session protocol", "every report_progress must update this file", and "absorbed from …" top-matter. Drop the governance sections (§0.3 engineering non-negotiables, §1 commit-discipline taxonomy) that duplicate `AGENTS.md`. |
| `docs/plans/README.md`                    |   148 | **REFACTOR**        | Drop the "🛑 read this folder before any work in any future prompt or channel" ceremony. Keep the proposals inventory + priority matrix, which is useful. Remove the "no work is to be executed from a raw prompt" rule — it blocks informed initiative.                           |
| `docs/plans/PLATFORM_UPGRADE_PROPOSAL.md` |   261 | **REFACTOR (trim)** | Remove the "Governing constraints (from AGENTS.md / CLAUDE.md)" duplicated block. Keep the raw proposal capture.                                                                                                                                                                   |
| `docs/plans/REPO_CLEANUP_PROPOSAL.md`     |   218 | **REFACTOR (trim)** | Same: drop the duplicated "Governing constraints" block.                                                                                                                                                                                                                           |
| `docs/README.md`                          |    89 | **REFACTOR**        | Drop the large "🛑 all planning lives in REVAMP_PLAN" scare-block and the 15-row "Pointers" table (the pointer files are being deleted).                                                                                                                                           |
| `docs/REVAMP_STATUS.md`                   |     8 | **DELETE**          | Pointer stub.                                                                                                                                                                                                                                                                      |
| `docs/REVAMP_EXECUTION_SUMMARY.md`        |     9 | **DELETE**          | Pointer stub.                                                                                                                                                                                                                                                                      |
| `docs/ROADMAP_IMPLEMENTATION.md`          |    17 | **DELETE**          | Pointer stub.                                                                                                                                                                                                                                                                      |
| `docs/execution-log.md`                   |     8 | **DELETE**          | Pointer stub.                                                                                                                                                                                                                                                                      |
| `docs/issues-found.md`                    |     7 | **DELETE**          | Pointer stub.                                                                                                                                                                                                                                                                      |
| `docs/risks.md`                           |     7 | **DELETE**          | Pointer stub.                                                                                                                                                                                                                                                                      |
| `docs/pr-audit.md`                        |     9 | **DELETE**          | Pointer stub.                                                                                                                                                                                                                                                                      |
| `docs/codebase-audit.md`                  |    13 | **DELETE**          | Pointer stub.                                                                                                                                                                                                                                                                      |
| `docs/PR_REVIEW_REQUEST.md`               |    14 | **DELETE**          | Self-described archival stub for a merged PR.                                                                                                                                                                                                                                      |
| `docs/product/PRD.md`                     |    14 | **DELETE**          | Pointer stub. Product context lives in `REVAMP_PLAN.md` §0.                                                                                                                                                                                                                        |
| `docs/product/PHASE0_GUARDRAILS.md`       |     9 | **DELETE**          | Pointer stub.                                                                                                                                                                                                                                                                      |
| `docs/product/TRUST_SNIPPETS.md`          |    10 | **DELETE**          | Pointer stub.                                                                                                                                                                                                                                                                      |
| `docs/product/DECISIONS.md`               |     7 | **DELETE**          | Pointer stub.                                                                                                                                                                                                                                                                      |
| `docs/product/PLANNING.md`                |    13 | **DELETE**          | Pointer stub.                                                                                                                                                                                                                                                                      |
| `docs/product/TASKS.md`                   |     8 | **DELETE**          | Pointer stub.                                                                                                                                                                                                                                                                      |
| `docs/product/VERIFICATION.md`            |     8 | **DELETE**          | Pointer stub.                                                                                                                                                                                                                                                                      |
| `docs/product/ROLLOUT_GOVERNANCE.md`      |     8 | **DELETE**          | Pointer stub.                                                                                                                                                                                                                                                                      |
| `docs/product/index.html`                 |     — | **DELETE**          | Orphan page for the empty product/ folder.                                                                                                                                                                                                                                         |

### Out of scope (left untouched)

- `README.md`, `CONTRIBUTING.md` (one lint-style "never" line; not agent-addressed).
- All reference docs: `docs/ARCHITECTURE.md`, `DESIGN_TOKENS.md`, `ACCESSIBILITY.md`,
  `PERFORMANCE.md`, `SEO_STRATEGY.md`, `SEO_CHECKLIST.md`, `SEO_SITEMAP_GUIDE.md`,
  `DEPENDENCIES.md`, `FILES_GUIDE.md`, `EDIT_GUIDE.md`, `CONTRIBUTING.md`, `ADMIN_GUIDE.md`,
  `ADMIN_SETUP.md`, `SUPABASE_SETUP.md`, `SUPABASE_SCHEMA.md`, `AUTOMATIONS.md`,
  `TWITTER_AUTOMATION.md`, `twitter_bot_*`, `MANUAL_INPUTS.md`, `TEARDOWN.md`,
  `environment-variables.md`, `performance-baseline.json`, `replit.md`, `ERROR_REPORT.md`,
  `LIMITATIONS.md`, `tracker-state.md`, `CHANGELOG.md`, `docs/index.html`.
- `.github/workflows/**`, `.github/PULL_REQUEST_TEMPLATE.md`, `.github/ISSUE_TEMPLATE/**`,
  `.github/prompts/**`, `.github/dependabot.yml`.
- All production HTML/CSS/JS/Python, `CNAME`, `robots.txt`, `_headers`, `_redirects`, service
  worker, GA4 tags.

---

## Target architecture

```
AGENTS.md                              # canonical cross-agent charter (rewritten)
CLAUDE.md                              # thin pointer + Claude-only mechanics
.github/copilot-instructions.md        # thin pointer + Copilot-only mechanics (<4000 chars)
.github/instructions/
  docs.instructions.md                 # path-scoped (applyTo: docs/**), slimmed

docs/
  AGENT_REFRESH_PLAN.md                # this file (kept as record)
  REVAMP_PLAN.md                       # real master plan, top-matter trimmed
  README.md                            # index, slimmed (no pointer table)
  plans/
    README.md                          # intake + priority matrix (no ceremony)
    PLATFORM_UPGRADE_PROPOSAL.md       # raw capture (guardrail duplication trimmed)
    REPO_CLEANUP_PROPOSAL.md           # raw capture (guardrail duplication trimmed)
  <reference docs untouched>

# deleted: docs/CLAUDE.md, docs/REVAMP_STATUS.md, docs/REVAMP_EXECUTION_SUMMARY.md,
# docs/ROADMAP_IMPLEMENTATION.md, docs/execution-log.md, docs/issues-found.md,
# docs/risks.md, docs/pr-audit.md, docs/codebase-audit.md, docs/PR_REVIEW_REQUEST.md,
# docs/product/** (9 files)
```

No new path-scoped instruction files are being created — the existing single one plus `AGENTS.md`
plus the path-local reference docs (DESIGN_TOKENS, ACCESSIBILITY, SEO_STRATEGY) already cover the
needed scopes. Adding more would reintroduce drift.

---

## Stripped patterns — what goes away and why

Every rule below is being removed or sharply softened. One line per reason.

1. **"Do exactly what is requested. Do not add unrelated features."** (`docs/CLAUDE.md`
   non-negotiables) — blocks informed initiative; agents refuse obvious adjacent fixes.
2. **"Keep PRs appropriately scoped and task-specific (single feature or tightly related
   fixes/docs)."** (`AGENTS.md`) — forces tiny diffs regardless of task; replaced by "scope matches
   the task; no cosmetic churn".
3. **"Prefer the smallest correct change over broad rewrites."** / **"Do not do broad repo audits
   unless explicitly asked."** (`AGENTS.md` + `docs/CLAUDE.md`) — punishes exactly the
   coherent-change behavior the user wants; replaced by "match scope to the task; big coherent
   changes welcome when justified".
4. **"If a page-specific file is enough, do not introduce a new system."** —
   conservative-by-default; encourages copy-paste over useful abstraction.
5. **"Before acting on ANY new prompt or channel, read `docs/plans/README.md` first, then
   `docs/REVAMP_PLAN.md`."** (`AGENTS.md` + `CLAUDE.md` + `docs/plans/README.md`) —
   mandatory-ceremony reading; agents burn the context window and still may not match their task.
6. **"If a requested task is not already represented in `REVAMP_PLAN.md`, stop and reconcile it
   before writing code."** — forces permission-seeking for any novel task.
7. **"Every `report_progress` call must update the 'Progress log' and the relevant track checklists
   in this file, in the same commit as the code change."** — mandates updating a 1,656-line
   mega-plan on every commit.
8. **"One PR, many tiny commits. Each commit is single-purpose and reversible with `git revert`."**
   plus the 18-row "commit bucket" taxonomy (`tokens` / `layout` / `spacing` / … / `safe-dom`) —
   ceremony without safety; forces mechanical splits that make bisecting no easier.
9. **"Start from `main` only unless explicitly told otherwise."** + "Before making changes, check
   whether the current branch is behind `main`." + "Do not open a PR until the branch is up to date
   with `main`." — redundant with normal PR discipline; cluttered the top of `AGENTS.md`.
10. **`<role>` / `<non_negotiables>` / `<mode_rules>` / `<just_in_time_context>` /
    `<behavior_rules>` XML-tag blocks** (`docs/CLAUDE.md`) — 170 lines of pseudo-prompt-injection
    framing; the content duplicates `AGENTS.md`.
11. **"BUILD mode / DEBUG mode / REVIEW mode / PLAN mode — use one mode at a time."**
    (`docs/CLAUDE.md`) — mode ceremony unused by any caller; real agents already distinguish review
    vs. build from context.
12. **"Do not re-open already completed work unless a regression or mismatch is found."** — restates
    "don't break things".
13. **Response-format templates** ("1. Task understanding 2. Findings from file inspection 3.
    Plan 4. Changes made 5. Verification 6. Remaining risks") duplicated in three files — one
    reporting format in `AGENTS.md` is enough.
14. **Repeated "never say 'done' / 'fixed' without verifying"** (five+ occurrences across files) —
    kept once in `AGENTS.md` under Done criteria with _Why:_.
15. **Wave-1 priority matrix items already marked `✅ done`** (`docs/plans/README.md` rows 1–3, 5–6,
    9–10, 11–12) — still tracked as if live; being pruned or labelled historical.
16. **"30-phase" + "20-phase" + "10 rounds of 6–8 commits" + "80–120 commits total"** estimates
    (`REVAMP_PLAN.md` §2) — fantasy-roadmap precision; softened to "rounds of related commits".
17. **Duplicated "Governing constraints (from AGENTS.md / CLAUDE.md)" block** in both proposal files
    — pure drift surface; now replaced by a one-line pointer.
18. **15 "moved — see master plan" pointer stubs under `docs/`** — zero informational value; the
    master plan already hosts the content and the external links they "preserve" point at moved
    anchors anyway.

---

## Preserved guardrails — what stays, as product truth

Kept in `AGENTS.md` under **Product-trust guardrails**, each with a one-line _Why:_.

1. Spot/reference prices must never be blurred with retail or jewelry prices. _Why:_ the entire
   site's credibility rests on this distinction.
2. Cached, fallback, estimated, delayed, or derived values must be labelled with source and
   timestamp. _Why:_ same.
3. Freshness labels, disclaimers, methodology notes are product elements, not optional decoration.
   _Why:_ removing them re-introduces trust risk.
4. SEO integrity: no silent changes to canonical URLs, `robots.txt`, sitemap structure, `og:*` /
   `twitter:*` tags, or `CNAME`. _Why:_ measurable ranking regression risk.
5. Static multi-page architecture stays static unless the user asks for migration. _Why:_ SPA
   migration is a separate, owner-approved program.
6. Bilingual EN/AR parity — copy ships in both languages. _Why:_ tests enforce it; half-landed copy
   is a visible bug.
7. No secrets in git; GitHub Secrets only; never echo secrets into logs. _Why:_ non-negotiable for
   any public repo.
8. PR-only — no direct commits to `main`, no force-push. _Why:_ protected-branch workflow.
9. Hourly X-post Actions workflow is production; changes require a plan entry. _Why:_ it auto-posts
   to a public channel every hour — breakage is public.
10. Honesty about verification — separate verified from assumed; no fake test/completion claims.
    _Why:_ the one guardrail that makes every other claim in a PR body legible.
11. DOM-safety baseline (`scripts/node/check-unsafe-dom.js`) must not regress. _Why:_ the repo's
    only XSS regression guard; CI enforces it anyway.

The AED peg (3.6725) and the "estimate" framing on pricing pages are product-level concerns kept in
`REVAMP_PLAN.md` §0–§0.2, not general agent rules.

---

## Plan / roadmap cleanup log

- `docs/REVAMP_PLAN.md` top-matter: the 34-line "mandatory session protocol" / "last updated" /
  "master consolidation index" block is being replaced with a short "what this file is + how to
  update it" paragraph. The plan content itself (tracks A–J, §19 decisions, §22 production tracks,
  §25 issues/risks, §28 backlog) stays. The §0.3 "engineering non-negotiables" block is deleted — it
  duplicated `AGENTS.md`.
- `docs/plans/README.md`: the 🛑 block and the "no work is to be executed from a raw prompt" rule
  are removed. The priority matrix and pending-proposals table remain. Wave-1 rows already `✅ done`
  are collapsed into a single "historical" note; remaining work stays visible.
- Proposal files: the duplicated "Governing constraints from `AGENTS.md` / `CLAUDE.md`" block in
  both is replaced by a single pointer line to `AGENTS.md`. The raw proposal body stays intact for
  archaeology.
- Pointer stubs under `docs/` and `docs/product/`: deleted. External links that target those paths
  will 404; this is acceptable — every stub itself says "content has moved to `REVAMP_PLAN.md` §N"
  and any agent / reader following one of them gets redirected in the first place. `docs/README.md`
  gains one line noting the consolidation happened.

---

## Risk register

| Risk                                                                                                       | Note                                                                                                                                       |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| External bookmarks to deleted `docs/**` pointer stubs will 404.                                            | Accepted. Every stub was itself a redirect notice; real content lives in `REVAMP_PLAN.md`. Linked from the slimmed `docs/README.md`.       |
| Removing "check branch is up to date with `main`" may surprise a contributor.                              | Low — GitHub's merge UI enforces this on protected branches anyway.                                                                        |
| Softening "do not do broad repo audits unless explicitly asked" may produce unwanted sprawl in future PRs. | Countered by the Autonomy Contract's explicit "don't pad diffs; don't produce cosmetic churn" guidance plus the intact product guardrails. |
| `REVAMP_PLAN.md` checklists that currently rely on commit-SHA annotations may lose discipline.             | Low — the checklists themselves are kept; only the ceremonial protocol around them is removed.                                             |
| `.github/copilot-instructions.md` truncation at 4,000 chars.                                               | New file will be well under the limit (~1.5 kB) and measured before merge.                                                                 |

No hard-stop conditions were hit: total deleted lines across pointer stubs + duplicated Claude rules
is ≈ 380, well under the 500-line threshold, and every deletion has a 1:1 home in `AGENTS.md` or
`REVAMP_PLAN.md`.

---

## Phase 4 verification plan

- `npm install`
- `npm test`
- `npm run lint`
- `npm run validate`
- `npm run build`
- `git diff --stat` audit — confirm no changes outside the inventoried set.

Results go in the PR body.
