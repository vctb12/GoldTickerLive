-- supabase/migrations/004_prisma_comparison_enable_rls.sql
-- ============================================================================
-- RED ZONE — STAGED, NOT APPLIED: enable RLS + lock down public grants
-- ============================================================================
-- ⚠️  DIFFERENT TARGET PROJECT than migrations 001–003 in this folder.
--     001–003 target the site project `nebdpxjazlnsrfmlpgeq` (snake_case
--     schema: shops, shop_listings, …). THIS migration targets the SEPARATE,
--     Vercel-integrated, Prisma-managed price-comparison project:
--
--         PROJECT REF : lulqcytwhtjdsbzslpiw
--         HOST        : db.lulqcytwhtjdsbzslpiw.supabase.co
--         TABLES      : "Store", "Product", "Listing", "PriceHistory",
--                       "_prisma_migrations"  (PascalCase — must stay quoted)
--
--     Ideally this hardening is also recorded in that app's own
--     prisma/migrations history; it lives here because GoldTickerLive is the
--     only in-scope repo for this security lane.
-- ============================================================================
-- PROBLEM (verified 2026-06-30 via Supabase security advisor + pg_catalog):
--   * RLS is DISABLED on all 5 public tables  ->  5x rls_disabled_in_public ERROR
--     (https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public).
--   * `anon` AND `authenticated` hold FULL table privileges on every table —
--     SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER.
--   * Net effect: anyone holding the public anon key can read, overwrite,
--     delete, and even TRUNCATE every row — including the Prisma migration
--     bookkeeping table. Full anonymous read + write exposure.
--
-- WHY THIS IS SAFE FOR THE APP (verified via pg_roles / pg_class):
--   * All 5 tables are owned by role `postgres`, and `postgres` has
--     rolbypassrls = true. Prisma connects as `postgres` over DATABASE_URL, so
--     its server-side reads/writes BYPASS RLS and are unaffected.
--   * `service_role` also has rolbypassrls = true (any server/edge writes via
--     the service key are unaffected).
--   * relforcerowsecurity = false on every table, so owner-bypass stays in
--     effect (we deliberately do NOT force RLS on the owner).
--   * Only the PostgREST roles `anon` / `authenticated` are gated by RLS —
--     exactly the public attack surface being closed.
--
-- POLICY SHAPE:
--   * Store / Product / Listing / PriceHistory  ->  PUBLIC READ-ONLY.
--       keep the SELECT grant + add a permissive SELECT policy so any public
--       client read of the comparison directory keeps working; REVOKE every
--       write + TRUNCATE grant from anon/authenticated. Writes flow only
--       through postgres / service_role (which bypass RLS).
--   * _prisma_migrations  ->  NO public access. REVOKE ALL from anon/auth and
--     enable RLS with no policy. Prisma's postgres connection still manages it.
--
-- TRUNCATE NOTE: TRUNCATE is NOT governed by RLS policies, so enabling RLS
--   alone would still leave anon able to TRUNCATE these tables. The REVOKE
--   statements below are what actually close that path — do not drop them.
--
-- ⚠️  DO NOT auto-apply (Session 1 security lane / hard safety gate).
--     Apply only after human approval of this PR, e.g. in the Supabase SQL
--     editor for project lulqcytwhtjdsbzslpiw, or:
--         psql "$PRISMA_SUPABASE_DB_URL" -f supabase/migrations/004_prisma_comparison_enable_rls.sql
--     Then re-run the Supabase security advisor on a preview branch and confirm
--     0 rls_disabled_in_public errors AND that public SELECT still succeeds.
-- ============================================================================

begin;

-- 1) Enable RLS on every exposed table. Idempotent (no-op if already enabled).
alter table public."Store"              enable row level security;
alter table public."Product"            enable row level security;
alter table public."Listing"            enable row level security;
alter table public."PriceHistory"       enable row level security;
alter table public."_prisma_migrations" enable row level security;

-- 2) Revoke the dangerous public write/admin grants. RLS does not govern
--    TRUNCATE / REFERENCES / TRIGGER, so these REVOKEs are required, not
--    optional. SELECT is intentionally retained on the 4 business tables.
revoke insert, update, delete, truncate, references, trigger
  on public."Store"        from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public."Product"      from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public."Listing"      from anon, authenticated;
revoke insert, update, delete, truncate, references, trigger
  on public."PriceHistory" from anon, authenticated;

-- _prisma_migrations is internal bookkeeping — no public role should touch it.
revoke all on public."_prisma_migrations" from anon, authenticated;

-- 3) Public read-only policies for the comparison directory. DROP-then-CREATE
--    keeps the migration re-runnable. No policy is created for
--    _prisma_migrations, so anon/authenticated get zero access under RLS.
drop policy if exists "Public read stores" on public."Store";
create policy "Public read stores"
  on public."Store" for select to anon, authenticated using (true);

drop policy if exists "Public read products" on public."Product";
create policy "Public read products"
  on public."Product" for select to anon, authenticated using (true);

drop policy if exists "Public read listings" on public."Listing";
create policy "Public read listings"
  on public."Listing" for select to anon, authenticated using (true);

drop policy if exists "Public read price history" on public."PriceHistory";
create policy "Public read price history"
  on public."PriceHistory" for select to anon, authenticated using (true);

commit;

-- ============================================================================
-- POST-APPLY VERIFICATION (read-only):
--   select relname, relrowsecurity
--     from pg_class
--    where relnamespace = 'public'::regnamespace
--      and relname in ('Store','Product','Listing','PriceHistory','_prisma_migrations');
--   -- expect relrowsecurity = true for all five.
--
--   select tablename, policyname, cmd, roles
--     from pg_policies
--    where schemaname = 'public'
--      and tablename in ('Store','Product','Listing','PriceHistory');
--   -- expect one SELECT policy per business table; none on _prisma_migrations.
--
-- Then re-run the Supabase security advisor -> expect 0 rls_disabled_in_public.
--
-- ROLLBACK (emergency only — restores the prior fully-exposed state; avoid):
--   begin;
--   drop policy if exists "Public read stores"        on public."Store";
--   drop policy if exists "Public read products"      on public."Product";
--   drop policy if exists "Public read listings"      on public."Listing";
--   drop policy if exists "Public read price history" on public."PriceHistory";
--   alter table public."Store"              disable row level security;
--   alter table public."Product"            disable row level security;
--   alter table public."Listing"            disable row level security;
--   alter table public."PriceHistory"       disable row level security;
--   alter table public."_prisma_migrations" disable row level security;
--   -- (revoked grants are NOT auto-restored; re-grant only if truly required)
--   commit;
-- ============================================================================
