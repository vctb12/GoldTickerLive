# Gold Ticker Live — Revamp Progress (PR #443)

- **Branch:** `claude/elegant-cori-lyo379` · **PR:** vctb12/GoldTickerLive#443
- **Baseline:** 1081 tests passing, 0 failing — held green on every committed phase.
- **Legend:** ✅ committed (GREEN) · 🟥 staged only (RED → `OWNER_REVIEW.md`) · 🟦 GREEN staged as a
  proposal (judgment-heavy/large — plan + risk below) · ⏭️ spec only · ⤴️ out of scope for #443

## 🟢 2026-06-27 S0 session (branch `claude/gold-ticker-live-overhaul-c0b6pl`)

Track: **propagate the new system + harden the whole, then reconcile docs.** Baseline re-verified
green before any change: `npm test` **1240 pass / 0 fail** (146 suites) · `npm run lint` clean ·
`npm run style` clean · `npm run validate` exit 0 · `npm run build` exit 0. LOCKED pricing assertion
re-verified through the real `src/lib/price-calculator.js`: `usdPerGram(4048.60, 1.0) = 130.1654` →
`× 3.6725` = **AED/g 24K = 478.03** (divisor 31.1035, peg 3.6725 intact).

**Commit 1 — generated-report + freshness-model doc truthfulness (GREEN):**

- **Report staleness root-caused & fixed.** `reports/seo/governance.json` +
  `reports/analytics/event-inventory.json` were prettier-formatted (array-compaction) while their
  `--check` generators emit multi-line arrays, so `npm run validate` permanently printed two
  "report is stale" warnings. Added both to `.prettierignore` (matching the sibling deterministic
  reports already exempt there) and regenerated them in generator format. Validate now prints
  `[seo-governance] check ok (376 pages…)` — **0 stale warnings** (was 2); still exit 0.
- **Freshness-model docs reconciled to code.** The canonical model is `getLiveFreshness()` (6 keys:
  `live`/`delayed`/`cached`/`stale`/`fallback`/`unavailable`) + `closed` from
  `getFreshnessModel()`, with `STALE_AFTER_MS = 75 min` / `DELAYED_AFTER_MS = 30 min`. The stale
  "12 min / 4 states" model survived in `docs/GOLD_TICKER_LIVE_AGENT_PROMPTS.md` (12 occurrences,
  incl. "Locked" / "Do not change" claims that would mislead a future agent into reverting the
  constant) and a factual error in the active plan `docs/plans/2026-06-26_tracker-html-50-phase-revamp.md`
  (§1 table + Phase 18). All reconciled. `docs/tracker-state.md` + `README.md` were **already**
  reconciled by the prior overhaul session — verified, left as-is.
**Commit 2 — site-wide `<header role="banner">` landmark (GREEN; design-system / a11y propagation):**

- The JS-injected nav (`src/components/nav.js`, universal via `site-shell` / `content-page-boot` /
  `page-hydrator` / per-page boots) rendered a `<nav role="navigation">` but **no banner
  landmark** — only 1 of 11 root pages had any `<header>`. Wrapped the nav in
  `<header class="site-header" role="banner">` and added `.site-header { display: contents }`
  (`components.css` + `critical.css`) so the wrapper generates no box — the sticky nav keeps
  `<body>` as its containing block. Updated the `navEl` lookup in nav.js to find the nav inside the
  wrapper (so `applyPageShell` still tags it).
- **Verified with Playwright (chromium) against the dev server, before→after:**
  - `getByRole('banner')` = **1** on home/shops/tracker/calculator/methodology (was 0); each page
    now has `banner > navigation` + `main`. `display:contents` does **not** strip the landmark.
  - **Zero layout shift:** nav `getBoundingClientRect().top` identical before vs after
    (home 51.4/53 px, calculator 92.7/105.1 px @ 390/1366); nav stays `position:sticky` and pins on
    scroll. Desktop before/after screenshots pixel-identical.
  - **RTL:** `?lang=ar` → `dir=rtl` / `lang=ar`, **zero horizontal overflow** at 390 and 1366.
  - Banner template + `.site-header{display:contents}` present in the built `dist/` (footer JS
    chunk + critical & global CSS bundles).
- Full gate GREEN: `npm run lint` 0 · `npm run style` 0 · `npm test` **1240/0** · `npm run validate`
  exit 0 (basic-a11y gate + AA contrast pass) · `npm run build` exit 0.

- **Grounding findings (no change — documented for honesty):** `npm run check-links` GREEN (390
  files, all internal links resolve). `sitemap.xml` already matches its generator (`npm run build`
  leaves the tree clean). The `seo-audit` "28 pages not in sitemap" set is dominated by
  intentional/redirect/app pages and the sitemap is **test-locked** (`tests/sitemap.test.js`
  explicitly expects `/methodology.html`) — out of scope without owner sign-off. `feed.xml` is
  generated at deploy (`deploy.yml` → `generate-rss.js`) but is undiscoverable (no
  `<link rel="alternate" type="application/rss+xml">`, not in `robots.txt`) — flagged as a follow-up.

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
