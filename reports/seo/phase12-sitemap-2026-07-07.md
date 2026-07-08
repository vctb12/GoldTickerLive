# Phase 12 — Sitemap gap closure (Track C, reconciled with PR #536)

Audited the sitemap, robots.txt, and noindex coverage. **The sitemap is complete and correct — no
generation change made** (that pipeline is owned by in-flight **PR #536**; this phase does not
duplicate it). One concrete SEO-governance hygiene fix landed alongside.

## Sitemap audit — complete & clean

| Check                               | Result                                                                                                                                                                                          |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `robots.txt` references the sitemap | ✅ `Sitemap: https://goldtickerlive.com/sitemap.xml`                                                                                                                                            |
| Committed source                    | ✅ `public/sitemap.xml` is the git-tracked one; root `/sitemap.xml` is a gitignored build artifact — matches PR #536's model                                                                    |
| Coverage                            | ✅ **14 `<loc>` = 14 indexable pages** exactly (homepage `/` + calculator, compare, dubai-gold-price, glossary, heatmap, learn, market, methodology, portfolio, privacy, shops, terms, tracker) |
| noindex leaks                       | ✅ **none** — `404.html`, `offline.html`, and all `admin/*` (noindex) are absent from the sitemap                                                                                               |
| hreflang alternates                 | ✅ present — 42 `xhtml:link` entries (14 URLs × en/ar/x-default, `?lang=ar` model)                                                                                                              |

Coverage was cross-checked by listing every tracked HTML with a `canonical` and no `noindex` — the
set equals the sitemap's URL set exactly. The historical "sitemap gaps (28)" item predates the
country-URL consolidation; the current indexable surface is 14 pages, all covered.

## Reconciliation with PR #536

PR #536 migrates sitemap generation to the committed `public/sitemap.xml` (single generator
`scripts/node/generate-sitemap.js`, `--out public/sitemap.xml`, coverage enforcement in CI) and the
`?lang=ar` hreflang model. Main already reflects that end-state (only `public/sitemap.xml` is
tracked; hreflang alternates present). **Phase 12 therefore changes no sitemap file or generator** —
it confirms correctness and defers all generation ownership to #536.

## Concrete fix — cleared the stale SEO-governance report

`reports/seo/governance.json` had been stale since the Phase-1 baseline (a non-fatal
`npm run validate` warning). Regenerated it (`node scripts/node/seo-governance.js`): now
`check ok — 48 pages, thinRisk=0, dupClusters=0`, clearing the warning. Small diff (4±4 lines), pure
report artifact.

## Verification

`npm run validate` (now with `seo-governance --check` **ok**, no stale warning) / `npm test` /
`npm run build` green.
