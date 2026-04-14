# Admin Panel Setup Guide

## Overview

The admin panel uses **Supabase GitHub OAuth** for authentication and **Supabase Postgres** for data
storage. It runs as static HTML on GitHub Pages — no server required.

## Quick Start (GitHub Pages + Supabase)

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **anon public key** from Settings → API

### 2. Run the Database Schema

1. Open the SQL Editor in your Supabase dashboard
2. Paste the contents of `supabase/schema.sql` and run it
3. This creates the `shops` and `site_settings` tables with Row Level Security policies

### 3. Enable GitHub OAuth

1. In Supabase: Authentication → Providers → GitHub → Enable
2. In GitHub: Settings → Developer settings → OAuth Apps → New OAuth App
   - **Homepage URL:** `https://yourusername.github.io/Gold-Prices/`
   - **Authorization callback URL:** `https://<your-project-ref>.supabase.co/auth/v1/callback`
3. Copy the GitHub **Client ID** and **Client Secret** into the Supabase GitHub provider settings

### 4. Configure the Admin Panel

Edit `admin/supabase-config.js`:

```js
export const SUPABASE_URL = 'https://<your-project-ref>.supabase.co';
export const SUPABASE_ANON_KEY = '<your-anon-public-key>';
export const ALLOWED_EMAIL = 'your-github-email@example.com';
```

`ALLOWED_EMAIL` must match the **primary email** on your GitHub account (Settings → Emails).

### 5. Access the Admin Panel

Navigate to: `https://yourusername.github.io/Gold-Prices/admin/`

Click **Sign in with GitHub** and authorize the OAuth app. After redirect, you will land on the
admin dashboard.

---

## What Works Today

| Page        | Path                  | Status                | Data Source            |
| ----------- | --------------------- | --------------------- | ---------------------- |
| Login       | `admin/login/`        | ✅ Working             | Supabase Auth          |
| Dashboard   | `admin/` (index)      | ⚠️ Partial (UI shell) | localStorage           |
| Shops       | `admin/shops/`        | ✅ Full CRUD           | Supabase `shops`       |
| Settings    | `admin/settings/`     | ✅ Read/Write          | Supabase `site_settings` |
| Pricing     | `admin/pricing/`      | 🔲 UI shell            | localStorage           |
| Orders      | `admin/orders/`       | 🔲 UI shell            | localStorage           |
| Content     | `admin/content/`      | 🔲 UI shell            | localStorage           |
| Social      | `admin/social/`       | 🔲 UI shell            | localStorage           |
| Analytics   | `admin/analytics/`    | 🔲 UI shell            | localStorage           |

---

## Authentication

- **Method:** Supabase GitHub OAuth
- **Guard:** Every admin page calls `requireAuth()` from `admin/supabase-auth.js` on load
- **Access control:** Only the email in `ALLOWED_EMAIL` is allowed; all other accounts are signed
  out and redirected to login
- **Session storage:** Supabase stores the session in localStorage under `sb-<ref>-auth-token`

### Auth Flow

```
/admin/login/  →  loginWithGitHub()  →  GitHub OAuth  →  Supabase session  →  /admin/
                                                                 ↓
                                              requireAuth() checks email match
```

---

## Data Storage

- **Shops:** Supabase `shops` table (full CRUD from the Shops admin page)
- **Settings:** Supabase `site_settings` table (key-value pairs)
- **UI shell pages:** localStorage only (Pricing, Orders, Content, Social, Analytics)

### Database Schema

Run `supabase/schema.sql` to create all required tables and RLS policies. The schema includes:

- `shops` — shop directory entries
- `site_settings` — key-value site configuration

---

## Security

### Best Practices

1. Set `ALLOWED_EMAIL` to your GitHub account's primary email
2. Keep RLS policies enabled — they restrict data access even with the anon key
3. Use HTTPS (GitHub Pages provides this by default)
4. Do not commit service role keys to the repo — the anon key is safe to commit because RLS
   protects the data
5. Periodically review Supabase Auth logs (Authentication → Logs) for unusual activity

---

## Troubleshooting

### Cannot Login

- Verify GitHub is enabled as a provider in Supabase (Authentication → Providers)
- Check the OAuth callback URL matches your Supabase project
- Open browser DevTools → Console for error messages

### Logged In But Redirected to Login

- Your GitHub email does not match `ALLOWED_EMAIL` in `admin/supabase-config.js`
- Check your GitHub primary email and update the config to match

### Data Not Persisting

- For Shops / Settings: check your Supabase dashboard — the tables should have data
- For other pages: they use localStorage only (data is lost on browser clear)
- If Supabase writes fail silently, check RLS policies and the browser console

### Page Shows Blank or Errors

- Ensure the Supabase CDN script loads: check for network errors on
  `cdn.jsdelivr.net/npm/@supabase/supabase-js@2`
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `admin/supabase-config.js`

---

## Optional: Self-Hosted Express Server

For self-hosted deployments, the Express server (`server.js`) and its JWT-based auth still exist as
a legacy option. This is **not required** for GitHub Pages.

### Express Quick Start

```bash
cp .env.example .env
# Edit .env: set JWT_SECRET, ADMIN_PASSWORD
npm start
# Server runs on http://localhost:3000
```

The Express server provides:

- JWT authentication via `lib/auth.js`
- File-based storage in `data/*.json`
- REST API at `/api/admin/` (shops, audit logs, users)

> ⚠️ The admin HTML pages no longer import `admin/api-client.js` (the Express API client). If you
> need Express-based admin, you will need to re-integrate the API client or build a custom frontend.

---

## Tests

Run the test suite to verify nothing is broken:

```bash
npm test
```

205 tests should pass.
