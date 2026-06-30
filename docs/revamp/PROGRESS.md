# Revamp progress tracker

> Living record. One phase = its own branch (`phaseNN-slug`) + PR(s). Updated as work lands. See
> also [live QA](qa/live-qa-2026-06-30.md) and the reusable
> [agent workflows](../../.claude/workflows/).

## Coordination & docs

| PR   | What                                                                   | Status  |
| ---- | ---------------------------------------------------------------------- | ------- |
| #469 | Planning pack + tracker + Cowork brief + live-QA + **agent workflows** | 🟢 open |
| #470 | Phase 00 — `docs/REPO-MAP.md`                                          | 🟢 open |

## Fix PRs shipped

| PR   | Maps to  | What                                                | Verified                     | Status  |
| ---- | -------- | --------------------------------------------------- | ---------------------------- | ------- |
| #471 | Phase 27 | Unique location-guide checklist headings (a11y/SEO) | eslint+validate, 0 new fails | 🟢 open |
| #472 | hotfix   | `offline.html` root-absolute asset paths            | fallback guard ✅            | 🟢 open |
| #473 | hotfix   | nav single banner landmark + NAV_DATA skip-link     | nav a11y guards ✅           | 🟢 open |
| #474 | Phase 18 | quick-convert reads live spot (no blank value)      | eslint+validate, 0 new fails | 🟢 open |

> **#472 + #473 restored a green `main`** (was red on 3 pre-existing tests at session start).

## Live QA verdict (2026-06-30)

Most audit items are **already fixed or not reproducible** — verified vs current code + live site
before writing any PR (see [qa/](qa/live-qa-2026-06-30.md)). The **one real open P0 is the Arabic
`/ar/` homepage indexability** (`/ar/` is `noindex` + canonical→EN; homepage
`hreflang=ar`→`?lang=ar`). The `/ar/` sub-pages already work, so the fix is to make the homepage
adopt that pattern.

## Priority / queue

1. **🎯 Phase 06–14 — Arabic `/ar/` homepage indexability** (the one real P0; biggest SEO win).
2. ➖ Optional/low-value: JS chunk consolidation (37), freshness AR numerals (17/26), methodology
   copy (20).
3. ⏸️ Deferred: nav-overlap (23) — not reproducible at testable widths; needs a real <880px device.
4. Brand assets (Higgsfield) — reuse existing 4K renders; fill gaps only.

## Agent workflows (new)

Reusable multi-agent workflows in [`.claude/workflows/`](../../.claude/workflows/):
**`pre-pr-review`** (verify suite + adversarial diff review → go/no-go) and **`audit-reverify`**
(classify findings OPEN/FIXED vs current code). See that folder's README to invoke + enable the
daily PR babysitter routine.

## Full phase list

| #   | Phase    | PR   | Status                         |
| --- | -------- | ---- | ------------------------------ |
| 00  | Phase 00 | #470 | 🟢 PR                          |
| 01  | Phase 01 |      | ⬜ todo                        |
| 02  | Phase 02 |      | ⬜ todo                        |
| 03  | Phase 03 |      | ⬜ todo                        |
| 04  | Phase 04 |      | ⬜ todo                        |
| 05  | Phase 05 |      | ⬜ todo                        |
| 06  | Phase 06 |      | 🎯 priority                    |
| 07  | Phase 07 |      | 🎯 priority                    |
| 08  | Phase 08 |      | 🎯 priority                    |
| 09  | Phase 09 |      | 🎯 priority                    |
| 10  | Phase 10 |      | ⬜ todo                        |
| 11  | Phase 11 |      | ⬜ todo                        |
| 12  | Phase 12 |      | ⬜ todo                        |
| 13  | Phase 13 |      | 🎯 priority                    |
| 14  | Phase 14 |      | 🎯 priority                    |
| 15  | Phase 15 |      | ⬜ todo                        |
| 16  | Phase 16 |      | ⬜ todo                        |
| 17  | Phase 17 |      | ➖ optional                    |
| 18  | Phase 18 | #474 | 🟢 PR                          |
| 19  | Phase 19 |      | ⬜ todo                        |
| 20  | Phase 20 |      | ➖ editorial                   |
| 21  | Phase 21 |      | ⬜ todo                        |
| 22  | Phase 22 |      | ⬜ todo                        |
| 23  | Phase 23 |      | ⏸️ deferred (not reproducible) |
| 24  | Phase 24 |      | ⬜ todo                        |
| 25  | Phase 25 |      | ⬜ todo                        |
| 26  | Phase 26 |      | ➖ optional                    |
| 27  | Phase 27 | #471 | 🟢 PR                          |
| 28  | Phase 28 |      | ⬜ todo                        |
| 29  | Phase 29 |      | ⬜ todo                        |
| 30  | Phase 30 |      | ⬜ todo                        |
| 31  | Phase 31 |      | ⬜ todo                        |
| 32  | Phase 32 |      | ⬜ todo                        |
| 33  | Phase 33 |      | ⬜ todo                        |
| 34  | Phase 34 |      | ⬜ todo                        |
| 35  | Phase 35 |      | ⬜ todo                        |
| 36  | Phase 36 |      | ⬜ todo                        |
| 37  | Phase 37 |      | ➖ optional (perf, subjective) |
| 38  | Phase 38 |      | ⬜ todo                        |
| 39  | Phase 39 |      | ⬜ todo                        |
| 40  | Phase 40 |      | ⬜ todo                        |
| 41  | Phase 41 |      | ⬜ todo                        |
| 42  | Phase 42 |      | ⬜ todo                        |
| 43  | Phase 43 |      | ⬜ todo                        |
| 44  | Phase 44 |      | ⬜ todo                        |
| 45  | Phase 45 |      | ⬜ todo                        |
| 46  | Phase 46 |      | ⬜ todo                        |
| 47  | Phase 47 |      | ⬜ todo                        |
| 48  | Phase 48 |      | ⬜ todo                        |
| 49  | Phase 49 |      | ⬜ todo                        |
| 50  | Phase 50 |      | ⬜ todo                        |

**Legend:** ⬜ todo · 🎯 priority · 🟢 PR open · ✅ merged · ⏸️ deferred · ➖ optional
