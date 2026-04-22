# Gold-Prices Site Revamp — Consolidated Master Plan

> 🛑 **START HERE — READ BEFORE DOING ANY WORK ON THIS REVAMP.**
>
> This file is the **single source of truth** for the homepage + global nav + tracker
> revamp **and** for the consolidated production tracks. It absorbs every previous plan.
> Do **not** reintroduce or fork another plan.
>
> ### 📌 Mandatory session protocol
>
> 1. **Every new agent / contributor session** working on the revamp (branch
>    `copilot/revamp-tracker-html-page` or any successor branch) **must open and read this
>    file in full before making changes**. No exceptions.
> 2. **Every `report_progress` call** must update the "Progress log" and the relevant track
>    checklists in this file, in the same commit as the code change.
> 3. **Every merged PR** targeting the revamp must bump the "Last updated" line below and
>    move the affected checklist items from `[ ]` to `[x]` with the commit SHA.
> 4. **Scope guard:** if a proposed change does not fit one of the commit buckets in
>    §1 or one of the tracks in §2, stop and raise it in the PR description rather than
>    silently expanding scope.
>
> **Last updated:** 2026-04-22 · **Round:** 2 (Track A focus-ring audit + docs
> consolidation sweep) · **Branch:** `copilot/revamp-tracker-html-page`
> (successor: `copilot/continue-working-in-the-plan`)

> **📚 Master consolidation index.** This file is the single consolidated plan
> for the entire revamp *and* for the pre-existing production/admin tracks that
> used to live in other docs. Every planning-style file in `docs/` now points
> here. Sections §0–§18 own the homepage + nav + tracker revamp; §19–§28 own
> the consolidated production tracks, decisions, governance, roadmaps, risks,
> and historical logs. See [`docs/README.md`](./README.md) for the pointer map.

| §       | Owns                                                                  | Absorbed from                                             |
| ------- | --------------------------------------------------------------------- | --------------------------------------------------------- |
| §0      | Product context (mission, users, jobs, pillars)                       | `product/PRD.md`                                          |
| §0.1    | Trust guardrails (labels, required elements)                          | `product/PHASE0_GUARDRAILS.md`                            |
| §0.2    | Reusable trust copy snippets                                          | `product/TRUST_SNIPPETS.md`                               |
| §1–§18  | Homepage + nav + tracker revamp (current work)                        | _native to this file_                                     |
| §19     | Decisions log                                                         | `product/DECISIONS.md`                                    |
| §20     | Project memory                                                        | `product/MEMORY.md`                                       |
| §21     | Rollout governance (release waves, merge gate)                        | `product/ROLLOUT_GOVERNANCE.md`                           |
| §22     | Production-revamp tracks (30-phase, post-homepage)                    | `REVAMP_STATUS.md`                                        |
| §23     | Historical execution summary (20-phase)                               | `REVAMP_EXECUTION_SUMMARY.md`                             |
| §24     | Product roadmap (monetization, newsletter, portfolio, API)            | `ROADMAP_IMPLEMENTATION.md`                               |
| §25     | Known issues, risks, open items                                       | `issues-found.md` + `risks.md` + `pr-audit.md` + `LIMITATIONS.md` |
| §26     | Codebase architecture snapshot                                        | `codebase-audit.md`                                       |
| §27     | Historical execution log                                              | `execution-log.md`                                        |
| §28     | Task backlog                                                          | `product/TASKS.md`                                        |

---

---

## 0. Product context

_Absorbs `docs/product/PRD.md`._

### Product

Gold-Prices website — a bilingual (EN/AR), multi-page, mostly-static site with
live data, tools, country/city/market pages, educational content, and a shops
directory.

### Mission

Help users quickly and confidently understand gold prices, historical movement,
market context, and where/how to buy.

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

_Absorbs `docs/product/PHASE0_GUARDRAILS.md`. These are non-negotiable product
rules for trust language that must land before any broad visual or UX change._

