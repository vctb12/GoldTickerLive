---
applyTo: "server/**,supabase/**,admin/**,src/**/*api*,scripts/**/*supabase*,docs/**/*SUPABASE*"
---

# Backend / Supabase Instructions

Gold Ticker Live has a Node/Express admin backend (`server/`) and Supabase persistence
(`supabase/`). Read this before changing server code, admin routes, Supabase schema, or
import/export flows.

## 1. Server layout

- `server.js` — app bootstrap, middleware, route mounting.
- `server/routes/` — one file per domain (admin, public-accounts, newsletter, billing, leads,
  shops-v1, developer-api, …).
- `server/lib/` — auth, billing repository, entitlements, API key auth, email service, etc.
- `server/middleware/` — global middleware (Helmet, CORS, rate limit, body parsers, error handler).
- `server/repositories/` — Supabase-backed repositories with file-fallback for tests.

Pattern: routes are thin; logic lives in `lib/` / `repositories/`.

## 2. Auth boundaries

| Route group               | Auth                                  | Notes                              |
| ------------------------- | ------------------------------------- | ---------------------------------- |
| `/api/v1/public/**`       | None (rate-limited)                   | Public data + API key tier         |
| `/api/v1/me/**`           | User JWT                              | Public accounts                    |
| `/api/v1/me/api-keys**`   | User JWT                              | API key management                 |
| `/api/v1/admin/**`        | Admin JWT (separate)                  | Admin panel only                   |
| `/api/v1/billing/**`      | User JWT, except `webhook` (signed)   | Stripe                             |
| `/api/v1/newsletter/**`   | None (subscribe), token (confirm/unsub) | Confirmation-token flow            |
| `/api/v1/leads`           | None (rate-limited) for POST          | Lead capture                       |

Never blur these. Admin JWT ≠ user JWT.

## 3. Route hygiene

- Each route validates inputs before use.
- Each route has an explicit success and error shape: `{ ok: true, data }` / `{ ok: false, error }`.
- Mutating routes return `201 Created` (POST) or `200 OK` with the updated resource.
- Errors map to status codes; never `200 OK` with `{ error }` in the body for a failure.
- Errors are logged server-side with a correlation id; the client message is generic.

## 4. Supabase usage

- **Two clients**:
  - `supabase` (anon key, used by browser) — RLS enforces row access
  - `supabaseAdmin` (service-role key, server only) — bypasses RLS
- Repositories choose the client deliberately. Service-role queries must include explicit
  filters; never `select('*')` an entire user-data table from the browser.
- Schema lives in `supabase/schema.sql`. Migrations are additive where possible.
- RLS policies are checked in by hand (review every PR that touches `supabase/`).

## 5. Repository fallback pattern

The repo's repositories support a `data/*.json` file fallback when Supabase env isn't configured
(useful for tests, local dev). Pattern:

```text
- supabase configured → read/write Supabase
- else → read/write data/<name>.json
- env override e.g. SHOP_LEADS_FILE → custom file path (used by tests)
```

When adding a new repository, follow this pattern so tests can run hermetically.

## 6. Admin panel (`admin/`)

- Built as a static HTML app served by GitHub Pages (`admin/index.html`, etc.).
- Auth: Supabase GitHub OAuth + admin allowlist.
- Don't mix admin UI assets with public site assets.
- Admin actions hit `/api/v1/admin/**` — always show a confirmation for destructive ops.

## 7. Migrations

- Schema changes ship as new SQL appended to `supabase/schema.sql` (numbered sections).
- Destructive migrations (DROP, ALTER … DROP COLUMN) require:
  - A backup snapshot
  - An owner-approved migration plan
  - A rollback note in the PR
- Add tests that verify the new schema works against the fallback repository too.

## 8. Audit logging

- Admin mutations write to an `admin_audit` table (or its file fallback) with: actor id, route,
  resource id, action, timestamp.
- Don't log secrets; redact tokens / passwords before persisting.

## 9. Rate limits

- Public endpoints: global limiter + per-route limiter where appropriate.
- Webhook endpoints: separate, very-narrow limit + signature verification.
- API key tier limits enforced in `server/lib/api-key-auth.js` — adjust there, not at the route.

## 10. Testing

- Tests live under `tests/`. Use node:test (`node --test`).
- Use `SHOP_LEADS_FILE` / `SHOP_CLAIMS_FILE` / `SHOP_CLICKS_FILE` / `SPONSORED_DATA_FILE` style env
  overrides to point repositories at tmp-isolated JSON files for hermetic runs.
- Don't hit real Supabase from tests.
- For Stripe / Resend, use dry-run modes (`STRIPE_DRY_RUN=true`, etc. — see `docs/BILLING_AND_ENTITLEMENTS.md` and `docs/NEWSLETTER_AND_LEADS.md`).

## 11. Common backend mistakes

- Returning user-facing strings in English only (server errors that surface in the UI must be
  translatable client-side via codes, not raw strings).
- Logging the full request body (may include passwords, OTPs, secrets).
- Not invalidating sessions on password change / admin demotion.
- Skipping CSRF on cookie-auth routes.
- Returning the raw Supabase error message (info leak about schema).

## 12. PR checklist

```md
- [ ] Routes validate inputs and have explicit auth
- [ ] Service-role client used only on the server, never reaches the browser bundle
- [ ] RLS policies present + reviewed for any new table
- [ ] Repository file-fallback works for tests
- [ ] No secrets in code/fixtures
- [ ] Audit logging in place for admin mutations
- [ ] `npm test` green, including auth + boundary tests
- [ ] Migrations are additive or owner-approved if destructive
- [ ] Docs updated (`docs/SUPABASE_SCHEMA.md`, route-specific docs)
```

See [`docs/API_BACKEND_FOUNDATION.md`](../../docs/API_BACKEND_FOUNDATION.md),
[`docs/SUPABASE_SCHEMA.md`](../../docs/SUPABASE_SCHEMA.md),
[`docs/SUPABASE_SETUP.md`](../../docs/SUPABASE_SETUP.md),
[`docs/ADMIN_GUIDE.md`](../../docs/ADMIN_GUIDE.md),
[`docs/BILLING_AND_ENTITLEMENTS.md`](../../docs/BILLING_AND_ENTITLEMENTS.md),
[`docs/PUBLIC_ACCOUNTS_AND_SAVED_TOOLS.md`](../../docs/PUBLIC_ACCOUNTS_AND_SAVED_TOOLS.md).
