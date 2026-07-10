# Phase 04 — Lighthouse + a11y CI budget (report-only)

> One phase = one or more PRs. Paste the PROMPT block into Claude Code in the GoldTickerLive repo.
> Guardrail: stay on the static Vite stack — no framework migration, SSR, or build-tool swap.

## Phase 4 — Lighthouse + a11y CI budget (report-only)

- **Branch:** `phase04-quality-budgets` · **PR:** Lighthouse CI + axe report (non-blocking)

```
Add Lighthouse CI and axe-core accessibility checks that run against the built site for homepage, /calculator, /methodology, and one country page, in EN and AR. Output reports as CI artifacts; set them report-only (non-blocking) for now with target budgets (Perf ≥85 mobile, A11y ≥95, CLS <0.1). Do not change app code. Open PR phase04-quality-budgets. Static stack only.
```

- **Accept:** Reports generated as artifacts; baselines recorded in PR.
