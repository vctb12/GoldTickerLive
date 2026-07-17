# Operation Midas — Phase 11: Supabase RLS Re-Verification

Risk: **RED** — VERIFICATION ONLY. No migration was applied; applying them stays owner-gated
(decision **Q2**). This document records the live advisor state, the schema-vs-live delta, migration
coverage gaps, the exact apply + post-apply verification plan for Q2, and how to run the anon-key
test harness (`tests/midas-rls-harness.test.js`).

Date verified: 2026-07-17. Branch: `claude/operation-midas-goldtickerlive-6b32h3`.

---

## 1. Live advisor findings (read-only MCP)

Two Supabase projects are in play:

| Project ref            | Role                                        | MCP reachable from this session?       |
| ---------------------- | ------------------------------------------- | -------------------------------------- |
| `nebdpxjazlnsrfmlpgeq` | **Main site DB** (snake_case app schema)    | **NO — permission denied** (see below) |
| `lulqcytwhtjdsbzslpiw` | Prisma price-comparison DB (Vercel-managed) | Yes (`supabase-cinnabar-apple`)        |

### 1a. Main project `nebdpxjazlnsrfmlpgeq` — UNVERIFIABLE live

`get_advisors`, `list_tables`, and `list_migrations` all return
`MCP error -32600: You do not have permission to perform this action`, and the project does **not**
appear in `list_projects`. **The ~30 `Admin … using (true)` policies could NOT be confirmed against
the live database from this subagent.** All findings for the main project below are derived from
`supabase/schema.sql` (the source of truth) by static inspection only. To verify live, run the
post-apply queries in §4 from a context that holds credentials for this project (Supabase SQL editor
or `psql "$SUPABASE_DB_URL"`).

### 1b. Second project `lulqcytwhtjdsbzslpiw` — CONFIRMED still exposed

`get_advisors(security)` returns **5× `rls_disabled_in_public` ERROR** and `list_tables` confirms
`rls_enabled: false` on every public table:

| Table                       | RLS enabled (live) | Rows |
| --------------------------- | ------------------ | ---- |
| `public._prisma_migrations` | false              | 1    |
| `public.Store`              | false              | 5    |
| `public.Product`            | false              | 3    |
| `public.Listing`            | false              | 9    |
| `public.PriceHistory`       | false              | 23   |

`list_migrations` returns **`[]`** — migration `004` has **not** been applied. Supabase's own
advisory (priority `critical`) states these tables are fully exposed to the `anon` and
`authenticated` roles: anyone with the anon key can read/modify/`TRUNCATE` every row. This exactly
matches the documented claim and migration `004`'s problem statement. **Remediation stays
owner-gated (Q2); do not auto-apply.**

---

## 2. Schema-vs-live delta

- **Main project:** no live snapshot obtainable (permission denied), so no automated delta. Static
  read of `supabase/schema.sql` confirms the vulnerable pattern is present and literal:
  - `to authenticated using (true)` / `with check (true)` on every `Admin …` policy sampled —
    `shops` (:48-67), `site_settings` (:424-434), `pricing_overrides` (:1164-1180), `orders`
    (:1207-1223), `newsletter_subscribers` (:1410-1420), `lead_submissions` (:1467-1477), plus the
    `Admin full …` / `Admin manage …` (`for all`) policies (e.g. :334-362, plans, stripe_customers,
    subscriptions, entitlements, api_keys, developer_apps, page_meta_overrides, revenue_daily,
    api_rate_limits).
  - The only `Admin …` policies already correctly scoped are on `user_profiles`
    (`Admin read all profiles` :491, `Admin update profiles` :501) — they use an
    `exists (select 1 from user_profiles where id = auth.uid() and role='admin')` subquery, **not**
    literal `true`. Migration 002 correctly leaves these untouched.
  - **Net exposure:** any row in `auth.users` (i.e. any successful sign-up) obtains full admin CRUD,
    including `orders.customer` (jsonb PII) and `pricing_overrides` writes (price integrity). The
    admin allowlist in `admin/supabase-config.js` is client-side only and cannot enforce this.
