# Gold Ticker Live — 50-Phase Revamp Progress

- **Branch:** `claude/elegant-cori-lyo379`
- **Baseline:** 1081 tests passing, 0 failing (verified at run start).
- **Legend:** ✅ committed (GREEN) · 🟥 staged only (RED, see `OWNER_REVIEW.md`) · ⏭️ spec only · ↩️
  reverted+logged

| Phase                                     | Zone  | Status                   | Tests                              | Files                                                         |
| ----------------------------------------- | ----- | ------------------------ | ---------------------------------- | ------------------------------------------------------------- |
| 01 — Admin RLS lockdown                   | RED   | 🟥 staged                | n/a (SQL)                          | `supabase/migrations/002_admin_rls_lockdown.sql`              |
| 02 — Allowlist hardening                  | RED   | 🟥 staged                | n/a (docs)                         | `OWNER_REVIEW.md`                                             |
| 03 — Dark-mode fork removed               | GREEN | ✅                       | 1081 ✓ (+a11y/contrast, stylelint) | `styles/partials/base.css`, `styles/partials/tokens.css`      |
| 07 — Public-insert RLS hardening          | RED   | 🟥 staged                | n/a (SQL)                          | `supabase/migrations/003_public_insert_hardening.sql`         |
| 04 — Schema integrity (no retail Offer)   | GREEN | ✅                       | 1081 ✓ (+schema/content checks)    | `scripts/node/inject-schema.js` + ~120 reference HTML         |
| 05 — Sitemap canonical alignment          | GREEN | ✅                       | 1081 ✓ (sitemap regenerated)       | `build/generateSitemap.js`                                    |
| 06 — Billing fail-closed                  | RED   | 🟥 staged                | 1081 ✓                             | `server/routes/billing.js`                                    |
| 08 — RLS regression assertions            | RED   | 🟥 staged                | n/a (SQL)                          | `supabase/verify.sql`                                         |
| 09 — CSS @import waterfall (dist flatten) | GREEN | ✅                       | 1081 ✓                             | `scripts/node/flatten-css.js`, `.github/workflows/deploy.yml` |
| 10 — Inline critical CSS                  | RED   | 🟥 staged                | n/a (proposal)                     | `OWNER_REVIEW.md`                                             |
| 11 — Async/self-hosted fonts              | RED\* | 🟥 staged (reclassified) | n/a (proposal)                     | `OWNER_REVIEW.md`                                             |
| 12 — Defer analytics to interaction       | GREEN | ✅                       | 1081 ✓                             | `assets/analytics.js`                                         |
