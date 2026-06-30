# Phase 35 — Reduced motion & animation hygiene

> One phase = one or more PRs. Paste the PROMPT block into Claude Code in the GoldTickerLive repo.
> Guardrail: stay on the static Vite stack — no framework migration, SSR, or build-tool swap.

## Phase 35 — Reduced motion & animation hygiene
- **Branch:** `phase35-reduced-motion` · **PR:** Respect prefers-reduced-motion
```
The site uses reveal-on-scroll, count-up, price-motion, freshness-pulse. Gate all non-essential animation behind prefers-reduced-motion: reduce (no count-up, no pulsing, instant reveals) while keeping content fully visible. Read the animation modules. Open PR phase35-reduced-motion. Static stack only.
```
- **Accept:** With reduced-motion on, no animations; content fully shown.
