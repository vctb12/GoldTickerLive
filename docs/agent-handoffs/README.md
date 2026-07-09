# Agent handoffs

This directory holds **owner-facing handoff notes** written by autonomous / overnight agent runs.

## Why this exists

An overnight agent works on an isolated branch and **never merges or deploys**. When it finishes a
phase it leaves a short, self-contained note here so the owner can review and act the next morning
without reconstructing context from chat history or a long diff.

## What a handoff note contains

Each note is a small Markdown file. For a phase that produced (or is ready to produce) a PR, use the
ready-to-paste PR shape:

- **Title** — the PR title.
- **What changed** — bullet summary of the diff.
- **Why it matters** — user/trust/SEO rationale.
- **Pages affected** — exact pages/URLs, or "none — tooling & docs".
- **Tests run** — real commands + real results (or "Script not present"). Never faked.
- **Risks** — what could go wrong; blast radius.
- **Rollback plan** — how to undo (usually: close PR / revert branch — nothing is merged).
- **What still needs owner approval** — owner-gated items the agent deliberately did not do.

## Naming convention

`<phase-slug>-pr.md` for a PR handoff (e.g. `setup-overnight-agent-automation-pr.md`), or
`<phase-slug>-notes.md` for a non-PR summary. Keep one file per phase; append a dated section if a
phase is revisited.

## Rules

- Handoff notes are **records**, not instructions to the site. Never put secrets, tokens, or real
  credentials here.
- Keep them honest: separate what was verified from what was assumed, exactly as `AGENTS.md` PR
  bodies require (What / Why / How / Proof / Risks).
