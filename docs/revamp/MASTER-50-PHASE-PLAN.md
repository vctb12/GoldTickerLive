# GoldTickerLive — 50-Phase Revamp Execution Pack

**Purpose:** A complete A-to-Z revamp broken into 50 phases. **Each phase = exactly one PR.** Every
phase ships a paste-ready Claude Code prompt you run inside your repo. Phases are ordered so
dependencies come first; you can also run any phase standalone.

**Built from:** the live-site audit (`goldtickerlive-audit-plan.md`). Architecture stays static:
vanilla ES6 + Vite + Express + Supabase. **No framework migration, no SSR, no build-tool swap** —
that guardrail is baked into every prompt.

---

## How to use this pack

1. Open Claude Code in the GoldTickerLive repo, on an up-to-date `main`.
2. Copy the **PROMPT** block for the phase and paste it in. It already tells Claude Code to read
   first, branch, implement the smallest correct change, self-verify, and open the PR.
3. Review the PR, merge, pull `main`, move to the next phase.
4. Asset phases (43–47) include **Higgsfield generation prompts** — generate the asset, drop it in
   `/public` or `/src/assets`, then run the phase prompt to wire it in.

**Conventions used in every prompt**

- Branch: `phaseNN-short-slug` off latest `main`.
- One PR per phase; PR body must list: what changed, files touched, audit finding addressed, how it
  was verified, and any risk/rollback.
- Guardrails (repeat in each): _stay on the current static stack; do not add a frontend framework,
  SSR, or new build tool; do not change unrelated files; preserve existing working behavior; never
  label non-live data as live._
- Verification: run the existing build + lint + any tests; for UI, take before/after screenshots at
  390px, 768px, 1024px, 1440px in both EN and AR; for SEO, validate generated HTML/JSON-LD.

**Shared kickoff prompt (run ONCE before Phase 1)**

```
You are doing a phased revamp of GoldTickerLive (static: vanilla ES6 + Vite, Express, Supabase, bilingual EN/AR, ~390 pages, gold price reference site). Trust and clarity are the top priority; spot/reference prices must never be confused with retail; the AED/USD peg is fixed at 3.6725; non-live values must be clearly labeled.

First, with NO code changes, produce a short repo map: where pages are generated, where the nav/footer/ticker shell lives, where the price/FX fetch + freshness logic lives, where i18n/Arabic strings live, where SEO meta/canonical/hreflang/JSON-LD are emitted, the Vite config + build output structure, and how routes map to files. Save it as docs/REPO-MAP.md and open a PR `phase00-repo-map`. Do not change app behavior.
```

Run Phase 00 first so later prompts can reference real paths.

---

# WAVE 0 — Foundation & safety (Phases 1–5)

## Phase 1 — Regression safety net

- **Maps to:** "preserve existing working behavior" guardrail.
- **Branch:** `phase01-baseline-tests` · **PR:** Add smoke + price-math + freshness tests

```
Read docs/REPO-MAP.md and the price/FX/freshness modules. WITHOUT changing app behavior, add a lightweight test harness using the project's existing tooling (or Vitest if none exists) covering: (1) the core price formula (XAU/USD ÷ 31.1035 × karat/24 × FX), asserting 24K/22K/21K/18K and the AED peg 3.6725 produce exact known values; (2) freshness-state resolution (live/delayed/cached/stale/fallback/unavailable) given timestamps; (3) a DOM smoke test that the homepage shell (nav, ticker, footer) mounts. Add an npm script `test`. Do not refactor app code; only add tests + minimal exports if needed. Open PR phase01-baseline-tests with coverage notes. Stay on the current static stack; no framework migration.
```

- **Accept:** `npm run build` + `npm test` green; tests fail if the peg or formula is altered.

## Phase 2 — CI pipeline (build + lint + test on PR)

- **Branch:** `phase02-ci` · **PR:** GitHub Actions CI for PRs

```
Read .github/workflows. Add a CI workflow that runs install, build, lint, and the Phase 1 tests on every PR and on main. Do not touch the existing hourly gold-price fetch workflow. Cache node_modules. Fail the PR on build/lint/test errors. Open PR phase02-ci. No app behavior changes; static stack only.
```

- **Accept:** CI runs and is required; existing price-fetch cron untouched.

## Phase 3 — Design tokens single source of truth

- **Maps to:** P1-4 contrast, P2-5 vocabulary, brand consistency.
- **Branch:** `phase03-design-tokens` · **PR:** Centralize color/spacing/type tokens

```
Read the CSS (critical.css, global.css, index.css) and any inline styles. Extract the de-facto design system into a single tokens layer (CSS custom properties): color (light + dark themes), spacing scale, type scale, radii, shadows, z-index, and freshness-state colors. Replace hardcoded hex/spacing in the shared shell (nav/footer/ticker/spot bar) with tokens. DO NOT change visual output yet — this is a refactor; screenshots before/after must match. Document tokens in docs/DESIGN-TOKENS.md. Open PR phase03-design-tokens. Static stack only; no visual regressions.
```

