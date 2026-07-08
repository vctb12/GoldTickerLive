# Phase 30 — Regression, rollout & observability (Track H · Green)

Capstone of the 30-phase revamp. Consolidates the verification story into a single regression gate,
inventories the QA harnesses built across the program, documents the observability posture (with
recommend-only notes for owner-gated pieces), and lays out a rollout + rollback checklist.

## Single-command regression gate — `npm run qa:regression`

`npm run qa:regression` = `build` → `validate` → `test` → `lint`, in one command. This is the
on-`main` gate every phase already passed individually; it now runs as one step for release
sign-off.

Verified this phase: **green end-to-end** — build ✓, validate ✓ (23 checks incl. the Phase-28
content-lint), test ✓ (1286 tests / 0 fail), lint ✓.

## QA harness inventory (built across the revamp)

Every harness is offline and **$0** (no hosted service), CodeQL-safe (in-memory-Map file server
where a local server is needed), and lands with its phase PR. After the PRs merge, the per-surface
harnesses can be folded into `qa:regression` or a scheduled CI job.

| Harness           | Command                                              | Purpose                                                                        | Lands in      |
| ----------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------ | ------------- |
| Console baseline  | `node scripts/qa/capture-console-baseline.mjs`       | Runtime console-error capture across pages                                     | PR #537 (P1)  |
| Core Web Vitals   | `npm run perf`                                       | Offline CWV + budget check per page                                            | PR #551 (P14) |
| axe a11y          | `node scripts/qa/a11y-axe.mjs`                       | WCAG 2.0/2.1 A+AA across 10 pages × {light,dark}                               | PR #556 (P19) |
| Homepage visual   | `node scripts/qa/home-visual-baseline.mjs [--check]` | Structural + rendered-height signature, 3 viewports × 2 themes                 | PR #558 (P21) |
| Content lint      | `npm run content-lint` (wired into `validate`)       | Placeholders, doubled words, bilingual balance, broken anchors, empty headings | PR #565 (P28) |
| Growth-flag guard | `node --test tests/growth-experiments.test.js`       | All growth experiments stay OFF / $0                                           | PR #566 (P29) |
| Bilingual parity  | `npm run i18n:parity-scan`                           | EN↔AR identical-string / leaked-key scan                                       | on `main`     |

## Program summary — 30 phases, 30 PRs (none merged)

All work shipped as independent PRs off `main`, each gated on `build + validate + test + lint`. A
running record is in `docs/AGENT_MASTER_TRACKER.md` (its own branch). Highlights of **verified live
bug fixes** (not just polish):

- **P5 #542** — compare/heatmap Arabic trust-note parity fix.
- **P6 #543** — shops spot-bar vs. ticker freshness mismatch fixed + verified.
- **P20 #557** — inverted Arabic tracker pagination arrows.
- **P24 #561** — compare table off-by-one colspan (visible on every initial load), verified by
  headless column-count.
- **P26 #563** — portfolio add/edit `<dialog>` had no accessible name, verified headless.
- **P27 #564** — shops "Verified details" filter renamed (it filtered contact info, not vetting) and
  the constant "Details confidence: 50%" gated off — data-honesty fixes.

Design decisions worth carrying forward: token consolidation proved only 1 theme-invariant hex among
478 (mass-replace would break dark mode); the `js/path-injection`-safe in-memory-Map server pattern
is reused by every harness; the recurring **mismatched `var(--token, literal)` fallback** pattern
was fixed per-surface and a codebase-wide audit registered (P25).

## Observability posture

**Client-side (in scope, shipped):** structured `analytics.js` events (inventory enforced by
`export-analytics-inventory.js --check` in `validate`); freshness labelling (Live/Delayed/Cached/
Stale/Fallback/Closed/Unavailable) surfaced on every price surface from one shared engine; the
console baseline harness for runtime-error capture.

**Owner-gated (audit / recommend only — not modified):**

- **`gold-price-fetch.yml`** — hourly writes `data/gold_price.json` and appends observability logs.
  Recommendation: keep the existing provider-failure logging; consider a lightweight staleness alert
  if the committed JSON's `updatedAt` ages beyond the stale threshold (75 min) for N consecutive
  runs. No change made.
- **`post_gold.yml`** — the production-critical @GoldTickerLive hourly X automation. Explicitly out
  of scope; untouched.
- **`sw.js`** — service worker. Per P16, best-practice recommendations were recorded
  (recommend-only); the SW precache is already validated by `check-sw-precache.js --fail-on-error`
  in `validate`.

## Rollout checklist

1. **Merge order** — phase PRs are independent (each off `main`, touching disjoint files), so they
   can merge in any order. The few that share a file (`translations.js`: P20, P27; `home.js`: P21)
   will need a trivial rebase if merged out of order — `qa:regression` catches any conflict fallout.
2. **Per-PR gate** — each PR already passes CI (Build + audit links, CodeQL, Playwright, Lighthouse,
   Readiness gate). Re-run `npm run qa:regression` on the merge commit.
3. **Post-merge** — fold the per-surface harnesses (axe, perf, visual) into a scheduled QA job; run
   `home-visual-baseline.mjs --check` and `a11y-axe.mjs` against the deployed build.
4. **Rollback** — the P1 baseline fences (PR #537) capture the pre-revamp state; any single PR is
   revertible in isolation because the changes are file-disjoint. No data migrations, no schema
   changes, no owner-gated mutations were made, so rollback is a git revert with no external
   cleanup.
5. **Invariants re-checked** — AED peg `3.6725`, troy-oz `31.1034768g`, every price surface labelled
   a spot-linked reference estimate, and the hourly X automation all remain untouched across the
   program.

## Registered follow-ups (carried out of the 30-phase program)

Colour-contrast token remediation (P19/P24, both themes); codebase `var()` fallback hygiene (P25);
shops Near-Me + resource-chip i18n and keyboard-operable cards (P27); the learn affiliate-disclosure
honesty decision (P28, owner); html2canvas CDN → bundled dynamic import (P23). Each is documented in
its phase report under `reports/`.

## Gate

`npm run qa:regression` — green (build + validate + test 1286 pass + lint).