### Purpose

Keep the site explicit about what prices represent and what they do **not**
represent. Applies to all pages that show prices, rates, listings, or market
comparisons.

### Core trust rules

1. **Always separate reference prices from retail outcomes.**
   - Use "spot-linked reference estimate" for computed values.
   - Never label computed values as "shop price" unless sourced from a real
     store feed.
2. **Always label data freshness and source layer.**
   - Every critical price surface must indicate one of: `Live`, `Cached`,
     `Fallback`, `Derived estimate`.
3. **Always expose timing context.**
   - Show timestamp / age where possible (e.g., "Updated 3 min ago").
   - If stale, show "Delayed" or "Stale" state explicitly.
4. **Never imply store verification without evidence.**
   - For market clusters or area listings, use wording such as
     "Market-area listing" or "Directory reference profile".
5. **Always include user next-step guidance.**
   - On shops / listings surfaces, include:
     "Confirm final prices, making charges, and VAT directly with seller."

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

Avoid ambiguous terms: "accurate retail now", "verified price" (unless
provenance is explicit), "official market price" (unless the source is named).

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

_Absorbs `docs/product/TRUST_SNIPPETS.md`. Use these as defaults for banners,
cards, and modals. Adapt wording to context without changing meaning._

| Id | Use                              | Copy                                                                                          |
| -- | -------------------------------- | --------------------------------------------------------------------------------------------- |
| A  | Spot/reference estimate banner   | "These are spot-linked reference estimates, not final retail jewelry prices."                 |
| B  | Retail variance helper           | "Final shop prices can include making charges, premiums, and local taxes."                    |
| C1 | Source-layer badge — live        | "Live source"                                                                                 |
| C2 | Source-layer badge — cached      | "Cached value"                                                                                |
| C3 | Source-layer badge — fallback    | "Fallback value"                                                                              |
| C4 | Source-layer badge — derived     | "Derived estimate"                                                                            |
| D  | Shops directory disclaimer       | "Directory listings may represent market areas or dealer clusters unless direct business details are shown." |
| E  | Seller-confirmation CTA          | "Before purchasing, confirm final price, making charges, and tax directly with the seller."   |
| F  | Freshness label                  | "Last reviewed: {date}"                                                                       |
| G  | Staleness label                  | "Data may be delayed. Check timestamp before relying on this value."                          |
| H  | Method transparency link text    | "See methodology and data sources"                                                            |

### Usage notes

- Keep one primary trust sentence near the top of each critical page.
- Do not stack multiple long disclaimers above the fold.
- For mobile, prefer concise labels + expandable detail text.

---

## 0.3 Engineering non-negotiables

- **One PR, many tiny commits.** Each commit is single-purpose and reversible with
  `git revert`.
- **Preserve static multi-page architecture.** "Not static at all" = motion, liveness,
  micro-interactions, progressive disclosure. Not an SPA.
- **Priority order:** trust → UX → mobile → SEO → perf → polish.
- **No new libraries** unless strictly justified (advisory-DB checked first).
- **Canonical tokens only.** Everything resolves to `styles/global.css`:
  `--color-*`, `--surface-*`, `--space-*`, `--text-*`, `--radius-*`, `--shadow-*`,
  `--ease-*`, `--duration-*`, `--weight-*`, `--leading-*`. No hand-picked hex or rem.
- **DOM safety strict.** All new DOM via `src/lib/safe-dom.js`
  (`el`, `clear`, `escape`, `safeHref`, `safeTel`). No new `innerHTML` sinks.
  `check-unsafe-dom` baseline tightens when old sinks are replaced.
- **Motion respects `prefers-reduced-motion: reduce`** — every animation has a zero-motion
  path.
- **RTL parity.** Arabic locale must work for every new layout.
- **Trust rules.** Always distinguish spot/reference vs retail. Always label
  cached/estimated/delayed/fallback values.

## 1. Commit discipline — single concern per commit

