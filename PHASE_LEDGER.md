# PHASE LEDGER

The cross-session handoff record. Update a phase to `IN_PROGRESS` at the start of a session and to
`DONE` (with PR link + one-line evidence) at the end. Assume the next agent has zero memory of you.

Statuses: `NOT_STARTED` · `IN_PROGRESS` · `BLOCKED` · `DONE` · `GATED_PENDING_OWNER`.

---

## DESIGN OVERHAUL — Design, Type & Motion System (opened 2026-07-12)

**Plan:** [`docs/plans/2026-07-12_design-motion-overhaul-plan.md`](./docs/plans/2026-07-12_design-motion-overhaul-plan.md)
**Audit:** [`docs/audits/2026-07-12_design-motion-overhaul-audit.md`](./docs/audits/2026-07-12_design-motion-overhaul-audit.md)

> **Reality note (§11):** this is a *consolidation + finishing* overhaul of a mature "Editorial Bullion
> Terminal" system, not a greenfield restyle. Scope is the 6 debts in the audit + 1 chosen signature —
> not "~390 pages." Paths corrected: CSS lives in `styles/`, tokens in `styles/partials/tokens.css`.
> Test floor: **1623 passing / 0 failing**.

| Lane | Phase | Risk | Status | Owns (corrected paths) | Depends on |
| --- | --- | --- | --- | --- | --- |
| **L0** | Orchestrator: discovery + plan + 3 directions + ledger | GREEN | **IN_PROGRESS** | `docs/plans/*`, `docs/audits/*`, `PHASE_LEDGER.md` | — |
| **L1** | Tokens & theme: reconcile `--gtl-*`→`--color-*`, finish dark mode | **RED** | `GATED_PENDING_OWNER` (direction pick) | `styles/partials/tokens.css`, theme layer | L0 |
| **L2** | Typography: refine (mostly done); optional dedicated numeric face | YELLOW | NOT_STARTED | `styles/partials/fonts.css`, `assets/fonts/**`, type tokens | L1 |
| **L3** | Motion system: wire/delete dead keyframes, consolidate, add the 2 missing items | YELLOW | NOT_STARTED | `styles/partials/motion-advanced.css`, `src/lib/*motion*.js` | L1 |
| **L4** | Signature / hero: build the chosen signature | YELLOW | `GATED_PENDING_OWNER` (direction pick) | `index.html` hero, `src/lib/*`, hero CSS | L1,L2,L3 |
| **L5** | Data components: unify the 2 freshness renderers; spot/retail polish | **RED** | NOT_STARTED | `styles/partials/price-display.css`, `styles/components/price-provenance.css` | L1,L3 |
| **L6** | Charts & tools: chart line draw-in; token migration on tool pages | YELLOW | NOT_STARTED | chart JS/CSS, calculator/portfolio/compare/heatmap | L1,L3 |
| **L7** | Page consolidation: merge 11 `*-redesign.css` pairs; kill ~319 raw hex | YELLOW | NOT_STARTED | `styles/pages/**` | L1,L2 |
| **L8** | RTL & i18n: logical-property sweep (~47 excl admin); AR type | **RED** | NOT_STARTED | `styles/**` logical props, `/ar/` overrides | all |
| **L9** | A11y, perf & CI gates: wire Lighthouse CI + axe as hard failures | GREEN | NOT_STARTED | `.github/workflows/*`, `lighthouserc.json`, `.pa11yci.js` | all |
| **L10** | UX copy: freshness/empty/error/stale strings, EN+AR | GREEN | NOT_STARTED | `docs/design/COPY.md` (deck only; no other-lane edits) | — |
| **L11** | Styleguide: promote review artifact → shipped `/styleguide.html` (noindex) | GREEN | NOT_STARTED | `styleguide.html`, `docs/design/DESIGN_SYSTEM.md` | L1–L5 |

**Sequencing.** L1 lands and merges **first** (foundation). Then L2/L3 parallel. Then L4/L5/L6 parallel.
Then L7. L8/L9/L10/L11 run continuously from the moment L1 lands. **Never in parallel:** L1 with
anything; L5 with L7; L8 with L4.

**Gate:** L1 and L4 are `GATED_PENDING_OWNER` until the owner picks a direction (see plan §Directions).

### Session log

| Date | Session | Lane | Result |
| --- | --- | --- | --- |
| 2026-07-12 | Orchestrator | — | Merged open PRs #672–#680 into `main`. Ran discovery; wrote audit + this ledger + the plan with 3 directions. **Awaiting owner direction pick.** |
