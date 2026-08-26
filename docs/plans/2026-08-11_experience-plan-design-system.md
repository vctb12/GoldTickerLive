# EXP-01 — Experience Plan and Design System

**Status:** PR_READY_SOURCE_STAGE  
**Owner:** Design Systems + Frontend  
**Scope:** `docs/audits`, `docs/plans`, `docs/DESIGN_TOKENS.md`, `styles/global.css`

## Delivery plan

| Task                                      | Owner                    | Checkpoint                                             | Output                                               |
| ----------------------------------------- | ------------------------ | ------------------------------------------------------ | ---------------------------------------------------- |
| Reconcile audit evidence and user intents | Design Systems           | EN/AR, RTL, and AA notes reviewed                      | Versioned reconciliation audit                       |
| Select visual direction                   | Design Systems + Product | Three directions scored with rationale                 | Market Desk selected                                 |
| Establish composition aliases             | Frontend                 | Aliases map only to existing semantic tokens           | Global CSS + token reference                         |
| Apply Market Desk to flagship surfaces    | Frontend                 | Preserve trust and pricing contracts                   | Home, tracker, and calculator polish complete        |
| Run integrated verification               | QA                       | 390/768/1024/1440, EN/AR, light/dark, repository gates | `reports/EXP-04-verification-evidence-2026-08-11.md` |

## Checkpoints

1. **Design — complete:** audit, intent map, mockups, and scorecard are versioned in the companion
   reconciliation audit.
2. **Token — complete:** `styles/global.css` adds semantic composition aliases only; the contract is
   documented in `docs/DESIGN_TOKENS.md`.
3. **Integration — complete:** Market Desk is applied to the flagship home, tracker, and calculator
   presentation while preserving pricing, freshness, methodology, and retail distinction.
4. **Release — PR ready:** integrated source checks and fresh in-app browser QA are recorded in the
   EXP-04 verification report. Existing CI remains the synthetic axe/performance budget authority.

## Explicit exclusions

No hard-coded pricing logic, pricing constants, server code, configuration, workflow, service
worker, package manifest, data file, SEO canonical, or frontend page/component is changed by EXP-01.
