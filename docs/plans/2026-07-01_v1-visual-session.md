# V1-VISUAL — Visual identity & tracker redesign session (2026-07-01)

Two workstreams, one session, gates self-verified and logged here.

- **Workstream A** — visual asset & imagery overhaul (icons, flags, photography, image pipeline).
  Branch snapshot: `claude/v1-visual-overhaul`.
- **Workstream B** — tracker information-architecture & visual redesign (hero-first command center).
  Branch snapshot: `claude/v1-tracker-redesign` (stacked on A).
- Umbrella spec: [`docs/design-language.md`](../design-language.md).

## Phase 0 — reconnaissance findings (corrections to the session brief)

Ground truth diverged from the brief in ways that reshape scope:

| Brief assumption                    | Reality on `main`                                                                                                     |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Test baseline 1081                  | **1274 passing / 0 failing** (147 files, `node:test`); that is the baseline to hold                                   |
| "Zero real imagery, no icon system" | SVG sprite exists (27 monoline symbols + 9 SVG flags, `src/components/icon-sprite.js`, byte-locked into `index.html`) |
| Google-Fonts emoji-era typography   | Fonts already self-hosted (Source Sans 3 + Cairo subsets, OFL, `assets/fonts/`)                                       |
| Single shared `og-image.png`        | Per-section OG cards already shipped (10 pages + 21 countries, `assets/og/`, generated per its README)                |
| Tracker renders ~20 panels at once  | Tabbed modes already exist (Live/Compare + advanced Archive/Exports/Method, Alerts/Planner overlays, basic↔advanced)  |
| Welcome modal wall                  | Already replaced by a dismissable bilingual chip strip (phase 16)                                                     |
| Design direction open               | **Locked**: extend warm-parchment tokens, "Precision Instrument" direction (`redesign/DESIGN-SYSTEM.md`, 2026-06-29)  |

What **is** still broken and in scope:

- ~49 emoji/glyph UI marks in `tracker.html` (+ duplicates in `modes.js`, `translations.js`
  quick-tool keys, `onboarding.js`, `markets.js`, `alerts.js`), flag emoji across homepage tiles,
  `countries/index.html`, 21 country hubs, tracker selects/rows via `countries.js` (28 flags),
  `shops`/`calculator`/`pricing`/`methodology`/`404` icon emoji.
- Zero content photography (2 `<img>` sitewide, both the X banner). "Major Gold Markets" cards are
  emoji flags on text.
- No image pipeline, no asset manifest, no alt-localization mechanism (`data-i18n-alt` absent).
- Tracker hero buries the answer under badge rows/copy; `—` dead-dashes in chart stats/history
  source/inline-calc; alerts reachable from 4 places; quick calculator duplicated outside the
  planner; keyboard-help overlay (`#tp-keyboard-help`) exists in HTML but **no JS opens it**;
  `#tp-chart-empty` never toggles (missing from the `el` map); dead `tp-quick-calc-*` render path.

## Risk register (what the gates watch)

1. **Frozen contracts** — ~50 `tp-*` ids + ARIA (`tests/tracker-dom.test.js`), 5-tab tablist +
   `body[data-tracker-shell-ready]` (`tests/e2e/tracker-flow.spec.js`), `#tp-hero-readout` /
   `#tp-readout-spot-value` (QA harnesses), single `aria-live` announcer `#tp-refresh-badge`, badge
   class maps ↔ `tracker-pro.css` literals (`tracker-ia-guard`), hash schema
   `mode/cur/k/u/r/cmp/lang/month/panel` + legacy canonicalization. Strategy: reorganize **around**
   the ids; never rename without updating the guard in the same commit.
2. **Byte-locked sprite** — any `icon-sprite.js` change ⇒ `node scripts/node/sync-icon-sprite.js` ⇒
   `node scripts/node/generate-ar-homepage.mjs` (ar/ mirrors index.html) or validate fails.
3. **i18n parity guards** — every new/edited string lands in EN **and** AR in
   `src/config/translations.js`; `data-i18n*` keys must resolve in both.
4. **Image gate** — every `<img>`: alt + width/height + `loading` policy, or `npm test` itself fails
   (`basic-a11y-gate`).
5. **safe-dom** — 0-innerHTML ceilings on tracker/home files; new render paths use
   `src/lib/safe-dom.js`.
6. **SEO drift gates** — SEO-visible HTML changes require regenerating committed reports
   (`inventory-seo`, `seo-governance`, `export-analytics-inventory`) and re-running
   `apply-section-og`/`inject-schema` checks.
