# Repo cleanup audit — candidates (Phase 1, read-only)

> Generated: 2026-04-23T15:47:31+00:00

> Branch: `copilot/clean-repo-files-dead-code`

> Plan: [`docs/plans/REPO_CLEANUP_PROPOSAL.md`](../../docs/plans/REPO_CLEANUP_PROPOSAL.md) ·
> [`docs/REVAMP_PLAN.md` §29](../../docs/REVAMP_PLAN.md)

**This report is read-only.** No files are deleted as part of this PR. Owner sign-off on the
checkboxes below gates Phase 2 (Bucket A) and Phase 3 (Bucket B) removals. Bucket C items are _not_
candidates for removal — they are listed because the reachability graph could not statically resolve
them; each requires human judgement.

---

## Summary

- **Tracked files:** 1011
- **Reachable (live):** 976 (96%)
- **Bucket A (high confidence dead):** 0
- **Bucket B (medium confidence):** 3
- **Bucket C (human review required):** 32
- **Byte-identical binary duplicates:** 0

### Extension breakdown (top 15)

| Ext       | Count |
| --------- | ----: |
| `.html`   |   690 |
| `.js`     |   147 |
| `.md`     |    69 |
| `.json`   |    29 |
| `.css`    |    19 |
| `.yml`    |    16 |
| `(noext)` |    12 |
| `.png`    |    10 |
| `.py`     |    10 |
| `.sql`    |     3 |
| `.svg`    |     2 |
| `.txt`    |     2 |
| `.mjs`    |     1 |
| `.toml`   |     1 |

---

## Methodology

A file is considered **live** if ANY of these signals matches — this is conservative by design:

1. HTML→asset graph (`<script src>`, `<link href>`, `<img src>`, `<source srcset>`, inline `url()`)
   across every HTML file in the repo.
2. JS import graph (static `import` / `require` / `import.meta.glob` / string-literal path refs)
   starting from every HTML entrypoint and from `server.js` / `server/**/*.js`.
3. CSS `@import` and `url()` graph from every live stylesheet.
4. Config / tooling refs: `package.json` scripts, `vite.config.js`, `.github/workflows/**`,
   node/python scripts invoked in workflows.
5. Runtime refs: `sw.js`, `manifest.json`, `sitemap.xml`, `robots.txt`, `_redirects`, `_headers`,
   `.htaccess`, `CNAME`.
6. Python import graph from `scripts/python/**` entrypoints referenced by workflows.
7. Blanket keeps (never flagged): `docs/**`, `supabase/**`, `.git/**`, `.github/**`, `.husky/**`,
   root dotfiles, governance/meta files, all `**/*.html` under `countries/`, `content/`, `admin/`,
   or repo root, all `data/*.{json,csv,js}`, `config/*.{json,csv,js}`, `assets/**`, `reports/**`,
   `build/**`.
8. **Stem-grep fallback:** any file not statically reachable whose basename or stem appears anywhere
   else in the repo (excluding `reports/cleanup-audit/**` to avoid self-pollution) is downgraded
   from Bucket B to Bucket C (likely dynamic reference).

---

## Bucket A — High confidence dead (Phase 2 candidates)

_OS junk, editor swap files, zero-byte files, obvious backups, orphan `.map` files. Safe to propose
for removal after owner approval._

### Bucket A

_None._

## Bucket B — Medium confidence (Phase 3 candidates, per-file re-verify)

_Code files (JS / CSS / Py) not reachable from any entrypoint **and** whose basename / stem does not
appear anywhere else in the repo. Each requires a per-file dynamic-ref re-check before any Phase 3
PR._

### Bucket B

| ☐   | Path                                  | Size | Last touched          | Reason                                                               |
| --- | ------------------------------------- | ---: | --------------------- | -------------------------------------------------------------------- |
| ☐   | `scripts/node/cleanup-audit.js`       | 20KB | (unknown)             | not reachable from any entrypoint; no grep hits for basename or stem |
| ☐   | `scripts/node/generate-newsletter.js` | 11KB | 2026-04-22 `851d4d09` | not reachable from any entrypoint; no grep hits for basename or stem |
| ☐   | `src/seo/seoHead.js`                  |  9KB | 2026-04-16 `7f3ee446` | not reachable from any entrypoint; no grep hits for basename or stem |

## Bucket C — Human review required (NOT removal candidates)

