# Gold Ticker Live — Revamp Progress (PR #443)

## 2026-07-03 V1-VISUAL review follow-up (PR #488 stack)

Reviewed unresolved GitHub feedback on the open V1-VISUAL stack, especially PR #488 and the
now-merged PR #490. The current `claude/v1-tracker-redesign` head already carries the pricing
reference-copy fix, the localized legacy freshness banner, tracker hero-stats aria localization,
welcome-strip fallback alignment, and featured-market captions from the imagery wave. This follow-up
closes the remaining country-hub schema gap by making runtime FAQPage JSON-LD use the active
language (`faqAr` for AR, `faqEn` for EN) whenever `renderFaq()` re-runs on language changes.

## 🛠 2026-06-27 Defect-closure session (branch `claude/gold-ticker-defects-ia4fgz`)

Baseline at start: **1240 tests / 0 fail**, lint + style + validate + build green. Held green on
every commit; **end state 1249 / 0** (+9 regression guards). LOCKED pricing/freshness untouched; the
live-URL set (sitemap, 212 URLs) is byte-identical before and after every commit. One commit per
defect. Accessible-name/landmark claims verified with a Playwright "S1 harness" (DOM accessible-name
computation + `getByRole` landmark probe) against the built `dist/` and raw source.

| ID  | Status     | Root cause                                                                                                                                                                                               | Fix                                                                                                                                                   | Evidence                                                                                                                          |
| --- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| D1  | ✅ Fixed   | Country pages live at `/countries/<slug>/`; nav/breadcrumbs already directory-form, but README had 4 `.html` stragglers and `.htaccess` lacked the `.html`→`/` redirects `_redirects` already had        | README → directory form; added the 21-slug `/countries/<slug>.html`→`/countries/<slug>/` 301 block to `.htaccess`                                     | `npm run check-links` green (390 files); sitemap 212 unchanged                                                                    |
| D5  | ✅ Guarded | Dead `X-Frame-Options` `<meta>` (no-op; real header is in `_headers`/`.htaccess`) already swept to **0** site-wide, but no regression guard existed                                                      | `tests/security-meta-guard.test.js` — walks all public HTML, fails if a dead XFO meta returns                                                         | guard passes clean; fails when a meta is injected; tests 1240→1241                                                                |
| D6  | ✅ Fixed   | Shared footer used `<h4>`/`<h5>` → `h2→h4` skipped level on every page; masthead `<nav>` had no banner landmark; (tracker `<h1>` run-on already fixed on main)                                           | footer `h4/h5`→`h2/h3`; wrapped nav in `<header class="site-header" role="banner">` with `.site-header{display:contents}` (keeps sticky)              | S1 harness on home/tracker/country: h1=1, banner present (`getByRole('banner')=1`), **0 skips**; sticky pinned at scroll 0 & 2000 |
| D2  | ✅ Fixed   | `offline.html` (SW fallback served for **arbitrary** URLs) linked `favicon.svg`/`critical.css`/`global.css` **relatively** → broke from `/countries/…`                                                   | made the 4 refs root-absolute (analytics was already `/assets/…`); `tests/fallback-page-asset-paths.test.js` guard                                    | guard test-the-test (pass clean / fail on injected relative); 404.html already clean                                              |
| D3  | ✅ Fixed   | `shop_listings` **404** (table not deployed — PGRST205); legacy `shops` fallback returns a **mismatched schema** (`country`/`is_verified`) → `mapRow` mangled it → curated directory silently downgraded | query **only** the canonical `shop_listings`; on 404/empty keep curated `data/shops.js` (never blank); **anon key only**, no service-role             | live anon probe: `shop_listings`=404, `shops`=200-mismatched; tests +2 (canonical-only, no service-role ref)                      |
| D7  | 📋 Filed   | Imagery ~100% CSS/SVG (0 `<img>`, 0 `<picture>`); no content image assets; optimised delivery is staged **Phase 13**                                                                                     | [`docs/plans/2026-06-27_d7-imagery-plan.md`](docs/plans/2026-06-27_d7-imagery-plan.md) — `<img>` contract + candidate surfaces + staging              | grep: 0 `<img>` / 0 `<picture>`; validate basic-a11y "0 images"                                                                   |
| D9  | 📋 Filed   | Homepage Cairo at 5 weights × {arabic, latin, latin-ext} = **15 woff2** + `local()` ≈ **16 faces**; `latin-ext` unused; self-host/subset is staged **Phase 11**                                          | [`docs/plans/2026-06-27_d9-fonts-plan.md`](docs/plans/2026-06-27_d9-fonts-plan.md) — drop latin-ext, trim weights, self-host subset, preload one face | fetched Cairo css2 → 15 `@font-face` blocks; `display=swap`/preconnect already present                                            |

