# Design, Type & Motion Overhaul — Discovery Audit

**Date:** 2026-07-12
**Role:** Design Orchestrator (L0) — discovery + plan-gate only, no production CSS/JS this session.
**Companion plan:** [`docs/plans/2026-07-12_design-motion-overhaul-plan.md`](../plans/2026-07-12_design-motion-overhaul-plan.md)
**Prior art this builds on:** [`2026-07-10_VISUAL_TRANSFORMATION_AUDIT.md`](./2026-07-10_VISUAL_TRANSFORMATION_AUDIT.md) ·
[`docs/design/GOLDTICKERLIVE_VISUAL_DIRECTION_V2.md`](../design/GOLDTICKERLIVE_VISUAL_DIRECTION_V2.md) ·
[`reports/design/DESIGN_SPEC.md`](../../reports/design/DESIGN_SPEC.md)

> **Master-prompt reconciliation (§11 — "reality wins").** The overhaul master prompt was written
> from memory of prior sessions. I verified its assumptions against the repo this session. Several are
> materially wrong; where they conflict, this audit and the plan use reality, per the master prompt's
> own §11 instruction.

---

## 0. The headline: this is a *mature system carrying debt*, not a greenfield restyle

The single most important finding: **the "ship a premium design system" work is ~70% already done.**
GoldTickerLive has been through a ~50-phase visual overhaul, a token consolidation (phase 17,
2026-07-07), a shell/nav pass (phase 18), a homepage redesign (PR #642), and a documented **Visual
Direction V2** ("Editorial Bullion Terminal"). The token system is dual-theme and semantic; fonts are
self-hosted and subset; a live motion-JS system exists; and the trust surface (spot vs retail,
freshness states) is already well-built and mostly honors the non-negotiables — including the hard one
(**stale indicators are already static, not animated**).

Therefore the correct overhaul is **consolidation + finishing + at most one bold new signature**, not
a rebuild. A from-scratch aesthetic would discard a large, working investment and is explicitly *not*
recommended.

### Master prompt vs. verified reality

| Master prompt (§1, §5, §8) | Verified reality (2026-07-12) | Impact on plan |
| --- | --- | --- |
| "~390 static HTML pages across 15+ markets" | **38 committed HTML files**: ~16 shipped public pages, 16 `admin/*`, 6 `docs/design/reviews/*` artifacts. Country/city pages are **build-generated stubs**, not committed. | **L7 "migrate ~390 pages" is mostly moot.** Real target ≈ 11 shipped page stylesheets. |
| "CSS in `src/styles/…`, `tokens.css`" | CSS lives in **`styles/`**; tokens at **`styles/partials/tokens.css`**. No `src/styles/`. | Every lane's file paths in §8 need correcting (done in the plan). |
| "Test baseline 1081 passing" | **1623 passing / 0 failing** (per merged PRs #672–#680). | New floor: **1623**, must not drop. |
| "No self-hosted fonts / Google Fonts CDN present" | **Already self-hosted + subset** (Source Sans 3, Cairo, Playfair Display); Google CDN already stripped from 272 shells. | **L2 is largely done.** Remaining work is refinement, not migration. |
| "Build the motion system from scratch (`src/js/motion.js`)" | A live motion system exists: `src/lib/price-motion.js`, `motion-boot.js`, `count-up.js`, `freshness-pulse.js` + `styles/partials/motion-advanced.css`. | **L3 is mostly wiring gaps + cleanup,** not a build. |
| "PHASE_LEDGER.md exists" | **Absent.** Created by this session. | — |
| Test/no-index styleguide to be built | A styleguide exists but as a **review artifact only** (`docs/design/reviews/styleguide.html`): light-only, LTR-only, 3 of 6 freshness states. | **L11 = promote it to a shipped `/styleguide.html`,** not build from zero. |

---

## 1. Page archetypes (verified — master prompt guessed 8–12; actual ≈ 9 public + 2 non-shipped)

| # | Archetype | Representative file(s) | Notes |
| --- | --- | --- | --- |
| 1 | **Flagship homepage** | `index.html` (+ generated `/ar/`) | The signature surface; hero price instrument. |
| 2 | **Flagship tracker** | `tracker.html` | Always-dark "terminal"; the shared dark theme's origin. |
| 3 | **Interactive tools** | `calculator.html`, `portfolio.html`, `compare.html`, `heatmap.html` | Data-entry + derived values; charts/tables. |
| 4 | **Market data** | `market.html` | Worked example + (new) descriptive movement panel (#680). |
| 5 | **Country/city price** | `dubai-gold-price.html` (+ build-generated stubs) | Price-shopping surface; karat ladder. |
| 6 | **Editorial / teach** | `learn.html`, `glossary.html`, `methodology.html` | Prose + tables; disclaimers live here. |
| 7 | **Directory** | `shops.html` | Map + listings; "not a marketplace" trust note. |
| 8 | **Legal / utility** | `privacy.html`, `terms.html`, `offline.html`, `404.html` | Low-frequency; must join the system (offline needs `<main>`). |
| 9 | **Admin** (16 pages) | `admin/**` | **Separate, internal design surface.** Lowest priority; carries most of the physical-property and raw-hex debt. |
| — | Design-review artifacts | `docs/design/reviews/*.html` | `noindex`; concept mockups + the current styleguide. Not shipped. |

---

## 2. Token inventory — `styles/partials/tokens.css` (mature, semantic, dual-theme)

**Already present and good:**
- **Dual theme**: `:root` (light warm-parchment `#fdfbf5`) + `[data-theme='dark']` (layered near-black
  `#0b0b0d` → `#141418`/`#1c1c22`/`#26262c`) + a `prefers-color-scheme: dark` first-paint fallback.
- **Semantic colour**: `--surface-{canvas,primary,secondary,tertiary,accent}`, `--text-{primary,secondary,tertiary,accent}`,
  `--price-up/--price-down(+ -bg/-border)`, status set `--color-{live,daily,fixed,stale}` — all with
  dark-theme overrides tuned for AA (the file documents the contrast math inline).
- **Disciplined 3-tier gold**: accent `#b07d1f`/`#ddb040`, antique `#8a6d2f`/`#b5945c` (large headings
  only), bright `#f0ca5c`/`#fad97a` (sparing). Gold is an accent/hairline/material, never a large fill.
- **Motion tokens**: `--ease-premium: cubic-bezier(.16,1,.3,1)` (identical to the master prompt's
  requested `--ease-out-gold`), a duration scale (80–550ms), `--motion-spot-ring`, `--motion-sonar`,
  `--motion-stagger(-step)`, `--motion-page-transition`.
- **Type scale** (Major Third ×1.25), spacing (4px base), radii, elevation, "Precision Instrument"
  tokens (`--readout-*`, `--rim-inset`, `--font-numeric-features: tnum lnum zero`).

**Debt inside/around tokens:** a **second token namespace `--gtl-*`** ("Bullion Terminal") coexists
with `--color-*`/`--surface-*` — used by the styleguide, `price-provenance.css`, and `home-redesign`.
One price treatment, two vocabularies. **Reconciling these is debt #1.**

---

## 3. Hardcoded-value inventory (the §6 grep gate — measured, not vibes)

```
grep -rEn '#[0-9a-fA-F]{3,8}' styles/ --include=*.css   → 474 total across 34 files
  of which styles/partials/tokens.css                    → 155  (legitimate — hexes belong here)
  → raw hex OUTSIDE tokens.css                           ≈ 319 across 33 files   (target: 0)
```

**Top raw-hex offenders (file : count):** `methodology.css` 41 · `invest.css` 41 · `utilities.css` 30 ·
`admin.css` 25 · `heatmap.css` 20 · `partials/components.css` 19 · `tracker-pro.css` 16 · `critical.css` 15 ·
`partials/layout.css` 15 · `home.css` 14 · `components/price-provenance.css` 14 · `insights.css` 5 ·
`edu.css` 5 · `alert-manager.css` 5 · (remaining ≤6 each).

**Physical `left/right` properties (RTL risk):** **75 across 9 files** — `admin.css` 28 · `tracker-pro.css` 12 ·
`utilities.css` 8 · `shops.css`/`insights.css`/`components.css` 6 each · `calculator.css` 4 · `critical.css` 2 ·
`market-summary-ticker.css` 3. **Excluding admin ≈ 47.** Logical-property adoption already exists elsewhere.

**Reading:** the token debt is **real but bounded** and concentrated — roughly half of it is in
`admin/*` (internal, low priority) and legacy `*.css` files that a page-consolidation pass would delete
outright (see debt #2). It is not a 390-page sweep.

---

## 4. Type & font stack (self-hosted; L2 largely done)

Self-hosted, subset woff2, no Google CDN (7 files, ~180KB total):
- **Latin body/UI/numeric:** Source Sans 3 (`-latin`, `-latin-ext`) with `tnum lnum zero` features.
- **Serif display:** Playfair Display (600, 700) — Cairo swaps under `[dir='rtl']` (Playfair has no Arabic).
- **Arabic:** Cairo (`-arabic`, `-latin`, `-latin-ext`).

**Open design lever (not a defect):** the **numeric face is Source Sans 3 with tabular features**, not a
dedicated "ticker" face. V2 chose this deliberately. A direction *may* propose a dedicated numeric face
(the master prompt lists JetBrains/Geist/IBM Plex/Spline/Martian Mono) — but only if it stays within the
≤180KB budget and earns its bytes. Any change must preserve tabular-lining figures (non-negotiable).

---

## 5. Motion system inventory (`src/lib/*` + `motion-advanced.css`) vs. the §4 catalogue

| # | Catalogue item | Status | Evidence / note |
| --- | --- | --- | --- |
| 1 | Price-tick tint wash | **EXISTS** | `price-motion.js` up/down `data-price-flash` ~320ms; number stays put. RM-guarded. |
| 2 | Freshness pulse w/ states | **EXISTS** | `freshness-pulse.js` + 6 tokenized states; **stale is correctly STATIC** (the hard non-negotiable — already honored). |
| 3 | Signature load moment | **MISSING** | Only generic stagger / card-lift-in today. |
| 4 | Scroll reveal (IO) | **EXISTS** | `motion-boot.js` `observeReveal` + `animation-timeline: view()`; RM-guarded. |
| 5 | Hover micro-interactions | **PARTIAL** | `will-change` hints in `motion-advanced.css`; transforms live in component CSS. |
| 6 | Chart line draw-in | **MISSING** | No `stroke-dashoffset` draw; charts render instantly. |
| 7 | Skeleton shimmer | **PARTIAL** | `contain:strict` here; shimmer keyframe in `utilities.css`/`components.css`. |
| 8 | View-transition page fades | **EXISTS** | `vt-fade-*` + `initViewTransitions`; feature-detected; RM-guarded. |

**Dead keyframes** declared but never wired to a selector: `gold-sweep`, `slide-in-start`,
`fade-scale-in`, `heading-reveal` (`motion-advanced.css`). Either wire or delete. **Note:** `count-up.js`
animates the price *value via `textContent` interpolation* (not transform) — it writes the final value
instantly under reduced-motion, and the number does not translate/scale, so it satisfies "the number is
always readable," but this is the one place to audit carefully against "the price number never moves."

**76 `@keyframes` across 16 files; 92 `prefers-reduced-motion` blocks across 30 files** — reduced-motion
coverage is already broad. The motion budget risk is **sprawl/duplication**, not absence.

---

## 6. Trust surface (already strong — the bar is "don't regress")

- **Spot/reference vs retail**: distinguished by container + chip + gold accent (`price-display.css`
  `.price-kind--reference` / `.price-hero--reference` vs `.price-kind--retail` with a `· Retail est.` /
  `تقدير تجزئة` suffix). Same numeric face. **Meets the non-negotiable**, though "same face" is a lever a
  direction could push further (e.g. weight/tabular vs proportional).
- **Up/down**: arrow-glyph + sign + colour, `unicode-bidi: isolate` (never colour-only). **Meets it.**
- **Freshness**: 6 tokenized states (live / cached / delayed / stale / unavailable / offline), distinct
  copy + glyph; only genuine-live pulses. **Meets it.**
- **Debt #5:** a *second, weaker* freshness renderer exists — `.gtl-provenance` (live-vs-not only, with
  **hardcoded** `#2e9e5b`/`#b06a1f` hexes) competes with the 6-state `.freshness-chip`. Unify onto the
  tokenized one.

---

## 7. The six real debts (this is the overhaul's actual scope)

1. **Two token namespaces** — `--gtl-*` vs `--color-*`. Pick one (recommend `--color-*` + semantic
   aliases), migrate the other, delete the loser. *(RED — touches everything; L1.)*
2. **`page.css` + `page-redesign.css` duplication** on **11 pages** (home, market, compare, calculator,
   methodology, shops, dubai-gold-price, glossary, learn, portfolio, heatmap). A half-finished migration
   kept as parallel stylesheets. Merge each pair → delete the fork. *(YELLOW; L7.)*
3. **~319 raw hex + ~47 physical props** (excl. admin) → tokens + logical properties. Much disappears
   with debt #2. *(YELLOW; L7/L8.)*
4. **Dark mode fragmented** — homepage defers dark; dual-theme dark ships on another branch. Reconcile
   sitewide. *(RED — trust/perf; L1 + L5.)*
5. **Two divergent freshness renderers** (`.gtl-provenance` 2-state hardcoded vs `.freshness-chip`
   6-state tokenized). Unify. *(RED — trust surface; L5.)*
6. **Styleguide is review-only** — promote to a shipped `/styleguide.html` (noindex, sitemap-excluded)
   covering **light+dark, LTR+RTL, all 6 freshness states, motion, chart states** as the regression
   surface every future change is checked against. *(GREEN; L11.)*

Plus two **build-new** items (small): a **signature load moment** and the **chart line draw-in** (the
only two missing catalogue items), delivered by the chosen direction.

---

## 8. Performance & a11y (measure during, gate in CI)

Not re-measured this session (audit-only; no dev server spun up). Budgets from §2 stand as CI gates
(L9): LCP ≤2.0s mobile, CLS ≤0.02, INP ≤200ms, critical CSS ≤45KB gz, fonts ≤180KB (currently ~at
budget), new motion JS ≤12KB gz, Lighthouse Perf ≥90 / A11y 100. `lighthouserc.json` and `.pa11yci.js`
already exist — L9 wires them as hard failures rather than building from zero.

---

## 9. Verification of this audit

All numbers above are from live commands run this session against the branch head
(`claude/design-type-motion-overhaul-bxou8t`, reset to `main` @ `71aa1c6` after merging PRs #672–#680):
`git ls-files`, `grep -rEn` hex/physical-property counts, and structured reads of `tokens.css`,
`GOLDTICKERLIVE_VISUAL_DIRECTION_V2.md`, `price-display.css`, `price-provenance.css`, `motion-advanced.css`,
and the `src/lib/*` motion modules. No production CSS/JS was written. **Plan-gate: the owner picks a
direction before any lane starts.**
