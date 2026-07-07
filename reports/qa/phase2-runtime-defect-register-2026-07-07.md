# Phase 2 — Runtime error audit & defect register (register only)

**Scope:** `compare.html`, `heatmap.html`, `portfolio.html`, `tracker.html`, `calculator.html`, each
in EN (default) and AR (`?lang=ar`). **This phase does not fix anything** — it records what a later
phase must address. Method: (1) the Phase 1 Playwright console capture
(`reports/qa/console-baseline-2026-07-07.json`), (2) a static runtime-risk scan of the page entry
modules, (3) cross-reference with the live-site audit `docs/revamp/00-AUDIT.md`.

## 1. Runtime console / exception result

| Page            | EN console.error | AR console.error | pageerror (uncaught) |
| --------------- | ---------------: | ---------------: | -------------------: |
| calculator.html |                0 |                0 |                    0 |
| compare.html    |                0 |                0 |                    0 |
| heatmap.html    |                0 |                0 |                    0 |
| portfolio.html  |                0 |                0 |                    0 |
| tracker.html    |                0 |                0 |                    0 |

**All five pages: zero uncaught exceptions and zero console errors** in the deploy-staged build (see
Phase 1 caveat: outbound egress is blocked in this sandbox, so the live gold/FX/Supabase fetches
fail — but the app absorbs those via its fallback chain and the global `unhandledrejection` reporter
(`src/lib/error-reporter.js`), producing no console error and no crash. That graceful degradation is
correct behaviour, not a defect).

## 2. Static runtime-risk scan (code-level)

| Check                                    | Result                                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `setInterval` / `clearInterval` pairing  | ✅ balanced on all 5 pages (calc 2/2, heatmap 2/2, portfolio 2/2, compare 2/2, tracker 2/3)                   |
| `visibilitychange` / `pagehide` teardown | ✅ present on all 5 pages (pauses/cleans timers off-screen)                                                   |
| Promise `.then` without `.catch`         | ✅ none — every `.then` chain has a `.catch`, and unhandled rejections are backstopped by the global reporter |
| `alert()` / `confirm()` in these pages   | ✅ none                                                                                                       |
| DOM sinks (`innerHTML`)                  | ✅ 0 baseline (enforced by `npm run validate` `check-unsafe-dom`)                                             |

No new **code-level** runtime defect found in the five pages. Interval/promise hygiene is clean.

## 3. Candidate defects carried forward (need a live feed to reproduce — NOT fixed here)

These come from `docs/revamp/00-AUDIT.md` (observed on the live site with a real price feed) and
cannot be reproduced in this no-egress sandbox. Logged here so the owning phase closes them:

| ID   | Page                           | Symptom (from live audit)                                                                                                                                                            | Severity       | Owning phase                                                                       |
| ---- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------- | ---------------------------------------------------------------------------------- |
| R-01 | calculator (+ shared spot bar) | A ~9-min-old price still labelled **"Live"** (12-min stale window is too generous)                                                                                                   | high (trust)   | **Phase 6** (freshness policy)                                                     |
| R-02 | calculator                     | Mixed-direction bidi glitch: `AED 435.37 د.إ per gram` renders the currency glyph out of order                                                                                       | medium (i18n)  | **Phase 20** (RTL/bidi)                                                            |
| R-03 | calculator                     | "Compare in the live tracker" handoff column wraps ~3 words/line with dead space                                                                                                     | low (layout)   | **Phase 23** (calc UX) — reconcile with PR #535 which already touched calc density |
| R-04 | tracker                        | Ensure the SVG chart's last value and the hero spot value never disagree (homepage had a TradingView-vs-spot mismatch, P1-2; verify tracker's own chart is fed from the same series) | medium (trust) | **Phase 22** (tracker integrity)                                                   |
| R-05 | heatmap                        | Legend/keyboard/table-fallback clarity (not an error; polish)                                                                                                                        | low            | **Phase 25**                                                                       |
| R-06 | portfolio                      | Confirm honest-gain rules never total cross-currency or partial-cost-basis holdings                                                                                                  | high (trust)   | **Phase 26** (preserve rules + tests)                                              |

### Related (outside the 5 pages, noted for their owning phases)

- Homepage quick-convert blank on first paint (P1-5) → Phase 21. Homepage two-prices (P1-2) →
  Phase 21. Nav overlap at tablet widths (P1-3) → Phase 18/21. Muted-text contrast < AA (P1-4) →
  Phase 19. `favicon.svg` 404 (P2-1) → Phase 9.

## 4. Verdict

Runtime layer is **healthy** — no uncaught errors, clean timer/promise teardown across all five
tools. The real risks are **trust-label and i18n** issues (R-01, R-02, R-04, R-06) that require a
live feed to observe; each is assigned to its Track B/E/F owning phase. No fixes applied in Phase 2.
