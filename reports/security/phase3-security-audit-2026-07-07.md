# Phase 3 — Dependency / security / secrets audit (read-only)

Track A / Phase 3. **Audit + recommendations only — no production DB changes, no owner-gated file
edits.** Companion: `reports/security/csp-inventory-2026-07-07.md`.

## 1. Dependencies

| Check                   | Result                                          |
| ----------------------- | ----------------------------------------------- |
| `npm audit` (prod)      | **0 vulnerabilities**                           |
| `npm audit` (incl. dev) | **0 vulnerabilities**                           |
| Dependabot              | ✅ `.github/dependabot.yml` (npm, actions, pip) |
| CodeQL                  | ✅ `.github/workflows/codeql.yml`               |

No action required. Keep Dependabot PRs flowing.

## 2. Secrets hygiene — clean

- No `.env` / `.env.local` tracked in git; `.gitignore` covers both (lines 69–70).
- `.env.example` holds **empty placeholders only** — no real secret values committed.
- **No `service_role` key referenced anywhere in `src/`** — the browser uses only the Supabase anon
  key (RLS-protected reads), as intended. Service-role stays server-side.
- `docs/environment-variables.md` documents 84 vars; `.env.example` lists 73.

### Finding S-1 (low, parked lane): undocumented Stripe price IDs in `.env.example`

`STRIPE_PRICE_API_ANNUAL` and `STRIPE_PRICE_PRO_ANNUAL` appear in `.env.example` but not in
`docs/environment-variables.md`. They belong to the **parked billing lane**. **Recommendation:**
when the billing decision is made, either document them or drop them from `.env.example`. Not
changed here (billing config is owner-gated).

## 3. Security-header posture — the real gap (recommend, no code change here)

### Finding S-2 (high, infra): the production host emits no edge security headers

`deploy.yml` publishes `dist/` to **GitHub Pages**, which does **not** read `_headers`
(Netlify/Cloudflare) or `.htaccess` (Apache). Both files exist and are well-authored, but on the
live GitHub Pages tier the only header-equivalents that ship are the `<meta>` tags the build injects
(`X-Content-Type-Options: nosniff`, `Referrer-Policy`). **So the public site currently has no CSP,
no `X-Frame-Options`/`frame-ancestors`, and no HSTS at the edge.** (The Express admin tier _does_
set a full Helmet header set — `server.js:59+` — but that host is separate.)

**Recommendation (owner action, $0):** front `goldtickerlive.com` with **Cloudflare's free tier**
(or Cloudflare Pages), which consumes the existing `_headers` file verbatim — this ships the full
`X-Frame-Options`/HSTS/Permissions-Policy/COOP/CORP set with no recurring cost and no code change.
As an interim, a `<meta http-equiv="Content-Security-Policy">` can be injected at build time (covers
`script-src`/`connect-src`/`frame-src` but **not** framing/HSTS, which cannot be set via `<meta>`).
The concrete CSP to ship is in the companion inventory. This is **not** applied in this phase
because it needs either an infra change (Cloudflare) or a build-step change gated by
`tests/csp-regression.test.js` — surfaced for owner decision.

## 4. Supabase RLS — read-only re-verification (NO production query, NO changes)

Reviewed from the committed migrations (`supabase/migrations/001–005`), not the live DB.

| Migration                   | RLS posture                                                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 001 price_history           | ✅ RLS enabled on `price_history` + `price_alerts`; public read, service-only insert/delete; "read own alerts"                  |
| 002 admin lockdown          | ✅ Replaces ~30 `to authenticated using (true)` policies with `public.is_admin()` gating; revokes `is_admin()` from public/anon |
| 003 public insert hardening | ✅ Tightens public insert on `shop_click_events`                                                                                |
| 005 saved_calculations      | ✅ RLS present                                                                                                                  |

### Finding S-3 (high, owner-gated — recommend, DO NOT apply): migration 004 is staged but not applied

`004_prisma_comparison_enable_rls.sql` is explicitly headed **"RED ZONE — STAGED, NOT APPLIED"**. It
would enable RLS on the Prisma comparison tables (`Store`, `Product`, `Listing`, `PriceHistory`,
`_prisma_migrations`) and revoke dangerous anon/authenticated write + `TRUNCATE` grants. Until it is
applied, **anon may still hold write/TRUNCATE grants on those tables in production.**

**Recommendation:** the owner should review and apply `004` against production during a maintenance
window (it is idempotent and additive-safe per its own header). **Not applied here** — the hard
constraint forbids production DB writes from this task. This is logged for the owner's separate
go-ahead.

## 5. CodeQL note (this program)

The Phase 1 console harness (`scripts/qa/capture-console-baseline.mjs`) initially tripped CodeQL
`js/path-injection`; it was rewritten so request handling indexes an in-memory file map (no
user-controlled data reaches a filesystem call) and all argv-derived paths are allowlisted/constant.
Fixed on the Phase 1 branch (#537). No other CodeQL alerts introduced by this program to date.

## Summary of recommendations (all owner-gated / infra — none applied here)

| ID  | Severity | Action for owner                                                                          |
| --- | -------- | ----------------------------------------------------------------------------------------- |
| S-1 | low      | Document or drop the 2 parked Stripe price IDs in `.env.example`                          |
| S-2 | high     | Front the site with Cloudflare free tier to ship `_headers` (edge CSP/HSTS/framing), $0   |
| S-3 | high     | Apply staged RLS migration `004` to production (anon write/TRUNCATE gap on Prisma tables) |