- **Accept:** Pixel-equivalent before/after; all shell colors reference tokens.

## Phase 4 — Lighthouse + a11y CI budget (report-only)

- **Branch:** `phase04-quality-budgets` · **PR:** Lighthouse CI + axe report (non-blocking)

```
Add Lighthouse CI and axe-core accessibility checks that run against the built site for homepage, /calculator, /methodology, and one country page, in EN and AR. Output reports as CI artifacts; set them report-only (non-blocking) for now with target budgets (Perf ≥85 mobile, A11y ≥95, CLS <0.1). Do not change app code. Open PR phase04-quality-budgets. Static stack only.
```

- **Accept:** Reports generated as artifacts; baselines recorded in PR.

## Phase 5 — Page/route inventory + audit map

- **Branch:** `phase05-page-inventory` · **PR:** Generate page inventory + redirect/canonical map

```
Crawl the built output (or the generation config) and produce docs/PAGE-INVENTORY.csv listing every generated URL, its EN/AR status, current <title>, meta description, canonical, and hreflang. Flag: extensionless vs .html mismatches, missing AR counterpart, duplicate canonicals, and missing meta. This is documentation only — no app changes. Open PR phase05-page-inventory. It will drive Waves 1–2.
```

- **Accept:** Complete CSV; flags match audit (canonical `/` vs `/calculator.html`, AR gaps).

---

# WAVE 1 — P0 Bilingual & SEO foundation (Phases 6–14)

## Phase 6 — Canonical strategy normalization

- **Maps to:** P0-2 (canonical `/` vs `/calculator.html`).
- **Branch:** `phase06-canonical` · **PR:** One canonical convention sitewide

```
Per docs/PAGE-INVENTORY.csv, every page must declare a canonical equal to its own clean, extensionless URL (e.g. https://goldtickerlive.com/calculator). Fix the generator/template so canonicals are self-referential and consistent. Add server/host redirects (or static redirect config) so /calculator.html and trailing-slash variants 301 to the canonical form. Read how canonicals are currently emitted before editing. Open PR phase06-canonical with a table of before/after canonicals. Static stack only.
```

- **Accept:** Each page's canonical = its own clean URL; `.html` 301s to clean URL.

## Phase 7 — Distinct Arabic URLs (static pre-render)

- **Maps to:** P0-1 (Arabic not indexable).
- **Branch:** `phase07-ar-routes` · **PR:** Generate static `/ar/...` pages

```
Today the Arabic experience is a client-side toggle with no separate URL (title/meta stay English). Without leaving the static Vite build, generate a distinct Arabic URL for every page at build time under /ar/ (e.g. /ar/, /ar/calculator, /ar/methodology, /ar/<country>). Each AR page must render server-side HTML with <html lang="ar" dir="rtl">, fully translated visible content reusing the existing AR string set, and the same data/freshness logic. Keep the in-page language toggle but make it NAVIGATE between the EN and AR URLs (not just swap client state). Read the i18n/string modules and the generation pipeline first. Open PR phase07-ar-routes. Do not regress EN pages; static stack only.
```

- **Accept:** `/ar/calculator` loads server-rendered Arabic with `lang=ar dir=rtl`; toggle navigates
  between EN/AR URLs.

## Phase 8 — Localized titles & meta per locale

- **Maps to:** P0-1 (English title in AR mode).
- **Branch:** `phase08-localized-meta` · **PR:** Per-locale `<title>`/description/OG

```
For every AR page from Phase 7, emit Arabic <title>, meta description, og:title/description/locale (ar_AE), and twitter card. EN pages keep English equivalents with og:locale en_AE plus og:locale:alternate ar_AE. Centralize the per-page, per-locale metadata in one data source so titles/descriptions are authored once. Read how meta is emitted before editing. Open PR phase08-localized-meta. Static stack; no behavior change beyond meta.
```

- **Accept:** `document.title` is Arabic on AR pages; OG locale correct both sides.

## Phase 9 — Reciprocal hreflang + x-default

- **Maps to:** P0-1 (hreflang points to non-existent `/?lang=ar`).
- **Branch:** `phase09-hreflang` · **PR:** Correct bilingual hreflang pairs

```
Replace the current hreflang (which points ar to /?lang=ar that the toggle never produces) with reciprocal, self-consistent pairs on EVERY page: en -> clean EN URL, ar -> the new /ar/ URL, x-default -> EN. Both the EN and AR versions of a page must reference each other identically. Read Phase 6/7 outputs first. Validate all pairs resolve (200, not redirected). Open PR phase09-hreflang with a validation table. Static stack only.
```

- **Accept:** Every EN/AR pair cross-references; no hreflang targets 404/redirect.

