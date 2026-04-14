# Supabase Schema — @GoldTickerLive Posting System

This document describes the Supabase tables used by the automated gold price posting system. These
tables are **in addition to** the existing `shops`, `site_settings`, `audit_logs`, and
`user_profiles` tables documented in `supabase/schema.sql`.

---

## Table: `gold_prices`

Stores every gold price fetched by the system.

| Column       | Type              | Purpose                               |
| ------------ | ----------------- | ------------------------------------- |
| `id`         | `uuid` (PK, auto) | Unique row identifier                 |
| `spot_usd`   | `numeric`         | XAU/USD spot price per troy ounce     |
| `change_pct` | `numeric`         | Percentage change from previous close |
| `open_usd`   | `numeric`         | Day open price (nullable)             |
| `high_usd`   | `numeric`         | Day high price (nullable)             |
| `low_usd`    | `numeric`         | Day low price (nullable)              |
| `k24_aed`    | `numeric`         | 24K AED per gram (nullable)           |
| `k22_aed`    | `numeric`         | 22K AED per gram (nullable)           |
| `k21_aed`    | `numeric`         | 21K AED per gram (nullable)           |
| `fetched_at` | `timestamptz`     | When the price was fetched (UTC)      |

### SQL to Create

```sql
create table if not exists public.gold_prices (
    id          uuid primary key default uuid_generate_v4(),
    spot_usd    numeric not null,
    change_pct  numeric,
    open_usd    numeric,
    high_usd    numeric,
    low_usd     numeric,
    k24_aed     numeric,
    k22_aed     numeric,
    k21_aed     numeric,
    fetched_at  timestamptz not null default now()
);

-- Service role key bypasses RLS, so no public policies needed
alter table public.gold_prices enable row level security;
```

### Example Queries

```sql
-- Get the latest price
select * from gold_prices order by fetched_at desc limit 1;

-- Get prices from the last 24 hours
select * from gold_prices
where fetched_at > now() - interval '24 hours'
order by fetched_at desc;

-- Get daily high/low/close
select
    date_trunc('day', fetched_at) as day,
    max(spot_usd) as high,
    min(spot_usd) as low,
    (array_agg(spot_usd order by fetched_at desc))[1] as close
from gold_prices
group by day
order by day desc;
```

---

## Table: `fetch_logs`

Logs every workflow run — successes, skips, and failures.

| Column          | Type              | Purpose                                                   |
| --------------- | ----------------- | --------------------------------------------------------- |
| `id`            | `uuid` (PK, auto) | Unique row identifier                                     |
| `status`        | `text`            | `success`, `error`, `skipped`                             |
| `mode`          | `text`            | `hourly`, `market_event`, `spike_alert`, `health_check`   |
| `price_usd`     | `numeric`         | The fetched price at time of run (nullable)               |
| `tweet_id`      | `text`            | The posted tweet ID (nullable)                            |
| `error_message` | `text`            | Error details if status is `error` or reason if `skipped` |
| `created_at`    | `timestamptz`     | When the log was created (UTC)                            |

### SQL to Create

```sql
create table if not exists public.fetch_logs (
    id              uuid primary key default uuid_generate_v4(),
    status          text not null,
    mode            text not null,
    price_usd       numeric,
    tweet_id        text,
    error_message   text,
    created_at      timestamptz not null default now()
);

alter table public.fetch_logs enable row level security;
```

### Example Queries

```sql
-- Get the last 10 log entries
select * from fetch_logs order by created_at desc limit 10;

-- Count spike alerts in the last 24 hours
select count(*) from fetch_logs
where mode = 'spike_alert'
  and status = 'success'
  and created_at > now() - interval '24 hours';

-- Get the most recent spike alert timestamp
select created_at from fetch_logs
where mode = 'spike_alert' and status = 'success'
order by created_at desc limit 1;

-- Get all errors in the last 7 days
select * from fetch_logs
where status = 'error'
  and created_at > now() - interval '7 days'
order by created_at desc;

-- Daily success/failure counts
select
    date_trunc('day', created_at) as day,
    status,
    count(*) as count
from fetch_logs
group by day, status
order by day desc;
```

---

## Setup Instructions

1. Go to your Supabase project → **SQL Editor**
2. Run the SQL from both `create table` blocks above
3. Both tables use RLS but the posting system uses the **service role key** which bypasses RLS, so
   no additional policies are needed for the bot
4. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as GitHub Secrets
