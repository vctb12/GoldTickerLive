# Tracker Mobile Checklist (`tracker.html`)

The tracker is the flagship. Treat it as a workspace, not a landing page.

```md
- [ ] Sticky control bar (currency / karat / unit / range) condensed to one row on 360 px
- [ ] Sticky bar does NOT occlude the price card or chart
- [ ] Price card always shows: price + freshness state + source + UTC timestamp
- [ ] Chart legible at 360 px: axis labels readable, tooltips don't overflow
- [ ] Range presets accessible without scrolling
- [ ] Compare / watchlist / alerts entries reachable without nested menus
- [ ] Export buttons (CSV / JSON) discoverable but not dominant
- [ ] Loading state: skeleton + freshness "loading" label, no blank flash
- [ ] Error state: clear message + retry, no raw error text
- [ ] Offline state: cached price with `cached` label + offline.html link
- [ ] Tables → cards on small screens (historical / compare views)
- [ ] All numbers use tabular-nums
- [ ] RTL: chart axis order reversed if appropriate, controls mirrored
- [ ] `aria-live="polite"` on the price card for screen-reader updates
- [ ] No console errors during a price update cycle
```
