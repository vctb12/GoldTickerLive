-- supabase/migrations/002_admin_rls_lockdown.sql
-- ============================================================================
-- Phase 1 (RED ZONE — STAGED, NOT APPLIED): Admin RLS lockdown
-- ============================================================================
-- PROBLEM: ~30 admin policies use `to authenticated using (true)`, granting ANY
-- authenticated Supabase user full admin CRUD — including customer PII in
-- public.orders.customer (jsonb) and write access to public.pricing_overrides.
-- The email allowlist (admin/supabase-config.js) is client-side only and the
-- file itself says authorization "must be enforced server-side via RLS".
--
-- FIX: reuse the schema's existing admin-role model (public.user_profiles.role)
-- via a SECURITY DEFINER helper, and replace every permissive admin policy with
-- an is_admin() check. Browser writes to orders + pricing_overrides are removed
-- entirely (those belong to the server/service-role, which bypasses RLS).
--
-- Policies that already use a uid/role check (alert_rules, alert_events,
-- notification_subscriptions, *_profiles, user_*, developer_apps user policies)
-- are NOT matched by the rewrite (their qual is a subquery, not literal `true`)
-- and remain untouched. Public-read and public-insert policies are also left as
-- is (they do not start with "Admin").
--
-- ⚠️  DO NOT auto-apply. Review, then run manually (see OWNER_REVIEW.md):
--       psql "$SUPABASE_DB_URL" -f supabase/migrations/002_admin_rls_lockdown.sql
--     or paste into the Supabase SQL editor.
-- ⚠️  PREREQUISITE (dashboard): Authentication → Providers → Email → DISABLE
--     "Allow new users to sign up" before/with applying this.
-- ============================================================================

begin;

-- 1) Admin check, reused by every admin policy. SECURITY DEFINER so the lookup
--    bypasses user_profiles' own RLS and cannot recurse through it.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.user_profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- 2) Rewrite every permissive admin policy (qual/with_check are literal `true`,
--    role = authenticated, name begins "Admin") to require is_admin().
--    Role/uid-based admin policies (qual is a subquery) are NOT matched.
do $$
declare
  r record;
begin
  for r in
    select tablename, policyname, cmd
    from pg_policies
    where schemaname = 'public'
      and 'authenticated' = any (roles)
      and policyname ilike 'Admin%'
      and coalesce(qual, 'true') = 'true'
      and coalesce(with_check, 'true') = 'true'
  loop
    execute format('drop policy %I on public.%I;', r.policyname, r.tablename);

    if r.cmd = 'SELECT' then
      execute format(
        'create policy %I on public.%I for select to authenticated using (public.is_admin());',
        r.policyname, r.tablename);
    elsif r.cmd = 'INSERT' then
      execute format(
        'create policy %I on public.%I for insert to authenticated with check (public.is_admin());',
        r.policyname, r.tablename);
    elsif r.cmd = 'UPDATE' then
      execute format(
        'create policy %I on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin());',
        r.policyname, r.tablename);
    elsif r.cmd = 'DELETE' then
      execute format(
        'create policy %I on public.%I for delete to authenticated using (public.is_admin());',
        r.policyname, r.tablename);
    else  -- 'ALL'
      execute format(
        'create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin());',
        r.policyname, r.tablename);
    end if;
  end loop;
end $$;

-- 3) Extra-sensitive tables (PII + price integrity): writes must NOT be possible
--    from the browser at all. Drop the authenticated write policies so only the
--    service-role (bypasses RLS, e.g. Stripe webhook / admin API) can write.
--    Admin SELECT (recreated in step 2 with is_admin()) is retained.
drop policy if exists "Admin insert orders" on public.orders;
drop policy if exists "Admin update orders" on public.orders;
drop policy if exists "Admin delete orders" on public.orders;

drop policy if exists "Admin insert pricing overrides" on public.pricing_overrides;
drop policy if exists "Admin update pricing overrides" on public.pricing_overrides;
drop policy if exists "Admin delete pricing overrides" on public.pricing_overrides;

commit;

-- 4) BOOTSTRAP (run once, AFTER reviewing, requires the owner account to exist).
--    Grants the owner admin role so they keep access under the new policies.
--    Uncomment and run with the service-role / SQL editor:
-- update public.user_profiles set role = 'admin'
--   where id = (select id from auth.users where email = 'vctb12@gmail.com');

-- ============================================================================
-- ROLLBACK (restores the prior permissive behaviour — emergency only):
--   begin;
--   do $$ declare r record; begin
--     for r in select tablename, policyname, cmd from pg_policies
--       where schemaname='public' and 'authenticated'=any(roles)
--         and policyname ilike 'Admin%'
--     loop execute format('drop policy %I on public.%I;', r.policyname, r.tablename);
--       -- recreate as the original using(true)/with check(true) by cmd ...
--     end loop; end $$;
--   commit;
-- Prefer instead: restore policies from supabase/schema.sql (source of truth).
-- ============================================================================
