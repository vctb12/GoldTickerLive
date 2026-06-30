# Agent workflows

Reusable multi-agent [Workflow](https://docs.claude.com/claude-code) scripts tailored to this repo's
recurring, trust-critical work. Invoke from Claude Code **at the repo root** with the `Workflow`
tool.

## Available

| Workflow             | What it does                                                                                                                                                                                                                                                  | Invoke                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **`pre-pr-review`**  | Runs the repo verification suite (`validate` + `test` + `lint`), then fans out adversarial reviewers over the branch diff across **correctness / trust-integrity / SEO / i18n-RTL-a11y**, verifies each finding before reporting, and returns a **go/no-go**. | `Workflow({ name: 'pre-pr-review' })` (or `{ name, args: 'origin/main' }` to set the base) |
| **`audit-reverify`** | Classifies a list of audit/plan findings **OPEN / PARTIAL / FIXED / NOT_A_BUG** against _current_ code with `file:line` evidence + a minimal safe fix. Stops you shipping no-op PRs for already-fixed items.                                                  | `Workflow({ name: 'audit-reverify' })` or `{ name, args: [{key,title,focus}, …] }`         |

Both are pure JavaScript using the Workflow DSL (`agent` / `parallel` / `pipeline` / `phase` /
`log`). They spawn read-only sub-agents; `pre-pr-review` runs the repo's own npm checks via a
sub-agent (no mutation of tracked files).

### Why these exist

This repo's bar is **trust + clarity** (spot vs retail, AED peg 3.6725, freshness labelling, EN/AR
parity, SEO governance). These two workflows encode the loop that's worked well here:

1. **Verify before you fix** — `audit-reverify` (the repo evolves fast; many "open" items are
   already fixed).
2. **Verify before you ship** — `pre-pr-review` (run the suite + an adversarial review, get a
   go/no-go) before every PR.

## Routine (optional, recommended)

A daily **PR + green-main babysitter** keeps the PR queue and `main` test health visible. To enable
it, run the `/schedule` skill in Claude Code (or ask Claude to "schedule a daily PR babysitter"),
with a prompt like:

> Check open PRs on vctb12/GoldTickerLive: for each, report CI status and whether it's mergeable.
> Then run `npm test` on `main` and report if the suite is red (with failing test names). Summarize
> as a short digest. Don't change code.

Suggested cadence: weekday mornings (`0 8 * * 1-5`). Delete it any time with the schedule skill /
`CronDelete`.