_Files not statically reachable but with basename/stem references elsewhere, or living in dirs the
static graph cannot fully see (`reports/`, `build/`, `config/`, `assets/`, `server/data/`). These
are listed for owner inspection — do not treat as deletion candidates without manual investigation._

### Bucket C

| ☐   | Path                                    | Size | Last touched          | Reason                                                                                   |
| --- | --------------------------------------- | ---: | --------------------- | ---------------------------------------------------------------------------------------- |
| ☐   | `admin/auth.js`                         |  2KB | 2026-04-16 `dc69baed` | not statically reachable, but basename/stem is referenced elsewhere (dynamic ref likely) |
| ☐   | `admin/shared/admin-shell.js`           | 14KB | 2026-04-21 `5ed17ce2` | not statically reachable, but basename/stem is referenced elsewhere (dynamic ref likely) |
| ☐   | `admin/shared/admin-utils.js`           | 16KB | 2026-04-22 `349d4150` | not statically reachable, but basename/stem is referenced elsewhere (dynamic ref likely) |
| ☐   | `admin/shared/icons.js`                 |  5KB | 2026-04-16 `0e9ac783` | not statically reachable, but basename/stem is referenced elsewhere (dynamic ref likely) |
| ☐   | `admin/supabase-auth.js`                | 13KB | 2026-04-16 `0e9ac783` | not statically reachable, but basename/stem is referenced elsewhere (dynamic ref likely) |
| ☐   | `admin/supabase-config.js`              |  1KB | 2026-04-16 `f6aea1d1` | not statically reachable, but basename/stem is referenced elsewhere (dynamic ref likely) |
| ☐   | `countries/country-page.js`             | 17KB | 2026-04-21 `93387390` | not statically reachable, but basename/stem is referenced elsewhere (dynamic ref likely) |
| ☐   | `scripts/node/fix-asset-refs.js`        |  2KB | 2026-04-22 `3c6f76a5` | not statically reachable, but basename/stem is referenced elsewhere (dynamic ref likely) |
| ☐   | `scripts/node/fix-broken-hrefs.js`      |  3KB | 2026-04-22 `026d8354` | not statically reachable, but basename/stem is referenced elsewhere (dynamic ref likely) |
| ☐   | `scripts/node/fix-links.js`             |  1KB | 2026-04-20 `49701bd0` | not statically reachable, but basename/stem is referenced elsewhere (dynamic ref likely) |
| ☐   | `scripts/node/generate-placeholders.js` |  2KB | 2026-04-21 `b18b0b71` | not statically reachable, but basename/stem is referenced elsewhere (dynamic ref likely) |
| ☐   | `scripts/node/link-audit.js`            |  3KB | 2026-04-20 `49701bd0` | not statically reachable, but basename/stem is referenced elsewhere (dynamic ref likely) |
| ☐   | `scripts/node/notify-discord.js`        |  5KB | 2026-04-15 `ab4af3da` | not statically reachable, but basename/stem is referenced elsewhere (dynamic ref likely) |
| ☐   | `scripts/node/notify-telegram.js`       |  6KB | 2026-04-15 `ab4af3da` | not statically reachable, but basename/stem is referenced elsewhere (dynamic ref likely) |
| ☐   | `scripts/node/price-spike-alert.js`     | 10KB | 2026-04-15 `ab4af3da` | not statically reachable, but basename/stem is referenced elsewhere (dynamic ref likely) |
| ☐   | `scripts/node/tweet-gold-price.js`      | 19KB | 2026-04-22 `cffdf142` | not statically reachable, but basename/stem is referenced elsewhere (dynamic ref likely) |
| ☐   | `scripts/python/requirements.txt`       | 666B | 2026-04-22 `e326100a` | unreferenced (needs human review)                                                        |
| ☐   | `scripts/python/utils/__init__.py`      |  75B | 2026-04-14 `2f04cbe1` | not statically reachable, but basename/stem is referenced elsewhere (dynamic ref likely) |
| ☐   | `server/data/audit-logs.json`           | 27KB | 2026-04-16 `0e9ac783` | unreferenced (needs human review)                                                        |
| ☐   | `server/data/shops-data.json`           |  5KB | 2026-04-16 `0e9ac783` | unreferenced (needs human review)                                                        |
| ☐   | `server/data/users.json`                | 532B | 2026-04-16 `0e9ac783` | unreferenced (needs human review)                                                        |
| ☐   | `src/components/internalLinks.js`       |  3KB | 2026-04-15 `ab4af3da` | not statically reachable, but basename/stem is referenced elsewhere (dynamic ref likely) |
| ☐   | `src/lib/freshness-pulse.js`            |  2KB | 2026-04-23 `f270fbb7` | not statically reachable, but basename/stem is referenced elsewhere (dynamic ref likely) |
| ☐   | `src/lib/search.js`                     | 531B | 2026-04-14 `6ee4c32f` | not statically reachable, but basename/stem is referenced elsewhere (dynamic ref likely) |
| ☐   | `src/package.json`                      | 228B | 2026-04-22 `eb2703c8` | unreferenced (needs human review)                                                        |
| ☐   | `src/routes/routeRegistry.js`           |  4KB | 2026-04-15 `ab4af3da` | not statically reachable, but basename/stem is referenced elsewhere (dynamic ref likely) |
| ☐   | `src/seo/metadataGenerator.js`          |  8KB | 2026-04-16 `0e9ac783` | not statically reachable, but basename/stem is referenced elsewhere (dynamic ref likely) |
| ☐   | `src/social/postTemplates.js`           | 19KB | 2026-04-21 `eebf0220` | not statically reachable, but basename/stem is referenced elsewhere (dynamic ref likely) |
| ☐   | `src/utils/inputValidation.js`          |  3KB | 2026-04-14 `6ee4c32f` | not statically reachable, but basename/stem is referenced elsewhere (dynamic ref likely) |
| ☐   | `src/utils/routeBuilder.js`             |  4KB | 2026-04-15 `ab4af3da` | not statically reachable, but basename/stem is referenced elsewhere (dynamic ref likely) |
| ☐   | `src/utils/routeValidator.js`           |  3KB | 2026-04-14 `6ee4c32f` | not statically reachable, but basename/stem is referenced elsewhere (dynamic ref likely) |
| ☐   | `src/utils/slugify.js`                  |  2KB | 2026-04-21 `f3c7c8c2` | not statically reachable, but basename/stem is referenced elsewhere (dynamic ref likely) |

