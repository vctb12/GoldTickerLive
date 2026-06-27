# Open for owner — design feel revamp

Proposals that need logic changes, forbidden-file edits, or cross-cutting automation — **not implemented** by the presentation-layer agent.

---

## Remove Google Fonts links sitewide (follow-up to Area A)

**Context:** Area A self-hosts Source Sans 3 + Cairo via `styles/partials/fonts.css` (loaded through `global.css`). The homepage (`index.html`) now preloads self-hosted woff2 and no longer loads Google Fonts.

**Issue:** ~390 HTML shells still include:

```html
<link href="https://fonts.googleapis.com/css2?family=Cairo:..." rel="stylesheet" />
```

This duplicates font downloads (self-hosted + CDN) on most pages.

**Proposed fix:** One of:

1. Build-time script to strip Google Fonts `<link>` / `preconnect` from all HTML templates, or
2. Shared head partial injected by `site-shell.js` / Vite HTML transform.

**Owner decision:** Whether to batch-edit HTML in one PR or add a generator step.

---

## Chart Y-axis scale (Area D — may be data logic)

**Context:** Audit screenshot shows chart Y-axis ~2800–5600 while live cards show ~483 AED/g.

**Issue:** May be unit mismatch in `src/components/chart.js` / historical data binding — not purely CSS.

**Proposed fix:** Owner review of chart data pipeline before visual theming.
