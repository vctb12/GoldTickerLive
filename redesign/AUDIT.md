# GoldTickerLive — Phase 0 Discovery & Audit

**Scope:** All 390 HTML pages of the live, trust-critical site goldtickerlive.com (EN + AR), plus its design tokens, build/data pipeline, SEO governance, accessibility gate, performance baseline, content corpus, imagery, trust invariants, and the substantial prior redesign work already on disk. This is a **discovery-and-audit-only** deliverable — no source files were modified. Findings carry a strict **VERIFIED** (a command was run / an exact file:line was read) vs **UNVERIFIED** (reasoned/estimated) flag, and where an adversarial verifier refuted or corrected a dimension agent, the corrected value is used and noted. **Date: 2026-06-29.**

---

## Executive summary

- **390 HTML pages, fully accounted for.** A page-family map of 24 families sums to exactly 390, and an independent mutually-exclusive re-partition of all 390 paths assigned 390/390 with zero unassigned and zero double-assigned. `allAccountedFor: true` is **CONFIRMED** by the verifier. (VERIFIED — `find` returned 390; family-sum = 390; countries subtree = 263.)
- **The country corpus is the dominant content gap.** 263 of 390 pages are country/city pages, and they are overwhelmingly thin, near-duplicate template scaffolding: 69 gold-shops pages collapse to **2 distinct skeletons** with **zero real shop listings**, 47 of 69 gold-rate pages share one ~48-word skeleton, and only ~8 flagship capitals are enriched. SEO governance already flags **152 thin-risk indexable pages**. (VERIFIED.)
- **EN/AR parity is met at the string level, NOT at the indexable-document level.** The central dictionary `src/config/translations.js` has perfect key parity (**1144 = 1144, 0 gaps**, CI-enforced), but only **20/390 pages (5.1%)** ship static `<html lang="ar">`; the other 370 (incl. all 263 country pages) are EN shells translated at runtime via `?lang=ar`. The verifier found a **stronger** problem than reported: even with JS on, the 69 city gold-rate pages keep their **H1, intro, and entire FAQ in English** under `?lang=ar` (Dubai gold-rate page = 40 static Arabic chars vs 13,389 in a real AR guide).
- **The hreflang/sitemap layer is broken and self-contradicting.** Committed `public/sitemap.xml` lists only **18 URLs** (0 country pages) against ~372 indexable; page HTML declares AR via non-indexable `?lang=ar` (128 refs) while the sitemap uses `/ar/` paths; `/ar/calculator/` and `/ar/shops/` are sitemapped but **404** (no backing files); and the noindex `/ar/` redirect stub is listed at priority 1.0. (VERIFIED.)
- **Imagery is a total greenfield gap.** Across all 390 pages there are **zero `<img>` tags, zero srcset/picture, zero lazy-loading, zero content alt text**. The repo holds 11 raster files (1 OG image, 5 favicons, 4 orphaned ~1MB screenshots referenced nowhere, 1 zero-byte stray). A single shared OG image serves all 264 pages that declare one. (VERIFIED.)
- **All five trust invariants are currently UPHELD.** AED peg 3.6725 is the only peg value in source (the only near-miss grep hits are latitudes and USD/oz log prices); AED is provably deleted from the FX feed and re-applied from the peg on every path; troy-oz 31.1035 is canonical in core math; spot-vs-retail is rigorously separated; freshness/provenance is enforced product-wide and the static gate passes; spot price **throws rather than fabricates**. (VERIFIED, with two narrow caveats below.)
- **Two invariant caveats (both already disclosed, low/medium severity).** (1) A second troy-oz value `31.1034768` appears in two calculators' fallback path **and in public methodology/FAQ copy**, while the footer/learn-hub show `31.1035` — a user-visible transparency inconsistency. (2) The freshness gate is **allowlist-based** and excludes `admin/` and `server/`, so "every price surface is labeled" is true for known surfaces but not provably exhaustive.
- **Substantial prior redesign work is already on the branch and must be EXTENDED, not rebuilt.** A mature warm-parchment token system (`styles/partials/tokens.css`, 541 lines, 1.25 type scale, `--price-*` semantic aliases, EN/AR font stacks) plus design-feel Areas A–H artifacts (self-hosted fonts, unified price-display primitive, city-gold-rate template) are present, committed, and wired into `styles/global.css`. **A fresh design system is NOT warranted.**
- **Documentation drift hazard.** CHANGELOG/PLAN/PROGRESS claim a "premium neutral re-theme," but the on-disk tokens are still warm parchment (`#fefcf7`). Trust the files, not the narrative.
- **PR #443 security work splits into APPLIED vs STAGED-ONLY.** GREEN defect fixes (redirects, offline paths, footer headings) appear applied; RED-zone items (Supabase RLS migrations 002/003, billing fail-closed, AR hreflang unification "Phase 43") are **staged-only and gated on two blocking owner questions** — do NOT apply them in a design redesign.
- **The build is static-first vanilla ES modules + Vite; the Express server / Supabase / Stripe are NOT in the production serving path** (`API_BACKEND_ENABLED: false`). Production is GitHub Pages serving committed `data/gold_price.json` + client-side compute. The redesign must not assume a backend.
- **Governance gates are green on the pure-Node subset.** `npm run validate` is a 17-check required merge gate; the runnable subset (freshness, seo-meta on 390 files, basic-a11y on 341, inject-schema, inventory-seo 343/341/338, sw-precache, sw-coverage) all PASS today. The full suite (vite, eslint, stylelint, Playwright, pa11y-ci, Lighthouse, 146 test files) is **UNVERIFIED** — devDeps are not installed.

---

## Page-family map

Every one of the 390 HTML files is assigned to exactly one of 24 families. Counts and structure notes are VERIFIED via `find`, targeted regex counts, and per-file `wc -l` / `grep title|lang|dir` reads of 1–3 representatives per family.

