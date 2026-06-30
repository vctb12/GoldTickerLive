# Tracker Architecture Audit — 2026-06-26

**Scope:** `src/tracker/*.js` (21 files) + `src/pages/tracker-pro.js` **Author:** Claude (read-only
audit — no source files modified) **Basis:** Static reading of all modules; grep for inline karat
factors, literal strings, and duplicate helpers.

---

## 1. Module Inventory & Dependency Graph

### `src/tracker/_ctx.js` — Shared render context

| Attribute          | Detail                                                                                                                                                                                                            |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Exports**        | `_state`, `_el`, `_priceFor`, `_currentSpot`, `_showToast` (mutable refs); `_setCtx()`, `tx()`, `formatUsd()`, `formatPercent()`, `formatUnitLabel()`, `classifyDelta()`, `DIRECTION_GLYPH`, `DELTA_FLAT_EPSILON` |
| **Consumed by**    | Almost every tracker module — see column "imports from `_ctx.js`" below                                                                                                                                           |
| **Recommendation** | **Keep.** Single context bus; well-designed.                                                                                                                                                                      |

### `src/tracker/state.js` — State management & URL serialisation

| Attribute          | Detail                                                                                                                                                           |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Exports**        | `STORAGE_KEYS`, `VALID_MODES`, `VALID_PANELS`, `DEFAULT_STATE`, `createInitialState()`, `persistState()`, `syncUrlFromState()`, `applyUrlState()`, `parseHash()` |
| **Consumed by**    | `tracker-pro.js`, `modes.js`, `ui-shell.js`, `markets.js`, `events.js`                                                                                           |
| **Recommendation** | **Keep.** Canonical state layer.                                                                                                                                 |

### `src/tracker/modes.js` — Tab/panel registry

| Attribute          | Detail                                                                                                                 |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| **Exports**        | `TRACKER_TABS`, `TRACKER_MODES`, `TRACKER_PANELS`, `getTrackerTab()`, `getShortcutMap()`, `assertRegistryInvariants()` |
| **Consumed by**    | `ui-shell.js`; also tested by `tests/tracker-modes.test.js`                                                            |
| **Recommendation** | **Keep.** Clean single-source-of-truth for mode/panel IDs.                                                             |

### `src/tracker/freshness.js` — Live freshness models & badges

| Attribute          | Detail                                                                                                                                   |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Exports**        | `TRACKER_BADGE_CLASSES`, `SOURCE_BADGE_CLASS`, `STATUS_BADGE_CLASS`, `getFreshnessModel()`, `applyStatusBadge()`, `buildSourceBadge()`   |
| **Consumed by**    | `render.js` (re-exports all), `hero.js`, `alerts.js`, `compare.js`, `export.js`, `markets.js`, `watchlist.js`, `decision.js`, `chart.js` |
| **Recommendation** | **Keep.** Central freshness engine used everywhere.                                                                                      |

### `src/tracker/ui-shell.js` — Shell mount, tabs, overlays, keyboard shortcuts

| Attribute          | Detail                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| **Exports**        | `mountShell()`, `updateShellTickerFromState()`                                                   |
| **Consumed by**    | `render.js` (imports `updateShellTickerFromState`); `tracker-pro.js` (lazy-imports `mountShell`) |
| **Recommendation** | **Keep.** Well-bounded; handles all shell/overlay wiring.                                        |

### `src/tracker/render.js` — Render orchestrator + re-export barrel

| Attribute          | Detail                                                                                                                                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Exports**        | `initRender()`, `renderAll()`, `renderQuickCalculator()` — plus re-exports from `freshness.js`, `chart.js`, `hero.js`, `alerts.js`, `watchlist.js`, `compare.js`, `markets.js`, `decision.js`, `archive.js`, `planner.js` (see file lines 18-29) |
| **Consumed by**    | `tracker-pro.js` (lazy-imports most render functions via the barrel)                                                                                                                                                                             |
| **Recommendation** | **Keep.** Acts as the aggregation barrel that lazy-load in `tracker-pro.js` pulls from.                                                                                                                                                          |

### `src/tracker/hero.js` — Hero price panel, karat table, mini strip

| Attribute          | Detail                                                                                        |
| ------------------ | --------------------------------------------------------------------------------------------- |
| **Exports**        | `renderHero()`, `renderKaratTable()`, `renderMiniStrip()`                                     |
| **Consumed by**    | `render.js`                                                                                   |
| **Recommendation** | **Keep.** Complex but self-contained; handles skeleton states, countUp, and day-open changes. |

### `src/tracker/chart.js` — Historical chart rendering

