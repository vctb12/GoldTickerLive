# Pricing Truth Checklist

For any change that touches pricing, formulas, freshness, calculator, or tracker price surfaces.

```md
- [ ] Troy-ounce constant `31.1034768` unchanged
- [ ] AED peg `3.6725` unchanged
- [ ] Karat purity factors sourced from `src/config/karats.js` (no inline numbers)
- [ ] Non-UAE country pages convert USD→local FX directly (not via AED)
- [ ] Every visible price has a state label: live / cached / delayed / estimated / fallback / closed
- [ ] Source name + UTC timestamp visible adjacent to every price
- [ ] Reference vs. retail wording explicit (no "today's shop rate" on derived prices)
- [ ] Methodology link present on every page that shows derived prices
- [ ] Calculator output discloses VAT + making charges
- [ ] Historical data declares its resolution (1m/5m/1h/1d/1w)
- [ ] Gaps in historical data are not silently interpolated
- [ ] CSV/JSON exports include source + resolution + timezone + disclaimer
- [ ] If a new provider was added: smoke test + bakeoff entry, not production switch
- [ ] Unit tests for any formula touched
- [ ] `npm test` includes pricing tests and passes
```

See [`.github/instructions/gold-pricing.instructions.md`](../../../instructions/gold-pricing.instructions.md).
