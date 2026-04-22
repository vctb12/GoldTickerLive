# Gold-Prices Site Revamp — Consolidated Master Plan

> 🛑 **START HERE — READ BEFORE DOING ANY WORK ON THIS REVAMP.**
>
> This file is the **single source of truth** for the homepage + global nav + tracker revamp **and**
> for the consolidated production tracks. It absorbs every previous plan. Do **not** reintroduce or
> fork another plan.
>
> ### 📌 Mandatory session protocol
>
> 1. **Every new agent / contributor session** working on the revamp (branch
>    `copilot/revamp-tracker-html-page` or any successor branch) **must open and read this file in
>    full before making changes**. No exceptions.
> 2. **Every `report_progress` call** must update the "Progress log" and the relevant track
>    checklists in this file, in the same commit as the code change.
> 3. **Every merged PR** targeting the revamp must bump the "Last updated" line below and move the
>    affected checklist items from `[ ]` to `[x]` with the commit SHA.
> 4. **Scope guard:** if a proposed change does not fit one of the commit buckets in §1 or one of
>    the tracks in §2, stop and raise it in the PR description rather than silently expanding scope.
>
> **Last updated:** 2026-04-23 · **Round:** 3 (404-hardening track — link checker, root-safe hrefs,
> SEO guard, nav a11y, CI enforcement) · **Branch:** `revamp/404-hardening` (based on `main`;
> successor to `copilot/revamp-tracker-html-page`)

> **📚 Master consolidation index.** This file is the single consolidated plan for the entire revamp
> _and_ for the pre-existing production/admin tracks that used to live in other docs. Every
> planning-style file in `docs/` now points here. Sections §0–§18 own the homepage + nav + tracker
> revamp; §19–§28 own the consolidated production tracks, decisions, governance, roadmaps, risks,
> and historical logs. See [`docs/README.md`](./README.md) for the pointer map.

| §      | Owns                                                       | Absorbed from                                                     |
| ------ | ---------------------------------------------------------- | ----------------------------------------------------------------- |
| §0     | Product context (mission, users, jobs, pillars)            | `product/PRD.md`                                                  |
| §0.1   | Trust guardrails (labels, required elements)               | `product/PHASE0_GUARDRAILS.md`                                    |
| §0.2   | Reusable trust copy snippets                               | `product/TRUST_SNIPPETS.md`                                       |
| §1–§18 | Homepage + nav + tracker revamp (current work)             | _native to this file_                                             |
| §19    | Decisions log                                              | `product/DECISIONS.md`                                            |
| §20    | Project memory                                             | `product/MEMORY.md`                                               |
| §21    | Rollout governance (release waves, merge gate)             | `product/ROLLOUT_GOVERNANCE.md`                                   |
| §22    | Production-revamp tracks (30-phase, post-homepage)         | `REVAMP_STATUS.md`                                                |
| §23    | Historical execution summary (20-phase)                    | `REVAMP_EXECUTION_SUMMARY.md`                                     |
| §24    | Product roadmap (monetization, newsletter, portfolio, API) | `ROADMAP_IMPLEMENTATION.md`                                       |
| §25    | Known issues, risks, open items                            | `issues-found.md` + `risks.md` + `pr-audit.md` + `LIMITATIONS.md` |
| §26    | Codebase architecture snapshot                             | `codebase-audit.md`                                               |
| §27    | Historical execution log                                   | `execution-log.md`                                                |
| §28    | Task backlog                                               | `product/TASKS.md`                                                |

---

---

## 0. Product context

_Absorbs `docs/product/PRD.md`._

### Product

Gold-Prices website — a bilingual (EN/AR), multi-page, mostly-static site with live data, tools,
country/city/market pages, educational content, and a shops directory.

### Mission

Help users quickly and confidently understand gold prices, historical movement, market context, and
where/how to buy.

### Primary users

- Retail users checking today's prices
- Users comparing countries / cities / karats
- Users looking for gold shops / markets
- Users researching gold buying and pricing
- SEO users landing on country / city / guide pages

### Core jobs to be done

- See the current gold price clearly
- Compare karats and currencies
- Browse historical data with confidence
- Find relevant local market / shop information
- Understand the difference between spot and retail pricing
- Use calculators and educational pages without confusion

### Product pillars

1. Trust and clarity
2. Speed
3. Mobile-first UX
4. SEO depth
5. Clean information architecture

### Core sections

- Homepage
- Tracker / historical prices
- Country pages
- City pages
- Markets / famous gold souks
- Shops directory
- Calculators
- Learn / methodology / guides

### Product non-negotiables

- Label estimated, fallback, and derived values clearly
- Preserve internal linking between pages
- No fake "live" claims without support
- No weak SEO duplication
- No misleading store verification

---

## 0.1 Trust guardrails

_Absorbs `docs/product/PHASE0_GUARDRAILS.md`. These are non-negotiable product rules for trust
language that must land before any broad visual or UX change._

### Purpose

Keep the site explicit about what prices represent and what they do **not** represent. Applies to
all pages that show prices, rates, listings, or market comparisons.

### Core trust rules

1. **Always separate reference prices from retail outcomes.**
   - Use "spot-linked reference estimate" for computed values.
   - Never label computed values as "shop price" unless sourced from a real store feed.
2. **Always label data freshness and source layer.**
   - Every critical price surface must indicate one of: `Live`, `Cached`, `Fallback`,
     `Derived estimate`.
3. **Always expose timing context.**
   - Show timestamp / age where possible (e.g., "Updated 3 min ago").
   - If stale, show "Delayed" or "Stale" state explicitly.
4. **Never imply store verification without evidence.**
   - For market clusters or area listings, use wording such as "Market-area listing" or "Directory
     reference profile".
5. **Always include user next-step guidance.**
   - On shops / listings surfaces, include: "Confirm final prices, making charges, and VAT directly
     with seller."

### Global label taxonomy

Canonical labels to use across UI:

- `Spot/reference estimate`
- `Retail price (from seller)`
- `Live data`
- `Cached data`
- `Fallback value`
- `Derived value`
- `Last reviewed`
- `Methodology`

Avoid ambiguous terms: "accurate retail now", "verified price" (unless provenance is explicit),
"official market price" (unless the source is named).

### Required trust elements by page type

**Tracker pages** must include:

- source-layer label (live / cached / fallback)
- methodology link
- spot-vs-retail distinction
- timestamp or age indicator

**Shops directory and listing detail modal** must include:

- listing-type clarity (store vs market area)
- details availability badge (full / partial / limited)
- "confirm directly with seller" disclaimer
- last-reviewed date for directory content

**Country / city / market guide pages** must include:

- clear separation between benchmark prices and local retail variability
- links to methodology and relevant tracker / shops pages

### Copy pattern rules

- Short, explicit sentences over marketing-heavy claims.
- Prefer "estimate", "reference", "indicative", "derived" where applicable.
- Keep disclaimers informative and actionable.
- Avoid fear language and avoid overconfidence claims.

### PR review checklist (Phase 0 gate)

For any PR touching pricing / listing UI, reviewers must confirm:

- [ ] Spot/reference vs retail is explicit on the changed surface.
- [ ] Live / cached / fallback / derived status is visible where relevant.
- [ ] Timestamp or recency context is present or intentionally not applicable.
- [ ] Trust disclaimer is present and not vague.
- [ ] Methodology link remains discoverable.
- [ ] No wording implies verification without supporting data.

If any item fails, the PR must not be marked complete.

---

## 0.2 Reusable trust copy snippets

_Absorbs `docs/product/TRUST_SNIPPETS.md`. Use these as defaults for banners, cards, and modals.
Adapt wording to context without changing meaning._

| Id  | Use                            | Copy                                                                                                         |
| --- | ------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| A   | Spot/reference estimate banner | "These are spot-linked reference estimates, not final retail jewelry prices."                                |
| B   | Retail variance helper         | "Final shop prices can include making charges, premiums, and local taxes."                                   |
| C1  | Source-layer badge — live      | "Live source"                                                                                                |
| C2  | Source-layer badge — cached    | "Cached value"                                                                                               |
| C3  | Source-layer badge — fallback  | "Fallback value"                                                                                             |
| C4  | Source-layer badge — derived   | "Derived estimate"                                                                                           |
| D   | Shops directory disclaimer     | "Directory listings may represent market areas or dealer clusters unless direct business details are shown." |
| E   | Seller-confirmation CTA        | "Before purchasing, confirm final price, making charges, and tax directly with the seller."                  |
| F   | Freshness label                | "Last reviewed: {date}"                                                                                      |
| G   | Staleness label                | "Data may be delayed. Check timestamp before relying on this value."                                         |
| H   | Method transparency link text  | "See methodology and data sources"                                                                           |

