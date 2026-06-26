# Tracker HTML — 50-Phase Flagship Revamp (Master Working Prompt)

> **Status:** Active · **Branch:** `claude/tracker-html-revamp-bpk97i` · **Owner-requested:** 2026-06-26
> **Scope anchor URL:** `tracker.html#mode=exports&cur=AED&k=24&u=gram&r=30D&cmp=USD&lang=en`
> **This file is the canonical, self-contained prompt for the revamp.** It is deliberately long,
> boring, and specific. Read it top-to-bottom before touching code. Every phase is independently
> shippable, independently revertible, and ends GREEN (all gates pass) unless explicitly marked
> `STAGED` (requires owner sign-off in `OWNER_REVIEW.md` before it goes live).

---

## 0. Why this document exists

The owner asked for a "50-phase revamp from all aspects" of the Tracker — design, style, functions,
features, reliability, look, UI, UX, feel. The Tracker is the **flagship** of Gold Ticker Live: a
gold-intelligence *workspace*, not a landing page. This document decomposes that ambition into 50
concrete, verifiable phases so the work is auditable and never regresses trust, pricing accuracy, or
bilingual parity.

Two prior multi-phase efforts already touched this surface — the 30-phase visual revamp
(`docs/plans/2026-06-25_tracker-30-phase-visual-revamp.md`, branch `cursor/tracker-30-phase-revamp-3c60`)
and the 50-phase platform program tracked in `PROGRESS.md`/`OWNER_REVIEW.md` (PR #443). **This plan
does not duplicate them.** Where they left a phase STAGED or out-of-scope, this plan either finishes
it or explicitly defers. Before starting any phase, re-read `PROGRESS.md` and `OWNER_REVIEW.md` so we
don't re-litigate a decision already made.

---

## 1. The system as it exists today (ground truth — verify before editing)

| Surface | File(s) | Notes |
| --- | --- | --- |
| Page shell | `tracker.html` (~1782 lines) | Loads `src/pages/tracker-pro.js` (module), `styles/pages/tracker-pro.css`, `styles/components/alert-manager.css`, `styles/critical.css`, `styles/global.css`. |
| Orchestrator | `src/pages/tracker-pro.js` (~69 KB) | Boots the workspace, owns `applyRealtimeSnapshot`, wires the 90 s tick + alert engine. |
| Modular logic | `src/tracker/*.js` | `state.js` (hash + localStorage), `modes.js` (mode/panel registry), `ui-shell.js` (mount + workspace promotion), `hero.js`, `chart.js`, `events.js`, `render.js`, `compare.js`, `archive.js`, `export.js`, `alerts.js`, `watchlist.js`, `planner.js`, `markets.js`, `decision.js`, `freshness.js`, `formatting.js`, `inline-calc.js`, `onboarding.js`, `control-shortcuts.js`, `wire.js`, `_ctx.js`. |
| Chart loader | `src/pages/tracker-chart-loader.js` | Lazy chart bootstrap. |
| Styles | `styles/pages/tracker-pro.css` (~121 KB) + `styles/pages/tracker-pro-v4.css` (elevation layer, `@import`ed) | v4 is the newer elevation/transition layer. |
| Tokens | `styles/tokens.css` (single source of truth, per `PROGRESS.md` phase 03) | Never fork dark mode; `[data-theme]` is canonical. |
| Pricing | `src/lib/price-calculator.js`, `src/config/karats.js`, `src/config/constants.js` (AED peg `3.6725`, troy oz `31.1035`) | **Immutable constants.** |
| Freshness | `src/lib/live-status.js` (`getLiveFreshness`, `STALE_AFTER_MS` = 12 min), `src/tracker/freshness.js` | State machine: `live` / `cached` / `stale` / `unavailable`. |
| Strings | `src/config/translations.js` | All user-visible text. No literals in JS/HTML. |
| Hash contract | `docs/tracker-state.md` (FROZEN, §22b Phase 7) | Tests: `tests/tracker-hash.test.js`. |
| Mode/IA contract | `docs/tracker-state.md` "IA & mode ordering" | Tests: `tests/tracker-modes.test.js`. |

### Mode / panel contract (frozen — do not reorder without the change procedure)

| Order | Kind | id | EN | Workspace |
| --- | --- | --- | --- | --- |
| 1 | mode | `live` | 📡 Live | basic |
| 2 | mode | `compare` | 🌍 Compare | basic |
| 3 | mode | `archive` | 🗂 Archive | advanced |
| 4 | panel | `alerts` | 🔔 Alerts | basic (modal) |
| 5 | panel | `planner` | 📋 Planner | basic (modal) |
| 6 | mode | `exports` | ⬇ Exports | advanced |
| 7 | mode | `method` | 📖 Method | advanced |

### Hash schema (frozen)

```
tracker.html#mode=<mode>&cur=<CUR>&k=<K>&u=<unit>&r=<range>&cmp=<CUR>&lang=<en|ar>[&panel=<panel>]
```

`mode ∈ {live,compare,archive,exports,method}` · `k ∈ {24,22,21,20,18,16,14}` · `u ∈ {gram,oz,tola}`
· `r ∈ {7D,30D,90D,1Y,5Y}` · `panel ∈ {alerts,planner}`. Legacy one-token hashes
(`#alerts`, `#mode=alerts`, …) must still canonicalize. **Any schema change follows the 4-step change
procedure in `docs/tracker-state.md` §"Change procedure" and updates `REVAMP_PLAN.md` §22b in the
same commit.**

---

## 2. Non-negotiable guardrails (apply to EVERY phase)

These come from `AGENTS.md`, `.cursor/rules/*.mdc`, and `docs/freshness-contract.md`. Violating any
one of them fails the phase regardless of how good it looks.

1. **Pricing is sacred.** Never change pricing formulas, the AED peg (`3.6725`), the troy-ounce
   constant (`31.1034768`), or karat factors. Karat factors come from `src/config/karats.js` only —
   never inline a factor anywhere.
2. **Reference ≠ retail.** A spot-linked reference price must never read as a guaranteed in-store
   quote. Keep the distinction explicit wherever both appear.
3. **Freshness honesty.** Every visible price keeps a state label (`live`/`cached`/`stale`/
   `unavailable`), a source attribution (XAU/USD source + AED peg), and a timestamp. Never call data
   `live` if it isn't. Never remove a freshness pill, methodology link, or reference-vs-retail
   disclaimer "to look cleaner."
4. **EN/AR parity.** No stronger claim in one language. All strings live in
   `src/config/translations.js` — zero hardcoded UI text in HTML/JS. Every layout change is
   RTL-spot-checked at 360 px.
5. **DOM safety.** Use `src/lib/safe-dom.js`; prefer `node.replaceChildren()` over `innerHTML`.
   Adding an `innerHTML` sink fails `scripts/node/check-unsafe-dom.js` (part of `npm run validate`).
6. **No new heavyweight deps / no framework.** Static multi-page, vanilla ES modules. No runtime
   framework, no heavy charting library, no new dependency without an explicit owner ask + an
   advisory-DB check (`gh-advisory-database`).
7. **Hash + IA contracts are frozen.** Preserve back-compat for shared links. Reorder modes/panels
   only via the documented change procedure with tests in the same commit.
8. **Motion respects `prefers-reduced-motion: reduce`.** Every animation has a reduced-motion
   fallback.
9. **PR-only, no force-push, no direct `main`.** Service-worker cache version (`sw.js`) bumps if and
   only if cached asset URLs change — and `sw.js` is owner-approval-gated.
10. **Smallest correct diff per concern.** One concern per commit. Tokens → shell → hero → chart →
    each mode → each panel → reliability → a11y → perf.

### The verification gate (run before finalizing every GREEN phase)

```bash
rm -rf playwright-report test-results
npm run lint                 # eslint
npm run style                # stylelint (CSS)
npm test                     # node --test, tests/*.test.js  (baseline must stay green)
npm run validate             # DOM-safety + a11y + SEO + schema + sw-coverage gates
npm run build                # full static build incl. schema inject + sitemap + vite
npm run preview              # spot-check the built tracker page
```

Capture before/after screenshots at **360 px EN**, **360 px AR**, **430 px EN**, plus desktop. Capture
Lighthouse mobile (LCP / CLS / TBT) before/after for any phase touching first paint, the hero, or the
chart. **State in each PR exactly what was run vs. inferred.**

---

## 3. Execution model

- **Cadence:** one phase (or one tight cluster of adjacent phases) per PR. Coherent commits inside a
  PR, one concern each.
- **Baseline discipline:** the test suite is green today; it stays green on every committed phase.
  Record the pass/fail count in the PR Proof section.
- **STAGED phases:** anything that changes live infrastructure, deletes pages, alters the hash schema
  semantics, or needs a design/product decision is staged (code written, not merged to live behavior)
  and the open question goes to `OWNER_REVIEW.md`. Do not guess a live site into a degraded state.
- **Definition of done (per phase):** acceptance criteria met · verification gate green · EN+AR+RTL
  checked · screenshots captured · `PROGRESS.md` row added · plan checkbox ticked · honest Proof in
  the PR (What / Why / How / Proof / Risks).
- **Rollback:** every phase is a revertible commit. If a phase can't be made green, revert it and move
  the blocker to `OWNER_REVIEW.md` rather than shipping yellow.

---

## 4. The 50 phases

Grouped into 10 tracks of 5. Track order is the recommended execution order (foundations before
surface work), but phases within a track are mostly independent. Each phase lists **Goal · Files ·
Specific work · Acceptance · Verify**.

### Track A — Foundation, audit & safety net (Phases 1–5)

**Phase 1 — Baseline capture & regression harness.**
- Goal: a reproducible before-state so every later phase can prove no regression.
- Files: `docs/plans/_artifacts/2026-06-26-tracker-baseline/` (new, screenshots + lighthouse JSON),
  `PROGRESS.md`.
- Work: record current `npm test` pass/fail counts; capture screenshots (360 EN/AR, 430 EN, desktop)
  for every mode (`live`, `compare`, `archive`, `exports`, `method`) and both panels; save a
  Lighthouse-mobile run; snapshot the rendered hash round-trips for the 7 canonical example URLs.
- Acceptance: artifacts committed; baseline counts noted; no code change.
- Verify: gate green (no-op), artifacts present.

**Phase 2 — Dead-code & duplication audit of `src/tracker/*` + `tracker-pro.js`.**
- Goal: map what's actually wired vs. orphaned before restructuring.
- Files: read-only across `src/tracker/*`, `src/pages/tracker-pro.js`; write findings to
  `docs/audits/2026-06-26_tracker-architecture-audit.md` (new).
- Work: build a module dependency map; flag unused exports, duplicated formatting/escape helpers,
  and any literal strings bypassing `translations.js`; flag any inline karat factors.
- Acceptance: audit doc lists every module, its consumers, and a "keep / merge / delete" recommendation.
- Verify: doc-only; gate green.

**Phase 3 — String-literal sweep (i18n completeness).**
- Goal: zero user-visible literals outside `src/config/translations.js`.
- Files: `tracker.html`, `src/tracker/*`, `src/pages/tracker-pro.js`, `src/config/translations.js`.
- Work: grep for raw text nodes / hardcoded labels (e.g. headings like "Quote context", "Live desk",
  "Karat reference table" currently in `tracker.html`); move each to a translation key with an EN+AR
  pair using approved glossary terms; render via the existing i18n hydration path.
- Acceptance: no raw UI strings remain in the tracker surface; `tests/translations-freshness.test.js`
  and a new parity assertion pass; AR renders the new keys.
- Verify: gate green + manual AR check at 360 px.

**Phase 4 — `tracker-pro.css` map & token-debt inventory.**
- Goal: make the 121 KB stylesheet navigable and quantify hardcoded values.
- Files: `styles/pages/tracker-pro.css`, `styles/pages/tracker-pro-v4.css`, write to the Phase 2 audit
  doc.
- Work: insert clear `/* ── SECTION ── */` banners matching the IA (shell, hero, controls, karat
  table, chart, alerts/watchlist, exports, compare, archive, method, panels, responsive, RTL,
  reduced-motion); count raw hex/rgb and off-scale spacing for a token-migration backlog (do not
  migrate yet — that's Track B).
- Acceptance: section banners present; inventory numbers recorded; pure comment/organization churn,
  zero rule changes.
- Verify: `npm run style` green; visual diff = none.

**Phase 5 — Test-coverage gap analysis & new guard tests.**
- Goal: lock the contracts this revamp must not break.
- Files: `tests/tracker-*.test.js` (add cases), maybe `tests/tracker-ia-guard.test.js` (new).
- Work: add/strengthen tests asserting: tab-bar DOM order == `modes.js` registry order; every mode
  section has a heading with an `id` referenced by `aria-labelledby`; the price card carries
  `aria-live="polite"`; freshness badge classes match the `live-status.js` state map; hash round-trip
  for all 7 canonical URLs + legacy shortcuts.
- Acceptance: new tests pass and would fail if the contract breaks; total count rises.
- Verify: `npm test` green; intentionally break a contract locally to confirm the test catches it,
  then revert.

### Track B — Design system & visual language (Phases 6–10)

**Phase 6 — Tracker design-token layer.**
- Goal: a scoped component-token layer between primitives (`tokens.css`) and tracker rules.
- Files: `styles/pages/tracker-pro.css` (top), `styles/tokens.css` only if a genuinely global
  primitive is missing.
- Work: introduce `--tracker-*` tokens (surface, card, border, ink, accent, badge, grid-gap, radius
  scale, elevation) referencing global primitives; do not invent a parallel palette.
- Acceptance: tokens defined; no visual change yet (values equal current computed values).
- Verify: `npm run style` green; pixel diff ≈ none.

**Phase 7 — Migrate hardcoded color/spacing to tokens (highest-traffic sections first).**
- Goal: kill the token debt counted in Phase 4 for the hero + controls + karat table.
- Files: `styles/pages/tracker-pro.css`, `tracker-pro-v4.css`.
- Work: replace raw hex/rgb/px in the hero, control bar, and karat table with `--tracker-*` /
  global tokens; preserve intentional `var(--token, #fallback)` patterns.
- Acceptance: targeted sections token-driven; light + dark both correct (AA contrast holds).
- Verify: gate green; dark-mode contrast check; screenshots.

**Phase 8 — Typography & numeric rhythm.**
- Goal: a deliberate type scale and rock-solid number rendering.
- Files: `styles/pages/tracker-pro.css`, `styles/tokens.css` (scale tokens if missing).
- Work: apply a consistent modular type scale to headings/labels/stats; enforce `tabular-nums` +
  `font-variant-numeric` on every price/stat/table cell to eliminate digit jitter on tick; verify a
  mobile label floor (~13 px) without bloating dense stat displays (this addresses STAGED phase 24
  from `PROGRESS.md` with per-selector judgment, not a blanket bump).
- Acceptance: no sub-floor labels except where intentionally dense; numbers don't reflow on update.
- Verify: gate green; record-tick visual check; screenshots 360/430.

**Phase 9 — Elevation, surfaces & depth system.**
- Goal: coherent card elevation and the hero→workspace transition.
- Files: `styles/pages/tracker-pro-v4.css`, `styles/pages/tracker-pro.css`.
- Work: standardize card shadows/borders/radii via tokens; refine the existing
  `.tracker-hero-wrap::after` fade; ensure consistent surface layering across modes.
- Acceptance: consistent elevation language; no harsh seams between hero and workspace.
- Verify: gate green; screenshots light+dark.

**Phase 10 — Iconography, badges & status-pill system.**
- Goal: one badge/pill vocabulary across freshness, modes, and trust notes.
- Files: `styles/pages/tracker-pro.css`, `styles/components/alert-manager.css`,
  relevant `src/tracker/*` render paths.
- Work: unify badge geometry/contrast for `tracker-badge-live` / `--cached` / `--stale` /
  `--unavailable` and mode tabs; ensure each pill has an accessible text label (not color-only).
- Acceptance: badge set is visually + semantically consistent; color is never the sole signal.
- Verify: gate green; `npm run a11y`; colorblind sanity check.

### Track C — Information architecture & the workspace shell (Phases 11–15)

**Phase 11 — Tab bar / mode navigation redesign.**
- Goal: a clearer, thumb-reachable mode switcher that still mirrors the frozen registry order.
- Files: `tracker.html` (tab markup), `src/tracker/ui-shell.js`, `src/tracker/modes.js` (no order
  change), `styles/pages/tracker-pro.css`.
- Work: improve active-state affordance, focus ring, 44 px touch targets (extends STAGED phase 22),
  and overflow behavior on 360 px; keep `data-mode` hooks and keyboard shortcuts
  (`h/c/a/p/r`) intact.
- Acceptance: `tests/tracker-modes.test.js` + the Phase 5 IA-order test stay green; order unchanged.
- Verify: gate green; keyboard-shortcut manual test; 360 px RTL.

**Phase 12 — Basic vs. advanced workspace promotion UX.**
- Goal: make the basic→advanced transition legible (today selecting any non-`live` mode silently
  promotes the workspace).
- Files: `src/tracker/ui-shell.js` (`ensureAdvancedWorkspace`), `tracker.html`,
  `src/config/translations.js`.
- Work: add a visible, reversible "advanced workspace" affordance with an i18n label; persist the
  choice consistently with `tracker_pro_state_v5`; never trap the user in advanced.
- Acceptance: promotion is discoverable + reversible; state persists across reload + deep link.
- Verify: gate green; deep-link `#mode=archive` then back to `live`.

**Phase 13 — Mobile command card / workspace ordering.**
- Goal: optimal stacking order on small screens (the `.tracker-mobile-workspace` block).
- Files: `tracker.html`, `styles/pages/tracker-pro.css`.
- Work: ensure the price card → freshness → primary controls → chart → tables order is correct at
  360/390/430; convert any remaining tables to cards on small screens.
- Acceptance: no horizontal scroll at 360; logical reading + tab order; tables become cards.
- Verify: gate green; screenshots 360/390/430 EN+AR.

**Phase 14 — Sticky context bar (price + freshness always visible).**
- Goal: keep the current reference price + freshness pill on-screen while scrolling the workspace.
- Files: `tracker.html`, `src/tracker/ui-shell.js` or `hero.js`, `styles/pages/tracker-pro.css`.
- Work: a condensed, `aria-hidden`-managed sticky strip that mirrors `#tp-hero-readout` /
  `#tp-refresh-badge` without duplicating the live region (avoid double SR announcements — only one
  `aria-live` price region site-wide, per `tracker-state.md` a11y note).
- Acceptance: sticky strip reflects state; screen reader announces price once, not twice.
- Verify: gate green; SR (VoiceOver/NVDA) single-announcement check; `tests/tracker-freshness.test.js`.

**Phase 15 — Empty / loading / error states for every panel.**
- Goal: no blank or janky region during boot or failure.
- Files: `src/tracker/render.js`, `hero.js`, `chart.js`, `archive.js`, `compare.js`,
  `styles/pages/tracker-pro.css`, `src/config/translations.js`.
- Work: skeletons for hero/karat-table/chart (extend existing `skeleton-inline`), explicit empty
  states for archive/compare/watchlist, and honest error states ("data unavailable — last cached …")
  that respect the freshness contract.
- Acceptance: every mount has loading + empty + error variants; CLS minimized (reserve space).
- Verify: gate green; throttle/offline simulation; Lighthouse CLS before/after.

### Track D — Hero / Spot Terminal / price card (Phases 16–20)

**Phase 16 — Hero readout hierarchy & "reference estimate" framing.**
- Goal: the single most important element — the live reference price — reads instantly and honestly.
- Files: `tracker.html` (`#tp-hero-readout`, `#tp-hero-title`, `tp-command-meta`), `src/tracker/hero.js`,
  `styles/pages/tracker-pro.css`, `src/config/translations.js`.
- Work: tighten visual hierarchy (price > unit/karat > change > context); keep the
  "Reference estimate" label, source line, and UTC timestamp; ensure `aria-live="polite"` stays on
  the price card only.
- Acceptance: hierarchy clear; reference framing + source + timestamp intact; `tests/tracker-hero.test.js`
  green.
- Verify: gate green; screenshots; SR check.

**Phase 17 — Change / delta visualization (sparkline + direction).**
- Goal: at-a-glance trend without opening the chart.
- Files: `src/tracker/hero.js`, `src/tracker/chart.js` (reuse), `styles/pages/tracker-pro.css`.
- Work: a tiny inline sparkline + signed delta (color + arrow + text, never color-only) for the
  selected range; reduced-motion safe; no new charting dependency (reuse existing canvas/SVG path).
- Acceptance: delta + direction shown with non-color cue; reduced-motion disables animation.
- Verify: gate green; reduced-motion check; a11y.

**Phase 18 — Freshness pulse & countdown polish.**
- Goal: make "updated every 90 s" feel alive and trustworthy.
- Files: `src/tracker/freshness.js`, `src/lib/live-status.js` (read-only contract), `tracker.html`
  (`#tp-countdown`, `#tp-refresh-badge`), `styles/pages/tracker-pro.css`.
- Work: refine the countdown + pulse animation; ensure the 12-min `STALE_AFTER_MS` boundary copy is
  exact for all four states; the pulse must not fire on `stale`/`unavailable`.
- Acceptance: state→copy mapping matches `tracker-state.md`; `tests/freshness-*` +
  `tests/live-status.test.js` green.
- Verify: gate green; simulate stale (mock `updatedAt`) and confirm copy + no-pulse.

**Phase 19 — Quote-context / "Live desk" side panel.**
- Goal: tighten the 5-item summary list (`#tp-live-summary-list`: reference / freshness / source /
  AED peg / history coverage).
- Files: `tracker.html`, `src/tracker/hero.js`/`render.js`, `styles/pages/tracker-pro.css`,
  `src/config/translations.js`.
- Work: visually group the five items, keep all five always-rendered (contract), surface the
  methodology link and AED-peg disclosure prominently.
- Acceptance: all 5 items render every paint; methodology link present; copy matches glossary.
- Verify: gate green; AR check.

**Phase 20 — Unit / karat / currency control cluster.**
- Goal: the primary input controls feel like a precision instrument.
- Files: `tracker.html` (`#tp-unit`, karat selector, currency selector), `src/tracker/events.js`,
  `state.js`, `styles/pages/tracker-pro.css`.
- Work: redesign the segmented controls (gram/oz/tola; 24–14 karat; currency); ensure each change
  writes the hash (`u`/`k`/`cur`) and persists; 44 px targets; keyboard operable; localized unit
  labels from `formatUnitLabel`.
- Acceptance: every control round-trips through the hash; `tests/tracker-hash.test.js` green;
  keyboard + RTL pass.
- Verify: gate green; deep-link each unit/karat/currency.

### Track E — Chart & history (Phases 21–25)

**Phase 21 — Chart container, axes & responsive sizing.**
- Goal: a crisp, responsive chart that doesn't cause layout shift.
- Files: `src/tracker/chart.js`, `src/pages/tracker-chart-loader.js`, `tracker.html`
  (`#section-chart`, `#tp-chart-heading`), `styles/pages/tracker-pro.css`.
- Work: reserve chart height to prevent CLS; clean axes/gridlines via tokens; high-DPI canvas
  scaling; resize observer cleanup on `visibilitychange`/`pagehide`.
- Acceptance: no CLS on chart load; interval/observer cleanup present (no leaks).
- Verify: gate green; `tests/tracker-chart.test.js`; Lighthouse CLS.

**Phase 22 — Range presets (7D/30D/90D/1Y/5Y) + hash sync.**
- Goal: range switching is instant, obvious, and shareable.
- Files: `src/tracker/chart.js`, `ui-shell.js`, `state.js`, `tracker.html`.
- Work: redesign the range selector; each selection writes `r` to the hash; active state clear;
  caption (`#tp-history-caption`) + source label (`#tp-chart-history-source`) update with state.
- Acceptance: all 5 ranges round-trip; caption/source reflect resolution + source; hash test green.
- Verify: gate green; deep-link each range.

**Phase 23 — History caption, source label & resolution honesty.**
- Goal: never imply more granularity/freshness than the data has.
- Files: `src/tracker/chart.js`, `freshness.js`, `src/config/translations.js`.
- Work: caption states the resolution ("daily closes", etc.) and coverage; source label names the
  XAU/USD source + AED peg derivation; align with `docs/freshness-contract.md` and the §45 wording
  flagged in `PROGRESS.md`.
- Acceptance: caption + source are state-labelled and honest; no "live" wording on historical series.
- Verify: gate green; `tests/check-freshness-metadata.test.js`.

**Phase 24 — Chart interactions (hover/tap readout, crosshair).**
- Goal: read an exact value at any point on touch + pointer.
- Files: `src/tracker/chart.js`, `styles/pages/tracker-pro.css`, `src/config/translations.js`.
- Work: accessible crosshair + value tooltip (keyboard-navigable points, `aria` value text); touch
  targets sized for fingers; reduced-motion safe; no dependency added.
- Acceptance: hover/tap/keyboard all reveal exact value with localized formatting; a11y passes.
- Verify: gate green; keyboard + touch manual test; `npm run a11y`.

**Phase 25 — Compare overlay on the chart (multi-series).**
- Goal: overlay the `cmp` currency / a second karat on the trend.
- Files: `src/tracker/chart.js`, `compare.js`, `state.js`, `src/config/translations.js`.
- Work: render the `cmp` series as a labelled overlay with a legend; normalize axes honestly; ensure
  `cmp` round-trips in the hash; never blur reference vs. retail.
- Acceptance: overlay legible + labelled; `cmp` hash round-trip; `tests/tracker-compare.test.js` green.
- Verify: gate green; deep-link `cmp=USD`.

### Track F — Modes: Compare, Archive, Exports, Method (Phases 26–32)

**Phase 26 — Compare board layout & builder.**
- Goal: the `compare` mode (`#mode-compare`) reads as a genuine multi-market board.
- Files: `tracker.html`, `src/tracker/compare.js`, `markets.js`, `styles/pages/tracker-pro.css`.
- Work: redesign the comparison workspace + builder; tables→cards on mobile; per-row reference
  framing; clear "spot-linked reference" disclaimer (this is informational, not retail).
- Acceptance: board legible at 360; disclaimers present; compare tests green.
- Verify: gate green; screenshots 360 EN/AR.

**Phase 27 — Compare presets & saved views.**
- Goal: save/restore compare configurations (`tracker_pro_presets_v5`).
- Files: `src/tracker/compare.js`, `state.js`, `src/config/translations.js`.
- Work: polish save/load/delete of compare presets; ensure presets serialize cleanly and never
  collide with the hash contract; empty-state for "no saved views".
- Acceptance: presets persist + restore; no hash-schema leakage; localized.
- Verify: gate green; round-trip a preset across reload.

**Phase 28 — Archive / historical lookup mode.**
- Goal: `archive` mode (`#mode-archive`) date lookup is trustworthy + clear.
- Files: `tracker.html`, `src/tracker/archive.js`, `styles/pages/tracker-pro.css`,
  `src/config/translations.js`.
- Work: redesign the lookup UI + result card; source note (`#tp-archive-source-note`) states
  provenance + resolution; honest "no data for this date" empty state.
- Acceptance: lookup usable; source/empty states honest; localized.
- Verify: gate green; query a covered + an uncovered date.

**Phase 29 — Exports mode (CSV / JSON / brief).**
- Goal: `exports` mode (`#mode-exports`) — the owner's anchor URL — is the strongest it can be.
- Files: `tracker.html`, `src/tracker/export.js`, `src/config/translations.js`.
- Work: ensure CSV/JSON include `source`, `resolution`, `timezone`, `disclaimer` fields (per the
  flagship prompt); add a human-readable "brief"; preview before download; filenames encode
  currency/karat/unit/range; reference-vs-retail disclaimer embedded.
- Acceptance: exports carry the 4 required metadata fields + disclaimer;
  `tests/tracker-export.test.js` green (extend it to assert the fields).
- Verify: gate green; download + inspect a CSV and JSON.

**Phase 30 — Export share / deep-link surface.**
- Goal: shareable, reproducible export configurations.
- Files: `src/tracker/export.js`, `state.js`.
- Work: a "copy shareable link" that encodes the full hash for the current export config; WhatsApp/
  copy actions reuse the existing toast (no `alert()`).
- Acceptance: shared link reproduces the export view; no native `alert()`.
- Verify: gate green; paste link in a fresh tab → identical config.

**Phase 31 — Method mode deep-link integrity.**
- Goal: `method` mode (`#mode-method`) cleanly bridges to `methodology.html`.
- Files: `tracker.html`, `src/tracker/modes.js`, `src/config/translations.js`.
- Work: ensure the method tab deep-links correctly, preserves `lang`, and explains the
  reference-price derivation inline before handoff.
- Acceptance: link preserves language + context; no dead anchor.
- Verify: gate green; click-through EN + AR.

**Phase 32 — Cross-page deep links (calculator / shops / country).**
- Goal: the Tracker is a hub, not an island (extends WB-102).
- Files: `src/tracker/*`, `src/lib/cross-page-links.js`, `src/config/translations.js`.
- Work: contextual links from the tracker to `calculator.html` (prefilled karat/unit/currency),
  `shops.html?country=`, and the matching country page — each carrying `lang`.
- Acceptance: links prefill target context; `lang` preserved; no orphan CTA.
- Verify: gate green; click-through into calculator + shops.

### Track G — Panels & tools: Alerts, Planner, Watchlist, Inline Calc (Phases 33–38)

**Phase 33 — Alerts panel UX (`panel=alerts`).**
- Goal: the alerts desk (`#tp-alerts-watchlist-panel` / overlay) is clear and reliable.
- Files: `src/tracker/alerts.js`, `tracker.html`, `styles/components/alert-manager.css`,
  `src/config/translations.js`.
- Work: redesign create/list/delete; threshold inputs validated; the alert summary
  (`#tp-alert-summary`) is `aria-live`; respects the 90 s tick wiring in `tracker-pro.js`
  `applyRealtimeSnapshot`; modal a11y (focus trap, ESC, restore focus).
- Acceptance: alert CRUD works; `tests/tracker-alerts.test.js` green; modal a11y correct.
- Verify: gate green; create an alert, trigger via mocked tick.

**Phase 34 — Alert reliability & honesty.**
- Goal: alerts never imply guarantees or fire on stale data silently.
- Files: `src/tracker/alerts.js`, `src/lib/live-status.js` (read), `src/config/translations.js`.
- Work: suppress/flag alert evaluation when freshness is `stale`/`unavailable`; localized
  "evaluated on cached data" note; migrate legacy `gold_price_alerts` cleanly.
- Acceptance: no alert fires as "live" on stale data; migration preserves existing alerts.
- Verify: gate green; stale simulation; legacy-key migration test.

**Phase 35 — Watchlist desk.**
- Goal: `tracker_pro_favorites_v5` watchlist is a first-class panel.
- Files: `src/tracker/watchlist.js`, `tracker.html`, `src/config/translations.js`.
- Work: add/remove currencies, reorder, empty-state; each row shows reference price + freshness.
- Acceptance: watchlist persists + reflects live state; `tests/tracker-watchlist.test.js` green.
- Verify: gate green; add/remove across reload.

**Phase 36 — Planner panel (`panel=planner`).**
- Goal: the planner/estimator overlay (`#tp-overlay-planner-title`) is genuinely useful.
- Files: `src/tracker/planner.js`, `decision.js`, `tracker.html`, `src/config/translations.js`.
- Work: redesign budget/goal estimators using only `price-calculator.js` (no inline math); clear
  "estimate, not advice" framing (no financial-advice tone).
- Acceptance: estimates use the shared calculator; disclaimer present; localized.
- Verify: gate green; cross-check a figure against `calculator.html`.

**Phase 37 — Inline quick-calculator polish.**
- Goal: the embedded calc (`#tracker-inline-calc`) is fast + accurate.
- Files: `src/tracker/inline-calc.js`, `tracker.html`, `styles/pages/tracker-pro.css`.
- Work: tighten layout; result is `role="status" aria-live`; reuses karat factors from config;
  links to the full calculator for advanced needs.
- Acceptance: result matches `price-calculator.js`; a11y live region intact.
- Verify: gate green; numeric parity check.

**Phase 38 — Panel modal system (focus, ESC, scroll-lock, restore).**
- Goal: one consistent, accessible overlay behavior for alerts + planner.
- Files: `src/tracker/ui-shell.js`, `control-shortcuts.js`, `styles/pages/tracker-pro.css`.
- Work: shared focus-trap + ESC-to-close + body scroll-lock + focus restoration; keyboard shortcuts
  (`a`/`p`) open/close without conflict; both panels serialize to the hash `panel=`.
- Acceptance: overlay a11y correct for both panels; `panel` round-trips; shortcuts intact.
- Verify: gate green; keyboard-only open/close both panels.

### Track H — Reliability, data integrity & freshness (Phases 39–43)

**Phase 39 — Live-fetch resilience & race/backoff.**
- Goal: graceful behavior when the price source is slow/down.
- Files: `src/pages/tracker-pro.js` (`applyRealtimeSnapshot`), `src/lib/api.js`, `cache.js`,
  `live-status.js`.
- Work: confirm the parallel-race provider + capped backoff (Motion-Universe phases 1–4) is wired on
  the tracker; on failure, degrade to `cached` state honestly without a hard error; never show a
  blank price.
- Acceptance: simulated source failure → `cached`/`stale` copy, not a crash or false `live`.
- Verify: gate green; offline + slow-network simulation; `tests/e2e-live-freshness.test.js`.

**Phase 40 — Freshness state-machine audit across the page.**
- Goal: every price surface on the tracker agrees on freshness.
- Files: `src/tracker/freshness.js`, `hero.js`, `chart.js`, `compare.js`, `watchlist.js`, `live-status.js`.
- Work: ensure hero, sticky bar, karat table, compare rows, and watchlist all derive state from the
  single `getLiveFreshness()` source; no surface can show `live` while another shows `stale`.
- Acceptance: consistent state everywhere; `tests/freshness-coverage.test.js` +
  `tests/audit-freshness-coverage.test.js` green.
- Verify: gate green; force each state and confirm uniformity.

**Phase 41 — Timezone & timestamp correctness.**
- Goal: timestamps are unambiguous (UTC + local), never misleading.
- Files: `src/tracker/formatting.js`, `freshness.js`, `src/config/translations.js`.
- Work: every visible timestamp shows UTC with an explicit label; localized relative-age strings
  ("3 min ago" / منذ ٣ دقائق) are accurate; export `timezone` field matches.
- Acceptance: timestamps labelled + correct in both languages; export tz consistent.
- Verify: gate green; AR relative-time check.

**Phase 42 — State persistence & migration robustness.**
- Goal: `localStorage` schema (`tracker_pro_state_v5`, `_presets_v5`, `_wire_v5`, `_favorites_v5`) is
  resilient to corrupt/legacy data.
- Files: `src/tracker/state.js`, `archive.js`, `wire.js`.
- Work: defensive parse (try/catch, schema validation, version-aware migration); corrupt data →
  safe defaults, never a broken boot; URL hash still wins per contract.
- Acceptance: corrupt/legacy storage boots to defaults; `tests/tracker-hash.test.js` +
  `tracker-dom.test.js` green.
- Verify: gate green; inject malformed storage and confirm clean boot.

**Phase 43 — Error boundary & telemetry hooks (non-PII).**
- Goal: a failure in one module never blanks the whole workspace.
- Files: `src/pages/tracker-pro.js`, `src/tracker/wire.js`, relevant mounts.
- Work: wrap each mode/panel mount in a guarded init so one throw degrades only that region; log to
  the existing analytics path (no PII, deferred per phase 12 in `PROGRESS.md`).
- Acceptance: a forced throw in one mount leaves the rest functional; no PII logged.
- Verify: gate green; inject a throw in one module.

### Track I — Accessibility, RTL, i18n & motion (Phases 44–47)

**Phase 44 — Full a11y pass (WCAG AA).**
- Goal: keyboard-complete, screen-reader-correct, AA-contrast workspace.
- Files: `tracker.html`, all `src/tracker/*` render paths, `styles/pages/tracker-pro.css`.
- Work: logical tab order; every interactive element labelled; one price live region only; AA
  contrast in light + dark; visible focus everywhere; `aria-busy` lifecycle on
  `#tp-hero-stats`/`#tp-karat-table`.
- Acceptance: `npm run a11y` (pa11y) + axe clean on the tracker; manual SR pass.
- Verify: gate green; `npm run a11y`; `tests/check-basic-a11y` + axe Playwright if wired.

**Phase 45 — RTL completeness (logical properties everywhere).**
- Goal: pixel-correct AR layout at 360 px across every mode/panel.
- Files: `styles/pages/tracker-pro.css`, `tracker-pro-v4.css`.
- Work: convert physical `left/right`, `padding-*`, `text-align:left/right` to logical props,
  **per-rule** (do not blind-sweep `[dir='rtl']` override blocks — the trap called out in STAGED
  phases 19/21); finish what Phase 20 of the prior plan started for the whole tracker.
- Acceptance: no LTR leakage in AR; override blocks preserved; 360 px AR clean for all modes.
- Verify: gate green; AR screenshots every mode at 360.

**Phase 46 — i18n parity & glossary audit.**
- Goal: EN/AR mean exactly the same thing, using approved terms.
- Files: `src/config/translations.js`, `tracker.html`, `docs/en-ar-parity-checklist.md`.
- Work: audit every tracker key pair for semantic parity + glossary compliance (reference price,
  retail quote, making charge, freshness labels); fix any stronger-in-one-language claims.
- Acceptance: parity checklist passes; `tests/translations-freshness.test.js` green; no claim drift.
- Verify: gate green; checklist updated.

**Phase 47 — Motion & reduced-motion system.**
- Goal: motion adds meaning, never nausea; fully reduced-motion safe.
- Files: `styles/pages/tracker-pro.css`, `tracker-pro-v4.css`, `src/tracker/*` (any JS-driven motion).
- Work: audit every animation (freshness pulse, hero transitions, reveals, chart) for a
  `prefers-reduced-motion: reduce` fallback; disable infinite animations under reduced motion
  (closes the spirit of prior phase 18).
- Acceptance: reduced-motion disables all non-essential animation; no infinite loops remain.
- Verify: gate green; emulate reduced-motion; `npm run style`.

### Track J — Performance, SEO, PWA & rollout (Phases 48–50)

**Phase 48 — Performance budget (LCP/CLS/TBT + JS/CSS weight).**
- Goal: the flagship is fast on a mid-tier phone.
- Files: `tracker.html` (critical CSS, defer/lazy), `styles/pages/tracker-pro.css` (prune dead rules
  found in Phase 4), `src/pages/tracker-chart-loader.js` (lazy chart), `lighthouserc.json`.
- Work: inline critical hero CSS; lazy-load chart + non-critical panels; defer analytics (already
  done — verify); prune dead CSS; target LCP < 2.5 s / CLS < 0.1 mobile; consider a tracker
  Lighthouse budget entry.
- Acceptance: Lighthouse mobile meets targets; bundle weight down vs. Phase 1 baseline.
- Verify: gate green; Lighthouse before/after; `npm run build` size check.

**Phase 49 — SEO / metadata / schema integrity for `tracker.html`.**
- Goal: the tracker's canonical, hreflang, OG/Twitter, and schema are correct and honest.
- Files: `tracker.html` head, schema injection path (`scripts/node/inject-schema.js`),
  `src/config/translations.js`.
- Work: verify canonical (`https://goldtickerlive.com/tracker.html`), `hreflang` EN/AR, OG/Twitter
  cards, and any Dataset/WebApplication schema matches visible content + the freshness/reference
  framing (no retail Offer markup); unique intent vs. country/calculator pages.
- Acceptance: `npm run validate` SEO gates green; schema matches visible content; no Offer markup.
- Verify: gate green; `node scripts/node/inject-schema.js --check`; `check-seo-meta`.

**Phase 50 — Service worker, offline & final release readiness.**
- Goal: the tracker degrades gracefully offline and the revamp is release-ready.
- Files: `sw.js` (owner-approval-gated), `offline.html`, `manifest.json`, `PROGRESS.md`, `CHANGELOG.md`.
- Work: ensure tracker assets are in the precache list and the cache version bumps **only if** asset
  URLs changed (owner approval first); confirm offline shows the cached reference price with an honest
  `cached` label; final full-gate run; write the release note + update `PROGRESS.md` + `PLAN.md`.
- Acceptance: offline shows honest cached state; `check-sw-coverage` + `check-sw-precache` green;
  full gate green; release notes written.
- Verify: full gate; offline DevTools test; `tests/freshness.spec` + sw precache tests.

---

## 5. STAGED / owner-decision phases (do not merge to live behavior without sign-off)

Surface these in `OWNER_REVIEW.md` as they arise:

- **Any hash-schema change** (e.g. adding a new mode/panel/param). Frozen contract — needs the change
  procedure + tests + `REVAMP_PLAN.md` §22b entry.
- **`sw.js` cache-version bump / precache list change** (Phase 50). Production-critical, owner-gated.
- **Any new dependency** (e.g. if a charting need can't be met with the existing canvas/SVG code).
  Requires advisory-DB check + owner ask.
- **Deleting/redirecting any page** or changing canonicals/sitemap structure (Phase 49 stays additive
  unless owner approves structural changes).
- **Tab-bar reorder or default-mode change** (frozen IA contract).

If a phase's "best" version requires one of the above, ship the safe version GREEN and stage the rest
with a written plan + risk in `OWNER_REVIEW.md`. Never guess a live trust-critical surface into a
degraded state.

---

## 6. Per-phase PR template (What / Why / How / Proof / Risks)

```md
# Tracker Revamp — Phase NN: <title>

## What
<one line>

## Why
<the gap; link to this plan's Phase NN + REVAMP_PLAN.md section if applicable>

## How
- Commit 1: <concern> — <files>
- Commit 2: <concern> — <files>

## Proof  (verified vs. inferred — be explicit)
- Tests: <pass>/<fail> (was <baseline>) — `npm test`
- Lint/style: `npm run lint` + `npm run style` green
- Validate: `npm run validate` green (DOM-safety baseline unchanged)
- Build/preview: `npm run build` + `npm run preview` OK
- a11y: `npm run a11y` <result>
- Lighthouse mobile: LCP <before>→<after>; CLS <before>→<after>  (if first-paint touched)
- Screenshots: 360 EN, 360 AR, 430 EN <links>
- Contracts: hash round-trip + IA order tests green

## Risks
- <e.g. RTL override blocks — verified per-rule, not swept>

## Follow-ups
- <staged items moved to OWNER_REVIEW.md, if any>
```

---

## 7. Phase tracker (tick as completed)

Track A — Foundation: [ ] 1 · [ ] 2 · [ ] 3 · [ ] 4 · [ ] 5
Track B — Design system: [ ] 6 · [ ] 7 · [ ] 8 · [ ] 9 · [ ] 10
Track C — IA & shell: [ ] 11 · [ ] 12 · [ ] 13 · [ ] 14 · [ ] 15
Track D — Hero / price: [ ] 16 · [ ] 17 · [ ] 18 · [ ] 19 · [ ] 20
Track E — Chart & history: [ ] 21 · [ ] 22 · [ ] 23 · [ ] 24 · [ ] 25
Track F — Modes: [ ] 26 · [ ] 27 · [ ] 28 · [ ] 29 · [ ] 30 · [ ] 31 · [ ] 32
Track G — Panels & tools: [ ] 33 · [ ] 34 · [ ] 35 · [ ] 36 · [ ] 37 · [ ] 38
Track H — Reliability: [ ] 39 · [ ] 40 · [ ] 41 · [ ] 42 · [ ] 43
Track I — a11y / RTL / i18n / motion: [ ] 44 · [ ] 45 · [ ] 46 · [ ] 47
Track J — Perf / SEO / PWA / rollout: [ ] 48 · [ ] 49 · [ ] 50

> Update this checklist and add a `PROGRESS.md` row as each phase merges. Keep the test baseline
> green on every committed phase. When in doubt, re-read §2 (guardrails) before writing code.
