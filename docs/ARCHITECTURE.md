# Architecture Overview

## Summary

Gold Prices is a **static multi-page front-end** served via GitHub Pages or an optional Express server.  
The Express layer adds a JWT-secured admin API and server-side data persistence.

---

## Folder Structure

```
/
├── index.html, calculator.html, shops.html, tracker.html, ...
│   → public-facing static pages
│
├── countries/          → per-country static HTML pages
├── components/         → nav.js, footer.js, chart.js, ticker.js (browser ES modules)
├── config/             → constants.js, countries.js, karats.js, translations.js
├── lib/                → shared utilities
│   ├── api.js          → gold price + FX fetch (browser)
│   ├── cache.js        → localStorage dual-layer cache (browser)
│   ├── price-calculator.js → core pricing formulas (browser + Node)
│   ├── formatter.js    → display formatting
│   ├── auth.js         → JWT auth + file-based user store (Node/server)
│   ├── audit-log.js    → immutable audit logging (Node/server)
│   ├── supabase-client.js  → lazy Supabase client factory (Node/server)
│   └── admin/
│       └── shop-manager.js → shop CRUD with confidence scoring (Node/server)
│
├── repositories/       → storage-agnostic data access layer (Node/server)
│   ├── shops.repository.js
│   └── audit.repository.js
│
├── server/
│   └── routes/admin/index.js  → Express admin API routes
│
├── data/               → server-side file persistence (JSON, git-tracked)
│   ├── shops-data.json → admin-managed shop records
│   └── audit-logs.json → immutable admin action log
│
├── supabase/
│   └── schema.sql      → Supabase DB schema + RLS policies
│
└── tests/              → Node test runner tests
```

---

## Data Flow

### Public pages (browser-only)
```
HTML page
  → page-specific JS (home.js, tracker-pro.js, calculator.js, …)
    → lib/api.js → lib/cache.js → lib/price-calculator.js → lib/formatter.js
      → External APIs (gold-api.com for XAU/USD, exchangerate-api.com for FX)
```

### Admin API (Express server)
```
admin.html  (GitHub-token auth, reads data/shops.js via GitHub API)
            │
            └─ [optional] Express admin API at /api/admin
                 server/routes/admin/index.js
                   → lib/auth.js          (JWT auth, users in data/users.json)
                   → repositories/        (storage abstraction layer)
                       → lib/admin/shop-manager.js  (file backend)
                       → lib/audit-log.js           (file backend)
                       → lib/supabase-client.js      (Supabase backend, when configured)
```

---

## Storage Abstraction Layer

### Why it exists

The app currently uses JSON files for persistence.  
The `repositories/` layer lets you **swap in Supabase** without rewriting every call site.

### How it works

Set `STORAGE_BACKEND` in `.env`:

| Value       | Behavior                                               |
|-------------|--------------------------------------------------------|
| `file`      | (default) JSON files in `data/`                       |
| `supabase`  | Supabase tables (requires env vars + package install) |

Both modes share the same async API:

```js
// Example – works with either backend
const shopsRepo = require('./repositories/shops.repository');

const all      = await shopsRepo.getAll();
const shop     = await shopsRepo.getById('shop_123');
const inserted = await shopsRepo.insert({ id: '...', name: '...' });
const updated  = await shopsRepo.update('shop_123', { verified: true });
const deleted  = await shopsRepo.remove('shop_123');
const stats    = await shopsRepo.getStats();
```

### Migration path (file → Supabase)

1. Create a Supabase project and apply `supabase/schema.sql`.
2. Set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` in `.env`.
3. Install the client: `npm install @supabase/supabase-js`.
4. One-off data migration: read `data/shops-data.json` → insert into Supabase.
5. Set `STORAGE_BACKEND=supabase` in `.env`.
6. The admin API routes use the repository layer, so no further code changes are needed.

See [`docs/SUPABASE_SETUP.md`](SUPABASE_SETUP.md) for the full migration guide.

---

## Admin API Endpoints

All routes live under `/api/admin`.

| Method | Path                      | Min Role | Description                        |
|--------|---------------------------|----------|------------------------------------|
| POST   | `/auth/login`             | —        | JWT login                          |
| GET    | `/auth/verify`            | any      | Verify token                       |
| GET    | `/shops`                  | any      | List shops (filterable, paginated) |
| GET    | `/shops/:id`              | any      | Get single shop                    |
| POST   | `/shops`                  | editor   | Create shop                        |
| PUT    | `/shops/:id`              | editor   | Update shop                        |
| DELETE | `/shops/:id`              | admin    | Delete shop                        |
| POST   | `/shops/batch-import`     | admin    | Batch import shops                 |
| GET    | `/audit-logs`             | any      | List audit log (filterable)        |
| GET    | `/audit-logs/export`      | admin    | Export audit log as CSV            |
| GET    | `/users`                  | admin    | List admin users                   |
| POST   | `/users`                  | admin    | Create admin user                  |
| PUT    | `/users/:id`              | admin    | Update admin user                  |
| DELETE | `/users/:id`              | admin    | Delete admin user                  |
| GET    | `/stats`                  | any      | Dashboard stats (shops + users)    |

---

## Authentication

- JWT-based (`lib/auth.js`), token expiry 24 h.
- Role hierarchy: `viewer < editor < admin`.
- Rate limiting on `/auth/login`: 10 failed attempts per IP → 15-minute lock.
- Users stored in `data/users.json` (file mode) or `public.user_profiles` (Supabase mode).
- Set `JWT_SECRET` and `ADMIN_PASSWORD` in `.env` before deploying.

---

## Environment Variables

| Variable                  | Required | Purpose                                                   |
|---------------------------|----------|-----------------------------------------------------------|
| `PORT`                    | No       | Express port (default 3000)                               |
| `JWT_SECRET`              | Yes      | Secret for signing JWTs (32+ random chars)                |
| `ADMIN_PASSWORD`          | Yes      | Bootstrap password for `admin@goldprices.com`             |
| `STORAGE_BACKEND`         | No       | `file` (default) or `supabase`                           |
| `SUPABASE_URL`            | Supabase | Your Supabase project URL                                 |
| `SUPABASE_ANON_KEY`       | Supabase | Anon key (browser-safe reads)                             |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | Service-role key (server only, bypasses RLS)            |

---

## Testing

```bash
npm test          # runs all tests in tests/*.test.js
```

Test files:
- `tests/price-calculator.test.js` – pricing formulas
- `tests/shop-manager.test.js` – shop CRUD + confidence scoring
- `tests/audit-log.test.js` – audit log filtering, CSV export, injection prevention
- `tests/auth.test.js` – JWT auth, user management, middleware
- `tests/repositories.test.js` – repository layer (file backend)