- **Second project:** live delta is zero-ambiguity — schema/migration `004` says "RLS disabled +
  full anon grants"; live advisor confirms exactly that. Applying `004` closes it.

---

## 3. Migration dry-review (002–005): coverage and gaps

Read-only review of the four staged migrations. All four are marked **RED ZONE — STAGED, NOT
APPLIED** and each carries its own manual-apply banner and rollback block. None was applied here.

### 002_admin_rls_lockdown.sql — main project

- **Mechanism:** creates `public.is_admin()` (SECURITY DEFINER, `search_path=public`, `stable`)
  reading `user_profiles.role='admin'`; grants execute to `authenticated` only; revokes from
  `public`/`anon`. Then a dynamic `do $$` loop rewrites **every** policy where
  `policyname ilike 'Admin%' AND coalesce(qual,'true')='true' AND coalesce(with_check,'true')='true'`
  to the equivalent verb with `public.is_admin()`.
- **Coverage:** because the loop is data-driven over `pg_policies`, it catches **all**
  literal-`true` `Admin …` policies across every table (SELECT/INSERT/UPDATE/DELETE/ALL handled),
  including the `Admin full …` and `Admin manage …` `for all` policies. No per-table omission for
  the rewrite.
- **Extra hardening:** explicitly drops the authenticated INSERT/UPDATE/DELETE policies on `orders`
  and `pricing_overrides` so only the service-role (bypasses RLS) can write those. Admin SELECT is
  retained (recreated with `is_admin()`).
- **Gaps / prerequisites to flag for Q2:**
  1. **Bootstrap required or admins lock themselves out.** The
     `update user_profiles set role='admin'` for the owner is **commented out**. If applied without
     it (and without any existing `role='admin'` row), every `Admin …` policy evaluates false for
     everyone → admin UI loses all DB access. Run the bootstrap (uncommented) in the same
     maintenance window.
  2. **Signup must be disabled first.** The fix only contains the blast radius if Authentication →
     Providers → Email → "Allow new users to sign up" is **disabled**; otherwise anyone can still
     self-provision an authenticated (non-admin) account (harmless under the new policies, but the
     intent is a closed system until §005 lands).
  3. **`user_profiles` self-referential policies unchanged.** `Admin read/update profiles` keep
     their inline `exists(... user_profiles ...)` subquery. `is_admin()` (SECURITY DEFINER) avoids
     recursion for other tables, but these two are not migrated to it — pre-existing, low-risk,
     worth a follow-up for consistency.

### 003_public_insert_hardening.sql — main project

- **Mechanism:** additive `CHECK` length constraints on `shop_claims`, `shop_leads`,
  `shop_click_events`; tightens the previously `with check (true)` anon insert policy on
  `shop_click_events` to validate `source_path`/`user_agent` length.
- **Documented gap (explicit TODO in the file):** `lead_submissions` and `newsletter_subscribers`
  public-insert paths are **NOT hardened**. In `schema.sql`, `Public insert lead submissions` is
  `with check (true)` (fully unconstrained, :1463-1465) and `Public insert newsletter subscribers`
  only checks `status='pending'` + email length. Anon can still spam these with the anon key,
  bypassing the Express rate limiters. Extend the same length-CHECK pattern (and ideally route
  public writes through a rate-limited Edge Function) before or alongside applying 003. **This is
  the main remaining coverage gap in the public-insert lane.**

### 004_prisma_comparison_enable_rls.sql — second project `lulqcytwhtjdsbzslpiw`

- **Mechanism:** enables RLS on all 5 tables;
  `REVOKE insert/update/delete/truncate/references/trigger` from `anon,authenticated` on the 4
  business tables; `REVOKE ALL` on `_prisma_migrations`; adds public read-only SELECT policies on
  `Store/Product/Listing/PriceHistory` (none on `_prisma_migrations`). Correctly notes TRUNCATE is
  not governed by RLS, so the REVOKEs are load-bearing.
