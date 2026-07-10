# Phase 01 — Regression safety net

> One phase = one or more PRs. Paste the PROMPT block into Claude Code in the GoldTickerLive repo.
> Guardrail: stay on the static Vite stack — no framework migration, SSR, or build-tool swap.

## Phase 1 — Regression safety net

- **Maps to:** "preserve existing working behavior" guardrail.
- **Branch:** `phase01-baseline-tests` · **PR:** Add smoke + price-math + freshness tests

```
Read docs/REPO-MAP.md and the price/FX/freshness modules. WITHOUT changing app behavior, add a lightweight test harness using the project's existing tooling (or Vitest if none exists) covering: (1) the core price formula (XAU/USD ÷ 31.1035 × karat/24 × FX), asserting 24K/22K/21K/18K and the AED peg 3.6725 produce exact known values; (2) freshness-state resolution (live/delayed/cached/stale/fallback/unavailable) given timestamps; (3) a DOM smoke test that the homepage shell (nav, ticker, footer) mounts. Add an npm script `test`. Do not refactor app code; only add tests + minimal exports if needed. Open PR phase01-baseline-tests with coverage notes. Stay on the current static stack; no framework migration.
```

- **Accept:** `npm run build` + `npm test` green; tests fail if the peg or formula is altered.
