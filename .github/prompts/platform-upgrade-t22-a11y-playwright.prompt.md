---
mode: agent
description: T2.2 — Add @axe-core/playwright scans to e2e for key pages (wcag2a/2aa/21aa).
related_instructions:
  - AGENTS.md
  - docs/ACCESSIBILITY.md
  - docs/plans/2026-06-09_platform-upgrade-program.md
related_skills:
  - mobile-ux-review
---

# T2.2 — axe-core in Playwright

Before reviewing or editing anything, read and follow:

- [`AGENTS.md`](../../AGENTS.md)
- [`.cursor/rules/non-negotiable-rules.mdc`](../../.cursor/rules/non-negotiable-rules.mdc)
- [`.cursor/rules/pricing-trust.mdc`](../../.cursor/rules/pricing-trust.mdc)
- [`.cursor/rules/bilingual-content.mdc`](../../.cursor/rules/bilingual-content.mdc)
- [`.cursor/rules/seo-structure.mdc`](../../.cursor/rules/seo-structure.mdc)

## Goal

Add `@axe-core/playwright` to scan: home, tracker, calculator, one country page. Tags: `wcag2a`, `wcag2aa`, `wcag21aa`.

## Steps

1. Check GitHub Advisory DB before adding dependency.
2. `npm install -D @axe-core/playwright`
3. New spec: `tests/e2e/a11y.spec.js`
4. Wire into CI e2e job if runtime OK; else document `npm run test:playwright -- tests/e2e/a11y.spec.js`
5. Fix violations OR document in `reports/a11y-audit.md` — no blanket `disableRules` without justification.

## Verify

`npx playwright test tests/e2e/a11y.spec.js`, `npm test`, `npm run lint`. Note: complements `pa11y-ci` and `check-basic-a11y.js`, does not replace manual RTL/VoiceOver checks.