---

## Supplementary reports

### depcheck — `package.json` unused dependencies

_Phase 5 input. Cross-check against workflow usage before removing any dep._

**Unused `dependencies`:**

- ☐ `lowdb`
- ☐ `uuid`

**Unused `devDependencies`:**

- ☐ `stylelint-config-standard`

**Missing (declared as import but not listed in package.json):**

- `@supabase/supabase-js` — used by: `server/lib/supabase-client.js`

### ruff — Python unused imports / names (`F401,F811,F841`)

_Clean. No findings._

### knip — unused exports & dead files (report-only, noisy)

> ⚠️ knip cannot resolve root-relative HTML imports
> (`<script type='module' src='/src/pages/foo.js'>`) against this repo's static multi-page layout,
> so its **"unused files"** list contains many false positives (e.g. `src/pages/tracker-pro.js`,
> `src/lib/safe-dom.js`, `src/tracker/state.js` — all provably live via `tracker.html` + tests). Use
> the list below as a **supplementary** signal only. The authoritative file-level list is Bucket B
> above.

- knip reported **41** files as file-level unused (noisy; cross-check before acting).
- knip reported **30** unused exports/types inside otherwise-live files (Phase 4 input).

**Unused-export samples (first 40 files):**

| File                          | Unused exports                                                                                                                                            |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/api.js`              | `_simulateGoldFail`:24, `_simulateFxFail`:25, `setSimulateGoldFail`:26, `setSimulateFxFail`:29                                                            |
| `src/lib/cache.js`            | `showStorageQuotaWarning`:18, `getFallbackFXRates`:142, `savePreference`:146, `checkDayOpenReset`:152, `saveHistorySnapshot`:167, `clearAllCache`:187     |
| `src/lib/price-calculator.js` | `usdPerOz`:8, `localPrice`:13, `calculateAllPrices`:18, `calculateVolatility`:53                                                                          |
| `src/lib/formatter.js`        | `formatTimestamp`:42, `formatCountdown`:79, `formatPercentChange`:88, `formatDate`:101, `formatKarat`:116, `formatCountryName`:120, `formatFreshness`:130 |
| `src/lib/live-status.js`      | `GOLD_MARKET`:3, `getAgeMs`:30, `formatRelativeAge`:36, `getLiveFreshness`:58                                                                             |
| `src/components/nav.js`       | `initNavSearch`:899                                                                                                                                       |
| `src/lib/reveal.js`           | `observeReveal`:40                                                                                                                                        |
| `src/lib/site-settings.js`    | `getCachedSiteSettings`:50, `loadSiteSettings`:83                                                                                                         |
| `src/search/searchEngine.js`  | `search`:73                                                                                                                                               |

_Full knip JSON: `reports/cleanup-audit/knip.json`._

### purgecss — potentially unused CSS selectors (report-only)

> ⚠️ CSS selectors used only via `setAttribute('class', …)` or template strings in JS may appear
> here as "unused". Motion primitives (`hover-lift`, `data-freshness-pulse`, `data-reveal`,
> `flash-up/down`, `pulse-dot`, `drawer-slide-in`) and utility classes emitted from JS are
> **protected** and must be cross-checked by hand before any Phase 6 removal.

| Stylesheet               | Rejected selectors | Sample                                                                                                       |
| ------------------------ | -----------------: | ------------------------------------------------------------------------------------------------------------ |
| `styles/order.css`       |                  0 |                                                                                                              |
| `styles/market-page.css` |                  4 | `.mkt-breadcrumbs`, `.mkt-breadcrumbs a`, `.mkt-breadcrumbs a:hover`, `.mkt-breadcrumbs span`                |
| `styles/guide-page.css`  |                  9 | `.guide-cta`, `.guide-cta h3`, `.guide-cta p`, `.guide-cta-btns`, `.guide-cta-btn`, `.guide-cta-btn:hover` … |
| `styles/global.css`      |                408 | `                                                                                                            |

