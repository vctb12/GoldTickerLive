# Owner Review Packet — Gold Ticker Live Revamp (RED ZONE)

Everything here is **staged as files only** and has **NOT** been applied to live infrastructure
(Supabase DB, Stripe, production redirects/DNS). Review each entry, then apply with the command
shown. Each section lists: what & why · apply command · rollback · open questions.

---

## ⛔ OPEN QUESTIONS — BLOCKING (answer before applying Phases 1, 2, 7, 8)

Decisions **A & B were left blank** (`{{FILL THIS IN}}`) in the run instructions, so the security
phases were kept in the RED ZONE (staged, not applied).

- **(A) Are Supabase email signups currently ENABLED or DISABLED?** Dashboard → Authentication →
  Providers → Email → "Allow new users to sign up".
  - **If ENABLED:** the RLS hole is **actively exploitable today** — any stranger can register and
    read customer PII (`orders.customer`) and tamper with `pricing_overrides`. **Disable it
    immediately**, then apply Phase 1.
  - **If DISABLED:** exposure is latent. Still fix it, but lower urgency.

- **(B) In static production (GitHub Pages, no Express server), what creates `public.orders` rows?**
  Stripe webhooks need a running server; the Express tier (`server/routes/billing.js`) is not
  deployed on Pages.
  - This decides whether `orders` / `pricing_overrides` **writes** should be service-role-only
    (Phase 1 assumes **yes**) or need an authenticated-admin path.

---

## Phase 1 — Admin RLS lockdown 🟥 STAGED

**File:** `supabase/migrations/002_admin_rls_lockdown.sql`

**What & why.** ~30 admin policies across ~24 tables use `to authenticated using (true)`, so any
authenticated Supabase user has full admin CRUD — including read of customer PII in
`orders.customer` and write to `pricing_overrides`. The migration adds a `public.is_admin()`
SECURITY DEFINER helper (checks the existing `user_profiles.role = 'admin'`), rewrites every
permissive `Admin%` policy to require `is_admin()`, and removes browser write access to `orders` and
`pricing_overrides` (service-role only). Role/uid-scoped policies are untouched.

**Prerequisite (dashboard).** Authentication → Providers → Email → **disable** "Allow new users to
sign up".

**Apply command.**

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/002_admin_rls_lockdown.sql
# then bootstrap the owner (uncomment step 4 in the file, or run):
#   update public.user_profiles set role='admin'
#     where id = (select id from auth.users where email='vctb12@gmail.com');
```

**Verify after apply.**

```sql
-- expect: no 'Admin%' policy with qual/with_check = 'true'
select tablename, policyname, qual, with_check from pg_policies
 where schemaname='public' and policyname ilike 'Admin%'
   and (coalesce(qual,'true')='true' and coalesce(with_check,'true')='true');
