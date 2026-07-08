# Phase 26 — Portfolio tracker polish, in-place (Track F · Green)

Audited the portfolio tracker (`portfolio.html`, `src/pages/portfolio.js`,
`styles/pages/portfolio.css`). The tool is well-built (local-only holdings, labeled inputs, correct
value formula), but the audit found one real modal-accessibility gap. Fixed and verified, plus the
recurring fallback-token cleanup.

## Bug fixed — modal dialog had no accessible name (ARIA / WCAG 4.1.2)

The add/edit-holding and confirm-delete flows both use the shared `<dialog id="portfolio-dialog">`
opened with `showModal()`. Each builder injects an `<h2>` title ("Add holding" / "Edit holding" /
the confirm prompt), but the dialog had **no `aria-labelledby`**, so screen readers announced the
modal with no name — the user hears "dialog" with no indication of what it's for.

**Fix:** declared `aria-labelledby="portfolio-dialog-title"` on the static `<dialog>`
(`portfolio.html`) and gave the title `<h2>` that id in **both** builders — `openHoldingDialog()`
and `confirmDialog()` (`src/pages/portfolio.js`). Only one dialog is open at a time and content is
rebuilt on each open, so the single shared id is correct.

**Verified** (headless Playwright): clicking "Add holding" opens the dialog with
`aria-labelledby="portfolio-dialog-title"` resolving to the title text **"Add holding"** — a real
accessible name where there was none.

## Correctness cleanup

- `styles/pages/portfolio.css` had the recurring dead+mismatched fallback
  `letter-spacing: var(--tracking-wide, 0.04em)` in **two** places — `--tracking-wide` is defined as
  **0.025em**, so the `0.04em` literal was dead and misleading. Removed the fallback (same cleanup
  as Phases 24/25).

## Verified well-built — no change needed

- **Add/edit form:** every input (`pf-label`, `pf-weight`, `pf-karat`, `pf-date`, `pf-cost`,
  `pf-cost-currency`) is paired with a `<label for>` via the shared `field()` helper (ids match);
  inputs use correct `type` (number/date/text), `inputmode`, `min`/`step`, and `required`.
- **Holdings table:** real `<table>` with `<th scope="col">` for all seven columns; edit/remove
  buttons carry value-bearing `aria-label`s (`"<edit/remove>: <holding label>"`).
- **Value formula:** `weight × (karat/24) × (spot ÷ troy-oz) × FX` with the immutable
  `CONSTANTS.AED_PEG` (3.6725) and troy-oz constant — invariants intact; every figure labeled a
  spot-linked reference estimate.
- **Privacy / $0:** holdings persist to `localStorage` only — no backend, no account, no cost.
- No duplicate ids, no empty interactive elements.

## Registered follow-up

- The portfolio page's **shared edu-hub** section carries the same colour-contrast the compare page
  does (`.edu-card-title`, ~4.36:1 vs 4.5:1) — the Phase-19-deferred shared-token, both-theme
  contrast pass (target data recorded in the Phase 24 report). Not rushed into this Green phase.

## Gate

`npm run build` + `npm run validate` + `npm test` (1286 pass) + `npm run lint` — all green. Headless
render confirms the dialog now exposes its accessible name on open.
