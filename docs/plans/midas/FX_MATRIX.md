# Operation Midas — Phase 8: FX Layer Verification Matrix

_Date: 2026-07-16 · Branch: `claude/operation-midas-goldtickerlive-6b32h3` · Tests:
`tests/midas-fx-matrix.test.js` (15 tests)_

## Scope and method

Read-verification of the client FX layer: `src/lib/api.js` (`fetchFX`),
`src/lib/price-calculator.js` (`calculateAllPrices`, `localPrice`), `src/lib/fx-integrity.js`
(`sanitizeFxRates`), `src/lib/live-status.js` (`getFXFreshness`, `FX_MARKET`), and
`src/config/countries.js`. Every "verified" cell below is locked by a named test in
`tests/midas-fx-matrix.test.js`.

## How a currency gets a price (the actual pipeline)

1. `fetchFX()` (`src/lib/api.js:251`) fetches `CONSTANTS.API_FX_URL`
   (`https://open.er-api.com/v6/latest/USD`), validates that `data.rates` is an object, **deletes
   `AED` from the payload**, and returns `{ rates, time_last_update_utc, …, source: 'live' }`. On
   failure it falls back to the localStorage cache (`source: 'cache-fallback'`), else throws.
2. `calculateAllPrices()` (`src/lib/price-calculator.js:57`) computes USD from spot and AED from
   `CONSTANTS.AED_PEG` (3.6725) directly — never from `rates` — then applies `rates[currency]` for
   every other country behind a truthiness check: missing/0/NaN rate ⇒ `null` (no price), any truthy
   rate ⇒ applied as-is.
3. Formatters (`formatPrice` / `formatCurrency`, `src/lib/formatter.js`) render `null` / `NaN` as
   the honest `—` placeholder.
4. FX freshness: `getFXFreshness()` (`src/lib/live-status.js:278`) labels FX `stale` past
   `FX_MARKET.FX_STALE_AFTER_MS` = **26 h** (feed updates ~24 h), `cached` on cache-served data
   inside the window, `unavailable` with `—` when no timestamp exists. Stale wins over cached.

## AED peg precedence (verified — three independent layers)

| Layer                         | Mechanism                                                  | Test                                     |
| ----------------------------- | ---------------------------------------------------------- | ---------------------------------------- |
| `fetchFX()`                   | `delete rates.AED` before the payload leaves the API layer | `fetchFX() strips AED from the feed…`    |
| `calculateAllPrices()`        | AED computed from `CONSTANTS.AED_PEG`; loop skips AED      | `…prices AED from the exact 3.6725 peg…` |
| `sanitizeFxRates()` (unwired) | `safe.AED = peg` always; feed drift flagged/rejected       | `sanitizeFxRates() always forces AED…`   |

Even a hostile payload carrying `AED: 9.99` cannot reach a displayed AED price on any path.
`page-hydrator.js:217` (`getCountryFxRate`) also short-circuits AED to the peg (read-verified, not
unit-tested — it imports DOM helpers).

## Currency matrix (28 configured currencies — not ~40)

Source legend: **base** = USD spot itself, **peg** = fixed 3.6725, **feed** = `open.er-api.com`
USD-base rate. Failure behavior legend: **null→—** = missing/falsy rate degrades to `null` and
renders `—` (verified by the empty-payload sweep test for every feed currency); **flows through** =
a truthy corrupt rate (negative, absurd) is applied verbatim today (gap, see below).

| Currency | Country (group)         | Source | Decimals         | Missing-rate behavior                                    | Corrupt-rate behavior                           |
| -------- | ----------------------- | ------ | ---------------- | -------------------------------------------------------- | ----------------------------------------------- |
| AED      | UAE (gcc)               | peg    | 2                | n/a — never feed-derived (verified)                      | n/a — peg wins (verified)                       |
| USD      | United States (global)  | base   | 2                | n/a — never feed-derived (verified, fixed this phase)    | n/a                                             |
| SAR      | Saudi Arabia (gcc)      | feed   | 2                | null→— (verified)                                        | flows through if truthy (verified gap)          |
| KWD      | Kuwait (gcc)            | feed   | 3                | null→— (verified)                                        | flows through if truthy (UNTESTED per-currency) |
| QAR      | Qatar (gcc)             | feed   | 2                | null→— (verified)                                        | UNTESTED per-currency                           |
| BHD      | Bahrain (gcc)           | feed   | 3                | null→— (verified)                                        | UNTESTED per-currency                           |
| OMR      | Oman (gcc)              | feed   | 3                | null→— (verified)                                        | UNTESTED per-currency                           |
| JOD      | Jordan (levant)         | feed   | 3                | null→— (verified)                                        | absurd 1e9 flows through (verified gap)         |
| LBP      | Lebanon (levant)        | feed   | **0** (verified) | null→— (verified)                                        | UNTESTED per-currency                           |
| IQD      | Iraq (levant)           | feed   | 0 (verified)     | null→— (verified)                                        | UNTESTED per-currency                           |
| SYP      | Syria (levant)          | feed   | 0 (verified)     | null→— (verified)                                        | UNTESTED per-currency                           |
| ILS      | Palestine (levant)      | feed   | 2                | null→— (verified)                                        | UNTESTED per-currency                           |
| YER      | Yemen (levant)          | feed   | 0 (verified)     | null→— (verified)                                        | UNTESTED per-currency                           |
| EGP      | Egypt (africa)          | feed   | 2 (verified)     | null→— (verified); NaN→null (verified)                   | UNTESTED per-currency                           |
| LYD      | Libya (africa)          | feed   | 3                | null→— (verified)                                        | UNTESTED per-currency                           |
| TND      | Tunisia (africa)        | feed   | 3                | null→— (verified)                                        | UNTESTED per-currency                           |
| DZD      | Algeria (africa)        | feed   | 2                | null→— (verified)                                        | UNTESTED per-currency                           |
| MAD      | Morocco (africa)        | feed   | 2                | null→— (verified)                                        | UNTESTED per-currency                           |
| SDG      | Sudan (africa)          | feed   | 2                | null→— (verified)                                        | UNTESTED per-currency                           |
| SOS      | Somalia (africa)        | feed   | 0 (verified)     | null→— (verified)                                        | UNTESTED per-currency                           |
| MRU      | Mauritania (africa)     | feed   | 2                | null→— (verified)                                        | UNTESTED per-currency                           |
| DJF      | Djibouti (africa)       | feed   | 0 (verified)     | null→— (verified)                                        | UNTESTED per-currency                           |
| KMF      | Comoros (africa)        | feed   | 0 (verified)     | null→— (verified)                                        | UNTESTED per-currency                           |
| TRY      | Turkey (global)         | feed   | 2 (verified)     | null→— (verified); negative→flows through (verified gap) | verified gap                                    |
| PKR      | Pakistan (global)       | feed   | 0 (verified)     | null→— (verified)                                        | UNTESTED per-currency                           |
| GBP      | United Kingdom (global) | feed   | 2                | null→— (verified)                                        | UNTESTED per-currency                           |
| EUR      | Eurozone (global)       | feed   | 2                | null→— (verified)                                        | UNTESTED per-currency                           |
| INR      | India (global)          | feed   | 2                | null→— (verified)                                        | UNTESTED per-currency                           |