Every commit fits **exactly one** of these narrow buckets. If a change does not fit one
bucket, split it.

| Bucket       | Example                                                   |
| ------------ | --------------------------------------------------------- |
| `tokens`     | Add/align one CSS custom-property group                   |
| `layout`     | Change grid/flex/gap on one section                       |
| `spacing`    | Adjust padding/margin rhythm on one component             |
| `typography` | Heading scale, weight, leading on one area                |
| `color`      | Swap a bespoke color for a canonical token                |
| `surface`    | Card background/border/shadow on one component            |
| `radius`     | Normalize corner-radius on one component                  |
| `motion`     | One keyframe + one application site                       |
| `a11y`       | Focus ring, aria, keyboard handler — one concern          |
| `mobile`     | Breakpoint behavior for one component                     |
| `content`    | Copy rewrite for one section (no structural change)       |
| `structure`  | IA / DOM reorder for one section                          |
| `wiring`     | JS data wire-up for one section                           |
| `cleanup`    | Remove one dead rule / duplicate id / unused export       |
| `seo`        | One metadata element                                      |
| `perf`       | One observable perf win (lazy, defer, split)              |
| `safe-dom`   | Replace one `innerHTML` sink with helpers                 |
| `docs`       | One doc or comment update                                 |

## 2. Shipping order

Rounds of ~6–8 commits, cycling the tracks in order: **A → B → C → D → E → F → G → H → I → J**.
Expect ~10 rounds across the PR, target 80–120 commits total.

---

## 3. Status at a glance

| Track                              | Status          | Notes                                              |
| ---------------------------------- | --------------- | -------------------------------------------------- |
| **A** Cross-cutting foundation     | 🟢 **shipped**  | tokens, motion primitives, surface utilities, reveal.js, count-up.js |
| **B** Navigation rebuild           | ⚪ not started  | —                                                  |
| **C** Homepage revamp              | 🟡 in progress  | sections opted into `[data-reveal]`; karat strip uses `countUp` |
| **D** Tracker continuation         | 🟡 in progress  | reveal.js imported; wire + brief sections opted in |
| **E** Motion & liveness layer      | 🟡 in progress  | primitives live; most application sites still pending |
| **F** Mobile & tablet pass         | ⚪ not started  | —                                                  |
| **G** Accessibility pass           | ⚪ not started  | —                                                  |
| **H** SEO & metadata pass          | ⚪ not started  | —                                                  |
| **I** Perf & cleanup               | ⚪ not started  | —                                                  |
| **J** Final QA                     | ⚪ not started  | continuous `npm test` / `validate` checks passing  |

Legend: 🟢 shipped · 🟡 in progress · ⚪ not started · 🔴 blocked

---

## 4. Track A — Cross-cutting foundation

Goal: unify the system every other track leans on. Each bullet = 1–2 commits.

- [x] **Motion primitives** in `styles/global.css`: `[data-reveal]` reveal-up, `flash-up`,
      `flash-down`, `pulse-dot`, `underline-slide`, `drawer-slide-in`, `reveal-up`, plus
      a global `prefers-reduced-motion: reduce` reset. (commit `788feb14`)
- [x] **Surface utility classes** `.surface-elevated` / `.surface-subtle` /
      `.surface-accent` / `.surface-glass` consumed by nav/home/tracker. (`0d2c40c8`)
- [x] **Spacing rhythm tokens** `--rhythm-inline` / `--rhythm-block` / `--rhythm-section` /
      `--rhythm-section-lg`, plus `--surface-glass` token (light + dark). (`ab3f8dc3`)
- [x] **`IntersectionObserver` primitive** `src/lib/reveal.js` — one shared observer,
      `WeakSet` dedup, auto-runs on DOMContentLoaded, IO-missing fallback reveals
      immediately. (`82b8d77c`)