- **Coverage:** matches the live advisor 1:1 — all 5 flagged tables are addressed. Prisma connects
  as `postgres` (rolbypassrls), so server-side reads/writes are unaffected. **No missed table.**

### 005_saved_calculations.sql — main project

- **Mechanism:** creates `saved_calculations` with RLS **enabled and forced**, four owner-scoped
  policies (`user_id = auth.uid()`), a bounded `payload jsonb`, and an `updated_at` touch trigger.
- **CONFLICT / gap to flag for Q2:** `schema.sql` **already declares a `saved_calculations` table**
  (:588-620) with a **different shape** and **different policies**:

  | Aspect     | schema.sql (:588)                                | migration 005                              |
  | ---------- | ------------------------------------------------ | ------------------------------------------ |
  | FK target  | `public.profiles(id)`                            | `auth.users(id)`                           |
  | Columns    | `tool, label(not null), input_data, output_data` | `kind(check), label(nullable), payload`    |
  | RLS forced | no (`enable` only)                               | **yes** (`enable` + `force`)               |
  | Policies   | read / insert / **delete** (no update)           | read / insert / **update** / delete        |
  | Policy DDL | `drop policy if exists` then create              | plain `create policy` (**not idempotent**) |

  Because both use `create table if not exists`, whichever runs first wins the table shape. If the
  `schema.sql` version already exists in the DB, migration 005's **plain `create policy`**
  statements will **ERROR on duplicate policy name** (`Users read own saved calculations` etc.).
  **Reconcile before applying 005:** either (a) drop the schema.sql version's policies first / make
  005's `create policy` use `drop policy if exists`, or (b) settle on one canonical shape and update
  `schema.sql` to match. As staged, 005 is not safely applicable on top of the current schema.sql.

### Summary of gaps

| #   | Lane            | Gap                                                                                    | Severity |
| --- | --------------- | -------------------------------------------------------------------------------------- | -------- |
| 1   | 002 apply       | Owner bootstrap `role='admin'` is commented out → lockout risk if forgotten            | High     |
| 2   | 002 apply       | Requires signup disabled (dashboard) as prerequisite                                   | Med      |
| 3   | 003 coverage    | `lead_submissions` + `newsletter_subscribers` public inserts left unhardened (TODO)    | Med      |
| 4   | 005 conflict    | Duplicate/divergent `saved_calculations` vs schema.sql; non-idempotent `create policy` | High     |
| 5   | 002 consistency | `user_profiles` admin policies not migrated to `is_admin()` (pre-existing recursion)   | Low      |

---

## 4. Q2 apply plan + post-apply verification (owner-gated — DO NOT run here)

Apply order and gates. Each step is manual (SQL editor or `psql`); never auto-applied by an agent.

### Step A — main project `nebdpxjazlnsrfmlpgeq`

1. **Backup / snapshot** the project first.
2. Dashboard: Authentication → Providers → Email → **disable "Allow new users to sign up"**.
3. Apply `002_admin_rls_lockdown.sql`, then **run the bootstrap** (uncomment the
   `update public.user_profiles set role='admin' where id=(select id from auth.users where email='vctb12@gmail.com')`).