Corrupt-rate behavior is structural, not per-currency — the verified SAR/EGP/TRY/JOD cases cover
every corruption class (0, NaN, negative, absurd) for the shared code path; "UNTESTED per-currency"
means no dedicated per-currency corrupt fixture, not an unknown behavior.

## Staleness (verified)

- `FX_MARKET.FX_STALE_AFTER_MS` = exactly 26 h (`src/lib/live-status.js:44`).
- 27 h-old FX ⇒ `stale`; 25 h ⇒ `live`; cache-served 2 h ⇒ `cached`; 30 h cache-served ⇒ `stale`
  (stale beats cached — labels only degrade); no timestamp ⇒ `unavailable` + `—`.

## Gap: fx-integrity sanitizer is NOT wired (owner-gated)

`sanitizeFxRates()` has **zero importers in `src/`** — only tests import it. It is deliberately
gated behind `FEATURE_FLAGS.FX_INTEGRITY_ENABLED` (default `false`,
`src/config/feature-flags.js:37`, "OFF until the owner approves enabling it on the live price
path"). Consequence today: a **truthy** corrupt feed rate (negative, decimal-place error like `1e9`)
flows verbatim into displayed prices; only falsy corruption (0, NaN) degrades to `null`. Both
behaviors are locked by the `GAP LOCK` test so any silent change trips CI.

**Recommended wiring site (owner decision, not done in this phase):** in `fetchFX()`
(`src/lib/api.js`), immediately after `delete rates.AED` (line ~263) and on the cache-fallback
branch (line ~279):

```js
if (isFxIntegrityEnabled()) rates = sanitizeFxRates(rates).safe;
```

Wiring at the fetch layer covers all eight consumers (home, invest, calculator, compare,
tracker-pro, heatmap, portfolio, page-hydrator) at once. Not done here: it is more than one line
(two branches + import + flag flip is an owner call).

## One-line src fix made this phase

`src/lib/price-calculator.js` country loop now skips `USD` as well as `AED`. Before, a rates payload
without a `USD` key (possible on degraded cache payloads; the live feed carries `USD: 1`)
**overwrote the pre-computed base USD price with `null`**, hiding a price that never depended on FX
at all. Locked by test `every configured currency missing from an empty payload…` (asserts USD and
AED stay priced when the feed is empty).

## Honesty note: LBP / EGP official-vs-street rates (followup for copy phase)

`open.er-api.com` publishes **official/interbank** rates. For LBP (and historically EGP), the
street/parallel market rate can diverge materially from the official rate, so a "gold price in LBP"
derived from the official rate may not match what a Beirut shop actually quotes. SYP and SDG share
this risk. No page copy was changed in this phase; recommended disclaimer line for the copy phase
(needs `src/config/translations.js` EN+AR in the same commit when adopted):

- **EN:** "Converted at the official exchange rate; local market (street) rates may differ
  significantly."
- **AR:** "محوَّل بسعر الصرف الرسمي؛ قد تختلف أسعار السوق المحلية (الموازية) بشكل كبير."

Suggested placement: country pages and calculator for LBP, SYP, SDG (always) and EGP (while the
official/parallel spread persists).

## Followups (out of scope for phase 8)

1. Owner decision: flip `FX_INTEGRITY_ENABLED` and wire `sanitizeFxRates` into `fetchFX()` (both
   branches) — closes the truthy-corrupt-rate gap.
2. Copy phase: ship the LBP/EGP/SYP/SDG official-rate disclaimer (EN+AR above).
3. Consider surfacing `getFXFreshness` on every page that shows converted prices (page-level audit
   of who actually calls it was not part of this phase).
