-- ============================================================
-- supabase/seed-test-data.sql
-- Safe test data for verifying every admin page works.
-- Run in Supabase SQL Editor after schema.sql.
--
-- All test records are clearly labelled with [TEST] so you can
-- identify and delete them once you have verified each page.
--
-- To delete all test data after testing:
--   DELETE FROM public.shops          WHERE name LIKE '%[TEST]%';
--   DELETE FROM public.pricing_overrides WHERE reason LIKE '%[TEST]%';
--   DELETE FROM public.orders         WHERE id LIKE 'TEST-%';
--   DELETE FROM public.content_posts  WHERE title LIKE '%[TEST]%';
--   DELETE FROM public.social_posts   WHERE template = 'test';
--   DELETE FROM public.analytics_events WHERE session_id = 'test-session';
-- ============================================================


-- ── Shops (3 test shops across 3 countries) ──────────────────

INSERT INTO public.shops (
  name, name_ar, city, country, country_code, market, category,
  specialties, phone, website, address, area,
  details_availability, featured, verified, confidence, notes, created_by
) VALUES
(
  '[TEST] Gold Palace Dubai',
  '[اختبار] قصر الذهب دبي',
  'Dubai', 'UAE', 'AE',
  'Dubai Gold Souk',
  'retailer',
  ARRAY['24K', '22K', 'jewellery'],
  '+971501234567',
  'https://example.com/goldpalace',
  'Shop 12, Dubai Gold Souk, Deira',
  'Deira',
  'full', true, true, 95,
  'Test shop — safe to delete',
  'vctb12@gmail.com'
),
(
  '[TEST] Riyadh Gold Exchange',
  '[اختبار] بورصة الذهب الرياض',
  'Riyadh', 'Saudi Arabia', 'SA',
  'Al Zal Market',
  'exchange',
  ARRAY['24K', 'coins', 'bars'],
  '+966551234567',
  NULL,
  'Al Zal Gold Market, Riyadh',
  'Al Zal',
  'partial', false, true, 72,
  'Test shop — safe to delete',
  'vctb12@gmail.com'
),
(
  '[TEST] Cairo Silver & Gold',
  '[اختبار] الذهب والفضة القاهرة',
  'Cairo', 'Egypt', 'EG',
  'Khan El Khalili',
  'retailer',
  ARRAY['18K', '21K', 'jewellery', 'silver'],
  '+201001234567',
  NULL,
  'Khan El Khalili Bazaar, Cairo',
  'Khan El Khalili',
  'limited', false, false, 45,
  'Test shop — unverified, should NOT appear in public directory',
  'vctb12@gmail.com'
);


-- ── Pricing overrides (one active, one expired, one inactive) ──

INSERT INTO public.pricing_overrides (
  karat, currency, unit, override_price, reason, expires_at, active, created_by
) VALUES
(
  '24', 'AED', 'gram',
  360.50,
  '[TEST] Active override for testing',
  NOW() + INTERVAL '7 days',
  true,
  'vctb12@gmail.com'
),
(
  '22', 'USD', 'gram',
  105.25,
  '[TEST] Expired override for testing',
  NOW() - INTERVAL '1 day',
  false,
  'vctb12@gmail.com'
),
(
  '21', 'SAR', 'gram',
  1250.00,
  '[TEST] Manually deactivated override',
  NULL,
  false,
  'vctb12@gmail.com'
);


-- ── Orders (one per status) ──────────────────────────────────

INSERT INTO public.orders (
  id, items, pricing, gold_spot_at_order, fx_rate_at_order,
  customer, status, status_history, created_by
) VALUES
(
  'TEST-20260414-001',
  '[{"karat": "24", "weight": 10, "unit": "gram", "price_per_unit": 360.50}]'::jsonb,
  '{"subtotal": 3605.00, "fees": 50.00, "total": 3655.00, "currency": "AED"}'::jsonb,
  3150.00,
  3.6725,
  '{"name": "Ahmed Al Test", "email": "test@example.com", "phone": "+971501234567"}'::jsonb,
  'pending',
  '[{"status": "pending", "timestamp": "2026-04-14T10:00:00Z", "note": "Order received"}]'::jsonb,
  'vctb12@gmail.com'
),
(
  'TEST-20260414-002',
  '[{"karat": "22", "weight": 5, "unit": "gram", "price_per_unit": 330.25}]'::jsonb,
  '{"subtotal": 1651.25, "fees": 25.00, "total": 1676.25, "currency": "AED"}'::jsonb,
  3150.00,
  3.6725,
  '{"name": "Sarah Test User", "email": "sarah@example.com", "phone": "+9665512345"}'::jsonb,
  'confirmed',
  '[
    {"status": "pending",   "timestamp": "2026-04-13T09:00:00Z", "note": "Order received"},
    {"status": "confirmed", "timestamp": "2026-04-13T11:00:00Z", "note": "Payment confirmed"}
  ]'::jsonb,
  'vctb12@gmail.com'
),
(
  'TEST-20260414-003',
  '[{"karat": "18", "weight": 20, "unit": "gram", "price_per_unit": 270.00}]'::jsonb,
  '{"subtotal": 5400.00, "fees": 75.00, "total": 5475.00, "currency": "AED"}'::jsonb,
  3145.00,
  3.6725,
  '{"name": "Mohammed Test", "email": "m.test@example.com", "phone": "+97444123456"}'::jsonb,
  'completed',
  '[
    {"status": "pending",    "timestamp": "2026-04-10T08:00:00Z", "note": "Order received"},
    {"status": "confirmed",  "timestamp": "2026-04-10T10:00:00Z", "note": "Payment confirmed"},
    {"status": "processing", "timestamp": "2026-04-11T09:00:00Z", "note": "Processing"},
    {"status": "completed",  "timestamp": "2026-04-12T14:00:00Z", "note": "Delivered"}
  ]'::jsonb,
  'vctb12@gmail.com'
);


