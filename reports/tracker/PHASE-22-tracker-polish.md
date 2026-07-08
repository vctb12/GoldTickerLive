# Phase 22 — Tracker page polish, in-place (Track F · Yellow)

Investigated the Live Tracker (`tracker.html`, `src/pages/tracker-pro.js`, `src/tracker/*`,
`styles/pages/tracker*.css`) with two goals: resolve the registered **chart-vs-spot parity** concern
(R-04), and ship concrete, low-risk polish. The tracker is a large, heavily-hydrated, and already
well-built surface — this is a scoped in-place pass, not a rebuild.

## R-04 — chart-vs-spot parity: verified reconciled (no code change)

The concern was that the price **chart** and the live **spot readout** could show inconsistent
values (e.g. chart on the LBMA monthly baseline while the readout shows live gold-api spot). Traced
the data flow and confirmed this divergence **does not exist**:

- **Spot readout** (`#tp-xauusd-value`, `src/tracker/hero.js`) ← `currentSpot()` =
  `state.live.price` (`tracker-pro.js`), set by the realtime snapshot with a
  cache/`api.fetchGoldAndFX()` fallback.
- **Chart** (`#tp-chart`, `src/tracker/chart.js`) body ← `getUnifiedHistory()` (LBMA monthly
  baseline
  - daily reference + local snapshots), but the **rightmost "live tip" is appended from the exact
    same `_currentSpot()` value as the readout** (`chart.js`), so the chart's latest point and the
    readout are the same number by construction.
- **Freshness** for both resolves from one shared `getFreshnessModel()` engine
  (`src/tracker/freshness.js`) — consistent Live/Delayed/Cached/Stale/Closed vocabulary.
- The blend is **already disclosed** in-page: the chart heading copy, the `#tp-chart-source-note`
  (wired via `aria-describedby`), and the methodology caption all state that the series combines
  live/cached/baseline points and that freshness stays visible.

**Conclusion:** R-04 is not a defect — the surfaces are the same source at the tip and the blend is
labeled. Marking it resolved.

_Residual (optional, not fixed):_ a live tick updates the hero readout (`patchHeroLiveTick`) without
rebuilding the SVG chart, so the chart tip can trail the readout by up to one poll interval before
re-converging (same source). A full SVG rebuild every tick has real cost and the captions already
cover the blend, so no change is made; noted for a future perf-vs-freshness decision.

## Concrete fixes shipped

1. **WCAG 2.5.3 "Label in Name" on the "View chart" jump link** — the visible label is `View chart`
   but the accessible name (`aria-label`) was `Jump to the live price chart`, which does **not**
   contain the visible text. Voice-control users saying "click View chart" would fail to activate
   it. Made the accessible name contain the visible label, in all three places that carry it:
   - `src/config/translations.js` — `tracker.actions.jumpChartLabel`, EN
     (`View chart — jump to the live price chart`) and AR
     (`عرض الرسم — الانتقال إلى الرسم البياني المباشر`, containing the AR visible label
     `عرض الرسم`).
   - `tracker.html` — the static `#tp-jump-chart` `aria-label` (first-paint fallback before
     hydration).
   - The JS path (`tracker-pro.js`, `trackerTx('actions.jumpChartLabel')`) picks up the i18n change
     automatically. EN/AR key parity is unchanged (values only), so the i18n guard stays green.

2. **Undefined CSS custom property `--toast-offset-base`** — referenced twice in
   `styles/pages/tracker-pro.css` (the notched-phone toast-stack safe-area rule) but defined
   nowhere. It carried a `46px` fallback so there was no visual breakage, but it was a dead
   reference. Defined `--toast-offset-base: 46px` in the tracker `:root` (with a comment) so both
   references resolve to a real token.

## Verified clean — no change needed (do not "fix")

The audit confirmed the tracker is already solid on the usual defect classes: **no duplicate ids**;
single `<h1>` with a clean, non-skipping heading hierarchy; a **complete, correct ARIA tab system**
(tablist + 5 tabs with `aria-selected`/`aria-controls`, 5 `role="tabpanel"` panels with
`aria-labelledby` + `hidden`, overlay launchers correctly placed outside the tablist as
`role="group"`); **all form controls labeled** via implicit `<label>` wrapping; all icon-only
buttons carry `aria-label`; all decorative SVGs `aria-hidden`; all 18 `#i-*` sprite refs defined;
all 183 `data-i18n*` keys resolve (guarded by `tests/tracker-i18n-key-coverage.test.js`); no dead
same-page anchors; no `<img>` (no missing-alt); no positive `tabindex`. The
`--tp-hero-bg-deep: #0b0b0d` literal matches `--color-bg` but is an intentional namespaced alias —
left as-is.

## Invariants (untouched)

AED peg `3.6725` (`CONSTANTS.AED_PEG`) and troy-oz `31.1034768g` unchanged; every price surface
keeps its spot-linked reference-estimate disclaimer; no owner-gated files touched.

## Gate

`npm run build` + `npm run validate` + `npm test` (incl. tracker i18n coverage) + `npm run lint` —
all green. `scripts/qa/parity-diff-scan.mjs` confirms the edited AR value stays distinct from EN.
