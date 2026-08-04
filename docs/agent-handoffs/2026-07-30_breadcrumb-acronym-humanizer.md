# Owner Handoff — Phase 41 Breadcrumb Acronym Humanizer

## Task selected

Preserve the `UAE` acronym in build-time `BreadcrumbList` schema when the URL segment is `/uae`.

## Why this task

The documented Phase 41 candidate was reproducible: the pre-fix helper emitted `Uae` for
`generateBreadcrumbs('/uae', ...)`. This was a small SEO/content- integrity fix with no active PR
collision, no pricing or provider impact, and a deterministic test seam.

## Delivery

- Branch: `codex/phase-41-breadcrumb-humanizer`
- Commit: `845db20590` (`fix: preserve UAE acronym in breadcrumb schema`)
- Draft PR: [#717](https://github.com/vctb12/GoldTickerLive/pull/717)
- Merge performed: No
- Files changed: `scripts/node/inject-schema.js`, `tests/schema-breadcrumbs.test.js`,
  `docs/plans/2026-07-30_breadcrumb-acronym-humanizer.md`, and the canonical tracker.

## Verification

Verified: focused regression 2/2; lint; build; schema injector check; internal link check; basic
accessibility; unsafe-DOM guard; local browser EN/AR schema presence with `ltr`/`rtl`; zero local
browser console errors; clean focused diff.

Baseline/environment limitations: full unit suite retains two pre-existing failures (stale Dubai
redirect expectation and network-blocked UAE history audit); validation stops on stale
`reports/seo/inventory.json`; content lint reports the existing methodology EN/AR block imbalance;
Playwright parity is blocked by the missing Chromium executable; production URL access was
unavailable.

## Remaining risk

Low. Only the structured-data label for the exact `uae` segment changes. URL, canonical, visible
runtime breadcrumb, pricing, freshness, provider, workflow, and dependency behavior are unchanged.

## Owner decisions required

None for this phase. Owner review/merge of PR #717 remains required.

## Recommended next safe task

Reconcile and refresh the stale committed SEO reports (`reports/seo/inventory.json` and
`reports/seo/governance.json`) as a separate maintenance phase after checking whether current main's
automation/data churn is the intended source of drift. Do not bundle that report refresh into PR
#717.

## Ready-to-paste follow-up prompt

Continue GoldTickerLive from current `origin/main` and the state of draft PR #717. Re-read
`AGENTS.md`, `PLAN.md`, `PROGRESS.md`, and `docs/AGENT_MASTER_TRACKER.md`; inspect current GitHub PR
reality and do not duplicate or merge PR #717. First verify whether the stale committed SEO reports
(`reports/seo/inventory.json` and `reports/seo/governance.json`) are caused by current main's
generated-data churn. If that is a safe, non-owner-gated, PR-sized maintenance fix, write a new
dated plan, refresh only the canonical reports, run the applicable gates, update the tracker and
handoff, and open one draft PR. Never merge, deploy, force-push, or modify protected
pricing/provider/ workflow/secrets surfaces.
