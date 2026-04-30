# Supabase Mastery Guide — Gold Ticker Live

> **This is your single source of truth for everything Supabase in this project.** Read it top to
> bottom the first time. After that, use the Table of Contents to jump to the section you need.

---

## Table of Contents

1. [What Supabase Does in This Project](#1-what-supabase-does-in-this-project)
2. [Your Project — Already Configured](#2-your-project--already-configured)
3. [Step 1 — Run the Database Schema](#3-step-1--run-the-database-schema)
4. [Step 2 — Set Up GitHub OAuth Login](#4-step-2--set-up-github-oauth-login)
5. [Step 3 — Configure GitHub Repository Secrets](#5-step-3--configure-github-repository-secrets)
6. [Step 4 — Verify the Admin Panel Login Flow](#6-step-4--verify-the-admin-panel-login-flow)
7. [Step 5 — Verify Every Admin Page](#7-step-5--verify-every-admin-page)
8. [Step 6 — Public Site Feature Flags](#8-step-6--public-site-feature-flags)
9. [How Row Level Security (RLS) Works](#9-how-row-level-security-rls-works)
10. [Database Reference — All Tables](#10-database-reference--all-tables)
11. [Code Patterns Used Everywhere](#11-code-patterns-used-everywhere)
12. [Troubleshooting Guide](#12-troubleshooting-guide)
13. [Keeping the Schema in Sync](#13-keeping-the-schema-in-sync)

---

## 1. What Supabase Does in This Project

Supabase provides three things for this platform:

| Feature                       | Used for                                                                                                    |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Postgres Database**         | Shops, orders, pricing overrides, content posts, social posts, analytics events, gold prices, site settings |
| **Auth** (GitHub OAuth)       | Admin login — only your GitHub account (`vctb12@gmail.com`) can access the admin panel                      |
| **REST API** (auto-generated) | All admin pages talk directly to the database from the browser using the Supabase JS client                 |

There is **no separate backend server** involved in the admin panel. The Supabase JS client connects
directly from the browser to your Supabase project using the **anon public key**. Row Level Security
(RLS) policies on each table enforce that only authenticated admins can write data.

**Data flow:**

```
Admin browser
  → Supabase JS client (loaded from CDN in each admin page)
    → Supabase REST API (https://nebdpxjazlnsrfmlpgeq.supabase.co)
      → Postgres database (hosted by Supabase)
        ← RLS policies decide what the user can read/write
```

**Fallback flow (when Supabase is unreachable):**

```
Admin browser
  → getSupabase() returns null (or throws)
    → All admin pages fall back to localStorage cache
      → Data survives locally but won't sync across devices
```

---

## 2. Your Project — Already Configured

Your Supabase project is **already set up**. The credentials are in `admin/supabase-config.js`:

```
Project URL:  https://nebdpxjazlnsrfmlpgeq.supabase.co
Anon Key:     eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (public, safe to commit)
Allowed Email: vctb12@gmail.com
```

The anon key is intentionally public — it is the **read-only public key**, not the secret service
role key. RLS policies on every table ensure that even with this key, anonymous users can only read
verified shops and published content. Writes require authentication.

**What is already done ✅**

- [x] Supabase project created at `nebdpxjazlnsrfmlpgeq.supabase.co`
- [x] Credentials in `admin/supabase-config.js`
- [x] Auth helper in `admin/supabase-auth.js`
- [x] Full schema written in `supabase/schema.sql`
- [x] All 7 admin pages have Supabase integration code with localStorage fallback
- [x] `sync-db-to-git.yml` workflow reads from Supabase and commits shop data to `data/shops.js`

**What you still need to do ⏳**

- [ ] Run `supabase/schema.sql` in the Supabase SQL Editor (creates all tables)
- [ ] Configure GitHub OAuth in Supabase Auth settings
- [ ] Add `SUPABASE_SERVICE_ROLE_KEY` as a GitHub secret
- [ ] Test login and each admin page

---

## 3. Step 1 — Run the Database Schema

This is the **most important step**. Without it, no tables exist and all admin pages fall back to
localStorage.

### 3.1 Open the Supabase SQL Editor

1. Go to **https://supabase.com** and sign in
2. Click your project: **nebdpxjazlnsrfmlpgeq** (or search for "Gold-Prices")
3. In the left sidebar, click **SQL Editor**
4. Click **+ New query**

### 3.2 Paste and Run the Schema

1. Open `supabase/schema.sql` in this repository
2. Copy the **entire file contents** (all ~460 lines)
3. Paste into the SQL Editor query window
4. Click **Run** (or press Ctrl+Enter / Cmd+Enter)

You should see: `Success. No rows returned`

> ⚠️ **If you see errors**, the most common cause is running it a second time. The schema uses
> `CREATE TABLE IF NOT EXISTS` and `IF NOT EXISTS` for all objects, so it is safe to re-run. Errors
> about "already exists" on trigger names are harmless — skip them.

### 3.3 Verify the Tables Were Created

After running the schema, paste this into a new SQL Editor query and run it:

```sql
SELECT table_name, pg_size_pretty(pg_total_relation_size(quote_ident(table_name)::text)) AS size
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

You should see these 12 tables:

| Table               | Purpose                                |
| ------------------- | -------------------------------------- |
| `analytics_events`  | Client-side event tracking             |
| `api_call_logs`     | API monitoring logs                    |
| `audit_logs`        | Admin action history                   |
| `content_posts`     | Blog / educational articles            |
| `fetch_logs`        | Gold price fetch history (Twitter bot) |
| `gold_prices`       | Historical gold price snapshots        |
| `orders`            | Gold purchase orders                   |
| `pricing_overrides` | Admin manual price adjustments         |
| `shops`             | Gold shop directory                    |
| `site_settings`     | Public feature flags (single row)      |
| `social_posts`      | Social media post generation history   |
| `user_profiles`     | Admin user profiles                    |

Also run the full verification file for a detailed health check: → See `supabase/verify.sql`

---

## 4. Step 2 — Set Up GitHub OAuth Login

The admin panel uses **GitHub OAuth** — you log in with your GitHub account. Supabase handles the
OAuth flow. This is the only way to access the admin panel.

### 4.1 Create a GitHub OAuth App

1. Go to **https://github.com/settings/developers**
2. Click **OAuth Apps** → **New OAuth App**
3. Fill in the form:

   | Field                      | Value                                                       |
   | -------------------------- | ----------------------------------------------------------- |
   | Application name           | `Gold-Prices Admin`                                         |
   | Homepage URL               | `https://vctb12.github.io/Gold-Prices`                      |
   | Authorization callback URL | `https://nebdpxjazlnsrfmlpgeq.supabase.co/auth/v1/callback` |

4. Click **Register application**
5. On the next page, click **Generate a new client secret**
6. **Copy both the Client ID and Client Secret** — you only see the secret once

### 4.2 Add the OAuth App to Supabase

1. In Supabase, go to **Authentication** → **Providers**
2. Find **GitHub** in the list and click it
3. Toggle **Enable GitHub provider** to ON
4. Paste your GitHub **Client ID** and **Client Secret**
5. The **Redirect URL** shown is `https://nebdpxjazlnsrfmlpgeq.supabase.co/auth/v1/callback` —
   confirm this matches what you put in GitHub
6. Click **Save**

### 4.3 Configure the Allowed Email

Your admin panel only allows one email: `vctb12@gmail.com` (set in `admin/supabase-config.js`).

After login, `admin/supabase-auth.js` checks:

```javascript
session.user.email === ALLOWED_EMAIL; // vctb12@gmail.com
```

If the email doesn't match, the user is immediately signed out and redirected to the login page.
This means no one else can access your admin panel even if they know the URL.

> **Important**: Your GitHub account's primary email must be `vctb12@gmail.com`. If it is a
> different email, update `ALLOWED_EMAIL` in `admin/supabase-config.js` to match.

### 4.4 Add Site URL to Supabase

1. In Supabase, go to **Authentication** → **URL Configuration**
2. Set **Site URL** to: `https://vctb12.github.io`
3. Under **Redirect URLs**, add:
   - `https://vctb12.github.io/Gold-Prices/admin/`
   - `https://vctb12.github.io/Gold-Prices/admin/login/`
   - `http://localhost:8080/admin/` (for local development)
4. Click **Save**

---

## 5. Step 3 — Configure GitHub Repository Secrets

Several GitHub Actions workflows need Supabase credentials as secrets.

### 5.1 Find Your Secrets

In Supabase, go to **Settings** → **API**. You will see:

- **Project URL**: `https://nebdpxjazlnsrfmlpgeq.supabase.co`
- **Project API keys**:
  - `anon` / `public` — safe for client-side use (already in `admin/supabase-config.js`)
  - `service_role` — **secret, never commit this** — used for server-side operations that bypass RLS

### 5.2 Add Secrets to GitHub

1. Go to your repo: **https://github.com/vctb12/Gold-Prices**
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for each:

| Secret Name                 | Value                                                  |
| --------------------------- | ------------------------------------------------------ |
| `SUPABASE_URL`              | `https://nebdpxjazlnsrfmlpgeq.supabase.co`             |
| `SUPABASE_ANON_KEY`         | The `anon` / `public` key from Supabase Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | The `service_role` key from Supabase Settings → API    |

> ⚠️ **Never** put the `service_role` key in any file committed to the repository. It bypasses all
> RLS policies and gives full database access.

### 5.3 Which Workflows Use These Secrets

| Workflow             | Secrets Used                                              | Purpose                                                                    |
| -------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------- |
| `sync-db-to-git.yml` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`               | Reads verified shops and commits `data/shops.js` to the repo automatically |
| `deploy.yml`         | None (Supabase credentials are baked into client-side JS) | Deploys site to GitHub Pages                                               |

---

## 6. Step 4 — Verify the Admin Panel Login Flow

### 6.1 Log In

1. Open: `https://vctb12.github.io/Gold-Prices/admin/`
   - Or locally: `http://localhost:8080/admin/`
2. You should be redirected to the login page at `/admin/login/`
3. Click **Sign in with GitHub**
4. GitHub OAuth dialog opens — authorize the app
5. You are redirected back to `/admin/` — you should see the dashboard

### 6.2 What Happens During Login

```
1. User clicks "Sign in with GitHub"
2. Browser redirects to GitHub OAuth authorization URL
3. User approves on GitHub
4. GitHub redirects back to Supabase callback URL
5. Supabase creates/refreshes the session and stores it in localStorage
   (key: sb-nebdpxjazlnsrfmlpgeq-auth-token)
6. Browser is redirected back to /admin/
7. supabase-auth.js reads the session from localStorage via getSession()
8. requireAuth() checks session.user.email === 'vctb12@gmail.com'
9. If match: admin panel loads
   If no match: signs out + redirects to /admin/login/
```

### 6.3 Session Persistence

The Supabase session is stored in `localStorage` under:

```
sb-nebdpxjazlnsrfmlpgeq-auth-token
```

It auto-refreshes. You stay logged in until you:

- Click Sign Out
- Clear browser localStorage
- The session expires (default: 1 week)

### 6.4 Flash Prevention

Each admin page has an inline `<script>` at the top that runs synchronously before the page renders:

```javascript
(function () {
  var k = Object.keys(localStorage);
  if (
    !k.some(function (x) {
      return x.startsWith('sb-') && x.endsWith('-auth-token');
    })
  )
    window.location.replace('./login/');
})();
```

This immediately redirects unauthenticated users before any content renders, preventing a flash of
the admin UI.

---

## 7. Step 5 — Verify Every Admin Page

After running the schema and logging in, test each page:

### Dashboard — `/admin/`

**What it does:**

- Shows live gold spot price (fetched from goldpricez.com)
- Shows total shops count and social posts count from Supabase
- Shows API health status for goldpricez.com and exchangerate-api.com

**How to verify:**

1. Log in — you should see your email in the sidebar
2. The gold price ticker in the header should show a live price
3. The "Shops Listed" stat card should show a number (0 if no shops yet)
4. The "Analytics Events" stat card should show a count from the database
5. API status table should show 🟢 for both services

---

### Shops — `/admin/shops/`

**What it does:**

- Full CRUD for gold shop listings
- Reads/writes `shops` table in Supabase
- Displays verified vs unverified shops

**How to verify:**

1. Open the page — it should load any existing shops from Supabase
2. Click **Add Shop** → fill in details → Save
3. The shop should appear in the list
4. Click **Edit** → change a field → Save → verify the change is saved
5. Open the Supabase **Table Editor** → **shops** table — confirm the record is there

**RLS check:** The shops table has a public read policy for `verified = true` shops. As an admin
(authenticated), you can read ALL shops.

---

### Pricing — `/admin/pricing/`

**What it does:**

- Shows live gold prices for 24K/22K/21K/20K/18K in AED, USD, SAR, KWD
- Allows creating manual price overrides with expiry dates
- Reads/writes `pricing_overrides` table

**How to verify:**

1. Open the page — live prices should load within 2–3 seconds
2. Click **Add Override** → choose karat/currency → enter a price → Save
3. The override should appear in the table with status "Active"
4. Open Supabase **Table Editor** → **pricing_overrides** — confirm the record

---

### Orders — `/admin/orders/`

**What it does:**

- Lists all gold purchase orders
- Allows updating order status (pending → confirmed → processing → completed)
- Reads/writes `orders` table

**How to verify:**

1. Open the page — the table should be empty (no orders yet)
2. If you want test data, run `supabase/seed-test-data.sql` in the SQL Editor
3. After seeding, refresh the page — test orders should appear
4. Click an order row → update the status → confirm the change persists

---

### Content — `/admin/content/`

**What it does:**

- Full blog/article editor with English and Arabic fields
- Drafts and publishing workflow
- Reads/writes `content_posts` table

**How to verify:**

1. Click **New Post** → fill in the title and body → Save as Draft
2. The post should appear in the left panel list
3. Change status to **Published** → Save
4. Open Supabase **Table Editor** → **content_posts** — confirm `status = 'published'`
5. Published posts are publicly readable (the RLS policy allows `status = 'published'` for anon)

---

### Social — `/admin/social/`

**What it does:**

- Generate social media post copy (gold prices, market updates)
- Post history log
- Reads/writes `social_posts` table for history
- The `fetch_logs` table records what the Twitter bot has posted

**How to verify:**

1. Click **Generate Post** → choose a template → generate
2. The generated post should appear in the History section
3. Open Supabase **Table Editor** → **social_posts** — confirm the record

---

### Analytics — `/admin/analytics/`

**What it does:**

- Shows page view counts and event logs
- Reads from `analytics_events` and `api_call_logs` tables
- The public site writes events to these tables as users interact

**How to verify:**

1. Open the page — stats should load from Supabase
2. Visit the public site (homepage, tracker, shops) to generate events
3. Refresh the analytics page — new events should appear

> **Note:** The public site writes events using the anon key + an authenticated insert policy. If
> you see 0 events, ensure the public site's event tracking is writing to Supabase (not just
> localStorage). This requires `lib/analytics.js` to be configured with the Supabase client.

---

### Settings — `/admin/settings/`

**What it does:**

- Edit site-wide settings stored in `site_settings` table (single row, keyed `'default'`)
- Controls feature flags: `darkMode`, `orderGold`, `priceAlerts`
- The public site reads these settings via `lib/site-settings.js`

**How to verify:**

1. Toggle a setting (e.g., enable `priceAlerts`)
2. Click Save
3. Open Supabase **Table Editor** → **site_settings** → the `value` JSONB column should contain your
   settings
4. Open the public site — the feature flag should take effect within 5 minutes (cache TTL)

---

## 8. Step 6 — Public Site Feature Flags

The public site can read settings from Supabase to dynamically toggle features.

**How it works:**

`lib/site-settings.js` calls:

```
GET https://nebdpxjazlnsrfmlpgeq.supabase.co/rest/v1/site_settings?id=eq.default
```

This uses the anon key — no auth required. The `site_settings` table has a public read policy.

The response is cached in `localStorage` for 5 minutes. After that, a fresh read is made.

**Feature flags available:**

| Flag          | Effect when `true`                   |
| ------------- | ------------------------------------ |
| `darkMode`    | Enables dark mode toggle visibility  |
| `orderGold`   | Shows the "Order Gold" section / CTA |
| `priceAlerts` | Shows price alert UI in the tracker  |

**To activate a feature on the public site:**

1. Go to `/admin/settings/`
2. Enable the desired flag
3. Click Save
4. Within 5 minutes, all visitors will see the feature enabled

---

## 9. How Row Level Security (RLS) Works

RLS is Supabase's way of enforcing who can read/write each table at the database level. Even if
someone has your anon key, they cannot access data that RLS denies.

**Policy summary:**

| Table               | Anonymous (public)                                 | Authenticated admin              |
| ------------------- | -------------------------------------------------- | -------------------------------- |
| `shops`             | Read verified shops only (`verified = true`)       | Read all, insert, update, delete |
| `site_settings`     | Read (feature flags are public)                    | Insert, update                   |
| `content_posts`     | Read published posts only (`status = 'published'`) | Read all, insert, update, delete |
| `pricing_overrides` | No access                                          | Full CRUD                        |
| `orders`            | No access                                          | Full CRUD                        |
| `social_posts`      | No access                                          | Read, insert, delete             |
| `analytics_events`  | No access                                          | Read, insert, delete             |
| `api_call_logs`     | No access                                          | Read, insert, delete             |
| `audit_logs`        | No access                                          | Read                             |
| `gold_prices`       | No access                                          | (written by service role)        |
| `fetch_logs`        | No access                                          | (written by service role)        |

**How "authenticated" is determined:**

When the admin logs in via GitHub OAuth, Supabase issues a JWT token. This token is included in
every request from the Supabase JS client as a `Bearer` header. Supabase validates the JWT and sets
the `auth.uid()` function to the user's ID. The RLS policy `to authenticated` checks that this
function returns a non-null value.

**Testing RLS from the SQL Editor:**

To test as an anonymous user:

```sql
SET LOCAL ROLE anon;
SELECT * FROM public.shops;  -- should only return verified = true rows
SELECT * FROM public.orders; -- should return 0 rows (no public policy)
```

To test as an authenticated user (you):

```sql
-- Auth is always bypassed in the SQL Editor when you're logged in as the project owner
SELECT * FROM public.orders; -- returns all rows
```

---

## 10. Database Reference — All Tables

### `shops`

The gold shop directory. The primary public-facing data.

```sql
id              uuid        -- primary key, auto-generated
name            text        -- required: shop name in English
name_ar         text        -- shop name in Arabic
city            text        -- city name
country         text        -- country name
country_code    text        -- ISO 3166-1 alpha-2 (e.g. 'AE')
market          text        -- parent market (e.g. 'Dubai Gold Souk')
category        text        -- 'retailer' | 'wholesaler' | 'exchange' | 'market_area'
specialties     text[]      -- e.g. ARRAY['24K', 'jewellery', 'coins']
area            text        -- neighbourhood / district
phone           text        -- contact phone
website         text        -- website URL
address         text        -- street address
address_ar      text        -- address in Arabic
latitude        double      -- GPS latitude
longitude       double      -- GPS longitude
hours           text        -- opening hours text
details_availability text   -- 'full' | 'partial' | 'limited'
featured        boolean     -- show in featured sections
verified        boolean     -- show in public directory (RLS-controlled)
confidence      int         -- 0-100 data completeness score
rating          numeric     -- 0-5 star rating
notes           text        -- internal admin notes
created_at      timestamptz -- auto
updated_at      timestamptz -- auto-updated by trigger
created_by      text        -- admin email
```

### `site_settings`

Single-row configuration table. The public site reads this for feature flags.

```sql
id          text    -- always 'default'
value       jsonb   -- all settings as a JSON object
updated_at  timestamptz
updated_by  text

-- Example value:
-- { "darkMode": true, "orderGold": false, "priceAlerts": true, "siteName": "Gold Ticker Live" }
```

### `pricing_overrides`

Manual price overrides that the admin can set to correct or supplement API prices.

```sql
id              uuid
karat           text        -- '24' | '22' | '21' | '20' | '18'
currency        text        -- 'AED' | 'USD' | 'SAR' | 'KWD' | etc.
unit            text        -- 'gram' | 'oz' | 'kg' | 'tola'
override_price  numeric     -- the override value
reason          text        -- why was this override set
expires_at      timestamptz -- when this override auto-deactivates (null = permanent)
active          boolean     -- is this override currently applied
created_at      timestamptz
updated_at      timestamptz
created_by      text
```

### `orders`

Gold purchase orders submitted through the public site's order flow.

```sql
id                  text    -- e.g. 'ORD-20260412-001'
items               jsonb   -- array of { karat, weight, unit, price }
pricing             jsonb   -- { subtotal, fees, total, currency }
gold_spot_at_order  numeric -- XAU/USD at time of order
fx_rate_at_order    numeric -- currency/USD at time of order
customer            jsonb   -- { name, email, phone, address }
status              text    -- 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled'
status_history      jsonb   -- array of { status, timestamp, note }
created_at          timestamptz
updated_at          timestamptz
created_by          text
```

### `content_posts`

Blog / educational articles. Published posts are publicly readable.

```sql
id          uuid
title       text
title_ar    text
slug        text    -- unique URL slug
body        text    -- full article body (markdown or HTML)
body_ar     text
excerpt     text    -- short summary for listings
category    text    -- 'guide' | 'news' | 'analysis' | 'education'
tags        text[]  -- e.g. ARRAY['24K', 'buying guide', 'UAE']
status      text    -- 'draft' | 'published'
publish_date text   -- 'YYYY-MM-DD'
read_time   int     -- estimated minutes to read
author      text
created_at  timestamptz
updated_at  timestamptz
```

### `social_posts`

Post generation history from the Social Command Center.

```sql
id           uuid
template     text    -- 'daily_update' | 'price_alert' | 'custom' | etc.
language     text    -- 'en' | 'ar'
platform     text    -- 'twitter' | 'instagram' | 'telegram' | etc.
text         text    -- the generated post copy
generated_at bigint  -- JS timestamp (Date.now())
created_at   timestamptz
```

### `analytics_events`

Client-side event tracking from the public site.

```sql
id          uuid
event       text    -- 'pageview' | 'click' | 'search' | 'error' | 'order'
page        text    -- URL path of the page
session_id  text    -- anonymous session ID
ts          bigint  -- JS timestamp
properties  jsonb   -- event-specific data (e.g. { query: 'dubai' })
created_at  timestamptz
```

### `gold_prices` and `fetch_logs`

Used by the Twitter/social automation bots. Written via the service role key.

```sql
-- gold_prices: every gold price fetched by the bots
-- fetch_logs:  every bot run (success, skip, error) for deduplication
```

---

## 11. Code Patterns Used Everywhere

Every admin page follows an identical three-layer pattern. Learn this once and you understand all
seven pages.

### Pattern: Supabase-first with localStorage fallback

```javascript
// 1. Get the Supabase client
import { getSupabase } from '../supabase-auth.js';

// 2. Load data — try Supabase, fall back to localStorage cache
async function loadData() {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('table_name')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && Array.isArray(data)) {
        const rows = data.map(fromDbRow); // transform DB shape → UI shape
        cacheToLocalStorage(rows); // update local cache
        return rows;
      }
      console.warn('[page] Supabase error, using cache:', error?.message);
    } catch (err) {
      console.warn('[page] Supabase unreachable, using cache:', err.message);
    }
  }
  return readFromLocalStorage(); // localStorage fallback
}

// 3. Write data — Supabase first, always update localStorage
async function saveData(item) {
  const sb = getSupabase();
  if (sb) {
    const row = toDbRow(item); // transform UI shape → DB shape
    const { data, error } = await sb.from('table_name').insert(row).select().single();
    if (error) throw new Error(error.message);
    const result = fromDbRow(data);
    updateLocalCache(result);
    return result;
  }
  // Fallback: generate local ID, save only to localStorage
  item.id = 'local_' + Date.now();
  saveToLocalStorage(item);
  return item;
}
```

### Pattern: Row mappers (toDbRow / fromDbRow)

The database uses `snake_case` column names. The admin UI JavaScript uses `camelCase` property
names. The mapper functions translate between them.

```javascript
// DB row → UI object
function fromDbRow(row) {
  return {
    id: row.id,
    karat: row.karat,
    overridePrice: row.override_price, // snake → camel
    expiresAt: row.expires_at, // snake → camel
    createdAt: row.created_at, // snake → camel
  };
}

// UI object → DB row
function toDbRow(obj) {
  return {
    karat: obj.karat,
    override_price: Number(obj.overridePrice), // camel → snake
    expires_at: obj.expiresAt || null, // camel → snake
    active: obj.active !== false,
  };
}
```

### Pattern: Count query for dashboard stats

```javascript
const sb = getSupabase();
if (sb) {
  const { count } = await sb.from('table_name').select('*', { count: 'exact', head: true }); // head: true = don't return rows
  console.log('Total:', count);
}
```

---

## 12. Troubleshooting Guide

### "Sign in with GitHub" does nothing / error

- Confirm the **GitHub OAuth App** is created and enabled in Supabase
- Confirm the callback URL in the GitHub OAuth App exactly matches:
  `https://nebdpxjazlnsrfmlpgeq.supabase.co/auth/v1/callback`
- Confirm the **Site URL** in Supabase Authentication settings is `https://vctb12.github.io`

### Logged in but immediately redirected back to login

- Check your GitHub account's primary email. It must be `vctb12@gmail.com`. If not, update
  `ALLOWED_EMAIL` in `admin/supabase-config.js`.
- Open browser console on the login page — look for: `requireAuth: email mismatch`

### Admin page loads but shows 0 data / empty tables

Most likely the schema has not been run yet.

1. Go to Supabase → SQL Editor → run:
   ```sql
   SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
   ```
2. If you don't see `shops`, `orders`, etc. → the schema needs to be run
3. Run the full `supabase/schema.sql` again (it uses `IF NOT EXISTS` so it is safe)

### Admin page shows data but changes don't persist after browser refresh

Supabase is unreachable and the page fell back to localStorage.

Check in browser console for:

- `[pricing] Supabase unreachable`
- `[orders] Supabase read error`

Causes:

- Network error / Supabase project paused (Supabase pauses free-tier projects after 1 week inactive)
- The `getSupabase()` function returned `null` because the CDN script didn't load

**Supabase project paused?** Go to `https://supabase.com` → your project → if it shows "Paused",
click **Restore project**. Free-tier projects auto-pause after 7 days of inactivity. Upgrading to
Pro ($25/month) prevents this. Alternatively, add a GitHub Actions workflow that pings the project
weekly.

### Data saved in localStorage but not showing in Supabase table

The admin page saved to localStorage (fallback) instead of Supabase. Once Supabase is reachable
again, the page will read from Supabase on next load, but the locally-saved data won't auto-sync.

To manually sync local data:

1. Open the admin page
2. If the Supabase connection is restored, the page will now load from Supabase (empty or with
   server data)
3. The local fallback data is still in localStorage — you can view it with:
   ```javascript
   JSON.parse(localStorage.getItem('gp_orders')); // or gp_pricing_overrides, etc.
   ```
4. Re-enter the important items through the admin UI to save them to Supabase

### `sync-db-to-git.yml` workflow fails

Check the GitHub Actions log. Common causes:

- `SUPABASE_SERVICE_ROLE_KEY` secret is missing or wrong
- `SUPABASE_URL` secret is missing
- The `shops` table doesn't exist yet (schema not run)

### RLS error: "new row violates row-level security policy"

This means you are trying to write data without being authenticated.

- Confirm `requireAuth()` is called at the top of the admin page script
- Open browser DevTools → Application → Local Storage — confirm you have a `sb-*-auth-token` key
- Try logging out and back in

---

## 13. Keeping the Schema in Sync

When you need to add a new column or table:

1. **Write the SQL** — use `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` for new columns:

   ```sql
   ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS whatsapp text;
   ```

2. **Add it to `supabase/schema.sql`** — put it under the relevant table section so the file always
   represents the full current schema

3. **Test locally first** — run your SQL in Supabase SQL Editor, verify it works, then add to
   `schema.sql`

4. **Update `toDbRow`/`fromDbRow`** in the relevant admin page — add the new column to both mapping
   functions

5. **Run `supabase/verify.sql`** after changes to confirm everything is still consistent

**Never run `DROP TABLE` or destructive migrations in production without a backup.** Supabase
automatically backs up daily on Pro tier. On free tier, use **Database** → **Backups** → **Manual
backup** before any destructive change.
