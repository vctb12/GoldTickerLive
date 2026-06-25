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