```

**Rollback.** Restore policies from `supabase/schema.sql` (source of truth), or the emergency block
at the bottom of the migration file.

**Open question.** Depends on (A) and (B) above.

**Unverified in this environment.** No DB access here — the migration was authored from
`supabase/schema.sql` (read in full) but **not executed**. The `pricing_overrides` → displayed-price
read path was not traced (no public-read policy exists on that table, so browser tampering of
_displayed_ prices is unconfirmed; write-access by any authenticated user is confirmed from the
schema).

---

## Phase 2 — Allowlist hardening + signup lockdown 🟥 STAGED

**What & why.** Admin authorization is currently enforced only client-side
(`admin/supabase-config.js` `ALLOWED_EMAIL`), and the anon key is committed. Real enforcement must
be DB-side (RLS, Phase 1) and, where a server exists, server-side.

**Owner actions (in order):**

1. Dashboard → Authentication → Providers → Email → **disable** "Allow new users to sign up"
   (load-bearing — see Question A).
2. Apply the Phase 1 migration, then bootstrap the owner admin role (migration step 4).
3. _Only if/when the Express tier is deployed:_ enforce the allowlist in the admin auth middleware
   (defense-in-depth). On static GitHub Pages prod the Express server is **not** deployed, so the DB
   (`is_admin()` + RLS) is the real gate.

**Proposed Express middleware** (verify against `server/lib/auth.js` + `server/routes/admin/` before
wiring; do not commit secrets):

```js
const ADMIN_ALLOWLIST = (process.env.ADMIN_ALLOWLIST || '')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
function requireAllowlistedAdmin(req, res, next) {
  const email = req.user?.email?.toLowerCase();
  if (!email || !ADMIN_ALLOWLIST.includes(email)) {
    return res.status(403).json({ error: 'forbidden' });
  }
  next();
}
```

**Apply.** Dashboard toggle + Phase 1 apply; middleware ships via normal deploy. **Rollback.**
Re-enable the signup toggle; revert the middleware commit. **Open question.** Depends on (A) and
(B).

---

## Phase 7 — Harden public (anon) insert paths 🟥 STAGED

**File:** `supabase/migrations/003_public_insert_hardening.sql`

**What & why.** Public-insert RLS lets the browser write directly with the anon key, bypassing the
Express rate limiters. `shop_click_events` used `with check (true)` (unconstrained). The migration
adds additive column-length CHECK constraints to `shop_claims`, `shop_leads`, `shop_click_events`,
and tightens the `shop_click_events` insert policy to validate shape. `lead_submissions` /
`newsletter_subscribers` are left as a TODO (their columns were not read this run — extend the same
pattern before applying).

**Apply.** `psql "$SUPABASE_DB_URL" -f supabase/migrations/003_public_insert_hardening.sql`
(applying validates existing rows; limits are generous, these tables are low-volume).

**Rollback.** Drop the added constraints; restore the original "Public insert shop click events"
policy from `supabase/schema.sql`.

**Open question.** Consider routing all public writes through a rate-limited server/Edge Function
(larger change, not staged here).

---

## Phase 6 — Billing token verification fail-closed 🟥 STAGED (Stripe-critical)

**File:** `server/routes/billing.js` (`resolveUserFromToken`)

**What & why.** Server-side token verification fell back to `SUPABASE_ANON_KEY` when the
service-role key was absent; the anon key cannot reliably resolve another user's identity
server-side. Now requires `SUPABASE_SERVICE_ROLE_KEY` and returns null (→ 401) when absent (fail
closed). Committed on the branch only; the Express tier is not deployed in static prod, so this does
not affect live Stripe until/if the server is deployed.

**Owner sign-off before merge/deploy.** Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in the server
environment, else billing endpoints 401 by design. **Rollback.** Revert the one-line change.
**Verified:** 1081/1081 tests, eslint clean.

---

## Phase 8 — RLS regression assertions 🟥 STAGED

**File:** `supabase/verify.sql` (section 11)

**What & why.** Adds manual SQL assertions that an authenticated NON-admin and an anon session both
read 0 rows from `orders` / `pricing_overrides` after Phase 1, while an admin can. Wiring into CI
needs a live Supabase test project (no DB in CI today) — left as an owner action.

**Apply.** Paste section 11 into the Supabase SQL editor after Phase 1, substituting real
`auth.users` UUIDs. **Rollback.** N/A (verification only).

---

## Phase 10 — Inline critical CSS 🟥 STAGED (touches sw.js — production-critical)

**What & why.** Pages link `styles/critical.css` as a blocking `<link rel="stylesheet">` (plus a
preload) rather than inlining it — defeating the documented critical-CSS strategy (extra round-trip
before paint). **Proposed.** A build step that inlines `critical.css` into each page's `<head>`
`<style>` and drops the blocking `<link>`; then update `sw.js` precache (critical.css no longer
separately fetched) and re-run `check-sw-precache`. **Why staged.** Touches all ~390 page heads
**and** `sw.js` (production-critical precache). Needs a verified build transform (sibling to
`flatten-css.js` / `inject-schema.js`) + an `sw.js` review. **Apply.** Implement
`scripts/node/inline-critical-css.js`, wire into build/deploy, re-run `npm run validate`
(sw-precache gate). **Rollback.** Revert the build step.

---

## Phase 11 — Async / self-hosted fonts 🟥 STAGED (reclassified from GREEN — invasive)

**What & why.** Google Fonts (Cairo) load as a render-blocking `<link rel="stylesheet">` in every
page head (~390 files), blocking first paint on the critical path. **Proposed (minimal).** Rewrite
to the async-swap pattern (`media="print" onload="this.media='all'"`) via a dist head-transform on
leaf pages (root pages are handled by Vite), **or** self-host a subset Cairo woff2 and preload one
weight. **Why staged.** Requires a ~390-page head change / build transform — higher value but not a
minimal diff; reclassified to staged per the minimal-diff guardrail (escape-hatch: "a GREEN phase
can't be completed without [an invasive change]"). **Apply.** Add a dist head-transform step
(sibling to `flatten-css.js`) or self-host fonts + preload. **Rollback.** Revert the transform.

---

## Phase 13 — Image pipeline (webp/avif + responsive) 🟥 STAGED (reclassified — invasive)

**What & why.** `assets/` ships raw PNGs (og-image, favicons) with no webp/avif or responsive
`<picture>` strategy. **Proposed.** A build step to emit webp/avif variants + `<picture>`/`srcset`
on key images. **Why staged.** Needs a build script + per-page markup changes (not minimal).
**Apply.** Add `scripts/node/build-images.js` (sharp) + update image markup; wire into build.
**Rollback.** Revert the step. (Low urgency — few raster images.)

---

## Phase 14 — Pin Leaflet with SRI 🟥 STAGED (verify hashes before applying)

**What & why.** `src/components/shops-map.js` loads Leaflet 1.9.4 from `unpkg.com` with no
`integrity`/`crossorigin` (supply-chain risk; lazy-loaded, so scoped). **Proposed.** Add SRI to the
injected `<script>`/`<link>`, OR self-host/pin Leaflet. Published Leaflet 1.9.4 hashes (⚠️ **verify
against unpkg before shipping** — a wrong hash blocks the map):

- `leaflet.js` → `integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="`
- `leaflet.css` → `integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="` Add
  `crossorigin="anonymous"`. **Why staged.** A mismatched hash silently breaks the (lazy) shops map
  — verify first. **Rollback.** Remove the attributes.

