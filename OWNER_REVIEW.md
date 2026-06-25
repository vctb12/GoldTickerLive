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
