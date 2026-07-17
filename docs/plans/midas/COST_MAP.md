# Cost Map — Operation Midas Phase 13 (Abuse & Cost Guardrails)

Budget ceiling: **~$30/month total.** This page is evidence-first: every consumer is cited to a file
in the repo. Request budgets are computed from the actual cron cadences and client refresh intervals
in the tree. Anything marked **(owner-confirm)** is an external account tier this agent cannot read
without mutating/authenticating a service, so it is flagged rather than asserted.

> Verdict up front: on the current wiring the recurring cash cost is effectively
> **$0/month**
> (Stripe is per-transaction only), so the $30 ceiling is met **as long as three
> assumptions hold**: the GitHub repo stays **public** (free Actions minutes), the X account stays
> on the **free** tier, and the paid providers stay unused fallbacks. The four things that could
> break that are in [Top cost risks](#top-cost-risks).

## Origin ledger — every external host `src/` talks to

This table is the machine-checked source of truth for the origin-drift guard
(`tests/cost-map-origin-guard.test.js`): every external network host that appears in `src/**/*.js`
must be listed here or in that test's non-network allowlist, or the test fails.

| Host                                | Consumer (cite)                                                                                                                                  | Client or server       | Tier / cost                              |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------- | ---------------------------------------- |
| `open.er-api.com`                   | `src/lib/api.js` `fetchFX()` via `API_FX_URL` (`src/config/constants.js:8`)                                                                      | Client (every visitor) | Free, no key; updates once/24h           |
| `api.gold-api.com` / `gold-api.com` | `scripts/python/gold_providers/gold_api_com.py`; client live-lane `src/lib/quote-providers/gold-api-com-provider.js`, `src/lib/spot-resolver.js` | Both                   | Free, no key, small quota                |
| `nebdpxjazlnsrfmlpgeq.supabase.co`  | `src/config/supabase.js`, `src/lib/supabase-data.js`, `src/lib/site-settings.js`, `src/lib/analytics.js`, `src/lib/public-account-client.js`     | Client                 | Free tier **(owner-confirm)**            |
| `api.gdeltproject.org`              | `src/tracker/wire.js` (news wire)                                                                                                                | Client (tracker page)  | Free, no key                             |
| `freegoldapi.com`                   | `src/lib/freegoldapi.js` (historical reference only)                                                                                             | Client                 | Free, no key                             |
| `mintedmetal.com`                   | `src/lib/quote-providers/minted-metal-provider.js`                                                                                               | Client live-lane       | Free, no key                             |
| `nominatim.openstreetmap.org`       | `src/pages/shops.js:2784` (reverse geocode on demand)                                                                                            | Client                 | Free, usage-policy capped (1 req/s + UA) |
| `www.tradingview.com`               | `src/components/chart.js` (embedded widget)                                                                                                      | Client                 | Free embed                               |
| `cdn.jsdelivr.net`                  | `src/pages/calculator.js`                                                                                                                        | Client                 | Free CDN                                 |
| `unpkg.com`                         | `src/components/shops-map.js` (Leaflet)                                                                                                          | Client                 | Free CDN                                 |
| `pagead2.googlesyndication.com`     | `src/components/adSlot.js` (AdSense)                                                                                                             | Client                 | Revenue, not cost                        |

Non-network hosts intentionally excluded from the guard (vocab / share links / self): `schema.org`,
`www.w3.org`, `example.com`, `goldtickerlive.com`, `twitter.com`, `x.com`, `wa.me`,
`www.google.com`, `www.openstreetmap.org`.

## Scheduled consumers — monthly request budgets

Cron sources: `.github/workflows/*.yml`. Market window used throughout = Sun 21:00 UTC → Fri 20:59
UTC (24×5). "Runs/mo" ≈ runs/week × 4.33.

| Workflow                                           | Cadence (cite)                  | Runs/mo       | External call per run     | Notes                                            |
| -------------------------------------------------- | ------------------------------- | ------------- | ------------------------- | ------------------------------------------------ |
| `gold-price-fetch.yml`                             | hourly, market only (`:16-18`)  | ~520          | 1× gold-api.com (primary) | Fallbacks only on failure                        |
| `post_gold.yml`                                    | hourly, market only (`:18-20`)  | ~520 attempts | ≤1× X API write           | **Guards skip many; see risk #1**                |
| `deploy.yml`                                       | every 30 min, market (`:14-16`) | ~1,040        | GitHub Pages deploy       | Free on public repo                              |
| `record-price-history.yml`                         | `5,35 * * * *` (`:12`)          | ~1,440        | none external             | Actions minutes only                             |
| `spike_alert.yml`                                  | `*/15 * * * *` (`:10`)          | ~2,880        | reads committed data      | Actions minutes only                             |
| `uptime-monitor.yml`                               | `*/30 * * * *` (`:10`)          | ~1,440        | HTTP probe of site        | Actions minutes only                             |
| `daily-newsletter.yml`                             | `0 3 * * *` (`:10`)             | ~30           | Resend batch send         | Emails = 30 × subscribers                        |
| `weekly-newsletter.yml`                            | `0 14 * * 0` (`:10`)            | ~4.3          | Resend batch send         | `scripts/node/send-newsletter.js` BATCH_SIZE=100 |
| `health_check` / `link-check` / `generate-sitemap` | daily                           | ~30 each      | self / repo               | Actions minutes only                             |
| `ci.yml`                                           | `0 3 * * *` + PRs (`:17`)       | ~30 + PRs     | none                      | Actions minutes only                             |
| `codeql.yml`                                       | weekly (`:32`)                  | ~4.3          | none                      | Actions minutes only                             |

**GitHub Actions minutes:** summing scheduled runs ≈ **7,000–8,000 runs/month**, roughly 7k–10k
minutes. On a **public** repo these minutes are **free and unlimited**. On a **private** repo the
free grant is ~2,000–3,000 min/month, so this cadence would immediately overrun into paid minutes —
see risk #2.

## Per-service verdict vs the $30 ceiling

- **GitHub** — Pages: free. Actions: **free iff repo public** (owner-confirm visibility). CodeQL:
  free on public. Verdict: **$0 if public.**
- **Cloudflare** — free tier covers DNS, cache rules, and the security headers/redirects this site
  uses. No paid feature is required. Verdict: **$0** (free tier fits).
- **gold-api.com** — free, no key (`gold_providers/gold_api_com.py`); paired with monitored
  fallbacks because of historical quota flakiness. Verdict: **$0.**
- **Fallback gold providers** — `twelvedata` (free ~800 req/day, key: `TWELVEDATA_API_KEY`), `fmp`
  (free ~250 req/day, key: `FMP_API_KEY`) are the only fallbacks in the active
  `GOLD_PROVIDER_ORDER=gold_api_com,twelvedata_xauusd,fmp_gcusd` (`gold-price-fetch.yml`). Adapters
  for `goldapi_io` (free ~100 req/**month** — tiny), `finnhub`, `goldpricez` exist in
  `scripts/python/gold_providers/` but are **not** in the active order. Fallbacks fire only when the
  primary fails, so free daily quotas are ample. Verdict: **$0** as long as `goldapi_io` is never
  promoted into the order (risk #4).
- **open.er-api.com** — free, no key, per-IP soft limits, refreshes once/24h. `fetchFX()`
  (`src/lib/api.js:272`) has **no client TTL guard**, so live pages (`heatmap`, `calculator`,
  `compare`, `portfolio`, `invest`) re-fetch it every `GOLD_REFRESH_MS = 90 s`
  (`src/config/constants.js:11`). Because the limit is per visitor IP and the endpoint tolerates it,
  this is **wasteful but not a cash cost**. Cheap win (not implemented here): give `fetchFX()` a
  ~1–6 h in-memory/localStorage TTL, since the upstream only moves daily. Verdict: **$0.**
- **mintedmetal.com / freegoldapi.com** — free, no key; reference/second-opinion only. Verdict:
  **$0.**
- **Supabase** — free tier (500 MB DB, ~5 GB egress, 50k MAU) **(owner-confirm)**. Client reads shop
  listings, site settings, and writes analytics events (`src/lib/analytics.js`) — analytics row
  growth is the main free-tier pressure. Free projects **pause after ~7 days of inactivity**; given
  live traffic this is unlikely, but a pause would break shop/settings reads. Verdict: **$0 on free
  tier**, confirm the tier and watch DB/egress as analytics grows.
- **X API (bot)** — `post_gold.yml` runs **hourly during market hours** ≈ **520 attempts/month**.
  The X **free** tier caps writes at **500 posts/month** (~17/day). Actual posts are fewer than
  attempts because `tweet_guard`/duplicate/cooldown guards skip many runs, but the ceiling is close.
  The paid **Basic** tier is **$200/month — which alone blows the $30 ceiling** — so the account
  **must** stay free. Verdict: **$0 on free**, but see risk #1.
- **Newsletter (Resend)** — `scripts/node/send-newsletter.js`, BATCH_SIZE=100. Resend free ≈ **3,000
  emails/month, 100/day**. Daily send to >100 subscribers overruns the daily cap; monthly sends to
  > ~3,000 overrun the monthly cap. Verdict: **$0 while subscriber count is small (owner-confirm
  > count)**; risk #3.
- **Google Analytics** — free. Verdict: **$0.**
- **Stripe** — per-transaction (~2.9% + fee), **no monthly floor**. Does not consume the
  $30
  recurring budget. Verdict: **$0 recurring.**

**Total recurring: ~$0/month** under the three assumptions above — comfortably inside $30.

## Top cost risks

1. **X free-tier 500-writes/month cap vs hourly cadence.** `post_gold.yml` schedules ~520
   attempts/month; the free ceiling is 500. Soft guards keep real posts under that today, but there
   is **no monthly-quota alarm** — the pipeline only reacts to a `TooManyRequests` after it already
   hit the wall (`scripts/python/post_gold_price.py:1409`). This is the **biggest unmonitored
   quota.** See [Cheapest alarm](#cheapest-alarm-for-the-biggest-unmonitored-quota).
2. **Repo visibility.** The whole $0 Actions story depends on the repo being **public**. If it ever
   flips private, ~7k–10k scheduled minutes/month land almost entirely in paid overage. Confirm and
   keep public, or gate the high-frequency crons (`spike_alert` every 15 min, `record-price-history`
   and `uptime-monitor` every 30 min).
3. **Resend caps as the list grows.** 100/day and 3,000/month are free-tier hard limits; a growing
   `daily-newsletter` list crosses the daily cap first.
4. **`goldapi_io` promotion.** Its free tier is ~100 req/**month**; if it is ever added to
   `GOLD_PROVIDER_ORDER` it would exhaust within a day of primary outage. Keep it out of the active
   order.

## Cheapest alarm for the biggest unmonitored quota

**Target:** X monthly write cap (risk #1).

**Cheapest option — zero extra API calls.** The X API already returns rate-limit headers on every
post response, and `post_gold_price.py` already classifies `TooManyRequests`
(`classify_post_exception`, `:1409`). Extend the existing post path to read the
`x-app-limit-24hour-remaining` (and, where present, the monthly-usage) header off the **successful**
response it already receives, write the number into the run's `$GITHUB_STEP_SUMMARY`, and emit a
GitHub Actions **warning annotation** (`echo "::warning::…"`) when remaining drops below ~10%. That
turns the invisible monthly ceiling into a yellow banner on the run **before** it becomes a red
`FAILED_RATE_LIMIT`, costs nothing (no new request, no new service), and needs no state file.

_A slightly heavier alternative — maintain a committed monthly post counter and warn at 450 — is
more precise but adds state-file churn on the protected `post_gold` path; the header approach is
preferred as the cheapest._

## Quota / abuse behavior already verified in tests

- **gold-api rate-limit → fallback + circuit breaker.** On `rate_limited`/`quota_exhausted` the
  provider's breaker opens for `CB_RATE_LIMIT_OPEN_MINUTES = 60`
  (`scripts/python/fetch_gold_price.py:114`) and iteration moves down `GOLD_PROVIDER_ORDER`. A total
  pipeline failure is proven to surface **only labelled fallback/cached/unavailable** states, never
  `live` — `tests/midas-pipeline-failure.test.js` (`:139` cache fallback, `:170` unavailable, `:194`
  realtime engine). The `ALLOW_STALE` gate governs whether a stale quote may still post
  (`scripts/python/tweet_guard.py`, `tests/test_tweet_guard.py`).
- **Client FX failure path.** `fetchFX()` returns `source:'live'` when healthy
  (`tests/midas-fx-matrix.test.js:81`) and falls through to the localStorage cache
  (`source:'cache-fallback'`) or throws `NetworkError` when both fail (`src/lib/api.js:294-306`);
  the AED peg can never be overridden by the feed (`midas-fx-matrix.test.js:73,89,107`).
- **Server rate limiting.** Express runs a global limiter (300/min prod) and an `/api/` limiter
  (120/min prod) — `server.js:206-226` — with hardening covered by `tests/server.test.js`
  (path-traversal, security headers, method rejection). The public developer API enforces per-key
  limits and auth (`tests/developer-api.test.js`). Not rebuilt here.

## Assumptions to confirm with the owner

- GitHub repo is **public** (Actions/Pages/CodeQL free).
- Supabase project is on the **free** tier and not near DB/egress/MAU limits.
- X account is on the **free** tier (not paid Basic at $200/mo).
- Resend account tier and current subscriber count vs the 100/day, 3,000/month free caps.