| Attribute          | Detail                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| **Exports**        | `deriveLiveRowFreshness()`, `getVisibleHistoryRows()`, `getSelectedRangeLabel()`, `renderChart()` |
| **Consumed by**    | `render.js`, `decision.js`; `tracker-pro.js` imports `deriveLiveRowFreshness` directly            |
| **Recommendation** | **Keep.** SVG chart is complex and well-isolated.                                                 |

### `src/tracker/decision.js` — "Decision cues" and brief panels

| Attribute          | Detail                                  |
| ------------------ | --------------------------------------- |
| **Exports**        | `renderDecisionCues()`, `renderBrief()` |
| **Consumed by**    | `render.js`                             |
| **Recommendation** | **Keep.**                               |

### `src/tracker/alerts.js` — Alert list rendering

| Attribute          | Detail                                    |
| ------------------ | ----------------------------------------- |
| **Exports**        | `renderAlerts()`, `renderAlertsSummary()` |
| **Consumed by**    | `render.js`                               |
| **Recommendation** | **Keep.**                                 |

### `src/tracker/compare.js` — Comparison workspace cards

| Attribute          | Detail                        |
| ------------------ | ----------------------------- |
| **Exports**        | `renderComparisonWorkspace()` |
| **Consumed by**    | `render.js`                   |
| **Recommendation** | **Keep.**                     |

### `src/tracker/markets.js` — Market board (country price cards)

| Attribute          | Detail                                                                                                               |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| **Exports**        | `renderMarkets()`                                                                                                    |
| **Consumed by**    | `render.js`, `events.js` (calls via callback); markets also calls `renderWatchlist()` internally on favourite toggle |
| **Recommendation** | **Keep.**                                                                                                            |

### `src/tracker/watchlist.js` — Favourite currencies grid

| Attribute          | Detail                    |
| ------------------ | ------------------------- |
| **Exports**        | `renderWatchlist()`       |
| **Consumed by**    | `render.js`, `markets.js` |
| **Recommendation** | **Keep.**                 |

### `src/tracker/archive.js` — Historical archive table + seasonal analysis

| Attribute          | Detail                                                                        |
| ------------------ | ----------------------------------------------------------------------------- |
| **Exports**        | `renderArchive()`, `renderSeasonal()`                                         |
| **Consumed by**    | `render.js`; `renderSeasonal()` also called internally from `renderArchive()` |
| **Recommendation** | **Keep.**                                                                     |

### `src/tracker/planner.js` — Budget / position / jewellery / accumulation planners + preset list

| Attribute          | Detail                                                                                                                                                            |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Exports**        | `renderPresets()`, `renderPlanners()`                                                                                                                             |
| **Consumed by**    | `render.js`                                                                                                                                                       |
| **Recommendation** | **Keep.** Combining presets and planners in one file is slightly awkward but not a problem at current size. Could be split if either section grows significantly. |

### `src/tracker/onboarding.js` — Welcome strip and trust banner localisation

| Attribute          | Detail                                             |
| ------------------ | -------------------------------------------------- |
| **Exports**        | `localizeWelcomeStrip()`, `localizeTrustBanner()`  |
| **Consumed by**    | `render.js`                                        |
| **Recommendation** | **Keep.** Small (32 lines) but correctly isolated. |

### `src/tracker/export.js` — Export readiness guard and button states

| Attribute          | Detail                                                |
| ------------------ | ----------------------------------------------------- |
| **Exports**        | `getExportReadinessState()`, `applyExportReadiness()` |
| **Consumed by**    | `render.js`                                           |
| **Recommendation** | **Keep.**                                             |

### `src/tracker/wire.js` — News wire (GDELT feed fetch + render)

| Attribute          | Detail                                                               |
| ------------------ | -------------------------------------------------------------------- |
| **Exports**        | `fetchWire()`, `renderWire()`                                        |
| **Consumed by**    | `tracker-pro.js` (lazy-imported as `fetchWire` / `renderWireModule`) |
| **Recommendation** | **Keep.** Correctly lazy-loaded (heavy network call).                |

### `src/tracker/events.js` — All DOM event bindings for tracker-pro

| Attribute          | Detail                                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| **Exports**        | `initEvents()`, `bindCoreEvents()`                                                                    |
| **Consumed by**    | `tracker-pro.js` (lazy-imported as `initEvents` / `bindCoreEvents`)                                   |
| **Recommendation** | **Keep.** Large (589 lines) but its scope is well-defined: exactly one responsibility (event wiring). |

### `src/tracker/inline-calc.js` — Inline gold weight calculator widget

