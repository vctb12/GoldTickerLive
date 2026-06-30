# Phase 30 — Layout-shift (CLS) hardening

> One phase = one or more PRs. Paste the PROMPT block into Claude Code in the GoldTickerLive repo.
> Guardrail: stay on the static Vite stack — no framework migration, SSR, or build-tool swap.

## Phase 30 — Layout-shift (CLS) hardening
- **Branch:** `phase30-cls` · **PR:** Reserve space for async data
```
Identify CLS sources: price values arriving after first paint, the chart loading, the quick-convert number, country cards. Reserve fixed space / use skeletons (the project already has skeleton modules) so numbers swap in without shifting layout. Target CLS <0.1 on homepage, calculator, a country page (per Phase 4 reports). Open PR phase30-cls with before/after CLS numbers. Static stack only.
```
- **Accept:** CLS <0.1 on the three pages; values swap without shift.

---
