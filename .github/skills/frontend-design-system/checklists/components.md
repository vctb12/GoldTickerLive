# Components Checklist

```md
- [ ] New component lives under `src/components/` with a single export
- [ ] Strings via `translations.js`
- [ ] DOM construction via `safe-dom.js` (`el`, `escape`, `clear`, `replaceChildren`)
- [ ] No `innerHTML` writes outside `src/lib/safe-dom.js`
- [ ] CSS scoped (page-specific styles in `styles/pages/`, shared in `global.css`)
- [ ] Props/options documented at the top of the file
- [ ] Default behaviour accessible (keyboard, focus, ARIA where needed)
- [ ] Unit test for any logic the component owns (formatting, validation)
- [ ] Reusable across at least two pages before being called "shared"
- [ ] Removes / consolidates a one-off pattern it replaces (don't add and forget the old)
```
