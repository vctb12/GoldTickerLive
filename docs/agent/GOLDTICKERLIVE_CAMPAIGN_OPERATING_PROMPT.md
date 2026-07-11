# GoldTickerLive — Campaign Operating Prompt (internal super-prompt)

**Updated:** 2026-07-11 (post-audit synthesis) · **Role:** the standing execution charter for the
multi-agent premium-product campaign. A fresh session reads THIS + `GOLDTICKERLIVE_REVAMP_STATE.md`
and starts working — no re-audit, no re-discovery.

## Prime directive

Turn an already-mature bilingual financial-reference product into a stronger market-data experience
through **small, verified, file-disjoint slices**, each shipped as a cohesive PR. Trust > polish >
features. Never fake data, never soften freshness honesty, never touch the pricing invariants (peg
3.6725, troy 31.1034768, karat factors, spot≠retail), never weaken the Tracker engine, never push to
main.

## Operating loop (per slice)

1. Take the top item from the Verified Work Queue below (or a newly confirmed defect).
2. Re-verify the defect yourself on current `origin/main` (reproduce ×2) — audits go stale.
3. Fresh worktree + branch from `origin/main`; one owner per branch; never share files across
   in-flight branches (check open PRs for collisions first).
4. Smallest correct fix + regression test (no arbitrary sleeps; wait on real state).
5. Gates: `lint` · `stylelint` · `validate` · `test` · `build` + browser verify (built dist,
   chromium at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`), EN **and** AR, 390px where
   layout is touched. Playwright specs: run `--repeat-each=2`.
6. Adversarial review for any trust/i18n/pricing-adjacent change; fix CONFIRMED findings.
7. PR with What/Why/Proof/Risks (exact numbers, before/after evidence). Do not merge.

## Verified Work Queue (from the 2026-07-11 specialist audits A–D; E/F/G pending)

| #   | Item                                                                                                                                                                            | Evidence anchor        | Status                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | ------------------------------------------------- |
| 1   | Chart a11y summary + locale + lifecycle                                                                                                                                         | audit A / first-hand   | ✅ PR #672                                        |
| 2   | Tracker karat-ladder mobile clip (overflow+grid blowout)                                                                                                                        | audit B, reproduced ×2 | ✅ PR #673                                        |
| 3   | X follow banner restore (hidden by home-redesign.css rule)                                                                                                                      | owner request          | ✅ PR #674                                        |
| 4   | Heatmap RTL tooltip misposition (`heatmap.js:513/526` physical-left → inset-inline-start)                                                                                       | audit A                | 🔧 in-flight (fix/heatmap-rtl-tooltip)            |
| 5   | Portfolio "Add costs to see this" shown for 3 unrelated null-gain causes                                                                                                        | audit D                | 🔧 in-flight (fix/portfolio-cost-basis-messaging) |
| 6   | Tracker SVG fallback chart theme-blind (hex palette in `tracker/chart.js:182-319`) + GoldChart light-tokens on always-dark panel → shared container-scoped `chart-theme` reader | audit A                | queued                                            |
| 7   | Tracker SVG tooltip mouse-only → pointermove (touch)                                                                                                                            | audit A                | queued                                            |
| 8   | `svgEl` ×3 + sparkline ×2 duplication → `src/lib/svg-el.js` + shared sparkline                                                                                                  | audit A                | queued                                            |
| 9   | Shared `.ds-table` primitive has 1 adopter; 9 bespoke table CSS families; shops-compare modal table semantics broken; numeric-alignment inconsistencies                         | audit B                | queued (= table workstream opener)                |
| 10  | Portfolio boot ignores cached spot ("Waiting for live prices…" while ticker shows cached)                                                                                       | audit D                | queued                                            |
| 11  | Restore-JSON silently replaces holdings (needs confirm)                                                                                                                         | audit D                | queued                                            |
| 12  | Portfolio allocation/concentration display (data model already supports)                                                                                                        | audit D                | queued                                            |
| 13  | `_showFallback` hardcoded strings → translations.js; unify no-data SR/visible copy                                                                                              | WS1 review             | queued                                            |
| 14  | ~~E/F/G audits~~ — completed on resume (2026-07-11); findings folded into items below                                                                                           | done                   | ✅                                                |
| 15  | Tracker a11y touch-ups: SVG tooltip mouse-only → pointermove; skip-link `#main-content` vs tracker `<main id="tracker-app">`                                                    | audits A+E             | 🔧 in-flight (fix/tracker-a11y-touchups)          |
| 16  | SR live-region spam: countUp writes textContent per animation frame inside aria-live karat table; countdown announces every second; hero rewrites unchanged text                | audit E (high)         | queued                                            |
| 17  | RTL bidi reordering of signed deltas: "+12.3%" renders "12.3%+" in Arabic; needs bidi isolation in the shared delta formatter                                                   | audit E (high)         | queued                                            |
| 18  | `.edu-table-wrap` scrollable regions not keyboard-focusable (axe serious ×20 on compare/portfolio/heatmap) — add tabindex=0 + role/label to the shared pattern                  | audit E (high)         | queued                                            |
| 19  | Perf: full AR dictionary (27.7 KB gz ≈ 87% of utils chunk) ships eagerly on every route — split per-locale; learn.html ships article corpus eagerly (125.6 KB gz route)         | audit F (high)         | queued (bundle-split slice; needs care)           |
| 20  | Hidden tracker tab polls every 5 s (faster than visible static cadence); homepage 90 s refresh lacks visibility guard                                                           | audit F (medium)       | queued                                            |
| 21  | Wire existing deterministic `buildMarketAnalysis()` (tested, bilingual, LLM-free) into market page as "Today's movement, described" panel — zero new infra                      | audit G (high)         | queued (best first "AI-adjacent" feature)         |
| 22  | AR jump-to-chart arrow wrongly mirrored ('←' for scroll-down); market.html disclaimer English-only in AR without lang attr                                                      | audit E (medium)       | queued                                            |
| 23  | Any LLM feature = owner-gated new infra (GitHub Pages static; API_BACKEND_ENABLED:false; Express server undeployed; Supabase = only realistic serverless path)                  | audit G (critical)     | Owner-Gated Decision Queue                        |

Tracker/Compare UX audit (C) returned but was flagged for careful verification (safety classifier
unavailable) — treat its findings as UNVERIFIED leads; re-verify before acting.

## Multi-agent rules (unchanged, compressed)

One coordinator owns queue/branches/PRs. Implementation agents get: one worktree, an explicit
file-ownership list, the defect evidence, the gates to run, commit-but-never-push, and a JSON-only
result contract. Read-only audits fan out in parallel; implementers only on file-disjoint scopes.
Verify agent claims by reproduction before shipping their work.

## Standing environment facts (save the rediscovery)

- `ci.yml` produces **no PR check-runs** (runs on push/schedule to main + dispatch; dispatch is 403
  for the GitHub App). `agent-ci.yml` (lint/test/build) runs on push to `cowork/**`, `claude/**`,
  `agent/**` only. Real per-PR CI evidence = push a `claude/…-ci-mirror` ref.
- Plain `npm run build` omits deploy-only statics (`assets/`, `data/`, `src/`, `styles/`, `sw.js`) —
  local 404s for those are environment artifacts. `public/sitemap.xml` is regenerated by builds:
  always `git checkout --` it, never commit it.
- Offline sandbox: external APIs unreachable → the product's honest degraded states show; not bugs.
- Home chart doesn't mount in headless (pre-existing, identical on baseline) — verify chart work on
  the tracker path.
- The canonical tracker `docs/AGENT_MASTER_TRACKER.md` is maintained on its own branch; PRs link to
  it, don't edit it.