- [x] **`count-up` primitive** `src/lib/count-up.js` — rAF easeOutQuad, duration
      magnitude-capped 180–800 ms, auto directional `data-flash`, reduced-motion no-op,
      robust numeric parse. (`0b03c603`, `0a3c7591`)
- [ ] **Token audit.** Inventory current `--tp-*`, `--home-*`, `--nav-*`, `--shops-*`
      bespoke palettes; alias each to canonical tokens.
- [ ] **Canonical card consolidation.** Merge near-duplicate `.card` / `.panel` /
      `.section-card` rules into the canonical `.card` + `.card--accent` + `.card--compact`
      set.
- [ ] **Heading scale confirmation.** Ensure heading scale is applied via classes
      (`.h1`…`.h6`) not ad-hoc sizes.
- [ ] **Focus ring token audit.** Confirm `--focus-ring` / `--focus-ring-offset` wired
      through every `:focus-visible` site. _(In progress: duplicate global
      `:focus-visible` with hardcoded `2px solid var(--color-gold)` that shadowed the
      token-based baseline removed — page-level sites (`calc-tab`, `stub-*`,
      `tracker-mode-tab`, `shops-*`, `methodology-link`, `.btn`) still to audit.)_

## 5. Track B — Navigation rebuild

### B.1 IA & data shape
- [ ] Keep 5-group IA (Home · Prices · Tools · Learn · More, solo Shops) but **split "More"**
      — move high-value items up where possible. Audit for ambiguity.
- [ ] Enforce `description` on every group child in `nav-data.js`; trim labels for
      parallelism; ensure bilingual pairs.
- [ ] Tag **primary destinations** (Tracker, Calculator, Shops, Countries) vs **secondary**
      (Learn articles) so the UI can emphasize them.

### B.2 Desktop shell
- [ ] Sticky top bar, glass surface (`backdrop-filter: blur`, `--surface-glass`), bottom
      hairline `--border-default`.
- [ ] Left: brand lockup. Center: group links. Right: utility cluster
      (search trigger · language · theme · CTA "Live Tracker").
- [ ] Group links as buttons opening dropdown on hover **and** click/Enter/Space/Down.
      Touch users get click (no hover trap).
- [ ] 44 px minimum tap targets; visible `:focus-visible` rings using `--focus-ring`.

### B.3 Active state
- [ ] On page load, compute current URL → find matching group + sub-item; add
      `aria-current="page"` to the item and `data-active="true"` to its parent group.
- [ ] Animated underline that slides between groups on hover/focus, snaps to active on
      mouseleave. Disabled under reduced motion.

### B.4 Dropdown panels
- [ ] Two-column layout for Prices + Tools, one-column for Learn + More.
- [ ] Each item: label + one-line description from `nav-data.js`, optional leading icon.
- [ ] Open: fade + translate-Y 4 px, 180 ms `--ease-out`. Close: 120 ms. Reduced-motion:
      instant.
- [ ] First item receives focus on open. `Escape` closes and returns focus to trigger.
      `ArrowUp`/`ArrowDown` cycle. `Tab` exits.

### B.5 Command-palette search
- [ ] Progressive enhancement: `<a href="/content/search/">Search</a>` is the fallback.
- [ ] JS-enhanced overlay triggered by search icon, `/`, or `Ctrl/Cmd+K`.
- [ ] Queries page titles + country/city/market slugs + tool names via `src/lib/search.js`.
- [ ] Keyboard-first: arrow keys, Enter, Esc. Results grouped
      (Pages · Countries · Markets · Tools).
- [ ] Recent searches in `localStorage` namespaced `nav.search.recent`, capped.

### B.6 Mobile drawer
- [ ] Slide-in from inline-end, full-height using `100svh` with `100vh` fallback.
- [ ] Sections with group headings, dividers, large tap targets. Expandable groups
      (`<details>` or custom with `aria-expanded`), not a flat stack.
- [ ] Top: search input (progressive enhancement). Bottom: theme toggle + language
      switcher + primary CTA.
