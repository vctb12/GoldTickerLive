# Phase 37 — Gold-crypto correlation view (Green · model layer, pilot OFF)

Builds the **computation + presentation model** for a descriptive gold-vs-crypto correlation,
layered directly on the Phase 36 plumbing. No live fetch, no chart, no owner-gated files — and the
public entry stays gated OFF until a crypto feed exists. Gold is untouched.

> **Stacks on [#573](https://github.com/vctb12/GoldTickerLive/pull/573) (Phase 36).** This branch is
> cut from the Phase-36 branch because `crypto-assets.js` / `crypto-history.js` are not on `main`
> yet, so the PR is based on the Phase-36 branch to keep the diff to Phase 37's own files.

## Why a model layer and not a live chart

The correlation _view_ needs BTC/ETH history, which needs a price feed — and a feed is owner-gated
territory (a workflow writing `data/crypto/*.json`, mirroring the gold pipeline). Rather than ship a
disconnected UI that renders nothing real, Phase 37 ships the honest, fully-tested brains of the
feature: the math and the view model. When the owner adds a feed and a UI phase flips
`CRYPTO_PILOT_ENABLED`, the chart is a thin render over `buildCorrelationView(...)` — no rework.

## Shipped

- **`src/lib/correlation.js`** — pure, asset-generic math over `{ date, price }` records:
  - `alignSeriesByDate(a, b)` — intersect two dated series on shared dates, ascending, junk dropped.
  - `pearson(xs, ys)` — Pearson coefficient in `[-1, 1]`; returns `null` (not `0`) when undefined
    (fewer than 2 points, length mismatch, or zero variance — a flat line has no correlation).
  - `rollingCorrelation(dates, a, b, window)` — sliding-window coefficients anchored to each
    window's last date; zero-variance windows skipped, not reported as 0.
- **`src/lib/gold-crypto-correlation.js`** — the view model:
  - `computeCorrelationModel(gold, crypto, opts)` — flag-independent core → `ok` /
    `insufficient-data` / `unavailable` (unknown asset), with an overall coefficient, plain-word
    **strength** (negligible→very-strong) and **direction** (together / inverse / no clear link)
    bands, a rolling series, and a bilingual one-line `framing`.
  - `buildCorrelationView(...)` — public entry, **gated behind `CRYPTO_PILOT_ENABLED`**; returns a
    `disabled` state until the pilot is on, then delegates to the core.
  - Both `framing` and a standalone `disclaimer` (EN + AR) carry the descriptive-only wording, so no
    caller can surface a coefficient without it.
- Both modules are **unimported** → tree-shaken out. No behaviour change anywhere.

## Honesty framing (enforced in code, not just docs)

Every returned model — `ok`, `insufficient-data`, `unavailable`, **and** `disabled` — includes a
`disclaimer`: _"Descriptive correlation over the shared dates only — not a prediction, forecast, or
investment signal. Correlation does not imply causation."_ (Arabic equivalent for `lang: 'ar'`.) The
`negligible` band maps to "no clear link" rather than implying a weak signal is meaningful.

## Tests (16 new)

- `tests/correlation.test.js` (8) — perfect +1 / −1, a hand-checked r = 0.5292, all four
  undefined→`null` cases, `[-1,1]` clamp, alignment on shared dates only, and rolling-window shape
  incl. the zero-variance skip.
- `tests/gold-crypto-correlation.test.js` (8) — pilot ships `disabled`; core builds an `ok` model
  (coefficient, strength/direction bands, framing); inverse series classify inverse; too-few-dates
  and flat-series → `insufficient-data`; unknown asset → `unavailable`; Arabic localises
  strength/direction/disclaimer; rolling defaults to a 12-point window.

## Owner-gated dependency (recommend-only)

A live view needs a crypto history feed. Recommendation: an owner-added workflow writing
`data/crypto/btc.json` (+ eth) in the same shape the gold pipeline uses; the Phase-36 normalisers
already turn that into records this module consumes. No fetch or workflow is added here.

## Constraints honoured

Gold untouched; $0 / no dependency; pilot OFF; no owner-gated files modified; no live fetch, no UI
chart; descriptive-only framing enforced in every returned model.

## Gate

`npm run build` + `npm run validate` + `npm test` (**1307 pass, +16**) + `npm run lint` — all green.
