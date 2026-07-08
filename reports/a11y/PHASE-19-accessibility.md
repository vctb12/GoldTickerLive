# Phase 19 — Accessibility conformance (Track E · Green)

Automated WCAG 2.0/2.1 **A + AA** audit of the ten key page templates in both light and dark themes,
using an offline axe-core harness. This phase ships the **safe, structural** fixes that eliminate
two entire rule families site-wide and **registers** the remaining colour-contrast work (which is
token/brand-level and needs both-theme sign-off) as a scoped follow-up.

## Harness — `scripts/qa/a11y-axe.mjs` (`npm run … node scripts/qa/a11y-axe.mjs`)

- Loads each page from the built `dist/` in headless Chromium, injects `axe-core@4.12.x`, and runs
  the `wcag2a` + `wcag2aa` + `wcag21aa` rule set. Contrast is theme-dependent, so every page is
  audited under `colorScheme: 'light'` **and** `'dark'` (20 page×theme runs total).
- **CodeQL-safe file serving** (same pattern as the console + perf runners): the local server
  resolves each request against an **in-memory `Map`** built from `dist/` — `req.url` only ever
  indexes the Map, never reaches an `fs` call. `--serve` is an allowlist, `OUT_DIR` is constant,
  `--stamp` is charset-restricted.
- Writes `reports/a11y/axe-<stamp>.{json,md}`. Fully local, no external network.

Run it after a build (assets/data staged into `dist/` the way `deploy.yml` does):

```
npm run build && cp -r assets/. dist/assets/ && cp -r data/. dist/data/ && cp -f favicon.svg manifest.json dist/
node scripts/qa/a11y-axe.mjs --stamp <label>
```

## Baseline → after

| Metric                           | Baseline (`axe-2026-07-07.md`) | After fixes (`axe-2026-07-07-after.md`) |
| -------------------------------- | -----------------------------: | --------------------------------------: |
| Total violation nodes (20 runs)  |                        **144** |                                  **56** |
| `link-in-text-block` [serious]   |          84 nodes (every page) |                      **0 — eliminated** |
| `aria-prohibited-attr` [serious] |             2 nodes (learn ×2) |                      **0 — eliminated** |
| `color-contrast` [serious]       |                       58 nodes |         56 nodes → **registered below** |

The two rules this phase targets are gone across **all** pages and both themes. The residual delta
is entirely `color-contrast`.

## Fixes shipped this phase

1. **`link-in-text-block` (84 → 0)** — inline links inside text blocks were distinguished by colour
   only (WCAG 1.4.1). Added `text-decoration: underline` to the three affected inline-link families:
   - `styles/partials/components.css` — `.footer-sources a` and `.footer-copy a` (footer inline
     links: terms, privacy, methodology, Gold-API attribution — present on **every** page → 80 of
     the 84 nodes).
   - `styles/pages/calculator.css` — new `.calc-disclaimer a` rule (calculator body links: "Spot vs
     retail explained", "Full methodology", "What is a making charge?" — the remaining 4 nodes).
2. **`aria-prohibited-attr` (2 → 0)** — the learn-article icon wrapper carried `aria-label` on an
   element with no role, which ARIA prohibits. Added `role="img"` in **both** render paths so the
   client-rendered and static-fallback DOM match:
   - `src/learn-hub/article-renderer.js` (client renderer, the
     `<div class="learn-hub-article-icon">`).
   - `scripts/node/render-learn-static-fallback.mjs` (static generator) → regenerated `learn.html`
     (the `<span class="learn-hub-article-icon">`).

All four edits are additive CSS/attribute changes — no layout, copy, or behaviour change.

## Registered follow-up — colour-contrast (56 nodes, `serious`)

Not fixed here on purpose: every remaining failure is the **brand-gold accent used as text**, or an
inline-`code` swatch. Darkening those touches shared design tokens and must be verified against both
themes and the brand palette — a dedicated contrast-remediation pass, not a one-page tweak. Grouped
by root cause (measured contrast vs. required):

| Root cause                                      | Sample selectors                                                                                                                                         | Measured  | Needs | Pages affected                         |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ----- | -------------------------------------- |
| Gold accent on light `#b07d1f` / `#a0671c`      | `tr > th[scope=row] > strong`, `.method-source-card-name`, `.edu-table … .edu-…`, `.edu-card-title`, `#shops-info-title`, `.shops-resource-chip--submit` | 3.38–4.36 | 4.5:1 | methodology, compare, shops, portfolio |
| Gold accent on dark `#966a1a`                   | `#calc-value-title`, `#val-mode-weight`, `#gcc-tab-gcc`                                                                                                  | 3.49–4.01 | 4.5:1 | calculator (dark), home (dark)         |
| Inline `code` `#ddb040 on #d9cfb6`              | `li > code`, `#fx-rates-update-p > code`, `#tier-3-desc > code`                                                                                          | **1.3**   | 4.5:1 | methodology (worst — 11 nodes)         |
| Decorative display heading `#f0edd8 on #fefdf9` | `#method-h1`                                                                                                                                             | 1.15      | 3:1   | methodology                            |
| Active insights chip `#1a1305 on #976c1b`       | `.insights-chip--active > .insights-chip-count`                                                                                                          | 3.92      | 4.5:1 | learn                                  |

Recommended remediation (follow-up phase): introduce an **AA-safe accent-on-surface** token pair (a
darker gold for text-on-light and a lighter gold for text-on-dark) and repoint these selectors at
it; treat the methodology inline-`code` swatch and `#method-h1` display heading as their own token
fixes. Verify with `node scripts/qa/a11y-axe.mjs` under both themes before/after.

## Gate

`npm run validate` + `npm test` green; `npm run build` green (CSS + JS + generated `learn.html`
touched). Re-ran the axe harness post-fix to confirm `link-in-text-block` and `aria-prohibited-attr`
are at zero across all 20 page×theme runs.