### Usage notes

- Keep one primary trust sentence near the top of each critical page.
- Do not stack multiple long disclaimers above the fold.
- For mobile, prefer concise labels + expandable detail text.

---

## 0.3 Engineering non-negotiables

- **One PR, many tiny commits.** Each commit is single-purpose and reversible with `git revert`.
- **Preserve static multi-page architecture.** "Not static at all" = motion, liveness,
  micro-interactions, progressive disclosure. Not an SPA.
- **Priority order:** trust → UX → mobile → SEO → perf → polish.
- **No new libraries** unless strictly justified (advisory-DB checked first).
- **Canonical tokens only.** Everything resolves to `styles/global.css`: `--color-*`, `--surface-*`,
  `--space-*`, `--text-*`, `--radius-*`, `--shadow-*`, `--ease-*`, `--duration-*`, `--weight-*`,
  `--leading-*`. No hand-picked hex or rem.
- **DOM safety strict.** All new DOM via `src/lib/safe-dom.js` (`el`, `clear`, `escape`, `safeHref`,
  `safeTel`). No new `innerHTML` sinks. `check-unsafe-dom` baseline tightens when old sinks are
  replaced.
- **Motion respects `prefers-reduced-motion: reduce`** — every animation has a zero-motion path.
- **RTL parity.** Arabic locale must work for every new layout.
- **Trust rules.** Always distinguish spot/reference vs retail. Always label
  cached/estimated/delayed/fallback values.

## 1. Commit discipline — single concern per commit

Every commit fits **exactly one** of these narrow buckets. If a change does not fit one bucket,
split it.

| Bucket       | Example                                             |
| ------------ | --------------------------------------------------- |
| `tokens`     | Add/align one CSS custom-property group             |
| `layout`     | Change grid/flex/gap on one section                 |
| `spacing`    | Adjust padding/margin rhythm on one component       |
| `typography` | Heading scale, weight, leading on one area          |
| `color`      | Swap a bespoke color for a canonical token          |
| `surface`    | Card background/border/shadow on one component      |
| `radius`     | Normalize corner-radius on one component            |
| `motion`     | One keyframe + one application site                 |
| `a11y`       | Focus ring, aria, keyboard handler — one concern    |
| `mobile`     | Breakpoint behavior for one component               |
| `content`    | Copy rewrite for one section (no structural change) |
| `structure`  | IA / DOM reorder for one section                    |
| `wiring`     | JS data wire-up for one section                     |
| `cleanup`    | Remove one dead rule / duplicate id / unused export |
| `seo`        | One metadata element                                |
| `perf`       | One observable perf win (lazy, defer, split)        |
| `safe-dom`   | Replace one `innerHTML` sink with helpers           |
| `docs`       | One doc or comment update                           |

## 2. Shipping order

Rounds of ~6–8 commits, cycling the tracks in order: **A → B → C → D → E → F → G → H → I → J**.
Expect ~10 rounds across the PR, target 80–120 commits total.

---

## 3. Status at a glance

| Track                          | Status         | Notes                                                                |
| ------------------------------ | -------------- | -------------------------------------------------------------------- |
| **A** Cross-cutting foundation | 🟢 **shipped** | tokens, motion primitives, surface utilities, reveal.js, count-up.js |
| **B** Navigation rebuild       | ⚪ not started | —                                                                    |
| **C** Homepage revamp          | 🟡 in progress | sections opted into `[data-reveal]`; karat strip uses `countUp`      |
| **D** Tracker continuation     | 🟡 in progress | reveal.js imported; wire + brief sections opted in                   |
| **E** Motion & liveness layer  | 🟡 in progress | primitives live; most application sites still pending                |
| **F** Mobile & tablet pass     | ⚪ not started | —                                                                    |
| **G** Accessibility pass       | ⚪ not started | —                                                                    |
| **H** SEO & metadata pass      | ⚪ not started | —                                                                    |
| **I** Perf & cleanup           | ⚪ not started | —                                                                    |
| **J** Final QA                 | ⚪ not started | continuous `npm test` / `validate` checks passing                    |

Legend: 🟢 shipped · 🟡 in progress · ⚪ not started · 🔴 blocked

---

## 4. Track A — Cross-cutting foundation

Goal: unify the system every other track leans on. Each bullet = 1–2 commits.

- [x] **Motion primitives** in `styles/global.css`: `[data-reveal]` reveal-up, `flash-up`,
      `flash-down`, `pulse-dot`, `underline-slide`, `drawer-slide-in`, `reveal-up`, plus a global
      `prefers-reduced-motion: reduce` reset. (commit `788feb14`)
- [x] **Surface utility classes** `.surface-elevated` / `.surface-subtle` / `.surface-accent` /
      `.surface-glass` consumed by nav/home/tracker. (`0d2c40c8`)
- [x] **Spacing rhythm tokens** `--rhythm-inline` / `--rhythm-block` / `--rhythm-section` /
      `--rhythm-section-lg`, plus `--surface-glass` token (light + dark). (`ab3f8dc3`)
- [x] **`IntersectionObserver` primitive** `src/lib/reveal.js` — one shared observer, `WeakSet`
      dedup, auto-runs on DOMContentLoaded, IO-missing fallback reveals immediately. (`82b8d77c`)
- [x] **`count-up` primitive** `src/lib/count-up.js` — rAF easeOutQuad, duration magnitude-capped
      180–800 ms, auto directional `data-flash`, reduced-motion no-op, robust numeric parse.
      (`0b03c603`, `0a3c7591`)
- [ ] **Token audit.** Inventory current `--tp-*`, `--home-*`, `--nav-*`, `--shops-*` bespoke
      palettes; alias each to canonical tokens.
- [ ] **Canonical card consolidation.** Merge near-duplicate `.card` / `.panel` / `.section-card`
      rules into the canonical `.card` + `.card--accent` + `.card--compact` set.
- [ ] **Heading scale confirmation.** Ensure heading scale is applied via classes (`.h1`…`.h6`) not
      ad-hoc sizes.
- [ ] **Focus ring token audit.** Confirm `--focus-ring` / `--focus-ring-offset` wired through every
      `:focus-visible` site. _(In progress: duplicate global `:focus-visible` with hardcoded
      `2px solid var(--color-gold)` that shadowed the token-based baseline removed — page-level
      sites (`calc-tab`, `stub-*`, `tracker-mode-tab`, `shops-*`, `methodology-link`, `.btn`) still
      to audit.)_

## 5. Track B — Navigation rebuild

### B.1 IA & data shape

- [ ] Keep 5-group IA (Home · Prices · Tools · Learn · More, solo Shops) but **split "More"** — move
      high-value items up where possible. Audit for ambiguity.
- [ ] Enforce `description` on every group child in `nav-data.js`; trim labels for parallelism;
      ensure bilingual pairs.
- [ ] Tag **primary destinations** (Tracker, Calculator, Shops, Countries) vs **secondary** (Learn
      articles) so the UI can emphasize them.

### B.2 Desktop shell

- [ ] Sticky top bar, glass surface (`backdrop-filter: blur`, `--surface-glass`), bottom hairline
      `--border-default`.
- [ ] Left: brand lockup. Center: group links. Right: utility cluster (search trigger · language ·
      theme · CTA "Live Tracker").
- [ ] Group links as buttons opening dropdown on hover **and** click/Enter/Space/Down. Touch users
      get click (no hover trap).
- [ ] 44 px minimum tap targets; visible `:focus-visible` rings using `--focus-ring`.

### B.3 Active state

- [ ] On page load, compute current URL → find matching group + sub-item; add `aria-current="page"`
      to the item and `data-active="true"` to its parent group.
- [ ] Animated underline that slides between groups on hover/focus, snaps to active on mouseleave.
      Disabled under reduced motion.

### B.4 Dropdown panels

