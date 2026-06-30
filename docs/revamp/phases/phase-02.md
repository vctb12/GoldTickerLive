# Phase 02 — CI pipeline (build + lint + test on PR)

> One phase = one or more PRs. Paste the PROMPT block into Claude Code in the GoldTickerLive repo.
> Guardrail: stay on the static Vite stack — no framework migration, SSR, or build-tool swap.

## Phase 2 — CI pipeline (build + lint + test on PR)
- **Branch:** `phase02-ci` · **PR:** GitHub Actions CI for PRs
```
Read .github/workflows. Add a CI workflow that runs install, build, lint, and the Phase 1 tests on every PR and on main. Do not touch the existing hourly gold-price fetch workflow. Cache node_modules. Fail the PR on build/lint/test errors. Open PR phase02-ci. No app behavior changes; static stack only.
```
- **Accept:** CI runs and is required; existing price-fetch cron untouched.
