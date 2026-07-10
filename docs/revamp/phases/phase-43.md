# Phase 43 — Brand/OG social images

> One phase = one or more PRs. Paste the PROMPT block into Claude Code in the GoldTickerLive repo.
> Guardrail: stay on the static Vite stack — no framework migration, SSR, or build-tool swap.

## Phase 43 — Brand/OG social images

- **Branch:** `phase43-og-images` · **PR:** Default + per-template OG images
- **Higgsfield prompt (default OG, 1.91:1 / 1200×630):**
  > "Premium minimalist OG banner for gold-price reference site 'Gold Ticker Live'. Deep charcoal
  > background, warm antique-gold glow lower-right, a restrained stack of gold bullion bars on the
  > right third, large clean negative space on the left for text, editorial fintech look, palette
  > cream / antique gold #C4902E / charcoal, no text, no logo, no charts, soft studio light."

```
Add Open Graph/Twitter images: a default brand image plus a small set of template variants (homepage, calculator, country, methodology). Place generated assets under /public (or /src/assets) and wire og:image/twitter:image per page+locale with correct dimensions and alt. Provide an AR variant if text is overlaid later. Read Phase 8 meta wiring. Open PR phase43-og-images. Static stack only.
```

- **Accept:** Valid OG image per template+locale; passes social validators.
