# Gold Ticker Live — 50-Phase Revamp Progress

- **Branch:** `claude/elegant-cori-lyo379`
- **Baseline:** 1081 tests passing, 0 failing (verified at run start).
- **Legend:** ✅ committed (GREEN) · 🟥 staged only (RED, see `OWNER_REVIEW.md`) · ⏭️ spec only · ↩️
  reverted+logged

| Phase                                                            | Zone  | Status                     | Tests                              | Files                                                         |
| ---------------------------------------------------------------- | ----- | -------------------------- | ---------------------------------- | ------------------------------------------------------------- |
| 01 — Admin RLS lockdown                                          | RED   | 🟥 staged                  | n/a (SQL)                          | `supabase/migrations/002_admin_rls_lockdown.sql`              |
| 02 — Allowlist hardening                                         | RED   | 🟥 staged                  | n/a (docs)                         | `OWNER_REVIEW.md`                                             |
| 03 — Dark-mode fork removed                                      | GREEN | ✅                         | 1081 ✓ (+a11y/contrast, stylelint) | `styles/partials/base.css`, `styles/partials/tokens.css`      |
| 07 — Public-insert RLS hardening                                 | RED   | 🟥 staged                  | n/a (SQL)                          | `supabase/migrations/003_public_insert_hardening.sql`         |
| 04 — Schema integrity (no retail Offer)                          | GREEN | ✅                         | 1081 ✓ (+schema/content checks)    | `scripts/node/inject-schema.js` + ~120 reference HTML         |
| 05 — Sitemap canonical alignment                                 | GREEN | ✅                         | 1081 ✓ (sitemap regenerated)       | `build/generateSitemap.js`                                    |
| 06 — Billing fail-closed                                         | RED   | 🟥 staged                  | 1081 ✓                             | `server/routes/billing.js`                                    |
| 08 — RLS regression assertions                                   | RED   | 🟥 staged                  | n/a (SQL)                          | `supabase/verify.sql`                                         |
| 09 — CSS @import waterfall (dist flatten)                        | GREEN | ✅                         | 1081 ✓                             | `scripts/node/flatten-css.js`, `.github/workflows/deploy.yml` |
| 10 — Inline critical CSS                                         | RED   | 🟥 staged                  | n/a (proposal)                     | `OWNER_REVIEW.md`                                             |
| 11 — Async/self-hosted fonts                                     | RED\* | 🟥 staged (reclassified)   | n/a (proposal)                     | `OWNER_REVIEW.md`                                             |
| 12 — Defer analytics to interaction                              | GREEN | ✅                         | 1081 ✓                             | `assets/analytics.js`                                         |
| 13 — Image pipeline                                              | RED\* | 🟥 staged (reclassified)   | n/a (proposal)                     | `OWNER_REVIEW.md`                                             |
| 14 — Leaflet SRI                                                 | RED\* | 🟥 staged (verify hashes)  | n/a (proposal)                     | `OWNER_REVIEW.md`                                             |
| 15 — Lighthouse gate                                             | RED\* | 🟥 staged (needs baseline) | n/a (proposal)                     | `OWNER_REVIEW.md`                                             |
| 16 — Tracker onboarding EN/AR parity                             | GREEN | ✅                         | 1081 ✓ (eslint, no dangling refs)  | `tracker.html`, `src/pages/tracker-pro.js`                    |
| 18 — Reduced-motion completeness                                 | GREEN | ✅                         | 1081 ✓ (stylelint)                 | `styles/pages/home.css`                                       |
| 23 — 360px GCC grid (verified false-positive; dead code removed) | GREEN | ✅                         | 1081 ✓ (stylelint)                 | `styles/pages/home.css`                                       |

### Queued GREEN phases (not yet executed this run)

Tracked for continuation — all are independent, test-gated, and revertible. Pick up in numeric
order:

- **17** — i18n the tracker's residual hardcoded strings (workspace toggle + ~17 `showToast`
  literals + 2 badge placeholders) via `translations.js` + `trackerTx`.
- **19–21** — RTL logical-property sweeps (home / tracker / shops page CSS).
- **22** — touch-target 44px floor (`.gcc-region-tab` 38px→44px, tracker chips/tabs).
- **24** — tracker mobile label floor (≥13px on sub-0.8rem labels).
- **25** — fix `DESIGN_TOKENS.md` drift + auto-generate from `tokens.css`.
- **26** — stylelint guard: ban raw hex/rgb + off-scale spacing outside tokens.
- **27–28** — bring `invest.css` / `methodology.css` into the token system.
- **29** — consolidate duplicate `prefers-color-scheme` blocks (8 files).
- **30–31** — spacing half-steps + rhythm; breakpoint tokens.
- **32** — homepage hierarchy / section consolidation.
- **33–34** — component-token layer; country/city premium pass.
- **35** — shop card/directory redesign (finish BUILD 7).
- **36–38** — split mega CSS files; semantic section headers; `!important` audit.
- **39–42, 44, 45** — SEO depth: gold-shops stubs noindex/redirect; enrich thin gold-rate pages;
  acronym breadcrumb humanizer (`Uae`→`UAE`); leaf internal links + visible breadcrumbs; expand thin
  content hubs; freshness-language precision.
- **47** — observability: notify-on-failure across workflows. | 43,46,48 — AR path / GDPR /
  automation durability | RED | 🟥 staged | n/a (proposals) | `OWNER_REVIEW.md` | | 49,50 —
  multi-metal / API+portfolio+push | SKIP | ⏭️ spec | n/a | `OWNER_REVIEW.md` | | 17 — Tracker
  toasts/workspace EN/AR i18n | GREEN | ✅ | 1081 ✓ (eslint) | `src/config/translations.js`,
  `src/pages/tracker-pro.js`, `src/tracker/{events,ui-shell}.js`, `tracker.html` |
