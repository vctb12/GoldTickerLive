# RTL Mobile Checklist

For Arabic / RTL parity across any changed surface.

```md
- [ ] `<html lang="ar" dir="rtl">` on the AR variant
- [ ] All strings via `src/config/translations.js` — no hard-coded English
- [ ] Arabic copy reads naturally — not English word-for-word
- [ ] Chevrons / arrows / progress bars mirrored
- [ ] Number formatting via `Intl.NumberFormat` (Arabic-Indic where appropriate)
- [ ] Currency placement correct (AED before/after per locale)
- [ ] Inline icons that imply direction (e.g. external link, back) mirrored
- [ ] Form labels right-aligned (or visually consistent with RTL convention)
- [ ] Sticky controls + drawers tested at 360 px RTL
- [ ] Hreflang pair present in `<head>` (`ar` + `en` + `x-default`)
- [ ] No layout shift caused by AR copy being longer than EN
- [ ] Tabular numbers still tabular in AR
- [ ] Screen-reader switches voice on inline language change (`<span lang>` used correctly)
```