| Family | Count | URL pattern | EN/AR status | Representative pages | Notes |
|---|---|---|---|---|---|
| home | 2 | `/` and `/ar/` | EN full 1295-line home; AR a 46-line stub | `index.html`, `ar/index.html` | Asymmetric: AR home is a thin runtime-hydrated shell vs rich EN home |
| live-price-karat | 8 | `/gold-price/{18,21,22,24}k/` + `/ar/…` | EN (4) + **dedicated AR (4)** | `gold-price/24k/index.html`, `ar/gold-price/24k/index.html` | **Best parity family** — AR page (174 lines) slightly longer than EN (147) |
| countries-hub | 1 | `/countries/` | EN only; AR runtime | `countries/index.html` | 309-line directory hub linking all 21 country landings |
| country-landing | 21 | `/countries/{country}/` | EN only; AR runtime | `countries/uae/index.html` | Country overview, `cp-*` block classes; one per country dir |
| country-gold-price | 21 | `/countries/{country}/gold-price/` | EN only; AR runtime | `countries/uae/gold-price/index.html` | noindex,follow; self-canonicals to hub (duplicate-by-design) |
| city-landing | 69 | `/countries/{country}/{city}/` | EN only; AR runtime | `countries/uae/dubai/index.html` | Thin ~96-line city hub funneling to gold-rate/gold-shops |
| city-gold-rate | 69 | `/countries/{country}/{city}/gold-rate/` | EN only; AR runtime | `countries/uae/dubai/gold-rate/index.html` | SEO workhorse (~300 lines); H1/FAQ English-locked even under `?lang=ar` |
| city-gold-shops | 69 | `/countries/{country}/{city}/gold-shops/` | EN only; AR runtime | `countries/uae/dubai/gold-shops/index.html` | Per-city dealer directory; **0 real listings** anywhere |
| country-cities-legacy | 9 | `/countries/{c}/cities/` + `cities/{city}.html` (uae, saudi-arabia, egypt, qatar) | EN only; AR runtime | `countries/uae/cities/dubai.html` (454 lines) | **Older duplicate city template** — canonical/consolidation risk |
| country-markets | 4 | `/countries/{c}/markets/…` (uae, egypt only) | EN only; AR runtime | `countries/uae/markets/dubai-gold-souk.html` (435 lines) | Rich editorial souk guides; expansion candidate |
| calculator | 1 | `/calculator.html` | EN only; AR runtime | `calculator.html` (830 lines) | Flagship value/scrap/zakat tool |
| tracker | 1 | `/tracker.html` | EN only; AR runtime | `tracker.html` (1789 lines) | **Largest single page**; `tracker-pro-v4.css` elevation layer live |
| historical-chart | 2 | `/chart/` and `/ar/chart/` | EN + dedicated AR | `chart/index.html` | Empty on static hosting (loads only `/api/v1/prices/history`) |
| methodology | 3 | `/methodology.html`, `/methodology/`, `/ar/methodology/` | EN ×2 + dedicated AR | `methodology.html` (656), `methodology/index.html` (121) | **TWO distinct EN pages at near-identical URLs** — duplicate/canonical risk |
| pricing-subscribe | 1 | `/pricing.html` | EN only; AR runtime | `pricing.html` (483 lines) | Stripe-backed subscription entry |
| editorial-root | 5 | `/insights.html`, `/invest.html`, `/learn.html`, `/compare.html`, `/shops.html` | EN only; AR runtime | `learn.html`, `shops.html` | Root editorial/hub singletons |
| guide-article | 29 | `content/guides/*.html` (8 flat) + `{slug}/` (10 dir EN) + `ar/` (11) | EN (18) + **dedicated AR (11)** | `content/guides/24k-vs-22k-vs-18k-gold/index.html` | **Flat-legacy vs dir-style duplication** of overlapping topics |
| content-tool | 7 | `content/tools/*.html` (5 EN) + `ar/` (2) | EN (5) + dedicated AR (2) | `content/tools/zakat-calculator.html` | AR parity gap (2 of 5) |
| content-misc | 14 | `content/{various}/` editorial + utility | EN only; AR runtime | `content/embed/gold-ticker.html`, `content/faq/index.html` | Heterogeneous; splittable editorial vs utility/app |
| app-utility | 3 | `/account.html`, `/dashboard.html`, `/developer.html` | EN only; AR runtime | `account.html` | Auth/app surfaces (Supabase/JWT) |
| legal | 2 | `/privacy.html`, `/terms.html` | EN only; AR runtime | `privacy.html` | Standard legal long-form |
| site-utility | 3 | `/404.html`, `/offline.html`, `/design-lab.html` | EN only | `design-lab.html` | Should be noindex; design-lab is dev playground |
| admin | 16 | `/admin/` + `/admin/{section}/` | EN only (internal) | `admin/index.html` (979) | Must be auth-gated + noindex; not public |
| stub-noindex | 30 | stray `index.html` in code/config dirs | EN noindex placeholders | `src/index.html`, `server/index.html` | Identical 63-line "Not a public page" stubs; excluded from sitemap |

**Reconciliation to 390:** 2+8+1+21+21+69+69+69+9+4+1+1+2+3+1+5+29+7+14+3+2+3+16+30 = **390**. Countries subtree check: 69×3 + 21 + 21 + 1 + 9 + 4 = **263**. **`allAccountedFor: true` — CONFIRMED by the adversarial verifier** (390/390 partitioned, 0 unassigned, 0 double-assigned; stub-noindex=30 and admin=16 confirmed excluded from `public/sitemap.xml`).

> **Verifier correction (narrative only, no count change):** the city-landing structure note says the naive regex `countries/{c}/{x}/index.html` "matched 75"; that regex literally matches 96 (it also captures the 21 country-level `gold-price/index.html`). The 75 figure is the depth-2 `index.html` count *excluding* `gold-price/`; subtracting the 6 cities/markets index pages yields the correct **69** true city landings. Final count is right; the intermediate "75" was described imprecisely.