Discovered (out of D1 scope, not a live 404): 69 city pages link `../../../../styles/global.css`
(one `../` too many); browsers clamp `../` at root so it resolves to `/styles/global.css` in
production — latent, fix as a follow-up. **Reconciliation 2026-07-03: fixed** — the depth fix landed
2026-06-30 (see `PLAN.md` "Multi-task session 2026-06-30"); a fresh sweep of all 336 HTML files
referencing `global.css` found zero unresolvable stylesheet paths.

- **Branch:** `claude/elegant-cori-lyo379` · **PR:** vctb12/GoldTickerLive#443
- **Baseline:** 1081 tests passing, 0 failing — held green on every committed phase.
- **Legend:** ✅ committed (GREEN) · 🟥 staged only (RED → `OWNER_REVIEW.md`) · 🟦 GREEN staged as a
  proposal (judgment-heavy/large — plan + risk below) · ⏭️ spec only · ⤴️ out of scope for #443

## 🟢 2026-06-27 Tracker design + UX rebuild (branch `claude/gold-ticker-live-overhaul-puf4va`)

Resuming **Tracks B–G** of
[`docs/plans/2026-06-26_tracker-html-50-phase-revamp.md`](docs/plans/2026-06-26_tracker-html-50-phase-revamp.md).
One green PR per phase-cluster, baseline **1240 → 1246 tests / 0 fail**; lint + style + validate +
build green on every commit. LOCKED pricing intact (verified
`usdPerGram(4048.60, 24K)=130.1654 → ×3.6725 = 478.03 AED/g`; peg 3.6725; troy-oz 31.1035; 7
karats). Freshness honesty respected (`getFreshnessModel().effectiveKey`).

- **S1 visual harness** — `scripts/node/tracker-shots.mjs` captures the tracker across EN+AR ×
  390/1366 × light/dark for paired before/after evidence (output
  `docs/plans/_artifacts/tracker-shots/`, gitignored + regenerable). Drives every cluster below.
