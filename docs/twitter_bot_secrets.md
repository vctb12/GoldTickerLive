# Required GitHub Secrets

This document lists every GitHub Secret the @GoldTickerLive posting system requires. **No actual
secret values are stored here — only names and descriptions.**

---

## Gold Price API

| Secret Name          | Purpose                                                       | Where to Get It                                             | What Happens if Missing                           |
| -------------------- | ------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------- |
| `GOLDPRICEZ_API_KEY` | API key for GoldAPI (goldapi.io) to fetch XAU/USD spot prices | Sign up at https://www.goldapi.io — copy key from dashboard | All workflows fail — no price data can be fetched |

---

## Twitter / X Credentials

All four are required for posting tweets. Generated in the
[X Developer Portal](https://developer.twitter.com).

| Secret Name           | Purpose                                           | Where to Get It                                       | What Happens if Missing             |
| --------------------- | ------------------------------------------------- | ----------------------------------------------------- | ----------------------------------- |
| `CONSUMER_KEY`        | X App API Key (OAuth 1.0a Consumer Key)           | X Developer Portal → App → Keys and Tokens            | Tweet posting fails with auth error |
| `CONSUMER_SECRET`     | X App API Key Secret (OAuth 1.0a Consumer Secret) | X Developer Portal → App → Keys and Tokens            | Tweet posting fails with auth error |
| `ACCESS_TOKEN`        | X Access Token (must have Read+Write permission)  | X Developer Portal → App → Keys and Tokens → Generate | Tweet posting fails with auth error |
| `ACCESS_TOKEN_SECRET` | X Access Token Secret                             | X Developer Portal → App → Keys and Tokens → Generate | Tweet posting fails with auth error |

> **Important:** Access Tokens must be generated under **Read and Write** permissions. Tokens
> generated under "Read only" cannot post tweets.

---

## Supabase

Used for price logging, spike detection rate limiting, and health monitoring.

| Secret Name                 | Purpose                                  | Where to Get It                                        | What Happens if Missing                                                                            |
| --------------------------- | ---------------------------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `SUPABASE_URL`              | Supabase project URL                     | Supabase Dashboard → Settings → API → Project URL      | Price history not saved; spike detection runs without rate limits; health check skips DB freshness |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (bypasses RLS) | Supabase Dashboard → Settings → API → Service Role Key | Same as SUPABASE_URL missing                                                                       |

> **Warning:** The service role key bypasses Row Level Security. Never expose it in client-side
> code.

---

## Optional Variables

| Variable Name     | Type                             | Purpose                               | Default                                                       |
| ----------------- | -------------------------------- | ------------------------------------- | ------------------------------------------------------------- |
| `SPIKE_THRESHOLD` | Repository Variable (not Secret) | Percentage threshold for spike alerts | `2.0` (set in `vars.SPIKE_THRESHOLD` or defaults in workflow) |

---

## Workflow → Secret Mapping

| Workflow            | Secrets Used                                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `hourly_post.yml`   | `GOLDPRICEZ_API_KEY`, `CONSUMER_KEY`, `CONSUMER_SECRET`, `ACCESS_TOKEN`, `ACCESS_TOKEN_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| `market_events.yml` | Same as hourly                                                                                                                              |
| `spike_alert.yml`   | Same as hourly + `SPIKE_THRESHOLD` (variable)                                                                                               |
| `health_check.yml`  | Same as hourly                                                                                                                              |

---

## How to Add Secrets

1. Go to your repository on GitHub
2. Navigate to **Settings → Secrets and variables → Actions**
3. Click **New repository secret**
4. Enter the secret name exactly as listed above
5. Paste the value and save
