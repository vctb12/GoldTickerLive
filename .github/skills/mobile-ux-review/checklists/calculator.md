# Calculator Mobile Checklist (`calculator.html`)

```md
- [ ] All inputs have proper `inputmode` (`decimal` for grams, `numeric` for karats)
- [ ] Each input has a visible `<label>` (not placeholder-only)
- [ ] Help text uses `aria-describedby`
- [ ] Error states have `aria-invalid` + linked error message
- [ ] Result block always shows: estimated price + state (`estimated`) + methodology link
- [ ] VAT disclosure line present
- [ ] Making-charge disclosure line present
- [ ] "Your shop may charge differently" disclaimer present
- [ ] Result updates do not cause layout shift (`min-height`)
- [ ] Reset button does not silently re-fetch / re-network on every change
- [ ] Primary CTA in lower 2/3 of viewport
- [ ] RTL: number formatting respects locale (Arabic-Indic where applicable)
- [ ] Inputs stack vertically on 360 px (no horizontal squeeze)
- [ ] No console errors during input cycle
```
