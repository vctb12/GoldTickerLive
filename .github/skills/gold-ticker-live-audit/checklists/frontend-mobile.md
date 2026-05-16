# Frontend / Mobile Checklist

For any HTML / CSS / JS change with a visual or interactive surface.

```md
- [ ] Tokens used from `styles/global.css` (no off-token hex / rem)
- [ ] No new `.card` / `.button` / `.panel` variant without consolidation review
- [ ] Tested at 360 / 390 / 430 / 768 / 1024+ widths
- [ ] Touch targets ≥ 44×44 px
- [ ] Sticky tracker / calculator controls do not occlude content on mobile
- [ ] Tables convert to cards on small screens for primary data
- [ ] One dominant CTA per primary card
- [ ] Numeric content uses tabular-nums
- [ ] All strings via `src/config/translations.js`
- [ ] Tested at `dir="rtl"` — chevrons / arrows / progress mirrored
- [ ] Arabic copy reads naturally (not English-shaped Arabic)
- [ ] `prefers-reduced-motion: reduce` not overridden per-component
- [ ] Animation tokens (`--ease-*`, `--duration-*`) used, not magic values
- [ ] Safe-DOM helpers used (`src/lib/safe-dom.js`) — `check-unsafe-dom` baseline not regressing
- [ ] LCP / CLS / TBT not regressed (run Lighthouse if surface is on a key page)
- [ ] No new runtime npm dependency, or `gh-advisory-database` check + size justification
- [ ] Skip link to `<main>` still works
- [ ] Focus rings visible on every interactive element changed
- [ ] Service worker cache version bumped if cached asset content changed
```

See [`.github/instructions/frontend-mobile.instructions.md`](../../../instructions/frontend-mobile.instructions.md)
and [`.github/instructions/accessibility.instructions.md`](../../../instructions/accessibility.instructions.md).
