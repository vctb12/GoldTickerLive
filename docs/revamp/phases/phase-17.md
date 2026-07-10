# Phase 17 — Unified freshness vocabulary + legend component

> One phase = one or more PRs. Paste the PROMPT block into Claude Code in the GoldTickerLive repo.
> Guardrail: stay on the static Vite stack — no framework migration, SSR, or build-tool swap.

## Phase 17 — Unified freshness vocabulary + legend component

- **Maps to:** P2-5 (vocabulary drift across surfaces).
- **Branch:** `phase17-freshness-vocab` · **PR:** One freshness vocabulary everywhere

```
Define one canonical freshness vocabulary (Live, Delayed, Cached, Stale, Fallback, Unavailable) with one color token each (from Phase 3). Replace divergent terms (e.g. the "About Our Prices" card mentions "Estimated/Historical baseline"; the states box differs). Build a single reusable FreshnessBadge + a small legend, used by homepage, calculator, country pages, ticker, and exports. Localize labels. Open PR phase17-freshness-vocab. Static stack only.
```

- **Accept:** Identical state names/colors on every surface and in CSV/JSON exports.
