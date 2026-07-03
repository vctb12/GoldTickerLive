# Environment Variables

Complete inventory of environment variables across the Express server, the Python data/automation
pipeline, build/QA scripts, and GitHub Actions. The committed template is
[`.env.example`](../.env.example); copy it to `.env` (gitignored) for local work. Production values
live in GitHub Secrets only.

> **Client-side code never reads env vars.** The deployed site is static (GitHub Pages); browser
> config lives in committed constants — see
> [Client-side config constants](#client-side-config-constants-not-env-vars) below.

## Express server / self-hosted

| Variable                    | Required    | Description                                                              | Example                       |
| --------------------------- | ----------- | ------------------------------------------------------------------------ | ----------------------------- |
| `JWT_SECRET`                | Server/test | Secret for signing JWT admin tokens (32+ chars)                          | `[random 64-char hex string]` |
| `ADMIN_PASSWORD`            | Server/test | Admin panel password (bcrypt-hashed at startup)                          | `[strong password]`           |
| `ADMIN_ACCESS_PIN`          | Server/test | 6+ digit numeric PIN gating the admin login                              | `123456`                      |
| `API_KEY_HASH_SALT`         | API/server  | Dedicated salt for PBKDF2 API key hashing                                | `[random long string]`        |
| `API_KEY_HASH_ITERATIONS`   | API/server  | PBKDF2 iteration count for API key hashing                               | `210000`                      |
| `SUPABASE_URL`              | Supabase    | Supabase project URL                                                     | `https://xxxxx.supabase.co`   |
| `SUPABASE_ANON_KEY`         | Supabase    | Supabase anonymous/public API key                                        | `eyJhbGciOi...`               |
| `SUPABASE_SERVICE_ROLE_KEY` | Server/CI   | Supabase service-role key (bypasses RLS)                                 | `eyJhbGciOi...`               |
| `STORAGE_BACKEND`           | No          | `file` (default) or `supabase`                                           | `supabase`                    |
| `SITE_URL`                  | No          | Public origin used for Stripe redirects, newsletter links, uptime checks | `https://goldtickerlive.com`  |
| `CORS_ORIGINS`              | No          | Allowed CORS origins (comma-separated)                                   | `https://example.com`         |
| `NODE_ENV`                  | No          | Environment mode                                                         | `production`                  |
| `PORT`                      | No          | Server port (default: 3000)                                              | `3000`                        |

> **Note.** `JWT_SECRET`, `ADMIN_PASSWORD`, and `ADMIN_ACCESS_PIN` are **required at module load**
> by `server/lib/auth.js` — without them the server throws at startup and `npm test` fails
> immediately. CI sets test-only values for these via job-level `env:`. Locally, export them before
> running `npm start` or `npm test`.
>
> `API_KEY_HASH_SALT` is a separate required secret for API key create/resolve flows and should not
> reuse `JWT_SECRET`.

### Newsletter, leads & alerts (Express)

| Variable                   | Required | Description                                                                  | Example                 |
| -------------------------- | -------- | ---------------------------------------------------------------------------- | ----------------------- |
| `RESEND_API_KEY`           | No       | Resend API key — enables real email sending                                  | `re_...`                |
| `RESEND_FROM_EMAIL`        | No       | Verified sender address (configure with the key)                             | `alerts@example.com`    |
| `NEWSLETTER_DRY_RUN`       | No       | `true` logs emails instead of sending (default when Resend vars are missing) | `true`                  |
| `NEWSLETTER_DATA_FILE`     | No       | Override newsletter subscriber storage path                                  | `/tmp/subscribers.json` |
| `LEADS_DATA_FILE`          | No       | Override leads storage path                                                  | `/tmp/leads.json`       |
| `ALERT_EMAIL_DRY_RUN`      | No       | Force alert emails into log-only dry-run mode                                | `true`                  |
| `ALERTS_EXPOSE_DEV_TOKENS` | No       | Expose dev verification token in non-prod only                               | `true`                  |
| `ALERT_JOB_TOKEN`          | No       | Shared secret for `POST /api/v1/jobs/check-alerts`                           | `[random long token]`   |
| `ALERTS_DATA_FILE`         | No       | Override alert file-storage path (dev/test)                                  | `/tmp/alerts-v1.json`   |
| `ALERTS_PRICE_FILE`        | No       | Override snapshot JSON used by alert checks                                  | `/tmp/gold_price.json`  |

### Stripe billing (Express — inert until configured)

Configure the first three together; billing endpoints stay disabled while any are missing. Use test
keys from the Stripe dashboard during development.

| Variable                   | Description                                            |
| -------------------------- | ------------------------------------------------------ |
| `STRIPE_PUBLISHABLE_KEY`   | Publishable key (`pk_test_…` / `pk_live_…`)            |
| `STRIPE_SECRET_KEY`        | Secret key (`sk_test_…` / `sk_live_…`)                 |
| `STRIPE_WEBHOOK_SECRET`    | Webhook signing secret (`whsec_…`)                     |
| `STRIPE_PRICE_PRO_MONTHLY` | Price ID for the Pro monthly plan                      |
| `STRIPE_PRICE_API_MONTHLY` | Price ID for the API monthly plan                      |
| `STRIPE_PRICE_PRO_YEARLY`  | Price ID for Pro yearly (legacy alias: `…_PRO_ANNUAL`) |
| `STRIPE_PRICE_API_YEARLY`  | Price ID for API yearly (legacy alias: `…_API_ANNUAL`) |
| `STRIPE_TRIAL_DAYS`        | Free-trial days (default `7`; `0` disables trials)     |

## Python data pipeline / provider adapters

Used by `scripts/python/` fetchers, the provider bakeoff, and the X-post workflow. Provider names
for `GOLD_PROVIDER_ORDER` come from `scripts/python/gold_providers/registry.py`.

| Variable                      | Description                                                       | Default            |
| ----------------------------- | ----------------------------------------------------------------- | ------------------ |
| `GOLD_PROVIDER_ORDER`         | Comma-separated provider names tried in order                     | see `.env.example` |
| `AED_PEG`                     | USD→AED peg used for conversions                                  | `3.6725`           |
| `MAX_GOLD_FRESHNESS_SECONDS`  | Max quote age before it counts as stale                           | `900`              |
| `MIN_VALID_XAU_USD`           | Sanity floor for XAU/USD quotes                                   | `500`              |
| `MAX_VALID_XAU_USD`           | Sanity ceiling for XAU/USD quotes                                 | `10000`            |
| `HTTP_TIMEOUT_SECONDS`        | Per-request provider timeout                                      | `10`               |
| `HTTP_RETRIES`                | Retries per provider request                                      | `1`                |
| `SOFT_FAIL_ON_NO_FRESH_PRICE` | Exit 0 (skip) instead of failing when no fresh price is available | `true`             |
| `ALLOW_STALE_PRICE`           | Permit stale price to pass through (use with care)                | `false`            |
| `BAKEOFF_LOG_RAW`             | Capture full raw provider responses (verbose; never in prod)      | `false`            |

### Per-provider adapter credentials

Each adapter has an `…_ENABLED` toggle plus its key/host settings:

| Provider                | Variables                                                                                                                              |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Metal Sentinel          | `METAL_SENTINEL_ENABLED`, `METAL_SENTINEL_API_KEY`, `METAL_SENTINEL_API_HOST`, `METAL_SENTINEL_AUTH_HEADER`, `METAL_SENTINEL_ENDPOINT` |
| Finnhub (OANDA XAU/USD) | `FINNHUB_ENABLED`, `FINNHUB_API_KEY`, `FINNHUB_SYMBOL`                                                                                 |
| Financial Modeling Prep | `FMP_ENABLED`, `FMP_API_KEY`, `FMP_SYMBOL`                                                                                             |
| GoldAPI.io              | `GOLDAPI_IO_ENABLED`, `GOLDAPI_IO_KEY`                                                                                                 |
| Twelve Data             | `TWELVEDATA_ENABLED`, `TWELVEDATA_API_KEY`, `TWELVEDATA_SYMBOL`                                                                        |
| GoldPriceZ (legacy)     | `GOLDPRICEZ_ENABLED`, `GOLDPRICEZ_API_KEY`                                                                                             |
| gold-api.com (legacy)   | `GOLD_API_COM_ENABLED`, `GOLD_API_COM_KEY`                                                                                             |

### X / Twitter posting knobs

| Variable                                                                                          | Description                                                                      | Default |
| ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------- |
| `TWITTER_API_KEY` / `TWITTER_API_SECRET` / `TWITTER_ACCESS_TOKEN` / `TWITTER_ACCESS_TOKEN_SECRET` | OAuth 1.0a credentials (local names; see the secrets table for the GitHub names) | —       |
| `SKIP_DUPLICATE_TWEETS`                                                                           | Skip posting when content matches the last tweet                                 | `true`  |
| `ALLOW_STALE_TWEET`                                                                               | Permit posting from a stale snapshot                                             | `false` |
| `DRY_RUN_TWEET`                                                                                   | Compose but do not post                                                          | `false` |
| `MIN_TWEET_MOVE_USD`                                                                              | Minimum absolute move to justify a price tweet                                   | `1.00`  |
| `MIN_TWEET_MOVE_PCT`                                                                              | Minimum percentage move to justify a price tweet                                 | `0.03`  |
| `FORCE_SUMMARY_AFTER_MINUTES`                                                                     | Post a summary anyway after this many quiet minutes                              | `60`    |

### Reverse-proxy / `trust proxy`

When `NODE_ENV=production`, `server.js` sets `app.set('trust proxy', 1)` so Express reads the client
IP from the first `X-Forwarded-For` hop (Vercel, Cloudflare, Nginx, etc). Without this,
`express-rate-limit` keys every request on the proxy IP and the whole internet shares one bucket.

- **Single proxy in front of the app (default)** — keep `1`. This is correct for Vercel, Render,
  Fly.io single-region, and a typical Nginx reverse proxy.
- **Multiple proxies** (e.g., Cloudflare → Render) — set the trust hop count to match the number of
  proxies in the chain. Edit `server.js` if your deployment has more than one trusted hop.
- **Direct exposure (no proxy)** — leave `NODE_ENV` unset or non-`production`; the `trust proxy`
  line is skipped and `req.ip` is the socket peer address. Misconfiguring this in a proxied
  environment causes per-IP rate limits to misfire.

## GitHub Actions Secrets

These are configured as repository secrets in GitHub (Settings → Secrets → Actions):

| Secret Name                 | Used By                   | Purpose                                  |
| --------------------------- | ------------------------- | ---------------------------------------- |
| `GOLD_API_COM_KEY`          | `gold-price-fetch.yml`    | Primary gold spot API key (gold-api.com) |
| `GOLDPRICEZ_API_KEY`        | Provider adapter (legacy) | Optional legacy fallback key             |
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

## Client-side config constants (not env vars)

Earlier revisions of this doc listed some of these as env vars — they are **committed constants**
read by the browser, because GitHub Pages serves static files with no env at runtime:

| Constant                             | Where it lives                                       | Notes                                                          |
| ------------------------------------ | ---------------------------------------------------- | -------------------------------------------------------------- |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | `src/config/supabase.js`, `admin/supabase-config.js` | Anon key is designed to be public; RLS protects the data.      |
| `ALLOWED_EMAIL`                      | `admin/supabase-config.js`                           | Client-side hint only — real authorization is Supabase RLS.    |
| `ADSENSE_PUBLISHER_ID`               | `src/config/constants.js` (`AD_CONFIG`)              | Empty until AdSense is activated.                              |
| GA4 measurement ID                   | gtag snippet in page shells                          | Public by nature.                                              |
| Site identity (name/URL/description) | `src/config/site.js`                                 | Single source for runtime SEO helpers; drift-guarded in tests. |

## .env.example

See [`.env.example`](../.env.example) in the repo root for the committed template.

## Local MCP config (`.vscode/mcp.json`)

- `.vscode/mcp.json` is **local-only** and must never be committed.
- Copy from [`../.vscode/mcp.example.json`](../.vscode/mcp.example.json) and keep local values out
  of git.
- Prefer OAuth/http MCP setup where possible, or use environment variables for stdio/CLI mode.
- For non-login CLI usage, use `SUPABASE_ACCESS_TOKEN` from your shell/CI environment (do not
  hardcode PAT values in config files).
- Manage Supabase personal access tokens in **Supabase Dashboard → Account → Access Tokens**.
- If Supabase currently shows **“No access tokens found”**, a previously leaked token is likely
  already unavailable/revoked, but the repository must still be cleaned and protected against
  recommits.
- Connector/MCP overview: [`INTEGRATIONS.md`](./INTEGRATIONS.md).

## Notes

- Never commit `.env` files to the repository
- The `.env.example` file is committed as a template
- Supabase anon key is safe to expose client-side (RLS protects data)
- All API keys for external services must be in GitHub Secrets for CI/CD workflows
- In production (GitHub Pages), client-side code does NOT use env vars — API keys are in GitHub
  Secrets only
- `STORAGE_BACKEND=supabase` switches the Express server's repository layer from file-based to
  Supabase
- Alerts v1 uses Resend when `RESEND_API_KEY` + `RESEND_FROM_EMAIL` are both configured; otherwise
  it runs safely in dry-run/log-only mode.
- Never commit personal access tokens or credentials, including Supabase PATs, Supabase service-role
  keys, database URLs with embedded passwords, X/Twitter tokens, Telegram bot tokens, Discord
  webhooks, or GitHub tokens.