## Phase 10 — XML sitemap(s) with locale alternates

- **Branch:** `phase10-sitemap` · **PR:** Build-time sitemap with hreflang

```
Generate sitemap.xml (split if >50k URLs) at build time from PAGE-INVENTORY, including every EN and AR clean URL with xhtml:link alternate (hreflang) entries. Add lastmod. Reference it from robots.txt. Do not include redirect/.html variants. Open PR phase10-sitemap. Static stack only.
```

- **Accept:** Sitemap lists clean EN+AR URLs with alternates; linked from robots.

## Phase 11 — robots.txt + indexing hygiene

- **Branch:** `phase11-robots` · **PR:** robots.txt + noindex on thin/util URLs

```
Add/curate robots.txt: allow content, point to sitemap, disallow query-param duplicates and any utility endpoints. Ensure parametered URLs (e.g. /calculator?w=10) are canonicalized to the clean page (not separately indexed). Read current robots and how query state is reflected in canonical. Open PR phase11-robots. Static stack only.
```

- **Accept:** Param URLs canonicalize to base; sitemap referenced; no content blocked.

## Phase 12 — JSON-LD expansion & validation

- **Maps to:** strengthens existing Organization/WebSite/FAQPage.
- **Branch:** `phase12-jsonld` · **PR:** Add/repair structured data

```
Audit existing JSON-LD (homepage has Organization, WebSite, FAQPage). Add appropriate schema sitewide: BreadcrumbList on inner pages, WebSite SearchAction, Organization with logo/sameAs, and on price/country pages a suitable Dataset or Product-style schema for the reference price WITH clear "reference price, not retail" semantics (do not imply a purchasable offer/price you don't sell). Localize where relevant. Validate every type against schema.org and Google Rich Results. Read current JSON-LD emission first. Open PR phase12-jsonld. Use the `schema` skill conventions. Static stack only.
```

- **Accept:** All pages emit valid JSON-LD; no Rich Results errors; no misleading Offer.

## Phase 13 — AR content parity sweep

- **Maps to:** P0-1 parity, P2-6 numerals.
- **Branch:** `phase13-ar-parity` · **PR:** Fill AR translation gaps

```
Compare EN vs AR strings across all surfaces; list any untranslated/missing AR copy (headings, buttons, freshness labels, disclaimers, methodology). Fill gaps with proper Arabic (do not leave English fallback visible in AR mode). Decide and document one numeral convention per locale (recommend Arabic-Indic for AR, Latin for EN) and apply consistently. Read the i18n source. Open PR phase13-ar-parity with a parity checklist. Static stack only.
```

- **Accept:** No English leakage in AR; numerals consistent per locale.

## Phase 14 — Methodology page localized + indexable (EN/AR)

- **Branch:** `phase14-methodology-i18n` · **PR:** AR methodology + anchors

```
Ensure /methodology and /ar/methodology both exist as indexable pages with full translated content, stable section anchors (#live-formula, #aed-peg, #freshness-states, #disclaimer), and correct meta/hreflang. Keep the (excellent) EN content intact. Open PR phase14-methodology-i18n. Static stack only.
```

- **Accept:** Both methodology URLs index; anchors stable for cross-linking (used in Phase 20).

---

# WAVE 2 — Trust & freshness integrity (Phases 15–22)

## Phase 15 — Freshness label thresholds (fix "Live" on stale)

- **Maps to:** P1-1 (9-min-old shown "Live").
- **Branch:** `phase15-freshness-thresholds` · **PR:** Tighten Live window, add Delayed band

```
Read the freshness-state logic and methodology thresholds. Change the rules so "Live" only applies within ~2 minutes (aligned to the ~90s re-poll); 2–12 min becomes "Delayed" (show age); >12 min "Stale"; failures "Cached/Fallback"; total failure "Unavailable". Update the methodology copy to match the new thresholds. Ensure the top ticker "x min ago" and the badge can never disagree. Add/extend tests from Phase 1. Open PR phase15-freshness-thresholds. Never present non-live data as live.
```

- **Accept:** A value older than ~2 min never reads "Live"; badge and "x ago" agree; tests cover
  bands.

## Phase 16 — Chart price reconciliation

- **Maps to:** P1-2 (TradingView ~5059 vs spot ~4022).
- **Branch:** `phase16-chart-source` · **PR:** Reconcile/label homepage chart

```
The homepage chart (TradingView) shows a "last" price that differs from the site's spot value, creating two conflicting current prices. Read how the chart is embedded. Implement the cleanest option that keeps the static stack: prefer feeding the chart from the same gold-api series used sitewide; if not feasible, clearly label the chart as an independent third-party feed, visually separate it from the official spot value, and add a freshness/source caption using the sitewide vocabulary. The headline spot must remain the single source of truth. Open PR phase16-chart-source. Static stack only.
```

