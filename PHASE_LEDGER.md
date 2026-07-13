# Design Revamp — Phase Ledger

Outcome log for the 30-phase design revamp (`docs/plans/2026-07-12_design-revamp-30-phases.md`). One
row per phase; append on completion.

| Phase                                 | Risk |               Status               | Date       | HEAD       | Outcome                                                                                                                                                                                                                             |
| ------------------------------------- | :--: | :--------------------------------: | ---------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1 — Design inventory & baseline**   |  🟢  | ✅ **done** (screenshots deferred) | 2026-07-12 | `4b299c4`  | Built `docs/design/CSS_INVENTORY.md`; re-established the real test baseline; committed the plan. No product CSS/JS touched.                                                                                                         |
| **2 — Quarantine dead CSS**           |  🟢  |            ✅ **done**             | 2026-07-13 | `02ee909`+ | Moved 388 confirmed-dead rules → `styles/_graveyard/` (reversible). Shipped CSS 41,887 → 39,336 (−2,551, ~6.1%). Corrected the plan's false "tracker-pro-v4 is dead" premise. All gates green.                                      |
| **3 — Unified token contract**        |  🟢  |            ✅ **done**             | 2026-07-13 | `db208fb`+ | Wrote `docs/design/TOKENS.md`: all 45 `--gtl-*` mapped to one canonical entry (13 alias-drop, 17 exact, 6 add-in-P4, 9 harmonize-at-P7). Every target verified to exist. Spec only, no CSS changed.                                 |
| **4 — Land primitives in tokens.css** |  🟡  |            ✅ **done**             | 2026-07-13 | `e214b11`+ | Added the 6 canonical tokens (`--space-11`, `--text-price-hero`, `--text-display-1/2`, `--measure`, `--ease-tick`). Additive only — 0 consumers, `--gtl-*` still resolves, zero visual diff. build/test 1656/validate/stylelint ✅. |

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

## Phase 2 — details

**Delivered** (see `docs/design/DEAD_CSS_QUARANTINE.md` for the full write-up)

- **388 confirmed-dead CSS rules** relocated from 13 stylesheets → `styles/_graveyard/` (imported by
  nothing → ships zero bytes; reversible; delete after one release cycle).
- Shipped CSS **41,887 → 39,336 lines (−2,551, ~6.1%)**; ~1,616 of those come off the shared base
  that `@import`s on **every** page (`components` −1,059, `utilities` −420, `skeleton` −58, …).
- Reusable tooling committed: `scripts/design/css-coverage.mjs` (coverage) +
  `scripts/design/css-quarantine.mjs` (mover).

**Two-method verification** (both required before any move)

- Deterministic coverage over source HTML/JS **+ built `dist/` HTML** (the dist pass rescued 13
  rules that only looked dead in source).
- 13-agent adversarial workflow (one per file) that tried to refute each rule's deadness: **388
  candidates → 388 CONFIRM_DEAD, 0 KEEP**, with per-rule evidence.

**Safety proof**

- Normalized rule-set diff: **0 live rules changed** — only the 388 dead rules left each file.
- Gates: `npm run build` ✅ · `npm test` **1656/1656** ✅ · `npm run validate` ✅ · `stylelint` ✅
  (source + graveyard).

**Correction to the plan / Phase 1:** `styles/pages/tracker-pro-v4.css` is **LIVE** (`@import`-ed at
`tracker-pro.css:5`), not the dead file the plan said to delete. Not deleted.

**Deferred (unchanged from Phase 1):** the "before" screenshot grid — Phase 2 moved only rules that
match zero elements, so there is no visual delta to diff, but the grid is still owed before the
first 🟡 visual phase.

**Not touched:** 162 "REVIEW" rules (dead classes but with element/attr/id selectors or a mixed
live/dead class — need human judgement), and all `#id` selectors.

---

## Phase 3 — details

**Delivered:** `docs/design/TOKENS.md` — the unified token contract.

- **Decision:** `styles/partials/tokens.css` (the semantic `--*` system) is canonical; `--gtl-*` is
  retired. Namespace unchanged (canonical is the larger, more-consumed vocabulary).
- **Complete mapping — all 45 `--gtl-*` → exactly one canonical entry:** 13 alias-drop (already
  `var(--color-*)`), 17 exact-value renames, 6 add-in-Phase-4 (value-preserving new tokens:
  `--space-11`, `--text-price-hero`, `--text-display-1/2`, `--ease-tick`, `--measure`), 9
  harmonize-at-Phase-7 (near-duplicates, ≤4px/≤20ms deltas, absorbed at surface rebuild).
- **Verified:** every canonical target (all 13 color aliases + every exact/harmonize token)
  confirmed to exist in `tokens.css` with the stated value.
- **Key finding:** 30 of 45 `--gtl-*` are already colour-aliases or exact duplicates, so two-thirds
  of the Phase-5 codemod is a zero-visual-change find-replace — the token merge is lower-risk than
  the plan assumed.

Spec only — no CSS changed this phase.

---

## Phase 4 — details

**Delivered:** added the 6 canonical tokens from the Phase-3 contract to
`styles/partials/tokens.css`: `--space-11` (128px), `--text-price-hero`, `--text-display-1`,
`--text-display-2`, `--measure` (66ch), `--ease-tick`. Values copied verbatim from their `--gtl-*`
originals.

- **Additive only** — nothing consumes the new tokens yet, and `--gtl-*` in `design-system.css` is
  untouched and still resolves. Zero visual change by construction.
- **Gates:** `npm run build` ✅ · `npm test` **1656/1656** ✅ · `npm run validate` ✅ · `stylelint`
  ✅.
- Sets up Phase 5 (codemod the 12 `--gtl-*` consumer files onto canonical names) and Phase 6 (retire
  `design-system.css`).

---

## Session note (2026-07-12)

Also merged the five open PRs #681–#685 (a11y / i18n / RTL / prettier) at the owner's request — all
CI-green and mergeable, squash-merged oldest-first into `main`. Open-PR queue is now empty. This is
unrelated to the revamp phases and is logged here only for continuity.
