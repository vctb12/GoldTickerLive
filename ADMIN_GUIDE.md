# Admin Panel Access Guide

## How to Access the Admin Dashboard

### URL

- **Development (Express server):** `http://localhost:3000/admin`
- **GitHub Pages / static build:** `https://yourusername.github.io/Gold-Prices/admin.html`

---

## Initial Setup (Required Before Deploying)

1. Copy `.env.example` to `.env` and fill in all values.
2. Set a strong `JWT_SECRET` (32+ random characters):
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
   ```
3. Set `ADMIN_PASSWORD` to a strong password for the default admin account.  
   The default bootstrap account uses `admin@goldprices.com` with the value of `ADMIN_PASSWORD`.
4. **Never commit `.env` to source control.**

### Default Admin Email

`admin@goldprices.com` — the password is read from the `ADMIN_PASSWORD` environment variable at startup.

> ⚠️ If `ADMIN_PASSWORD` is not set, a weak placeholder is used. Always set it in `.env` before running the server.

---

## Features

### 1. Dashboard Overview
- Real-time statistics for shops, cities, guides, and audit entries
- Recent activity feed showing latest admin actions
- Quick metrics for verified vs pending shops

### 2. Shop Management
- View all shops with filtering by status (verified/pending/unverified) and type (direct/market)
- Add new shops with name, city, type, verification status, and confidence score
- Edit existing shop details
- Toggle verification status with one click
- Delete shops with confirmation
- Search shops by name or city

### 3. Cities & Markets Management
- Add new cities with country association
- Edit city details
- Delete cities (with confirmation)
- View shop count per city

### 4. Content Management
- Manage buying guides and editorial content
- Create, edit, and delete guides
- Track author and update timestamps
- Tabbed interface for guides, flags, and FAQs

### 5. Trust & Confidence Settings
- Configure confidence score thresholds (high/medium/low)
- Visual sliders for threshold adjustment
- Trust badge management

### 6. Audit Logs
- Complete audit trail of all admin actions
- Filter by action type (create/update/delete/login)
- Filter by entity type (shop/city/guide/user)
- Search functionality
- Export to CSV (all fields are properly quoted and formula-injection safe)
- Shows user, timestamp, action, entity, and changes

### 7. Settings
- User management (add/remove admin users)
- Cache management
- Data export functionality
- System reset options

---

## Technical Details

### Authentication
- JWT-based authentication (`lib/auth.js`)
- Rate limiting on the login endpoint: 10 failed attempts per IP triggers a 15-minute lockout
- Role hierarchy: `admin > editor > viewer`
- Token expiry: 24 hours

### Data Storage
- Server-side file storage (`data/shops-data.json`, `data/audit-logs.json`, `data/users.json`)
- Supabase-ready: see [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md) for migration guide
- All CRUD operations are logged to the audit system

### Security Checklist
1. Set `JWT_SECRET` and `ADMIN_PASSWORD` environment variables before deploy
2. Enable HTTPS for all admin traffic
3. Review audit logs regularly for suspicious activity
4. Consider IP whitelisting for `/api/admin` in production

---

## Integration with Backend

The admin API is at `/api/admin` on the Express server (`server.js`).

Key endpoints:

| Method | Path | Auth Required |
|--------|------|--------------|
| POST | `/api/admin/auth/login` | — |
| GET | `/api/admin/auth/verify` | Any |
| GET | `/api/admin/shops` | Any |
| POST | `/api/admin/shops` | editor+ |
| PUT | `/api/admin/shops/:id` | editor+ |
| DELETE | `/api/admin/shops/:id` | admin |
| GET | `/api/admin/audit-logs` | Any |
| GET | `/api/admin/audit-logs/export` | admin |

---

## File Structure
```
/
├── admin.html              # Admin dashboard HTML + inline JS
├── admin.css               # Admin-specific styles
├── server.js               # Express server
├── .env.example            # Environment variable template
├── lib/
│   ├── auth.js             # JWT auth + user management
│   └── admin/
│       └── shop-manager.js # Shop CRUD logic
├── lib/audit-log.js        # Immutable audit logging
├── server/routes/admin/    # Admin API routes
├── data/
│   ├── shops-data.json     # Shop data (file-based)
│   └── audit-logs.json     # Audit log data (file-based)
├── docs/
│   └── SUPABASE_SETUP.md   # Supabase migration guide
└── supabase/
    └── schema.sql          # Database schema + RLS policies
```

---

## Troubleshooting

### Can't access admin page?
- Ensure the Express server is running (`npm start`) if using the API
- For static build: verify the Vite build completed (`npm run build`)

### Login not working?
- Check the `JWT_SECRET` and `ADMIN_PASSWORD` are set in `.env`
- Check server logs for the warning about default JWT_SECRET
- Rate limiting: if you've had 10+ failed attempts, wait 15 minutes

### Changes not persisting?
- Data is stored in `data/*.json` (server-side)
- Ensure the `data/` directory is writable by the server process

---

## Next Steps

1. **Immediate:** Set `JWT_SECRET` and `ADMIN_PASSWORD` in `.env`
2. **Short-term:** Migrate data storage to Supabase (see `docs/SUPABASE_SETUP.md`)
3. **Medium-term:** Switch admin auth to Supabase Auth for session management
4. **Long-term:** Add two-factor authentication and IP whitelisting

