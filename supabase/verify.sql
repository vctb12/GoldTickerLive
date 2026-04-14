-- ============================================================
-- supabase/verify.sql
-- Run this after applying schema.sql to confirm everything is
-- configured correctly. Paste into Supabase SQL Editor → Run.
-- ============================================================

-- ── 1. Confirm all 11 tables exist ──────────────────────────

SELECT
  table_name,
  CASE
    WHEN table_name IN (
      'analytics_events', 'api_call_logs', 'audit_logs', 'content_posts',
      'fetch_logs', 'gold_prices', 'orders', 'pricing_overrides',
      'shops', 'site_settings', 'user_profiles'
    ) THEN '✅ expected'
    ELSE '⚠️  unexpected'
  END AS status
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected output: 11 rows, all marked ✅ expected.
-- If any expected table is missing, re-run schema.sql.


-- ── 2. Confirm RLS is enabled on all tables ──────────────────

SELECT
  relname AS table_name,
  CASE WHEN relrowsecurity THEN '✅ RLS ON' ELSE '❌ RLS OFF' END AS rls_status
FROM pg_class
WHERE relname IN (
  'analytics_events', 'api_call_logs', 'audit_logs', 'content_posts',
  'fetch_logs', 'gold_prices', 'orders', 'pricing_overrides',
  'shops', 'site_settings', 'user_profiles'
)
AND relkind = 'r'
ORDER BY relname;

-- Expected: all rows show ✅ RLS ON.
-- If any show ❌ RLS OFF, run:
--   ALTER TABLE public.<table_name> ENABLE ROW LEVEL SECURITY;


-- ── 3. Confirm RLS policies exist ───────────────────────────

SELECT
  schemaname,
  tablename,
  policyname,
  cmd AS operation,
  roles
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;

-- Expected: at least 2–5 policies per table.
-- Shops should have 5 (public read, admin read, insert, update, delete).
-- site_settings should have 3 (public read, admin insert, admin update).
-- Orders, pricing_overrides, content_posts should each have 5.


-- ── 4. Confirm the site_settings seed row exists ────────────

SELECT id, value, updated_at
FROM public.site_settings;

-- Expected: 1 row with id = 'default' and value = '{}'
-- If empty, run:
--   INSERT INTO public.site_settings (id, value) VALUES ('default', '{}')
--   ON CONFLICT (id) DO NOTHING;


-- ── 5. Confirm the set_updated_at trigger function exists ───

SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'set_updated_at';

-- Expected: 1 row. If missing, the trigger function was not created.
-- Copy the function definition from schema.sql and run it.


-- ── 6. Confirm all update triggers are active ───────────────

SELECT
  trigger_name,
  event_object_table AS table_name,
  event_manipulation AS event,
  action_timing AS timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;

-- Expected triggers (one per table that has updated_at):
--   shops_set_updated_at
--   site_settings_set_updated_at
--   pricing_overrides_set_updated_at
--   orders_set_updated_at
--   content_posts_set_updated_at
--   user_profiles_set_updated_at


-- ── 7. Confirm shops columns (including extras added later) ──

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'shops'
ORDER BY ordinal_position;

-- Expected columns (21 total):
--   id, name, city, country, country_code, market, category, specialties,
--   phone, website, address, latitude, longitude, hours,
--   details_availability, featured, verified, confidence, notes,
--   created_at, updated_at, created_by,
--   name_ar, area, address_ar, rating
-- The last 4 (name_ar, area, address_ar, rating) were added with ALTER TABLE.
-- If any are missing, run the ALTER TABLE statements from schema.sql.


-- ── 8. Count rows in each table ─────────────────────────────

SELECT 'shops' AS tbl, COUNT(*) AS rows FROM public.shops
UNION ALL
SELECT 'pricing_overrides', COUNT(*) FROM public.pricing_overrides
UNION ALL
SELECT 'orders', COUNT(*) FROM public.orders
UNION ALL
SELECT 'content_posts', COUNT(*) FROM public.content_posts
UNION ALL
SELECT 'social_posts', COUNT(*) FROM public.social_posts
UNION ALL
SELECT 'analytics_events', COUNT(*) FROM public.analytics_events
UNION ALL
SELECT 'api_call_logs', COUNT(*) FROM public.api_call_logs
UNION ALL
SELECT 'gold_prices', COUNT(*) FROM public.gold_prices
UNION ALL
SELECT 'fetch_logs', COUNT(*) FROM public.fetch_logs
UNION ALL
SELECT 'site_settings', COUNT(*) FROM public.site_settings
ORDER BY tbl;

-- Expected after a fresh schema run (before any data):
--   all = 0, except site_settings = 1 (the seeded default row).
-- After you add test data via seed-test-data.sql, you will see more rows.


-- ── 9. Test anon access (simulates the public site) ─────────

-- Anonymous users should only see verified shops:
SET LOCAL ROLE anon;
SELECT id, name, verified FROM public.shops LIMIT 5;
-- If RLS is correct: only rows where verified = true are returned.
-- If table is empty, no rows are returned (correct — not an error).

-- Anonymous users should see site_settings:
SELECT id, value FROM public.site_settings;
-- Expected: 1 row returned.

-- Anonymous users should NOT see orders:
SELECT * FROM public.orders LIMIT 1;
-- Expected: 0 rows returned (RLS blocks access).

-- Reset role after test:
RESET ROLE;


-- ── 10. Full health summary ──────────────────────────────────

SELECT
  t.table_name,
  CASE WHEN c.relrowsecurity THEN '✅' ELSE '❌' END AS rls,
  COUNT(p.policyname) AS policies,
  (SELECT COUNT(*) FROM information_schema.columns ic
   WHERE ic.table_schema = 'public' AND ic.table_name = t.table_name) AS columns
FROM information_schema.tables t
JOIN pg_class c ON c.relname = t.table_name AND c.relkind = 'r'
LEFT JOIN pg_policies p ON p.tablename = t.table_name AND p.schemaname = 'public'
WHERE t.table_schema = 'public'
GROUP BY t.table_name, c.relrowsecurity
ORDER BY t.table_name;

-- A healthy setup shows ✅ for every table and at least 1 policy per table.
-- Tables like gold_prices and fetch_logs (written by service role) may have 0 policies —
-- this is correct: the service role bypasses RLS and does not need policies.
