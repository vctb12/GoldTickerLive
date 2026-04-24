# Environment Variables

## Required Variables

| Variable             | Required | Description                                         | Example                     |
| -------------------- | -------- | --------------------------------------------------- | --------------------------- |
| `SUPABASE_URL`       | Yes      | Supabase project URL                                | `https://xxxxx.supabase.co` |
| `SUPABASE_ANON_KEY`  | Yes      | Supabase anonymous/public API key                   | `eyJhbGciOi...`             |
| `ALLOWED_EMAIL`      | Yes      | Admin email whitelist for GitHub OAuth              | `admin@example.com`         |
| `GOLDPRICEZ_API_KEY` | Yes      | goldpricez.com API key for live XAU/USD spot prices | `goldapi-abc123xyz`         |

## Optional Variables (Express Server / Self-Hosted)

| Variable                    | Required    | Description                                     | Example                       |
| --------------------------- | ----------- | ----------------------------------------------- | ----------------------------- |
| `JWT_SECRET`                | Server/test | Secret for signing JWT admin tokens (32+ chars) | `[random 64-char hex string]` |
| `ADMIN_PASSWORD`            | Server/test | Admin panel password (bcrypt-hashed at startup) | `[strong password]`           |
| `ADMIN_ACCESS_PIN`          | Server/test | 6+ digit numeric PIN gating the admin login     | `123456`                      |
| `SUPABASE_SERVICE_ROLE_KEY` | Server/CI   | Supabase service-role key (bypasses RLS)        | `eyJhbGciOi...`               |
| `STORAGE_BACKEND`           | No          | `file` (default) or `supabase`                  | `supabase`                    |
| `GA4_MEASUREMENT_ID`        | No          | Google Analytics 4 measurement ID               | `G-XXXXXXXXXX`                |
| `ADSENSE_CLIENT_ID`         | No          | Google AdSense publisher ID                     | `ca-pub-1234567890`           |
| `CORS_ORIGINS`              | No          | Allowed CORS origins (comma-separated)          | `https://example.com`         |
| `NODE_ENV`                  | No          | Environment mode                                | `production`                  |
| `PORT`                      | No          | Server port (default: 3000)                     | `3000`                        |

> **Note.** `JWT_SECRET`, `ADMIN_PASSWORD`, and `ADMIN_ACCESS_PIN` are **required at module load**
> by `server/lib/auth.js` — without them the server throws at startup and `npm test` fails
> immediately. CI sets test-only values for these via job-level `env:`. Locally, export them before
> running `npm start` or `npm test`.

## GitHub Actions Secrets

These are configured as repository secrets in GitHub (Settings → Secrets → Actions):

| Secret Name                 | Used By                   | Purpose                                  |
| --------------------------- | ------------------------- | ---------------------------------------- |
| `GOLDPRICEZ_API_KEY`        | Multiple workflows        | Gold price API key (api.goldpricez.com)  |
| `CONSUMER_KEY`              | Tweet workflows           | Twitter/X OAuth 1.0a API Key             |
| `CONSUMER_SECRET`           | Tweet workflows           | Twitter/X OAuth 1.0a API Secret          |
| `ACCESS_TOKEN`              | Tweet workflows           | Twitter/X Access Token (read-write)      |
| `ACCESS_TOKEN_SECRET`       | Tweet workflows           | Twitter/X Access Token Secret            |
| `SUPABASE_URL`              | DB sync, Python workflows | Supabase project URL                     |
| `SUPABASE_SERVICE_ROLE_KEY` | DB sync, Python workflows | Supabase service-role key (admin bypass) |
| `TELEGRAM_BOT_TOKEN`        | Telegram workflow         | Telegram Bot API token                   |
| `TELEGRAM_CHANNEL_ID`       | Telegram workflow         | Telegram channel/group ID                |
| `DISCORD_WEBHOOK_URL`       | Discord workflow          | Discord webhook URL                      |
| `SUPABASE_MCP_TOKEN`        | MCP setup (optional)      | Supabase MCP bearer token                |

> **Note**: Twitter workflow files map these secrets to `TWITTER_API_KEY`, `TWITTER_API_SECRET`,
> etc. env vars internally. The GitHub secret names do NOT have a `TWITTER_` prefix.

## .env.example

See [`.env.example`](../.env.example) in the repo root for a complete template.

## Notes

- Never commit `.env` files to the repository
- The `.env.example` file is committed as a template
- Supabase anon key is safe to expose client-side (RLS protects data)
- All API keys for external services must be in GitHub Secrets for CI/CD workflows
- In production (GitHub Pages), client-side code does NOT use env vars — API keys are in GitHub
  Secrets only
- `STORAGE_BACKEND=supabase` switches the Express server's repository layer from file-based to
  Supabase
