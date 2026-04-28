# Gold Ticker Live — Rebrand Verification Report

> Companion to [`GOLD_TICKER_LIVE_REBRAND_NOTES.md`](./GOLD_TICKER_LIVE_REBRAND_NOTES.md). This file
> is the **permanent post-migration QA log** that records each verification pass performed after the
> original rebrand merged. Append a new section for every fresh sweep.

The canonical brand is **Gold Ticker Live**. The compact form is **GTL**. The public domain is
**goldtickerlive.com**.

## Verification pass — 2026-04-28

Independent post-migration QA after the prior rebrand PR
(`copilot/rebrand-gold-prices-to-gold-ticker-live` → `main`). Goal: independently re-audit every
brand surface, catch anything missed, fix all incorrect leftovers, and confirm protected carve-outs
are still intentional.

### Method

Ran the full search matrix from
[`GOLD_TICKER_LIVE_AGENT_PROMPTS.md` Prompt 12](./GOLD_TICKER_LIVE_AGENT_PROMPTS.md) plus broader
case-insensitive sweeps:

```text
GoldPrices                   GoldTickerLive (one-word)
Gold Prices Platform         GoldPrices.app / GoldPrices.io
goldprices.{com,ae,io,…}     goldprices-v[0-9]+ (cache name)
Gold Price Tracker           Live Gold Tracker
goldprices_*                 utm_source=goldprices
site_name | SITE_NAME        application-name | apple-mobile-web-app-title
```

All file types in scope (HTML, JS, CSS, JSON, MD, XML, TXT, YML, SQL, Python, SVG). Excluded
`node_modules`, `dist`, `coverage`, `.git`. Generated SEO inventory under `reports/seo/` was checked
but is owner-regenerated on every build.

### Findings — Must fix (fixed in this pass)

| #   | File                                      | Lines         | Old leftover                                                                                                         | Fixed to                                                                                                                                                                          |
| --- | ----------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `assets/og-image.svg`                     | 27, 36        | Rendered `GoldPrices` brand text + `vctb12.github.io/Gold-Prices` sub-label inside the OG card                       | `Gold Ticker Live` (font-size adjusted to fit) + `goldtickerlive.com` sub-label                                                                                                   |
| 2   | `admin/social/index.html`                 | 1048          | Custom-post placeholder example with `track live at goldprices.ae`                                                   | `track live at goldtickerlive.com`                                                                                                                                                |
| 3   | `admin/social/index.html`                 | 1648          | Daily template `🥇 Gold Prices Today — ${dateStr}` (no brand prefix)                                                 | `🥇 Gold Ticker Live — Gold Prices Today, ${dateStr}` (matches `src/social/postTemplates.js` and `scripts/node/tweet-gold-price.js`)                                              |
| 4   | `admin/social/index.html`                 | 1714–1722     | 5 admin-visible post templates (DAILY EN/AR, PRICE_ALERT, WEEKLY_SUMMARY, MILESTONE) hard-coded `goldprices.ae` URLs | `goldtickerlive.com` + canonical paths (`/content/gold-price-history/`, `/tracker.html`, `/content/order-gold/`); EN daily now also carries the `Gold Ticker Live —` brand prefix |
| 5   | `content/order-gold/index.html`           | 325, 341, 357 | Affiliate `utm_source=goldprices` referral codes (visible in partner dashboards)                                     | `utm_source=goldtickerlive`                                                                                                                                                       |
| 6   | `content/order-gold/index.html`           | 846           | User-visible order-summary footer `goldprices.ae/order`                                                              | `goldtickerlive.com/content/order-gold/`                                                                                                                                          |
| 7   | `scripts/python/utils/tweet_formatter.py` | 20            | `SITE_URL = "goldprices.ae"` (interpolated into every Python-generated tweet)                                        | `SITE_URL = "goldtickerlive.com"`                                                                                                                                                 |
| 8   | `scripts/node/send-newsletter.js`         | 15            | Default `fromEmail` `newsletter@goldprices.com`                                                                      | `newsletter@goldtickerlive.com` (env override `RESEND_FROM_EMAIL` still wins)                                                                                                     |
| 9   | `server/routes/newsletter.js`             | 19            | Same default `fromEmail`                                                                                             | `newsletter@goldtickerlive.com`                                                                                                                                                   |
| 10  | `.github/workflows/daily-newsletter.yml`  | 43            | `SITE_URL: https://goldprices.com` (wrong domain — never owned)                                                      | `SITE_URL: https://goldtickerlive.com`                                                                                                                                            |
| 11  | `.github/workflows/weekly-newsletter.yml` | 43            | Same                                                                                                                 | Same                                                                                                                                                                              |
| 12  | `supabase/schema.sql`                     | 1             | Header `-- Gold Prices Platform — Supabase Schema`                                                                   | `-- Gold Ticker Live — Supabase Schema`                                                                                                                                           |
| 13  | `server.js`                               | 116           | CORS comment example `https://goldtickerlive.com,https://goldprices.com`                                             | `https://goldtickerlive.com,https://www.goldtickerlive.com`                                                                                                                       |
| 14  | `docs/MANUAL_INPUTS.md`                   | 77            | CNAME setup example uses `goldprices.ae`                                                                             | `goldtickerlive.com`                                                                                                                                                              |