- [ ] `body` scroll lock while open. Close on: Escape, backdrop tap, route change.
- [ ] Focus trap inside drawer. Return focus to hamburger on close.

### B.7 Scroll behavior
- [ ] Hide on scroll down (> 8 px threshold, after 120 px), reveal on scroll up.
      Throttled via `requestAnimationFrame`. Disabled under reduced motion.
      Suspended while drawer open or focused element is in nav.

### B.8 Micro-interactions
- [ ] Underline slide on hover, group fade+slide on open, theme-toggle icon cycle
      (auto → light → dark, rotate 180 ms).
- [ ] Active-dropdown chevron flip.

### B.9 Touch behavior
- [ ] No hover-only dropdowns on touch. First tap opens, tap outside closes. Tap on
      active trigger closes.

### B.10 Dark-mode parity
- [ ] All nav surfaces resolved via `--surface-*` and `--color-text-*`. Manual sweep only
      if token misuse found.

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

- [ ] Dedup the overlapping "Live Gold Prices" (`gcc-section-title`) and "Karat strip"
      sections into one canonical live-price block.

### C.2 Hero rebuild
- [ ] Headline + subhead + primary CTA "Open Live Tracker" + secondary "Open Calculator".
- [ ] Inline live XAU/USD (large), delta vs prev close, 24 h high/low, freshness pill
      ("updated 42 s ago"), market-open/closed chip, trust line
      ("spot reference — not a retail quote").
- [ ] Mobile: stacks vertically, price block prominent, CTAs full-width.
- [ ] Canonical hero surface + gold inset ring; no bespoke gradients.

### C.3 Karat reference strip
- [ ] Per-karat cards (24K, 22K, 21K, 18K, 14K): gram price, unit toggle (g / tola / oz),
      copy-to-clipboard.
- [x] **Count-up on update.** Directional flash (green up / red down). (home only, via
      `countUp` — `14d365cc`)
- [ ] Skeleton shimmer on first load.
- [ ] Clear "reference only" framing on the strip header.

### C.4 Country quick-picker
- [ ] Flag grid deep-linking to country pages. Inline searchable (filters as you type).
      Keyboard navigable.
- [ ] Cached/stale state clearly labeled.

### C.5 Tools strip
- [ ] One row/grid, each tool: icon + name + one-line value prop + CTA. No duplicates.
      Primary tools weighted larger.

### C.6 Trust band
- [ ] Methodology link. Data-source list. AED peg note. "Estimated vs live" legend.
      Links to `methodology.html`, `about.html`.

### C.7 Markets highlights
- [ ] 3–6 top markets as cards with freshness + "reference price" framing. Deep-links to
      market pages.

### C.8 Explainer strip
- [ ] Scannable bullets, not paragraphs. Reveal-on-scroll.

### C.9 FAQ
- [ ] Tight copy, each item collapsible via `<details>`/custom with `aria-expanded`.
      One-open-at-a-time optional.

### C.10 Social + footer rail
- [ ] Minimal social; footer rail provides deep-links without duplicating nav.

### C.11 Liveness
- [x] **Section reveal-on-scroll** on trust-strip, trust-banner, tools, countries-quick,
      explainer, FAQ, social via `[data-reveal]`. (`e19aae33`)
- [ ] Hero + karat cards count-up on update (duration proportional to delta, capped).
      (karat strip done · hero pending.)
- [ ] Freshness pill re-computes exact age every second; color shifts amber → red as
      staleness crosses thresholds.
- [ ] Gentle hero-backdrop parallax (transform-only). Reduced-motion bypass.

### C.12 Content density & rhythm
- [ ] Rebalance H1/H2/H3 scale using canonical tokens. Cap body width to
      `--content-max-width`. Consistent `--rhythm-section` between sections. Remove dead
      space + low-signal filler.

## 7. Track D — Tracker continuation

Resume the 15-phase tracker plan in small commits:

