# Design Overhaul — 30-Phase Execution Plan

**Date:** 2026-07-12 · **Direction (owner-picked):** **Consolidate + Draw-In** **Parent plan:**
[`2026-07-12_design-motion-overhaul-plan.md`](./2026-07-12_design-motion-overhaul-plan.md) ·
**Audit:**
[`../audits/2026-07-12_design-motion-overhaul-audit.md`](../audits/2026-07-12_design-motion-overhaul-audit.md)
· **Operating prompt:**
[`../agent/DESIGN_OVERHAUL_OPERATING_PROMPT.md`](../agent/DESIGN_OVERHAUL_OPERATING_PROMPT.md) ·
**Ledger:** [`../../PHASE_LEDGER.md`](../../PHASE_LEDGER.md)

Every phase = **one small disjoint PR** on its own `claude/design-pNN-<slug>` branch off
`origin/main`. One phase per session unless phases are trivially disjoint. Statuses live in this
table — update it in the same PR that completes a phase (or in the ledger session log if the phase
PR must stay disjoint).

**Global gates (every PR):** `npm test` ≥ **1623/0** · `npm run lint` · `npm run build` ·
surface-relevant `npm run validate` · evidence pasted in the PR body (counts, screenshots, command
output). **Visual-gate phases** additionally need: screenshots mobile+desktop × EN+AR × (light+dark
where themed), and a reduced-motion proof for anything animated.

Legend: 🟢 safe (no rendered change / docs / additive) · 🟡 visual-gate (renders differently —
screenshots required) · 🔴 trust/blast-radius (adversarial-review your own diff before PR) · 🔒
owner-gated decision.

---

## Foundation — L1 tokens & theme (P01–P07)

| #   | Phase                                                                                                                                                                                                                                   | Risk | Depends | Status                                    |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ------- | ----------------------------------------- |
| P01 | Promote redesign display scale into `tokens.css` as canonical; `--gtl-*` type tokens become aliases; deprecation contract in `design-system.css`.                                                                                       | 🟢   | —       | **DONE** (`c456fdd`, gates green, 1647/0) |
| P02 | Inline the 13 Class-1 colour aliases at all `var(--gtl-…)` call sites (paper/surface/ink/gold/line/up/down → canonical `--color-*`). Mechanical, zero-visual; grep-verified count in PR.                                                | 🟢   | P01     | NOT_STARTED                               |
| P03 | DRY the `@media (prefers-color-scheme: dark)` first-paint fallback against `[data-theme='dark']` (tokens.css self-flags this). No value changes; verify no-JS dark first paint.                                                         | 🟢   | —       | NOT_STARTED                               |
| P04 | 🔒 **Scale-convergence decision package**: side-by-side screenshots of redesign vs base values (`maxw` 1180/1280, radii 10-14-18/8-12-16, spacing 96/80, `--gtl-ease` vs `--ease-premium`) → owner picks per family → execute the pick. | 🟡🔒 | P01     | GATED_PENDING_OWNER                       |
| P05 | Tokenize tracker SVG chart colours (`#b08a3e` line/gradient, `rgba(196,154,68,.12)` grid → `--chart-line/-grid/-fill` tokens), value-identical; unblocks theming.                                                                       | 🟢   | —       | NOT_STARTED                               |
| P06 | Homepage dark-mode un-defer: audit the deferred dark states on `index.html`, fix, prove with 8 screenshots; a11y 100 gate.                                                                                                              | 🟡🔴 | P03     | NOT_STARTED                               |
| P07 | Serif stack canonicalization: one `--font-serif-display` (keep `Cairo` fallback for RTL coherence; drop the `Iowan Old Style` variant in `--gtl-serif`). Screenshot EN headings before/after.                                           | 🟡   | P01     | NOT_STARTED                               |

## Motion — L3 (P08–P10)

| #   | Phase                                                                                                                                                                 | Risk | Depends | Status      |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ------- | ----------- |
| P08 | Delete the 4 dead keyframes (`gold-sweep`, `slide-in-start`, `fade-scale-in`, `heading-reveal`) after grep-proving zero consumers.                                    | 🟢   | —       | NOT_STARTED |
| P09 | Motion inventory + consolidation: dedupe shimmer/hover rules; write `docs/design/MOTION.md` documenting every animation, its token, reduced-motion and RTL behaviour. | 🟢   | P08     | NOT_STARTED |
| P10 | Reduced-motion kill-switch audit: prove CSS **and** JS honor RM on every animation (incl. `count-up.js` writing final value); add a regression test.                  | 🟢   | P09     | NOT_STARTED |

## Trust surface — L5 (P11–P13)

| #   | Phase                                                                                                                                                             | Risk | Depends | Status      |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ------- | ----------- |
| P11 | Unify freshness renderers: `.gtl-provenance` (2-state, hardcoded hex) adopts the tokenized 6-state model; **keep its disclosure affordance; stale stays static**. | 🔴🟡 | P02     | NOT_STARTED |
| P12 | Spot≠retail glance-proof: side-by-side panel in the styleguide + a 400ms-glance rationale note; verify EN+AR.                                                     | 🟢   | P15     | NOT_STARTED |
| P13 | `aria-live` audit: one polite, throttled announcer for price updates; test that it doesn't fire every tick.                                                       | 🔴   | —       | NOT_STARTED |

