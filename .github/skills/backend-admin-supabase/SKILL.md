---
name: backend-admin-supabase
description: Use for backend / admin / database / API / Supabase work — schema changes, new routes, admin features, import/export flows.
when_to_use:
  - Adding a server route
  - Touching the Supabase schema
  - Building / modifying the admin panel
  - Import / export flows for shops, leads, newsletter, billing
related_files:
  - server/**
  - supabase/**
  - admin/**
  - docs/API_BACKEND_FOUNDATION.md
  - docs/SUPABASE_SCHEMA.md
  - docs/ADMIN_GUIDE.md
related_prompts:
  - .github/prompts/backend-admin-supabase.prompt.md
---

# Skill: Backend / Admin / Supabase

Anchors backend work to the patterns the repo already uses: thin routes, lib/repository
separation, file-fallback for tests, admin/audit boundary, RLS-by-default.

## Workflow

1. **Read** `docs/API_BACKEND_FOUNDATION.md` and `docs/SUPABASE_SCHEMA.md`.
2. **Map** the change: route → lib → repository → table/schema.
3. **Design** the schema first (if new tables) — additive migrations, RLS policies, anon vs.
   service-role boundaries.
4. **Implement** routes thin; logic in `lib/`; persistence in `repositories/` with file fallback.
5. **Test** with `node:test`, using env-overridden file paths for hermetic runs.
6. **Document** in `docs/` (route table, schema doc, env vars).
7. **Verify** with `npm test`, `npm run lint`, `npm run validate`.

## Checklists in this skill

- [`checklists/database.md`](./checklists/database.md)
- [`checklists/admin.md`](./checklists/admin.md)
- [`checklists/api.md`](./checklists/api.md)
- [`checklists/auth.md`](./checklists/auth.md)

## Common mistakes

- Routes that touch Supabase directly (skip the repository layer).
- Service-role key in a module that gets bundled for the browser.
- Forgetting to update `.env.example` + `docs/environment-variables.md`.
- Admin route without rate limit / audit log.
- Tests that hit real Supabase / Stripe / Resend.
- New table without RLS.

See [`.github/instructions/backend-supabase.instructions.md`](../../instructions/backend-supabase.instructions.md).