- [ ] Two-column layout for Prices + Tools, one-column for Learn + More.
- [ ] Each item: label + one-line description from `nav-data.js`, optional leading icon.
- [ ] Open: fade + translate-Y 4 px, 180 ms `--ease-out`. Close: 120 ms. Reduced-motion: instant.
- [ ] First item receives focus on open. `Escape` closes and returns focus to trigger.
      `ArrowUp`/`ArrowDown` cycle. `Tab` exits.

### B.5 Command-palette search

- [ ] Progressive enhancement: `<a href="/content/search/">Search</a>` is the fallback.
- [ ] JS-enhanced overlay triggered by search icon, `/`, or `Ctrl/Cmd+K`.
- [ ] Queries page titles + country/city/market slugs + tool names via `src/lib/search.js`.
- [ ] Keyboard-first: arrow keys, Enter, Esc. Results grouped (Pages · Countries · Markets · Tools).
- [ ] Recent searches in `localStorage` namespaced `nav.search.recent`, capped.

### B.6 Mobile drawer

- [ ] Slide-in from inline-end, full-height using `100svh` with `100vh` fallback.
- [ ] Sections with group headings, dividers, large tap targets. Expandable groups (`<details>` or
      custom with `aria-expanded`), not a flat stack.
- [ ] Top: search input (progressive enhancement). Bottom: theme toggle + language switcher +
      primary CTA.
- [ ] `body` scroll lock while open. Close on: Escape, backdrop tap, route change.
- [ ] Focus trap inside drawer. Return focus to hamburger on close.

### B.7 Scroll behavior

- [ ] Hide on scroll down (> 8 px threshold, after 120 px), reveal on scroll up. Throttled via
      `requestAnimationFrame`. Disabled under reduced motion. Suspended while drawer open or focused
      element is in nav.

### B.8 Micro-interactions

- [ ] Underline slide on hover, group fade+slide on open, theme-toggle icon cycle (auto → light →
      dark, rotate 180 ms).
- [ ] Active-dropdown chevron flip.

### B.9 Touch behavior

- [ ] No hover-only dropdowns on touch. First tap opens, tap outside closes. Tap on active trigger
      closes.

### B.10 Dark-mode parity

- [ ] All nav surfaces resolved via `--surface-*` and `--color-text-*`. Manual sweep only if token
      misuse found.

## 6. Track C — Homepage revamp

### C.1 IA & section order (first-scroll priority)

Target order:

1. Hero — live spot + freshness + trust + 2 CTAs.
2. Karat reference strip — live per-karat prices, unit toggle, copy.
3. Trust band — methodology / sources / estimated vs live legend.
4. Tools strip — Tracker · Calculator · Converter · Zakat · Alerts · Order.
5. Countries quick-picker — flag grid, searchable inline.
6. Markets highlights — top 3–6 markets with freshness.
7. Explainer strip — scannable bullets.
8. FAQ — condensed, reveal-on-scroll.
9. Social strip — minimal.
10. Deep-link footer rail.

- [ ] Dedup the overlapping "Live Gold Prices" (`gcc-section-title`) and "Karat strip" sections into
      one canonical live-price block.

### C.2 Hero rebuild