- [ ] **Phase 2** — Trust & freshness framing (exact-age pill, AED-peg note,
      stale/cached/fallback labeling with icon + tooltip).
- [ ] **Phase 3** — Single sticky control bar
      (currency/karat/unit/compare/range/auto-refresh/language).
- [ ] **Phase 4** — Hero rebuild (large price, delta vs prev close, high/low, 24 h change,
      sparkline). Mobile-safe at 320 px.
- [ ] **Phase 5** — Chart UX (snap-to-point tooltip, per-range source labels,
      main-vs-compare legend, empty/error/stale states).
- [ ] **Phase 6** — Karat table (sticky header, `scope` attrs, bilingual labels,
      tap-to-copy per row).
- [ ] **Phase 7** — Markets grid (filter/sort/view correctness, empty states, per-country
      freshness, reference-price framing).
- [ ] **Phase 8** — Alerts/presets/planners as tabbed cards with real add/edit/delete
      affordances. Disabled-not-broken.
- [ ] **Phase 9** — Wire + archive collapsible, lazy-rendered, paginated archive,
      loading states.
- [ ] **Phase 12** — Replace remaining `innerHTML` sinks in `src/tracker/render.js` (24),
      `tracker-pro.js` (4), `events.js` (2), `wire.js` (3) with `safe-dom.js` helpers.
      Tighten `check-unsafe-dom` baseline in same commit block.
- [ ] **Phase 13** — Split 2,541-line `tracker-pro.css` into per-section files or prune
      dead rules. `IntersectionObserver`-gated rendering of below-fold sections.
- [x] Side-effect import of shared `reveal.js` from `src/pages/tracker-pro.js`.
      (`39138e7e`)
- [x] Wire + brief sections opted into `[data-reveal]`. (`1e484954`)

## 8. Track E — Motion & liveness layer

Applied on top of primitives from Track A. Rules:
- Every effect must have a **purpose**: feedback, continuity, or attention — never decorative.
- Every effect has a **reduced-motion path** that no-ops.

- [x] Price-change directional flash (green up, red down, 1 s fade). Primitive live;
      applied on karat strip. Pending on hero + tracker hero + market cards.
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
- [ ] 481–700 px phone-landscape & small-tablet spacing compression rules instead of
      premature desktop layout.
- [ ] 700–1024 px tablet layout — no awkward scaling, no oversized gaps, no premature
      column drops.
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
- [ ] Canonical `https://goldtickerlive.com/...` (apex, no www, no trailing slash
      inconsistencies).
- [ ] Structured data reflects each page's real purpose:
  - Home: `WebSite` + `SearchAction` + `BreadcrumbList` + `Organization`.
  - Tracker: `WebApplication`.
  - No `Product` schema on non-product pages.
- [ ] Internal linking: home ↔ tracker, calculator, shops, top country pages.
      Tracker ↔ calculator, methodology, country pages, shops.
- [ ] `sitemap.xml` correctness preserved; existing sitewide canonical test must still
      pass.

## 12. Track I — Perf & cleanup

- [ ] Measure initial JS + CSS for tracker and home before/after.
- [ ] Split oversized CSS files or prune dead rules (`tracker-pro.css` at 2,541 lines).
- [ ] `IntersectionObserver`-gated rendering for below-fold sections (tracker wire +
      archive, home FAQ + social + explainer).
- [ ] `loading="lazy"` + `decoding="async"` on non-critical images.
- [ ] Preconnect to data origins (`gold-api.com`, `exchangerate-api.com`) — verified
      present.
- [ ] Verify `sw.js` still caches revamped assets correctly.
- [ ] Remove duplicate inline styles once systemized into classes.

## 13. Track J — Final QA

Before marking the PR ready for review:

- [ ] `npm test` — all suites pass (requires `JWT_SECRET`, `ADMIN_PASSWORD`,
      `ADMIN_ACCESS_PIN`). Latest: **271 / 271 pass**.
