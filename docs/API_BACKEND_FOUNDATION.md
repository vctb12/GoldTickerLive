# API Backend Foundation (Phase 1)

This document describes the optional Express API foundation for local development, testing, and
owner-managed self-hosting. It is not part of the GitHub Pages production pricing path.

## Architecture

- Frontend remains static and deployable to GitHub Pages.
- Express backend provides optional operational API endpoints and protected/admin-compatible APIs.
- GitHub Pages production retrieves the near-realtime reference quote directly from the browser-safe
  provider manager; Actions writes a validated static emergency snapshot.
- Versioned API namespace is now available at:
  - `/api/v1/...`
- Existing `/api/...` routes remain in place for backward compatibility.

## API Versioning

New and standardized API endpoints are under `/api/v1`:

- `GET /api/v1/health`
- `GET /api/v1/status`
- `GET /api/v1/config/public`
- `GET /api/v1/prices/latest`
- `GET /api/v1/prices/history`
- `GET /api/v1/providers/status`
- `POST /api/v1/events`
- `POST /api/v1/leads`

Legacy compatibility:

- Existing `/api/admin/*`, `/api/newsletter/*`, `/api/stripe/*`, `/api/submit-shop` remain
  supported.
- Versioned aliases are also mounted for these route groups where applicable.

## Response Envelopes

Success shape:

```json
{
  "ok": true,
  "data": {},
  "meta": {
    "timestamp": "",
    "source": "",
    "freshness": ""
  }
}
```

Error shape:

```json
{
  "ok": false,
  "error": {
    "code": "",
    "message": ""
  }
}
```

## Health and Status Coverage

`/api/v1/health` and `/api/v1/status` include non-secret operational checks:

- app version
- environment mode
- current timestamp
- uptime
- data file availability (`data/gold_price.json`)
- provider state file availability (`data/provider_state.json`)
- Supabase configured or not
- newsletter configured or not
- Stripe configured or not
- env validation warnings (non-fatal)

`/api/v1/status` now also exposes a `readiness` object for operations checks:

- `supabaseConfigured`
- `supabaseWriteAvailable`
- `stripeConfigured`
- `stripeWebhookConfigured`
- `resendConfigured`
- `alertJobTokenConfigured`
- `providerStateAvailable`
- `priceSnapshotSyncAvailable`

## Environment Validation

Startup performs non-fatal feature-aware env validation:

- Required optional-feature variables produce warnings when partially configured.
- Missing optional integrations do **not** crash the server.
- CORS production misconfiguration is warned clearly.
- Supabase requirements are checked when `STORAGE_BACKEND=supabase`.

## Security and Production Safety

- Structured request logging (JSON line format) for production diagnostics.
- Public POST endpoint rate limiting:
  - `/api/v1/events`
  - `/api/v1/leads`
- Existing global API rate limits remain active.
- CORS behavior stays explicit and production-safe.
- No secrets are exposed in API responses.

## Deployment boundary

- Production website: GitHub Pages only.
- Production price refresh: direct browser fetches from the no-secret provider manager.
- Production emergency snapshot: GitHub Actions commits `data/gold_price.json` after validation.
- Express, REST, and SSE: optional localhost/self-hosted tooling only. Pages must not assume that
  `/api/v1/prices/live` or `/api/v1/prices/stream` exists on its hostname.

## Environment Variables by Feature

### Core server (required)

- `JWT_SECRET`
- `ADMIN_PASSWORD`

### Optional admin pin

- `ADMIN_ACCESS_PIN` (6+ digits)

### API/server runtime

- `NODE_ENV`
- `PORT`
- `SITE_URL`
- `CORS_ORIGINS`
- `STORAGE_BACKEND`

### Supabase backend (required when using Supabase storage)

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Newsletter (optional)

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

### Stripe (optional)

- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRICE_PRO_MONTHLY`
- `STRIPE_PRICE_PRO_ANNUAL`
- `STRIPE_PRICE_API_MONTHLY`
- `STRIPE_PRICE_API_ANNUAL`

## Backend readiness checklist

- [ ] `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` loaded when DB-backed writes are expected
- [ ] `/api/v1/status` shows `supabaseWriteAvailable: true` before relying on snapshot persistence
- [ ] Stripe runtime secrets and price IDs are loaded together
- [ ] `/api/v1/status` shows `stripeConfigured: true` and `stripeWebhookConfigured: true` before
      testing live billing flows
- [ ] `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are loaded together when email delivery is expected
- [ ] `ALERT_JOB_TOKEN` is configured before enabling non-dry alert job runs
- [ ] `data/provider_state.json` is present when provider-state telemetry is expected
- [ ] `scripts/node/sync-price-snapshot.js` is deployed anywhere Supabase snapshot sync is expected
