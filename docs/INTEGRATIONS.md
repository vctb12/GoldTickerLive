# Integrations, Connectors & MCP

One map of every external service the platform talks to — what is **live in production**, what is
**scaffolded** (code exists, surface incomplete), and what is **inert until the owner adds
credentials**. Status honesty follows the same rules as pricing copy: nothing below claims to be
live unless it actually is.

Deep audit snapshot (per-feature FE/BE/DB matrix):
[`audits/INTEGRATION_REALITY_CHECK.md`](./audits/INTEGRATION_REALITY_CHECK.md). Env-var registry:
[`environment-variables.md`](./environment-variables.md).

## Live in production

| Integration                   | What it does                                                                                                               | Key files / docs                                                                                                                                          |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Gold price providers**      | Hourly XAU/USD fetch through the multi-provider adapter chain (`GOLD_PROVIDER_ORDER`), committed to `data/gold_price.json` | `scripts/python/gold_providers/`, `.github/workflows/gold-price-fetch.yml`, [`gold-price-provider-bakeoff.md`](./gold-price-provider-bakeoff.md)          |
| **X / Twitter automation**    | Hourly `@GoldTickerLive` posts with duplicate/staleness guards and observability logs                                      | `.github/workflows/post_gold.yml`, [`TWITTER_AUTOMATION.md`](./TWITTER_AUTOMATION.md), [`X_AUTOMATION_OBSERVABILITY.md`](./X_AUTOMATION_OBSERVABILITY.md) |
| **Supabase (browser)**        | Public reads (anon key + RLS) for prices, shops, settings; admin panel auth                                                | `src/config/supabase.js`, `admin/supabase-config.js`, [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md), [`SUPABASE_SCHEMA.md`](./SUPABASE_SCHEMA.md)            |
| **GA4 analytics**             | Governed, PII-stripped event catalog via `gtag` (38 registered events; opt-out + DNT respected)                            | `src/lib/analytics.js`, [`ANALYTICS_EVENTS.md`](./ANALYTICS_EVENTS.md), `npm run analytics:inventory`                                                     |
| **GitHub Actions**            | CI merge gate, deploy, sitemap, Lighthouse, link check, uptime, spike alerts, newsletters                                  | `.github/workflows/`, [`AUTOMATIONS.md`](./AUTOMATIONS.md), [`workbook/APPENDIX_B_WORKFLOWS_AND_CI.md`](./workbook/APPENDIX_B_WORKFLOWS_AND_CI.md)        |
| **Telegram / Discord notify** | Optional channel posts from workflows (secrets-gated)                                                                      | `scripts/node/notify-telegram.js`, `scripts/node/notify-discord.js`                                                                                       |

## Scaffolded (code exists, surface incomplete)

| Integration                   | State                                                                                                                                                | Where                                                                          |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Supabase analytics mirror** | `track()` can persist events to `analytics_events`, but it is **off** until an anon-insert RLS policy ships (`CONSTANTS.ANALYTICS_SUPABASE_ENABLED`) | `src/lib/analytics.js`, [`ANALYTICS_EVENTS.md`](./ANALYTICS_EVENTS.md)         |
| **Alerts v1**                 | Backend + email templates done; runs dry-run without Resend creds; UI surface minimal                                                                | [`ALERTS_AND_NOTIFICATIONS.md`](./ALERTS_AND_NOTIFICATIONS.md)                 |
| **AI content drafts**         | Admin pipeline with human-review gate; editorial UI lightly exercised                                                                                | [`AI_CONTENT_AUTOMATION.md`](./AI_CONTENT_AUTOMATION.md)                       |
| **Vendor self-serve portal**  | DB + partial API only; no vendor UI or role yet                                                                                                      | [`audits/INTEGRATION_REALITY_CHECK.md`](./audits/INTEGRATION_REALITY_CHECK.md) |

## Inert until owner configures credentials

| Integration                            | Unlock condition                                                                                              | Docs                                                           |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Stripe billing**                     | Set `STRIPE_SECRET_KEY` + `STRIPE_PUBLISHABLE_KEY` + `STRIPE_WEBHOOK_SECRET` + price IDs                      | [`BILLING_AND_ENTITLEMENTS.md`](./BILLING_AND_ENTITLEMENTS.md) |
| **Resend email** (newsletter + alerts) | Set `RESEND_API_KEY` + `RESEND_FROM_EMAIL`; until then everything is dry-run/log-only                         | [`NEWSLETTER_AND_LEADS.md`](./NEWSLETTER_AND_LEADS.md)         |
| **Supabase persistence (server)**      | Set `SUPABASE_SERVICE_ROLE_KEY` + `STORAGE_BACKEND=supabase`; falls back to JSON files otherwise              | [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md)                     |
| **AdSense**                            | Set `AD_CONFIG.ADSENSE_PUBLISHER_ID` in `src/config/constants.js` (currently empty — no ad requests are made) | `src/config/constants.js`                                      |

## MCP (Model Context Protocol)

MCP lets agent tooling (Cursor, VS Code Copilot, Claude Code) reach services like Supabase and
GitHub through configured servers.

| File                       | Purpose                                                                                                                                | Committed?                        |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `.cursor/mcp.json`         | Cursor MCP config — Supabase http (read-only, `<SUPABASE_PROJECT_REF>` placeholder) + stdio (`${SUPABASE_ACCESS_TOKEN}` env reference) | Yes (placeholders only)           |
| `.vscode/mcp.example.json` | Template for a local `.vscode/mcp.json`                                                                                                | Yes                               |
| `.vscode/mcp.json`         | Your real local config                                                                                                                 | **No — gitignored, never commit** |

Rules (also in [`SECURITY.md`](./SECURITY.md) at the repo root and
[`environment-variables.md`](./environment-variables.md)):

1. Never hardcode PATs, service-role keys, or project refs with embedded credentials in MCP config.
2. Use env-var references (`${SUPABASE_ACCESS_TOKEN}`) or OAuth flows.
3. Prefer read-only MCP endpoints for exploration; write access only when a task requires it.
4. Claude Code sessions in this repo additionally get GitHub access through the built-in GitHub MCP
   server — no repo config needed.

## Adding a new integration — checklist

1. **Advisory check first** — no new dependency without an explicit ask + a GitHub advisory-database
   check (see `AGENTS.md` operational guardrails).
2. **Secrets**: names go in `.env.example` (placeholder only) and the tables in
   [`environment-variables.md`](./environment-variables.md); values go in GitHub Secrets.
3. **Fail safe**: default to dry-run/disabled when credentials are missing (pattern: Resend, Stripe,
   analytics mirror). Never let a missing key break a page or a workflow.
4. **Label honestly**: any data surfaced to users must carry source + freshness labels per
   [`freshness-contract.md`](./freshness-contract.md).
5. **Document**: add a row to the appropriate table above and, for provider/data integrations, an
   adapter entry in `scripts/python/gold_providers/registry.py` rather than a one-off fetcher.
6. **Server boundaries**: browser code must never import `server/**` (ESLint enforces this), and
   service-role keys never ship client-side.