- [ ] `npm run validate` — HTML + imports + DOM-sink check green; baseline tightened where
      sinks were removed. Latest: **0 errors**.
- [ ] `npm run quality` — ESLint + Prettier + Stylelint green.
- [ ] `npm run build` — Vite production build succeeds; bundle sizes reported in PR body.
- [ ] Visual screenshot diff on desktop + mobile, light + dark, EN + AR for hero, nav,
      drawer, karat strip, tools strip.
- [ ] PR body lists: what was verified, what wasn't (Lighthouse needs deploy), known
      risks, known remaining scope.

---

## 14. Explicit non-goals

- **No** SPA conversion. No client-side router.
- **No** chart-library swap.
- **No** CSS/JS framework introduction (no Tailwind, React, Vue, Alpine).
- **No** rewrite of `server.js` or the admin backend.
- **No** new third-party runtime dependencies unless specifically justified
  (advisory-DB consulted first).
- **No** re-opening of already-completed work unless a regression is found.
- **No** mass content rewrites outside the sections listed here.

## 15. Reversibility & risk management

- Every commit is narrow, so `git revert <sha>` undoes exactly that concern.
- The PR can land in stages if reviewers prefer chunked review.
- Visual regressions caught via screenshot-diff in Track J; structural regressions via
  tests.
- Any new dependency or new DOM-sink pattern triggers a hard stop and re-evaluation.

## 16. Open questions (carry forward until answered)

1. Should the nav search be shipped in this PR or deferred (adds meaningful JS)?
   **Default:** ship behind progressive enhancement.
2. Should the homepage drop any existing sections entirely (e.g., social strip) or just
   de-emphasize? **Default:** keep all, re-rank + tighten.
3. Are bilingual strings for all new homepage copy expected in this PR or a follow-up?
   **Default:** English now, stub Arabic for follow-up.
4. Is the tracker sticky control bar OK to ship if it changes the visual identity of the
   page materially? **Default:** ship it.

---

## 17. Progress log (append-only)

Append one row per commit on the revamp branch. Keep commit SHA short (8 chars). When a
PR merges, update the "Last updated" banner at the top of the file and copy the merged
commits into the "Merged" section below.

### Round 1 — Track A foundation + Track C/D reveal wiring (in-branch, pending merge)

| SHA        | Bucket      | Summary                                                          |
| ---------- | ----------- | ---------------------------------------------------------------- |
| `ab3f8dc3` | `tokens`    | Add `--surface-glass` and `--rhythm-*` scale                     |
| `788feb14` | `motion`    | Reveal/flash/pulse/drawer primitives + reduced-motion reset      |
| `0d2c40c8` | `surface`   | `.surface-elevated/subtle/accent/glass` utility classes          |
| `82b8d77c` | `wiring`    | `src/lib/reveal.js` shared `IntersectionObserver`                |
| `0b03c603` | `wiring`    | `src/lib/count-up.js` numeric count-up primitive                 |
| `e19aae33` | `motion`    | Opt home sections into `[data-reveal]` reveal-on-scroll          |
| `14d365cc` | `wiring`    | Count-up + directional flash on karat strip prices               |
| `39138e7e` | `wiring`    | Tracker imports shared `reveal.js`                               |
| `1e484954` | `motion`    | Opt tracker wire + brief sections into `[data-reveal]`           |
| `0a3c7591` | `wiring`    | count-up: robust numeric parse + named `FLASH_DURATION_MS`       |

### Round 2 — Track A focus-ring audit + follow-ups (in-branch, pending merge)

| SHA        | Bucket      | Summary                                                          |
| ---------- | ----------- | ---------------------------------------------------------------- |
| _pending_  | `cleanup`   | Remove duplicate `:focus-visible` in `global.css` that shadowed the token-based baseline with hardcoded values |

### Merged PRs

_None yet._ Populate when the first revamp PR merges: PR number, merge date, branch name,
range of SHAs covered, any follow-ups.

