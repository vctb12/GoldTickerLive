# Phase 15 — Asset & image pipeline audit (Track D)

Audited every raster image's format, responsive delivery, CLS safety, and lazy-loading. **The image
pipeline is already best-practice — no change warranted.** Documents the size-delta the pipeline
delivers and the two non-improvements (with reasons).

## Audit result

| Check                         | Result                                                                                                                                                                            |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Modern formats (avif/webp)    | ✅ **every** referenced raster image ships avif + webp + jpg via `<picture>` (33 avif + 40 webp assets). A scan found **0** referenced `.jpg`/`.png` without an avif/webp sibling |
| `<picture>` source order      | ✅ avif → webp → jpg, so browsers pick the smallest they support                                                                                                                  |
| Responsive `srcset`           | ✅ large market cards carry `480w / 768w / 960w` + `sizes`; small strip tiles use a single 480 (appropriate for a ~150–240px thumbnail)                                           |
| CLS safety (`width`/`height`) | ✅ every `<img>` has explicit `width` + `height` (matches the Phase 14 finding: CLS ≤ 0.016 everywhere)                                                                           |
| Lazy-loading + async decode   | ✅ every content image is `loading="lazy" decoding="async"`                                                                                                                       |
| Hero                          | webp CSS background (`assets/hero/gold-bullion-band.webp`, 35.5 KB)                                                                                                               |

## Size-delta the pipeline already delivers (avif vs jpg, 768w market images)

| Image             |     jpg |    avif |            saved |
| ----------------- | ------: | ------: | ---------------: |
| qatar-souq-waqif  | 39.2 KB | 16.9 KB |         **−56%** |
| jordan-amman      | 58.9 KB | 33.6 KB |             −43% |
| dubai-gold-souk   | 73.8 KB | 46.1 KB |             −37% |
| riyadh-dirah      | 82.0 KB | 50.9 KB |             −37% |
| india-manek-chowk | 78.9 KB | 52.0 KB |             −34% |
| … (11 images)     |         |         | 5–56%, most ~30% |

Because avif is the first `<picture>` source, supporting browsers download these smaller files
automatically. This is why the Phase-14 CWV run shows image weight at ~2–18 KB per page in the lab
(the visible market thumbnails load lazily and in avif).

## Non-improvements (with reasons — not done)

- **Hero avif.** The hero is webp-only in CSS (`background-image`). An `image-set()` avif upgrade
  would save ~15%, but **no avif hero asset exists** and no image encoder (sharp/cwebp/avifenc) is
  installed in this environment, so it can't be produced at $0. The webp hero is already well-
  compressed (35.5 KB). Recommend generating a hero avif + `image-set()` when tooling is available.
- **Strip-tile 768w.** The small market-strip thumbnails use a single 480 source; the 768 assets
  exist, but 480 already covers a ~150–240px thumbnail at 2×. Adding 768w is marginal and would
  touch `index.html` (Phase 21's surface) — deferred as not worth the cross-phase edit.

## Verification

`npm run validate` / `npm test` green (no code changed — audit + evidence report). Re-run
`npm run perf` (Phase 14) after any future image change for a before/after weight delta.