| Attribute          | Detail                                                                                                          |
| ------------------ | --------------------------------------------------------------------------------------------------------------- |
| **Exports**        | `calculateInlineCalcReference()`, `initInlineCalc()`                                                            |
| **Consumed by**    | `tracker-pro.js` (direct import: `initInlineCalc`)                                                              |
| **Recommendation** | **Keep.** `calculateInlineCalcReference` is pure and unit-testable; `initInlineCalc` handles its own lifecycle. |

### `src/tracker/control-shortcuts.js` — Keyboard shortcuts for karat/unit cycling and spot copy

| Attribute          | Detail                                                                     |
| ------------------ | -------------------------------------------------------------------------- |
| **Exports**        | `cycleKarat()`, `cycleUnit()`, `copySpotPrice()`, `bindControlShortcuts()` |
| **Consumed by**    | `tracker-pro.js` (direct import: `bindControlShortcuts`)                   |
| **Recommendation** | **Keep.**                                                                  |

### `src/pages/tracker-pro.js` — Top-level orchestrator

| Attribute                              | Detail                                                                                                                                                                                                               |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Exports**                            | None (page entry point)                                                                                                                                                                                              |
| **Direct imports from `src/tracker/`** | `state.js` (`createInitialState`, `persistState`), `freshness.js` (`getFreshnessModel`), `chart.js` (`deriveLiveRowFreshness`), `inline-calc.js` (`initInlineCalc`), `control-shortcuts.js` (`bindControlShortcuts`) |
| **Lazy-loaded from `src/tracker/`**    | `ui-shell.js`, `events.js`, `wire.js`, `render.js` (and through it, all render sub-modules)                                                                                                                          |
| **Recommendation**                     | **Keep.** Slim orchestrator pattern is correct; lazy-loading is appropriate for a large page.                                                                                                                        |

---

## 2. Flags

### 2.1 Unused Exports

All examined exports appear to be consumed either by `tracker-pro.js` directly, by `render.js` as a
barrel re-exporter, or by sibling modules. No truly dead exports were found in this read-only audit.
One minor note: `render.js` re-exports `renderSeasonal` from `archive.js` (line 28), but
`renderSeasonal()` is also called internally within `renderArchive()` — `tracker-pro.js` does not
call it directly. The re-export is harmless but technically unnecessary.

### 2.2 Duplicated Formatting / Escape Helpers

`_ctx.js` provides `formatUsd()`, `formatPercent()`, `formatUnitLabel()`, `classifyDelta()`, and
`DIRECTION_GLYPH` for use by all tracker sub-modules. This is the correct pattern.

**One divergence found:** `inline-calc.js` imports `formatPrice` from `src/lib/formatter.js` (the
shared lib) rather than using `_ctx.js`'s `formatUsd`. This is intentional — `formatPrice` from
`lib/formatter.js` handles locale-aware currency formatting with the correct symbol for any currency
code, while `_ctx.js`'s `formatUsd` is a simpler USD-only helper. The two are not equivalent; the
divergence is justified.

No other duplicated formatter/escape helpers were found.

### 2.3 Literal Strings Bypassing `translations.js`

The following hard-coded English strings appear in tracker modules instead of going through `tx()` /
`trackerTx()`:

| File         | Line(s)                           | String(s)                                                                                                                                                            |
| ------------ | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `events.js`  | 413, 418, 420, 422, 425, 428, 430 | `'Found date'`, `'XAU/USD'`, `'per troy oz'`, `'UAE 24K/g'`, `'AED peg 3.6725'`, `'Source'`, `closest.granularity \|\| 'daily'` — all in the date-lookup result grid |
| `events.js`  | 437                               | `'No data available for that date. Archive covers 2019–present.'`                                                                                                    |
| `wire.js`    | 51, 70                            | `'Wire unavailable — using local prices and history only'`, `'Wire unavailable'`                                                                                     |
| `chart.js`   | 176                               | `'Collecting data…'` (AR branch is already translated; EN branch is a literal)                                                                                       |
| `archive.js` | 190–201                           | Month names array: `'Jan'` … `'Dec'` — used in `renderSeasonal()` only, not exposed to the end user via `tx()`                                                       |
| `alerts.js`  | 39, 43                            | `'⚡ very close'`, `'● nearby'` — proximity proximity strings                                                                                                        |
| `hero.js`    | 262, 265, 267, 269, 329           | Stat-card labels `'XAU/USD'`, `'UAE 24K'`, `'UAE 22K'`, `'USD/g 24K'` — label strings only (values use `tx()`)                                                       |

