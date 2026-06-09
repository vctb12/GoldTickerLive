---
mode: agent
description: Comprehensive PR review for Gold Ticker Live. Audits pricing truth, freshness, SEO, security, accessibility, automation, mobile/RTL, and verification quality.
related_skills:
  - gold-ticker-live-audit
  - security-review
related_instructions:
  - .github/instructions/gold-pricing.instructions.md
  - .github/instructions/security.instructions.md
  - .github/instructions/seo.instructions.md
---

# Prompt: PR Review

Before reviewing or editing anything, read and follow:

- [`AGENTS.md`](../../AGENTS.md)
- [`.cursor/rules/non-negotiable-rules.mdc`](../../.cursor/rules/non-negotiable-rules.mdc)
- [`.cursor/rules/pricing-trust.mdc`](../../.cursor/rules/pricing-trust.mdc)
- [`.cursor/rules/bilingual-content.mdc`](../../.cursor/rules/bilingual-content.mdc)
- [`.cursor/rules/seo-structure.mdc`](../../.cursor/rules/seo-structure.mdc)


You are reviewing a PR on `vctb12/GoldTickerLive` (production site
<https://goldtickerlive.com/>). Apply the Gold Ticker Live charter (`AGENTS.md`) and the
operating system in `.github/`. Be substantive, not ceremonial.

## Goal

Produce a review that protects pricing truth, EN/AR parity, SEO integrity, security, automation
safety, and mobile UX — while being honest about what was verified vs. assumed.

## Cursor Automations (already on PRs)

If these Cloud Automations are enabled on the repo, **do not duplicate** their standing checks:

- **Gold Integrity Agent** — pricing math, freshness wording, reference vs retail
- **Bilingual Consistency Agent** — EN/AR semantic parity
- **SERP Structure Agent** — titles, canonicals, hreflang, schema

Focus this interactive review on: **security**, **accessibility**, **mobile/RTL layout**,
**verification honesty** (what CI ran vs assumed), **workflow safety**, and **integration risks**
not covered by automations. Registry: `docs/CURSOR_AUTOMATIONS_REGISTRY.md`.

## Inputs

- The PR diff
- The PR description's What / Why / How / Proof / Risks
- Any linked plan file under `docs/plans/`
- Workflow runs on the PR (via GitHub MCP tools)

## Required inspection

For each changed file, decide which `.github/instructions/*.instructions.md` apply via `applyTo`,
and read those instructions. Then run the relevant skill checklists from `.github/skills/`.

Specifically check:

- **Pricing**: AED peg unchanged; troy-oz unchanged; karat factors from `src/config/karats.js`;
  freshness label present + correct state; reference vs. retail wording explicit; methodology
  link present.
- **EN/AR parity**: every user-visible string change ships in both languages via
  `translations.js`; AR variant tested at 360 px RTL.
- **Mobile**: 360 / 390 / 430 viewports; touch targets ≥ 44×44; sticky controls don't occlude
  content; tables → cards on small screens.
- **SEO**: canonical points to `goldtickerlive.com`; sitemap regenerated (not hand-edited);
  noindex policy enforced (`seo-governance.js`); hreflang pairs.
- **Security**: no secrets in diff; service-role key not in browser bundle; new routes have auth +
  rate limit + input validation.
- **Accessibility**: focus rings; semantic HTML; ARIA where needed only; reduced motion respected.
- **Automation**: workflow changes tested with `dry_run: true`; permissions minimal; no
  `set -x` near secrets.
- **Tests**: changed logic has a test; `npm test` / `npm run validate` reported honestly.
- **Performance**: no significant regression in LCP / CLS / TBT for changed pages.
- **DOM safety**: `check-unsafe-dom` baseline not regressing.
- **Dead code**: any imports / exports / files orphaned by the diff?

## Permission to be ambitious

If you find architectural issues that the PR almost touches, flag them as "important non-blocking"
or as a recommended follow-up PR. Don't be timid — if a redesign is the right answer, say so.

## Return format

Follow `AGENTS.md` output expectations and review priorities. Canonical template:
[`_output-format.md`](./_output-format.md).

```md
## Verdict
<approve | approve with comments | request changes | block>

## Blocking issues
### block — <title>
- **File/page:** `path:line`
- **Issue:** …
- **Impact:** trust / pricing / SEO / bilingual / UX
- **Exact fix:** …
- **Repeat pattern:** yes/no — …

## Important non-blocking
(same fields; severity high or medium)

## Nice-to-have
(low severity, same fields)

## Files requiring manual review
- <file> — <reason>

## Verification recommended before merge
- commands actually needed for this diff

## Merge recommendation
<merge now | merge after fixes | hold for owner review>

## Follow-up PRs to consider
- <title> — <scope>
```

Do not paste the entire diff back. Cite specific files and lines.