- **Accept:** No two unlabeled conflicting "current" prices; chart has source/freshness caption.

## Phase 17 — Unified freshness vocabulary + legend component

- **Maps to:** P2-5 (vocabulary drift across surfaces).
- **Branch:** `phase17-freshness-vocab` · **PR:** One freshness vocabulary everywhere

```
Define one canonical freshness vocabulary (Live, Delayed, Cached, Stale, Fallback, Unavailable) with one color token each (from Phase 3). Replace divergent terms (e.g. the "About Our Prices" card mentions "Estimated/Historical baseline"; the states box differs). Build a single reusable FreshnessBadge + a small legend, used by homepage, calculator, country pages, ticker, and exports. Localize labels. Open PR phase17-freshness-vocab. Static stack only.
```

- **Accept:** Identical state names/colors on every surface and in CSV/JSON exports.

## Phase 18 — Quick-convert never blank (seed from cache)

- **Maps to:** P1-5 (blank reference value on first paint).
- **Branch:** `phase18-quickconvert-seed` · **PR:** Instant cached value + freshness

```
On the homepage inline Quick-convert, ensure a numeric reference value is shown on first paint by seeding from the localStorage cached price (the site already caches), labeled with freshness, then updating on live fetch. Eliminate the empty/underline-only state. Add a CLS-safe reserved space for the number. Read the quick-convert + cache modules first. Open PR phase18-quickconvert-seed. Never show a cached number unlabeled.
```

- **Accept:** A labeled number always visible immediately; no layout shift when live value lands.

## Phase 19 — Spot-vs-retail trust chip (sitewide)

- **Maps to:** strengthens core trust promise (audit §5 idea).
- **Branch:** `phase19-trust-chip` · **PR:** Persistent freshness+source chip linking methodology

```
Add a small, consistent "reference price · source · freshness" chip to every price card (homepage spot, calculator result, country cards) that deep-links to the relevant methodology anchor (spot -> #live-formula, AED -> #aed-peg). Reuse FreshnessBadge from Phase 17. Keep it lightweight and accessible. Localize. Open PR phase19-trust-chip. Static stack only.
```

- **Accept:** Every price card shows source+freshness and links to methodology; works EN/AR.

## Phase 20 — Methodology copy de-jargon

- **Maps to:** P2-4 (exposes repo paths).
- **Branch:** `phase20-methodology-copy` · **PR:** User-facing methodology language

```
Rewrite the methodology sections that expose internal build mechanics (.github/workflows/gold-price-fetch.yml, data/gold_price.json, "no API keys in client bundle", localStorage) into user-facing language ("an automated hourly job refreshes our committed price snapshot", "your browser keeps a labeled local copy so you always see a number"). Keep all the substance and transparency; drop literal repo filenames. Apply to EN and AR. Open PR phase20-methodology-copy. Content only.
```

- **Accept:** No literal repo paths/workflow filenames in user copy; substance preserved EN+AR.

## Phase 21 — Disclaimer & "not retail" consistency pass

- **Branch:** `phase21-disclaimer-consistency` · **PR:** Standardize disclaimers

```
Audit every surface for the spot-vs-retail / not-financial-advice disclaimer. Standardize one short inline disclaimer + one full disclaimer block, placed consistently (price cards, calculator, country pages, exports, footer). Ensure VAT-by-country and making-charge notes match the methodology figures. Localize. Open PR phase21-disclaimer-consistency. Content + small template edits only.
```

- **Accept:** Consistent disclaimer wording/placement sitewide; figures match methodology.

## Phase 22 — Stale/unavailable visual states polish

- **Branch:** `phase22-degraded-states` · **PR:** Clear degraded-state UI

```
Harden the degraded states: when data is Stale/Fallback/Unavailable, show the labeled state, age, and an em-dash for missing numbers (already done on methodology — generalize it) with an accessible, non-alarming style. Ensure no surface ever shows a stale number styled as live. Add tests. Open PR phase22-degraded-states. Static stack only.
```

- **Accept:** All surfaces degrade gracefully and identically; tests assert no "live" styling on
  stale.

---

# WAVE 3 — Layout, responsive & RTL (Phases 23–30)

## Phase 23 — Header nav breakpoint (stop logo overlap)

- **Maps to:** P1-3 (nav overlaps logo ~792–1240px).
- **Branch:** `phase23-nav-breakpoint` · **PR:** Raise hamburger breakpoint

```
The desktop nav overlaps the logo between ~768px and ~1240px because the hamburger only engages below ~792px. Read the header/nav component + its CSS. Raise the collapse breakpoint (switch to the existing hamburger at ~1024–1100px) or let the nav condense before it collides; verify no overlap of logo, links, search icon, theme toggle, language button, or CTA at 768/900/1024/1200/1280/1440 in BOTH EN and AR (RTL). Open PR phase23-nav-breakpoint with screenshots at those widths in both languages. Static stack only.
```

