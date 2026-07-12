# Design, Type & Motion Overhaul — Plan (plan-gate)

**Date:** 2026-07-12 · **Author:** Design Orchestrator (L0) · **Status:** proposed — **awaiting owner
direction pick before any lane starts.**
**Audit:** [`docs/audits/2026-07-12_design-motion-overhaul-audit.md`](../audits/2026-07-12_design-motion-overhaul-audit.md) ·
**Ledger:** [`PHASE_LEDGER.md`](../../PHASE_LEDGER.md) ·
**Prior direction:** [`GOLDTICKERLIVE_VISUAL_DIRECTION_V2.md`](../design/GOLDTICKERLIVE_VISUAL_DIRECTION_V2.md)

> **This is a consolidation-and-finishing overhaul, not a rebuild.** The audit established that
> GoldTickerLive already ships a mature, dual-theme, semantic-token "Editorial Bullion Terminal" system
> with self-hosted fonts, a live motion-JS layer, and a strong trust surface. The overhaul pays down the
> **6 documented debts** and adds **at most one bold signature**. A from-scratch aesthetic is explicitly
> not on the table.

---

## Directions

> _Populated from the design-directions workflow (3 independent directions + adversarial critique).
> The owner picks one here; L1 and L4 unblock on that pick._

<!-- DIRECTIONS_PLACEHOLDER -->

---

## Lane plan (reality-adapted from master prompt §8)

Paths corrected (CSS in `styles/`, not `src/styles/`). Scope reflects the audit, not the stale "~390
pages" framing.

### L1 — Tokens & Theme 🔴 (foundation; must merge first)
- Reconcile the **two token namespaces**: standardize on `--color-*`/`--surface-*` + semantic aliases;
  migrate every `--gtl-*` consumer; delete `--gtl-*`.
- Finish **dark mode** as designed (not an inversion) across the surfaces where the homepage deferred it;
  reconcile with the dual-theme dark that shipped on the other branch.
- Fold in any palette/type-scale token changes the chosen direction requires.
- **No page migration in this lane.** Ship the foundation only. PR includes the WCAG AA contrast matrix
  (gold-on-light is the known trap).

### L2 — Typography 🟡 (mostly done — refinement)
- Fonts are already self-hosted + subset (≤180KB). Verify subsets still cover EN+AR glyph/figure needs.
- **Only if the chosen direction calls for it:** add a dedicated numeric/"ticker" face — must keep
  tabular-lining figures and stay within the font budget; prove a `111.11 → 888.88` tick with zero jitter.
- Preload exactly the 2 critical-path faces; `font-display: swap` (body) / `optional` (display).

### L3 — Motion System 🟡 (wiring + cleanup, not a build)
- **Wire or delete** the 4 dead keyframes (`gold-sweep`, `slide-in-start`, `fade-scale-in`, `heading-reveal`).
- Consolidate duplicated shimmer/hover rules; keep the ≤12KB gz new-JS budget (most of the system exists).
- Build the **2 missing catalogue items**: the signature load moment (owned with L4) and the chart line
  draw-in (owned with L6).
- Re-assert: transform/opacity only, zero CLS, RM in CSS **and** JS, RTL-direction-aware, price number
  never moves. Document every animation in `docs/design/MOTION.md`.

### L4 — Signature / Hero 🟡 (gated on direction pick)
- Build the single chosen signature and the hero around it. ≤900ms, non-blocking, does not delay LCP.
- Feature-detected with a static, beautiful, no-JS fallback. Works at 320px, in RTL, under reduced-motion.

### L5 — Data Components 🔴 (trust surface — highest care)
- **Unify the two freshness renderers** — retire `.gtl-provenance`'s 2-state/hardcoded-hex path onto the
  6-state tokenized `.freshness-chip`. No off-token hexes on the trust surface.
- Preserve spot≠retail distinction and the glyph+sign+colour up/down encoding. Keep the throttled
  `aria-live` announcements. Do not de-emphasize any disclaimer/methodology link.

### L6 — Charts & Tools 🟡
- Chart line **draws in once** on first view (≤700ms `stroke-dashoffset`); never on live update. Last
  point reconciles to the exact hero value (ties to pricing-audit F-1).
- Migrate tool-page CSS (calculator/portfolio/compare/heatmap) onto tokens; colourblind-safe encoding.

### L7 — Page Consolidation 🟡 (the real "bulk" work — 11 pages, not 390)
- Merge each `page.css` + `page-redesign.css` pair → delete the fork. One PR per page (or small group).
- Grep-verify raw hex → 0 outside `tokens.css` on each migrated page; paste the count in the PR.
- **Do not touch any `<head>`** (title/meta/canonical/hreflang/JSON-LD are out of scope).

### L8 — RTL & i18n 🔴
- Convert the ~47 physical `left/right` props (excl. admin) to logical properties; paste before/after count.
- Direction-check every animation; Arabic type rhythm; correct numeral system per market (document it).
- Direction-implying icons mirror; clock/chart/logo/bar do **not**. Screenshot every changed page in `/ar/`.

### L9 — A11y, Perf & CI Gates 🟢 (referee)
- Wire Lighthouse CI + axe-core into Actions with the §2 budgets as **hard failures** (`lighthouserc.json`
  and `.pa11yci.js` already exist — extend, don't rebuild). Free tier only. Open issues against lanes that
  blow a budget; block their PRs.

### L10 — UX Copy 🟢
- One copy deck (`docs/design/COPY.md`) for freshness/empty/error/stale/offline, EN+AR (Arabic written,
  not machine-translated). Other lanes consume it; this lane edits no other files.

### L11 — Styleguide 🟢
- Promote `docs/design/reviews/styleguide.html` → shipped `/styleguide.html` (noindex, sitemap-excluded)
  covering **light+dark, LTR+RTL, all 6 freshness states, motion, chart states**. Write
  `docs/design/DESIGN_SYSTEM.md` as the living spec.

---

## Sequencing

1. **L1 merges first** (touches everything).
2. Then **L2 ∥ L3**.
3. Then **L4 ∥ L5 ∥ L6**.
4. Then **L7**.
5. **L8, L9, L10, L11** run continuously from the moment L1 lands.

**Never in parallel:** L1 with anything · L5 with L7 · L8 with L4.

---

## Verification gates (per PR — evidence, not assertions)

- `npm test` ≥ **1623 passing / 0 failing** · `npm run lint` · `npm run validate` · `npm run build`.
- `grep -rEn '#[0-9a-fA-F]{3,8}' styles/ --include=*.css | grep -v tokens.css | wc -l` — trend to 0; paste count.
- Lighthouse (mobile+desktop) + `@axe-core/cli` = 0 violations, committed under `docs/audits/`.
- Screenshots: mobile+desktop × EN+AR × light+dark (8 min) per PR.
- CPU-throttled (4×) 60fps proof for anything animated; a `prefers-reduced-motion` recording; RTL
  keyboard tab-through of any new interactive component.

---

## Guardrails (unchanged, non-negotiable)

Spot≠retail never styled the same · freshness first-class (never animate stale) · the price number never
moves · transform/opacity only, zero CLS · reduced-motion honored in CSS **and** JS · logical properties +
RTL-direction-aware motion · up/down never colour-only · ≤12KB gz new motion JS · dual theme as tokens ·
self-host+subset fonts ≤180KB · Lighthouse Perf ≥90 / A11y 100 · **stay static** (no framework). Financial
invariants (peg 3.6725, troy 31.1035, karat ÷24, real data only) are untouched by this presentation work.
