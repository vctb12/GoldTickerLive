# Phase 44 — Hero & section imagery refresh

> One phase = one or more PRs. Paste the PROMPT block into Claude Code in the GoldTickerLive repo.
> Guardrail: stay on the static Vite stack — no framework migration, SSR, or build-tool swap.

## Phase 44 — Hero & section imagery refresh
- **Branch:** `phase44-hero-art` · **PR:** Optimized hero/section art
- **Higgsfield prompt (hero, 16:9, dark-mode aware):**
  > "Subtle hero background texture for a gold finance site, near-black with faint gold bullion bokeh and a soft warm gradient, very low-contrast so white/cream text sits cleanly on top, no focal subject, no text, elegant, premium."
```
Replace/optimize the hero and key section imagery with on-brand assets that work in BOTH light and dark themes and don't harm text contrast (coordinate with Phase 31). Export WebP+AVIF, set dimensions, preload LCP. Open PR phase44-hero-art with light/dark screenshots. Static stack only.
```
- **Accept:** Hero looks premium in both themes; text contrast preserved; no CLS.