- **Accept:** No header element overlap at any width in EN or AR; hamburger works.

## Phase 24 — Mobile header & ticker density

- **Branch:** `phase24-mobile-header` · **PR:** ≤480px header/ticker

```
Verify and fix the header, the scrolling price ticker, and the status banner at 320/360/390/414px in EN and AR. Ensure tap targets ≥44px, the ticker is readable and pausable, and the status banner is dismissible without covering content. Open PR phase24-mobile-header with mobile screenshots EN/AR. Static stack only.
```

- **Accept:** Clean header/ticker at phone widths both languages; 44px targets.

## Phase 25 — Tracker-handoff layout rebalance

- **Maps to:** P2-7 (narrow text column, big empty space).
- **Branch:** `phase25-handoff-layout` · **PR:** Rebalance calculator handoff grid

```
On /calculator the "Compare this in the live tracker" block wraps ~3 words per line in a narrow column with large empty space. Read the section's grid/flex CSS and rebalance so the text column has a comfortable measure (~60–75ch) and the CTAs sit logically. Check EN + AR. Open PR phase25-handoff-layout. Static stack only.
```

- **Accept:** Comfortable line length; balanced layout EN/AR.

## Phase 26 — Bidi isolation for mixed EN/AR strings

- **Maps to:** P2-8 (`AED 435.37 د.إ per gram` glitch).
- **Branch:** `phase26-bidi` · **PR:** Wrap currency/number tokens in bidi isolates

```
Fix mixed-direction rendering where currency glyphs/numbers are embedded in opposite-direction sentences (e.g. helper text "AED 435.37 د.إ per gram"). Wrap currency/amount tokens in <bdi> / unicode isolates and verify ordering in EN and AR across ticker, cards, calculator helper, exports. Read the formatting/number helper module first. Add a couple of tests. Open PR phase26-bidi. Static stack only.
```

- **Accept:** Currency+number tokens order correctly in both directions.

## Phase 27 — Repeated "Quote verification checklist" headings

- **Maps to:** P2-3.
- **Branch:** `phase27-checklist-headings` · **PR:** Differentiate or merge checklist cards

```
The three "Quote verification checklist" cards share an identical heading. Either give each a distinct sub-heading reflecting its bullets (e.g. "On the invoice", "On the charges", "Against the reference") or merge into one grouped block. Keep content; fix EN + AR. Open PR phase27-checklist-headings. Content/template only.
```

- **Accept:** No duplicate identical headings; content intact EN/AR.

## Phase 28 — Country/price page responsive QA

- **Branch:** `phase28-country-responsive` · **PR:** Country page layout pass

```
Pick representative country pages (UAE, Saudi, Kuwait + one MENA + one Global) and QA their layout/tables at 360/768/1024/1440 in EN and AR, fixing overflow, table scroll, and currency-symbol alignment. Apply fixes via the shared template so all ~24 countries benefit. Open PR phase28-country-responsive with screenshots. Static stack only.
```

- **Accept:** No overflow/misalignment on sampled pages; fix is template-level.

## Phase 29 — Theme toggle correctness (light/dark/system)

- **Branch:** `phase29-theme-toggle` · **PR:** Robust theme switching

```
Audit the theme toggle: ensure it respects system preference on first load, persists choice, applies before first paint (no flash), and that BOTH themes meet the contrast targets from Phase 30. Verify the toggle icon state matches actual theme. Read the theme module. Open PR phase29-theme-toggle. Static stack only.
```

- **Accept:** No theme flash; persisted; icon matches state.

## Phase 30 — Layout-shift (CLS) hardening

- **Branch:** `phase30-cls` · **PR:** Reserve space for async data

```
Identify CLS sources: price values arriving after first paint, the chart loading, the quick-convert number, country cards. Reserve fixed space / use skeletons (the project already has skeleton modules) so numbers swap in without shifting layout. Target CLS <0.1 on homepage, calculator, a country page (per Phase 4 reports). Open PR phase30-cls with before/after CLS numbers. Static stack only.
```

- **Accept:** CLS <0.1 on the three pages; values swap without shift.

---

# WAVE 4 — Accessibility (Phases 31–36)

## Phase 31 — Light-mode contrast fix

- **Maps to:** P1-4 (muted `rgb(160,152,144)` ≈ 2.7:1 on cream).
- **Branch:** `phase31-contrast` · **PR:** WCAG AA text contrast (light theme)

```
Using the Phase 3 tokens, darken muted/secondary text so it meets ≥4.5:1 on the cream light background (current ~2.7:1) and fix small gold/amber label text on cream (~2.8:1). Re-verify dark mode separately. Run axe + a contrast checker on homepage, calculator, methodology, a country page in EN/AR. Open PR phase31-contrast with computed ratios before/after. Use the `a11y-audit` skill conventions. Static stack only.
```

