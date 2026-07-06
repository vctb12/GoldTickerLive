# Master Gold Ticker Live — Website Audit & Net-New 20-Phase Plan

```yaml
doc-class: audit + forward-plan
status: draft-for-owner-review
created: 2026-07-06
author: coding agent (session: master website diagnosis)
branch: claude/goldtickerlive-audit-roadmap-6xrl8q
scope: grounded site audit + immediate safe fixes + a net-new 20-phase plan
reconciles-with:
  - docs/revamp/MASTER-50-PHASE-PLAN.md (50-phase revamp)
  - docs/revamp/00-AUDIT.md (2026-06-30 live audit)
  - docs/revamp/PROGRESS.md
  - docs/plans/2026-07-04_product-roadmap.md (owner roadmap r2)
  - OWNER_REVIEW.md (RED-zone staged changes)
non-duplication-rule: this plan adds only work NOT already covered by the docs above
cost-rule: every item here is $0-to-run (static frontend, build-time, or CI only)
```

## 1. Title & scope

This document does two things:

1. **Diagnoses the live/repo state of Gold Ticker Live** with evidence, and records the safe,
   high-value, non-owner-gated fixes shipped in this same branch (the `learn.html` read-progress
   counter, the `InvalidStateError` view-transition abort, and a dead-links regression on the learn
   hub).
