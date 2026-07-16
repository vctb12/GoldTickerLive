# Operation Midas — Phase 1 Baseline (2026-07-16)

Rollback tag: `pre-midas` → `0f61fd6`. Branch: `claude/operation-midas-goldtickerlive-6b32h3`.

## Measured baseline

| Metric              | Value                                            | Artifact                    |
| ------------------- | ------------------------------------------------ | --------------------------- |
| Test suite          | **1668 pass / 0 fail** (164 suites, ~66 s)       | `test-baseline.txt`         |
| Build               | green (`npm run build`), `dist/` = 6.9 MB        | `bundle-sizes.txt`          |
| Largest JS chunk    | `utils` 218 KB, `vendor` 195 KB (pre-gzip)       | `bundle-sizes.txt`          |
| Prod headers (EN /) | HTTP/2 200, HSTS, XCTO, Referrer-Policy; no CSP  | `prod-headers.txt`          |
| Prod `/ar/`         | **HTTP 404** (no AR URL space exists)            | `prod-headers.txt`          |
| Sitemap             | 14 URLs (fetched live)                           | `sitemap.xml`               |
| Prod homepage HTML  | 105 KB snapshot                                  | `prod-home-en.html.txt`     |
| Spot at capture     | $4,002.70/oz ⇒ 472.61 AED/g 24K (within anchors) | repo `data/gold_price.json` |

## Corrections to the campaign plan's assumptions (Finding 0)

1. **Test floor is 1668/0, not 1081/0.** The plan's Directive 7 number was stale. 1668 is the Midas
   floor from this point on.
2. **The site is ~17 public pages, not ~390.** Country markets are served by `compare.html`,
   `heatmap.html`, `market.html` + config (`src/config/countries.js`), not by dedicated country-page
   files. Phases 19/23/24 scope changes accordingly.
3. **There is no `/ar/` page mirror.** Arabic is client-side (`data-i18n` +
   `src/config/translations.js`). `/ar/` 404s in production. An en/ar hreflang matrix as described
   in Phase 19 is impossible without an AR URL space — this is an owner-gated architectural
   decision, not a bug fix.
4. **Vite globs every `.html` in the repo** — a stray HTML file anywhere (even under `docs/`) breaks
   `npm run build` (observed first-hand; snapshot stored as `.html.txt` for this reason).

## Deferred baseline artifacts

- Lighthouse mobile/desktop runs: `lighthouse` is not a repo dependency; deferred to Phase 25 (CWV
  hardening) where it is actually consumed. `lighthouserc.json` exists for CI.
