# GoldTickerLive — Master Site Audit & Revamp Plan

> **Status:** living document · **Created:** 2026-07-04 · **Owner:** product/eng **Scope:** full
> sitewide audit after the 2026-07-04 expansion wave, plus a phased revamp roadmap of ~40 future
> PRs.
>
> This plan is deliberately **specific to GoldTickerLive** — every finding cites a real file, page,
> or measurement. It is built from three parallel read-only audits (SEO, accessibility,
> performance/architecture) plus a page-by-page product/visual pass.

---

## 1. Executive summary

GoldTickerLive is a **static, bilingual (EN/AR) Vite multi-page site** that publishes **spot-linked
reference gold prices** for the UAE/GCC and global markets, plus tools (tracker, calculator,
compare, world map, portfolio) and an educational layer (learn hub, methodology, and — newly added
this wave — a glossary and a "how gold is priced" market page).

The codebase is **more mature than a typical template**: strong i18n parity guards, an a11y contrast
gate, SEO metadata/schema injectors, freshness labelling, and 159 test files. The 2026-07 page
reduction (~360 → 13 meaningful surfaces) was the right call.

The audit found **no catastrophic breakage remaining after the current PR wave**, but a clear set of
**latent reliability risks, SEO gaps, and polish debt** that stop the site short of "premium
gold-price intelligence product." The single most important theme: **progressive-enhancement
fragility** — content that hides itself (`opacity:0`) and depends on JS to reveal, which already
produced the Learn page's "0 of 9 but empty" bug and still threatens the homepage hero.

**Biggest immediate wins** (Phase 0, mostly in flight or one-file fixes): fix the sitewide
`[data-reveal]` opacity trap, fix legal-page link contrast (fails AA), close the internal-link
orphaning of heatmap/portfolio, and add Article schema to the two strongest E-E-A-T pages.

**Biggest strategic gap:** the site owns almost no **"Dubai/UAE gold rate"** search intent despite
that being its highest-value regional query — no page title, H1, or description contains "Dubai."

---

## 2. Current site inventory

### 2.1 Public pages / routes (13 shipped + 2 new in open PRs)