### Findings — Intentional, verified, untouched

These were re-verified against the carve-out table in `GOLD_TICKER_LIVE_REBRAND_NOTES.md` and left
in place:

- **`@GoldTickerLive` X handle** — `index.html`, `src/config/translations.js`,
  `config/twitter_bot/tweet_templates.json`, `README.md`, all Python utility headers, Supabase
  schema comments. Owned account; do not rename casually.
- **`GoldTickerLive-UptimeMonitor/1.0`** in `scripts/node/uptime-check.js` and
  **`GoldTickerLive/1.0`** in `scripts/fetch_gold_price.py` — wire-format User-Agent tokens; spaces
  would break header conventions.
- **`BreadcrumbList "name": "Gold Prices"`** in 60+
  `countries/<country>/<city>/gold-prices/index.html` pages — describes the topic of the page, not
  the product.
- **Topic phrases** in copy ("Gold Prices Today" hero `<h1>`, "Live Gold Prices" section heads, "Why
  UAE Gold Prices Differ", "Live Gold Price Tracker" tracker `<h1>` and `<title>`) — these are
  subject-matter labels paired with the `| Gold Ticker Live` brand suffix, not brand replacements.
- **`countries/<country>/<city>/gold-prices/`** filesystem and URL paths — indexed SEO routes.
- **`vctb12.github.io/Gold-Prices/` and `github.com/vctb12/Gold-Prices`** in `README.md`,
  `docs/SEO_CHECKLIST.md`, `docs/AUTOMATIONS.md`, `docs/TWITTER_AUTOMATION.md`,
  `supabase/MASTERY.md`, `.github/copilot-instructions.md` — repo slug has not been renamed yet (see
  "Owner decision items" below).
- **`BASE_PATH = '/Gold-Prices/'` documentation comment** in `src/config/constants.js` — GitHub
  Pages project-path fallback documentation.
- **`localStorage` cache key prefixes** (`gold_price_*`, `goldprices_*`) — preserves returning
  users' cached prefs / alerts.
- **Service-worker history**: only the new `goldtickerlive-v15` is live in `sw.js`; prior
  `goldprices-v14` references survive in `reports/perf-baseline-2026-04-25.md` and
  `docs/PERFORMANCE.md` historical sample only.
- **Supabase `gold_prices` table name** — schema-migration territory.
- **Historical reports** in `reports/seo-audit.md` and `reports/perf-baseline-2026-04-25.md` —
  point-in-time records; rewriting would falsify the audit history.
- **`reports/seo/inventory.json`** — generated by `npm run validate` / build pipeline; not edited by
  hand.
- **`CHANGELOG.md` and git history** — historical record.
- **`docs/GOLD_TICKER_LIVE_REBRAND_NOTES.md` and `docs/GOLD_TICKER_LIVE_AGENT_PROMPTS.md`** — both
  contain `GoldPrices` / `GoldTickerLive` strings as part of describing what was renamed and what to
  grep for in future sweeps. Editing them would defeat their purpose.

### Findings — Owner decision (not auto-fixed)

These need a human call. They are **not** silent bugs; they are policy choices.

| Item                                        | Where                                                                                                                                                                                                                       | Why it needs the owner                                                                                                                                                                                                                                                                                             |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Repository slug `vctb12/Gold-Prices`        | GitHub repo name; replicated in README.md links, multiple docs, SEO checklist, Supabase MASTERY.md, copilot instructions title                                                                                              | The migration plan in `GOLD_TICKER_LIVE_REBRAND_NOTES.md` § "Manual GitHub steps" walks through the rename. Until the owner runs that, every doc reference must continue to point at the live slug.                                                                                                                |
| Seeded admin email `admin@goldprices.com`   | `server/lib/auth.js:37`, `server/data/users.json`, `server/data/audit-logs.json` (40+ entries), `server/data/shops-data.json` (10+ entries), `tests/auth.test.js`, `tests/shop-manager.test.js`, `docs/ARCHITECTURE.md:491` | Renaming requires (a) migrating the persisted user JSON without losing the bcrypt hash; (b) rewriting all `actor` / `createdBy` / `updatedBy` audit-log entries (rewriting history would break audit integrity); (c) updating tests; (d) communicating the new login email to the actual admin. Single owner call. |
| GA4 / AdSense / Search Console properties   | External                                                                                                                                                                                                                    | Per `GOLD_TICKER_LIVE_REBRAND_NOTES.md` § "Manual non-GitHub steps".                                                                                                                                                                                                                                               |
| Newsletter ESP / Formspree project labels   | External                                                                                                                                                                                                                    | Same.                                                                                                                                                                                                                                                                                                              |
| `docs/SEO_CHECKLIST.md` Search Console URLs | `docs/SEO_CHECKLIST.md` lines 12, 14, 21, 23, 73, 76–78                                                                                                                                                                     | Currently instructs the owner to register `vctb12.github.io/Gold-Prices/sitemap.xml`. The canonical sitemap is `https://goldtickerlive.com/sitemap.xml`. If the repo is also being renamed, this whole block should be re-written. Left for the owner to update in the same PR as the repo rename.                 |

### Verification commands

Run from repo root (Node 22, fresh `npm install`):

```bash
npm install
npm test
npm run lint
npm run validate
npm run build
```

Public-surface re-grep should be empty (only carve-outs):

```bash
git grep -nI 'GoldPrices'                          # must be empty outside reports/, docs/GOLD_TICKER_LIVE_*
git grep -nI 'GoldTickerLive' \
  | grep -v '@GoldTickerLive\|GoldTickerLive-Uptime\|GoldTickerLive/1\.0\|docs/GOLD_TICKER_LIVE_'
git grep -nI 'Gold Prices Platform'                # must be empty
git grep -nI 'goldprices\.\(com\|ae\|io\|app\)' \
  | grep -v 'admin@goldprices.com'                 # only seed-admin carve-out remains
```

### Hand-spot checks

- `manifest.json` `name` and `short_name` both read **Gold Ticker Live**.
- `sw.js` cache name is `goldtickerlive-v15`.
- Tracker `<title>` and OG card are
  `Live Gold Price Tracker — UAE, GCC & Arab World | Gold Ticker Live`.
- Homepage `<title>` is
  `Gold Ticker Live — Live Gold Prices Today for UAE, GCC & Arab World | أسعار الذهب`.
- Footer + nav brand label render `Gold Ticker Live`.
- OG image SVG (`assets/og-image.svg`) now renders `Gold Ticker Live` + `goldtickerlive.com`.

### How to re-run this pass

Paste **Prompt 12 — Rebrand Maintenance Prompt** from
[`GOLD_TICKER_LIVE_AGENT_PROMPTS.md`](./GOLD_TICKER_LIVE_AGENT_PROMPTS.md) into a fresh agent
session, then append a new dated section to this file. Append; do not rewrite — the audit history
matters.
