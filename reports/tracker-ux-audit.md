# Tracker UX audit — 20-phase redesign

_Phase 1 deliverable for the 20-phase tracker redesign / refactor / debug track
(`docs/REVAMP_PLAN.md` §22b). Supersedes the surface-scoped items in §22b Phase 1 by adding a UX
defect log that drives Phases 5–15._

Snapshot commit: `c2ca144` (HEAD of `copilot/explore-codebase-and-implement-redesign` at audit
time).

## 1. Surface footprint

| File                           | LOC   | Notes                                                                                      |
| ------------------------------ | ----- | ------------------------------------------------------------------------------------------ |
| `tracker.html`                 | 1,312 | 7 modes (`live · compare · archive · alerts · planner · exports · method`) + hero + trust. |
| `src/pages/tracker-pro.js`     | 716   | Orchestrator; lazy-loads render / events / wire / ad-slot.                                 |
| `src/tracker/render.js`        | 1,031 | Biggest `innerHTML` concentration (18 sinks).                                              |
| `src/tracker/state.js`         | 270   | URL-hash contract frozen in `docs/tracker-state.md`.                                       |
| `src/tracker/ui-shell.js`      | 220   | Tab + overlay wiring (target of Phase 7 extraction).                                       |
| `src/tracker/events.js`        | 308   | Trust / welcome-strip / keyboard.                                                          |
| `src/tracker/wire.js`          | 98    | Live headlines belt.                                                                       |
| `styles/pages/tracker-pro.css` | 2,577 | Target of Phase 17 split.                                                                  |

`innerHTML` / `outerHTML` / `insertAdjacentHTML` baseline (verified via
`scripts/node/check-unsafe-dom.js`):

| File                       | Sinks  |
| -------------------------- | :----: |
| `src/tracker/render.js`    |   18   |
| `src/tracker/events.js`    |   2    |
| `src/tracker/wire.js`      |   3    |
| `src/pages/tracker-pro.js` |   4    |
| **Total tracker surface**  | **27** |

Every later phase must **not raise** these counters; reductions are preferred and require tightening
the per-file baseline in `scripts/node/check-unsafe-dom.js`.

## 2. Defects logged (drives Phases 5–15)

Each defect links to the phase that owns it. Severity: 🟥 critical, 🟧 serious, 🟨 polish.

### Hero + trust (Phase 5, Phase 16)

- 🟧 Badge row wraps awkwardly on 320 px widths (overflow-x hidden hides the XAU/USD tail).
- 🟧 `#tp-hero-stats` is built via `el()` but has no loading skeleton; first paint shows an empty
  grid until prices resolve.
- 🟨 Selectors row (language · currency · karat · unit) does not stick on scroll on mobile — users
  lose the unit context when reading the chart.
- 🟨 `#tp-jump-chart` anchors to `#mode-live` but does not set focus on the chart heading; keyboard
  users jump visually without landing on a focusable target.

### Welcome + orientation (Phase 6)

- 🟧 `#tracker-welcome-strip` renders on every first-paint before JS decides whether to hide it
  (FOUC on slow connections).
- 🟨 Chips do not reveal progressively; all three animate in lockstep.

### Mode tabs (Phase 7, Phase 8)

- 🟧 Tab wiring, overlay wiring, keyboard shortcuts, hashchange handling, and workspace-level toggle
  are all co-located in `ui-shell.js`. Extracting a registry makes each mode independently testable
  and unlocks lazy-mount in Phase 19.
- 🟨 `aria-controls` on `#tab-alerts` / `#tab-planner` points at overlay IDs, not mode panels —
  correct today, but the shape differs from other tabs and is confusing.

### Live mode (Phase 9)

- 🟧 No explicit loading skeleton — chart-empty state only shows _after_ a first successful fetch.
- 🟧 Pinch/pan on mobile chart is fiddly; two-finger pan competes with page scroll.
- 🟨 `#tp-chart-stats` numbers do not pulse/flash on refresh, making it unclear whether a value
  actually changed.

### Compare mode (Phase 10)

- 🟧 Results are built via `innerHTML` concatenation — part of the `render.js` 18-sink count.
  Semantic `<table>` via `el()` needed.
- 🟨 Spot vs retail framing isn't explicit per row; users can misread the comparison as retail.

### Archive mode (Phase 11) — **largest single debug target**

- 🟥 Pagination is missing; loading a long range renders every row (LCP regression on mobile).
- 🟥 Sort state is not reflected in the hash → users can't share a sorted view.
- 🟧 Largest `innerHTML` concentration in the tracker; refactor to `el()` must bring `render.js`
  from 18 → ≤ 10 sinks.

### Alerts mode (Phase 12)

- 🟧 No disclaimer that alerts are browser-only — risk of user thinking they're SMS/email.
- 🟨 No `aria-live` on the fire-notification strip.

### Planner mode (Phase 13)

- 🟧 Retail-vs-spot switch is buried; the disclaimer must be re-used from the sitewide §0.2 snippet.
- 🟨 Zakat calculator inputs do not round-trip in the hash.

### Exports mode (Phase 14)

- 🟧 CSV filename does not include ISO timestamp + karat + currency — brittle for repeat exports.
- 🟨 "Copy brief" uses HTML templating; consolidate into a tested generator.

### Method mode (Phase 15)

- 🟨 Method tab is a static block; does not deep-link to `methodology.html` anchors.

## 3. A11y / perf baselines to beat

- Pa11y (mobile): **owed** — Phase 20 defines the "clean" bar.
- Lighthouse (mobile): previous LCP on tracker ≈ 2.8 s on 4G emulation — Phase 19 + Phase 5 must not
  regress.
- DOM-safety baseline: tightened on Phase 11 (archive) and Phase 5 (hero).

## 4. Out of scope (hard guards)

- No chart-lib swap (`docs/plans/README.md` matrix row #11 rejected).
- No URL-hash contract change (frozen in `docs/tracker-state.md`).
- No new backend / Supabase / auth.
- No opportunistic edits outside the tracker surface.
- No new URL paths (matrix row #15 gated).
