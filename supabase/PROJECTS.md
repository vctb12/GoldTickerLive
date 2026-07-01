# Supabase projects — topology & RLS status

> Why this file exists: the codebase talks to **two different Supabase projects**, and the rest of
> `supabase/` (`schema.sql`, `verify.sql`, migrations `001`–`003`) describes only the first one.
> This caused real confusion during a security audit, so the split is documented here. Project refs
> below are already present in the repo (the committed **anon** key embeds one); they are not
> secrets. **Anon keys are safe to commit — they are gated by RLS. Service-role keys are not and
> must never be committed.**

## Project A — the site project: `nebdpxjazlnsrfmlpgeq`

- **Used by:** `src/config/supabase.js` and `admin/supabase-config.js`
  (`SUPABASE_URL = https://nebdpxjazlnsrfmlpgeq.supabase.co` + the public anon key).
- **How the site talks to it:** browser → PostgREST with the anon key only.
  `src/lib/supabase-data.js` queries `shop_listings` (`status=eq.active`). That table is **not
  currently deployed** (REST returns `404 PGRST205`), so `fetchShops()` returns `null` and the page
  falls back to the curated local `data/shops.js` directory — never a blank page.
- **Intended schema:** `supabase/schema.sql` (snake_case: `shops`, `shop_submissions`,
  `shop_listings`, `market_clusters`, `price_history`, `price_alerts`, `orders`,
  `pricing_overrides`, `user_profiles`, …).
- **Manual SQL migrations that target THIS project:** `001_price_history.sql`,
  `002_admin_rls_lockdown.sql`, `003_public_insert_hardening.sql` — all **staged, not applied** (see
  each file's header). `verify.sql` also targets this project.
- **RLS status:** **UNVERIFIED from this repo.** This project is not reachable via the Supabase MCP
  connector wired to this workspace, so its live RLS posture was not confirmed. Owner action: run
  `verify.sql` / the security advisor against it and apply `002`/`003` if the lints confirm the gaps
  they describe.

## Project B — the Prisma comparison DB: `lulqcytwhtjdsbzslpiw`

- **Used by:** a **separate, Vercel-integrated, Prisma-managed** app (a price-comparison feature).
  **No code in this repo reads or writes it** — the PascalCase tables are never referenced by any
  in-repo PostgREST/SDK call.
- **Tables (PascalCase, must stay quoted in SQL):** `Store`, `Product`, `Listing`, `PriceHistory`,
  plus Prisma's `_prisma_migrations`.
- **RLS status:** **VERIFIED 2026-06-30** via the Supabase security advisor + `pg_catalog`. RLS was
  **disabled** on all 5 tables and `anon`/`authenticated` held full
  `SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER` grants — i.e. the public anon key could
  read, overwrite, delete, and TRUNCATE every row. All 5 tables are owned by `postgres`
  (`rolbypassrls = true`) and `service_role` also bypasses RLS, so the Prisma server connection is
  unaffected by enabling RLS.
- **Fix:** `supabase/migrations/004_prisma_comparison_enable_rls.sql` — enable RLS, `REVOKE`
  write+TRUNCATE from `anon`/`authenticated` (TRUNCATE is not governed by RLS, so the REVOKE is
  required), add public read-only `SELECT` policies on the 4 business tables, and deny
  `anon`/`authenticated` on `_prisma_migrations`. **Staged, not applied** — apply requires owner
  approval, then re-run the advisor.

## Quick reference

| Aspect          | Project A (`nebdpxjazlnsrfmlpgeq`) | Project B (`lulqcytwhtjdsbzslpiw`)     |
| --------------- | ---------------------------------- | -------------------------------------- |
| Role            | Public site + admin                | Prisma price-comparison (separate app) |
| Naming          | snake_case                         | PascalCase                             |
| In-repo access  | Yes (anon key, PostgREST)          | None                                   |
| Schema source   | `supabase/schema.sql`              | Prisma (external repo)                 |
| Migrations here | `001`–`003` (staged)               | `004` (staged)                         |
| RLS confirmed?  | No (not reachable from this repo)  | Yes (advisor + `pg_catalog`)           |