## Copy & styleguide — L10/L11 (P14–P16)

| #   | Phase                                                                                                                                                                                                        | Risk | Depends | Status      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---- | ------- | ----------- |
| P14 | `docs/design/COPY.md`: the EN+AR copy deck for freshness/empty/error/stale/offline states, grounded in existing `translations.js` strings (deck only — no runtime edits).                                    | 🟢   | —       | NOT_STARTED |
| P15 | Promote the review styleguide → shipped `/styleguide.html`: noindex, sitemap-excluded, covering light+dark × LTR+RTL × all 6 freshness states × motion states. Passes the full `npm run validate` SEO chain. | 🟢   | P02     | NOT_STARTED |
| P16 | `docs/design/DESIGN_SYSTEM.md` living spec (tokens, roles, components, dos/don'ts) + link from styleguide.                                                                                                   | 🟢   | P15     | NOT_STARTED |

## Signature — L4/L6 (P17–P19)

| #   | Phase                                                                                                                                              | Risk | Depends | Status      |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ------- | ----------- |
| P17 | Sparkline **draw-in module** (`stroke-dashoffset`, once, ≤700ms, RM-instant, RTL-flipped origin, ~0.4KB gz) + unit tests. Not yet wired.           | 🟢   | P05     | NOT_STARTED |
| P18 | Wire the draw-in into the homepage hero sparkline, endpoint reconciled to the exact spot value. 8 screenshots + RM recording + 4×-CPU 60fps trace. | 🟡🔴 | P15,P17 | NOT_STARTED |
| P19 | Tool-page chart draw-in (calculator/compare/heatmap): once on first view, **never** on live update/re-render.                                      | 🟡   | P17     | NOT_STARTED |

## Page consolidation — L7 (P20–P26)

Merge each `page.css` + `page-redesign.css` pair into one stylesheet; migrate that page's raw hexes
to tokens in the same PR; per-page screenshot diff EN+AR (light+dark where themed). **Never in
parallel with P11.**

| #   | Phase                                                                                                                                                           | Risk | Depends | Status      |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ------- | ----------- |
| P20 | Merge `home` pair (222 `--gtl` uses — the big one).                                                                                                             | 🟡🔴 | P02,P04 | NOT_STARTED |
| P21 | Merge `market` + `glossary` pairs.                                                                                                                              | 🟡   | P02,P04 | NOT_STARTED |
| P22 | Merge `methodology` + `learn` pairs.                                                                                                                            | 🟡   | P02,P04 | NOT_STARTED |
| P23 | Merge `calculator` + `compare` pairs.                                                                                                                           | 🟡   | P02,P04 | NOT_STARTED |
| P24 | Merge `portfolio` + `heatmap` pairs.                                                                                                                            | 🟡   | P02,P04 | NOT_STARTED |
| P25 | Merge `shops` + `dubai-gold-price` pairs; delete `design-system.css` once `--gtl-*` consumers = 0.                                                              | 🟡   | P20–P24 | NOT_STARTED |
| P26 | Final hex sweep → **0 raw hex outside `tokens.css`** (excl. admin, tracked separately) + a `validate` guard script that fails CI on new raw hex/physical props. | 🟢   | P20–P25 | NOT_STARTED |

## RTL & quality — L8/L9 (P27–P29)

| #   | Phase                                                                                                                                                        | Risk | Depends | Status      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---- | ------- | ----------- |
| P27 | Logical-property sweep: convert the ~47 physical `left/right` props (excl. admin) to logical; paste before/after counts; AR screenshots of touched surfaces. | 🟡🔴 | —       | NOT_STARTED |
| P28 | RTL motion audit: every directional animation direction-checked in AR; icon-mirroring audit (arrows mirror; clock/chart/logo don't).                         | 🟡   | P09     | NOT_STARTED |
| P29 | CI hard gates: Lighthouse CI budgets (LCP ≤2.0s, CLS ≤0.02, Perf ≥90, A11y 100) + axe as **failing** checks in Actions; free tier.                           | 🟢   | —       | NOT_STARTED |

## Final — (P30)

| #   | Phase                                                                                                                                                                                                                                                                                          | Risk | Depends | Status      |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ------- | ----------- |
| P30 | Final pass: walk the site as a first-time Sharjah user on mid-range Android; Chanel pass (remove one accessory per page, list them); trust audit (spot≠retail still obvious? freshness? disclaimers?); final Lighthouse+axe committed to `docs/audits/`; ledger → COMPLETE; changelog release. | 🟡🔴 | all     | NOT_STARTED |

---

## Sequencing rules (from the parent plan — binding)

- **P04 (scale convergence) blocks the L7 merges (P20–P25)** — don't merge page pairs while the two
  scales still disagree, or you bake the disagreement in.
- **Never in parallel:** P11 with P20–P25 (both touch component markup/styles) · P27/P28 with P18
  (hero directionality) · anything with a P04-family change while it's mid-flight.
- 🟢 phases can interleave freely; they're the "always something shippable" queue.
- Trust invariants on every phase: spot≠retail distinct · stale never animates · price number never
  moves · no `<head>`/SEO surface edits in style PRs · peg 3.6725 / troy 31.1035 / karat ÷24
  untouched.
