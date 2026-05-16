---
name: gold-ticker-live-audit
description: Use for any broad audit, planning, PR-prep, or repo-understanding task. Generates a coherent picture of the product across pricing truth, frontend/mobile, SEO, automation, security, and release readiness.
when_to_use:
  - Onboarding to the repo for the first time in a session
  - Planning a multi-surface change (e.g. revamp, redesign, expansion)
  - Pre-PR sanity sweep before opening a draft
  - Audit-only PRs that produce a report instead of code
related_files:
  - AGENTS.md
  - .github/copilot-instructions.md
  - .github/instructions/*.instructions.md
  - docs/AI_AGENT_OPERATING_SYSTEM.md
  - docs/REVAMP_PLAN.md
related_prompts:
  - .github/prompts/pr-review.prompt.md
  - .github/prompts/release-readiness.prompt.md
---

# Skill: Gold Ticker Live Audit

The audit skill is the entry point for understanding the product, planning a change, or reviewing
a PR. It produces a coherent picture across all the surfaces that matter at Gold Ticker Live.

## When to use

- Starting a session with a vague or large prompt ("revamp UI", "improve SEO", "tracker overhaul")
- Auditing before opening a draft PR with a plan file
- Pre-merge sanity sweep on a non-trivial PR
- Triaging a regression spotted in production

## Project snapshot to load first

| What                              | Where                                                  |
| --------------------------------- | ------------------------------------------------------ |
| Product identity                  | `AGENTS.md` §1, `.github/copilot-instructions.md` §1   |
| Pricing rules                     | `.github/instructions/gold-pricing.instructions.md`    |
| Visual identity / tokens          | `styles/global.css`, `docs/DESIGN_TOKENS.md`           |
| Tracker state                     | `docs/tracker-state.md`                                |
| Active revamp tracks              | `docs/REVAMP_PLAN.md`                                  |
| Recent commits / known issues     | `git log --oneline -30`, `docs/REPO_AUDIT.md`          |
| Workflow health                   | `.github/workflows/`, `docs/X_AUTOMATION_OBSERVABILITY.md` |

## Required repo inspection (in this order)

1. `AGENTS.md` (full read)
2. `.github/copilot-instructions.md` (full read)
3. The relevant `.github/instructions/*.instructions.md` for the surface(s) you're touching
4. The page(s) you'll edit: HTML + matching `styles/pages/*.css` + matching `src/pages/*.js`
5. `docs/REVAMP_PLAN.md` — is your change already on the plan?
6. `package.json` scripts — know what `validate` / `quality` / `test` actually run

## Workflow

1. **Restate the goal in one sentence.** If it's vague, expand it to a measurable spec.
2. **Identify surfaces touched.** Map to `.github/instructions/*.instructions.md`.
3. **Run the relevant checklists** below.
4. **If the task is >2h of work**, write a plan file under `docs/plans/YYYY-MM-DD_<slug>.md` and
   open a draft PR with just the plan.
5. **Implement in coherent commits**, one surface at a time.
6. **Verify** with the commands from `AGENTS.md` §2 + `testing-qa.instructions.md`.
7. **Report** using the format in §13 of `.github/copilot-instructions.md`.

## Checklists in this skill

- [`checklists/preflight.md`](./checklists/preflight.md) — before touching any code
- [`checklists/pricing-truth.md`](./checklists/pricing-truth.md) — formula / freshness / labels
- [`checklists/frontend-mobile.md`](./checklists/frontend-mobile.md) — mobile + RTL + tokens
- [`checklists/seo-governance.md`](./checklists/seo-governance.md) — canonical + sitemap + noindex
- [`checklists/automation-safety.md`](./checklists/automation-safety.md) — workflows + X posting
- [`checklists/release-readiness.md`](./checklists/release-readiness.md) — merge gate

## Common mistakes (from prior sessions)

- Reading the README and skipping `AGENTS.md`.
- Treating the repo like a generic static site (ignoring pricing truth + freshness labels).
- Shipping a "tracker tweak" that strips the freshness pill.
- Editing `sitemap.xml` directly (next build wipes it).
- Hand-coding karat factors outside `src/config/karats.js`.
- Forgetting to delete `playwright-report/` before `npm test` / `npm run validate`.
- Treating `post_gold.yml` as a draft workflow when it's live in production.
- Claiming "tests pass" without naming the command and the count.

## Final report template (audit-only PR)

```md
# Audit Report — <scope>

## Summary
<2–4 sentence executive view>

## Surfaces inspected
- <surface>: <file paths> → <state>

## Findings
### Blocking
- <issue>: <evidence> → <recommended action>

### Important non-blocking
- ...

### Nice-to-have
- ...

## Recommended next PR(s)
- <title> — <scope> — <expected effort>

## Verification run
- `npm run lint` → PASS/FAIL
- `npm test` → PASS/FAIL, N tests
- `npm run validate` → PASS/FAIL
- Manual: <viewports, RTL spot, screenshots>

## Risks
- <known unknowns>
```
