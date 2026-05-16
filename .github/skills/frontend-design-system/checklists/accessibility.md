# Design System Accessibility Checklist

A condensed subset of `accessibility.instructions.md` for design-system work.

```md
- [ ] Color contrast: body 4.5:1, large 3:1, UI 3:1
- [ ] Focus rings visible (`:focus-visible`) and color-contrast compliant
- [ ] All interactive elements have an accessible name (label, aria-label, or text)
- [ ] Reduced motion respected (global reset in `global.css` — don't override per-component)
- [ ] Semantic HTML used (`<button>` for buttons, `<a>` for links)
- [ ] ARIA only where native semantics don't suffice
- [ ] `prefers-color-scheme` respected if introducing a new themed element
- [ ] Hit targets ≥ 44×44 px
- [ ] Form controls have associated `<label>`
- [ ] Live regions use the right politeness (`polite` default, `assertive` for errors only)
```