| Page                          | Purpose                                                            | State                             |
| ----------------------------- | ------------------------------------------------------------------ | --------------------------------- |
| `index.html`                  | Home / price snapshot + tool grid                                  | Strong; hero at reveal-trap risk  |
| `tracker.html`                | Live reference-price workspace ("Command center")                  | Strongest page; honest provenance |
| `calculator.html`             | Value by weight/karat; Zakat, scrap, buying-power, unit tabs       | Strong                            |
| `compare.html`                | Cross-country reference comparison (+ gold-vs-assets hub in #497)  | Thin on `main`; enriched in #497  |
| `heatmap.html`                | World retail-estimate map (+ drivers in #499, premium map in #501) | Orphaned internally               |
| `portfolio.html`              | Private local holdings valuation (+ allocation edu in #498)        | Orphaned internally               |
| `shops.html`                  | Gold shops & market-area directory                                 | Strong; honest freshness          |
| `learn.html`                  | Guide hub + long-form article                                      | Rescued + upgraded in #506        |
| `methodology.html`            | Data sources, formulas, limits                                     | Strong; missing Article schema    |
| `glossary.html`               | 26-term bilingual gold glossary                                    | **New — PR #502**                 |
| `market.html`                 | "How gold is priced" spot→street narrative                         | **New — PR #503**                 |
| `terms.html` / `privacy.html` | Legal                                                              | Link contrast fails AA            |
| `offline.html` / `404.html`   | PWA offline / not-found                                            | offline missing `<main>`          |

### 2.2 Tools / calculators

Tracker (live/compare/planner modes), Gold calculator with **5 modes** (value, scrap, Zakat, buying
power, unit converter), Compare-countries, World heatmap, Portfolio tracker.

### 2.3 Content systems

- **Learn hub**: `src/config/learn-hub-catalog.js` (9 guides / 4 categories) +
  `src/learn-hub/content-model.js` (long-form article) + build-time static fallback
  (`scripts/node/render-learn-static-fallback.mjs`).
- **Glossary** (`glossary.html`), **Market** (`market.html`) — static-first bilingual.
- **Insights feed**, **Related guides**, **Location guides** (`src/data/location-guides.json`).

### 2.4 Data sources

`data/shops.js`, `src/config/countries.js`, live quote providers (`src/lib/quote-providers/*`,
chained with cache fallback), FX via open.er-api.com, AED fixed peg 3.6725. Prices are **reference
estimates, never "live dealer quotes."**

### 2.5 Style system

`styles/global.css` imports tokens + partials + page CSS. Notable sizes: `tracker-pro.css` 5.3k
lines, `components.css` 4.7k, `home.css` 4.0k, `utilities.css` 3.7k, `admin.css` 3.0k (served
unminified — excluded from Vite), `shops.css` 2.8k. Shared component system
`styles/components/edu.css` (introduced in #497).

### 2.6 Scripts / guards / tests

Build chain: internal-index stubs → baseline → normalize-shops → render-learn-static-fallback →
inject-theme-preinit → inject-schema → generateSitemap → vite build. Validate chain runs ~20 checks
(a11y, SEO meta, schema, sitemap parity, governance, sw-coverage, unsafe-dom, shell-guard). **159
test files.**

### 2.7 Known plan/roadmap files

`docs/REVAMP_PLAN.md`, `docs/plans/*`, `AGENTS.md`, `docs/AI_AGENT_OPERATING_SYSTEM.md`.

### 2.8 TODO/FIXME

**Zero** real `TODO`/`FIXME`/`HACK` in `src/`, `styles/`, or root HTML (the only `XXX` hits are
`$X,XXX` price-format placeholders in comments).

### 2.9 Dead / unused candidates (verify before deleting)

- `src/lib/lazy-section.js` — zero references anywhere.
- `src/lib/quote-providers/parallel-race-provider.js` — only referenced by its test.
- `src/components/MarketSummaryTicker.js` + `styles/partials/market-summary-ticker.css` (165 lines
  shipped sitewide) — component never mounted.
- `src/package-lock.json` (82 bytes) — vestigial.
- 4.4 MB of dev screenshots under `assets/screenshots/` — referenced only by docs.
- **Do NOT delete** `src/lib/content-page-boot.js` / `src/pages/submit-shop.js` — consumed by
  generated leaf pages (`countries/`, `content/`) not in git.

---

## 3. Biggest strengths

1. **Honest data framing** — "spot-linked reference, not a live dealer quote" is consistent across
   tracker, calculator, shops, methodology. This is the brand's moat.
2. **Reduced-motion support is genuinely thorough** — global reset + per-primitive resets + every JS
   motion lib checks `matchMedia`.
3. **i18n parity is guarded** — EN/AR twins with automated dict-parity tests.
4. **Accessibility baseline is strong** — skip links, one `<h1>`/page, landmarks, dialog patterns
   (focus trap/Escape/return), 44px primary tap targets, contrast gate.
5. **SEO metadata baseline is complete** — unique titles/descriptions, canonical, hreflang,
   OG/Twitter, BreadcrumbList on every indexable page.
6. **Test/guard coverage is broad** — routes, sitemap parity, SEO, i18n, freshness, asset budget,
   first-paint skeleton.

## 4. Biggest weaknesses

1. **Progressive-enhancement fragility** — `[data-reveal]{opacity:0}` on index.html (16 sections
   incl. hero) + tracker.html (3) with no no-JS/failed-boot fallback.
2. **"Dubai/UAE gold rate" intent is unowned** — no title/H1/description targets it.
3. **Internal-link orphaning** — heatmap.html & portfolio.html are linked only from 404.html; no
   tools footer surfaces all six tools together.
4. **E-E-A-T pages under-marked** — learn.html & methodology.html are `og:type=article`, ~2,000
   words, but carry only BreadcrumbList (no Article schema).
5. **Legal link contrast fails AA** — `.legal-section a` uses `--color-gold` (#b07d1f) on white ≈
   3.5:1.
6. **Learn heading outline inverted** — hub `h2`/`h3` precede the page `h1`.
7. **Metadata drift** — hand-authored `<head>` per page; Organization JSON-LD on 6 of 13 pages;
   `preconnect` count varies 0–3.
8. **Dead weight shipped** — 165-line unused CSS partial on every page; a few dead JS modules;
   oversized dev rasters in the deploy asset tree.
9. **Nav semantics** — `role="menu"/menuitem"` on ordinary nav links (should be a disclosure
   pattern).

---

## 5. Immediate hotfix list (Phase 0)

| #   | Fix                                                                                 | Files                                               | Risk | Status         |
| --- | ----------------------------------------------------------------------------------- | --------------------------------------------------- | ---- | -------------- |
| H1  | Learn "0 of N" empty state                                                          | learn-hub-ui.js + renderer                          | Low  | ✅ **PR #506** |
| H2  | Sitewide `[data-reveal]` opacity trap (home/tracker)                                | utilities.css + no-JS fallback + theme-preinit      | Med  | ▶ planned PR   |
| H3  | Legal link contrast → `--color-gold-dark`                                           | terms.css (+ base.css eyebrow/kicker, insights.css) | Low  | ▶ planned PR   |
| H4  | Article schema on learn + methodology                                               | inject-schema.js `detectPageType`                   | Low  | ▶ planned PR   |
| H5  | Internal-link mesh: add heatmap+portfolio to home tool grid + a shared tools footer | index.html, footer.js                               | Low  | ▶ planned PR   |
| H6  | Trim over-long meta descriptions (compare/heatmap/portfolio) + titles               | those HTML `<head>`                                 | Low  | ▶ planned PR   |
| H7  | `shops.html` `<title>`/`og:title` bare `&` → `&amp;`                                | shops.html                                          | Low  | ▶ planned PR   |
| H8  | Dead CSS: drop `market-summary-ticker.css` import (or wire component)               | global.css                                          | Low  | ▶ planned PR   |
| H9  | offline.html add `<main>` landmark                                                  | offline.html                                        | Low  | ▶ planned PR   |
| H10 | Guard: no-JS `[data-reveal]` visibility invariant test                              | tests/                                              | Low  | ▶ planned PR   |

**Already fixed in earlier open PRs (do not duplicate):** learn `#faq` duplicate id + double footer
(#500), shops `&amp;` textContent label (#504), admin login tab clipping (#505), compare
thin-content (#497), missing glossary/market pages (#502/#503).

---

## 6. Full revamp vision

GoldTickerLive should read as a **premium, trustworthy gold-price intelligence product** for the
UAE/GCC and global searchers: land → see an honest reference price in seconds → understand what it
means → calculate their own value → learn deeply → trust the methodology. Every surface reinforces
"reference, not retail; transparent, not hyped." Fast, mobile-first, bilingual, SEO-complete, and
never blank.

## 7. Target user journeys

1. **"Gold price Dubai today"** searcher → homepage/Dubai landing → live reference price
   - AED context → calculator → learn/methodology for trust.
2. **First-time buyer** → learn hub → karat/making-charges/hallmark guides → calculator → shops
   directory.
3. **Investor/holder** → compare + portfolio + market page → methodology → insights.
4. **Skeptic** → methodology + glossary → understands "reference vs retail" → trusts.

## 8. Proposed information architecture

Keep the flat 9-surface nav. Add a **shared "Tools" footer cluster** (tracker · calculator · compare
· heatmap · portfolio · shops) and a **"Learn & trust" cluster** (learn · glossary · market ·
methodology) on every page to end orphaning and spread link equity. Add a **Dubai/UAE landing** as a
first-class SEO surface.

## 9. Design system improvements

- Extract a **canonical card component** (guide card, tool card, stat tile, trust block) — repeated
  markup exists across home/learn/compare/edu.
- Consolidate gold-accent usage: `--color-gold` is a **signal color, never small text** (enforced by
  a lint/gate). Body links/eyebrows use `--color-gold-dark`.
- Reduce decorative shadow/gradient stacking on cards for a cleaner premium feel.
- Document spacing rhythm + typography scale in a living style reference page.

## 10. Content strategy

- **Guide packs** (expand the 9-guide catalog using already-translated strings: bars-vs-coins,
  gold-vs-inflation, best-time-to-buy, online-vs-in-store, spot-fake-gold, Dubai gold-rate guide).
- **UAE/Dubai practical context**: making charges, VAT, invoice checklist, souk vs mall.
- **Glossary depth**: grow toward DefinedTermSet; cross-link terms from learn/market.
- **FAQs** with FAQPage schema on calculator (Zakat/scrap) and Dubai pages.
- Editorial pass to remove any generic/AI-sounding phrasing; keep the honest voice.

## 11. SEO growth strategy

- **Own "Dubai gold rate/price"**: add "Dubai" to homepage + tracker title/H1/description; build a
  dedicated Dubai landing page with local schema.
- **Article schema** on learn + methodology; **HowTo** on calculator Zakat/scrap; **Dataset**
  (Offer-free) on homepage + tracker price tables; **FAQPage** JSON-LD consolidated on learn.
- Fix heading outlines (learn), trim meta lengths, de-prioritize legal pages in sitemap.
- Resolve hreflang: either ship real `/ar/` self-canonicalizing pages or drop `hreflang=ar` until
  they exist (current `?lang=ar` canonicalizes to EN).
- Close the tools cross-link mesh (also an IA fix).

## 12. Technical architecture strategy

- Shared **head/meta partial or codegen** to end per-page `<head>` drift (Organization JSON-LD,
  preconnect, canonical/hreflang consistency).
- Standardize `src/components` naming (PascalCase vs kebab is currently mixed).
- Code-split the largest entries where practical (`shops.js`, `tracker-pro.js`, `calculator.js`,
  `home.js`, `nav.js` 1.5k lines).
- Remove dead modules/CSS (§2.9). Keep charts lazy-loaded (already good).

## 13. Performance strategy

- Drop the 165-line unused `market-summary-ticker.css` from the sitewide bundle.
- Move 4.4 MB dev screenshots out of `assets/`.
- Audit `assets/og/**` (~6 MB of raster social cards) against a size budget.
- Keep terser console-stripping and vendor chunking. Add a CSS-size budget check.

## 14. Accessibility strategy

- Fix legal link contrast (H3). Audit `.eyebrow--gold`/`.kicker--gold` small-text uses.
- Fix Learn heading outline. Replace nav `menu`/`menuitem` with a disclosure pattern.
- Strengthen the custom focus rings on home/tracker/alert fields (≥3px, higher contrast).
- Bump the compare "remove country" chip to 44px on touch. Add `<main>` to offline.html.
- Complete or simplify the nav search combobox ARIA wiring.

## 15. Calculator / tool strategy

- Add explanatory copy + limitations around each calculator mode.
- Add HowTo schema + FAQ for Zakat and scrap flows.
- Verify edge cases (empty/invalid/zero inputs) and ensure any error messaging is ARIA-associated
  (`aria-invalid` + `aria-describedby` + `role=alert`).
- Consider saved calculations / shareable result links (Phase 6).

## 16. Trust / methodology strategy

- Keep methodology as the anchor; add Article schema and cross-links from every tool.
- Surface update-frequency + data-source provenance more prominently on home/tracker.
- Keep freshness labels (Live/Delayed/Cached/Fallback/Closed) visible everywhere.

## 17. Internal linking strategy

Shared tools + learn/trust footer clusters (§8) on every page; contextual "related" blocks
(learn↔glossary↔market↔calculator↔compare); breadcrumbs everywhere (already present). This alone
fixes heatmap/portfolio orphaning.

## 18. Testing & guard strategy

Add guards for: **no-JS `[data-reveal]` visibility invariant** (the exact regression class that
broke Learn), **guide-count** (catalog === static fallback === "N featured guides" copy),
**internal-link mesh** (every tool linked from ≥2 pages), **meta-length** (title ≤60, description
≤160), **schema presence per page-type**, and a **CSS/asset size budget**.

## 19. Prioritized PR roadmap (~40 PRs across phases)

### Already open (this session, awaiting review) — foundation of the wave

`#496` shell reliability · `#497` compare edu + edu.css · `#498` portfolio edu · `#499` heatmap
drivers · `#500` QA fixes · `#501` premium world map · `#502` glossary · `#503` market page · `#504`
shops `&` fix · `#505` admin login · `#506` learn rescue+upgrade.

### Phase 0 — Emergency hotfixes

P0-1 sitewide reveal trap · P0-2 legal contrast · P0-3 Article schema learn/methodology · P0-4
internal-link mesh (tools footer + home grid) · P0-5 meta-length trims · P0-6 shops title `&` escape
· P0-7 drop dead CSS · P0-8 offline `<main>` · P0-9 no-JS reveal guard test · P0-10 sitemap legal
de-prioritize.

### Phase 1 — Foundation cleanup

P1-1 shared head/meta partial · P1-2 canonical card component · P1-3 `--color-gold` small-text lint
gate · P1-4 component naming standardization · P1-5 remove dead modules/assets · P1-6 nav
disclosure-pattern refactor.

### Phase 2 — Premium UX revamp

P2-1 home conversion/hierarchy pass · P2-2 nav/footer cluster upgrade · P2-3 calculator explanatory
copy + modes · P2-4 learn heading-outline + article schema polish · P2-5 glossary search/filter ·
P2-6 market page depth · P2-7 mobile polish sweep (320/375/390/430) · P2-8 focus-ring + tap-target
fixes.

### Phase 3 — SEO / content expansion

P3-1 Dubai/UAE landing page · P3-2 "Dubai" in home/tracker title+H1 · P3-3 gold-basics guide pack ·
P3-4 UAE buyer guide pack · P3-5 investment guide pack · P3-6 glossary DefinedTermSet + depth · P3-7
calculator HowTo + FAQ schema · P3-8 Dataset schema on home/tracker · P3-9 souk-specific shops
section.

### Phase 4 — Trust & data maturity

P4-1 methodology Article schema + provenance surfacing · P4-2 update-state transparency · P4-3
disclaimer consistency pass · P4-4 provider/freshness reliability hardening.

### Phase 5 — Automation & quality gates

P5-1 guide-count guard · P5-2 internal-link-mesh guard · P5-3 meta-length guard · P5-4
schema-presence guard · P5-5 CSS/asset size budget · P5-6 no-JS visibility guard (from P0-9) · P5-7
broken-link crawler in CI.

### Phase 6 — Long-term product expansion

P6-1 price alerts/watchlists · P6-2 saved calculators / shareable results · P6-3 market summaries /
daily digest · P6-4 richer comparison tools · P6-5 data/API roadmap · P6-6 analytics-driven
personalization (privacy-respecting).

## 20. Risk register

| Risk                                                               | Likelihood | Impact | Mitigation                                            |
| ------------------------------------------------------------------ | ---------- | ------ | ----------------------------------------------------- |
| Reveal-trap fix causes content flash                               | Med        | Med    | Gate hide on a pre-paint `js` class; test both states |
| `<head>` partial refactor breaks per-page canonical/hreflang       | Med        | High   | Codegen with per-page config + `check-seo-meta` gate  |
| Card-component extraction visual regressions                       | Med        | Med    | Screenshot diffs; migrate page-by-page                |
| Dubai/SEO pages read as thin/spammy                                | Low        | Med    | Genuine local value, honest copy, real internal links |
| Generated-file conflicts across stacked PRs (reports/seo, sitemap) | High       | Low    | Regenerate on merge; documented in merge order        |
| AR hreflang without real AR pages                                  | High       | Low    | Ship `/ar/` or drop hreflang until then               |

## 21. Success metrics

- **Reliability:** zero "blank page" reports; no-JS visibility guard green.
- **SEO:** every page ≤60-char title / ≤160-char description; Article/FAQ/Dataset schema present per
  type; Dubai intent ranked; heatmap/portfolio each linked from ≥3 pages.
- **A11y:** contrast gate covers all gold-as-text uses; zero AA link-contrast failures; clean
  heading outlines; Lighthouse a11y ≥95 on all pages.
- **Performance:** no dead CSS shipped; asset budget green; Lighthouse perf ≥90 mobile.
- **Content:** guide count copy always matches catalog; no thin pages (all ≥140 words).

## 22. Suggested 30 / 60 / 90-day roadmap

- **30 days:** land the 11 open PRs (see merge order below) + Phase 0 hotfixes. Ship the Dubai
  landing + "Dubai" in home/tracker titles. Result: no blank pages, AA-clean links, Dubai intent
  owned, orphaning closed.
- **60 days:** Phase 1 foundation (head partial, card component, dead-code removal, naming) + Phase
  2 UX (home, calculator copy, mobile sweep, glossary search) + Phase 5 guards.
- **90 days:** Phase 3 content/SEO expansion (guide packs, schema, souk section) + Phase 4 trust
  maturity. Begin Phase 6 product features (alerts, saved calculators).

---

## Appendix A — recommended merge order for the 11 open PRs

**Round 1 (independent, any order):** `#496` shell · `#500` QA · `#501` world map · `#504` shops `&`
· `#505` admin login · `#506` learn rescue. **Round 2 (edu stack, strict):** `#497` → `#498` →
`#499`. **Round 3 (pages stack, strict):** `#502` → `#503`. Generated files (`reports/seo/*.json`,
`public/sitemap.xml`) may conflict across stacks — resolve by regenerating
(`node scripts/generate-sitemap.js && node scripts/node/inventory-seo.js && node scripts/node/seo-governance.js`).

## Appendix B — audit evidence sources

Three parallel read-only audits (SEO/schema, WCAG 2.1 AA accessibility,
performance/architecture/dead-code) plus a page-by-page product/visual/render pass at desktop and
mobile widths. Findings above cite the originating file/line where relevant.
