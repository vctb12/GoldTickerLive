# Open for owner — design feel revamp

Proposals that need logic changes, forbidden-file edits, or cross-cutting automation.

---

## ~~Remove Google Fonts links sitewide~~ — **Done (Area H)**

Self-hosted fonts via `styles/partials/fonts.css`. `scripts/node/strip-google-fonts.js` removed duplicate Google Fonts `<link>` / `preconnect` from **272 HTML shells** (including all 69 city gold-rate pages). Re-run after adding new HTML templates.

---

## ~~Chart Y-axis scale~~ — **Fixed (Area D)**

**Root cause:** When `chart-page.js` called `setCustomData([])` on empty API responses, `_getChartData()` fell through to localStorage spot snapshots (USD/oz ~2800–5600) instead of showing the empty state.

**Fix:** `src/components/chart.js` — treat `_customData !== null` as authoritative (empty array → no data, no snapshot fallback). Regression test: `tests/chart-component.test.js`.

