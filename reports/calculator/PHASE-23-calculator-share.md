# Phase 23 — Calculator UX + export/share (Track F · Green)

The calculator already ships a solid export/share surface — a shareable result card, **Copy Link**
(deep-links via URL state), and **Copy as image** (html2canvas → clipboard). This phase fills the
two real gaps in that surface: no native mobile share, and a copy-image path that could no-op on
some browsers. Additive and zero-dependency (respects the $0 constraint — no new library, no
network).

## Fixes shipped

1. **Native Web Share (new)** — added a **Share** button to the calculator result actions. It uses
   the platform share sheet (`navigator.share`), the same pattern already used on the shops page
   (`src/pages/shops.js`), so on mobile users can share straight to WhatsApp / Messages / etc.
   instead of only copying a link.
   - **Feature-detected & graceful:** the button ships `hidden` and is only revealed when
     `typeof navigator.share === 'function'`. Where the API is absent (most desktops), it stays
     hidden and the existing Copy Link / Copy as image buttons remain the fallback.
   - Shares the canonical deep-link (`location … + search`, i.e. the URL-state permalink) plus a
     short text built from the share card (weight · karat · currency · estimated value), omitting
     the text when no result is computed yet.
   - **Bilingual:** label is `Share` / `مشاركة`, set in `applyLang()` alongside the sibling buttons.
   - No dependency, no CDN, no tracking on share.
2. **Copy-as-image fallback gap (bug fix)** — the previous handler only ran inside
   `if (navigator.clipboard?.write) { … }`, so browsers without clipboard **image** write (Firefox,
   insecure contexts, older Safari) got **nothing** — not even a download. Restructured so the PNG
   is copied to the clipboard where supported and **always falls back to a file download** otherwise
   (and on a failed/empty blob). Every browser now gets the image one way or another.

## Verification

End-to-end headless smoke test (Playwright, stubbed `navigator.share`):

| Scenario                  | Result                                                                                                                        |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `navigator.share` present | Share button revealed (`hidden=false`), labeled `Share`; click fires `navigator.share({title, url: …?k=22&c=AED&mode=value})` |
| `navigator.share` absent  | Share button stays `hidden` — copy buttons remain the fallback                                                                |

Gate: `npm run build` + `npm run validate` + `npm test` (1286 pass) + `npm run lint` — all green.

## Registered follow-up (not changed here)

- **`Copy as image` loads html2canvas from a CDN** (`cdn.jsdelivr.net/npm/html2canvas@1.4.1`,
  `src/pages/calculator.js`), lazily on click. This is the same external-CDN pattern the shops map
  uses for Leaflet (accepted, lazy). For a fully self-contained / CSP-tightenable build it would be
  better to bundle html2canvas as an on-demand dynamic-import chunk, but that adds a ~200 KB
  dependency and needs a `gh-advisory-database` check + `npm run build` size review — out of scope
  for this Green phase. Recommended as a dedicated dependency-review change. (The Share and Copy
  Link paths have no such dependency.)
