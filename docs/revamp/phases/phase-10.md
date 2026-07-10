# Phase 10 — XML sitemap(s) with locale alternates

> One phase = one or more PRs. Paste the PROMPT block into Claude Code in the GoldTickerLive repo.
> Guardrail: stay on the static Vite stack — no framework migration, SSR, or build-tool swap.

## Phase 10 — XML sitemap(s) with locale alternates

- **Branch:** `phase10-sitemap` · **PR:** Build-time sitemap with hreflang

```
Generate sitemap.xml (split if >50k URLs) at build time from PAGE-INVENTORY, including every EN and AR clean URL with xhtml:link alternate (hreflang) entries. Add lastmod. Reference it from robots.txt. Do not include redirect/.html variants. Open PR phase10-sitemap. Static stack only.
```

- **Accept:** Sitemap lists clean EN+AR URLs with alternates; linked from robots.