- **Accept:** All body/secondary text ≥4.5:1, large text ≥3:1, both themes.

## Phase 32 — Focus states & keyboard nav

- **Branch:** `phase32-focus-keyboard` · **PR:** Visible focus + full keyboard path

```
Ensure every interactive element (nav, hamburger, language/theme toggles, calculator inputs, tabs, chart controls, dismiss buttons) has a visible :focus-visible style and a logical tab order, including in the mobile menu and in RTL. Add skip-to-content link. Test keyboard-only EN/AR. Open PR phase32-focus-keyboard. Static stack only.
```

- **Accept:** Keyboard-only operable; visible focus everywhere; skip link present.

## Phase 33 — Semantic structure & landmarks

- **Branch:** `phase33-semantics` · **PR:** Headings, landmarks, labels

```
Audit heading hierarchy (single h1/page, no skipped levels), landmark roles (header/nav/main/footer), and form labels on the calculator. Fix the calculator inputs to have programmatic labels and the tab groups to use proper ARIA tablist semantics. Verify with axe. Open PR phase33-semantics EN/AR. Static stack only.
```

- **Accept:** Clean heading outline; labeled inputs; ARIA tabs valid.

## Phase 34 — Screen-reader pass for live prices

- **Branch:** `phase34-sr-live` · **PR:** aria-live for price/freshness updates

```
Make auto-updating prices and freshness changes announce sensibly to screen readers using polite aria-live regions (avoid spamming on every ~1s tick — throttle/announce meaningful changes). Ensure the ticker is labeled and not a focus trap. Test with VoiceOver/NVDA notes. Open PR phase34-sr-live. Static stack only.
```

- **Accept:** Meaningful, non-spammy SR announcements; ticker labeled.

## Phase 35 — Reduced motion & animation hygiene

- **Branch:** `phase35-reduced-motion` · **PR:** Respect prefers-reduced-motion

```
The site uses reveal-on-scroll, count-up, price-motion, freshness-pulse. Gate all non-essential animation behind prefers-reduced-motion: reduce (no count-up, no pulsing, instant reveals) while keeping content fully visible. Read the animation modules. Open PR phase35-reduced-motion. Static stack only.
```

- **Accept:** With reduced-motion on, no animations; content fully shown.

## Phase 36 — Alt text & non-text content

- **Branch:** `phase36-alt-text` · **PR:** Decorative vs informative media

```
Audit imagery (CSS-background hero, country flags, icons, generated OG assets). Ensure informative graphics have text alternatives and decorative ones are correctly hidden from AT (aria-hidden / empty alt). Country flags should expose the country name. Open PR phase36-alt-text. Static stack only.
```

- **Accept:** Flags/icons have correct names or are properly decorative; axe clean.

---

# WAVE 5 — Performance & infra (Phases 37–42)

## Phase 37 — Bundle consolidation

- **Maps to:** P2-2 (~30+ JS chunks).
- **Branch:** `phase37-bundle` · **PR:** Consolidate critical-path JS

```
The homepage loads ~30+ small JS modules plus an inline data: module. Review the Vite chunking config and consolidate critical-path modules (shell: nav/footer/ticker/spotBar + price/freshness) into fewer, cache-efficient chunks while keeping non-critical features (chart, SLA panel, exports) lazy-loaded. Measure requests + transfer before/after. Do not change behavior. Open PR phase37-bundle. Stay on Vite; no build-tool swap.
```

- **Accept:** Fewer critical requests, equal behavior, Perf score not lower.

## Phase 38 — favicon & PWA icon fix

- **Maps to:** P2-1 (favicon.svg 404).
- **Branch:** `phase38-favicon` · **PR:** Add favicon + manifest icons

```
/assets/favicon.svg returns 404. Add a proper favicon set (SVG + ICO + apple-touch + maskable PNGs) and wire them in <head> and the web manifest. Verify no 404s in network. Open PR phase38-favicon. Static stack only.
```

- **Accept:** No favicon 404; tab/PWA icons present.

## Phase 39 — Font loading optimization

- **Branch:** `phase39-fonts` · **PR:** font-display + preload + subset

```
Fonts are self-hosted woff2 (Source Sans 3 + Cairo). Add font-display: swap, preload the critical Latin + Arabic subsets used above the fold, and verify subsetting trims unused glyphs. Avoid FOIT; keep CLS stable with size-adjust if needed. Open PR phase39-fonts. Static stack only.
```

- **Accept:** No invisible-text flash; reduced font bytes; CLS unaffected.

## Phase 40 — Image & hero optimization

- **Branch:** `phase40-images` · **PR:** Responsive images + lazy + dimensions

```
Audit images (WebP hero background, flags, generated assets). Serve responsive sizes, set explicit width/height (or aspect-ratio) to prevent CLS, lazy-load below the fold, and preload the LCP image. Add AVIF alongside WebP where it helps. Open PR phase40-images with LCP before/after. Static stack only.
```