4. Reconcile the `saved_calculations` conflict (gap #4) — pick one canonical shape and align
   `schema.sql`; make 005's `create policy` idempotent — **then** apply
   `005_saved_calculations.sql`.
5. Extend `003` for `lead_submissions` / `newsletter_subscribers` (gap #3), then apply `003`.
6. Re-enable signup only after the two-account isolation test (below) passes.

Post-apply verification (read-only) for the main project:

```sql
-- (a) No literal-true admin policies remain:
select tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname='public' and policyname ilike 'Admin%'
  and coalesce(qual,'true')='true' and coalesce(with_check,'true')='true';
-- expect: 0 rows.

-- (b) is_admin() exists and is authenticated-only:
select proname, prosecdef from pg_proc where proname='is_admin';         -- prosecdef = t
select has_function_privilege('anon','public.is_admin()','execute');      -- expect: f

-- (c) orders / pricing_overrides have NO authenticated write policy:
select tablename, cmd, policyname from pg_policies
where schemaname='public' and tablename in ('orders','pricing_overrides')
  and cmd in ('INSERT','UPDATE','DELETE');
-- expect: 0 rows (only the is_admin() SELECT remains).

-- (d) saved_calculations RLS forced + 4 owner policies:
select relname, relrowsecurity, relforcerowsecurity from pg_class where relname='saved_calculations';
select policyname, cmd, qual, with_check from pg_policies
where schemaname='public' and tablename='saved_calculations';
```

Two-account isolation test (per 005's banner): sign in as A → insert → sees 1 row; sign in as B →
sees 0 of A's rows, cannot update/delete A's row, insert with A's uid rejected by `with_check`; anon
key with no session → every verb denied.

### Step B — second project `lulqcytwhtjdsbzslpiw`

1. Apply `004_prisma_comparison_enable_rls.sql` (SQL editor for that project, or
   `psql "$PRISMA_SUPABASE_DB_URL" -f supabase/migrations/004_prisma_comparison_enable_rls.sql`).
2. Post-apply (read-only):

```sql
select relname, relrowsecurity from pg_class
where relnamespace='public'::regnamespace
  and relname in ('Store','Product','Listing','PriceHistory','_prisma_migrations');
-- expect relrowsecurity = true for all five.

select tablename, policyname, cmd, roles from pg_policies
where schemaname='public' and tablename in ('Store','Product','Listing','PriceHistory');
-- expect one SELECT policy per business table; none on _prisma_migrations.
```

3. Re-run `get_advisors(security)` on `lulqcytwhtjdsbzslpiw` → expect **0**
   `rls_disabled_in_public`.
4. Confirm public SELECT still works (the comparison directory must keep reading) and that anon
   INSERT/UPDATE/DELETE/TRUNCATE now fail.

---

## 5. How to run the anon-key harness (`tests/midas-rls-harness.test.js`)

The harness is **inert by default** — with no env vars it `t.skip()`s every live probe and adds one
always-green contract test, so normal `npm test` / CI stays green (verified: 1 pass, 6 skip, 0 fail
in isolation).

To run the live probes against a project (uses the **public anon key only**, no new dependency, raw
`fetch` against PostgREST; never signs up or mutates data):

```bash
GTL_SUPABASE_URL="https://nebdpxjazlnsrfmlpgeq.supabase.co" \
GTL_SUPABASE_ANON_KEY="<public-anon-key>" \
node --test --test-concurrency=1 tests/midas-rls-harness.test.js
```

Assertion classes (see the file header for the full rationale):

- **[INVARIANT]** anon reads of `orders`, `lead_submissions`, `newsletter_subscribers`,
  `pricing_overrides` must return **zero rows** (or 401/403/404); anon INSERT into `site_settings`
  must be **rejected 401/403**. These hold **before and after** the Q2 migrations — they guard the
  anon surface and act as a regression tripwire.
- **[PUBLIC]** `site_settings` SELECT is intentionally world-readable (`Public read settings`), so
  the harness asserts reachability, **not** zero rows.
- **[POST-Q2]** the authenticated-user exposure that migration 002 actually closes (any signed-up
  user getting admin CRUD) **cannot** be exercised by this harness, because proving it requires
  creating/using a real user session — explicitly out of scope. Verify it manually with the §4 SQL
  after 002 applies. The harness is written so its anon-surface assertions remain valid
  post-migration and can run as a standing check.

> Network errors when creds are set cause a `t.skip` (not a failure), so a transient outage never
> reddens a credentialed run.
