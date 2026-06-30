# Revamp progress tracker

> Living record. One phase = its own branch (`phaseNN-slug`) + PR(s). Updated as work lands.

## Coordination & docs

| PR   | What                                                                  | Status  |
| ---- | --------------------------------------------------------------------- | ------- |
| #469 | Planning pack: audit + 50 phase prompts + this tracker + Cowork brief | 🟢 open |
| #470 | Phase 00 — `docs/REPO-MAP.md`                                         | 🟢 open |

## Fix PRs shipped this session

| PR   | Maps to  | What                                                | Verified locally                       | Status  |
| ---- | -------- | --------------------------------------------------- | -------------------------------------- | ------- |
| #471 | Phase 27 | Unique location-guide checklist headings (a11y/SEO) | eslint + validate; 0 new test fails    | 🟢 open |
| #472 | hotfix   | `offline.html` root-absolute asset paths            | fallback guard passes; suite 3→2 fails | 🟢 open |
| #473 | hotfix   | nav single banner landmark + NAV_DATA skip-link     | nav a11y guards pass; validate         | 🟢 open |

> **#472 + #473 restore a green `main`** — the suite was red on 3 pre-existing tests (`offline`
> asset paths, nav banner, nav skip-link) before this session.

## Audit re-verification (vs current code, 2026-06-30)

The repo was actively improved around the audit, so several flagged items were **already fixed** —
verified before writing any PR, to avoid no-op churn.

| Audit item                            | Verdict                                       | Action                                 |
| ------------------------------------- | --------------------------------------------- | -------------------------------------- |
| Homepage chart vs spot-card mismatch  | ✅ FIXED (unified source)                     | none                                   |
| Muted-text contrast (light mode)      | ✅ FIXED (`#6a5c48` ≈ 6.27:1)                 | none                                   |
| "Live" label on stale data            | ✅ FIXED (`<2min` + STALE_LIVE guard)         | none                                   |
| Canonical `/calculator.html`          | ✅ NOT A BUG (consistent w/ sitemap + og:url) | none                                   |
| favicon 404                           | ✅ FIXED (assets present)                     | none                                   |
| Repeated checklist headings           | 🔧 OPEN → **#471**                            | shipped                                |
| offline fallback asset paths          | 🔧 OPEN → **#472**                            | shipped                                |
| nav banner / skip-link guards         | 🔧 OPEN → **#473**                            | shipped                                |
| Quick-convert blank reference value   | 🔧 OPEN                                       | queued (Phase 18)                      |
| JS chunk consolidation                | 🟡 PARTIAL                                    | queued (Phase 37)                      |
| Nav overlap breakpoint ~768–1240px    | 🔧 OPEN                                       | queued (Phase 23, needs visual check)  |
| Arabic `/ar/` indexability + hreflang | 🟡 PARTIAL                                    | queued (Phase 06–14 — biggest SEO win) |
| Freshness numerals / bidi consistency | 🟡 PARTIAL                                    | queued (Phase 17/26)                   |
| Methodology internal-path copy        | ➖ editorial                                  | optional (Phase 20)                    |

## Next up

1. **Phase 18** — quick-convert: seed reference value from cached price (never blank).
2. **Phase 37** — Vite `manualChunks` consolidation (fewer homepage chunks).
3. **Phase 23** — nav-overlap breakpoint (verify visually before shipping).
4. **Phase 06–14** — Arabic `/ar/` real indexable pages + reciprocal hreflang (replace `?lang=ar`).

## Full phase list

| #   | Phase    | PR   | Status                   |
| --- | -------- | ---- | ------------------------ |
| 00  | Phase 00 | #470 | 🟢 PR                    |
| 01  | Phase 01 |      | ⬜ todo                  |
| 02  | Phase 02 |      | ⬜ todo                  |
| 03  | Phase 03 |      | ⬜ todo                  |
| 04  | Phase 04 |      | ⬜ todo                  |
| 05  | Phase 05 |      | ⬜ todo                  |
| 06  | Phase 06 |      | ⏭️ queued                |
| 07  | Phase 07 |      | ⏭️ queued                |
| 08  | Phase 08 |      | ⏭️ queued                |
| 09  | Phase 09 |      | ⏭️ queued                |
| 10  | Phase 10 |      | ⬜ todo                  |
| 11  | Phase 11 |      | ⬜ todo                  |
| 12  | Phase 12 |      | ⬜ todo                  |
| 13  | Phase 13 |      | ⏭️ queued                |
| 14  | Phase 14 |      | ⏭️ queued                |
| 15  | Phase 15 |      | ⬜ todo                  |
| 16  | Phase 16 |      | ⬜ todo                  |
| 17  | Phase 17 |      | ⏭️ queued                |
| 18  | Phase 18 |      | ⏭️ next                  |
| 19  | Phase 19 |      | ⬜ todo                  |
| 20  | Phase 20 |      | ➖ editorial/optional    |
| 21  | Phase 21 |      | ⬜ todo                  |
| 22  | Phase 22 |      | ⬜ todo                  |
| 23  | Phase 23 |      | ⏭️ queued (needs visual) |
| 24  | Phase 24 |      | ⬜ todo                  |
| 25  | Phase 25 |      | ⬜ todo                  |
| 26  | Phase 26 |      | ⏭️ queued                |
| 27  | Phase 27 | #471 | 🟢 PR                    |
| 28  | Phase 28 |      | ⬜ todo                  |
| 29  | Phase 29 |      | ⬜ todo                  |
| 30  | Phase 30 |      | ⬜ todo                  |
| 31  | Phase 31 |      | ⬜ todo                  |
| 32  | Phase 32 |      | ⬜ todo                  |
| 33  | Phase 33 |      | ⬜ todo                  |
| 34  | Phase 34 |      | ⬜ todo                  |
| 35  | Phase 35 |      | ⬜ todo                  |
| 36  | Phase 36 |      | ⬜ todo                  |
| 37  | Phase 37 |      | ⏭️ queued                |
| 38  | Phase 38 |      | ⬜ todo                  |
| 39  | Phase 39 |      | ⬜ todo                  |
| 40  | Phase 40 |      | ⬜ todo                  |
| 41  | Phase 41 |      | ⬜ todo                  |
| 42  | Phase 42 |      | ⬜ todo                  |
| 43  | Phase 43 |      | ⬜ todo                  |
| 44  | Phase 44 |      | ⬜ todo                  |
| 45  | Phase 45 |      | ⬜ todo                  |
| 46  | Phase 46 |      | ⬜ todo                  |
| 47  | Phase 47 |      | ⬜ todo                  |
| 48  | Phase 48 |      | ⬜ todo                  |
| 49  | Phase 49 |      | ⬜ todo                  |
| 50  | Phase 50 |      | ⬜ todo                  |

**Legend:** ⬜ todo · ⏭️ queued/next · 🟢 PR open · ✅ merged · ➖ optional