- **Accept:** LCP image preloaded; below-fold lazy; no CLS from images.

## Phase 41 — Caching, headers & service worker

- **Branch:** `phase41-caching` · **PR:** Cache headers + offline SW review

```
Review Express/static hosting headers: long cache for hashed assets, short/validated cache for HTML, correct content-types. Review the existing service worker/offline behavior so cached prices are served labeled and the SW never serves stale HTML indefinitely. Add a cache-busting/version strategy. Open PR phase41-caching. Static stack only; never serve stale data as live.
```

- **Accept:** Correct cache headers; SW serves labeled offline data; HTML updates on deploy.

## Phase 42 — Analytics & consent (privacy-safe)

- **Branch:** `phase42-analytics-consent` · **PR:** Consent-gated analytics + ad-slot review

```
There are analytics scripts and ad slots present. Add a privacy-respectful consent mechanism (region-aware; default to least data), gate analytics/ads behind consent, ensure no PII in URLs, and keep the page fast when consent is denied. Document what is collected in a privacy page (EN/AR). Read current analytics/adSlot modules. Open PR phase42-analytics-consent. Static stack only.
```

- **Accept:** Analytics/ads load only after consent; privacy page live EN/AR.

---

# WAVE 6 — Visual & brand polish (Phases 43–47)

> Asset phases. Generate the asset with the **Higgsfield** prompt, commit it, then run the phase
> prompt to wire it in.

### Asset library (already generated via Higgsfield — on-brand, ready to use)

These are produced and brand-consistent (deep charcoal, antique gold, GCC lattice, no text/logos —
safe for text overlay). Download and commit to `/src/assets/brand/`.

| Asset                          | Use                            | Ratio / size     | URL                                                                                                                                 |
| ------------------------------ | ------------------------------ | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Heritage hero (4K)             | Primary hero / OG base         | 16:9 · 5504×3072 | `https://d8j0ntlcm91z4.cloudfront.net/user_3CwVNntXsFJIp1sYyG8gGyvB5Ma/hf_20260629_170603_cb1eaee9-4038-4b89-b006-5374faee4808.png` |
| Hero w/ faint market glow (4K) | Alt hero / section bg          | 16:9 · 5504×3072 | `https://d8j0ntlcm91z4.cloudfront.net/user_3CwVNntXsFJIp1sYyG8gGyvB5Ma/hf_20260629_164252_0c53565e-11c0-4347-8319-081f3bd58232.png` |
| Molten-gold abstract           | Section divider / bg           | 16:9 · 2688×1536 | `https://d8j0ntlcm91z4.cloudfront.net/user_3CwVNntXsFJIp1sYyG8gGyvB5Ma/hf_20260630_071122_47c183e8-5980-485b-a55e-ba1c483439f3.png` |
| Default OG banner              | og:image / twitter             | 16:9 · 1376×768  | `https://d8j0ntlcm91z4.cloudfront.net/user_3CwVNntXsFJIp1sYyG8gGyvB5Ma/hf_20260630_135029_36799a81-3b2d-48ec-add5-4eb355a72a03.png` |
| Vertical hero                  | Mobile hero / story OG         | 9:16 · 768×1344  | (job `0e75884a` — rendering)                                                                                                        |
| Animated gold hero loop        | Hero background video / social | 16:9 · 5s 720p   | `https://d8j0ntlcm91z4.cloudfront.net/user_3CwVNntXsFJIp1sYyG8gGyvB5Ma/hf_20260630_135509_0234b3e1-5213-464d-8ffc-af283e1eaa50.mp4` |

**Usage guidance:** serve hero/section images as WebP+AVIF with explicit dimensions (Phase 40); keep
text on the dark left/upper negative space; the 5s loop should be muted, `playsinline`, `loop`,
lazy-loaded, and gated by `prefers-reduced-motion` (Phase 35) with a static poster = the 4K heritage
hero.

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

## Phase 44 — Hero & section imagery refresh

- **Branch:** `phase44-hero-art` · **PR:** Optimized hero/section art
- **Higgsfield prompt (hero, 16:9, dark-mode aware):**
  > "Subtle hero background texture for a gold finance site, near-black with faint gold bullion
  > bokeh and a soft warm gradient, very low-contrast so white/cream text sits cleanly on top, no
  > focal subject, no text, elegant, premium."

```
Replace/optimize the hero and key section imagery with on-brand assets that work in BOTH light and dark themes and don't harm text contrast (coordinate with Phase 31). Export WebP+AVIF, set dimensions, preload LCP. Open PR phase44-hero-art with light/dark screenshots. Static stack only.
```

- **Accept:** Hero looks premium in both themes; text contrast preserved; no CLS.

## Phase 45 — Micro-interactions & motion polish

- **Branch:** `phase45-motion-polish` · **PR:** Tasteful, reduced-motion-safe interactions