---

## Architecture

### Navigation, internal linking & SEO routing (URLs / canonical / hreflang / sitemap)

The global nav, footer, breadcrumbs, ticker, and spot-bar are **100% client-side-injected** via `mountSharedShell()` / `injectNav` / `injectFooter` (`src/components/site-shell.js:10-19`). Raw delivered HTML contains **zero** `site-nav`/`footer-col` markup (`grep -c` ⇒ 0 on both `index.html` and the deepest country leaf), so the ~30 uniform nav/footer links exist only after JS runs. Mitigations: the homepage ships 22 static `/countries/` body links, and country leaves embed static `BreadcrumbList` JSON-LD (`countries/uae/dubai/gold-rate/index.html:78`).

Canonical coverage is solid: **373/390** files carry `rel=canonical` (the 17 without are 16 admin + offline + 404, all intentional noindex). Country gold-price duplicates correctly self-canonicalise to the country hub with `robots noindex,follow`. `_redirects` is coherent (clean-URL 301s, ISO-2 aliases, city price-consolidation, final `/* → /404.html`).

The serious problems are in the **AR/hreflang + sitemap** layer (VERIFIED throughout):

| Issue | Measurement | Evidence |
|---|---|---|
| Committed sitemap stale & ~95% incomplete | 18 `<loc>`, **0 country pages**, vs ~372 indexable | `grep -c '<loc>' public/sitemap.xml` ⇒ 18; `grep -c countries` ⇒ 0 |
| Build generates a different sitemap, never committed | `build/generateSitemap.js` emits 212 URLs (53 static + 21 hubs + 69 gold-rate + 69 gold-shops) to **ROOT**, not `public/` | scratchpad run ⇒ 212; `package.json:11` build chain; no ROOT/sitemap.xml on disk |
| Two divergent generators | `build/generateSitemap.js` + `scripts/node/generate-sitemap.js`, both `?lang=ar`, disagree with committed `/ar/` | `:59`, `:125` vs `public/sitemap.xml:11` |
| AR hreflang is non-indexable `?lang=ar` | 128 file refs point to `?lang=ar` (same doc, runtime-translated) | `src/seo/hreflang.js:9`; `grep -c lang=ar` ⇒ 128 |
| Homepage ignores its real `/ar/` twin | `index.html:63` declares `hreflang ar=/?lang=ar`; `home.js:1416` runtime-clobbers any correct alternate | `src/seo/hreflang.js:15` removes & re-adds `?lang=ar` |
| Sitemap lists non-existent AR URLs | `/ar/calculator/`, `/ar/shops/` ⇒ **404** (no backing files) | `find ar` = 7 files only |
| noindex `/ar/` stub sitemapped at priority 1.0 | `ar/index.html` is a `location.replace('/?lang=ar')` bouncer | `ar/index.html:26,28,35` |

Internal-link density is healthy on hubs (index 55, learn 37, tracker 27, methodology 27) but thin on deep country leaves (~6–7 static anchors), and several guides are near-orphaned (`gold-making-charges-guide` 3 inbound, `zakat-gold-guide` 5). Because nav/footer are JS-injected, those leaves have effectively no crawlable global navigation.

### Internationalization (EN/AR) & RTL

Arabic is delivered **three ways**, and is **NOT a 390-page mirror**:

1. **Runtime client-side translation** — `src/config/translations.js` (2621 lines; EN 1144 keys === AR 1144 keys, **0 gaps**, 1131/1144 AR values carry Arabic script; the 12 EN-identical values are language-neutral codes/templates). Applied via fail-open `tx()` helpers (`TRANSLATIONS[lang]?.[k] ?? TRANSLATIONS.en?.[k] ?? key`) plus ~294 `data-i18n` HTML attributes. Covers ~370 pages.
2. **Dedicated `/ar/` HTML pages** — 7 (index stub, chart, methodology, gold-price/{18,21,22,24}k). The karat pages are the correct reciprocal-hreflang model.
3. **Dedicated AR content** — `content/guides/ar/` (11) + `content/tools/ar/` (2) = 13 real translated documents.

**Measured static-bilingual coverage: 20/390 = 5.1%** (one of the 7 `/ar/` files, `ar/index.html`, is a noindex redirect stub, so genuine content ≈ 19). RTL CSS is mature: ~432 logical-property usages (margin/padding/inset/border-inline, text-align start/end) and **263 explicit `[dir=rtl]` override rules** across 26 files; ~135 physical residues remain (mostly non-public `admin.css`). A few public physical residues lack RTL overrides (`invest.css:382` `.invest-goal-card`; `shops.css:2258,2273` nearme status/results).

**Parity verdict (adversarial verifier): the site does NOT meet a strict "EN/AR parity + correct RTL" bar today.** String/meaning parity in the central dict = **MET**; indexable-AR-document parity = **NOT MET**. The verifier found a stronger gap than the i18n agent reported: under `?lang=ar`, the 69 city gold-rate pages keep their **H1, intro, and entire FAQ in static English** — the hydrator only translates `country-page-kicker`/`country-faq-title`-style IDs that the `cgr-`/`city-faq-` template never uses, and only fills the live-price widgets. The Dubai gold-rate page = **40 static Arabic chars vs 13,389 in a real AR guide**. With JS disabled, all 370 runtime-AR pages expose EN-only content. (VERIFIED.)

### Build pipeline, data/price flow & server

**Production is static-first GitHub Pages, vanilla ES6 + Vite — no live backend.** `deploy.yml` builds `dist/` and publishes to Pages; it never starts `server.js`. `src/config/constants.js:25` sets `API_BACKEND_ENABLED: false` (the `/api/v1/*` endpoints "always 404" on Pages). The Express server + Supabase + Stripe run only on self-hosted/Replit.

