# CSS dead-rule report — Phase 10 (report-only)

> Generated: 2026-07-02  
> Source: `reports/cleanup-audit/purgecss.json` (prior audit)  
> Plan: [2026-07-01_20-phase-design-functionality-page-cleanup-revamp.md](../../docs/plans/2026-07-01_20-phase-design-functionality-page-cleanup-revamp.md)

**No selectors removed in this report.** Phase 11 prunes only owner-checked rows.

## Protected classes (never prune)

`data-freshness-pulse`, `flash-up`, `flash-down`, `pulse-dot`, `data-reveal`, `hover-lift`,
`drawer-slide-in`, `live-sonar`, `spot-terminal--live`, `tracker-price-change-strip--*`

## Phase 12 token sweep (partial)

- `styles/pages/tracker-pro.css`: replaced hand-picked `#c9a14d` with
  `var(--color-gold-muted, #c9a14d)` (2 occurrences)

## Next steps (Phase 11)

1. Re-run purgecss against `dist/` build output after `npm run build`
2. Split `tracker-pro.css` into `_shell`, `_hero-terminal`, `_live` partials per 50-phase tracker
   plan
3. Cap ~200 selector removals per PR with visual smoke on home + tracker
