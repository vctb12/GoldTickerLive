# Phase 18 — Quick-convert never blank (seed from cache)

> One phase = one or more PRs. Paste the PROMPT block into Claude Code in the GoldTickerLive repo.
> Guardrail: stay on the static Vite stack — no framework migration, SSR, or build-tool swap.

## Phase 18 — Quick-convert never blank (seed from cache)

- **Maps to:** P1-5 (blank reference value on first paint).
- **Branch:** `phase18-quickconvert-seed` · **PR:** Instant cached value + freshness

```
On the homepage inline Quick-convert, ensure a numeric reference value is shown on first paint by seeding from the localStorage cached price (the site already caches), labeled with freshness, then updating on live fetch. Eliminate the empty/underline-only state. Add a CLS-safe reserved space for the number. Read the quick-convert + cache modules first. Open PR phase18-quickconvert-seed. Never show a cached number unlabeled.
```

- **Accept:** A labeled number always visible immediately; no layout shift when live value lands.