7. **Licensing** — no scraped/watermarked assets; every asset in `assets/MANIFEST.md` with
   verifiable license; CC BY(-SA) photos carry visible attribution. Never label AI output as a real
   place.
8. **Immutable domain constants** — AED peg 3.6725, troy oz 31.1035, karat factors from
   `src/config/karats.js` only. No pricing/fetch logic edits in this session.

## Workstream A — deliverables

1. **Sprite extension** (`icon-sprite.js`): UI symbols
   `i-refresh, i-close, i-star, i-external, i-check, i-x, i-camera, i-clock, i-archive, i-wire, i-list, i-phone, i-warning, i-up, i-down, i-flat` +
   flags for every `countries.js` market (19 new `f-*`: OM, JO→exists, LB, IQ, SY, PS, YE, LY, TN,
   DZ, SD, SO, MR, DJ, KM, PK, US, GB, EU, IN). Freshness glyph mapping per design-language §5.
2. **Emoji-as-UI sweep** — tracker surfaces (with Workstream B), homepage + `ar/`,
   `countries/index.html`, country hubs + legacy city/market pages, `shops.*`, `calculator.*`,
   `pricing.html`, `methodology/learn/insights/invest/404/compare/developer/offline/account`,
   `footer.js`, `translations.js` icon-bearing keys, `countries.js` consumers (selects go text-only;
   rows/cards get SVG flags). Typographic arrows stay.
3. **Photography** — Major Gold Markets cards get real, license-verified photographs (Wikimedia
   Commons, CC BY / CC BY-SA / PD, graded per design language), `<picture>` AVIF/WebP/JPEG with
   srcset, EN/AR alt, visible credit; recorded in `assets/MANIFEST.md`.
4. **Image pipeline** — `scripts/images/build-images.py` (Pillow: resize ladder, duotone grade,
   AVIF/WebP/JPEG encode, size budgets) + committed outputs; no new npm dependencies.
5. **Alt localization** — `data-i18n-alt` support in the home hydrator + AR alt constants in
   `generate-ar-homepage.mjs`.
6. **Guard** — a repo test banning emoji-as-UI regressions on swept surfaces.

## Workstream B — migration map (old → new)

| Today (tracker.html)                                                                                                        | Target                                                                                                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hero: badge row → readout → meta card → h1 → 4 stat cards → selectors → actions → hints                                     | Hero: **readout first** (milled signature block w/ freshness + countdown), compact context bar (currency/karat/unit/lang, sticky), h1 demoted to masthead line, stats fold into readout hi/lo strip                    |
| Aside: "Live desk" list + emoji tools list                                                                                  | Side rail: live-desk summary + de-emoji'd quick links (sprite icons)                                                                                                                                                   |
| Live mode: toolbar, mobile workspace, wire, karat+chart, alerts/watchlist desk, export panel, quick calc (7 stacked panels) | Live mode: toolbar + karat ladder (rail) + chart stay; alerts/watchlist desk and export panel collapse into one compact desk strip; quick calculator moves into the Planner overlay as its first "Quick value" section |
| Alerts entry points ×4 (tab, rail button, desk panel, mobile rail)                                                          | Tab + bell affordance only; desk panel becomes summary row that opens the overlay                                                                                                                                      |
| Welcome chip strip (emoji)                                                                                                  | Same strip, sprite icons, unchanged dismissal contract                                                                                                                                                                 |
| `—` placeholders (chart stats, history source, calc result)                                                                 | Shaped skeletons / honest empty copy                                                                                                                                                                                   |
| Keyboard help overlay unreachable                                                                                           | `?` opens it; `Esc`/button closes; shortcut list already localized                                                                                                                                                     |
| `#tp-chart-empty` never shown; dead `tp-quick-calc-*` path                                                                  | Wired / removed                                                                                                                                                                                                        |
| Tab emoji (`📡 🌍 🗂 🔔 📋 ⬇ 📖`) in HTML + `modes.js`                                                                       | Sprite icons in tabs; registry labels text-only (EN/AR)                                                                                                                                                                |

Deep-link scheme, mode registry order, basic/advanced gating, and all storage keys are unchanged.

## Verification protocol per gate

`npm test` (1274+ / 0) · `npm run lint` · `npm run style` · `npm run validate` · `npm run build` ·
QA screenshot harness (`tests/qa/qa-harness.mjs`) EN/AR × 390/1366 × light/dark for home + tracker ·
emoji grep proof · legacy deep-link spot-checks (`#alerts`, `#mode=alerts`,
`#mode=live&panel=planner`).

## Gate log

