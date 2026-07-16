# PHASE LEDGER

The cross-session handoff record. Update a phase to `IN_PROGRESS` at the start of a session and to
`DONE` (with PR link + one-line evidence) at the end. Assume the next agent has zero memory of you.

Statuses: `NOT_STARTED` · `IN_PROGRESS` · `BLOCKED` · `DONE` · `GATED_PENDING_OWNER`.

---

## OPERATION MIDAS — Total Assurance Campaign (opened 2026-07-16)

**Plan:** [`docs/plans/2026-07-16_operation-midas.md`](./docs/plans/2026-07-16_operation-midas.md) ·
**Baseline:** [`docs/plans/midas/baseline/`](./docs/plans/midas/baseline/) · **Branch:**
`claude/operation-midas-goldtickerlive-6b32h3` · **Rollback tag:** `pre-midas` (`0f61fd6`)

> **Test floor: 1668 passing / 0 failing** (measured Phase 1; supersedes the plan's stale 1081).
> Session adaptation: phases land as per-phase commits on the designated branch (harness mandates a
> single branch); PR granularity is the owner's call at merge time. See plan §10.

| Phase | Name                                  | Risk  | Status      | Evidence                                                                                                                                                                                                                                                                                                                       |
| ----- | ------------------------------------- | ----- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1     | Baseline Lock & Environment Bootstrap | GREEN | DONE        | 1668/0 tests; build green (dist 6.9 MB); prod headers + sitemap + home HTML captured; `pre-midas` tag; plan-assumption corrections in `baseline/README.md`                                                                                                                                                                     |
| 2     | Parallel Codebase Recon (4 SCOUTs)    | GREEN | DONE        | `docs/plans/midas/ARCHITECTURE_MAP.md` — 4 lanes mapped; constants inventory (troy-oz 3-way drift 31.1035 vs 31.1034768; karat = code/24 NOT .999 table; 14 peg copies; 2 freshness systems); CI merge gate found `disabled_manually` since 2026-04-24 (GitHub API)                                                            |
| 3     | Live Production Audit                 | GREEN | DONE        | `docs/plans/midas/AUDIT_LIVE.md` — F1 Confirmed-HIGH (no noscript at all), F2 Partial, F3 Refuted-but-worse (hreflang→?lang=ar serves byte-identical EN, canonical conflict, zero indexable AR), F4 Confirmed, F5 Confirmed, F6 Partial (FAQ is microdata). Prices sane + labels honest at probe; console-zero on home+tracker |
| 4     | Risk Register & Plan Ratification     | GREEN | DONE        | `docs/plans/midas/RISK_REGISTER.md` — 15 risks; 7 plan amendments ratified (incl. Directive-3 = code/24, Phase-9 approach, Phases 14–16 re-pointed); Owner-Gated Decision Queue Q1–Q6 batched. Phase 4b: ci.yml e2e `cp -r countries` guarded so owner can re-enable CI (Q1)                                                   |
| 5–30  | Waves 1–7                             | —     | NOT_STARTED | Order ratified: 5, 8, 6, 7, 9 (Wave 1); Phase 19 GATED_PENDING_OWNER (Q3)                                                                                                                                                                                                                                                      |

### Midas session log

| Date       | Session        | Phases | Result                                                                                                                                                                                                                                                                     |
| ---------- | -------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-07-16 | Orchestrator 1 | 1–…    | Kickoff. Baseline locked (1668/0). Found: `/ar/` = prod 404 (no AR URL space; client-side i18n only); sitemap = 14 URLs (site is ~17 pages, not ~390); Vite build breaks on any stray `.html` in repo. Wave-0 recon + live audit dispatched as parallel read-only fan-out. |

---

## DESIGN OVERHAUL — Design, Type & Motion System (opened 2026-07-12)

**Plan:**
[`docs/plans/2026-07-12_design-motion-overhaul-plan.md`](./docs/plans/2026-07-12_design-motion-overhaul-plan.md)
**Audit:**
[`docs/audits/2026-07-12_design-motion-overhaul-audit.md`](./docs/audits/2026-07-12_design-motion-overhaul-audit.md)
**Execution queue (30 phases, one PR each):**
[`docs/plans/2026-07-12_design-overhaul-30-phase-execution.md`](./docs/plans/2026-07-12_design-overhaul-30-phase-execution.md)
**Standing operating prompt for sessions:**
[`docs/agent/DESIGN_OVERHAUL_OPERATING_PROMPT.md`](./docs/agent/DESIGN_OVERHAUL_OPERATING_PROMPT.md)

> **Reality note (§11):** this is a _consolidation + finishing_ overhaul of a mature "Editorial
> Bullion Terminal" system, not a greenfield restyle. Scope is the 6 debts in the audit + 1 chosen
> signature — not "~390 pages." Paths corrected: CSS lives in `styles/`, tokens in
> `styles/partials/tokens.css`. Test floor: **1623 passing / 0 failing**.

| Lane    | Phase                                                                           | Risk    | Status                                                                                                                                                                                                                                                      | Owns (corrected paths)                                                        | Depends on |
| ------- | ------------------------------------------------------------------------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------- |
| **L0**  | Orchestrator: discovery + plan + 3 directions + ledger                          | GREEN   | **DONE** — direction picked: **Consolidate + Draw-In**; L1 token-diff audit in plan appendix                                                                                                                                                                | `docs/plans/*`, `docs/audits/*`, `PHASE_LEDGER.md`                            | —          |
| **L1**  | Tokens & theme: reconcile `--gtl-*`→`--color-*`, finish dark mode               | **RED** | **IN_PROGRESS** — safe slice landed (display scale canonical in tokens.css + deprecation contract, zero visual change, gates green). Remainder (scale/radii/motion/serif convergence, `--gtl-*` deletion, dark reconcile) needs the visual-acceptance gate. | `styles/partials/tokens.css`, `styles/design-system.css`, theme layer         | L0         |
| **L2**  | Typography: refine (mostly done); optional dedicated numeric face               | YELLOW  | NOT_STARTED                                                                                                                                                                                                                                                 | `styles/partials/fonts.css`, `assets/fonts/**`, type tokens                   | L1         |
| **L3**  | Motion system: wire/delete dead keyframes, consolidate, add the 2 missing items | YELLOW  | NOT_STARTED                                                                                                                                                                                                                                                 | `styles/partials/motion-advanced.css`, `src/lib/*motion*.js`                  | L1         |
| **L4**  | Signature / hero: build the **hero sparkline draw-in** (chosen signature)       | YELLOW  | **NOT_STARTED** (ready; ship last, after `/styleguide.html` can regression-test it)                                                                                                                                                                         | `index.html` hero, `src/lib/*`, hero CSS                                      | L1,L2,L3   |
| **L5**  | Data components: unify the 2 freshness renderers; spot/retail polish            | **RED** | NOT_STARTED                                                                                                                                                                                                                                                 | `styles/partials/price-display.css`, `styles/components/price-provenance.css` | L1,L3      |
| **L6**  | Charts & tools: chart line draw-in; token migration on tool pages               | YELLOW  | NOT_STARTED                                                                                                                                                                                                                                                 | chart JS/CSS, calculator/portfolio/compare/heatmap                            | L1,L3      |
| **L7**  | Page consolidation: merge 11 `*-redesign.css` pairs; kill ~319 raw hex          | YELLOW  | NOT_STARTED                                                                                                                                                                                                                                                 | `styles/pages/**`                                                             | L1,L2      |
| **L8**  | RTL & i18n: logical-property sweep (~47 excl admin); AR type                    | **RED** | NOT_STARTED                                                                                                                                                                                                                                                 | `styles/**` logical props, `/ar/` overrides                                   | all        |
| **L9**  | A11y, perf & CI gates: wire Lighthouse CI + axe as hard failures                | GREEN   | NOT_STARTED                                                                                                                                                                                                                                                 | `.github/workflows/*`, `lighthouserc.json`, `.pa11yci.js`                     | all        |
| **L10** | UX copy: freshness/empty/error/stale strings, EN+AR                             | GREEN   | NOT_STARTED                                                                                                                                                                                                                                                 | `docs/design/COPY.md` (deck only; no other-lane edits)                        | —          |
| **L11** | Styleguide: promote review artifact → shipped `/styleguide.html` (noindex)      | GREEN   | NOT_STARTED                                                                                                                                                                                                                                                 | `styleguide.html`, `docs/design/DESIGN_SYSTEM.md`                             | L1–L5      |

**Sequencing.** L1 lands and merges **first** (foundation). Then L2/L3 parallel. Then L4/L5/L6
parallel. Then L7. L8/L9/L10/L11 run continuously from the moment L1 lands. **Never in parallel:**
L1 with anything; L5 with L7; L8 with L4.

**Direction (owner-chosen 2026-07-12):** **Consolidate + Draw-In** — Direction A's consolidation
spine (pay down all 6 debts) + one signature, the hero sparkline draw-in. Adopt Direction B's
_thesis_ (one 6-state freshness machine → one readout) but **not** its brushed-metal specular
material (held as a gated phase-2 experiment behind an AA-contrast gate). Direction C (The Tape)
rejected. Gate is now **lifted**; lanes may start, L1 first.

### Session log

| Date       | Session           | Lane      | Result                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------- | ----------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-07-12 | Orchestrator      | —         | Merged open PRs #672–#680 into `main`. Ran discovery → `docs/audits/2026-07-12_design-motion-overhaul-audit.md`. Wrote this ledger + the plan with 3 directions + adversarial critique. **Owner picked "Consolidate + Draw-In."** Ran the L1 token-diff audit (plan appendix): 13 clean colour aliases + ~32 scale tokens that differ → L1 is a real consolidation, not a rename.                                                                                                                                                                                                                                              |
| 2026-07-12 | L1 (safe slice)   | L1        | Promoted the redesign editorial display scale into `tokens.css` as canonical (`--text-price-hero/-display-1/-display-2/-title/-kicker`, `--measure`); re-pointed the matching `--gtl-*` type tokens + `--gtl-measure` to alias them; added the L1 deprecation contract to `design-system.css`. **Zero visual change** (provable aliases, no name collisions). Verified: `npm run build` ✓ · `npm test` **1647/0** ✓ · `npm run lint` exit 0. NOT visually verified (no browser screenshots) — value is a pure alias so no rendered change is possible. Remainder of L1 is value-changing and needs the visual-acceptance gate. |
| 2026-07-12 | Execution batch 1 | L1,L3,L10 | Authored the 30-phase queue + standing operating prompt. Executed three phases as disjoint PRs off `main`: **P08** dead-keyframes deletion (PR #690, grep-proven 0 consumers, build ✓, tests 1647/0), **P14** EN+AR copy deck (PR #691, docs-only), **P05** tracker chart colour tokenization (PR #692, browser-proven VALUE-IDENTITY: PASS, tests 1647/0). This branch's PR carries the docs + P01.                                                                                                                                                                                                                           |
