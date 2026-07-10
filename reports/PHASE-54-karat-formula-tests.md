# Phase 54 — Karat pricing-formula regression lock

**Theme A (trust / data integrity).** A comprehensive test suite that pins the karat pricing formula
against regression across **every** karat, importing the **real** source modules — not inline
copies.

## Why this was needed

The existing `tests/price-calculator.test.js` re-declares the constants and formulas **inline**:

```js
const TROY_OZ_GRAMS = 31.1035;
const AED_PEG = 3.6725;
function usdPerGram(spotUsdPerOz, purity) { … }   // a COPY, not the import
```

So it validates its own copies — if the real `src/lib/price-calculator.js` formula, the troy-oz
divisor, or the AED peg drifted, those tests would still pass. The rest of the repo already loads
ESM via dynamic `import()`, so the inlining was unnecessary and left a genuine coverage hole. This
phase closes it (it does not modify the existing file — the new suite is purely additive).

## What shipped

- **`tests/karat-formula.test.js`** — 9 tests that import the **actual** modules
  (`price-calculator.js`, `karats.js`, `constants.js`, `metal-pricing.js` → `metals.js`) and pin:
  - the immutable constants from source (`31.1035`, `3.6725`);
  - **every** `KARATS` purity is exactly `karat / 24` (24K = 1.0);
  - `usdPerGram = (spot ÷ 31.1035) × purity` and `usdPerOz = spot × purity` for every karat across
    four spot values (exact equality — same multiplication order as the source);
  - per-oz is exactly troy-oz-grams heavier than per-gram; 24K per-oz equals spot;
    `AED = USD × peg`;
  - price is **strictly monotonic** in purity;
  - falsy guards return `0` / `null`;
  - `calculateAllPrices` behaviour: **AED always from the peg, never the feed** (a bogus `rates.AED`
    is ignored), USD passthrough, feed currencies applied, and a **missing rate → honest `null`**
    (never a fabricated price); `{}` for falsy spot/rates;
  - **coupling lock:** `price-calculator` (which reads `KARATS`) and `metal-pricing` (which reads
    gold purities from `metals.js`) agree on USD/g and AED/g for gold across every karat — so if the
    two purity sources ever diverge, a test fails. (Compared within `1e-9` because the two modules
    multiply in a different order: `(spot ÷ TROY) × purity` vs `(spot × purity) ÷ TROY`.)

## Scope

Test-only — no source change. The formula and constants were already correct; this phase makes any
future regression in them **loud**. No feature flag, no owner-gated files, no framing changes.

## Verification

- `node --test tests/karat-formula.test.js` → 9/9 pass
- `npm test` → 1401/1401 pass
- `npm run lint` → clean
- `npm run build` → success
- `npm run validate` → exit 0

## Owner action

None.
