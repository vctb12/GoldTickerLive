# D9 — Homepage font diet plan (evidence + proposal)

> Defect-closure track, 2026-06-27. Status: **plan / staged** (the meaningful wins are invasive and
> site-wide). Related staged work: `OWNER_REVIEW.md` **Phase 11 — Async / self-hosted fonts**.

## Evidence (verified in repo + against Google Fonts, 2026-06-27)

`index.html` loads one family, **Cairo, at 5 weights**, via the css2 API:

```
https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap
```

Fetching that stylesheet (Chrome UA) shows what the browser actually downloads:

```
@font-face blocks (= woff2 files):  15      (5 weights × 3 unicode subsets)
unicode subsets:                    arabic, latin, latin-ext   (5 each)
weights:                            400 500 600 700 800
```

Plus a local-only fallback face in `styles/partials/base.css`
(`@font-face { font-family:'Cairo'; src: local('Cairo'); font-display: swap }`) → **~16 font
declarations total**, matching the "~16 homepage fonts" defect.

What is **already correct**: `display=swap` is present (no FOIT), `preconnect` to
`fonts.googleapis.com` + `fonts.gstatic.com` is present, and the Cairo CSS is preloaded
(`<link rel="preload" as="style">`) then applied.

What is **not**: 5 weights and the unused **latin-ext** subset are shipped; the preload warms the
_stylesheet_, not a single critical _font face_ (the woff2 URLs are gstatic-hashed, so a single-face
preload is only practical when self-hosted).

## Proposed diet (in order of safety → impact)

1. **Drop `latin-ext`.** A GCC EN/AR site needs Latin + Arabic only. css2 has no direct subset
   param, so this needs self-hosting (step 3) **or** `&text=` (too fragile for a dynamic UI). Saves
   5 woff2 files (15 → 10).
2. **Trim weights 5 → 3.** Audit actual usage; keep e.g. 400 / 600 / 700, drop 500 / 800 if unused.
   Per-weight, site-wide (the same URL is on ~390 pages), so it is a co-ordinated change, not a
   homepage-only edit — needs a usage audit first.
3. **Self-host a subset Cairo (Latin + Arabic) woff2 and `preload` the single critical face.**
   Eliminates the render-blocking third-party CSS round-trip and lets us preload exactly one face
   (the LCP weight). This is **Phase 11 (STAGED)**.

Indicative result: 16 declarations → ~6 self-hosted faces (3 weights × {latin, arabic}), one
preloaded.

## Why staged (not shipped this commit)

- Self-hosting/subsetting touches **every page head (~390 files)** and adds committed font
  binaries + a build transform — exactly the invasive, non-minimal change `OWNER_REVIEW.md` Phase 11
  was reclassified to STAGED for.
- Weight-trimming is a **site-wide** typographic change requiring a usage audit + EN/AR visual
  review; guessing weights off a live site risks a visible regression.
- `display: swap`, `preconnect`, and CSS preload are already in place, so there is no
  unsafe-but-quick win left that materially cuts the 16 files without the staged work.

## Done-when

Weight-usage audit complete → subset Cairo (Latin+Arabic) self-hosted + build transform merged
(Phase 11) → single critical face preloaded → font requests drop from ~16 to ~6 → Lighthouse mobile
FCP/LCP improved, no EN/AR rendering regression at 360px.
