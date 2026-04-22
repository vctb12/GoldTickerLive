# Revamp Status — transient

Tracking carry-over debt during the 30-phase production revamp. **This file is deleted at Phase 30
(launch); its contents roll into `CHANGELOG.md`.**

## Track A — Stabilize

- [x] Phase 1 — Repo hygiene
  - [x] Untrack `dist/`, `playwright-report/`, `test-results/`
  - [x] Deduplicate Prettier config → `.prettierrc.json` is canonical
  - [x] Deduplicate ESLint config → `eslint.config.mjs` is canonical
- [x] Phase 2 — Workflow triage
  - [x] Fix invalid `ci.yml` (previously two concatenated YAML docs → zero jobs ran)
  - [x] Fix `perf-check.yml` (deprecated `microsoft/playwright-github-action@v1`)
  - [x] Pin Node 20 LTS across CI workflows
  - [x] `post_gold.yml` untouched (user directive)
- [x] Phase 3 — Testing foundation
  - [x] CI provides test-only `JWT_SECRET` / `ADMIN_PASSWORD` / `ADMIN_ACCESS_PIN`
  - [x] Smoke suite covers 404 + country page
- [x] Phase 4 — Lint / format single source of truth
  - [x] Husky v9 pre-commit hook (lint-staged only; `npm test` removed from hook)
- [x] Phase 5 — CSP hardening
  - [x] Externalized inline gtag/clarity snippets to `assets/analytics.js` via
        `scripts/node/externalize-analytics.js` codemod (501 HTML files rewritten; 189 no-analytics
        files untouched). Idempotent `--check` mode wired into `npm run validate`.
  - [x] Dropped `'unsafe-inline'` from `scriptSrc` in `server.js` CSP.

## Track B — Backend, Auth & Users (not started)

- [ ] Phase 6 — Backend architecture decision & scaffolding
- [ ] Phase 7 — Supabase schema & migrations
- [ ] Phase 8 — Auth system (email OTP + OAuth)
- [ ] Phase 9 — Server API surface (`/api/v1/*`, OpenAPI spec)
- [ ] Phase 10 — User data flows (alerts, watchlist, preferences)
- [ ] Phase 11 — Admin panel consolidation + RBAC
- [ ] Phase 12 — Background jobs (price poll, alert eval, aggregates)
- [ ] Phase 13 — Notifications (email + web push)

## Track C — Product polish & Trust (in progress)

- [ ] Phase 14 — Trust & labeling audit (in progress)
- [ ] Phase 15 — Shops directory trust pass (in progress — featured-section editorial footnote +
      "Directory last reviewed" label added; bilingual copy wired in `src/pages/shops.js`)
- [ ] Phase 16 — Tracker UX polish (in progress — `renderSeasonal()` now populates
      `#tp-seasonal-results` with monthly high/low/spread from `state.history`)
- [ ] Phase 17 — Calculator polish
- [ ] Phase 18 — Country / city / market pages
- [ ] Phase 19 — Educational / Learn pages
- [ ] Phase 20 — Design system completion
- [ ] Phase 21 — Accessibility audit

## Track D — Performance, SEO, Monetization (not started)

- [ ] Phase 22 — Performance budgets
- [ ] Phase 23 — SEO comprehensive pass
- [ ] Phase 24 — Ads integration (AdSense, consent banner, `ads.txt`)
- [ ] Phase 25 — Analytics & observability (Sentry, health/ready)
- [ ] Phase 26 — Deployment hardening (Docker, zero-downtime, secret scanning)

## Track E — Launch readiness (not started)

- [ ] Phase 27 — Load & resilience testing (k6, chaos, backup drill)
- [ ] Phase 28 — Legal & compliance (GDPR export/delete, cookie policy)
- [ ] Phase 29 — Docs & runbooks
- [ ] Phase 30 — Launch (tag v1.0.0, flip DNS, 48h enhanced monitoring)

## Items blocked on external inputs

These items cannot be completed without credentials or third-party accounts. Surface them to the
project owner before the associated phase starts.

| Phase | Blocker                                    |
| ----- | ------------------------------------------ |
| 7–13  | Supabase project URL + service role key    |
| 8     | OAuth client IDs (Google)                  |
| 13    | Email provider (Resend / Postmark) API key |
| 24    | AdSense publisher ID                       |
| 25    | Sentry DSNs (frontend + backend)           |
| 26    | Deployment target (Render / Fly / Railway) |
