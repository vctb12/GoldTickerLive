# Formula Checklist

```md
- [ ] Troy ounce constant `31.1034768` unchanged
- [ ] AED peg `3.6725` unchanged
- [ ] Karat factors sourced from `src/config/karats.js`:
      24K=1.0000, 22K=0.9167, 21K=0.875, 18K=0.750, 14K=0.5833, 9K=0.375
- [ ] AED price = (XAU/USD ÷ 31.1034768) × 3.6725 × karat factor
- [ ] Local currency price = USD/g × USD→local FX (not via AED)
- [ ] Rounding rule documented and applied consistently (default: 2 decimals for AED, locale for others)
- [ ] No `Math.round(x * 100) / 100` shortcuts that lose precision on edge cases — use `toFixed(2)` for display only, keep raw for export
- [ ] Calculator formula matches tracker / country pages formula (single source of truth in `price-calculator.js`)
- [ ] Unit tests cover: 24K AED gram, 22K AED gram, calculator with VAT + making charge, country page in local currency
- [ ] No new numeric constant added without a comment and a test
```
