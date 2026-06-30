# Phase 06 — Canonical strategy normalization

> One phase = one or more PRs. Paste the PROMPT block into Claude Code in the GoldTickerLive repo.
> Guardrail: stay on the static Vite stack — no framework migration, SSR, or build-tool swap.

## Phase 6 — Canonical strategy normalization
- **Maps to:** P0-2 (canonical `/` vs `/calculator.html`).
- **Branch:** `phase06-canonical` · **PR:** One canonical convention sitewide
```
Per docs/PAGE-INVENTORY.csv, every page must declare a canonical equal to its own clean, extensionless URL (e.g. https://goldtickerlive.com/calculator). Fix the generator/template so canonicals are self-referential and consistent. Add server/host redirects (or static redirect config) so /calculator.html and trailing-slash variants 301 to the canonical form. Read how canonicals are currently emitted before editing. Open PR phase06-canonical with a table of before/after canonicals. Static stack only.
```
- **Accept:** Each page's canonical = its own clean URL; `.html` 301s to clean URL.
