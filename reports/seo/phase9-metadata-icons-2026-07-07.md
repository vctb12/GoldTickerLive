# Phase 9 — Metadata / canonical + favicon / app-icon / social-preview audit (Track C)

Audit of metadata, canonicals, favicons/app-icons and OG/Twitter social previews across the flagship
pages, plus the one concrete gap fixed.

## Audit result — the layer is strong

Scanned index / tracker / calculator / shops / compare / heatmap / portfolio / methodology / learn /
market / glossary + a country sample (dubai-gold-price). **Every page** has: a self-referential
`canonical`, `og:title/description/image/url/type/locale`, `og:image:width/height/alt`,
`twitter:card/title/description/image`, `apple-touch-icon`, `manifest`, and `theme-color`.

| Check                                                 | Result                                                                                                                                          |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical present + equals `og:url` (self-consistent) | ✅ every page                                                                                                                                   |
| OG image referenced exists on disk                    | ✅ all (`og-image.png`, `og/{tracker,calculator,shops,compare,learn,methodology}.png`, `og/countries/*`)                                        |
| `og:image:width/height/alt`                           | ✅ present (1200×630 + alt)                                                                                                                     |
| Manifest icons exist on disk                          | ✅ `favicon.svg`, `favicon-192/512/512-maskable` all present                                                                                    |
| Audit P2-1 "`/assets/favicon.svg` 404"                | ✅ **not reproducible** — no page references `assets/favicon.svg`; the real favicon is `favicon.svg` at root (refreshed 2026-07-01, post-audit) |
| Referenced OG images missing                          | ✅ none                                                                                                                                         |

## The one real gap — fixed

**`twitter:site` / `twitter:creator` were absent on every page**, even though the site runs an
active `@GoldTickerLive` X account. Without `twitter:site`, X/Twitter cards don't attribute the
site. Added to the flagship pages in this phase's scope (home, tracker, calculator, shops, country
sample):

```html
<meta name="twitter:site" content="@GoldTickerLive" />
<meta name="twitter:creator" content="@GoldTickerLive" />
```

## Deferred / recommended (not done here)

- **Site-wide `twitter:site` rollout.** The five flagship pages are done; the remaining ~355 pages
  would be best covered by a build-time meta injection (extend an existing head post-processor like
  `inject-schema.js`) rather than hand-editing each. Recommended as a follow-up so all pages carry
  the handle consistently.
- **Canonical form (`.html` vs extensionless), audit P0-2.** The site's convention is `.html` URLs
  (matching `_redirects` and the hreflang model in the in-flight **PR #536**). Migrating to
  extensionless canonicals is a large, cross-cutting SEO change that would **collide with PR #536**
  — deferred; not a correctness bug (each canonical already equals its own served URL).

## Verification

`npm run validate` (0), `npm test`, `npm run build` (0). All five pages now emit the Twitter handle;
no other metadata changed.
