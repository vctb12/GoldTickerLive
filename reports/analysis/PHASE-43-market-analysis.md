# Phase 43 — Descriptive market-analysis module (Yellow)

A client-side, **template-based** generator that turns factual gold price data into a plain-language
_description_ — never a forecast, a recommendation, or an invented cause. It mirrors the honesty
rules of the backend `server/services/ai-drafts.js` on the client, and bakes them into a CI guard.

## What shipped

- **`src/analysis/market-analysis.js`**
  - `buildMarketAnalysis(input, { lang })` — from
    `{ price, previous, dayOpen, high, low, rangeDays, timestamp, reason }` produces
    `{ status, headline, sentences[], movement, dataTimestamp, disclaimer }`. Sentences state,
    factually: the current reference price, the change vs the previous reading (with a magnitude
    band), the change vs the Dubai session open, and the reference range.
  - `assertDescriptiveOnly(text)` — throws on forecast/advice vocabulary (`will`, `expected to`,
    `forecast`, `buy`, `sell`, `bullish`, `target price`, …) **and** invented-cause vocabulary
    (`because`, `due to`, `driven by`, …). Exported so callers can validate injected `reason` text.
  - Bilingual (EN/AR); every result — including `unavailable` — carries the spot-linked
    reference-estimate disclaimer.

## The honesty contract (enforced, not just intended)

- **No LLM.** Pure deterministic string templates filled from data.
- **No forecasts / no advice.** It says what the numbers _are_, never what they _will_ do or what to
  _do_ about them. A test runs `assertDescriptiveOnly()` over the full generated output.
- **No invented causes.** It never says _why_ a price moved. A caller may pass `reason`, which is
  rendered with an explicit **"Unconfirmed context, not a stated cause"** label (mirroring the
  backend speculation label) — factual observation only.
- **Magnitude is descriptive.** Bands (`unchanged` → `little changed` → `modest` → `notable` →
  `sharp`) classify |%change| after the fact; they never imply direction of a _future_ move.

## Tests — `tests/market-analysis.test.js` (9)

Unavailable on bad price (still discloses); up / down / unchanged described correctly; magnitude
bands classify by |pct| only; day-open and range sentences appear with the right numbers; the full
generated output passes `assertDescriptiveOnly`; the guard rejects forecasts, advice, and invented
causes; a supplied `reason` renders unconfirmed (no cause words); Arabic localises and the timestamp
is echoed.

## Relationship to existing surfaces

Complements the backend `ai-drafts.js` (editorial drafts, human-reviewed) with an in-page
descriptive summary the Market-insights / tracker surfaces can render. Additive/unimported →
tree-shaken; no page files touched.

## Constraints honoured

$0 / no dependency; no LLM; **no forecasts / predictions** (excluded by policy and by the guard); no
invented causes; reference-estimate framing on every result; additive module only.

## Gate

`npm run build` + `npm run validate` + `npm test` (**1295 pass, +9**) + `npm run lint` — all green.