**Impact:** The above strings are English-only. They will render in English regardless of the user's
chosen language (AR). The date-lookup result block (`events.js` lines 411–440) and the proximity
strings (`alerts.js`) are the most user-visible; the wire fallback and month names are
lower-priority.

### 2.4 Inline Karat Factors

The karat purity fractions (e.g. 24K = 1.0, 22K ≈ 0.9167, 21K ≈ 0.875, 18K = 0.75) must come from
`KARATS` config, not be hard-coded.

**Findings:**

- `hero.js` line 248:
  `(spot / CONSTANTS.TROY_OZ_GRAMS) * (KARATS.find((k) => k.code === '24')?.purity ?? 1)` — looks up
  purity from `KARATS` correctly. The fallback `?? 1` is only reached if the `'24'` entry is somehow
  missing, which is a safe guard.
- `inline-calc.js` line 59:
  `(parsedSpot / CONSTANTS.TROY_OZ_GRAMS) * purity * parsedWeight * fxRate` — `purity` is resolved
  from `KARATS` earlier in the function. Correct.
- No file in `src/tracker/` uses a bare numeric fraction (e.g. `0.9167`, `0.75`) as a karat purity
  factor.

**No inline karat factors found.** All purity multiplication goes through `KARATS` config.

One borderline case: `events.js` line 425 renders `'AED peg 3.6725'` as a hard-coded display string
inside a result card. This is the AED/USD peg value, not a karat factor, but the peg is also defined
as `CONSTANTS.AED_PEG`. The display string should reference `CONSTANTS.AED_PEG` for consistency and
to survive a peg change (however unlikely).

---

## 3. Module Recommendations Summary

| Module                 | Lines  | Recommendation | Reason                                                       |
| ---------------------- | ------ | -------------- | ------------------------------------------------------------ |
| `_ctx.js`              | 65     | **Keep**       | Core shared context; correct pattern                         |
| `state.js`             | 293    | **Keep**       | Canonical state + URL layer                                  |
| `modes.js`             | 176    | **Keep**       | Single source of truth for tab/panel registry                |
| `freshness.js`         | 89     | **Keep**       | Used by 8+ modules; no duplication                           |
| `ui-shell.js`          | 310    | **Keep**       | Clean shell mount + overlay system                           |
| `render.js`            | 131    | **Keep**       | Aggregation barrel + `renderAll` + `renderQuickCalculator`   |
| `hero.js`              | 617    | **Keep**       | Complex but single responsibility; well-structured           |
| `chart.js`             | 445    | **Keep**       | SVG chart isolated correctly                                 |
| `decision.js`          | 104    | **Keep**       | Small and focused                                            |
| `alerts.js`            | 80     | **Keep**       | Small and focused                                            |
| `compare.js`           | 93     | **Keep**       | Small and focused                                            |
| `markets.js`           | 177    | **Keep**       | Manages market board + inline favourite toggle               |
| `watchlist.js`         | 106    | **Keep**       | Small and focused                                            |
| `archive.js`           | 248    | **Keep**       | Pagination + seasonal are related; can split later if needed |
| `planner.js`           | 204    | **Keep**       | Presets + planner logic; slight mixed concern but manageable |
| `onboarding.js`        | 32     | **Keep**       | Tiny; correctly isolated                                     |
| `export.js`            | 118    | **Keep**       | Clean readiness guard + button state                         |
| `wire.js`              | 105    | **Keep**       | Correctly lazy-loaded; GDELT fetch correctly isolated        |
| `events.js`            | 589    | **Keep**       | All event wiring in one place; large but single-purpose      |
| `inline-calc.js`       | 148    | **Keep**       | Pure calc function + widget lifecycle; well-structured       |
| `control-shortcuts.js` | 83     | **Keep**       | Small, keyboard-shortcut-only scope                          |
| `tracker-pro.js`       | ~1000+ | **Keep**       | Slim orchestrator; lazy-loading pattern is correct           |

No modules are candidates for deletion or merger. The layer is well-decomposed.

---

## 4. CSS Token-Debt Inventory (Phase 4 deliverable)

**File:** `styles/pages/tracker-pro.css` (5 011 lines, 1 004 `var(--…)` references)

Section banners (`/* ── … */` and `/* ═══ … */`) are already present and map to the 50-phase IA
sections (shell, hero, controls, karat table, chart, alerts/watchlist, exports, compare, archive,
method, panels, responsive, RTL, reduced-motion).

### Hardcoded values — migration backlog

