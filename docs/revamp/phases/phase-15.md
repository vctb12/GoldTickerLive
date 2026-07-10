# Phase 15 — Freshness label thresholds (fix "Live" on stale)

> One phase = one or more PRs. Paste the PROMPT block into Claude Code in the GoldTickerLive repo.
> Guardrail: stay on the static Vite stack — no framework migration, SSR, or build-tool swap.

## Phase 15 — Freshness label thresholds (fix "Live" on stale)

- **Maps to:** P1-1 (9-min-old shown "Live").
- **Branch:** `phase15-freshness-thresholds` · **PR:** Tighten Live window, add Delayed band

```
Read the freshness-state logic and methodology thresholds. Change the rules so "Live" only applies within ~2 minutes (aligned to the ~90s re-poll); 2–12 min becomes "Delayed" (show age); >12 min "Stale"; failures "Cached/Fallback"; total failure "Unavailable". Update the methodology copy to match the new thresholds. Ensure the top ticker "x min ago" and the badge can never disagree. Add/extend tests from Phase 1. Open PR phase15-freshness-thresholds. Never present non-live data as live.
```

- **Accept:** A value older than ~2 min never reads "Live"; badge and "x ago" agree; tests cover
  bands.
