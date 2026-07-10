# Phase 40 — Image & hero optimization

> One phase = one or more PRs. Paste the PROMPT block into Claude Code in the GoldTickerLive repo.
> Guardrail: stay on the static Vite stack — no framework migration, SSR, or build-tool swap.

## Phase 40 — Image & hero optimization

- **Branch:** `phase40-images` · **PR:** Responsive images + lazy + dimensions

```
Audit images (WebP hero background, flags, generated assets). Serve responsive sizes, set explicit width/height (or aspect-ratio) to prevent CLS, lazy-load below the fold, and preload the LCP image. Add AVIF alongside WebP where it helps. Open PR phase40-images with LCP before/after. Static stack only.
```

- **Accept:** LCP image preloaded; below-fold lazy; no CLS from images.