-- ── Content posts (one draft, one published) ─────────────────

INSERT INTO public.content_posts (
  title, title_ar, slug, body, body_ar, excerpt,
  category, tags, status, publish_date, read_time, author
) VALUES
(
  '[TEST] How Gold Prices Are Calculated',
  '[اختبار] كيف يتم احتساب أسعار الذهب',
  'test-how-gold-prices-calculated',
  '<h2>Understanding Gold Pricing</h2><p>This is a test article. It explains how gold prices are derived from the spot price using karat purity and exchange rates. Safe to delete.</p>',
  '<h2>فهم أسعار الذهب</h2><p>هذا مقال اختباري. آمن للحذف.</p>',
  'A test article explaining gold price calculation methodology.',
  'guide',
  ARRAY['24K', 'pricing', 'methodology', 'test'],
  'published',
  '2026-04-14',
  3,
  'Admin'
),
(
  '[TEST] Draft Article — Do Not Publish',
  '[اختبار] مقال مسودة',
  'test-draft-article',
  '<p>This is a draft test article. It should not be visible to the public. Safe to delete.</p>',
  '<p>هذا مقال مسودة اختباري. آمن للحذف.</p>',
  'A draft article for testing the content editor.',
  'news',
  ARRAY['draft', 'test'],
  'draft',
  NULL,
  2,
  'Admin'
);


-- ── Social posts (two test entries) ──────────────────────────

INSERT INTO public.social_posts (
  template, language, platform, text, generated_at
) VALUES
(
  'test',
  'en',
  'twitter',
  '🥇 [TEST POST] Gold at $3,150/oz today. UAE 24K: AED 359/g. This is a test entry — safe to delete.',
  EXTRACT(EPOCH FROM NOW()) * 1000
),
(
  'test',
  'ar',
  'twitter',
  '🥇 [اختبار] سعر الذهب $3,150/أوقية. 24 قيراط إمارات: 359 درهم/غ. هذا إدخال اختباري — آمن للحذف.',
  EXTRACT(EPOCH FROM NOW()) * 1000
);


-- ── Analytics events (a handful of sample events) ────────────

INSERT INTO public.analytics_events (
  event, page, session_id, ts, properties
) VALUES
(
  'pageview', '/', 'test-session',
  EXTRACT(EPOCH FROM NOW() - INTERVAL '2 hours') * 1000,
  '{"referrer": "google.com", "lang": "en"}'::jsonb
),
(
  'pageview', '/tracker.html', 'test-session',
  EXTRACT(EPOCH FROM NOW() - INTERVAL '1 hour 45 minutes') * 1000,
  '{"referrer": null, "lang": "en"}'::jsonb
),
(
  'click', '/tracker.html', 'test-session',
  EXTRACT(EPOCH FROM NOW() - INTERVAL '1 hour 44 minutes') * 1000,
  '{"element": "currency-selector", "value": "AED"}'::jsonb
),
(
  'pageview', '/shops.html', 'test-session',
  EXTRACT(EPOCH FROM NOW() - INTERVAL '1 hour') * 1000,
  '{"referrer": "/tracker.html", "lang": "en"}'::jsonb
),
(
  'search', '/shops.html', 'test-session',
  EXTRACT(EPOCH FROM NOW() - INTERVAL '58 minutes') * 1000,
  '{"query": "dubai gold souk", "results": 12}'::jsonb
),
(
  'pageview', '/', 'test-session-2',
  EXTRACT(EPOCH FROM NOW() - INTERVAL '30 minutes') * 1000,
  '{"referrer": null, "lang": "ar"}'::jsonb
),
(
  'pageview', '/calculator.html', 'test-session-2',
  EXTRACT(EPOCH FROM NOW() - INTERVAL '25 minutes') * 1000,
  '{"referrer": "/", "lang": "ar"}'::jsonb
);


-- ── Verify the seed data was inserted ────────────────────────

SELECT 'shops' AS table_name, COUNT(*) AS inserted FROM public.shops WHERE name LIKE '%[TEST]%'
UNION ALL
SELECT 'pricing_overrides', COUNT(*) FROM public.pricing_overrides WHERE reason LIKE '%[TEST]%'
UNION ALL
SELECT 'orders', COUNT(*) FROM public.orders WHERE id LIKE 'TEST-%'
UNION ALL
SELECT 'content_posts', COUNT(*) FROM public.content_posts WHERE title LIKE '%[TEST]%'
UNION ALL
SELECT 'social_posts', COUNT(*) FROM public.social_posts WHERE template = 'test'
UNION ALL
SELECT 'analytics_events', COUNT(*) FROM public.analytics_events WHERE session_id LIKE 'test-%';

-- Expected:
--   shops:              3
--   pricing_overrides:  3
--   orders:             3
--   content_posts:      2
--   social_posts:       2
--   analytics_events:   7
