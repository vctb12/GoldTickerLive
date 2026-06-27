# D7 — Real `<img>` imagery plan (evidence + proposal)

> Defect-closure track, 2026-06-27. Status: **plan / staged** (no markup shipped this commit —
> introducing real imagery needs assets + the Phase 13 pipeline + owner sign-off). Related staged
> work: `OWNER_REVIEW.md` **Phase 13 — Image pipeline (webp/avif + responsive)**.

## Evidence (verified in repo, 2026-06-27)

```
<img> tags in public HTML (excl. dist/node_modules):   0
<picture>/<source> in public HTML:                     0
inline <svg> on homepage (index.html):                 1   (nav brand logo)
raster assets in assets/:  apple-touch-icon.png, favicon-192x192.png,
                           favicon-32x32.png, favicon-512x512.png, og-image.png
```

`npm run validate` (basic-a11y gate) corroborates: "Scanned 341 public HTML files (**0 images**, 0
iframes)." So site imagery is ~100% CSS gradients + inline SVG; the only raster files are favicons
and the social `og-image.png` (referenced in `<meta>`, never rendered on-page).

## Why this is intentional today (and the trade-off)

The CSS/SVG-only approach is fast and CLS-free (no decoded raster on the critical path). The cost:
no real product photography (markets, shops, jewellery, city skylines), which weakens richness,
social proof, and image-search/Discover surfaces for the country/city/ shops pages.

## Proposed `<img>` contract (when assets exist)

Every introduced raster image must ship with:

| Attribute          | Rule                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| `alt`              | Meaningful EN/AR alt from `translations.js` (empty `alt=""` only if purely decorative)                 |
| `width` + `height` | Intrinsic dimensions on every `<img>` to reserve space → **zero CLS**                                  |
| `loading`          | `eager` + `fetchpriority="high"` for an above-the-fold LCP image; `lazy` for everything below the fold |
| `decoding`         | `decoding="async"`                                                                                     |
| responsive         | `<picture>` with AVIF→WebP→fallback + `srcset`/`sizes` (built by Phase 13)                             |

## Candidate surfaces (priority order)

1. **Shops directory / shop detail** — real shop or market storefront photos (highest user value;
   pairs with the D3 shops data work). Needs sourced, licensed photos.
2. **Country / city market pages** — one representative market photo per hub (e.g. Dubai Gold Souk,
   Khan el-Khalili). Needs licensed photos.
3. **Homepage hero** — optional supporting image behind/with the existing gradient; must not regress
   LCP/CLS.

Country **flags** stay as emoji (deliberate: zero-weight, no extra requests) unless a design pass
decides otherwise.

## Why staged (not shipped this commit)

- **No content image assets exist** — real `<img>` requires sourcing/licensing photography first;
  inventing placeholders would degrade a live, trust-first site.
- The responsive/optimised delivery (AVIF/WebP + `srcset`) is **Phase 13 (STAGED)** — a build step
  (`scripts/node/build-images.js`, sharp) plus per-page markup. Per the repo's plan-first +
  minimal-diff guardrails and "never guess a live surface into a degraded state," this is filed as a
  plan rather than guessed into markup.

## Done-when

Assets sourced → Phase 13 image pipeline merged → `<img>`/`<picture>` added on the candidate
surfaces using the contract above → Lighthouse mobile shows no LCP/CLS regression → EN/AR alt parity
verified.