- [ ] Headline + subhead + primary CTA "Open Live Tracker" + secondary "Open Calculator".
- [ ] Inline live XAU/USD (large), delta vs prev close, 24 h high/low, freshness pill ("updated 42 s
      ago"), market-open/closed chip, trust line ("spot reference — not a retail quote").
- [ ] Mobile: stacks vertically, price block prominent, CTAs full-width.
- [ ] Canonical hero surface + gold inset ring; no bespoke gradients.

### C.3 Karat reference strip

- [ ] Per-karat cards (24K, 22K, 21K, 18K, 14K): gram price, unit toggle (g / tola / oz),
      copy-to-clipboard.
- [x] **Count-up on update.** Directional flash (green up / red down). (home only, via `countUp` —
      `14d365cc`)
- [ ] Skeleton shimmer on first load.
- [ ] Clear "reference only" framing on the strip header.

### C.4 Country quick-picker

- [ ] Flag grid deep-linking to country pages. Inline searchable (filters as you type). Keyboard
      navigable.
- [ ] Cached/stale state clearly labeled.

### C.5 Tools strip

- [ ] One row/grid, each tool: icon + name + one-line value prop + CTA. No duplicates. Primary tools
      weighted larger.

### C.6 Trust band

- [ ] Methodology link. Data-source list. AED peg note. "Estimated vs live" legend. Links to
      `methodology.html`, `about.html`.

### C.7 Markets highlights

- [ ] 3–6 top markets as cards with freshness + "reference price" framing. Deep-links to market
      pages.

### C.8 Explainer strip

- [ ] Scannable bullets, not paragraphs. Reveal-on-scroll.

### C.9 FAQ

- [ ] Tight copy, each item collapsible via `<details>`/custom with `aria-expanded`.
      One-open-at-a-time optional.

### C.10 Social + footer rail

- [ ] Minimal social; footer rail provides deep-links without duplicating nav.

### C.11 Liveness

- [x] **Section reveal-on-scroll** on trust-strip, trust-banner, tools, countries-quick, explainer,
      FAQ, social via `[data-reveal]`. (`e19aae33`)
- [ ] Hero + karat cards count-up on update (duration proportional to delta, capped). (karat strip
      done · hero pending.)
- [ ] Freshness pill re-computes exact age every second; color shifts amber → red as staleness
      crosses thresholds.
- [ ] Gentle hero-backdrop parallax (transform-only). Reduced-motion bypass.

### C.12 Content density & rhythm

- [ ] Rebalance H1/H2/H3 scale using canonical tokens. Cap body width to `--content-max-width`.
      Consistent `--rhythm-section` between sections. Remove dead space + low-signal filler.

## 7. Track D — Tracker continuation

Resume the 15-phase tracker plan in small commits:

- [ ] **Phase 2** — Trust & freshness framing (exact-age pill, AED-peg note, stale/cached/fallback
      labeling with icon + tooltip).
- [ ] **Phase 3** — Single sticky control bar
      (currency/karat/unit/compare/range/auto-refresh/language).
- [ ] **Phase 4** — Hero rebuild (large price, delta vs prev close, high/low, 24 h change,
      sparkline). Mobile-safe at 320 px.
- [ ] **Phase 5** — Chart UX (snap-to-point tooltip, per-range source labels, main-vs-compare
      legend, empty/error/stale states).
- [ ] **Phase 6** — Karat table (sticky header, `scope` attrs, bilingual labels, tap-to-copy per
      row).
- [ ] **Phase 7** — Markets grid (filter/sort/view correctness, empty states, per-country freshness,
      reference-price framing).
- [ ] **Phase 8** — Alerts/presets/planners as tabbed cards with real add/edit/delete affordances.
      Disabled-not-broken.
- [ ] **Phase 9** — Wire + archive collapsible, lazy-rendered, paginated archive, loading states.
- [ ] **Phase 12** — Replace remaining `innerHTML` sinks in `src/tracker/render.js` (24),
      `tracker-pro.js` (4), `events.js` (2), `wire.js` (3) with `safe-dom.js` helpers. Tighten
      `check-unsafe-dom` baseline in same commit block.
- [ ] **Phase 13** — Split 2,541-line `tracker-pro.css` into per-section files or prune dead rules.
      `IntersectionObserver`-gated rendering of below-fold sections.
- [x] Side-effect import of shared `reveal.js` from `src/pages/tracker-pro.js`. (`39138e7e`)
- [x] Wire + brief sections opted into `[data-reveal]`. (`1e484954`)

## 8. Track E — Motion & liveness layer

Applied on top of primitives from Track A. Rules:

- Every effect must have a **purpose**: feedback, continuity, or attention — never decorative.
- Every effect has a **reduced-motion path** that no-ops.

- [x] Price-change directional flash (green up, red down, 1 s fade). Primitive live; applied on
      karat strip. Pending on hero + tracker hero + market cards.
- [x] Number animations: count-up duration ∝ magnitude, capped 800 ms. Primitive live.
- [x] Section reveal: fade + translate-Y 8 px, 300 ms, single shared observer.
- [ ] Card hover: translate-Y 2 px + shadow-up, 200 ms `--ease-out`.
- [ ] Skeletons on every async surface.
- [ ] Dropdown open: fade + slide 4 px, 180 ms.
- [ ] Drawer slide in 220 ms.
- [ ] Freshness pill pulse once per tick, capped 1 per 90 s.
- [ ] Hero parallax: transform-only on inner backdrop layer only.

## 9. Track F — Mobile & tablet

- [ ] 320–480 px no horizontal overflow on home/tracker/nav.
- [ ] 481–700 px phone-landscape & small-tablet spacing compression rules instead of premature
      desktop layout.
- [ ] 700–1024 px tablet layout — no awkward scaling, no oversized gaps, no premature column drops.
- [ ] Sticky controls with safe-area insets (`env(safe-area-inset-*)`).
- [ ] Tap targets ≥ 44 × 44 px across nav, drawer, CTA, cards.
- [ ] Chart pinch/pan sane on tracker.
- [ ] Drawer `100svh` with `100vh` fallback (iOS Safari-safe).
- [ ] Freshness pills, CTAs, and pickers legible at smallest breakpoint.

## 10. Track G — Accessibility

- [ ] `:focus-visible` rings everywhere via `--focus-ring-*`.
- [ ] Keyboard nav on groups, dropdowns, range pills, tabs, command palette.
- [ ] `aria-live="polite"` on live price cells (hero, karat strip, tracker hero).
- [ ] `aria-current="page"` on active nav item + group.
- [ ] `aria-label` on icon-only buttons; `aria-expanded`/`aria-controls` on toggles.
- [ ] Semantic HTML: `nav`, `main`, `section[aria-labelledby]`, one `h1` per page.
- [ ] Contrast audit light + dark, EN + AR.
- [ ] Touch-without-hover fallback for every hover-dependent UI.
- [ ] `role="dialog"` + focus trap on drawer + palette.

## 11. Track H — SEO & metadata

- [ ] Unique `<title>` + `<meta name="description">` preserved on every page touched.
- [ ] Canonical `https://goldtickerlive.com/...` (apex, no www, no trailing slash inconsistencies).
- [ ] Structured data reflects each page's real purpose:
  - Home: `WebSite` + `SearchAction` + `BreadcrumbList` + `Organization`.
  - Tracker: `WebApplication`.
  - No `Product` schema on non-product pages.
- [ ] Internal linking: home ↔ tracker, calculator, shops, top country pages. Tracker ↔ calculator,
      methodology, country pages, shops.
- [ ] `sitemap.xml` correctness preserved; existing sitewide canonical test must still pass.

## 12. Track I — Perf & cleanup

- [ ] Measure initial JS + CSS for tracker and home before/after.
- [ ] Split oversized CSS files or prune dead rules (`tracker-pro.css` at 2,541 lines).
- [ ] `IntersectionObserver`-gated rendering for below-fold sections (tracker wire + archive, home
      FAQ + social + explainer).
- [ ] `loading="lazy"` + `decoding="async"` on non-critical images.
- [ ] Preconnect to data origins (`gold-api.com`, `exchangerate-api.com`) — verified present.
- [ ] Verify `sw.js` still caches revamped assets correctly.
- [ ] Remove duplicate inline styles once systemized into classes.

## 13. Track J — Final QA

Before marking the PR ready for review:

- [ ] `npm test` — all suites pass (requires `JWT_SECRET`, `ADMIN_PASSWORD`, `ADMIN_ACCESS_PIN`).
      Latest: **271 / 271 pass**.
- [ ] `npm run validate` — HTML + imports + DOM-sink check green; baseline tightened where sinks
      were removed. Latest: **0 errors**.
- [ ] `npm run quality` — ESLint + Prettier + Stylelint green.
- [ ] `npm run build` — Vite production build succeeds; bundle sizes reported in PR body.
- [ ] Visual screenshot diff on desktop + mobile, light + dark, EN + AR for hero, nav, drawer, karat
      strip, tools strip.
- [ ] PR body lists: what was verified, what wasn't (Lighthouse needs deploy), known risks, known
      remaining scope.

### 13.1 Per-PR verification checklist

_Absorbs `docs/product/VERIFICATION.md`. Use this before merging any PR that affects user-facing
pages._

#### Functional checks

- [ ] Primary buttons / CTAs work on target pages.
- [ ] Filters / search / sort controls update results correctly.
- [ ] Deep links and query-parameter state restore as expected.
- [ ] Local state persistence (where used) behaves correctly after refresh.
- [ ] Modal / dialog behaviour works with click, Escape, and focus flow.

#### UX and accessibility checks

- [ ] Mobile layout verified at narrow width (≥ 360 px).
- [ ] Empty / loading / error states are visible and understandable.
- [ ] Keyboard tab order is usable and skip-link path is valid.
- [ ] Focus indicators are visible on interactive controls.
- [ ] Contrast and readable hierarchy are acceptable for core flows.

#### SEO and metadata checks

- [ ] Unique `<title>` and `<meta name="description">` on changed pages.
- [ ] Canonical URL is present and points to the intended final URL.
- [ ] Open Graph + Twitter metadata are present and aligned.
- [ ] Internal links resolve from actual file depth (no broken relatives).
- [ ] Structured data (if present) matches page reality.
- [ ] Sitemap / robots impact reviewed when adding new indexable pages.

#### Trust and product clarity checks

- [ ] Spot / reference values are clearly distinguished from retail / jewelry pricing.
- [ ] Estimated / derived / cached / fallback states are labelled where relevant.
- [ ] Freshness / review-date labels are visible and not misleading.
- [ ] Shops / market listings do not overstate verification status.
- [ ] Methodology / disclaimer links remain discoverable.

#### Performance and resilience checks

- [ ] `npm run build` passes.
- [ ] Service-worker changes validated for cache version and fallback behaviour.
- [ ] No accidental broad asset / cache growth from query-param caching.

#### Final report format (required)

Every implementation update must explicitly separate:

1. **What was verified**
2. **What was not verified**
3. **Remaining risks**

Do not claim "fixed" unless the relevant checks were actually run.

---

## 14. Explicit non-goals

- **No** SPA conversion. No client-side router.
- **No** chart-library swap.
- **No** CSS/JS framework introduction (no Tailwind, React, Vue, Alpine).
- **No** rewrite of `server.js` or the admin backend.
- **No** new third-party runtime dependencies unless specifically justified (advisory-DB consulted
  first).
- **No** re-opening of already-completed work unless a regression is found.
- **No** mass content rewrites outside the sections listed here.

## 15. Reversibility & risk management

- Every commit is narrow, so `git revert <sha>` undoes exactly that concern.
- The PR can land in stages if reviewers prefer chunked review.
- Visual regressions caught via screenshot-diff in Track J; structural regressions via tests.
- Any new dependency or new DOM-sink pattern triggers a hard stop and re-evaluation.

## 16. Open questions (carry forward until answered)

1. Should the nav search be shipped in this PR or deferred (adds meaningful JS)? **Default:** ship
   behind progressive enhancement.
2. Should the homepage drop any existing sections entirely (e.g., social strip) or just
   de-emphasize? **Default:** keep all, re-rank + tighten.
3. Are bilingual strings for all new homepage copy expected in this PR or a follow-up? **Default:**
   English now, stub Arabic for follow-up.
4. Is the tracker sticky control bar OK to ship if it changes the visual identity of the page
   materially? **Default:** ship it.

---

## 17. Progress log (append-only)

Append one row per commit on the revamp branch. Keep commit SHA short (8 chars). When a PR merges,
update the "Last updated" banner at the top of the file and copy the merged commits into the
"Merged" section below.

### Round 1 — Track A foundation + Track C/D reveal wiring (in-branch, pending merge)

| SHA        | Bucket    | Summary                                                     |
| ---------- | --------- | ----------------------------------------------------------- |
| `ab3f8dc3` | `tokens`  | Add `--surface-glass` and `--rhythm-*` scale                |
| `788feb14` | `motion`  | Reveal/flash/pulse/drawer primitives + reduced-motion reset |
| `0d2c40c8` | `surface` | `.surface-elevated/subtle/accent/glass` utility classes     |
| `82b8d77c` | `wiring`  | `src/lib/reveal.js` shared `IntersectionObserver`           |
| `0b03c603` | `wiring`  | `src/lib/count-up.js` numeric count-up primitive            |
| `e19aae33` | `motion`  | Opt home sections into `[data-reveal]` reveal-on-scroll     |
| `14d365cc` | `wiring`  | Count-up + directional flash on karat strip prices          |
| `39138e7e` | `wiring`  | Tracker imports shared `reveal.js`                          |
| `1e484954` | `motion`  | Opt tracker wire + brief sections into `[data-reveal]`      |
| `0a3c7591` | `wiring`  | count-up: robust numeric parse + named `FLASH_DURATION_MS`  |

### Round 2 — Track A focus-ring audit + follow-ups (in-branch, pending merge)

| SHA       | Bucket    | Summary                                                                                                        |
| --------- | --------- | -------------------------------------------------------------------------------------------------------------- |
| _pending_ | `cleanup` | Remove duplicate `:focus-visible` in `global.css` that shadowed the token-based baseline with hardcoded values |

### Merged PRs

_None yet._ Populate when the first revamp PR merges: PR number, merge date, branch name, range of
SHAs covered, any follow-ups.

---

## 18. Update protocol (how to keep this file honest)

1. **On every `report_progress` call**, edit this file in the same commit:
   - Tick checkboxes that completed.
   - Append a row to §17 "Progress log" with the new commit SHA and one-line summary.
   - Bump the "Last updated" banner (top of file) and "Round" counter if applicable.
2. **On PR merge**, add an entry to §17 "Merged PRs" with PR number, date, branch, SHA range, and
   migrate in-branch rows from "Round N (pending merge)" into the merged round's table.
3. **If a new track or bucket is required**, add it in the relevant section; do not invent a side
   document.
4. **If scope changes**, record the change here before coding. A scope change without a doc update
   is a scope violation.
5. **If this file is deleted, renamed, or forked**, treat that as a scope violation and restore it.

> This file replaces `docs/REVAMP_STATUS.md` for the homepage + nav + tracker revamp. Legacy tracks
> from that file remain valid for their respective scopes.

---

## 19. Decisions log

_Absorbs `docs/product/DECISIONS.md`. Append-only. One entry per architectural or product decision
that future agents need to know about._

### 2026-04-04 — Keep the current static architecture

- **Decision.** Keep current static multi-page architecture for now.
- **Why.** The biggest issues are trust, UX, state reliability, and SEO — not framework limitations.
- **Consequence.** Prefer targeted refactors over migrations.

### 2026-04-04 — Spot/reference vs retail, always distinguished

- **Decision.** Always distinguish spot/reference prices from retail shop prices.
- **Why.** This is core to trust.
- **Consequence.** UI labels, methodology notes, and page copy must reflect this. Codified in §0.1
  Trust guardrails and §0.2 trust snippets.

### 2026-04-22 — REVAMP_PLAN.md is the single source of truth

- **Decision.** Consolidate every planning / status / roadmap / task / audit doc into
  `docs/REVAMP_PLAN.md`. Source files become thin pointers.
- **Why.** Multiple overlapping plan docs caused drift and confusion about which file to update when
  reporting progress.
- **Consequence.** All planning edits land here. `docs/README.md` maps the pointer index. Reference
  docs (ARCHITECTURE, DESIGN_TOKENS, SEO_STRATEGY, etc.) stay independent.

---

## 20. Project memory

_Absorbs `docs/product/MEMORY.md`. Long-lived project-level facts that future contributors need.
Repository-wide memory lives in the agent memory store; this section is for facts that benefit every
contributor (human or agent)._

- Users care a lot about trust wording.
- Avoid generic "AI-looking" page layouts.
- Do not overbuild. Small reliable improvements beat broad rewrites.
- Tracker and shops pages are high priority.
- Country / city pages need strong SEO and internal linking.
- Any fallback / estimated data must be clearly labeled.
- When reviewing code, inspect relevant files before proposing architecture changes.
- Always separate review, plan, debug, and build modes.
- `buildFilters()` on the shops page already validates each dropdown value and resets invalid ones
  to `'all'` — lean on that safety net rather than duplicating validation upstream.

---

## 21. Rollout governance

_Absorbs `docs/product/ROLLOUT_GOVERNANCE.md`. Defines a safe rollout sequence and release gate for
multi-PR revamp work._

### Release waves

#### Wave 1 — Shops

Scope: `shops.html`, `shops.js`, `shops.css`.

Gate to move forward:

- Functional and trust checks pass for shops flows.
- No unresolved accessibility blockers in modal / filter path.

#### Wave 2 — Tracker

Scope: `tracker.html`, `tracker-pro.js`, `tracker-pro.css`, `tracker/` modules touched by tracker
PRs.

Gate to move forward:

- Onboarding and source-state clarity validated.
- Compare / archive / planner critical paths verified.

#### Wave 3 — Country / City / Market templates

Scope: country / city / market HTML templates and metadata / canonical / internal-link consistency.

Gate to move forward:

- Metadata parity (title / description / canonical / OG / Twitter).
- Internal links and depth-relative assets verified.

### Merge gate checklist (all waves)

- [ ] PR is narrow and task-specific.
- [ ] Verification checklist completed (§13 Track J — Final QA).
- [ ] Risks are documented (not hidden in summary copy).
- [ ] No unrelated cleanup / refactors included.

### Post-merge monitoring

After each wave merge:

1. Validate key pages render with expected assets.
2. Confirm no high-severity console / runtime breakage.
3. Confirm trust labels and disclaimers still present.
4. Confirm service-worker update behavior is stable after refresh.

### Rollback guidance

Rollback if any of the following appears in production checks:

- Broken primary navigation or blocked core flow.
- Misleading trust wording (spot vs retail ambiguity).
- Major SEO regression (missing canonical / title / meta).
- Unrecoverable JS error affecting primary page content.

Prefer reverting the smallest offending PR, then re-shipping a focused fix.

---

## 22. Production-revamp tracks (30-phase)

_Absorbs `docs/REVAMP_STATUS.md`. This is the longer-running production track that runs in parallel
with the homepage + nav + tracker revamp in §1–§18. Status rolls into `CHANGELOG.md` at Phase 30
(launch)._

### Track A — Stabilize

- [x] Phase 1 — Repo hygiene
  - [x] Untrack `dist/`, `playwright-report/`, `test-results/`
  - [x] Deduplicate Prettier config → `.prettierrc.json` is canonical
  - [x] Deduplicate ESLint config → `eslint.config.mjs` is canonical
- [x] Phase 2 — Workflow triage
  - [x] Fix invalid `ci.yml` (previously two concatenated YAML docs → zero jobs ran)
  - [x] Fix `perf-check.yml` (deprecated `microsoft/playwright-github-action@v1`)
  - [x] Pin Node 20 LTS across CI workflows
  - [x] `post_gold.yml` untouched (user directive)
- [x] Phase 3 — Testing foundation
  - [x] CI provides test-only `JWT_SECRET` / `ADMIN_PASSWORD` / `ADMIN_ACCESS_PIN`
  - [x] Smoke suite covers 404 + country page
- [x] Phase 4 — Lint / format single source of truth
  - [x] Husky v9 pre-commit hook (lint-staged only; `npm test` removed from hook)
- [x] Phase 5 — CSP hardening
  - [x] Externalised inline gtag/clarity snippets to `assets/analytics.js` via
        `scripts/node/externalize-analytics.js` codemod (501 HTML files rewritten; 189 no-analytics
        files untouched). Idempotent `--check` mode wired into `npm run validate`.
  - [x] Dropped `'unsafe-inline'` from `scriptSrc` in `server.js` CSP.

### Track B — Backend, auth & users (not started)

- [ ] Phase 6 — Backend architecture decision & scaffolding
- [ ] Phase 7 — Supabase schema & migrations
- [ ] Phase 8 — Auth system (email OTP + OAuth)
- [ ] Phase 9 — Server API surface (`/api/v1/*`, OpenAPI spec)
- [ ] Phase 10 — User data flows (alerts, watchlist, preferences)
- [ ] Phase 11 — Admin panel consolidation + RBAC
- [ ] Phase 12 — Background jobs (price poll, alert eval, aggregates)
- [ ] Phase 13 — Notifications (email + web push)

### Track C — Product polish & trust (in progress)

- [ ] Phase 14 — Trust & labeling audit (in progress)
- [ ] Phase 15 — Shops directory trust pass (in progress — featured-section editorial footnote +
      "Directory last reviewed" label added; bilingual copy wired in `src/pages/shops.js`)
- [ ] Phase 16 — Tracker UX polish (in progress — `renderSeasonal()` now populates
      `#tp-seasonal-results` with monthly high/low/spread from `state.history`)
- [ ] Phase 17 — Calculator polish
- [ ] Phase 18 — Country / city / market pages
- [ ] Phase 19 — Educational / Learn pages
- [ ] Phase 20 — Design system completion
- [ ] Phase 21 — Accessibility audit

### Track D — Performance, SEO, monetisation (not started)

- [ ] Phase 22 — Performance budgets
- [ ] Phase 23 — SEO comprehensive pass
- [ ] Phase 24 — Ads integration (AdSense, consent banner, `ads.txt`)
- [ ] Phase 25 — Analytics & observability (Sentry, health / ready)
- [ ] Phase 26 — Deployment hardening (Docker, zero-downtime, secret scanning)

### Track E — Launch readiness (not started)

- [ ] Phase 27 — Load & resilience testing (k6, chaos, backup drill)
- [ ] Phase 28 — Legal & compliance (GDPR export / delete, cookie policy)
- [ ] Phase 29 — Docs & runbooks
- [ ] Phase 30 — Launch (tag v1.0.0, flip DNS, 48h enhanced monitoring)

### Track F — 404-hardening (shipped on `revamp/404-hardening`)

Orthogonal track completed in one focused branch. Every step landed as a tiny commit with a
`phx/NN:` prefix. The goal: eliminate broken internal links, harden 404 behavior, and add CI
guardrails so regressions get caught automatically.

- [x] **phx/01** — Baseline linkinator scan committed to `reports/links-initial.json` (28 links, 10
      broken, all flat `countries/<slug>.html` references).
- [x] **phx/02** — `404.html` pre-existing; verified content + canonical treatment.
- [x] **phx/03** — `server.js` `send404()` pre-existing with path-traversal-safe fallback.
- [x] **phx/04** — `_redirects` hardened: SPA catch-all removed, 21 country 301s added
      (`/countries/<slug>.html → /countries/<slug>/`), explicit `/* → /404.html 404`.
- [x] **phx/05** — linkinator wired into CI (`ci.yml`) with nightly job + artifact upload of
      `reports/`.
- [x] **phx/06** — AR nav data in `src/components/nav-data.js` rewritten from `../` relative hrefs
      to root-safe `/` form (98 `/` hrefs, 0 `../` remaining).
- [x] **phx/07** — `resolveHref` / `isPageMatch` hardened in `src/components/nav.js`:
      null/non-string guards, passthrough for `/`, `//`, `#`, `?`, URI schemes; root `/` now matches
      only the exact homepage.
- [x] **phx/08** — Country placeholder pages verified (all 21 present).
- [x] **phx/09** — 29 `countries/<slug>.html` references rewritten to `/countries/<slug>/` across
      top-level pages + components.
- [x] **phx/10** — 6 `guides/*.html` references rewritten to `content/guides/*.html` in
      shops/insights surfaces.
- [x] **phx/11** — `_headers` added: immutable long-cache for assets, short-cache for HTML,
      `X-Content-Type-Options` / `X-Frame-Options` / `Referrer-Policy` / `Permissions-Policy`
      globally; `/admin/*` `X-Robots-Tag: noindex` + `no-store`.
- [x] **phx/12** — `tests/e2e/nav-smoke.spec.js`: nav presence on 9 key pages + every country tile
      on `/countries/` resolves without 404.
- [x] **phx/13** — `tests/e2e/js-links.spec.js`: tracker hash deep-link round-trip + search page
      renders.
- [x] **phx/14** — Favicon / manifest / asset refs (`../favicon.svg` etc.) rewritten to root-safe
      absolute via `scripts/node/fix-asset-refs.js` (479 files).
- [x] **phx/15** — `build/generateSitemap.js` paths fixed (478 URLs, added privacy / terms /
      guides).
- [x] **phx/16** — `scripts/node/check-seo-meta.js` regression guard wired into `npm run validate`
      (canonical + hreflang on public pages, noindex on internal).
- [x] **phx/17** — Nav a11y: skip-link (WCAG 2.4.1) + focus trap inside mobile drawer + legacy-safe
      `.sr-only` with `clip-path` addition.
- [x] **phx/18** — Mobile bottom nav uses root-safe hrefs (aligned with phx/06).
- [x] **phx/19** — `scripts/node/generate-placeholders.js` pre-existing.
- [x] **phx/20** — Broken hrefs rewritten across 50 more pages via
      `scripts/node/fix-broken-hrefs.js` (top-page, guide, country-flat, country-dir rules). Asset
      audit: 0 broken ref types across 690 HTML files.
- [x] **phx/21** — Dev-mode 404 logging to `data/404-logs.json` in `server.js` (ring buffer, cap 500
      entries, no-op in production).
- [x] **phx/22** — CI enforcement flip: `scripts/node/enforce-linkcheck.js` parses the linkinator
      JSON report and fails the build on any broken internal link.
- [x] **phx/27** — This log (docs update per REVAMP_PLAN protocol).

**Verified outcomes on `revamp/404-hardening`:**

- `npm run lint` — clean
- `npm run validate` — 0 errors, 0 warnings (includes SEO + DOM-safety + inline-analytics checks)
- `npm test` — 271/271 passing
- `npm run linkcheck:report` — 28/28 OK
- Playwright chromium — 18/18 (smoke + nav-smoke + js-links) passing
- Asset audit — 0 broken reference types across 690 HTML files

### Items blocked on external inputs

These items cannot be completed without credentials or third-party accounts. Surface them to the
project owner before the associated phase starts.

| Phase | Blocker                                    |
| ----- | ------------------------------------------ |
| 7–13  | Supabase project URL + service role key    |
| 8     | OAuth client IDs (Google)                  |
| 13    | Email provider (Resend / Postmark) API key |
| 24    | AdSense publisher ID                       |
| 25    | Sentry DSNs (frontend + backend)           |
| 26    | Deployment target (Render / Fly / Railway) |

---

## 23. Historical execution summary (20-phase revamp)

_Absorbs `docs/REVAMP_EXECUTION_SUMMARY.md`. Condensed snapshot of the earlier 20-phase mega-revamp.
Full prose originally lived in the source file and is preserved in git history; the material
deliverables that matter for future work are summarised here and now live as reference docs._

| Phase | Area                                  | Primary deliverable(s)                                                           |
| ----- | ------------------------------------- | -------------------------------------------------------------------------------- |
| 1     | Foundation & design-system completion | `docs/DESIGN_TOKENS.md` (196 tokens catalogued)                                  |
| 2     | Accessibility overhaul                | `docs/ACCESSIBILITY.md` — WCAG 2.1 AA patterns                                   |
| 3     | Performance optimisation              | `docs/PERFORMANCE.md` — budgets, critical-CSS, SW caching                        |
| 4     | SEO & metadata                        | `docs/SEO_STRATEGY.md`, `docs/SEO_CHECKLIST.md`, `docs/SEO_SITEMAP_GUIDE.md`     |
| 5     | Mobile-first UX refinement            | Breakpoint spec at 320 / 375 / 414 / 768 / 1024 px; 44 × 44 touch targets        |
| 6     | Component library                     | Canonical `.btn`, `.card`, badge, input, modal, toast, skeleton patterns         |
| 7     | State-management modernisation        | `src/tracker/state.js` + URL-hash synchronisation                                |
| 8     | Data-layer enhancement                | `services/goldPriceService.js`, `services/fxService.js`, circuit breakers        |
| 9     | Testing expansion                     | 231+ Node `node:test` suites under `tests/*.test.js`; target ≥ 80% coverage      |
| 10    | Error handling & resilience           | `src/lib/errors.js`, retry with backoff, fallback UI, EN/AR error copy           |
| 11    | i18n enhancement                      | `src/config/translations.js`, RTL CSS, locale-aware formatters                   |
| 12    | Admin-panel modernisation             | `admin/*` (9 pages) on Supabase GitHub OAuth + RBAC groundwork                   |
| 13    | CMS                                   | Markdown-based content pipeline (architecture planned, not shipped)              |
| 14    | Analytics & monitoring                | GA4 snippet, uptime / health / spike-alert workflows                             |
| 15    | Security hardening                    | Helmet CSP, rate-limit, bcrypt auth, secret scanning, `utils/inputValidation.js` |
| 16    | DevEx & tooling                       | ESLint flat config, Prettier, Stylelint, Husky v9 + lint-staged                  |
| 17    | Documentation overhaul                | The `docs/` tree itself (now consolidated into this master plan)                 |
| 18    | Content enhancement                   | Guides, learn, invest, insights pages                                            |
| 19    | Deployment & DevOps                   | GitHub Actions CI + Pages deploy; see `.github/workflows/README.md`              |
| 20    | Quality assurance                     | Pre-commit hooks + CI merge gate + `npm run validate` DOM-safety baseline        |

> **Note.** All "design-specifications" / "architecture-planned" / "roadmap-defined" items from the
> original summary are either (a) already shipped as code, (b) rolled into §22 Production-revamp
> tracks as concrete phases, or (c) deferred to §24 Product roadmap. See git history of
> `docs/REVAMP_EXECUTION_SUMMARY.md` for the original long-form prose.

---

## 24. Product roadmap

_Absorbs `docs/ROADMAP_IMPLEMENTATION.md`. Multi-phase roadmap for features beyond the current
revamp. Full implementation notes (env vars, code templates, SQL, cost projections) are preserved in
git history; the active deliverable inventory lives here._

### Phase 1 — Foundation & quick wins (current)

| Feature           | Status                             | Blocker                                                                                                      |
| ----------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Premium tier      | Infra complete, code stubs present | Stripe account + price IDs, `npm i stripe`                                                                   |
| Email newsletter  | Infra complete, workflows present  | Resend account + verified sender domain                                                                      |
| Portfolio tracker | DB schema ready, UI pending        | Supabase Auth enabled; `portfolio.html` + `src/components/auth-modal.js` + `src/lib/portfolio-calculator.js` |

**Newsletter cadence** (when live): daily 07:00 Dubai (03:00 UTC) via `daily-newsletter.yml`; weekly
Sunday 18:00 Dubai (14:00 UTC) via `weekly-newsletter.yml`.

### Phase 2 — Data & social (4–6 months)

- [ ] **Multi-source price aggregation** — Kitco, LBMA, weighted average, ±2% outlier detection,
      "Price Sources" transparency modal.
- [ ] **Silver / platinum / palladium expansion** — generalise `price-calculator.js` to
      `metal-price-calculator.js`, add metal selector on tracker, create `silver.html` /
      `platinum.html` / `palladium.html`.
- [ ] **Instagram & LinkedIn automation** — visual-content generator (Puppeteer), posting scripts +
      workflows.

### Phase 3 — Platform evolution (12+ months)

- [ ] **Premium developer API** — `/api/v1/spot`, `/api/v1/price/:country/:karat`,
      `/api/v1/historical`, `/api/v1/markets`. Tiered rate limits (Free / Basic / Pro). Redis-backed
      rate limiting. API-key generation system. OpenAPI docs.
- [ ] **Interactive heatmap** — regional price heat map.
- [ ] **Crypto correlation** — gold vs BTC / ETH overlay.
- [ ] **WhatsApp / Google Sheets integrations, push notifications, multi-language expansion** —
      detail to be specified per feature.

### Packages to install when activating roadmap items

> Run `gh-advisory-database` before adding any of these.

| Package                 | Phase | For                        |
| ----------------------- | ----- | -------------------------- |
| `stripe`                | 1     | Premium tier               |
| `resend`                | 1     | Newsletter                 |
| `@supabase/supabase-js` | 1     | Portfolio, shops, settings |
| `puppeteer`             | 2     | Visual content generation  |
| `redis` / `ioredis`     | 3     | API rate limiting          |
| `swagger-ui-express`    | 3     | Developer-API docs         |

### External inputs blocking roadmap delivery

| Phase          | Blocker                               |
| -------------- | ------------------------------------- |
| Premium tier   | Stripe account + Price IDs            |
| Newsletter     | Resend API key + verified domain      |
| Portfolio      | Supabase Auth enabled (email / OAuth) |
| Multi-source   | Kitco / LBMA API keys                 |
| Social (Ph. 2) | Instagram Graph + LinkedIn OAuth      |
| API (Ph. 3)    | Deployment target + Redis instance    |

See `docs/SUPABASE_SCHEMA.md` for the database migration workflow that supports these features.

---

## 25. Known issues, risks, open items

_Absorbs `docs/issues-found.md`, `docs/risks.md`, and `docs/pr-audit.md`. For deeper technical
limitations see the reference doc `docs/LIMITATIONS.md` — that file is not folded here because it is
a stable reference inventory, not an actionable backlog._

### 25.1 Active issues (actionable)

| #   | Severity | Area     | Issue                                                                                    | Owner / Next step                                                 |
| --- | -------- | -------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| A1  | Low      | Ads      | `components/adSlot.js` uses placeholder `AD_PUBLISHER_ID = 'ca-pub-XXXXXXXXXX'`          | Site owner must supply real AdSense publisher ID.                 |
| A2  | Low      | SEO      | Legacy country pages (`countries/*.html`, 15 files) coexist with new hierarchical pages. | Add canonical tags pointing legacy → new, or 301 redirects.       |
| A3  | Low      | PR state | PR #77 (revert of master revamp) left **open** but no longer needed.                     | Close PR #77 — PR #76 changes are stable.                         |
| A4  | Info     | Cache    | `services/cacheLayer.js` referenced in Phase 3 spec was never created.                   | No action — `src/lib/cache.js` is functional and covers the need. |

### 25.2 Active risks (carry forward)

| #   | Risk                                                                               | Mitigation                                                                               | Residual impact                       |
| --- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------- |
| R1  | AdSense integration incomplete                                                     | Placeholder code already in place; flips live when owner supplies publisher ID.          | Low — monetisation only, no UX impact |
| R2  | Supabase anon key is committed in `config/supabase.js`                             | Anon key is designed for client-side use; Row-Level Security only exposes verified rows. | Low — intended Supabase architecture  |
| R3  | Vite / esbuild moderate vuln (≤ 0.24.2)                                            | Only affects local dev server; prod build is unaffected.                                 | None in production                    |
| R4  | GitHub Pages cannot set HTTP security headers                                      | Meta-equivalents in `.htaccess` + proper headers on Express server when self-hosted.     | Medium — CSP / HSTS meta is limited   |
| R5  | Dual routing (legacy flat `/countries/uae.html` + hierarchical `/uae/gold-price/`) | `.htaccess` redirects cover some paths; canonical tags on 97% of pages.                  | Medium — possible split link equity   |

### 25.3 PR-reconciliation audit (snapshot 2026-04-13)

- **PRs analysed:** 95 (PR #1 – #95)
- **Open at audit time:** 1 (PR #77 — revert, no longer needed)
- **Changes reflected in code:** ≈ 95 %
- **Gaps found:** only the three items in §25.1 (all Low severity)

> See `docs/pr-audit.md` (pointer) and git history for the full table. No Critical or High severity
> items were found in that audit.

### 25.4 Open questions (carry forward until answered)

Duplicated from §16 for convenience — see §16 for defaults.

1. Ship nav search in the current PR or defer? (JS weight trade-off.)
2. Drop any existing homepage sections entirely or re-rank + tighten?
3. Bilingual strings for all new homepage copy now or follow-up?
4. Is the tracker sticky control bar OK to ship if it changes the visual identity of the page
   materially?

---

## 26. Codebase architecture snapshot

_Absorbs `docs/codebase-audit.md`. A concise snapshot. For long-form module catalogues and deep
architecture notes see the reference doc `docs/ARCHITECTURE.md`. For design tokens see
`docs/DESIGN_TOKENS.md`._

### Routing

File-based static site with Vite build. Clean URLs via `index.html`:

| Pattern                                      | Example                                      |
| -------------------------------------------- | -------------------------------------------- |
| Homepage                                     | `/`                                          |
| Country gold price                           | `/{country}/gold-price/`                     |
| City gold prices                             | `/{country}/{city}/gold-prices/`             |
| City gold shops                              | `/{country}/{city}/gold-shops/`              |
| Karat rate per city                          | `/{country}/{city}/gold-rate/{karat}-karat/` |
| Legacy country / city / market               | `/countries/*.html` (kept; see §25.1 A2)     |
| Tools (calc, tracker, history, order, shops) | `/calculator.html`, `/tracker.html`, etc.    |
| Admin                                        | `/admin/*` (9 pages, Supabase OAuth)         |

Route helpers: `utils/routeBuilder.js`, `utils/routeValidator.js`, `routes/routeRegistry.js`.

### Build

Vite 8 + Terser. `vite.config.js` excludes the 15 country directories, `admin/`, `embed/`, `dist/`,
`node_modules/`. Those are copied as-is by the deploy workflow. Manual chunks: `vendor`
(lightweight-charts) and `utils` (cache, api, price-calculator, formatter). See
`docs/DEPENDENCIES.md` for the version matrix.

### External APIs

| Domain                      | Purpose                                                |
| --------------------------- | ------------------------------------------------------ |
| `api.gold-api.com`          | Primary XAU/USD spot (`goldPriceService.js`)           |
| `data-asg.goldprice.org`    | Fallback gold price (`lib/api.js`)                     |
| `open.er-api.com`           | FX rates (USD base) (`fxService.js`)                   |
| Supabase project URL        | Shops / settings / auth (`lib/supabase-data.js`)       |
| `api.gdeltproject.org`      | Market news (`scripts/pages/insights.js`)              |
| `raw.githubusercontent.com` | DataHub historical baseline (`lib/historical-data.js`) |

Waterfall on gold price: primary → fallback → cache → last-known with label.

### State management

- Homepage: `STATE` object in `src/pages/home.js`.
- Tracker: `src/tracker/state.js`, URL-hash serialised (`#mode=live&cur=AED&k=24&u=gram`).
- Shops: filter / shortlist state in `src/pages/shops.js`.
- Persistence: `src/lib/cache.js` wraps `localStorage`.

Key `localStorage` namespaces: `goldprices_gold_*`, `goldprices_fx_*`, `user_prefs`, `gp_pref_lang`,
`shops_shortlist`, `tracker_*`, `sb-*-auth-token`, `gp_admin_shops`.

### SEO layer

Canonical coverage ≈ 97 %. Sitemap at `/sitemap.xml` with hreflang alternates. JSON-LD: `WebSite` +
`SearchAction` + `Organization` on home; `BreadcrumbList` sitewide; `FAQPage`, `HowTo`, `Dataset` on
specific pages. `robots.txt` blocks admin, server, tests, node_modules, supabase, repositories,
dist.

### Dependencies

See `docs/DEPENDENCIES.md` for the full version matrix. Production deps: bcryptjs, cors, express 5,
express-rate-limit, helmet, jsonwebtoken, lowdb, morgan, uuid. Dev: terser, vite 8.

### CI / CD

15+ GitHub Actions workflows grouped in four tiers:

1. **Merge gate** — `ci.yml`
2. **Informational scans** — `codeql.yml`, `semgrep.yml`, `perf-check.yml`, `lighthouse.yml`
3. **Production deploy** — `deploy.yml`
4. **Content / sync bots** — `post_gold.yml`, `daily-newsletter.yml`, `weekly-newsletter.yml`,
   `uptime-monitor.yml`, `health_check.yml`, `spike_alert.yml`, `sync-db-to-git.yml`

Only `ci.yml` blocks merges. See `.github/workflows/README.md`.

---

## 27. Historical execution log

_Absorbs `docs/execution-log.md`. Snapshot of completed phases of the earlier multi-phase audit. The
active progress tracking continues in §17 (current revamp) and §22 (production tracks)._

### Phase 0 — Repository audit + PR reconciliation ✅

- **0A — Git history & PR audit.** 95 PRs analysed (1 open: PR #77 — revert, no longer needed). ≈ 95
  % of PR changes reflected in codebase. Gap: AdSense placeholder publisher ID. Original output:
  `docs/pr-audit.md` (now pointer).
- **0B — Codebase structural audit.** 380 HTML pages, 68 JS files, 16 CSS files. Vite build. 15+
  workflows. Supabase for admin + shops. Bilingual EN/AR. 369/380 pages have canonicals & unique
  descriptions. 205 tests passing at the time. Two moderate vulns in esbuild (no prod impact).
  Original output: `docs/codebase-audit.md` (now pointer).
- **0C — Performance baseline.** Expected Lighthouse 85–95. No blocking JS for initial paint.
  Service worker cache-first for assets, network-first for HTML. Output:
  `docs/performance-baseline.json` (retained as reference data).

### Phase 1 — PR reconciliation ✅

No Critical or High severity items found. Only the three items in §25.1 remain as Low-severity gaps.

### Phase 2 — URL architecture ✅

- `utils/routeBuilder.js` — single source of truth for URL generation (`buildRoute`,
  `buildShopsRoute`, `buildCanonicalURL`, `generateAllRoutes`).
- `utils/routeValidator.js` — validates country / city / karat param combos.
- `tests/route-utils.test.js` — 27 tests covering every route type.
- Hierarchical URLs already in place (`/{country}/{city}/gold-prices/`).

### Phase 12 — Accessibility + performance (partial) ✅

- Security meta headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`,
  `Referrer-Policy: strict-origin-when-cross-origin`) added to 6 main pages.
- All pages carry `lang="en"` + `dir="ltr"` (RTL switched via CSS).
- No `tabindex > 0` anywhere; no `<img>` missing alt text (flags are emoji, not images).

### Phase 13 — Security hardening (partial) ✅

- `server.js` CSP extended for AdSense, GA4, Supabase.
- `utils/inputValidation.js` — shared validators (UAE phone, email, numeric range, text
  sanitisation, URL-param sanitisation, price-alert validation).
- `tests/input-validation.test.js` — 31 tests.
- `.env.example` created; `docs/environment-variables.md` retained as reference.

### Phase 15 — CI/CD + tests (partial) ✅

- `ci.yml` runs on PR to `main`; `deploy.yml` on push to `main`.
- 205 tests passing at audit time (now 231+; see §26 CI / CD).
- 15+ workflows across CI, deploy, monitoring, social posting.

### Phases 3–11, 14 — status at audit

Already substantially implemented — see `services/`, `lib/cache.js`, `lib/api.js`,
`components/chart.js`, 380 pages with prices, shops, charts, `seo/metadataGenerator.js` (97 %
canonical coverage), 9 admin pages with Supabase auth, `order-gold/` with WhatsApp + Supabase,
`social/postTemplates.js` (10 templates), `search/searchEngine.js` (bilingual fuzzy),
`config/translations.js` + RTL CSS. Only Phase 11 (monetisation) remains partial — blocked on a real
AdSense publisher ID (see §25.1 A1).

---

## 28. Task backlog

_Absorbs `docs/product/TASKS.md`. Near-term, narrowly-scoped backlog. Wider roadmap items live in
§24; production tracks in §22; current revamp work in §17._

### Ready

- [ ] Fix tracker tab switching and state persistence.
- [ ] Audit every tracker button and disable / remove unfinished controls.
- [ ] Rebuild shops featured / filter behavior.
- [x] Parse and honour query params on shops page.
- [ ] Improve compare / archive readability on mobile.
- [ ] Review canonical / meta tags across main pages.
- [ ] Add sitemap verification checklist.
- [ ] Migrate admin dashboard to pull real stats from Supabase.
- [ ] Create `pricing_overrides` Supabase table and migrate `admin/pricing/`.
- [ ] Create `orders` Supabase table and migrate `admin/orders/`.
- [ ] Migrate `admin/social/` to read from Supabase `fetch_logs`.
- [ ] Read `site_settings` from Supabase on public pages for dynamic feature flags.

### In progress

- [ ] Master docs update — **consolidation sweep** folding every planning doc into this master plan.
      See Round 2 progress log in §17.

### Blocked

- [ ] Admin panel full Supabase migration — needs the Supabase schema confirmed running.
- [ ] Public-site dynamic settings — needs `site_settings` populated in Supabase.

### Done

- [x] Fix `sync-db-to-git.yml` secret name (`SUPABASE_SERVICE_KEY` → `SUPABASE_SERVICE_ROLE_KEY`)
      and ES-module output format.
- [x] Create `.env.example`.
- [x] Deprecate dead `admin/api-client.js`.
- [x] Rewrite `ADMIN_GUIDE.md` for Supabase auth.
- [x] Rewrite `ADMIN_SETUP.md` for Supabase auth.
- [x] Update `DEPENDENCIES.md` with correct versions.
- [x] Update all automation docs.
- [x] Fix Vite version across all docs.
