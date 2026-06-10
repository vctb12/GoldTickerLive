---
mode: agent
description: T2.1 — Lighthouse CI budgets + tighten lighthouserc assertions from baseline.
related_instructions:
  - AGENTS.md
  - docs/plans/2026-06-09_platform-upgrade-program.md
  - docs/PERFORMANCE.md
---

# T2.1 — Lighthouse CI budget gate

Before reviewing or editing anything, read and follow:

- [`AGENTS.md`](../../AGENTS.md)
- [`.cursor/rules/non-negotiable-rules.mdc`](../../.cursor/rules/non-negotiable-rules.mdc)
- [`.cursor/rules/pricing-trust.mdc`](../../.cursor/rules/pricing-trust.mdc)
- [`.cursor/rules/bilingual-content.mdc`](../../.cursor/rules/bilingual-content.mdc)
- [`.cursor/rules/seo-structure.mdc`](../../.cursor/rules/seo-structure.mdc)

## Current state

- `.github/workflows/lighthouse.yml` — informational, PR + workflow_dispatch
- `lighthouserc.json` — warn thresholds 0.75–0.9
- **Missing:** `budget.json`, merge-gate enforcement

## Goal

1. Capture baseline from `phase0-lighthouse-baseline.yml` or local `npm run build && npx @lhci/cli autorun`.
2. Add **`budget.json`** with resource-size budgets from current `dist/`.
3. Tighten `lighthouserc.json` — recommend: error on SEO/a11y/best-practices first; performance warn until stable.
4. URLs: `/`, `/tracker.html`, `/calculator.html`, `/shops.html`, one country page.

## Constraints

- Do not block all PRs on day one — document threshold rationale in PR.
- Optional: test fail by temporarily bloating an asset, then revert.

## Verify

`workflow_dispatch` on branch; `npm run build`. Update T2.1 row in upgrade program.
