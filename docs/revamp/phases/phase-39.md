# Phase 39 — Font loading optimization

> One phase = one or more PRs. Paste the PROMPT block into Claude Code in the GoldTickerLive repo.
> Guardrail: stay on the static Vite stack — no framework migration, SSR, or build-tool swap.

## Phase 39 — Font loading optimization
- **Branch:** `phase39-fonts` · **PR:** font-display + preload + subset
```
Fonts are self-hosted woff2 (Source Sans 3 + Cairo). Add font-display: swap, preload the critical Latin + Arabic subsets used above the fold, and verify subsetting trims unused glyphs. Avoid FOIT; keep CLS stable with size-adjust if needed. Open PR phase39-fonts. Static stack only.
```
- **Accept:** No invisible-text flash; reduced font bytes; CLS unaffected.