```
Refine the existing animations (price count-up, freshness pulse, reveal) for tasteful, fast, non-janky motion; ensure price changes use a subtle up/down color flash that is colorblind-safe (not color-only). All gated by Phase 35 reduced-motion. Open PR phase45-motion-polish. Static stack only.
```

- **Accept:** Smooth, subtle motion; colorblind-safe direction cues; reduced-motion respected.

## Phase 46 — Dark-mode visual QA

- **Branch:** `phase46-darkmode-qa` · **PR:** Dark theme contrast + surface polish

```
Full dark-mode pass across homepage, calculator, methodology, country pages, EN/AR: verify token-based surfaces, borders, freshness colors, and gold accents meet contrast and look intentional (no muddy grays). Fix any low-contrast dark-mode text. Open PR phase46-darkmode-qa with screenshots. Static stack only.
```

- **Accept:** Dark mode consistent and AA-compliant on all key pages.

## Phase 47 — Iconography & visual system consistency

- **Branch:** `phase47-icons` · **PR:** Unify icons, spacing, card styles

```
Audit icons (mixed emoji + line icons were observed) and standardize on one icon set with consistent stroke/size and accessible labels; unify card paddings/radii/shadows via Phase 3 tokens. Replace decorative emoji in primary UI with the icon set (keep them only where intentional). Open PR phase47-icons EN/AR. Static stack only.
```

- **Accept:** One coherent icon/card system; emoji removed from primary UI.

---

# WAVE 7 — Content depth, SEO growth & launch (Phases 48–50)

## Phase 48 — Internal linking & programmatic SEO QA

- **Branch:** `phase48-internal-linking` · **PR:** Cross-links + pSEO template QA

```
Strengthen internal linking: every country page links to calculator/methodology/related countries; methodology anchors link from price chips (Phase 19); guides interlink. QA the programmatic country/karat pages for unique titles/meta, no thin-content duplication, correct hreflang, and consistent freshness/disclaimer. Use the `seo-audit` and `programmatic-seo` skill conventions. Open PR phase48-internal-linking with a link-graph summary. Static stack only.
```

- **Accept:** No orphan pages; pSEO pages unique + compliant; methodology cross-linked.

## Phase 49 — Full bilingual regression & QA gate

- **Branch:** `phase49-regression` · **PR:** Cross-browser/device + a11y/SEO regression

```
Run a full regression across homepage, calculator, methodology, 3 country pages, EN + AR, in Chromium/Firefox/WebKit at 390/768/1024/1440: verify nav (no overlap), freshness labels (no "live" on stale), calculator math (peg 3.6725 exact), RTL correctness, contrast (AA), CLS <0.1, valid hreflang/canonical/JSON-LD, and no console/network errors (favicon fixed). Promote the Phase 4 budgets to BLOCKING. File issues for any miss. Open PR phase49-regression with the full report. Static stack only.
```

- **Accept:** All checks pass; quality budgets now block PRs.

## Phase 50 — Launch, monitoring & docs

- **Branch:** `phase50-launch` · **PR:** Sitemap submit, monitoring, runbook

```
Finalize: confirm sitemaps/robots, prepare Search Console submission notes (EN+AR), add basic uptime/freshness monitoring (alert if all price sources fail or data is "Unavailable" beyond a threshold), and write docs/RUNBOOK.md (data pipeline, freshness logic, deploy, rollback) and docs/CONTRIBUTING.md (the static-stack guardrails). Update README with the new architecture overview. Open PR phase50-launch. Static stack only; no behavior change beyond monitoring.
```

- **Accept:** Monitoring live; docs complete; submission checklist ready.

---

## Dependency / sequencing notes

- **Run 00 → 1–5 first** (map + safety + tokens) — everything else leans on tokens (Phase 3) and
  tests (Phase 1).
- **Wave 1 (6–14)** is the highest-ROI block (Arabic indexability + canonical/hreflang). Phase 7
  blocks 8, 9, 10, 13, 14.
- **Wave 2 (15–22)** depends on Phase 3 tokens + Phase 1 tests; Phase 17 blocks 19, 22.
- **Phase 31 (contrast)** should land before/with Phases 44–46 (visual) so art is built against
  final tokens.
- **Phase 4 budgets** start report-only and become blocking in Phase 49.

## Skills / connectors to lean on per wave

- SEO waves: `seo-audit`, `schema`, `programmatic-seo`, `ai-seo` skill conventions.
- A11y waves: `a11y-audit` / `accesslint-scan`.
- Assets: **Higgsfield** (`generate_image`) for OG/hero; `image` skill for optimization/export
  (WebP/AVIF, OG sizing).
- Testing: `webapp-testing` (Playwright) for the regression gate (Phase 49).
- Each phase prompt already instructs Claude Code to read first, branch, implement minimally,
  self-verify, and open one PR.

```

```
