# Phase 11 — robots.txt + indexing hygiene

> One phase = one or more PRs. Paste the PROMPT block into Claude Code in the GoldTickerLive repo.
> Guardrail: stay on the static Vite stack — no framework migration, SSR, or build-tool swap.

## Phase 11 — robots.txt + indexing hygiene

- **Branch:** `phase11-robots` · **PR:** robots.txt + noindex on thin/util URLs

```
Add/curate robots.txt: allow content, point to sitemap, disallow query-param duplicates and any utility endpoints. Ensure parametered URLs (e.g. /calculator?w=10) are canonicalized to the clean page (not separately indexed). Read current robots and how query state is reflected in canonical. Open PR phase11-robots. Static stack only.
```

- **Accept:** Param URLs canonicalize to base; sitemap referenced; no content blocked.
