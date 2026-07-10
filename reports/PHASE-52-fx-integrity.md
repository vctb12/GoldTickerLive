# Phase 52 — FX-rate integrity pass

**Theme A (trust / data integrity).** A pure, tested sanitizer that stops a corrupted live FX rate
from reaching a displayed price, and enforces the fixed AED peg over any feed value. Feature-flagged
**OFF** until the owner approves enabling it on the live price path.

> **Note on Phase 51.** The planned Phase 51 (cross-source price validation) is being implemented in
> parallel by another session in **PR #593** (`secondary-spot-check.js` +
> `downgradeFreshnessForDivergence`, wiring the Phase 8 cross-validation into the live lane). To
> avoid duplicating that work, this phase moves straight to the next Theme A gap — FX integrity.

## The gap this closes

`price-calculator.js` applies live USD→currency rates like this:

```js
const rate = rates[country.currency];      // straight from the open.er-api.com feed
prices[karat.code][country.currency] = rate ? { gram: base.usdPerGram * rate, … } : undefined;
```

AED is always computed from the fixed `CONSTANTS.AED_PEG` and excluded from the feed — good. But for
every other currency the only guard is `rate ?` (truthiness). So a corrupted feed value — `0`,
negative, `NaN`, or an absurd magnitude from a decimal-place error — flows straight into a displayed
price, and if the feed ever carried an AED rate nothing would flag its drift from the peg.

## What shipped

- **`src/lib/fx-integrity.js`** — pure, side-effect-free.
  - `validateFxRate(rate, { min?, max? })` → `{ ok, reason }`. Rejects non-finite, non-positive, and
    out-of-band values (`FX_RATE_MIN = 1e-4`, `FX_RATE_MAX = 1e7` — every currency the site shows
    sits well inside, from KWD ≈ 0.31 to IRR ≈ 42000).
  - `assessAedPeg(feedAedRate, …)` → `{ present, matchesPeg, peg, feedRate, driftPct }`. Surfaces a
    feed AED that drifts from the peg beyond 0.5%; it never lets the feed override the peg.
  - `sanitizeFxRates(rates, …)` → `{ safe, rejected, aed }`. Drops invalid rates (recording each
    with a reason) so a currency shows **no** price rather than a corrupted one, and always pins
    `safe.AED` to the fixed peg.
  - `isFxIntegrityEnabled()` — reads the owner-gated flag.
- **`src/config/feature-flags.js`** — `FX_INTEGRITY_ENABLED: false`.
- **`tests/fx-integrity.test.js`** — 8 tests (plausible rates pass; corrupted values rejected with
  reasons; AED peg drift flagged but never applied; AED always pinned to the peg; null input).

## Non-authoritative & peg-safe

The sanitizer never invents a rate and never touches the peg/troy math. Its only powers are to
**reject** an untrustworthy feed value and to **pin AED to the fixed peg** — strictly a trust
tightening. A clean feed passes through unchanged.

**Known limitation:** the plausibility band catches gross corruption (0, negatives, NaN, absurd
magnitudes), not a small per-currency magnitude drift within the band — detecting that needs
per-currency historical baselines, which is out of scope here.

## Wiring (owner-gated, not enabled in this PR)

Kept as a small, reviewable, flagged unit — not wired into `price-calculator.js` here. When
approved, enablement is a flag-gated one-liner before `calculateAllPrices` (OFF = current behavior):

```js
import { sanitizeFxRates, isFxIntegrityEnabled } from './fx-integrity.js';
const safeRates = isFxIntegrityEnabled() ? sanitizeFxRates(rates).safe : rates;
const prices = calculateAllPrices(spotUsdPerOz, safeRates, karats, countries);
```

`calculateAllPrices` already omits a currency whose rate is missing, so a dropped rate degrades
honestly to "no price for that currency" rather than a corrupted one.

## Verification

- `node --test tests/fx-integrity.test.js` → 8/8 pass
- `npm test` → 1400/1400 pass
- `npm run lint` → clean
- `npm run build` → success
- `npm run validate` → exit 0

## Owner action

Decide whether to enable `FX_INTEGRITY_ENABLED` and wire the sanitizer into `price-calculator.js`
(snippet above). No credentials or content review required.
