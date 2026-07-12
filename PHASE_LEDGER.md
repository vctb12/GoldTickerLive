# Design Revamp — Phase Ledger

Outcome log for the 30-phase design revamp (`docs/plans/2026-07-12_design-revamp-30-phases.md`). One
row per phase; append on completion.

| Phase                               | Risk |               Status               | Date       | HEAD      | Outcome                                                                                                                     |
| ----------------------------------- | :--: | :--------------------------------: | ---------- | --------- | --------------------------------------------------------------------------------------------------------------------------- |
| **1 — Design inventory & baseline** |  🟢  | ✅ **done** (screenshots deferred) | 2026-07-12 | `4b299c4` | Built `docs/design/CSS_INVENTORY.md`; re-established the real test baseline; committed the plan. No product CSS/JS touched. |

## Phase 1 — details

**Delivered**

- `docs/design/CSS_INVENTORY.md` — full 46-file inventory: line counts, per-page load chains, the
  two-token-system fork map, `--gtl-*` migration surface (12 consumers), dark-mode gap (11/12
  redesign files dark-blind), 522 candidate-dead selectors, 315 out-of-token hex, RTL measurement,
  and a reconciliation table against the plan's stated facts.
- `docs/plans/2026-07-12_design-revamp-30-phases.md` — the plan itself, committed so its
  cross-references resolve, annotated with Phase-1 corrections.
- **Test baseline re-established: 1,656 tests / 164 suites — all pass, 0 fail** (`npm test`,
  `node --test`, HEAD `4b299c4`). Corrects the stale "1282" carried in the plan. (Was 1,647 at
  session start; +9 from PRs merged this session.)

**Verified facts (vs plan)**

- CSS: **46 files / 41,887 lines** (+2 vs plan's 41,885, from PR #685).
- Two token systems confirmed: `tokens.css` (system A, canonical, 7 dark blocks) +
  `design-system.css` (system B, `--gtl-*`, dark-blind). 11/12 content pages ship both plus a
  `-redesign.css`; **`tracker.html` is on neither** (Phase 16 pivot).
- Dead file `styles/pages/tracker-pro-v4.css` (491 lines) confirmed unreferenced → Phase 2.
- **Plan drift corrected:** emoji now 0/0 (not 5); an icon sprite system already exists → re-scope
  Phase 24.

**Method:** deterministic shell/Node measurement over the working tree; static selector-coverage via
`scratchpad/css-coverage.mjs` (kept out of the repo — Phase 1 is audit-only; recommend committing it
as `scripts/design/css-coverage.mjs` in Phase 2 when it drives the real quarantine).

**Deferred sub-task (carried to a follow-up):** the "before" 8-shot screenshot grid (EN/AR ×
light/dark × mobile/desktop) for `index.html` + `tracker.html`. The capture procedure is documented
in `CSS_INVENTORY.md` §10 (Vite dev server + Playwright; locale via `?lang=ar`, theme via
`data-theme`). Deprioritized this session in favour of the verifiable inventory + baseline that all
later phases depend on. Recommend capturing it before Phase 2 opens (Phase 2's "zero visual diff"
gate needs a before-set).

**Gates:** `npm test` ✅ 1656/1656. `npm run validate`/`build` not run — no product code changed, so
there is nothing for them to gate this phase.

---

## Session note (2026-07-12)

Also merged the five open PRs #681–#685 (a11y / i18n / RTL / prettier) at the owner's request — all
CI-green and mergeable, squash-merged oldest-first into `main`. Open-PR queue is now empty. This is
unrelated to the revamp phases and is logged here only for continuity.
