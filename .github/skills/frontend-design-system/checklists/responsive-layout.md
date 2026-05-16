# Responsive Layout Checklist

```md
- [ ] Mobile-first: base styles target 360 px, media queries scale up
- [ ] Breakpoints from existing scale (don't invent new ones)
- [ ] CSS grid / flex layouts use `min-content` / `auto` to prevent overflow
- [ ] Long text wraps gracefully (`overflow-wrap: anywhere` for unbreakable strings like URLs)
- [ ] Tabular numbers use `font-variant-numeric: tabular-nums`
- [ ] Tables → cards on small screens for primary data
- [ ] Sticky elements never overlap their reference content
- [ ] Modals / drawers respect viewport min-height (`100dvh` over `100vh` for mobile browser chrome)
- [ ] Safe-area-insets respected on iOS (`padding-bottom: env(safe-area-inset-bottom)`)
- [ ] No horizontal scroll at 360 px
- [ ] CLS < 0.1 after change (reserve space for async content)
```
