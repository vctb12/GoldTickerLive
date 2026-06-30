# Phase 05 — Page/route inventory + audit map

> One phase = one or more PRs. Paste the PROMPT block into Claude Code in the GoldTickerLive repo.
> Guardrail: stay on the static Vite stack — no framework migration, SSR, or build-tool swap.

## Phase 5 — Page/route inventory + audit map
- **Branch:** `phase05-page-inventory` · **PR:** Generate page inventory + redirect/canonical map
```
Crawl the built output (or the generation config) and produce docs/PAGE-INVENTORY.csv listing every generated URL, its EN/AR status, current <title>, meta description, canonical, and hreflang. Flag: extensionless vs .html mismatches, missing AR counterpart, duplicate canonicals, and missing meta. This is documentation only — no app changes. Open PR phase05-page-inventory. It will drive Waves 1–2.
```
- **Accept:** Complete CSV; flags match audit (canonical `/` vs `/calculator.html`, AR gaps).

---
