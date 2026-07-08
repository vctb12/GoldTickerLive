# Phase 32 — Metals data-layer foundation, silver pilot (Yellow)

Lays the client-side data-layer so a future phase can add **silver** (then platinum/palladium) to
the tools, **without changing anything about gold**. Foundation only — not wired into any live page
(Phase 33 does the silver UI), and gold's numbers are guaranteed byte-identical.

## `src/config/metals.js`

A single metals registry + one shared pricing formula:

| Metal          | `key`       | Spot symbol | Purities                                  |
| -------------- | ----------- | ----------- | ----------------------------------------- |
| Gold (primary) | `gold`      | **XAU**     | the existing karat table, reused verbatim |
| Silver         | `silver`    | **XAG**     | fine .999, sterling .925, coin .900       |
| Platinum       | `platinum`  | **XPT**     | fine .999, jewellery .950                 |
| Palladium      | `palladium` | **XPD**     | fine .999, jewellery .950                 |

- `metalUsdPerGram(spot, purity)` — the **same expression the gold code already uses**,
  `(spot × purity) ÷ CONSTANTS.TROY_OZ_GRAMS` (31.1035), so gold is byte-identical and every metal
  shares one formula. `usdToAedPerGram()` applies the fixed peg 3.6725.
- Gold's `purities` **are** `KARATS` (mapped, not re-declared) — gold config can't drift.
- Only gold is `primary`; the others are pilots. Helpers: `metalKeys()`, `getMetal()`,
  `PRIMARY_METAL`.
- The module is **not imported anywhere**, so the bundler tree-shakes it out — zero live behaviour
  change. Silver/platinum/palladium exist only as data until a UI phase opts in.

## Byte-identical gold guarantee — `tests/metals.test.js` (8 cases)

The safety property of this phase, made a test:

1. Registry exposes the four metals with the correct spot symbols (XAU/XAG/XPT/XPD).
2. Only gold is `primary`.
3. **Gold purities equal the karat table verbatim** (no drift).
4. **`metalUsdPerGram` is byte-identical** to `(spot × purity) / TROY` across 8 spots × 8 purities.
5. Gold 24K via the registry equals the direct gold gram value.
6. **Immutable constants untouched** — AED peg 3.6725, troy-oz 31.1035.
7. `usdToAedPerGram` applies the peg; rejects non-finite input.
8. `metalUsdPerGram` rejects non-finite input.

## Data-source note (recommend-only — owner-gated)

The plan calls to "verify gold-api.com XAG/XPT/XPD". The registry uses the **standard** spot symbols
(`XAU`/`XAG`/`XPT`/`XPD`) that gold-api.com and the LBMA/LME conventions use. **Actually fetching**
silver/platinum/palladium spot into the site requires the **owner-gated** `gold-price-fetch.yml`
workflow to write additional `data/*_price.json` files (mirroring `gold_price.json`) — that is
untouched here and recommended as an owner change when the silver pilot is greenlit. No external API
was called from this environment, and no owner-gated file was modified.

## Constraints honoured

- Gold maths byte-identical (test-proven); AED peg and troy-oz immutable.
- $0 / no new dependency; module tree-shaken out (no live change).
- No owner-gated files touched (`gold-price-fetch.yml`, etc.).

## Gate

`npm run build` + `npm run validate` + `npm test` (1294 pass, +8) + `npm run lint` — all green.