**Price flow:** a scheduled GitHub Action (`gold-price-fetch.yml`) runs a Python provider chain (`gold_api_com → twelvedata_xauusd → fmp_gcusd`), writes `data/gold_price.json` with full provenance/freshness metadata, and commits it; `deploy.yml` republishes every ~30 min during market hours. The browser fetches that JSON network-first (`src/lib/api.js`) and computes all karat × currency prices client-side via `price-calculator.js`.

**Build chain (8 steps):** `extract-baseline → normalize-shops → render-learn-static-fallback → inject-theme-preinit → inject-schema → generateSitemap → vite build`. Vite bundles ~127 non-leaf HTML entries but **excludes `countries/`, `admin/`, `embed/`**, which are copied verbatim and load raw `src/` ES modules; `flatten-css.js` collapses the `global.css` `@import` waterfall on the dist copy at deploy time.

**Governance gate `npm run validate` (17 checks)** is a required CI merge gate and runs on every deploy. The pure-Node subset was **run and PASSES** today: freshness-metadata, seo-meta (390 files), basic-a11y (341), inject-schema (365), inventory-seo (343/341/338), sw-precache (10), sw-coverage (15), theme-preinit (371), audit-content-pages (47). **Note:** `seo-governance.js --check` reports **STALE** but exits 0 (non-strict — warns, does not gate), so duplicate/thin-content regressions can ship undetected. The PWA service worker (`sw.js v17`) precaches 10 shells and treats `/data/gold_price.json` as **network-only** (honors the freshness invariant). One stale label: `server/services/goldPriceService.js:51` hardcodes `source:'goldpricez'` while the data file provider is `gold_api_com` (non-prod path, but a provenance violation to fix).

**Constraint for the redesign:** stay vanilla ES modules + static MPA; do not introduce a framework; any new top-level/renamed page must be added to `sw.js PRECACHE_URLS` + the sw-coverage allow-list, or the gates break; any shared CSS/JS refactor must still work **unbundled** on the ~263 verbatim-copied leaf pages.

---

## Baselines

### SEO (mostly VERIFIED via pure-Node scripts)

The site has a mature, well-governed SEO baseline. All four audit scripts pass; titles/descriptions are 100% unique across the indexable country set; a deliberate noindex/canonical scheme protects against the city/gold-price proliferation. Notable gaps: essentially no Product/Offer structured data, the runtime `?lang=ar` AR strategy, 152 thin-risk pages, and no `llms.txt`.

| Metric | Value | Verified |
|---|---|---|
| `seo-audit.js` pages scanned / with issues | 381 / **0** | VERIFIED |
| `inventory-seo.js --check` | 343 files, 341 canonical, 338 JSON-LD | VERIFIED |
| `check-seo-meta.js` | PASS, 390 files | VERIFIED |
| `seo-governance.js` totals | 376 pages, 239 indexable, **152 thin-risk**, 0 duplicate clusters, 0 missing canonical/hreflang/schema | VERIFIED |
| noindex pages | 151 (96 city index + 21 country gold-price + 16 admin + utilities) | VERIFIED |
| Deployed sitemap (build-generated) | **212 URLs** | VERIFIED (scratchpad run) |
| Committed `public/sitemap.xml` | **18 URLs** (stale placeholder) | VERIFIED |
| Country title uniqueness | gold-rate 69/69, gold-shops 69/69, hubs 21/21 | VERIFIED |
| Product / Offer schema | **0 Product**, 1 Offer | VERIFIED |
| OG / Twitter coverage | og:title 369, twitter:card 369, og:image 264 | VERIFIED |
| `hreflang ar=?lang=ar` on country pages | 263 | VERIFIED |
| `llms.txt` | **absent** | VERIFIED |

### Accessibility — WCAG 2.2 AA (static VERIFIED; runtime UNVERIFIED)

The CI a11y gate (`check-basic-a11y.js`) **PASSES** (exit 0): 341 public files, 0 images, 0 iframes, enumerated light/dark contrast pairs all ≥4.5:1, plus img/iframe/input hygiene. Static foundation is strong and has materially advanced past the stale `reports/a11y-audit.md` (the prior 27 missing-h1 and 13 missing-skip-link findings are **resolved**). Residual static risks: a sub-24px tap target and a light-mode freshness-label contrast failure. **All runtime ARIA/keyboard/focus-trap behavior is UNVERIFIED** (no devDeps for pa11y/Playwright/axe/Lighthouse).

