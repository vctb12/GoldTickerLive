# Phase 55 — Calculator edge-case fixes (localized numeric input)

**Theme A (trust / data integrity) — final Theme A item.** Extracts the calculator's weight-unit
math into a single tested module and fixes a real edge case: Arabic-UI visitors who type native
numerals currently get **no result**.

## The bug

`pages/calculator.js` reads every weight / amount field with `parseFloat`:

```js
const weightRaw = parseFloat(document.getElementById('val-weight')?.value);
```

`parseFloat` only understands ASCII digits. On the Arabic (RTL) site, a visitor who types native
**Arabic-Indic** numerals (`٠١٢٣٤٥٦٧٨٩`) or **Persian/Urdu** numerals (`۰۱۲۳…`) produces
`parseFloat('١٢') → NaN`, so the calculator silently hides the result — a real failure for the
site's core bilingual audience. `parseFloat('1,000')` is also mis-read as `1` (stops at the
separator).

## What shipped

- **`src/lib/weight-units.js`** — a pure, tested single source of truth for the weight conversions
  (previously inlined in `calculator.js` **and** re-declared again in two test files):
  - `UNIT_TO_GRAMS` (with `oz` from the shared `CONSTANTS.TROY_OZ_GRAMS`, not a duplicate literal),
    `toGrams`, `gramsToUnit`.
  - `parseLocalizedNumber(raw)` — normalizes Arabic-Indic / Persian-Urdu digits, the Arabic decimal
    (`٫`) and thousands (`٬`) separators, and ASCII grouping (commas / spaces), returning a finite
    number or `NaN`. For plain ASCII it is a strict superset of `parseFloat`
    (leading-numeric-prefix).
  - `isPositiveNumber`.
- **`src/config/feature-flags.js`** — `LOCALIZED_NUMERAL_INPUT_ENABLED: false`.
- **`src/pages/calculator.js`** — de-duplicated (`UNIT_TO_GRAMS` / `toGrams` now imported), and all
  **seven** numeric-input reads (value, scrap ×2, zakat, buying-power, converter) routed through a
  single flag-gated `readNumber()` helper.
- **`tests/weight-units.test.js`** — 9 tests importing the **real** module (unit conversions,
  unknown fallback, round-trip, ASCII/parseFloat parity, Arabic-Indic + Persian numerals, thousands
  separators, invalid → NaN).

## Safe by default (flag OFF)

`readNumber()` calls `parseFloat` when `LOCALIZED_NUMERAL_INPUT_ENABLED` is off, so **default
behavior is byte-for-byte the current calculator** — the `parseFloat` → `readNumber` swaps and the
`UNIT_TO_GRAMS`/`toGrams` extraction are behavior-preserving. Flipping the flag on activates
localized-numeral input site-wide on the calculator. No pricing math, constants, or framing touched.

## Owner action

Review the localized-input UX and enable `LOCALIZED_NUMERAL_INPUT_ENABLED` when ready — it lets
Arabic/Persian-numeral and thousands-separated input compute instead of showing a blank result.

## Verification

- `node --test tests/weight-units.test.js` → 9/9 pass
- `npm test` → 1401/1401 pass
- `npm run lint` → clean
- `npm run build` → success (calculator bundle builds with the new imports)
- `npm run validate` → exit 0

---

_This completes **Theme A** (Phases 46–55, trust / data integrity). Next is **Theme B** (Phases
56–65, multi-metal): build fully-wired but feature-flagged OFF, each PR flagged "code-complete,
awaiting owner feed credentials."_
