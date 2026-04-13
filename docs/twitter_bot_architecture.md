# Architecture — @GoldTickerLive Posting System

## Overview

The system automatically posts gold price updates to the @GoldTickerLive
X (Twitter) account using GitHub Actions workflows that run on cron
schedules. Everything is config-driven: changing tweet format, spike
thresholds, or market sessions requires editing JSON files only.

---

## System Diagram

```
                     GitHub Actions (cron)
                     ┌──────────────────────────────────┐
                     │  hourly_post.yml     (every hour) │
                     │  market_events.yml   (open/close) │
                     │  spike_alert.yml     (every 15m)  │
                     │  health_check.yml    (daily)      │
                     └──────────┬───────────────────────┘
                                │
                                ▼
                     scripts/gold_poster.py
                     (reads POST_MODE env var)
                                │
               ┌────────────────┼────────────────┐
               ▼                ▼                ▼
         scripts/utils/   config/twitter_bot/   External APIs
         ├── price_fetcher.py   ├── market_sessions.json   ├── GoldAPI (goldapi.io)
         ├── market_hours.py    ├── karat_weights.json      ├── X / Twitter API v2
         ├── tweet_formatter.py ├── thresholds.json         └── Supabase
         ├── twitter_client.py  └── tweet_templates.json
         ├── spike_detector.py
         ├── supabase_client.py
         └── logger.py
```

---

## Data Flow

### Hourly Post
```
Cron trigger (every hour)
  → gold_poster.py (POST_MODE=hourly)
    → price_fetcher.py  → GoldAPI → XAU/USD price + karat calculations
    → supabase_client.py → save price to gold_prices table
    → tweet_formatter.py → read tweet_templates.json → build tweet text
    → twitter_client.py  → post to X via Tweepy v2
    → supabase_client.py → log result to fetch_logs table
```

### Market Event Post
```
Cron trigger (at session open/close times)
  → gold_poster.py (POST_MODE=market_event)
    → market_hours.py    → read market_sessions.json → detect open/close event
    → price_fetcher.py   → fetch current price
    → tweet_formatter.py → format market_open or market_close template
    → twitter_client.py  → post to X
    → supabase_client.py → log result
```

### Spike Alert
```
Cron trigger (every 15 minutes)
  → gold_poster.py (POST_MODE=spike_alert)
    → price_fetcher.py   → fetch current price
    → spike_detector.py  → compare against last Supabase price
                         → check thresholds.json for spike threshold
                         → check fetch_logs for rate limit enforcement
    → (if spike confirmed and posting allowed)
       → tweet_formatter.py → format spike_up or spike_down template
       → twitter_client.py  → post to X
    → supabase_client.py → log result regardless of outcome
```

### Health Check
```
Cron trigger (daily at 08:00 GST)
  → gold_poster.py (POST_MODE=health_check)
    → price_fetcher.py   → verify GoldAPI is reachable
    → supabase_client.py → check if last price is < 2 hours old
    → twitter_client.py  → verify credentials without posting
    → output summary to Actions log
    → exit non-zero if any check fails
```

---

## Configuration Files

All behaviour is driven by JSON config files in `config/twitter_bot/`.

| File | Controls |
|---|---|
| `market_sessions.json` | Session names, open/close times (UTC), active days, primary flag |
| `karat_weights.json` | Karat purity multipliers for per-gram price calculation |
| `thresholds.json` | Spike threshold %, rate limits, retry settings, tweet length |
| `tweet_templates.json` | Tweet text templates with named placeholders |

**Changing any tweet format requires editing only `tweet_templates.json` —
no Python or YAML changes needed.**

---

## Error Handling

| Failure | Behaviour |
|---|---|
| GoldAPI down | Retry per thresholds.json → log error to fetch_logs → exit non-zero (no tweet posted with stale data) |
| Twitter rate limit (429) | Exponential backoff retry → fail after max retries |
| Twitter auth error (401/403) | Fail immediately, log clearly |
| Duplicate tweet | Log and skip silently |
| Supabase down (hourly/market) | Still post tweet, log warning |
| Supabase down (spike) | Skip spike check entirely to avoid uncontrolled posting |
| Missing env vars | Fail immediately with clear message listing missing secrets |
| Malformed API response | Validate all fields → fail cleanly if anything is missing |

---

## Secrets

See [`docs/twitter_bot_secrets.md`](twitter_bot_secrets.md) for the complete
list of required GitHub Secrets and where to find them.

---

## Database

See [`docs/twitter_bot_schema.md`](twitter_bot_schema.md) for the Supabase
table schemas, column descriptions, and example queries.
