# Environment Variables

## Required Variables

| Variable            | Required     | Description                                     | Example                       |
| ------------------- | ------------ | ----------------------------------------------- | ----------------------------- |
| `GOLD_API_KEY`      | Yes          | GoldAPI.io API key for live XAU/USD spot prices | `goldapi-abc123xyz`           |
| `JWT_SECRET`        | Yes (server) | Secret for signing JWT admin tokens             | `[random 64-char hex string]` |
| `ADMIN_PASSWORD`    | Yes (server) | Admin panel password for server-side auth       | `[strong password]`           |
| `SUPABASE_URL`      | Yes          | Supabase project URL                            | `https://xxxxx.supabase.co`   |
| `SUPABASE_ANON_KEY` | Yes          | Supabase anonymous/public API key               | `eyJhbGciOi...`               |
| `ALLOWED_EMAIL`     | Yes          | Admin email whitelist for GitHub OAuth          | `admin@example.com`           |

## Optional Variables

| Variable             | Required | Description                             | Example               |
| -------------------- | -------- | --------------------------------------- | --------------------- |
| `METALS_API_KEY`     | Optional | Metals-API fallback key for gold prices | `metals-api-key-123`  |
| `GA4_MEASUREMENT_ID` | Optional | Google Analytics 4 measurement ID       | `G-XXXXXXXXXX`        |
| `ADSENSE_CLIENT_ID`  | Optional | Google AdSense publisher ID             | `ca-pub-1234567890`   |
| `CORS_ORIGINS`       | Optional | Allowed CORS origins (comma-separated)  | `https://example.com` |
| `NODE_ENV`           | Optional | Environment mode                        | `production`          |
| `PORT`               | Optional | Server port (default: 3000)             | `3000`                |

## GitHub Actions Secrets

These are configured as repository secrets in GitHub:

| Secret Name           | Used By            | Maps To                       |
| --------------------- | ------------------ | ----------------------------- |
| `GOLD_API_KEY`        | Multiple workflows | `GOLD_API_KEY` env var        |
| `CONSUMER_KEY`        | Tweet workflows    | `TWITTER_API_KEY`             |
| `CONSUMER_SECRET`     | Tweet workflows    | `TWITTER_API_SECRET`          |
| `ACCESS_TOKEN`        | Tweet workflows    | `TWITTER_ACCESS_TOKEN`        |
| `ACCESS_TOKEN_SECRET` | Tweet workflows    | `TWITTER_ACCESS_TOKEN_SECRET` |
| `DISCORD_WEBHOOK_URL` | Discord workflow   | `DISCORD_WEBHOOK_URL`         |
| `TELEGRAM_BOT_TOKEN`  | Telegram workflow  | `TELEGRAM_BOT_TOKEN`          |
| `TELEGRAM_CHAT_ID`    | Telegram workflow  | `TELEGRAM_CHAT_ID`            |

## .env.example

```env
# Gold Price API
GOLD_API_KEY=your_goldapi_key_here
METALS_API_KEY=your_metals_api_key_here

# Server Auth
JWT_SECRET=change_this_to_a_random_64_char_hex_string
ADMIN_PASSWORD=change_this_to_a_strong_password

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
ALLOWED_EMAIL=your_admin_email@example.com

# Analytics & Ads (optional)
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXX

# Server Config
NODE_ENV=development
PORT=3000
CORS_ORIGINS=http://localhost:5000,http://localhost:3000
```

## Notes

- Never commit `.env` files to the repository
- The `.env.example` file should be committed as a template
- Supabase anon key is safe to expose client-side (RLS protects data)
- All API keys for external services must be in GitHub Secrets for CI/CD workflows
- In production (GitHub Pages), client-side code does NOT use env vars — API keys are in GitHub
  Secrets only