2. **Proposes a genuinely net-new 20-phase plan** that fills white space the existing 50-phase
   revamp and the 2026-07-04 product roadmap do **not** cover — without duplicating shipped work,
   without resurrecting owner-removed/parked items, and without colliding with the in-flight
   `feat/ui-overhaul` (PR #530).

Out of scope: redesigns, architecture rewrites, owner-gated production surfaces (pricing workflows,
billing, Supabase RLS, `sw.js`), and anything requiring paid APIs or a running backend.

## 2. Executive summary

- The **live homepage and price widget work** (spot price, O/H/L, cached/live badge, timestamp). The
  earlier claim that "learn.html is empty" is **false** — all nine featured guides render in four
  sections, and real guide content (e.g. the "Gold Karats Explained" comparison table + price
  formula) is present. The **real** learn.html bug was narrow: the **"Read 0 of 9 featured guides"
  counter never incremented**, the console threw
  **`InvalidStateError: Transition was aborted because of invalid state`**, and cards briefly showed
  a faded reveal state.
- **Root cause of the counter bug (confirmed):** the guide cards deep-link to in-page anchors
  (`/learn.html#karats`), but the click handler persisted a **slash-stripped** id
  (`learn.html#karats`) that never matched the catalog's canonical `guide.href`
  (`/learn.html#karats`). Read state never round-tripped, so the counter was permanently stuck at 0
  across reloads.
- **Root cause of the console error (confirmed):** `src/lib/motion-boot.js` calls
  `document.startViewTransition(() => location.href = …)` on same-origin link clicks; navigating
  away aborts the transition and rejects its promises with `InvalidStateError`, and the code never
  handled those promises → an uncaught rejection in the console.
- **Both fixed in this branch**, plus a third bug discovered during verification: the learn hub's
  "Keep exploring" related-tool links were rendered **href-less (dead)** because
  `safe-dom.safeHref()` drops bare-relative URLs.
- **Verified end-to-end in headless Chromium** (desktop 1280 and mobile 360, View Transitions
  enabled): counter goes 0→1 live on click, persists across reload, deep links and back/forward mark
  reads, no uncaught `InvalidStateError`, no stuck-faded in-viewport cards, no horizontal overflow,
  all four related links clickable. Full suite: **1286/1286 tests, lint/validate/build all green.**
- The **20-phase plan** below is net-new: internal-link/anchor integrity gates, a console-error
  regression budget, a JS-hydration fail-open contract, on-site content search, learn-hub engagement
  depth, editorial (content) freshness, save-data mode, a durable mobile-viewport verification
  harness, and documentation-clarity work — none of which appear in the 50-phase revamp or the
  roadmap.

## 3. Sources reviewed

**Repo instruction / governance files (read first, per README/CLAUDE.md):**
`prompts/master-rerun.md`, `AGENTS.md`, `docs/plans/2026-07-04_product-roadmap.md`,
`OWNER_REVIEW.md`, `docs/revamp/00-AUDIT.md`, `docs/revamp/MASTER-50-PHASE-PLAN.md`,
`docs/revamp/README.md`, `docs/revamp/PROGRESS.md`, `CLAUDE.md`, `src/lib/safe-dom.js`.

**Code inspected for the learn.html diagnosis:** `learn.html` (static fallback markup),
`src/pages/learn.js`, `src/pages/learn-hub-ui.js`, `src/config/learn-hub-catalog.js`,
`src/lib/reveal.js`, `src/lib/page-enter.js`, `src/lib/motion-boot.js`,
`scripts/node/render-learn-static-fallback.mjs`, `tests/reveal-fail-open.test.js`,
`tests/learn-static-fallback.test.js`.

**Commands run** (see §13 for the full log): `npm install`, `npm test` (1286 tests), `npm run lint`,
`npm run validate`, `npm run build`, plus targeted Playwright verification against a `vite preview`
build in the pre-installed Chromium.

**Live/build checks:** learn page behaviour exercised in Chromium at 1280×900 and 360×740 with View
Transitions enabled and `reducedMotion: no-preference`; before/after evidence screenshots in
`docs/audits/evidence/`.

**GitHub state:** open PRs confirmed via the GitHub API — `#531/#532/#533` Dependabot bumps and
`#530` (`feat/ui-overhaul`, "Dual-theme premium gold design system"). PR #530 changes **55 files**;
**none overlap** the six files this work touches, and it touches no learn/motion/reveal code.

**Honesty note on scope of verification:** the learn.html findings were reproduced against a local
`vite preview` build of this repo, not against the deployed `goldtickerlive.com` at audit time. The
prior `docs/revamp/00-AUDIT.md` P1/P2 items were **not** independently re-verified against live
production in this pass; `docs/revamp/PROGRESS.md` already records a 2026-06-30 live-QA verdict that
"most audit items are already fixed or not reproducible," so they are treated as _already covered_
(see §4) rather than re-litigated here.

## 4. Existing-work reconciliation

**What the repo already has (do not rebuild):** mature static multi-page site (vanilla ES modules +
Vite), Express admin, Supabase, PWA (`sw.js` v19), 15 country sites, bilingual EN/AR with RTL, 1200+
tests across 130+ files, full CI, and a large docs corpus.

**Covered by the 50-phase revamp (`docs/revamp/MASTER-50-PHASE-PLAN.md`) — do not duplicate:**

| Wave | Phases | Theme (owned there)                                                                                                          |
| ---- | ------ | ---------------------------------------------------------------------------------------------------------------------------- |
| 0    | 1–5    | Regression tests, CI, design tokens, Lighthouse/a11y budgets, page inventory                                                 |
| 1    | 6–14   | Canonical, `/ar/` routes, localized meta, hreflang, sitemap, robots, JSON-LD (breadcrumb/price), AR parity, methodology i18n |
| 2    | 15–22  | Freshness thresholds/vocabulary, chart reconciliation, quick-convert seed, trust chip, disclaimers, degraded states          |
| 3    | 23–30  | Nav breakpoint, mobile header, handoff layout, bidi, checklist headings, country responsive, theme toggle, CLS               |
| 4    | 31–36  | Contrast, focus/keyboard, semantics/landmarks, SR live prices, reduced-motion, alt text                                      |
| 5    | 37–42  | Bundle consolidation, favicon/PWA icons, fonts, images, caching/SW, analytics/consent                                        |
| 6    | 43–47  | OG/brand images, hero art, micro-interaction polish, dark-mode QA, iconography                                               |
| 7    | 48–50  | Internal linking/pSEO QA, bilingual regression gate, launch/monitoring/docs                                                  |

Per `docs/revamp/PROGRESS.md`, most of these are **todo**; a few shipped as open PRs (Phase 00 repo
map #470, Phase 18 quick-convert #474, Phase 27 checklist headings #471). The one "real open P0" is
the Arabic `/ar/` homepage indexability (Phases 06–09/13–14).

**Covered by the product roadmap (`docs/plans/2026-07-04_product-roadmap.md`) — do not duplicate:**
multi-source pricing (1, owner-gated), silver/platinum/palladium (2), premium tier (3, RED),
Instagram+LinkedIn automation (5, $0-conditional), crypto-gold (8), Google Sheets plugin (10), Web
Push (11, `sw.js`-gated), multi-language FR/UR/HI (12), dev API (13), white-label (14), mobile app
(16), AI analysis (17), **Telegram automation (18)**, **repo-committed daily history (19)**,
**public RSS/JSON price feed (20)**, **embed-widget configurator (21)**.

**Already shipped (do not restate as new work):** Portfolio tracker (`portfolio.html`, item 6, PR
#494) and Interactive world heatmap (`heatmap.html`, item 7, PR #494), both with unit tests.

**Owner-removed / parked (must NOT appear as active build phases):** ❌ Email newsletter automation
(removed, item 4), ❌ WhatsApp Business API alerts (parked, $0-rule violation, item 9), ⏸️ Stripe
payments for ordering (parked "maybe later," item 15). These appear here only in the risk/compliance
sections as parked/owner-gated.

**In progress (do not collide):** `feat/ui-overhaul` / PR #530 — dual-theme premium design system +
its own P0 fixes (returning-visitor crash, shops default tab). Verified non-overlapping with this
work.

**Net-new white space this plan claims:** `learn.html` engagement, reading-progress UX,
IntersectionObserver reveal robustness _as a correctness concern_ (not just Phase 35
reduced-motion), View-Transitions abort handling, internal-link/anchor integrity as a CI gate,
JS-hydration fail-open as a reusable contract, on-site content search, editorial (content-review)
freshness distinct from price freshness, save-data mode, privacy-local engagement signals, and
documentation clarity.

## 5. Findings table

Status legend: **fixed-now** (shipped this branch) · **recommended** (net-new phase below) ·
**owner-gated** · **parked** (owner decision) · **already-covered** (owned by an existing doc/PR).

| ID  | Area                        | Finding                                                                                            | Evidence                                                                                                                                                                                                            | Severity                    | Affected files/pages                                                                       | Root cause                                                                                             | Recommended fix                                                                                                                          | Status              |
| --- | --------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| F1  | Learn / engagement          | "Read 0 of 9 featured guides" never increments, even after visiting guides & reloading             | `src/pages/learn-hub-ui.js` old click handler `card.getAttribute('href')?.replace(/^\//,'')` stored `learn.html#karats`; catalog `guide.href` is `/learn.html#karats`; readback filter `g.href === h` never matched | High                        | `learn.html`, `src/pages/learn-hub-ui.js`, `src/config/learn-hub-catalog.js`               | Leading-slash normalization mismatch between stored id and canonical href                              | Store/compare canonical `guide.href`; count read _cards_ (shared pure `countReadGuides`); live counter update; hash + delegated tracking | **fixed-now**       |
| F2  | Motion / console            | `InvalidStateError: Transition was aborted because of invalid state` on navigation from learn.html | `src/lib/motion-boot.js` `document.startViewTransition(() => location.href=…)` with no handling of the returned promises                                                                                            | Medium                      | sitewide (`src/lib/motion-boot.js`)                                                        | Navigation aborts the pending view transition; its rejected `.ready/.finished` promises were unhandled | Swallow the expected abort rejections; skip cross-doc transitions for same-document (hash) nav                                           | **fixed-now**       |
| F3  | Internal linking            | Learn hub "Keep exploring" links render with **no href** (dead) after JS hydration                 | In-browser: `.related-tool-row a` had `getAttribute('href') === null`; `safeHref('calculator.html')` returns `''` (bare-relative rejected)                                                                          | Medium                      | `learn.html`, `src/pages/learn-hub-ui.js`, `scripts/node/render-learn-static-fallback.mjs` | `el('a',{href:'calculator.html'})` → `safeHref` drops bare-relative → attribute never set              | Use root-relative `/calculator.html` etc.; regenerate static fallback                                                                    | **fixed-now**       |
| F4  | Internal linking (systemic) | Same bare-relative `safeHref` drop likely affects other JS-rendered links                          | Grep: `href: 'calculator.html'`/`'methodology.html'`/`'tracker.html'` in `QuickConvertWidget.js`, `MethodologySection.js`, `LocationGuideSection.js`, `tracker/*`, `pages/heatmap.js`                               | Medium (needs-verification) | multiple `src/components/*`, `src/tracker/*`, `src/pages/heatmap.js`                       | Bare-relative hrefs passed to `el()`/`safeHref`                                                        | Repo-wide sweep + CI guard (see Phase 1)                                                                                                 | **recommended**     |
| F5  | Motion / a11y               | Guide cards briefly render faded (opacity 0 → reveal)                                              | `styles/partials/utilities.css` `[data-reveal]{opacity:0}` until `.is-in-view`; `ensureRevealed()` force-reveals in-viewport nodes                                                                                  | Low (by design)             | `src/lib/reveal.js`, `src/pages/learn-hub-ui.js`                                           | Intended scroll-reveal; not stuck. Verified in-viewport cards = opacity 1, below-fold reveal on scroll | Keep; harden as a contract (Phase 4/5)                                                                                                   | **already-covered** |
| F6  | Learn / counting            | Two featured cards share `#pricing`, so one visit marks 2 cards read                               | `src/config/learn-hub-catalog.js` (`/learn.html#pricing` appears twice)                                                                                                                                             | Low (by design)             | `src/config/learn-hub-catalog.js`                                                          | Distinct cards, shared anchor/content                                                                  | Count read _cards_ so tally reaches "of 9", capped, deduped; documented                                                                  | **fixed-now**       |
| F7  | SEO / bilingual             | Arabic homepage still `noindex` + canonical→EN; hreflang `ar`→`?lang=ar`                           | `docs/revamp/PROGRESS.md` "one real open P0"; `docs/revamp/00-AUDIT.md` P0-1                                                                                                                                        | High                        | `index.html`, AR route generation                                                          | Split-brain bilingual (client toggle vs `/ar/` scheme)                                                 | Owned by 50-phase Phases 06–09/13–14                                                                                                     | **already-covered** |
| F8  | Pricing automation          | `gold-price-fetch.yml` / `post_gold.yml` are production-critical                                   | `AGENTS.md` operational guardrails; `OWNER_REVIEW.md` Phase 48                                                                                                                                                      | n/a                         | `.github/workflows/*`, `data/gold_price.json`                                              | —                                                                                                      | Audit only; owner approval required                                                                                                      | **owner-gated**     |
| F9  | Security                    | ~30 admin RLS policies `to authenticated using (true)`; anon signup toggle load-bearing            | `OWNER_REVIEW.md` Phases 1/2/7 (staged migrations)                                                                                                                                                                  | High                        | `supabase/migrations/*`, dashboard                                                         | Permissive RLS + client-only allowlist                                                                 | Owner answers A/B, then apply staged migrations                                                                                          | **owner-gated**     |
| F10 | Growth ($0)                 | Telegram / daily-history / RSS-JSON / embed configurator                                           | roadmap items 18–21                                                                                                                                                                                                 | n/a                         | workflows + frontend                                                                       | —                                                                                                      | Owned by roadmap; not duplicated here                                                                                                    | **already-covered** |
| F11 | Growth (removed/parked)     | Newsletter, WhatsApp alerts, Stripe ordering                                                       | roadmap r2 (items 4/9/15)                                                                                                                                                                                           | n/a                         | —                                                                                          | Owner cost/legal decisions                                                                             | Do not build; parked/removed                                                                                                             | **parked**          |

## 6. Detailed finding — learn.html read-progress counter (F1, F6)

**Symptom.** On `learn.html`, "Read 0 of 9 featured guides" never moved off 0, even after opening a
guide and returning.

**Reproduction (pre-fix).**

1. Open `learn.html`; note "Read 0 of 9 featured guides".
2. Click the "24K vs 22K vs 18K" card (deep-links to `/learn.html#karats`).
3. Return to / reload `learn.html`. Counter still reads "0 of 9".

**Root cause.** The nine cards are **in-page anchors**, not standalone pages (see
`src/config/learn-hub-catalog.js` — every `guide.href` is `/learn.html#…`). The click handler stored
`card.getAttribute('href')?.replace(/^\//, '')` = `learn.html#karats` (slash stripped), but the
catalog's canonical id is `/learn.html#karats` (slash kept). The read-back comparison
(`g.href === h`) therefore never matched, so `readCount` computed 0 on every load. A same-document
hash click also never re-renders the counter, so even a "correct" write would not update live.

Secondary: two cards ("Spot vs retail price", "Making charges") share `#pricing`, so the total is 9
cards over 8 unique anchors — a unique-href tally could never reach "9 of 9".

**Files changed.** `src/config/learn-hub-catalog.js`, `src/pages/learn-hub-ui.js`.

**Fix summary.**

- Cards carry a canonical `data-guide-href` identity; the click handler and read-back both use it
  (no slash-stripping). Stored ids now round-trip.
- New pure `countReadGuides(readList)` counts read **cards** (via a `Set`), so the tally reaches "of
  9", is capped at the total, never double-counts a re-visit, and matches the per-card read styling
  (both `#pricing` cards flip together).
- The counter updates **live** on click (delegated handler on the per-render sections host —
  survives filter re-renders and language remounts without leaking listeners).
- A single, deduped `hashchange` listener + `guideHrefForHash()` mark a guide read when its anchor
  becomes active — covering **deep links** (`/learn.html#karats` opened directly) and **browser
  back/forward**, where no click fires.
- Private/no-storage fallback preserved: `getLearnProgress`/`markGuideRead` already swallow
  `localStorage` errors (best-effort), so the hub still renders and the counter simply stays at its
  last readable value.

**Test coverage.** `tests/learn-read-progress.test.js` (unit + source-guard): canonical round-trip,
dedup, `countReadGuides` (empty/unknown ignored, shared-anchor counts both, reaches 9, never exceeds
9), `guideHrefForHash` resolution, and a guard that the slash-strip is gone and
hash/`data-guide-href` tracking is present.

**Acceptance criteria — met (verified in Chromium desktop + mobile):** all 9 guides render · counter
reflects stored state on load · visiting a guide marks it read · returning updates 0→≥1 · re-visit
does not double-count · counter cannot exceed 9 of 9 · works on direct visits, card clicks,
back/forward, and reload.

## 7. Detailed finding — InvalidStateError & reveal/animation fallback (F2, F5)

**Symptom.** Console on `learn.html` threw
`InvalidStateError: Transition was aborted because of invalid state`; guide cards briefly rendered
faded.

**Root cause (InvalidStateError).** `src/lib/motion-boot.js` intercepts same-origin link clicks and
runs `document.startViewTransition(() => { window.location.href = destination; })`. The navigation
unloads the document, which **aborts** the pending transition; its `.ready`/`.finished`/
`.updateCallbackDone` promises reject with `InvalidStateError`. Because the returned
`ViewTransition` was never captured, the rejection was **uncaught** → console error. Additionally,
guide cards are same-document hash links (`/learn.html#karats`), which were being routed through a
pointless cross-document transition.

**Root cause (faded cards).** Expected behaviour, **not a stuck state**: `[data-reveal]{opacity:0}`
until `.is-in-view` (scroll-reveal). `learn-hub-ui.js`'s `ensureRevealed()` already force-reveals
in-viewport nodes after paint. Verification confirmed in-viewport cards settle to opacity 1 and
below-fold cards reveal on scroll — no card remains stuck.

**Files changed.** `src/lib/motion-boot.js`.

**Fix summary.**

- Capture the `ViewTransition` and attach `.catch(() => {})` to its promises — the abort is
  expected, so it is swallowed instead of surfacing as an uncaught rejection.
- `isSameOriginNavLink()` now returns `false` for same-document navigation (same
  `pathname`+`search`, only the hash differs), so in-page anchor clicks use native scrolling and
  never trigger a cross-document transition that could leave reveal content mid-fade. (Mirrors the
  existing early return for `#`-only hrefs.)

**Test coverage.** Source-guard assertions in `tests/learn-read-progress.test.js`
(`transition.ready?.catch` present; `url.pathname === location.pathname` same-doc skip present),
plus live verification: clicking a cross-page link with View Transitions **enabled** (VT=true)
produced **no** uncaught `InvalidStateError`, on both desktop and mobile.

**Acceptance criteria — met:** no uncaught `InvalidStateError` during normal load/navigation ·
reveal/View-Transition logic fails gracefully · guide cards do not remain faded.

## 8. OWNER-GATED risk register (audit only — no behaviour-changing edits made)

| Surface                                      | Risk                                                                                                     | Evidence                                                              | Recommendation (owner-gated)                                                                                            |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `.github/workflows/gold-price-fetch.yml`     | Hourly price fetch → `data/gold_price.json`; any edit can corrupt the freshness contract or double-write | `AGENTS.md` guardrails; roadmap items 1/2/19/20 all gate on it        | Any multi-source/history/feed work must go through owner review + dry-run; keep AED peg 3.6725 / troy oz 31.1035 frozen |
| `.github/workflows/post_gold.yml`            | Hourly X post; duplicate/staleness guard state can lag → double-post                                     | `OWNER_REVIEW.md` Phase 48 (`tweet_guard.py` resets on corrupt state) | Back up corrupt state + loud warning before recovery; atomic state commit. Owner sign-off + dry-run                     |
| Billing (`server/routes/billing.js`, Stripe) | Token verification fell back to anon key; premium/entitlements RED-zone                                  | `OWNER_REVIEW.md` Phase 6 (fail-closed staged)                        | Set `SUPABASE_SERVICE_ROLE_KEY`; keep fail-closed. Do not enable in static prod without owner                           |
| Supabase RLS + signups                       | ~30 admin policies `using (true)`; anon signup toggle decides live exploitability                        | `OWNER_REVIEW.md` Phases 1/2/7/8 (staged migrations)                  | Answer A (signups on/off?) + B (what writes `public.orders`?), then apply staged migrations                             |
| `sw.js` (PWA precache)                       | Precache/versioning changes can strand users on stale assets or break offline                            | `AGENTS.md`; roadmap item 11 (Web Push) gates on it                   | Any Web Push / critical-CSS-inline / precache change is owner-gated; re-run `check-sw-precache`                         |
| `src/config/constants.js`                    | AED peg + troy oz constants; changing them silently shifts every price                                   | `AGENTS.md` operational guardrails                                    | Owner approval; covered by regression tests                                                                             |

None of the above were modified in this branch.

## 9. Mobile re-verification (honest)

Prior tooling (per `docs/revamp/00-AUDIT.md`) could not shrink the viewport below ~792px, so its
phone-width findings were `[UNVERIFIED]`. **This pass could force a true mobile viewport** via
Playwright (`newContext({ viewport: { width: 360, height: 740 } })`) against a local `vite preview`
build, and the following were **personally verified at 360×740** (and 1280×900):

- All 9 guide cards render; counter starts "Read 0 of 9".
- No horizontal overflow (`scrollWidth - clientWidth ≤ 2px`).
- Counter updates live 0→1 on card tap; persists across reload; deep link + shared-anchor tallies
  correct.
- No in-viewport card stuck faded; every card reveals when scrolled into view (≥500 ms settle for
  the staggered `data-reveal-delay` transition).
- No uncaught `InvalidStateError` on same-doc tap or cross-page view transition.

**Not verified (stated plainly):** real physical devices; 320px and 414px were not exhaustively
swept (only 360px); iOS Safari / Android Chrome engine differences; the deployed production build
(testing was against this repo's preview build). Phase 20 turns this into a durable multi-width
harness so the gap closes permanently rather than per-session.

## 10. $0-to-run compliance

- **Every fix in this branch is static frontend** (JS/HTML/tests) with **zero new dependencies** and
  **zero runtime cost** — no API calls, no server, no metered service.
- **Every phase in §11 is $0-to-run**: client-side features, build-time generators, or CI gates.
  Nothing introduces a paid API, a per-message fee, or a required always-on backend.
- **Owner cost decisions preserved:** newsletter automation stays **removed**; WhatsApp Business API
  alerts stay **parked** (metered → violates the $0 rule); Stripe ordering stays **parked**
  (KYC/AML + legal). None are resurrected as active phases here.
- The roadmap's $0 growth items (Telegram 18, daily history 19, RSS/JSON 20, embed configurator 21)
  remain **roadmap-owned**; this plan does not duplicate them.

## 11. Net-new 20-phase plan

Numbering is `A1…F20` to avoid confusion with the 50-phase revamp. Every phase is $0-to-run, avoids
owner-gated surfaces (audit/recommend only), and is chosen specifically because it is **not**
covered by the 50-phase revamp or the roadmap. Risk is Low unless noted.

### Wave A — Site correctness & regression guards

**A1 — Internal-link & `safeHref` integrity sweep + CI guard.** _Why:_ F3/F4 show
`el('a',{href:'<bare-relative>'})` silently produces dead links because `safeHref()` rejects
bare-relative URLs. Internal linking is product quality (`AGENTS.md` rules 4–5). _Evidence:_ grep
hits in `QuickConvertWidget.js`, `MethodologySection.js`, `LocationGuideSection.js`,
`src/tracker/*`, `src/pages/heatmap.js`. _Relation:_ extends 50-phase Phase 48 (internal-linking QA)
but adds an automated, code-level guard it does not define. _Scope:_ audit each hit in a real
browser, convert to root-relative, add `scripts/node/check-internal-hrefs.js` (grep/AST gate wired
into `npm run validate`). _Out of scope:_ changing `safeHref`'s allowlist policy. _Files:_ the
components above + a new check script. _Acceptance:_ zero JS-rendered anchors with empty href on key
pages; CI fails on a new bare-relative `el('a')`. _QA:_ Playwright href-presence assertion per page.
_Risk:_ Low.

**A2 — Deep-link / anchor-integrity checker.** _Why:_ the counter bug's cousin — cards/TOC/nav
deep-link to `#anchors`; a renamed id silently breaks them. _Evidence:_ `learn-hub-catalog.js` hrefs
(`/learn.html#karats…`) must match ids in `learn.html`; `tests/learn-static-fallback.test.js`
asserts a few by hand. _Relation:_ net-new; complements Phase 48. _Scope:_ build-time check that
every internal `#anchor` referenced by nav/cards/TOC resolves to an `id` in the target page.
_Files:_ `scripts/node/check-anchor-integrity.js`, validate wiring. _Acceptance:_ CI fails if a
referenced anchor has no target. _QA:_ unit test with a deliberately broken anchor. _Risk:_ Low.

**A3 — Console-error / unhandled-rejection budget gate.** _Why:_ the `InvalidStateError` (F2) was
invisible to CI. _Evidence:_ no existing gate fails on console errors; the repo has Playwright but
uses it for perf only (`perf:ci`). _Relation:_ net-new; distinct from Phase 4 Lighthouse budgets.
_Scope:_ a headless smoke that loads key pages (home, learn, tracker, calculator, compare, heatmap,
portfolio) and fails on any uncaught exception / unhandled rejection / `console.error` not on a
documented allowlist. _Files:_ `tests/e2e/console-budget.spec.js` (Playwright). _Out of scope:_
fixing pre-existing preview-only 404/MIME warnings (documented, allowlisted). _Acceptance:_ CI fails
on a newly introduced uncaught error. _Risk:_ Low–Medium (flake control).

**A4 — JS-hydration fail-open contract for all dynamic hubs.** _Why:_ `learn.html` already has a
robust static-fallback + `[data-reveal]` fail-open (see `tests/reveal-fail-open.test.js`); other
hydrated hubs may blank on a stale chunk. _Evidence:_ `learn-hub-ui.js` reliability comment +
`#496`. _Relation:_ net-new; generalizes an existing learn-only contract. _Scope:_ audit
`heatmap.html`, `portfolio.html`, `shops.html`, `compare.html`, `tracker.html` for a static/skeleton
fallback + `:root:not(.js)` visibility; add the missing ones; add a shared test asserting the
invariant per hub. _Out of scope:_ redesigning any hub. _Acceptance:_ JS disabled → no hub renders
blank; a thrown mount does not strand content. _Risk:_ Low–Medium.

**A5 — View-Transitions & motion robustness matrix.** _Why:_ F2 was one instance of a sitewide
pattern in `motion-boot.js`. _Evidence:_ `initViewTransitions` intercepts all same-origin clicks.
_Relation:_ net-new correctness work; distinct from Phase 35 (reduced-motion) and Phase 45 (polish).
_Scope:_ document + test the transition contract (same-doc skip, abort-swallow,
`prefers-reduced-motion` no-op, unsupported-API no-op, `download`/modified-click bypass); add a
small test module. _Files:_ `src/lib/motion-boot.js` (already hardened), a new test. _Acceptance:_
no uncaught rejection on any nav class; reduced-motion fully bypasses. _Risk:_ Low.

### Wave B — Content discoverability & learn engagement (white space)

**B6 — Learn article scroll-spy TOC + reading-progress bar.** _Why:_ the learn article is long;
there is a TOC (`#learn-toc-root`) but no active-section indicator or progress bar. _Evidence:_
`createTocRenderer`/`toc-renderer.js`, `learn.js` `scrollToHashTarget`. _Relation:_ net-new; the
50-phase plan has no reading-UX phase. _Scope:_ IntersectionObserver scroll-spy that highlights the
active TOC entry + a top progress bar for the article; reduced-motion safe. _Out of scope:_ changing
article content. _Acceptance:_ active section tracks scroll; bar reaches 100% at end; keyboard + SR
friendly. _Risk:_ Low.

**B7 — Learn hub read-state UX: resume, reset, completion.** _Why:_ builds on the now-working
counter (F1) — add "resume where you left off," a "reset progress" control, and a hub completion
state at 9/9. _Evidence:_ `gtl_learn_guides_read` now round-trips. _Relation:_ net-new. _Scope:_
local-only, no backend; a small "resume"/"reset" affordance and a subtle 9/9 completion badge; EN/AR
strings via `translations.js`. _Out of scope:_ accounts/sync. _Acceptance:_ reset clears storage +
counter; resume scrolls to the last-read anchor; 9/9 shows completion. _Risk:_ Low.

**B8 — On-site content search ($0, build-time index).** _Why:_ no site search across
guides/glossary/FAQ; the 50-phase Phase 12 adds `SearchAction` schema but no actual search.
_Evidence:_ `glossary.html`, `learn.html`, FAQ blocks exist as static content. _Relation:_ net-new
(complements, does not duplicate, Phase 12). _Scope:_ a build-time JSON index + a client-side fuzzy
search box (no dependency or a tiny vendored one after advisory check); results deep-link to
anchors. _Out of scope:_ server search. _Acceptance:_ typing returns ranked guide/glossary/FAQ hits;
keyboard-operable; EN/AR. _Risk:_ Medium.

**B9 — Glossary auto-cross-linking in educational body content.** _Why:_ strengthens internal
linking (`AGENTS.md` rules 4–5) and comprehension. _Evidence:_ `glossary.html` defines terms;
learn/article body repeats them unlinked. _Relation:_ net-new; complements Phase 48. _Scope:_
build-time pass that links the first occurrence of a glossary term in learn/article body to its
glossary anchor (idempotent, capped per term, skips headings/links). _Out of scope:_ auto-linking
price/retail claims (trust risk). _Acceptance:_ terms link once; no double-linking; no layout break;
RTL safe. _Risk:_ Medium.

**B10 — Contextual "try in calculator/tracker" CTAs from guide examples.** _Why:_ converts reading
into tool use; internal linking. _Evidence:_ guides describe karat math that `calculator.html`
computes. _Relation:_ net-new. _Scope:_ per-section CTA deep-links to the calculator prefilled via
query params the calculator already reads (audit first); otherwise a plain deep link. _Out of
scope:_ new calculator inputs. _Acceptance:_ CTA lands on the relevant tool state; works EN/AR; no
dead links (root-relative per A1). _Risk:_ Low.

### Wave C — Trust & content quality (distinct from price-freshness phases 15–22)

**C11 — Editorial "last reviewed" dates for educational pages.** _Why:_ price freshness (Phases
15–22) is about _price_ data; educational trust needs _content-review_ dates. _Evidence:_
`learn-hub` article metadata has `lastUpdated`; not surfaced consistently on guides/glossary.
_Relation:_ net-new; explicitly not a price-freshness phase. _Scope:_ a single content-review date
source + a visible, schema-consistent "Reviewed <date>" line; never labeled as price freshness. _Out
of scope:_ price freshness vocabulary. _Acceptance:_ every educational page shows a review date
matching schema; no confusion with price "live/updated". _Risk:_ Low.

**C12 — Jargon / glossary-coverage linter for learn content.** _Why:_ content standards forbid
unexplained jargon; ensures new guide terms exist in the glossary. _Evidence:_
`docs/TERMINOLOGY_GLOSSARY.md`, `glossary.html`. _Relation:_ net-new content-QA gate. _Scope:_
build-time check that flags approved-glossary terms used in learn content but missing a glossary
entry (or vice-versa). _Acceptance:_ CI warns/fails on uncovered jargon. _Risk:_ Low.

**C13 — Educational JSON-LD (Article / LearningResource / HowTo where honest).** _Why:_ Phase 12
adds breadcrumb/price schema, not article/learning schema. _Evidence:_ learn/article model has
titles, sections, FAQ (FAQPage already present in static fallback). _Relation:_ net-new; complements
Phase 12 without overlapping. _Scope:_ add `Article`/`LearningResource` (and `HowTo` only where
steps are literal) to learn guides; schema must match visible content (`AGENTS.md` technical-SEO
policy). _Out of scope:_ marking up retail offers. _Acceptance:_ valid schema, matches content,
passes `inject-schema`/validators. _Risk:_ Low–Medium.

### Wave D — $0 privacy-friendly quality & performance signals

**D14 — Save-Data / slow-connection mode.** _Why:_ heavy embeds (TradingView chart, Leaflet map)
hurt low-end GCC mobile users. _Evidence:_ `docs/revamp/00-AUDIT.md` P2-2 (~47 requests);
Leaflet/TradingView lazy-load already exists. _Relation:_ net-new; Phase 41 covers caching/SW, not
`Save-Data`. _Scope:_ respect `navigator.connection.saveData`/`effectiveType` to defer non-essential
embeds behind an explicit "load chart/map" tap. _Out of scope:_ removing features. _Acceptance:_
with Save-Data on, heavy embeds are deferred; core price content unaffected; reduced-motion
respected. _Risk:_ Low.

**D15 — Privacy-friendly local engagement signals.** _Why:_ the site is analytics-light by design; a
local-only "was this guide helpful?" gives feedback without any backend or tracking. _Evidence:_
portfolio/alerts already use local-only storage patterns. _Relation:_ net-new; not analytics/consent
(Phase 42). _Scope:_ local-only thumbs stored in `localStorage`, used only to reorder "recommended
next" guides client-side; never transmitted. _Out of scope:_ any network send/aggregation.
_Acceptance:_ no network request; state is local; clearable. _Risk:_ Low.

**D16 — Back-to-top + scroll restoration for long pages.** _Why:_ `learn.html`/`methodology.html`
are long; back/forward + deep-link scroll can feel lost. _Evidence:_ `learn.js` `scrollToHashTarget`
handles initial hash only. _Relation:_ net-new; Phase 30 is CLS, not scroll UX. _Scope:_ a
reduced-motion-safe back-to-top control + correct scroll restoration on back/forward. _Acceptance:_
control appears past a threshold, keyboard-operable; back/forward restores position. _Risk:_ Low.

### Wave E — Accessibility not covered by Phases 31–36

**E17 — Focus management for in-page hash navigation & hydration.** _Why:_ activating a card/TOC
anchor scrolls but does not move focus — SR/keyboard users lose place. _Evidence:_
`learn.js`/`toc-renderer.js` scroll without focusing the target heading. _Relation:_ net-new; Phase
32 covers general focus/skip-link, not hash-target focus. _Scope:_ on anchor activation, move focus
to the target section heading (`tabindex=-1` + focus), reduced-motion safe. _Acceptance:_
keyboard/SR focus lands on the section; no scroll jump regressions. _Risk:_ Low.

**E18 — Accessible read/unread semantics for guide cards.** _Why:_ the read state added in F1 is
visual only. _Evidence:_ `learn-guide-card--read` class toggles; no ARIA. _Relation:_ net-new; ties
to the F1 fix; complements Phase 33 semantics. _Scope:_ expose read state to assistive tech (e.g. a
visually-hidden "· read" suffix or appropriate ARIA) in EN/AR. _Acceptance:_ SR announces read
state; parity EN/AR; no contrast regressions. _Risk:_ Low.

### Wave F — Documentation clarity & durable mobile verification

**F19 — Audit/plan index & supersession map.** _Why:_ `docs/` and `docs/plans/` hold dozens of
overlapping audit/plan files (many one-line autonomous-session stubs); agents waste effort
re-reading superseded material. _Evidence:_ `docs/plans/` (50+ files incl. `2026-05-29_*` stubs),
multiple `docs/audits/*`, several `GOLD_TICKER_LIVE_*` audits. _Relation:_ net-new; the task
explicitly prioritizes documentation clarity; distinct from Phase 50 launch docs. _Scope:_ a single
`docs/audits/README.md` (or extend `docs/plans/README.md`) mapping each audit/plan to
`active | superseded-by | shipped`, with this doc and the 50-phase/roadmap as the current sources of
truth. _Out of scope:_ deleting history. _Acceptance:_ one index resolves "which plan is current?"
in one read. _Risk:_ Low.

**F20 — Durable mobile-viewport verification harness.** _Why:_ prior tooling could not force mobile;
this pass verified 360px ad-hoc — make it repeatable. _Evidence:_ §9; `docs/revamp/00-AUDIT.md`
`[UNVERIFIED]` phone-width items. _Relation:_ net-new; complements Phase 49 regression gate.
_Scope:_ a Playwright matrix (320/360/414, EN+AR/RTL) asserting no horizontal overflow, 44px tap
targets, and no console errors on key pages; runs in CI or on demand. _Out of scope:_ real-device
cloud testing (owner budget). _Acceptance:_ CI catches mobile overflow / tap-target / console
regressions across the matrix. _Risk:_ Medium (flake control).

**Suggested sequencing:** A1–A3 first (they lock in correctness and catch regressions cheaply), then
A4/A5, then Wave B for user-facing value, then C/D/E, with F19 early (cheap) and F20 alongside A3.

## 12. QA checklist (this branch)

- [x] `npm install` succeeds.
- [x] `npm test` — **1286/1286 pass** (adds `tests/learn-read-progress.test.js`, 10 subtests).
- [x] `npm run lint` — clean (eslint, exit 0).
- [x] `npm run validate` — exit 0 (DOM-safety, shell-guard, SEO/meta, sw-precache, schema, a11y).
- [x] `npm run build` — exit 0; learn static fallback regenerates cleanly (only the 4 related-tool
      hrefs changed).
- [x] Chromium desktop (1280×900) — all learn acceptance criteria pass (13/13).
- [x] Chromium mobile (360×740) — all learn acceptance criteria pass (13/13); no horizontal
      overflow.
- [x] View Transitions enabled — no uncaught `InvalidStateError` on same-doc or cross-page nav.
- [x] Before/after evidence screenshots captured (`docs/audits/evidence/`).
- [x] No owner-gated surface modified; no `feat/ui-overhaul` file touched (verified: 0/55 overlap).

## 13. Command log

```bash
# environment
export JWT_SECRET=<local>  ADMIN_PASSWORD=<local>  ADMIN_ACCESS_PIN=<local>
npm install                                   # 348 packages, 0 vulnerabilities

# verification gate (all green)
npm test                                      # 1286 pass / 0 fail
npm run lint                                  # exit 0
npm run validate                              # exit 0
npm run build                                 # exit 0
npm run generate-learn-fallback               # regenerates learn.html fallback (in sync)

# targeted unit run
node --test tests/learn-read-progress.test.js # 10 pass / 0 fail

# browser verification (pre-installed Chromium via vite preview :4173)
npx vite preview --port 4173
node scratchpad/verify-learn.mjs              # desktop + mobile: ALL PASS (26/26)
```

## 14. PR summary draft

**Title:** Audit GoldTickerLive site and fix learn progress tracking

**Summary.** Grounded audit of the live/repo state plus three safe, non-owner-gated fixes on the
learn surface, and a net-new 20-phase plan that reconciles with (does not duplicate) the 50-phase
revamp and the 2026-07-04 roadmap.

**Real live-site finding corrected.** The learn page is **not** empty — all 9 guides render. The
actual defect was the "Read 0 of 9 featured guides" counter never incrementing (a leading-slash id
mismatch), an uncaught `InvalidStateError` from an aborted view transition, and (found during
verification) dead "related tools" links.

**Files changed.** `src/config/learn-hub-catalog.js`, `src/pages/learn-hub-ui.js`,
`src/lib/motion-boot.js`, `scripts/node/render-learn-static-fallback.mjs`, `learn.html`,
`tests/learn-read-progress.test.js`,
`docs/audits/MASTER_GOLDTICKERLIVE_WEBSITE_AUDIT_AND_20_PHASE_PLAN.md`, `docs/audits/evidence/*`.

**Tests run.** `npm test` (1286 pass), `npm run lint`/`validate`/`build` (all green), plus Chromium
desktop+mobile verification (26/26).

**Manual QA.** Counter 0→1 live and persistent; deep link + back/forward mark reads; shared-anchor
tally correct; no uncaught `InvalidStateError`; no stuck-faded cards; no horizontal overflow at
360px.

**OWNER-GATED areas — audited, not modified:** `gold-price-fetch.yml`, `post_gold.yml`, billing,
Supabase RLS/signups, `sw.js`, pricing constants.

**$0-to-run compliance.** All fixes are static frontend, zero new deps, zero runtime cost.
Newsletter stays removed; WhatsApp alerts and Stripe ordering stay parked.

**Relationship to existing docs.** Fills white space (learn engagement, reveal/transition
robustness, internal-link/anchor integrity, hydration fail-open, content search, editorial
freshness, mobile harness) not covered by the 50-phase revamp or the roadmap; does not restate
shipped work (portfolio, heatmap) or roadmap-owned items (Telegram, history, RSS/JSON, embed
configurator).

**Risks / follow-ups.** F4 (systemic bare-relative `safeHref` drops in other components) is flagged
for Phase A1 — verify per-file before fixing. Mobile verified at 360px only (not real devices).

**PR #530 / `feat/ui-overhaul` — not touched.** Confirmed via the GitHub API: PR #530 changes 55
files, **none** overlapping this branch, and it touches no learn/motion/reveal code.
