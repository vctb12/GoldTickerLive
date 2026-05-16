---
applyTo: "src/**,scripts/**,data/**,tracker.html,calculator.html,methodology.html,countries/**,content/**"
---

# Gold Pricing Instructions

Touching any pricing surface — providers, formulas, freshness, historical data, exports,
calculator, tracker, methodology, country pages — read this file first. Pricing truth is the
single biggest reputational risk for Gold Ticker Live.

## 1. The canonical formula

```text
price_per_troy_ounce_USD     = XAU_USD_spot                              // upstream provider
price_per_gram_USD           = price_per_troy_ounce_USD / 31.1034768
price_per_gram_AED (24K)     = price_per_gram_USD × 3.6725               // fixed AED peg
price_per_gram_AED (karat K) = price_per_gram_AED (24K) × purity_factor[K]
price_per_gram_LOCAL (cur)   = price_per_gram_USD × current_FX(USD→cur)  // not via AED
```

Constants — do not change:

| Constant      | Value          | Why                                                          |
| ------------- | -------------- | ------------------------------------------------------------ |
| Troy ounce → g| `31.1034768`   | International standard; precision-locked                     |
| AED peg       | `3.6725`       | UAE Central Bank fixed peg, USD → AED                        |
| 24K purity    | `1.0000`       | Definition of pure gold                                      |
| 22K purity    | `0.9167`       | 22/24                                                        |
| 21K purity    | `0.8750`       | 21/24                                                        |
| 18K purity    | `0.7500`       | 18/24                                                        |
| 14K purity    | `0.5833`       | 14/24                                                        |
| 9K purity     | `0.3750`       | 9/24                                                         |

Karat purity factors must come from `src/config/karats.js` (single source of truth). Never inline
new numeric karat factors anywhere else.

## 2. Local currency pricing

- Multi-country pages must convert **USD/gram → local currency** using the **current FX rate**, not
  USD → AED → local. AED↔local crossings introduce double rounding and peg distortion.
- FX source must be timestamped and the timestamp must surface in the UI.
- If FX is unknown, fall back to the last known rate **and** label as `fallback`.

## 3. Freshness labels — mandatory states

Every visible price needs a state label. Internal-only / dev-only fields don't.

| State       | Trigger                                              | Label copy                                            |
| ----------- | ---------------------------------------------------- | ----------------------------------------------------- |
| `live`      | Fetched within freshness budget, healthy provider    | `Live · <source> · <UTC time>`                        |
| `cached`    | Service worker / in-memory cache hit                 | `Cached · last updated <time>`                        |
| `delayed`   | Provider lag exceeds threshold (e.g. > 5 min)        | `Delayed · <source>`                                  |
| `estimated` | Spot-derived reference (default for retail surfaces) | `Reference estimate · methodology`                    |
| `fallback`  | Provider failed, previous snapshot served            | `Fallback · last known <UTC time>`                    |
| `closed`    | Market closed window (where the page reflects it)    | `Market closed · resumes <time>`                      |

Implementation notes:

- Use the existing freshness component (`src/components/`-level pill), don't reinvent.
- Stale-without-label is a **trust violation** — equivalent to lying. CI / governance scripts can't
  catch this; reviewers must.

## 4. Reference vs. retail — the bright line

- **Reference / spot-linked / bullion-equivalent**: derived from XAU/USD spot + peg + purity. Not
  what a shop charges.
- **Retail / shop / jewelry**: includes making charges, dealer premiums, VAT, design markups.

Never:

- Label a reference estimate as "shop price" / "today's rate at jewellers".
- Drop the methodology link from a page that shows estimated prices.
- Show a fixed retail premium baked into a "live" price without disclosing it as an assumption.

Calculator output is **always** a reference estimate. Always include:

- VAT line (5% UAE default, disclosed)
- Making charge line (range or % range, disclosed as estimate)
- A "your shop may charge differently" disclaimer

## 5. Historical data

- Time-series data must declare its resolution: `1m` / `5m` / `1h` / `1d` / `1w`.
- Range presets snap to provider-available resolutions, not arbitrary ones.
- Gaps (market closed, provider outage) must be visible — interpolation is forbidden unless
  explicitly labeled `interpolated`.
- Exports (CSV/JSON) must include the source, resolution, timezone (UTC default), and a
  `disclaimer` field.

## 6. Provider rules

- Providers are pluggable adapters. Adding one needs:
  - A smoke test in `.github/workflows/pr-provider-smoke.yml` style
  - A bakeoff scorecard entry (freshness, latency, gap behaviour, cost, terms)
  - A migration note in `docs/gold-price-provider-bakeoff.md`
- Don't switch the production provider in the same PR that adds it.
- Provider keys come from env vars only.

## 7. Common pricing mistakes (do not repeat)

- Using `31.1` instead of `31.1034768` (loses 0.011% precision per gram — cumulative on exports).
- Hard-coding karat factors outside `src/config/karats.js`.
- Crossing AED↔local for non-UAE pages.
- Showing a stale cached price without a `cached` label.
- Removing the methodology link to "clean up" the page.
- Treating a 1-minute cache as "live".
- Calculator that omits VAT or making-charge disclosure.

## 8. Review checklist (paste into PR description for any pricing PR)

```md
- [ ] Constants unchanged or owner-approved (peg, troy-oz, purity factors)
- [ ] Karat factors sourced from `src/config/karats.js`
- [ ] Non-UAE pages use USD→local FX, not via AED
- [ ] Freshness label present + matches state (live/cached/delayed/estimated/fallback/closed)
- [ ] Source name + UTC timestamp visible
- [ ] Reference vs. retail wording unambiguous on every surface
- [ ] Methodology link present on every page that shows derived prices
- [ ] Historical data: resolution declared, gaps not interpolated silently
- [ ] CSV/JSON exports include source + timezone + disclaimer
- [ ] Calculator output disclaims VAT + making charges
- [ ] Unit tests for any formula touched
```

## 9. Tests to run

```bash
node --test tests/price-calculator.test.js  # if present
npm test
npm run validate
```

See [`docs/data-source-methodology.md`](../../docs/data-source-methodology.md),
[`docs/PRICE_API_AND_HISTORY.md`](../../docs/PRICE_API_AND_HISTORY.md),
[`docs/gold-price-provider-bakeoff.md`](../../docs/gold-price-provider-bakeoff.md).