- **Cluster 1 — honest price direction + AA-legible movement colours** (slices of plan Phases
  7/8/10/17):
  - **No default "up = green".** Day-change strip, hero-stat day-change, and karat-table change
    cells used `delta >= 0 ? up : down`, so a rounded-to-zero change rendered as a green ▲ up-move.
    New shared `classifyDelta(value, epsilon)` + `DIRECTION_GLYPH` (`src/tracker/_ctx.js`) add a
    `flat` band → neutral copy (`tracker.heroChangeStripFlat`, EN+AR) and neutral `--flat` styles;
    ▲/▼/• keep direction legible without colour alone. Guarded by `tests/tracker-direction.test.js`
    (6).
  - **AA on the always-dark hero.** The hero is dark in both site themes but used the light-theme
    green (`#176832`), measured **2.58:1 (FAIL)** by pixel-sampling. Remapped movement colours on
    `.tracker-hero-wrap` to new `--color-move-up/down-strong` tokens → measured **flat 13.68:1 / up
    8.42:1 / down 5.65:1 (light) and ≈8–13:1 (dark) — all PASS**.
  - **Numeric rhythm.** `tabular-nums` + `font-variant-numeric` extended to the hero readout values
    (`#tp-readout-spot-value`, `#tp-readout-selected-value`, `.tracker-hero-readout__v`) so digits
    don't reflow on the 90 s tick.
  - **Review follow-up (PR #458, Gold Integrity Agent):** unified the day-change direction basis —
    the strip classified on dollar amount while hero-stat + karat cells used percent, so a sub-0.01%
    move could read ▲ in the strip and • flat beside it. All three now classify on percent; added a
    `flat` hero-stat string (`heroStatDayChangeFlat`, EN+AR), harmonized the AR
    `heroChangeStripFlat` preposition to `مقابل`, and added a cross-surface guard test.
- **Cluster 2 — clear loading skeleton when content arrives** (slice of plan Phase 15):
  - The hero badge row (`#tp-xauusd-value`, `#tp-live-badge-text`, `#tp-refresh-badge`) and the five
    mobile-dock readouts carried the `skeleton-inline` shimmer + `shell-skeleton-*` size classes on
    themselves; the render path set their text but never removed the classes, so the shimmer sat
    behind the value (a leftover light box) and pinned the element to the skeleton's fixed size.
  - Extended the unused `clearSkeletonBusy` into `clearSkeleton` (`src/components/skeleton.js`) — it
    now strips `skeleton-inline` + `shell-skeleton-*` + `aria-busy` while preserving layout/state
    classes — and wired it into `renderHero` for all eight self-skeleton nodes. Guarded by
    `tests/tracker-skeleton.test.js` (3). Before/after captured via the S1 harness.

## 🟢 2026-06-26 Overhaul session (branch `claude/tracker-html-revamp-bpk97i`)

Separate from PR #443. Full record:
[`docs/plans/2026-06-26_overhaul-session-report.md`](docs/plans/2026-06-26_overhaul-session-report.md).
28 gated commits, baseline 1205 → **1218 tests / 0 fail**; lint + style + validate + build green on
every commit; LOCKED pricing intact (24K AED/g = 478.03); **0 runtime leaked i18n keys** across 6
pages × EN/AR.

- **Defects:** D1 (country `.html` 404s), D2 (404/offline relative analytics), D5 (dead
  `X-Frame-Options` meta in 383 files), D6 (tracker `<h1>` run-on), D8 (missing i18n keys + leaked
  `source.estimated`) — all ✅ fixed + guarded. D3 verified-OK (anon-key fallback). D4 home RTL / D7
  imagery / D9 fonts / D6-homepage headings+landmark — ⬜ outstanding.
- **Reliability:** freshness-honesty export fix (no non-live data labelled "live"); dead-code
  removal.
- **a11y:** single price live region, ESC-in-modal, 44px targets.
- **i18n parity (Ultracode-driven):** ✅ tracker fully localized; ✅ home chrome; ✅ calculator
  (local-dict + breakdown labels); ✅ methodology (18 headings); ✅ country (skip link + method
  link). ⬜ shops (105 KB local `TXT` dict + `initNearMe`), home FAQ, tracker wire/keyboard +
  method-mode rich bodies.
- **Guards (CI):** `tests/i18n-sitewide-guard.test.js` (EN/AR parity + global-helper keys +
  data-i18n) + `tests/tracker-i18n-key-coverage.test.js` + runtime `npm run i18n:leaked-scan`.
- **⬜ Not started:** tracker design-token redesign (Tracks B–G), full
  functional/offline/debug-panel QA, README prose reconciliation, Phase B page regeneration.
  Datasets staged under `docs/plans/_artifacts/`.

## ✅ Completed GREEN phases (live on the branch)

| Phase  | Scope                                                                                     | Verified                                              |
| ------ | ----------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 03     | Dark-mode fork removed; `tokens.css` single source + OS-dark first-paint fallback         | a11y/contrast (dark AA), stylelint, 1081/0            |
| 04     | Strip retail `Product`/`Offer`/`AggregateOffer` schema from ~150 reference pages          | schema `--check`, audit-content-pages, grep=0, 1081/0 |
| 05     | Sitemap emits canonical `/countries/{slug}/` (no redirected/dup URLs)                     | sitemap-coverage gate, 1081/0                         |
| 09     | Collapse leaf-page CSS `@import` waterfall (dist-only flatten)                            | flattener 9/9 inlined, source intact, 1081/0          |
| 12     | Defer GA4 + Clarity to first interaction / idle                                           | externalize-analytics `--check`, eslint, 1081/0       |
| 16     | Remove hardcoded-English tracker onboarding modal (EN/AR parity)                          | eslint, no dangling refs, 1081/0                      |
| 17     | i18n tracker toasts + workspace toggle + badge placeholders (EN+AR)                       | eslint, no raw literals, 1081/0                       |
| 18     | Reduced-motion: disable 2 uncovered infinite hero animations                              | stylelint, 1081/0                                     |
| 20     | Tracker RTL: logical props for keyboard-help close + table cells                          | stylelint, 1081/0                                     |
| 22     | Touch target: `.gcc-region-tab` 38px→44px                                                 | stylelint, 1081/0                                     |
| 23     | 360px GCC grid — verified audit false-positive; removed dead code                         | first-hand cascade analysis, stylelint, 1081/0        |
| 25     | Correct `DESIGN_TOKENS.md` drift + source-of-truth warning                                | doc-only, 1081/0                                      |
| PR-fix | Preserve Article `datePublished` across rebuilds; restore true dates on ~44 content pages | validate, no 2026-06-25 left, 1081/0                  |

## 🟥 RED — staged only (see `OWNER_REVIEW.md`; not applied to live infra)

01 RLS lockdown (`002`), 02 allowlist/signup hardening, 06 billing fail-closed, 07 public-insert
hardening (`003`), 08 RLS regression assertions, 10 inline critical CSS, 11 async/self-host fonts,
13 image pipeline, 14 Leaflet SRI, 15 Lighthouse gate, 43 AR `/ar/` path + hreflang, 46 GDPR
export/delete, 48 automation durability. **Blocking owner questions A (signups on/off) & B (orders
write path) are at the top of `OWNER_REVIEW.md`.**

## 🟦 GREEN — staged as proposals (judgment-heavy / large; plan + risk)

Each is independent and revertible; left staged rather than guessed into a degraded state on a live
site, per the run directive.

- **19 / 21 — Home & shops RTL sweeps.** _Plan:_ convert physical `left/right`, `padding-*`,
  `text-align:left/right` to logical props (`inset-inline-*`, `padding-inline-*`, `start/end`) in
  `styles/pages/home.css` + `shops.css`. _Risk:_ both files contain manual `[dir='rtl']` override
  blocks — a blind sweep would invert those (e.g. an override's `text-align:right`→`end` flips it).
  Needs per-rule classification (default vs `[dir=rtl]` block) + a 360px RTL visual check. (Phase 20
  was safe only because it was 2 confirmed-directional controls, not a sweep.)
- **24 — Tracker mobile label floor.** _Plan:_ raise sub-0.8rem label/badge/tab text to a ~13px
  floor at `tracker-pro.css:513,561,1674,2454,3430,3435`. _Risk:_ several of those selectors are
  dense numeric/stat displays where 0.8rem would bloat/break the layout — needs per-selector intent
  judgment, not a blanket bump.
- **26 — Stylelint guard (ban raw hex/rgb + off-scale spacing).** _Plan:_ add `color-no-hex` /
  allowed-list rules scoped to exclude `tokens.css`. _Risk:_ the repo ships ~52 intentional
  `var(--token, #hexfallback)` patterns and ~549 hex literals — a strict rule fails
  `npm run lint:css` repo-wide on existing code; must be scoped + the backlog migrated first.
- **27 / 28 — Bring `invest.css` / `methodology.css` into the token system.** _Plan:_ re-base their
  parallel palettes (`--invest-bg`, hardcoded `#05060b` hero) onto global tokens; scope any dark
  hero to a class. _Risk:_ visual change to two live pages (invest is always-dark today) — needs
  before/after EN+AR review.
- **29 — Consolidate duplicate `prefers-color-scheme` blocks (8 files).** _Plan:_ drop the
  media-query dark twins now that `[data-theme]` is canonical (phase 3). _Risk:_ behavior change for
  no-JS/first-paint dark; needs per-file verification.
- **30 / 31 — Spacing half-steps + breakpoint tokens.** _Plan:_ add `--space-4-5/6-5`, `--bp-*`.
  _Risk:_ low to add, but valueless without adoption across files (the real work); adding unused
  tokens alone is scope-creep.
- **32 — Homepage hierarchy / section consolidation.** Large restructure of `index.html` +
  `home.css` (merge overlapping tool/country grids). Needs design direction + EN/AR/360 review.
- **33 — Component-token layer** (`--card-*`, `--chip-*` between primitives and `components.css`).
  Large; touches the 4.2k-line components.css.
- **34 — Country/city premium pass.** Large visual; `country-page.css` / `city-page.css`.
- **35 — Shop card/directory redesign** (finish BUILD 7). Large; `shops.html/.css/.js`.
- **36 / 37 / 38 — Split mega CSS files / semantic section headers / `!important` audit.** 36 is
  large+risky (reorganising 4k-line files); 37 is safe but pure comment churn; 38 is judgment-heavy
  and best done after 29.
- **39 — `gold-shops` stub resolution** (noindex or redirect-merge 69 empty pages). Generator +
  `_redirects` + 69 pages; needs the noindex-vs-redirect decision.
- **40 / 44 — Enrich thin gold-rate pages / expand thin content hubs.** Content generation at scale.
- **41 — Acronym breadcrumb humanizer (`Uae`→`UAE`).** _Plan:_ add an acronym map in
  `inject-schema.js`, re-run the injector. _Risk:_ injector-rerunning pass (rewrites all breadcrumb
  JSON-LD + regenerates reports) — explicitly flagged to stage. Now safe re: dates (the preserve-fix
  is in), so this is ready to run as a focused follow-up.
- **42 — Leaf internal links + visible breadcrumbs.** `page-hydrator.js` + templates; large.
- **25b — Auto-generate `DESIGN_TOKENS.md` from `tokens.css`** (build step) so the doc can't drift.

## ⤴️ Out of scope for PR #443 (tracked for a separate follow-up PR, per directive)

- **45** — "Live / Updated every 90 seconds" meta + `Dataset.description` wording on country/city
  pages → reference/state-labelled framing per `docs/freshness-contract.md` (pre-existing; flagged
  by the SERP/Gold-Integrity bots).
- `detectPageType()` build-time FAQ/Dataset gap on country hubs (JS-only injection today).
- Identical `<title>` on indexed hub vs `noindex` `gold-price/` stub.
- Country/city/tracker intent-cannibalization metas.

## ⏭️ SKIP — spec only (see `OWNER_REVIEW.md`)

- **49** — Multi-metal (silver/platinum/palladium) reference expansion.
- **50** — Public dev API + portfolio/watchlist + web-push.

## 47 — Observability (notify-on-failure across workflows)

🟦 staged. _Plan:_ add a notify-on-failure step (open a GitHub issue via `GITHUB_TOKEN`) to
`health_check.yml` / `spike_alert.yml` / newsletter workflows. _Risk:_ touches CI/automation and
can't be verified without an actual failing run in this environment; needs the notify-channel
decision (issue vs Slack). Left staged.
