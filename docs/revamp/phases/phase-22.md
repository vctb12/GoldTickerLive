# Phase 22 — Stale/unavailable visual states polish

> One phase = one or more PRs. Paste the PROMPT block into Claude Code in the GoldTickerLive repo.
> Guardrail: stay on the static Vite stack — no framework migration, SSR, or build-tool swap.

## Phase 22 — Stale/unavailable visual states polish
- **Branch:** `phase22-degraded-states` · **PR:** Clear degraded-state UI
```
Harden the degraded states: when data is Stale/Fallback/Unavailable, show the labeled state, age, and an em-dash for missing numbers (already done on methodology — generalize it) with an accessible, non-alarming style. Ensure no surface ever shows a stale number styled as live. Add tests. Open PR phase22-degraded-states. Static stack only.
```
- **Accept:** All surfaces degrade gracefully and identically; tests assert no "live" styling on stale.

---