| Gate                            | Status        | Evidence                                                                                                                                                                                                                                                                               |
| ------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0 — recon                       | ✅ 2026-07-01 | this document §Phase 0; baseline 1274/0 verified                                                                                                                                                                                                                                       |
| 1 — design language + plan      | ✅ 2026-07-01 | `docs/design-language.md`; this plan                                                                                                                                                                                                                                                   |
| 2 — foundations                 | ✅ 2026-07-01 | sprite → 72 symbols (14.2 KB inline, budget 30 KB), 28 SVG flags, `flagSymbolForCountry()`; `scripts/images/build-images.py` + 4 licensed souk photos (AVIF/WebP/JPEG × 480/768/960); `assets/MANIFEST.md`; targeted gates + validate green                                            |
| 3 — Workstream A rollout        | ✅ 2026-07-02 | homepage photography + credits + `data-i18n-alt` EN/AR; ~870 emoji-as-UI removed across ~140 files; `countries.js` flag fields removed; guard test walks all swept surfaces                                                                                                            |
| 4/5 — tracker shell + migration | ✅ 2026-07-02 | quick calculator → Planner overlay; keyboard sheet wired (`?`/Esc/backdrop); `#tp-chart-empty` wired; dead `tp-quick-calc-*` path removed; dead-dashes → skeletons; milled-readout hierarchy CSS; deep links verified incl. legacy `#alerts`/`#mode=alerts`                            |
| 6 — polish + evidence           | ✅ 2026-07-02 | suite **1624/1624**; eslint/stylelint/validate/build green; 19-shot evidence matrix in `docs/plans/evidence/2026-07-01-v1-visual/`; axe: home EN+AR **0 serious/critical**, tracker 1 pre-existing owner-gated item; QA baseline refreshed (0 console errors / leaked keys / overflow) |

### Known follow-ups (out of session scope)

- `.tracker-modes` tablist contains the two overlay launcher buttons (axe `aria-required-children`,
  pre-existing): fixing requires an owner-gated tab-bar / registry reorder per
  `docs/plans/2026-06-26_tracker-html-50-phase-revamp.md` §staged items.
- learn-hub fallback icon is generator-owned (`render-learn-static-fallback.mjs`) — needs a
  coordinated learn-hub renderer+generator change.
- `offline.html` still references Google Fonts (pre-existing; out of scope).

## Wave 2 — country-hub hero photography (2026-07-02)

Extends Workstream A to the 11 country hubs. Each hub hero now carries a licensed market photograph
(`.cp-hero-media` band, 3:2, AVIF/WebP/JPEG × 480/768/960, lazy-loaded, visible credit link, EN alt
in markup + AR alt via `data-alt-ar`).

- **Assets:** 7 new photo sets (Qatar, Bahrain, Oman, Jordan, Morocco, Turkey, India) built by
  `scripts/images/build-images.py` (per-shot quality overrides + `--only` filter added); every 960px
  rung ≤120 KB; license rows in `assets/MANIFEST.md` (2× CC0/PD-adjacent, 5× CC BY-SA — graded
  derivatives shared alike). Jordan is a 1953 archival photo and is labelled as such in alt +
  caption. Bahrain/Morocco depict the souq district / metalwork souk honestly, not a gold souq.
- **Templates:** 10 hubs use the `cp-hero` template (alt swap in
  `countries/country-page.js#renderAll`); Turkey is the legacy `country-hero` template (alt swap via
  `syncHeroMediaAlts()` in `src/lib/page-hydrator.js#hydrate`, price-data-independent).
  `.cp-hero-media` CSS mirrored in `styles/country-page.css` + `styles/pages/country.css`.
- **Gate evidence:** suite 1624/1624, eslint, validate (incl. basic-a11y + seo-governance refresh),
  build green; EN/AR alt swap verified in-browser both templates
  (`docs/plans/evidence/2026-07-01-v1-visual/hub-{qatar,turkey}-{en,ar}-1366.webp`).

## Review follow-up - PR #488/#490 (2026-07-03)

- Rechecked unresolved review threads after PR #490 merged into `claude/v1-tracker-redesign`.
- Confirmed already-fixed items still present on the stack: pricing "Reference gold prices" copy,
  localized legacy freshness banner + methodology link, tracker hero-stats aria-label hydration,
  welcome-chip fallback alignment, and country-hub featured-market captions.
- Fixed the remaining country-hub AR schema gap: `renderFaq()` now injects FAQPage JSON-LD from the
  active visible FAQ list, so AR mode emits Arabic questions/answers and EN mode emits English.
- Left broader backlog items (generic OG imagery, city/country intent copy, credit localization,
  thin static copy) as follow-up scope because they are either documented existing debt or larger
  than the unresolved inline review fix.
