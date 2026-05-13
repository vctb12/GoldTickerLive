# Public Accounts and Saved Tools (Phase 5 Foundation)

## Scope

This phase introduces a **public-user account foundation** for Gold Ticker Live while keeping admin
authentication fully separate.

### Included

- Public account sign-in page: `/account.html`
- Public user dashboard: `/dashboard.html`
- Public account API under `/api/v1/me*`
- Supabase schema additions for:
  - `profiles`
  - `user_preferences`
  - `saved_calculations`
  - `watchlists`
  - `saved_shops`
  - `user_sessions`
- Save-to-account actions on:
  - Calculator results
  - Tracker watchlist/alerts sync hooks
  - Shops cards and modal actions
- Explicit localStorage import flow from dashboard (no silent overwrite)

## Auth Approach

Public auth is isolated from admin auth:

- **Admin auth** remains in `server/lib/auth.js` and `admin/*`.
- **Public auth** uses Supabase user sessions (Bearer tokens) validated by the public accounts
  route.
- Public API routes are mounted under `/api/v1` and do not grant or reuse admin privileges.

## API Endpoints

All endpoints below require a valid public-user bearer token.

- `GET /api/v1/me`
- `GET /api/v1/me/preferences`
- `PATCH /api/v1/me/preferences`
- `GET /api/v1/me/saved-calculations`
- `POST /api/v1/me/saved-calculations`
- `DELETE /api/v1/me/saved-calculations/:id`
- `GET /api/v1/me/watchlist`
- `POST /api/v1/me/watchlist`
- `DELETE /api/v1/me/watchlist/:id`
- `GET /api/v1/me/saved-shops`
- `POST /api/v1/me/saved-shops`
- `DELETE /api/v1/me/saved-shops/:id`

## Storage Behavior

- **Supabase first** when configured.
- **File fallback** (`data/public-accounts.json`) if Supabase is unavailable, to preserve local/dev
  operability.
- Row ownership is enforced by user identity for all public account resources.

## LocalStorage Import Behavior

The dashboard includes an explicit import action:

- Reads legacy localStorage keys (preferences, alerts, watchlist, shortlist, local saved calcs).
- Imports only when the user clicks import.
- Does **not** silently overwrite existing cloud data.
- Uses upsert semantics for dedupe-compatible resources (`watchlists`, `saved_shops`).

## Safety Notes

- No changes were made to core pricing math, AED peg, karat purity constants, or admin auth roles.
- Public-account actions are additive and keep anonymous browsing functionality intact.
