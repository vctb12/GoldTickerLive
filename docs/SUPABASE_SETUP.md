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

## 5. Using the Client in Code

### Browser (public pages)
```html
<!-- Load Supabase CDN before your ES module scripts -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
```

Then in your JS module:
```js
import { getSupabaseClient } from '/lib/supabase-client.js';

const supabase = getSupabaseClient(); // uses SUPABASE_ANON_KEY
const { data, error } = await supabase.from('shops').select('*').eq('verified', true);
```

### Server (admin API routes / server.js)
```js
// npm install @supabase/supabase-js  (already in package.json dependencies if added)
const { getSupabaseClient } = require('./lib/supabase-client');
const supabase = getSupabaseClient(true); // useServiceRole = true — bypasses RLS
const { data, error } = await supabase.from('audit_logs').insert([...]);
```

---

## 6. Migrating From File-Based Storage

The current server uses `data/shops-data.json` and `data/audit-logs.json` for persistence. When Supabase is connected, you can migrate by:

1. Reading the existing JSON files.
2. Using a one-off import script that calls `supabase.from('shops').insert(shops)`.
3. Switching `lib/admin/shop-manager.js` to read/write Supabase instead of the JSON files.
4. Switching `lib/audit-log.js` to insert into `public.audit_logs`.

Keep the file-based layer as a fallback until the migration is verified.

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