---

## 18. Update protocol (how to keep this file honest)

1. **On every `report_progress` call**, edit this file in the same commit:
   - Tick checkboxes that completed.
   - Append a row to §17 "Progress log" with the new commit SHA and one-line summary.
   - Bump the "Last updated" banner (top of file) and "Round" counter if applicable.
2. **On PR merge**, add an entry to §17 "Merged PRs" with PR number, date, branch,
   SHA range, and migrate in-branch rows from "Round N (pending merge)" into the merged
   round's table.
3. **If a new track or bucket is required**, add it in the relevant section; do not
   invent a side document.
4. **If scope changes**, record the change here before coding. A scope change without
   a doc update is a scope violation.
5. **If this file is deleted, renamed, or forked**, treat that as a scope violation and
   restore it.

> This file replaces `docs/REVAMP_STATUS.md` for the homepage + nav + tracker revamp.
> Legacy tracks from that file remain valid for their respective scopes.

---

## 19. Decisions log

_Absorbs `docs/product/DECISIONS.md`. Append-only. One entry per architectural
or product decision that future agents need to know about._

### 2026-04-04 — Keep the current static architecture

- **Decision.** Keep current static multi-page architecture for now.
- **Why.** The biggest issues are trust, UX, state reliability, and SEO — not
  framework limitations.
- **Consequence.** Prefer targeted refactors over migrations.

### 2026-04-04 — Spot/reference vs retail, always distinguished

- **Decision.** Always distinguish spot/reference prices from retail shop
  prices.
- **Why.** This is core to trust.
- **Consequence.** UI labels, methodology notes, and page copy must reflect
  this. Codified in §0.1 Trust guardrails and §0.2 trust snippets.

### 2026-04-22 — REVAMP_PLAN.md is the single source of truth

- **Decision.** Consolidate every planning / status / roadmap / task / audit
  doc into `docs/REVAMP_PLAN.md`. Source files become thin pointers.
- **Why.** Multiple overlapping plan docs caused drift and confusion about
  which file to update when reporting progress.
- **Consequence.** All planning edits land here. `docs/README.md` maps the
  pointer index. Reference docs (ARCHITECTURE, DESIGN_TOKENS, SEO_STRATEGY,
  etc.) stay independent.

---

## 20. Project memory

_Absorbs `docs/product/MEMORY.md`. Long-lived project-level facts that future
contributors need. Repository-wide memory lives in the agent memory store; this
section is for facts that benefit every contributor (human or agent)._

- Users care a lot about trust wording.
- Avoid generic "AI-looking" page layouts.
- Do not overbuild. Small reliable improvements beat broad rewrites.
- Tracker and shops pages are high priority.
- Country / city pages need strong SEO and internal linking.
- Any fallback / estimated data must be clearly labeled.
- When reviewing code, inspect relevant files before proposing architecture
  changes.
- Always separate review, plan, debug, and build modes.
- `buildFilters()` on the shops page already validates each dropdown value and
  resets invalid ones to `'all'` — lean on that safety net rather than
  duplicating validation upstream.

---

## 21. Rollout governance

_Absorbs `docs/product/ROLLOUT_GOVERNANCE.md`. Defines a safe rollout sequence
and release gate for multi-PR revamp work._

### Release waves

#### Wave 1 — Shops

Scope: `shops.html`, `shops.js`, `shops.css`.

Gate to move forward:
- Functional and trust checks pass for shops flows.
- No unresolved accessibility blockers in modal / filter path.

#### Wave 2 — Tracker

Scope: `tracker.html`, `tracker-pro.js`, `tracker-pro.css`, `tracker/` modules
touched by tracker PRs.

Gate to move forward:
- Onboarding and source-state clarity validated.
- Compare / archive / planner critical paths verified.

#### Wave 3 — Country / City / Market templates

Scope: country / city / market HTML templates and metadata / canonical /
internal-link consistency.

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