| Category                          | Count   | Notes                                                                                                                                                                                                        |
| --------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Hex literals** (`#rrggbb`)      | **16**  | All inside the `--tp-*` token alias block (`:root`, lines 59–74) and two gold-accent colour-stops (`color: #c9a14d`, lines 826/867).                                                                         |
| **`rgb()` literals**              | **106** | Primarily alpha-transparency overlays (`rgb(255 255 255 / N%)`, `rgb(0 0 0 / N%)`) used in hero glass surfaces, box-shadows, and border colours. None of these map to the canonical `--color-*` palette yet. |
| **Total non-token colour values** | **122** | —                                                                                                                                                                                                            |

### Hex literals by location

| Line      | Value                         | Context                                 |
| --------- | ----------------------------- | --------------------------------------- |
| 59        | `#05060b`                     | `--tp-hero-bg-deep` root alias          |
| 60        | `#0e1220`                     | `--tp-hero-bg-mid` root alias           |
| 61        | `#121830`                     | `--tp-hero-bg-accent` root alias        |
| 74        | `#080a10`                     | `--tp-chart-bg` root alias              |
| 826       | `#c9a14d`                     | Freshness badge colour (also line 867)  |
| 2044      | `var(--color-live, #1b8a4c)`  | Fallback only — canonical token present |
| 2048      | `var(--color-error, #c94040)` | Fallback only — canonical token present |
| 2789      | `#0d7680`                     | Method-card accent (light mode)         |
| 2795      | `#40bfc8`                     | Method-card accent (dark mode)          |
| 3344–3345 | `#f8f4ea`, `#1a1108`          | Print background/text                   |
| 3350      | `#1a1108`                     | Print text continuation                 |
| 3634      | `#1a1208`, `#0d0a07`          | Dark-mode gradient stops                |
| 4415      | `#040508`                     | `--tp-chart-bg` dark-mode override      |

### Migration priority

| Band                     | Items                                                 | Recommended token                                             |
| ------------------------ | ----------------------------------------------------- | ------------------------------------------------------------- |
| P1 — Remove fallback     | `#1b8a4c`, `#c94040` (lines 2044, 2048)               | Already have `--color-live` / `--color-error`; drop fallback  |
| P2 — Tokenise hero bg    | `#05060b`, `#0e1220`, `#121830`, `#080a10`, `#040508` | Promote to `--surface-hero-deep/mid/accent/chart`             |
| P2 — Tokenise gold badge | `#c9a14d` (×2)                                        | Use `var(--color-gold)` or `var(--tp-gold)`                   |
| P3 — Alpha overlays      | 106 `rgb()` calls                                     | Introduce `--overlay-white-N` / `--overlay-black-N` token set |
| P4 — Print               | `#f8f4ea`, `#1a1108`, `#0d0a07`                       | Defer; print scope is low-traffic                             |

**Migration target (Track B):** Phases 6–7 of the 50-phase revamp tackle token adoption starting
from highest-traffic sections (hero → controls → karat table). This inventory provides the backlog.

---

## 5. Action Items (prioritised, not blocking)

| Priority | File(s)                        | Finding                                                       | Suggested Fix                                                                            |
| -------- | ------------------------------ | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| P1       | `events.js` (lines 411–440)    | Date-lookup result strings are English literals               | Move to `translations.js` under `tracker.dateLookup.*` keys; apply `tx()`                |
| P1       | `events.js` (line 437)         | Archive no-data message is a literal                          | Add `tracker.archive.noDataDateLookup` translation key                                   |
| P2       | `alerts.js` (lines 39, 43)     | Proximity labels `'⚡ very close'`, `'● nearby'` are literals | Add `tracker.alerts.proximity.*` keys                                                    |
| P2       | `wire.js` (lines 51, 70)       | Wire-unavailable strings are literals                         | Add `tracker.wire.unavailable` / `tracker.wire.meta` keys                                |
| P2       | `hero.js` (lines 262–265, 329) | Hero stat-card labels are literals                            | Add `tracker.heroStat.*` keys (these are currently EN-only even for AR users)            |
| P3       | `chart.js` (line 176)          | EN branch of "Collecting data…" is a literal                  | Add `tracker.collectingData` key (AR branch already inlined)                             |
| P3       | `archive.js` (lines 190–201)   | `renderSeasonal()` month names are literals                   | Use `Intl.DateTimeFormat` with locale for month names, or add a `tracker.months.*` block |
| P3       | `events.js` (line 425)         | AED peg displayed as `'AED peg 3.6725'` literal               | Use `` `AED peg ${CONSTANTS.AED_PEG}` `` so it tracks the constant                       |
| P4       | `render.js` (line 28)          | `renderSeasonal` re-exported but never consumed externally    | Remove the re-export (no functional impact)                                              |

---

_Audit performed 2026-06-26. No source files were modified._
