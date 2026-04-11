# Supabase Setup Guide

This document explains how to connect the Gold Prices platform to Supabase for persistent storage, authentication, and future backend functionality.

---

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free project.
2. Note your **Project URL** and **API keys** from *Settings → API*.

---

## 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here   # server side only
```

> **Never commit `.env` to source control.** The `.env.example` file shows what's needed.

---

## 3. Apply the Database Schema

Open the Supabase SQL Editor (*Database → SQL Editor → New query*), paste the contents of [`supabase/schema.sql`](../supabase/schema.sql), and run it.

This creates:

| Table | Purpose |
|-------|---------|
| `public.shops` | Gold shop directory with confidence scores and verification status |
| `public.audit_logs` | Immutable record of all admin actions |
| `public.user_profiles` | Admin role/name data linked to `auth.users` |

---

## 4. Row Level Security (RLS) Summary

All tables have RLS **enabled**. The policies enforce:

| Table | Unauthenticated | Authenticated user | Admin |
|-------|-----------------|-------------------|-------|
| `shops` | Read verified only | Read all | Full CRUD |
| `audit_logs` | No access | Read own | Read all |
| `user_profiles` | No access | Read own profile | Read/update all |

Writes to `audit_logs` are performed server-side using the **service-role key**, which bypasses RLS. Never expose the service-role key to the browser.

---

## 5. Install the Supabase package

```bash
npm install @supabase/supabase-js
```

The package is not listed as a hard dependency so the app runs without it
(falling back to file storage).  Install it only when you are ready to enable
Supabase storage.

---

## 6. Using the Client in Code

`lib/supabase-client.js` provides a lazy-initialised factory.  It returns
`null` gracefully if the env vars or the package are missing, so callers can
fall back to file storage.

### Server-side (admin API routes / server.js)
```js
const { getSupabaseClient } = require('./lib/supabase-client');

// Anon client – respects RLS (suitable for read-only public queries)
const supabase = getSupabaseClient();

// Service-role client – bypasses RLS (server-only; never expose to the browser)
const supabaseAdmin = getSupabaseClient(true);

const { data, error } = await supabaseAdmin.from('audit_logs').insert([...]);
```

### Repository layer
The `repositories/` layer selects the backend automatically based on
`STORAGE_BACKEND`.  Direct client usage is only needed for advanced queries
outside the repository interface.

### Browser (public pages)
For browser-side Supabase access (e.g. live shop queries), load via CDN:
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
```

Then use the globally available `supabase` object, initialised with your
`SUPABASE_URL` and `SUPABASE_ANON_KEY`.

---

## 7. Migrating From File-Based Storage

The current server uses `data/shops-data.json` and `data/audit-logs.json` for persistence. When Supabase is connected, you can migrate by:

1. Reading the existing JSON files.
2. Using a one-off import script that calls `supabase.from('shops').insert(shops)`.
3. Setting `STORAGE_BACKEND=supabase` in `.env`.
4. The `repositories/` layer (which the admin API routes use) will automatically switch to Supabase — no further code changes required.

The file-based layer continues to work as a fallback until the migration is verified.

See [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) for the full storage abstraction details.

---

## 7. Authentication via Supabase Auth (Optional)

If you want to replace the current JWT-based login with Supabase Auth:

1. Enable *Email* provider in Supabase *Authentication → Providers*.
2. Create your admin user in Supabase *Authentication → Users*.
3. Insert a matching row in `public.user_profiles` with `role = 'admin'`.
4. In `admin.html`, replace the current login flow with `supabase.auth.signInWithPassword(...)`.
5. The admin page should call `supabase.auth.getSession()` on load and redirect to login if no session.

The existing JWT flow in `lib/auth.js` and `server/routes/admin/index.js` can continue to be used until you're ready to switch.

---

## 8. Follow-up Recommendations

- Add Supabase Realtime subscriptions for live shop-count updates on the admin dashboard.
- Use Supabase Storage for shop images/logos.
- Use Supabase Edge Functions as a serverless proxy for the gold/FX API calls (removes CORS exposure of API keys from the browser).
- Set up Supabase database backups and point-in-time recovery for production data safety.
