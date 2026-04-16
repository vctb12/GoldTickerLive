# AGENTS.md

## Project

Gold-Prices website

Static, multi-page gold-prices website with tools, country/city/market pages, educational pages, and
a shops directory.

## How Codex should work in this repo

- Start from `main` only unless explicitly told otherwise.
- Before making changes, check whether the current branch is behind `main`.
- If the branch is behind `main`, sync with `main` before editing.
- Keep PRs wide and task-specific.
- Before opening a PR, compare against base branch `main` and check for merge-conflict risk.
- If there is conflict risk with `main`, stop and report it before opening the PR.
- Do not open a PR until the branch is up to date with `main`.

## Workflow rules

- Read the relevant files first before suggesting or making changes.
- Restate the task briefly.
- Identify the exact impact surface.
- Propose the smallest correct plan.
- Then implement.
- Do not do broad repo audits unless explicitly asked.
- Do not re-open already completed work unless a regression or mismatch is found.
- Do not add unrelated features, opportunistic cleanup, or architecture changes unless explicitly
  asked.

## Architecture preferences

- Preserve the static / multi-page architecture unless explicitly asked to change it.
- Prefer simple, explicit HTML/CSS/JS solutions.
- Reuse existing patterns and components where possible.
- Avoid over-engineering.
- Prefer the smallest correct change over broad rewrites.
- If a page-specific file is enough, do not introduce a new system.

## Product priorities

Priority order:

1. Trust and correctness
2. Working UX
3. Mobile usability
4. SEO and internal linking
5. Performance
6. Visual polish
7. New features

## Gold-Prices product rules

- Always distinguish spot/reference prices from retail/jewelry prices.
- Clearly label estimated, derived, delayed, fallback, or cached values.
- Do not present market-area listings as if they are verified individual stores unless the data
  supports that.
- Trust banners, freshness labels, disclaimers, methodology, and internal linking are core product
  elements.
- Avoid fake completeness, misleading stats, and vague trust wording.
- For shops and market discovery flows, prioritize clarity, shareability, and next-step actions.

## Frontend / UX rules

- Avoid generic AI-looking design.
- Prefer clean, premium, trustworthy UI with strong hierarchy and good spacing.
- Keep mobile behavior explicit and usable at small widths.
- Accessibility matters: focus states, keyboard access, contrast, semantic structure, aria labels
  where needed.
- If a control is unfinished, disable or hide it rather than leaving it silently broken.

## SEO rules

- Preserve or improve:
  - unique titles
  - meta descriptions
  - canonicals
  - structured data where appropriate
  - sitemap correctness
  - strong internal links
- Do not create duplicate or conflicting canonical logic.
- Do not add schema that overstates what the page actually is.

## Build / test / verification

Before claiming work is complete:

- run the most relevant checks available for the task
- verify changed flows as far as possible
- report what was actually verified vs not verified
- mention risks or regressions clearly

Never say “fixed” or “done” unless you verified it.

Use this reporting format in final responses:

1. Task understanding
2. Files inspected
3. Plan
4. Changes made
5. Verification
6. Remaining risks

## Repo-specific guidance

High-priority areas in this repo:

- `shops.html`, `src/pages/shops.js`, `styles/pages/shops.css`
- `tracker.html`, `src/pages/tracker-pro.js`, `src/tracker/`
- `src/components/nav.js` and related shared UI files
- country / city / market pages (under `countries/`)
- metadata, schema, sitemap, internal linking

When working on shops:

- prioritize state behavior, deep-linking, trust framing, mobile filtering, and useful next-step
  CTAs

When working on tracker:

- prioritize clarity, reliability, onboarding, and avoiding overwhelming first-time users

## Do-not rules

- Do not change branch strategy on your own.
- Do not force-push unless explicitly asked.
- Do not assume the live site matches the latest repo state without checking.
- Do not claim a migration or architecture change is complete unless it is clearly present and
  verified.