| Metric | Value | Verified |
|---|---|---|
| `check-basic-a11y.js` | PASS (exit 0) | VERIFIED |
| `<img>` / `<iframe>` in public HTML | 0 / 0 | VERIFIED |
| Gate contrast pairs (light/dark) | 13/13 + 10/10 pass | VERIFIED |
| `lang` attribute coverage | 390/390 | VERIFIED |
| `dir` missing | 15 (all admin, internal) | VERIFIED |
| Multiple `<h1>` (public) | 0 | VERIFIED |
| `countries/**/index.html` with h1 | 256/256 | VERIFIED |
| Global `:focus-visible`, reduced-motion, 44px touch min | present | VERIFIED (`base.css:777,860`; `utilities.css:771`) |
| **karat-strip copy button** | **22×22px — fails WCAG 2.5.8 (24px min)** | VERIFIED (`home.css:2601-2606`) |
| **Freshness "stale/amber" label** | `--color-amber #f59e0b` ⇒ **2.09:1, fails AA** (light mode; not in gate's pair list) | VERIFIED (`home.css:768,789`) |
| Runtime ARIA tab/keyboard/focus-trap | **UNVERIFIED** | — |

### Performance / asset weight (source bytes VERIFIED; Core Web Vitals UNVERIFIED)

Production posture is reasonable (terser + cssMinify, subsetted woff2 with font-display:swap, inlined critical CSS, flattened `@import` chain, zero `<img>` on top pages). Source weights are heavy unminified; the biggest concrete risks are `tracker.html` (92KB inline), `translations.js` (184KB shipped to every hydrating page), and the **non-blocking Lighthouse config with no Core Web Vitals budgets**.

| Metric | Value | Verified |
|---|---|---|
| Source CSS total (43 files) | 960,140 B (~937 KB) | VERIFIED |
| Source JS total (src+root+assets) | 1,568,234 B (~1.53 MB) | VERIFIED |
| Total HTML payload (390) | 4,165,271 B (~3.97 MB), avg 10.7 KB | VERIFIED |
| `tracker.html` | 92,681 B | VERIFIED |
| `index.html` | 62,505 B | VERIFIED |
| Largest HTML | `admin/social/index.html` 93,042 B (auth-gated) | VERIFIED |
| Largest CSS | `tracker-pro.css` 124,415 B; `components.css` 105,281 B | VERIFIED |
| Largest JS | `translations.js` 183,506 B; `shops.js` 105,319 B | VERIFIED |
| Fonts (5 woff2, subsetted) | ~170 KB | VERIFIED |
| **Orphaned screenshots** | 4 PNGs ~4.4 MB, **0 references** | VERIFIED |
| Lighthouse config | desktop-only, all assertions **`warn`**, **no LCP/CLS/INP budgets**, numberOfRuns 1 | VERIFIED |
| Core Web Vitals (LCP/CLS/INP) | **UNVERIFIED estimates** (CLS low, LCP/INP moderate on tracker) | UNVERIFIED |

### Content quality (VERIFIED via scratchpad measurement)

Hand-written hubs are excellent (`methodology.html` is a model of provenance honesty; `learn.html` = 1486 words / 15 guides; guides median ~1356 words). The problem is the 263-page country corpus. The two project content scripts **pass but are misleading**: `audit-content-pages.js` scans only `content/` (47 files) and never touches country pages; `enrich-placeholder-pages.js --check` keys off a literal placeholder marker, not thinness.

| Metric | Value | Verified |
|---|---|---|
| `audit-content-pages.js` | PASS (47 files, **country pages not scanned**) | VERIFIED |
| Country gold-shops | 69 pages, median **39 words**, **2 skeletons**, **0 listings** | VERIFIED |
| Country gold-rate | 69 pages, median 51 words; **47/69 at ~48-word floor**; ~8 capitals enriched | VERIFIED |
| Country gold-price hubs | 21 pages, 2 skeletons | VERIFIED |
| `data-i18n` hooks across 263 country pages | **0** (yet all declare `hreflang ar`) | VERIFIED |
| Placeholder-marker grep | 247 hits, mostly false positives; substantive = 18 honest "coming soon" + 1 affiliate comment | VERIFIED |
| Lorem-ipsum / fabricated text | **0** | VERIFIED |

### Imagery (VERIFIED — total greenfield gap)

| Metric | Value | Verified |
|---|---|---|
| `<img>` across 390 pages | **0** | VERIFIED |
| srcset / `<picture>` / lazy-loading | **0** | VERIFIED |
| Content-image alt text | **0** | VERIFIED |
| Raster files in repo | 11 PNG (1 OG, 5 favicons, 4 orphaned screenshots, 1 zero-byte stray) + 2 SVG | VERIFIED |
| WebP / AVIF / JPEG / GIF | **0** | VERIFIED |
| Distinct OG images | **1** shared across all 264 pages declaring it | VERIFIED |
| OG image | 1200×630, 26 KB PNG; `og:image:alt` localized to AR on `/ar/` karat pages | VERIFIED |
| `media-governance.js` | 17-line runtime lazy-load shim, effectively a no-op (no images exist) | VERIFIED |

---

## Invariants & trust audit

| Invariant | Status | Evidence |
|---|---|---|
| **AED peg = 3.6725** (never from FX API) | **UPHELD — VERIFIED & CONFIRMED by verifier** | Defined once (`constants.js:9`); only near-miss grep hits are latitudes + USD/oz log prices. AED deleted from FX response and re-applied on every path: `api.js:261-263`, `fxService.js:24,55,68,78`, `pricingEngine.js:42`, `price-calculator.js:59,75` |
| **Troy oz = 31.1035 g** (canonical in math) | **UPHELD in math; AT-RISK in copy — PARTIAL (verifier)** | Canonical `constants.js:10` used by core engines; no 28.35/31.1 in any calc. **But** `31.1034768` is hardcoded in `investment-calculator.js:8` + `scrap-calculator.js:8` (fallback) **and shown in public copy** `methodology-live.js:89,95`, `faq-schema.js:11,22`, `translations.js` — vs `31.1035` in footer/learn-hub. User-visible divisor inconsistency (~7e-7, never affects live results) |
| **Spot/reference vs retail/jewellery separation** | **UPHELD — VERIFIED & CONFIRMED** | Making charges always "illustrative" with disclaimer, never live quotes (`ShopVsReferencePanel.js:1-4,43-47`); `market-intel.js:1-7` documented "NOT live… reference only"; shops per-karat uses peg (`shops.js:2283-2285`); calculator copy frames outputs as "spot-linked reference estimates, not final retail quotes" |
| **Freshness / provenance labels mandatory** | **UPHELD for known surfaces; AT-RISK on exhaustiveness — PARTIAL (verifier)** | Truth-first state machine `freshness-policy.js:17-58` (live≤5s/cached≤60s/delayed≤300s/estimated/closed/fallback); gate `check-freshness-metadata.js` PASSES (exit 0). **But** gate is allowlist-based (9 selectors, `:19-29`) and **excludes `admin/` and `server/`** (`:8-17`) — coverage not provably exhaustive. `/chart/` renders empty on static hosting |
| **No fabricated data + honest fallback states** | **UPHELD — VERIFIED & CONFIRMED** | Spot has no synthetic fallback — fetches pipeline JSON → localStorage → **throws** `NetworkError` (`api.js:192-239`); calculator inits `spotUsdPerOz:0`, every render guarded (`calculator.js:63,471,595,714`); the only hardcoded literal `DEFAULT_SPOT_USD_OZ=2400` is a **labeled editable fallback** (stale vs ~4065 — UX note, not fabrication); history layered + source-tagged (`historical-data.js:5-55`) |

**Verifier overall:** could not refute any trust invariant as violated. The only material nuances — the `31.1035` vs `31.1034768` public-copy split and the non-exhaustive allowlist freshness gate — were already disclosed by the dimension agent and align with the verifier. **EN/AR pricing-token parity (`parity-diff-scan`) remains UNVERIFIED** (Playwright not installed), so AR runtime-translation parity for peg/divisor copy could not be independently checked.

---

## Prior-work reconciliation

Deep, multi-agent prior redesign effort is **largely already materialized on the current redesign branch** (`claude/goldtickerlive-redesign-jlne1s`), not pending. Three overlapping programs:

1. **Design-feel Areas A–H** (from `cursor/design-feel-revamp-4d4a`): tokens/type system, self-hosted fonts, unified price-display primitive, chart theming, city-gold-rate template, motion, perf. **VERIFIED present, committed, and wired** — `styles/partials/{fonts,price-display}.css` and `styles/pages/city-gold-rate.css` are `@import`-ed by `styles/global.css:1,2,12`; `tokens.css` has the Source Sans 3 + Cairo stacks, 1.25 ratio, and `--price-up/--price-down/--text-muted/--surface-raised` aliases; self-hosted woff2 under `assets/fonts/`; migration scripts present. These are **ADDED relative to `origin/main`** — treat as foundation to extend/verify, not re-implement.
2. **PR #443 `claude/elegant-cori-lyo379`** (security/schema/RLS/Stripe/SEO): GREEN defect fixes (D1 redirects, D2 offline paths, D5 dead X-Frame meta, D6 footer headings) appear applied; D7/D9 filed as plans. **RED-zone items are STAGED-ONLY**: `supabase/migrations/002_admin_rls_lockdown.sql`, `003_public_insert_hardening.sql`, `verify.sql`, billing fail-closed, Leaflet SRI, Lighthouse gate, **Phase 43 `/ar` hreflang unification**, GDPR export — gated on two blocking owner questions (are Supabase signups enabled? what writes `public.orders`?). **Do NOT apply these in a design redesign.**
3. **Tracker revamp programs** (20/30/50-phase): the 30-phase visual revamp is marked complete; `styles/pages/tracker-pro-v4.css` (491 lines, "Design System v4 elevation layer") is live (`@import`-ed by `tracker-pro.css:5`). Preserve the honesty logic (classifyDelta + flat band, **no default up=green**, AA-legible movement colours on the always-dark hero).

**Preserve / extend:** the warm-parchment token system (`tokens.css`, 541 lines), the price-display primitive, self-hosted fonts, the city-gold-rate template, all 7 trust components (note: `FreshnessStrip.js` is imported in **0 files** — revive or formally retire it), `design-lab.html` as the prototyping surface, and the AGENTS.md six non-negotiables. **Rebuild candidates still open:** Homepage (#13) and Tracker (#14) per `docs/plans/README.md` — slot into existing REVAMP_PLAN.md Track C/D, do not fork.

**Conflicts to watch:** (a) **documentation drift** — CHANGELOG/PLAN claim a "premium neutral" palette, but on-disk tokens (and `origin/main`) are still warm parchment `#fefcf7` — trust the file; (b) ~430 design-relevant files diverge from `origin/main` with an empty merge-base, so future merge is non-trivial; (c) generated surfaces (69 gold-rate + 264 country files) must be changed **through the generator** (`consolidate-country-pages.js`), never hand-edited; (d) §14 non-goals forbid SPA/framework/chart-lib swap.

---

## Risk register

| # | Risk | Severity | Affected area | Mitigation |
|---|---|---|---|---|
| 1 | Committed `public/sitemap.xml` advertises only 18 of ~372 indexable URLs (0 country pages); the build-generated 212-URL sitemap is never committed | **Critical** | SEO discovery / crawl budget | Consolidate to one generator that writes `public/sitemap.xml`; gate `check-sitemap-coverage` in CI; commit a complete sitemap covering all country/city pages |
| 2 | Three-way hreflang contradiction (HTML `?lang=ar` vs sitemap `/ar/` vs runtime override) + 404 AR sitemap URLs (`/ar/calculator/`, `/ar/shops/`) + noindex `/ar/` stub at priority 1.0 | **High** | AR SEO / hreflang clustering | Pick ONE AR strategy; fix homepage hreflang + remove `home.js` runtime clobber; drop 404 AR URLs and the stub from the sitemap |
| 3 | Indexable-AR-document parity NOT met: 370/390 pages runtime-only; city gold-rate H1/intro/FAQ stay **English even with JS on** | **High** | EN/AR parity invariant | Either build real `/ar/` mirrors for high-value pages or extend the hydrator to translate `cgr-`/`city-faq-` markup; add `data-i18n` to country templates or drop misleading `hreflang ar` |
| 4 | 263 thin, near-duplicate, indexable country pages (gold-shops 0 listings; 47/69 gold-rate at ~48-word floor); 152 thin-risk flagged | **High** | Content quality / thin-content/doorway SEO | Tier the corpus; enrich major cities; noindex/consolidate empty long-tail; give the 51 silent shop stubs an honest empty-state; extend content audit to scan `countries/` |
| 5 | Applying PR #443 RED-zone RLS migrations / hreflang changes without owner answers could leave an exploitable RLS hole or break Stripe billing | **High** | Security / billing / data integrity | Keep strictly read/UI-side; do not apply `migrations/002,003`, `verify.sql`, billing fail-closed, or Phase 43 until owner answers the two blocking questions |
| 6 | Total imagery greenfield: 0 content images, 1 shared OG, no AVIF/WebP pipeline, no zero-CLS dimension governance | Medium | Imagery / social sharing / LCP | Build per-template OG pipeline + AVIF/WebP + bilingual alt + mandatory width/height before introducing any editorial imagery; delete 4.4 MB orphaned screenshots |
| 7 | Public-facing divisor inconsistency: methodology/FAQ show `31.1034768`, footer/learn-hub show `31.1035` | Medium | Trust / transparency | Reconcile copy to one divisor; replace literal with `CONSTANTS.TROY_OZ_GRAMS`; add anti-drift lint |
| 8 | Freshness gate is allowlist-based and excludes `admin/`/`server/` — "every price surface labeled" not provably exhaustive | Medium | Freshness invariant | Periodically reconcile `PRICE_MARKERS` against new templates; stop blanket-excluding admin |
| 9 | `/chart/` renders empty on static hosting (loads only `/api/v1/prices/history`, `API_BACKEND_ENABLED:false`) | Medium | Trust perception | Point chart at static history layers or hide the surface when backend disabled |
| 10 | `seo-governance.js --check` is non-strict (warns, exits 0) — duplicate/thin regressions can ship undetected during a 390-page redesign | Medium | SEO governance / CI | Regenerate the snapshot and promote to `--strict` |
| 11 | All runtime a11y (ARIA keyboard, focus trap, computed dynamic contrast, tap-target geometry) + Core Web Vitals are UNVERIFIED (no devDeps) | Medium | A11y / performance | Run pa11y/axe/Lighthouse (mobile) on the served build in a devDeps-enabled phase before any AA/CWV claim |
| 12 | Sub-24px karat-strip copy button; light-mode amber freshness label at 2.09:1 | Low–Med | WCAG 2.2 AA | Bump hit area to ≥24px; replace amber text token with an AA-passing one and add it to the gate's contrast list |
| 13 | Documentation drift ("premium neutral" claim) + generated-page fragility + orphaned `FreshnessStrip.js` | Low–Med | Prior-work reconciliation | Trust files over docs; route page changes through generators; revive or retire `FreshnessStrip.js` |

---

## Recommendations & sequencing into Phase 1+

> Phase 0 is discovery only — this section orders the *work*, it does not design the new system.

**Design-system decision:** **EXTEND the existing warm-parchment token system, do NOT start fresh.** A mature `tokens.css` (541 lines, semantic `--price-*` aliases, dual EN/AR font stacks) is already adopted and wired; design-feel Areas A–H are delivered foundation. Add a component-token layer between primitives and `components.css`, and prototype in `design-lab.html` against live tokens.

1. **Phase 1 — Foundation verification & SEO plumbing (highest leverage, lowest risk).** Consolidate to one sitemap generator that writes `public/sitemap.xml` and gate it in CI (fixes Risk 1, the single highest-impact SEO fix). Resolve the hreflang strategy and fix the homepage + remove the `home.js` clobber (Risk 2). Regenerate `reports/seo/governance.json` and promote `--check` toward `--strict`. Verify the A–H artifacts render before changing them.
2. **Phase 2 — i18n/AR decision & RTL hardening.** Per the owner gate, either build real `/ar/` mirrors for high-value pages or fix the hydrator to translate the `cgr-`/`city-faq-` templates and drop misleading `hreflang ar` where no AR body exists (Risk 3). Convert the few public physical CSS residues to logical properties; extend `i18n-local-dict-parity.test.js` to all 21 page-local dicts.
3. **Phase 3 — Content depth on the 263 country pages.** Tier the corpus, enrich major cities using `methodology.html`/`aed-peg-explained.html` as the voice/accuracy template, give silent shop stubs honest empty-states, and route all changes through `consolidate-country-pages.js`. Extend the content audit to scan `countries/`. Fact-check any AI-assisted enrichment (no fabricated local detail).
4. **Phase 4 — A11y & performance fixes.** Bump the karat copy button to ≥24px; fix the amber freshness contrast and add the token to the gate; add font preload to `tracker.html`; investigate splitting `translations.js` so the full key table isn't parsed on every EN page.
5. **Phase 5 — Imagery system.** Build the per-template OG + AVIF/WebP pipeline with mandatory dimensions and bilingual alt; delete the 4.4 MB orphaned screenshots.
6. **Phase 6 — Homepage (#13) & Tracker (#14) rebuilds.** Slot into REVAMP_PLAN Track C/D; honor §14 non-goals and the no-banners/no-urgency/labeled-reference-price trust guardrails; preserve `tracker-pro-v4.css` and the classifyDelta honesty logic.
7. **Phase 7 — Full verification (requires devDeps).** Install devDeps; run `npm test` (146 files), `npm run build`, Lighthouse mobile, pa11y/axe over the top templates, and linkinator on `dist/`. Confirm all UNVERIFIED items below.

**Throughout:** keep `npm run validate` green; bump `sw.js CACHE_NAME` + `PRECACHE_URLS` for any new/renamed page; hold every trust invariant; never apply PR #443 RED-zone migrations.

---

## VERIFIED vs UNVERIFIED ledger

**VERIFIED — actually run / exact file:line read this audit:**
- `find` ⇒ 390 HTML files; family-sum = 390; countries subtree = 263; full 390/390 mutually-exclusive partition (0 unassigned, 0 double-assigned).
- Pure-Node gates run & passing: `check-freshness-metadata`, `check-seo-meta` (390), `check-basic-a11y` (341), `audit-content-pages` (47), `inject-schema --check` (365), `inventory-seo --check` (343/341/338), `check-sw-precache`, `check-sw-coverage`, `inject-theme-preinit --check` (371), `seo-audit.js` (381/0).
- `seo-governance.js` totals (376/239/152/0…); `build/generateSitemap.js` ⇒ 212 URLs (scratchpad); committed sitemap = 18 `<loc>`.
- `translations.js` parse: 1144 EN === 1144 AR keys; i18n pure-node test suites pass (sitewide-guard 3/3, sitemap-parity 3/3).
- Asset weights (du / wc): CSS 937 KB, JS 1.53 MB, HTML 3.97 MB; per-file sizes (tracker 92,681 B etc.); fonts ~170 KB; 4.4 MB orphaned screenshots with 0 references.
- Imagery: 0 `<img>`/srcset/picture/lazy/alt; 11 raster + 2 SVG inventory; 1 shared OG.
- Invariant code reads: AED peg single value + delete-from-FX paths; troy-oz 31.1035 in core math + the 31.1034768 copy split; spot-vs-retail separation; spot-throws-not-fabricates; `DEFAULT_SPOT_USD_OZ=2400` labeled fallback.
- Prior-work artifacts on disk + `git diff origin/main..HEAD`; staged RED-zone migrations present; `tracker-pro-v4.css` live; warm-parchment tokens (vs stale "premium neutral" doc).

**UNVERIFIED — reasoned / estimated, must be confirmed in a devDeps-enabled phase:**
- Core Web Vitals (LCP/CLS/INP) — Lighthouse/Playwright cannot run (no devDeps); production minified+gzipped wire weights unmeasured.
- Runtime a11y: ARIA tab keyboard pattern, mobile-drawer focus trap/restore, live-region announcements, rendered focus order, actual tap-target geometry at 320/375; full token-on-surface contrast sweep (gate is an allowlist).
- EN/AR runtime parity (`parity-diff-scan`, `leaked-key-scan`) — need `@playwright/test`; AR peg/divisor copy parity unverified.
- `i18n-local-dict-parity.test.js` (needs `acorn`); the 146-file `node --test` suite (needs node_modules); eslint/stylelint/vite build.
- That the build emits `/ar/calculator/` & `/ar/shops/` — reasoned absent (build not run), but no render step found.
- City-specific FAQ facts (VAT rates, market names, hallmarking bodies) were read but **not fact-checked** against primary sources.

---

## Open questions for the owner (Phase 0 GATE)

1. **AR strategy (blocks Phase 2):** Commit to ONE of — (a) real `/ar/` document URLs for high-value pages (the model the 7 `/ar/` karat pages already follow), or (b) `?lang=ar` runtime translation with honest hreflang (and dropping misleading `hreflang ar` where no AR body exists). Today the site advertises Arabic it does not deliver as indexable documents.
2. **Scope of the 263 country pages (blocks Phase 3):** Enrich-and-keep (which tiers?), noindex/consolidate the empty long-tail, or a hybrid? And: is real, verified gold-shop data coming, or should all 69 gold-shops pages be noindexed until it exists? (No fabricated local detail.)
3. **Imagery budget & licensing (blocks Phase 5):** Per-template/per-country OG cards (bounded template set vs hundreds of committed PNGs)? Any editorial photography — and is it original/licensed? Self-host Leaflet/map tiles?
4. **Design system (blocks Phase 1 framing):** Confirm **extend** the existing warm-parchment tokens (recommended) vs any appetite for a re-theme — and confirm the "premium neutral" CHANGELOG claim is abandoned in favor of the on-disk palette.
5. **PR #443 RED-zone (blocks any security/billing/hreflang change):** (a) Are Supabase email signups enabled? (b) What writes `public.orders` in static production? Until answered, the RLS lockdown, fail-closed billing, and Phase 43 hreflang unification stay staged.
6. **Branch/merge sequencing:** With ~430 files diverged from `origin/main` (empty merge-base), which lands first and how is prior work preserved across the merge?
7. **`/chart/` on static hosting:** Acceptable to point it at static history layers, or hide it when `API_BACKEND_ENABLED:false`? It currently renders empty in production.

---

## Phase 0 gate — owner decisions (2026-06-29)

The owner reviewed this audit and approved it. Resolved decisions (these govern Phases 1+):

| # | Decision | Owner's choice |
|---|---|---|
| 1 | **Gate** | **Approved**; commit `redesign/AUDIT.md` as the Phase 0 checkpoint, then hold for a separate "go" before Phase 1. |
| 2 | **Design system** | **EXTEND the existing warm-parchment token system.** All Phase 1 design directions build on `tokens.css` / price-display primitive / EN+AR font stacks — no fresh re-theme. The "premium neutral" doc claim is abandoned in favor of the on-disk palette. |
| 3 | **Arabic strategy** | **Hybrid:** build real `/ar/` document mirrors for high-value pages (home, karat, calculator, methodology, flagship cities); keep `?lang=ar` runtime translation elsewhere; **remove misleading `hreflang ar` wherever no Arabic body exists.** |
| 4 | **263 country/city pages** | **Tiered hybrid:** enrich major cities/capitals with real content; noindex/consolidate the thin long-tail; give gold-shops pages an honest empty-state until real listings exist. **No fabricated local detail.** |

**Still open — deferred to their phase gates (do not act on these yet):**
- **Imagery budget & licensing** (blocks Phase 5): per-template OG scope, original vs licensed editorial photography, self-host Leaflet/tiles?
- **PR #443 RED-zone** (blocks any security/billing/hreflang change): (a) Are Supabase email signups enabled? (b) What writes `public.orders` in static production? RLS lockdown, fail-closed billing, and Phase 43 hreflang unification stay staged until answered.
- **Branch/merge sequencing** (~430 files diverged from `origin/main`, empty merge-base): land order and prior-work preservation.
- **`/chart/` on static hosting:** point at static history layers vs hide when `API_BACKEND_ENABLED:false`.
