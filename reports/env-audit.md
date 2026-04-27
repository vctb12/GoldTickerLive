# Environment-variable audit (Track 5.4)

**Date:** 2026-04-27 · **Scope:** read-only diagnostic.

This report enumerates every `process.env.*` and Python `os.environ.get(...)` reference in the
runtime tree, then cross-references each name against the canonical
[`docs/environment-variables.md`](../docs/environment-variables.md).

The goal is to surface (a) any env var read by the code that is **not** documented, and (b) any env
var documented as required that is **not** referenced anywhere — so future agents and operators
don't ship a deploy where the env layer silently falls through to defaults.

---

## Findings

### A. Documented and referenced — ✅ aligned

| Var                           | Docs status                              | Referenced from                                                                                                                                        |
| ----------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `JWT_SECRET`                  | Required (server)                        | `server/lib/auth.js`                                                                                                                                   |
| `ADMIN_PASSWORD`              | Required (server)                        | `server/lib/auth.js`                                                                                                                                   |
| `ADMIN_ACCESS_PIN`            | Required (server)                        | `server/routes/admin/index.js`                                                                                                                         |
| `SUPABASE_URL`                | Documented                               | `server/lib/supabase-client.js`, `server/routes/newsletter.js`, `scripts/node/send-newsletter.js`, `scripts/python/utils/supabase_client.py`           |
| `SUPABASE_SERVICE_ROLE_KEY`   | Documented                               | `server/lib/supabase-client.js`, `server/routes/newsletter.js`, `scripts/node/send-newsletter.js`, `scripts/python/utils/supabase_client.py`           |
| `SUPABASE_ANON_KEY`           | Required                                 | `src/config/supabase.js` (client-side, embedded by design)                                                                                             |
| `GOLDPRICEZ_API_KEY`          | Required                                 | Read by GitHub Actions workflows; not directly read by Node code in this tree                                                                          |
| `ALLOWED_EMAIL`               | Required                                 | `admin/supabase-config.js` (client-side admin config)                                                                                                  |
| `STORAGE_BACKEND`             | Optional                                 | `server/repositories/shops.repository.js`, `server/repositories/audit.repository.js`                                                                   |
| `NODE_ENV`                    | Optional                                 | `server/lib/errors.js`, `server/lib/site-url.js`                                                                                                       |
| `PORT`                        | Optional                                 | `server.js`                                                                                                                                            |
| `CORS_ORIGINS`                | Optional                                 | `server.js`                                                                                                                                            |
| `SITE_URL`                    | Optional                                 | `server/lib/site-url.js`, `scripts/node/generate-newsletter.js`, `scripts/node/uptime-check.js`                                                        |
| `RESEND_API_KEY`              | Optional                                 | `server/routes/newsletter.js`, `scripts/node/send-newsletter.js`                                                                                       |
| `RESEND_FROM_EMAIL`           | Optional                                 | `server/routes/newsletter.js`, `scripts/node/send-newsletter.js`                                                                                       |
| `STRIPE_PUBLISHABLE_KEY`      | Optional                                 | `server/routes/stripe.js`                                                                                                                              |
| `STRIPE_SECRET_KEY`           | Optional                                 | `server/routes/stripe.js`                                                                                                                              |
| `STRIPE_WEBHOOK_SECRET`       | Optional                                 | `server/routes/stripe.js`                                                                                                                              |
| `STRIPE_PRICE_PRO_MONTHLY`    | Optional                                 | `server/routes/stripe.js`                                                                                                                              |
| `STRIPE_PRICE_PRO_ANNUAL`     | Optional                                 | `server/routes/stripe.js`                                                                                                                              |
| `STRIPE_PRICE_API_MONTHLY`    | Optional                                 | `server/routes/stripe.js`                                                                                                                              |
| `STRIPE_PRICE_API_ANNUAL`     | Optional                                 | `server/routes/stripe.js`                                                                                                                              |
| `TELEGRAM_BOT_TOKEN`          | Documented (CI secret)                   | `scripts/node/notify-telegram.js`, `scripts/node/uptime-check.js`, `scripts/node/price-spike-alert.js`                                                 |
| `TELEGRAM_CHANNEL_ID`         | Documented (CI secret)                   | (same set as above)                                                                                                                                    |
| `DISCORD_WEBHOOK_URL`         | Documented (CI secret)                   | `scripts/node/notify-discord.js`, `scripts/node/uptime-check.js`, `scripts/node/price-spike-alert.js`                                                  |
| `TWITTER_API_KEY`             | Mapped to `CONSUMER_KEY` workflow secret | `scripts/node/tweet-gold-price.js`, `scripts/node/price-spike-alert.js`, `scripts/python/post_gold_price.py`, `scripts/python/utils/twitter_client.py` |
| `TWITTER_API_SECRET`          | Mapped to `CONSUMER_SECRET`              | (same set)                                                                                                                                             |
| `TWITTER_ACCESS_TOKEN`        | Mapped to `ACCESS_TOKEN`                 | (same set)                                                                                                                                             |
| `TWITTER_ACCESS_TOKEN_SECRET` | Mapped to `ACCESS_TOKEN_SECRET`          | (same set)                                                                                                                                             |

### B. Referenced but **not** documented — 🟡 follow-up

| Var                   | Where read                                                 | Suggested docs entry                                                                        |
| --------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `SPIKE_THRESHOLD_PCT` | `scripts/node/price-spike-alert.js`                        | Optional. Default `2.0`. Percentage move that triggers a spike alert.                       |
| `POST_MODE`           | `scripts/python/gold_poster.py`, multiple Python utilities | Optional. Posting mode override (`live`, `dry-run`, …); read by the hourly X-post workflow. |

These are not safety-critical (both fall back to sensible defaults) but should be added to
`docs/environment-variables.md` so operators know they exist.

### C. Documented as optional but **not** referenced anywhere in code — ⚠️ verify

| Var                  | Docs status | Notes                                                                                                                                                                                                                                        |
| -------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GA4_MEASUREMENT_ID` | Optional    | Currently the GA4 ID is **hardcoded** in `assets/analytics.js` (`G-K3GNY9M8TE`). The env var is documented but not read. Either wire it up or remove the row from the docs. Tracked as W-12 in `docs/plans/2026-04-25_codebase-analysis.md`. |
| `ADSENSE_CLIENT_ID`  | Optional    | Same situation: the AdSense publisher ID is hardcoded in `index.html`. Tracked as W-12.                                                                                                                                                      |

### D. CI-only / GitHub Actions secrets — out of scope for this audit

The variables `CONSUMER_KEY`, `CONSUMER_SECRET`, `ACCESS_TOKEN`, `ACCESS_TOKEN_SECRET`, `GITHUB_*`,
and `SUPABASE_MCP_TOKEN` are read by workflows or workflow-only Python entry points — they are not
part of the server runtime env. They appear in
`docs/environment-variables.md#github-actions-secrets` which is the right place for them.

---

## Action log

- 2026-04-27 — Audit produced. Findings B and C are flagged for a follow-up docs PR; this batch is
  read-only per the W-9/Track 5.4 scope.
