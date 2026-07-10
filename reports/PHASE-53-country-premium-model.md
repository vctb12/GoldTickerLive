# Phase 53 — Country / local retail-premium model

**Theme A (trust / data integrity).** Documents how the site's spot-linked **reference** estimate
relates to real per-country **retail** prices, and centralizes the illustrative premium math into a
pure, tested, honestly-framed module.

## The model

The site displays a **reference** gold value:

```
reference = spot(XAU/USD) ÷ 31.1035 (troy oz → gram) × karat purity × FX   (AED via the fixed 3.6725 peg)
```

Real **retail** gold costs more than reference. Two premiums sit on top:

1. **Making charge** — the jeweller's labour/design margin. Highly variable by product (plain band
   vs. intricate design), shop, and country. The site already cites a **5–25%** illustrative band in
   the FAQ, and `ShopVsReferencePanel` renders exactly that band.
2. **VAT / sales tax** — a public per-jurisdiction fact, but its _application to gold_ is nuanced:
   e.g. the UAE levies **5% VAT** on jewellery and making charges, while investment-grade bullion (≥
   99% purity, with a tax invoice) is commonly **zero-rated**. Other countries differ widely.

```
retail ≈ reference × (1 + makingCharge)  + VAT (where it applies)
```

## Why no fabricated per-country table

On a reference site, inventing precise per-country making charges would be a trust defect — they are
not authoritative facts and vary too much to assert. So this module **does not** ship a table of
made-up premiums. Instead it is a _parameterized_ calculator: premium inputs are caller-supplied,
the defaults are the already-published 5–25% band, and VAT defaults to 0 (off) so the default output
reproduces the existing panel exactly. Real per-country VAT rates remain an **owner/editorial
decision** to supply, documented rather than guessed.

## What shipped

- **`src/lib/retail-premium-model.js`** — pure, side-effect-free.
  - `buildRetailPremiumBand({ referenceLocal, currency?, makingLow?, makingHigh?, vatRatePct?, vatOnMakingOnly?, decimals? }, { lang? })`
    →
    `{ status, currency, referenceLocal, low, high, band, makingLow, makingHigh, vatRatePct, disclaimer }`.
    Computes `retailPreVat = reference × (1 + making)`, then optional VAT on the full retail or the
    making charge only. Invalid input (reference ≤ 0, `makingLow > makingHigh`, VAT > 100%) →
    `status: 'unavailable'` (no fabricated band). Defaults: making 0.05–0.25, VAT 0.
  - `renderRetailPremiumBand(model, { lang? })` — human-readable render; carries the disclaimer even
    when unavailable.
- **`tests/retail-premium-model.test.js`** — 7 tests (default band reproduces the panel; VAT on full
  retail; VAT on making only; custom band; invalid → unavailable; EN/AR framing + render).

## Framing preserved

Every band carries: _"Illustrative retail band … actual shop prices vary … not retail pricing and
not financial advice"_ (EN + AR). The module never touches the spot/peg/troy math or the displayed
reference price — it only layers an explicitly-labelled illustrative premium on top.

## Adoption (documented, not wired)

`ShopVsReferencePanel` currently inlines `referenceLocal * (1 + MAKING_LOW/HIGH)`. It can adopt this
module for a single source of truth (and gain optional VAT) without changing the default output:

```js
import { buildRetailPremiumBand } from '../lib/retail-premium-model.js';
const band = buildRetailPremiumBand({ referenceLocal, currency, decimals });
// band.low / band.high are the same 5–25% values the panel renders today.
```

## Verification

- `node --test tests/retail-premium-model.test.js` → 7/7 pass
- `npm test` → 1399/1399 pass
- `npm run lint` → clean
- `npm run build` → success
- `npm run validate` → exit 0

## Owner action

Optional: supply real per-country VAT rates (and any country-specific making-charge guidance) if the
band should become country-aware — the model accepts them as parameters. No credentials required.
