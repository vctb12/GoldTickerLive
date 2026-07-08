# Phase 18 — Global shell & navigation (Track E)

Verified the shared shell: nav search, header/footer, skip-links, and the internal-linking surfacing
Phase 13 routed here (L-2). **All already implemented and working — verified behaviorally, no change
needed.**

## Nav search icon → bilingual search — wired & working ✅

`src/components/nav.js` renders `#nav-search-btn` → `#nav-search-overlay` / `#nav-search-input` /
`#nav-search-dropdown`, lazy-imports `src/search/searchEngine.js`, queries on input, and renders
results. Behavioral proof (headless Chromium against the built `dist/`):

| Query        | Locale          | Overlay opened | Results |
| ------------ | --------------- | -------------- | ------: |
| `calculator` | EN              | ✅             |       1 |
| `ذهب` (gold) | AR (`?lang=ar`) | ✅             |      10 |

So the search icon is wired to the existing **bilingual** search (Arabic query returns
Arabic-indexed results). Also triggerable by `/` and `Ctrl/Cmd+K` (per `nav.js`).

## Header / footer / skip-link consistency ✅

- **Skip-link** present on every page (verified `#tracker-app` on tracker; `#main-content`
  elsewhere); `npm run validate`'s shell-guard confirms 16 top-level pages share one nav/footer with
  no duplicate shell markup and 7-surface nav coverage.
- **Footer** is rendered once from `NAV_DATA.groups` (same source as the nav — no divergence).

## Phase 13 L-2 — resolved (portfolio/heatmap are footer-surfaced) ✅

The Phase-13 audit flagged portfolio/heatmap as thin on **static-HTML** inbound links. Behavioral
check shows the JS-injected footer on tracker carries **4 portfolio** and **4 heatmap** links — they
are the 3rd item in their nav-data groups, so the footer's 3-per-section rail includes them, and
they are linked from **every** page's footer + nav. The Phase-13 count undercounted because
nav/footer are injected at runtime, not present in the static HTML. **L-2 needs no code change.**

## Phase 13 L-3 (market.html inbound) — minor, deferred

`market.html` ("How Gold Is Priced", 4 inbound) is in the nav mega-menu but below the footer's
3-per-section cut. Surfacing it would mean reordering `nav-data` (which also reorders the visible
nav) or raising the footer cap (more links everywhere) — a nav-IA design choice, not a bug, so it's
left for an intentional nav-IA pass rather than changed blindly here.

## Verification

`npm run validate` (shell-guard + a11y gates) / `npm test` green; Playwright confirms nav search
EN+AR, footer links, and skip-link. No code changed.
