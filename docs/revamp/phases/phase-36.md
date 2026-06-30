# Phase 36 — Alt text & non-text content

> One phase = one or more PRs. Paste the PROMPT block into Claude Code in the GoldTickerLive repo.
> Guardrail: stay on the static Vite stack — no framework migration, SSR, or build-tool swap.

## Phase 36 — Alt text & non-text content
- **Branch:** `phase36-alt-text` · **PR:** Decorative vs informative media
```
Audit imagery (CSS-background hero, country flags, icons, generated OG assets). Ensure informative graphics have text alternatives and decorative ones are correctly hidden from AT (aria-hidden / empty alt). Country flags should expose the country name. Open PR phase36-alt-text. Static stack only.
```
- **Accept:** Flags/icons have correct names or are properly decorative; axe clean.

---
