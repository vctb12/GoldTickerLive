# Phase 09 — Reciprocal hreflang + x-default

> One phase = one or more PRs. Paste the PROMPT block into Claude Code in the GoldTickerLive repo.
> Guardrail: stay on the static Vite stack — no framework migration, SSR, or build-tool swap.

## Phase 9 — Reciprocal hreflang + x-default

- **Maps to:** P0-1 (hreflang points to non-existent `/?lang=ar`).
- **Branch:** `phase09-hreflang` · **PR:** Correct bilingual hreflang pairs

```
Replace the current hreflang (which points ar to /?lang=ar that the toggle never produces) with reciprocal, self-consistent pairs on EVERY page: en -> clean EN URL, ar -> the new /ar/ URL, x-default -> EN. Both the EN and AR versions of a page must reference each other identically. Read Phase 6/7 outputs first. Validate all pairs resolve (200, not redirected). Open PR phase09-hreflang with a validation table. Static stack only.
```

- **Accept:** Every EN/AR pair cross-references; no hreflang targets 404/redirect.