.h5`, ` .h6`, `.h5`, `.h6`, `.display-1`, `
[data-price]`… | |`styles/critical.css`| 0 |  | |`styles/country-page.css`| 46 |`.cp-hero-badges`, `.cp-stale-badge`, `.cp-peg-badge`, `.cp-change-row`, `.cp-change-label`, `.cp-update-time`… | |`styles/city-page.css`| 0 |  | |`styles/admin.css`| 129 |`.sidebar-header`, `.sidebar-header
.logo-icon`, `.sidebar-header
.logo-text`, `.sidebar-nav`, `.sidebar-nav::-webkit-scrollbar`, `.sidebar-nav::-webkit-scrollbar-track`… | |`styles/pages/tracker-pro.css`| 64 |`.tracker-anchor`, `
.tracker-hero-card`, `.tracker-hero-card`, `.tracker-hero-card::before`, `
.tracker-hero-card::after`, `.tracker-hero-card::after`… | |`styles/pages/terms.css`| 0 |  | |`styles/pages/stub.css`| 0 |  | |`styles/pages/shops.css`| 11 |`.shop-signal--full`, `.shop-signal--partial`, `.shop-signal--limited`, `.modal-details-full`, `.modal-details-partial`, `.modal-details-limited`… | |`styles/pages/pricing.css`| 0 |  | |`styles/pages/methodology.css`| 0 |  | |`styles/pages/learn.css`| 0 |  | |`styles/pages/invest.css`| 0 |  | |`styles/pages/insights.css`| 46 |`.insights-body`, `.insights-section-heading`, `.insights-featured`, `.insights-featured-tag`, `.insights-featured-meta`, `.insights-meta-sep`… | |`styles/pages/home.css`| 0 |  | |`styles/pages/calculator.css`| 5 |`.calc-input-group`, `.calc-input-group:focus-within`, `.calc-help-text`, `.calc-section`, `.calc-tab-bar`
|

_Full purgecss JSON: `reports/cleanup-audit/purgecss.json`._

---

## Owner sign-off

Check the `☐` at the start of each Bucket A / B row you approve for removal in the subsequent phase
PR. Items left unchecked are **NOT** removed. Bucket C items are reviewed, not approved for removal
here — note any you want investigated separately.

### Sign-off log

- ☐ Bucket A approved in bulk (equivalent to checking every row above)
- ☐ Bucket B re-verification approved (agent re-runs dynamic-ref grep + build-diff per row before
  each Phase 3 PR)
- ☐ depcheck unused-deps approved for removal
- ☐ knip unused-exports approved for Phase 4 trimming
- ☐ purgecss rejected-selector audit approved for Phase 6 (report-first)
- ☐ Docs archival (Phase 7) approved — list each doc to archive in a follow-up PR description