---

## Phase 15 — Lighthouse budget gate (warn → error) 🟥 STAGED (needs real baseline)

**What & why.** `lighthouserc.json` assertions are `warn`-only and `docs/performance-baseline.json`
is self-declared **estimated**, so CI never blocks regressions. **Proposed.** Run Lighthouse CI once
to capture a **real** measured baseline, then flip perf/a11y assertions from `warn` to `error` at
thresholds the live site actually meets. **Why staged.** Flipping to `error` against estimated
numbers would fail CI on inaccurate thresholds. **Apply.** Run `lhci autorun` on a deploy preview;
set thresholds from real medians; change `warn`→`error`. **Rollback.** Revert to `warn`.

---

## Phase 43 — Unify AR on /ar/ path + reciprocal hreflang 🟥 STAGED (SEO-critical, large)

**What & why.** Split-brain bilingual setup: ~127 pages point their AR hreflang at `?lang=ar` (a
client-side JS toggle over identical EN HTML), while a real `/ar/` path scheme exists for only ~6
pages. Google sees duplicates and ignores hreflang; AR has no indexable surface for most pages.
**Proposed.** Standardize on the `/ar/` path scheme; generate real AR documents for the top
country/karat pages; emit reciprocal `hreflang` only where a distinct `/ar/` URL exists. **Why
staged.** Large; touches canonicals/hreflang (SEO-critical — needs owner sign-off per the
technical-SEO policy). **Apply.** Generator + `countries/country-page.js` changes + AR content
generation; verify hreflang reciprocity and canonical correctness. **Rollback.** Revert generator
changes.

---

## Phase 46 — GDPR export/delete for stored PII 🟥 STAGED (touches PII)

**What & why.** No user-facing export/delete path for stored PII (`orders.customer`,
`lead_submissions`, `newsletter_subscribers`). **Proposed.** Server endpoints (service-role gated)
to export and delete a user's data, plus an admin action; or a documented manual runbook until the
Express tier is deployed. **Why staged.** Touches PII + server + RLS. **Apply.** Implement endpoints
with owner/service-role auth and RLS-safe queries; document retention. **Rollback.** Revert
endpoints.

---

## Phase 48 — Automation durability 🟥 STAGED (production-critical: post_gold)

**What & why.** `scripts/python/tweet_guard.py` silently resets to empty state on a corrupt state
file (duplicate-post risk); in `post_gold.yml`, if the post succeeds but the state-commit push
fails, the guard state lags (possible double-post). **Proposed.** On corrupt state, back up to
`.bak` + emit a loud step-summary warning before recovering; reconcile the last tweet from X (or
commit state atomically with posting). **Why staged.** Production-critical X automation — owner
sign-off + dry-run required. **Apply.** Edit `tweet_guard.py` + `post_gold.yml`; dry-run before
merge. **Rollback.** Revert the commits.

---

## Phase 49 — Multi-metal (silver / platinum / palladium) ⏭️ SPEC ONLY

**Spec.** Add silver/platinum/palladium as parallel **reference** metals (never blended with
retail). Reuse `src/lib/price-calculator.js` with per-metal purity factors; extend the data pipeline
(`fetch_gold_price.py` → multi-metal source fields, new JSON shape) with the same freshness/failover
contract; add a metal switch in the tracker/home UI; per-metal purity tables; EN/AR strings via
`translations.js`; per-metal SEO pages. **Scope:** large (data + pricing + UI + SEO + automation).
Keep AED peg 3.6725 / troy oz 31.1035 frozen. **No code this run.**

---

## Phase 50 — Public API + portfolio/watchlist + web-push ⏭️ SPEC ONLY

**Spec.** (a) Public read-only developer API `/api/v1/*` (price + history) using the existing
`api_keys` / `api_usage` tables, server-issued keys, and per-key rate limits; (b)
portfolio/watchlist backed by the existing Supabase `watchlists` / `saved_calculations` tables under
user auth (RLS already uid-scoped); (c) web-push notifications beyond browser alerts via
`notification_subscriptions`. **Scope:** large (backend + auth + infra; depends on the Express tier
being deployed and on RLS lockdown from Phase 1). **No code this run.**
