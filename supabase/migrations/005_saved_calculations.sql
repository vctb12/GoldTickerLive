-- supabase/migrations/005_saved_calculations.sql
-- ============================================================================
-- Save-to-account storage (RED ZONE — STAGED, NOT APPLIED)
-- ============================================================================
-- WHY: the calculator's "Save to account" affordance needs a real per-user
-- store (owner brief 2026-07-06 §5.1). Accounts were deliberately locked down
-- in a prior security pass (see 002_admin_rls_lockdown.sql: open signup +
-- weak RLS exposed PII), so this table ships with RLS enabled and per-user
-- policies from the first statement — no public read, no anon access, and no
-- PII beyond the auth.users foreign key.
--
-- ⚠️  DO NOT auto-apply. This was authored in a sandbox that can NOT reach the
--     production project (nebdpxjazlnsrfmlpgeq — src/config/supabase.js), so
--     it is UNVERIFIED against production. Review, then run manually:
--       psql "$SUPABASE_DB_URL" -f supabase/migrations/005_saved_calculations.sql
--     or paste into the Supabase SQL editor.
-- ⚠️  PREREQUISITES, in order (per OWNER_REVIEW.md):
--     1. 002_admin_rls_lockdown.sql applied.
--     2. This migration applied; verification queries below pass.
--     3. Two-account isolation test below passes.
--     Only after all three may "Allow new users to sign up" be re-enabled
--     (Authentication → Providers → Email) — a separate owner decision.
-- ============================================================================

begin;

create table if not exists public.saved_calculations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Calculator surface the snapshot came from.
  kind text not null check (
    kind in ('value', 'scrap', 'zakat', 'buying', 'convert', 'portfolio_snapshot')
  ),
  -- Short user-facing name; bounded so the table can't be used as free storage.
  label text check (label is null or char_length(label) <= 120),
  -- The saved inputs/results (weights, karat, currency, computed values).
  -- No personal data belongs in here — the client only writes calculator state.
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.saved_calculations is
  'Per-user saved calculator snapshots. RLS: owner-only for every verb; no anon access.';

create index if not exists saved_calculations_user_created_idx
  on public.saved_calculations (user_id, created_at desc);

-- Row-level security: enabled and forced before any grant.
alter table public.saved_calculations enable row level security;
alter table public.saved_calculations force row level security;

-- No implicit access: strip PUBLIC/anon completely, then grant the verbs the
-- policies below will gate. (Grants alone never bypass RLS.)
revoke all on table public.saved_calculations from public;
revoke all on table public.saved_calculations from anon;
grant select, insert, update, delete on table public.saved_calculations to authenticated;

create policy "Users read own saved calculations"
  on public.saved_calculations for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users insert own saved calculations"
  on public.saved_calculations for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users update own saved calculations"
  on public.saved_calculations for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users delete own saved calculations"
  on public.saved_calculations for delete
  to authenticated
  using (user_id = auth.uid());

-- Keep updated_at honest on edits.
create or replace function public.saved_calculations_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists saved_calculations_touch_updated_at on public.saved_calculations;
create trigger saved_calculations_touch_updated_at
  before update on public.saved_calculations
  for each row execute function public.saved_calculations_touch_updated_at();

commit;

-- ============================================================================
-- VERIFICATION (run after applying; paste results into the review thread)
-- ============================================================================
-- 1) RLS is on and forced:
--      select relname, relrowsecurity, relforcerowsecurity
--      from pg_class where relname = 'saved_calculations';
--    Expect: t / t.
--
-- 2) Exactly four owner-scoped policies, all `to authenticated`:
--      select policyname, roles, cmd, qual, with_check
--      from pg_policies
--      where schemaname = 'public' and tablename = 'saved_calculations';
--    Expect every qual / with_check to be (user_id = auth.uid()); no anon row.
--
-- 3) Two-account isolation test (Supabase SQL editor or client):
--    a. Sign in as account A; insert a row; select — 1 row visible.
--    b. Sign in as account B; select — 0 rows; update/delete of A's row id — 0
--       rows affected; insert with user_id = A's uid — rejected by with_check.
--    c. Anon key without a session: every verb — permission denied / 0 rows.
-- ============================================================================
