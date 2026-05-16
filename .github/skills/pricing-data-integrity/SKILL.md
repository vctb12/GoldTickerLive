---
name: pricing-data-integrity
description: Use for changes to pricing formulas, providers, historical data, exports, calculator logic, tracker data model, or anything that could affect the trust of the published price.
when_to_use:
  - Editing `src/lib/price-calculator.js`, `src/config/karats.js`, `src/config/constants.js`
  - Adding / swapping a price provider adapter
  - Changing freshness thresholds or cache strategies
  - Editing historical data resolution / aggregation
  - Editing CSV / JSON export shape
related_files:
  - src/lib/price-calculator.js
  - src/config/karats.js
  - src/config/constants.js
  - src/lib/formatter.js
  - src/lib/cache.js
  - src/lib/api.js
  - data/**
  - docs/data-source-methodology.md
  - docs/PRICE_API_AND_HISTORY.md
related_prompts:
  - .github/prompts/pricing-data-audit.prompt.md
  - .github/prompts/provider-bakeoff.prompt.md
---

# Skill: Pricing Data Integrity

Protects the single most reputationally important surface: the published price.

## The non-negotiables

1. Troy ounce constant: `31.1034768`
2. AED peg: `3.6725`
3. Karat factors sourced from `src/config/karats.js`
4. Non-UAE pages: USD → local FX directly
5. Every visible price has a state label
6. Reference price ≠ retail price (calculator output is reference + disclaimers)

## Workflow

1. **Read** `docs/data-source-methodology.md` and `docs/PRICE_API_AND_HISTORY.md`.
2. **Map** the change to formulas, providers, freshness, historical data, or exports.
3. **Identify** affected surfaces (homepage ticker, tracker, calculator, country pages,
   methodology copy, exports, X posts).
4. **Edit** with the [`formulas.md`](./checklists/formulas.md) and
   [`freshness.md`](./checklists/freshness.md) checklists open.
5. **Test** with unit tests (`tests/price-calculator.test.js` style) — add new ones for any new
   constant or branch.
6. **Verify** with `npm test`, `npm run validate`. Manual spot-check the affected pages.

## Checklists in this skill

- [`checklists/formulas.md`](./checklists/formulas.md)
- [`checklists/freshness.md`](./checklists/freshness.md)
- [`checklists/historical-data.md`](./checklists/historical-data.md)
- [`checklists/exports.md`](./checklists/exports.md)

## Common mistakes

- Using `31.1` instead of `31.1034768`.
- Hard-coding karat factors outside `src/config/karats.js`.
- Crossing AED ↔ local on country pages (double rounding).
- Caching a price and serving it as `live`.
- Removing the state label / methodology link to "declutter".
- Calculator omitting VAT / making-charge disclaimers.

See [`.github/instructions/gold-pricing.instructions.md`](../../instructions/gold-pricing.instructions.md).
