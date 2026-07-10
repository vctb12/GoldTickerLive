# Phase 37 — Bundle consolidation

> One phase = one or more PRs. Paste the PROMPT block into Claude Code in the GoldTickerLive repo.
> Guardrail: stay on the static Vite stack — no framework migration, SSR, or build-tool swap.

## Phase 37 — Bundle consolidation

- **Maps to:** P2-2 (~30+ JS chunks).
- **Branch:** `phase37-bundle` · **PR:** Consolidate critical-path JS

```
The homepage loads ~30+ small JS modules plus an inline data: module. Review the Vite chunking config and consolidate critical-path modules (shell: nav/footer/ticker/spotBar + price/freshness) into fewer, cache-efficient chunks while keeping non-critical features (chart, SLA panel, exports) lazy-loaded. Measure requests + transfer before/after. Do not change behavior. Open PR phase37-bundle. Stay on Vite; no build-tool swap.
```

- **Accept:** Fewer critical requests, equal behavior, Perf score not lower.
