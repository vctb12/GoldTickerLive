# Phase 49 — Full bilingual regression & QA gate

> One phase = one or more PRs. Paste the PROMPT block into Claude Code in the GoldTickerLive repo.
> Guardrail: stay on the static Vite stack — no framework migration, SSR, or build-tool swap.

## Phase 49 — Full bilingual regression & QA gate

- **Branch:** `phase49-regression` · **PR:** Cross-browser/device + a11y/SEO regression

```
Run a full regression across homepage, calculator, methodology, 3 country pages, EN + AR, in Chromium/Firefox/WebKit at 390/768/1024/1440: verify nav (no overlap), freshness labels (no "live" on stale), calculator math (peg 3.6725 exact), RTL correctness, contrast (AA), CLS <0.1, valid hreflang/canonical/JSON-LD, and no console/network errors (favicon fixed). Promote the Phase 4 budgets to BLOCKING. File issues for any miss. Open PR phase49-regression with the full report. Static stack only.
```

- **Accept:** All checks pass; quality budgets now block PRs.
