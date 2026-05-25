# Cursor Pro Handover — Gold Ticker Live

> Complete reference for onboarding Cursor (or any AI coding tool) to this repository. No actual
> secrets are stored here — only names, purposes, and where to obtain them.

---

## 1. Project Identity & Architecture

**Gold Ticker Live** is a bilingual (EN/AR) gold-price intelligence platform serving UAE, GCC, the
Arab world, and global reference pricing.

| Attribute       | Value                                                      |
| --------------- | ---------------------------------------------------------- |
| Repo            | `vctb12/GoldTickerLive` (legacy: `vctb12/Gold-Prices`)     |
| Production URL  | https://goldtickerlive.com/                                |
| Hosting         | GitHub Pages (static site) + optional Node/Express backend |
| Domain          | Custom domain via `CNAME` file                             |
| Language        | EN + AR (full RTL support)                                 |
| Node version    | 24 (see `.nvmrc`)                                          |
| Package manager | npm (lockfile committed)                                   |
| Build tool      | Vite 8                                                     |
| Backend         | Express 5 (JWT + bcrypt + Helmet + rate limiting)          |
| Database        | Supabase (Postgres + Auth + RLS)                           |
| Automation      | GitHub Actions (20 workflows) + Python scripts             |
| Social posting  | X/Twitter (hourly, production), Telegram, Discord          |
| PWA             | Service worker (`sw.js`) + `manifest.json`                 |

### Architecture Summary

```
Browser → Static HTML pages (GitHub Pages)
         ├── ES modules (src/pages/, src/components/, src/lib/)
         ├── Fetches from api.goldpricez.com (XAU/USD spot)
         ├── Fetches from open.er-api.com (FX rates)
         ├── localStorage cache + Service Worker
         └── Optional: /api/v1/* → Express backend → Supabase

GitHub Actions → Python scripts → X/Twitter posts (hourly)
              → Price fetch → data/gold_price.json (committed)
              → DB sync → Supabase
              → Alerts → Telegram, Discord, Email
```

---

## 2. Complete Secrets & Variables Registry

### 2A. GitHub Actions Secrets (Repository Settings → Secrets → Actions)

| Secret Name                 | Purpose                                  | Where to Get                                       | Status                                   |
| --------------------------- | ---------------------------------------- | -------------------------------------------------- | ---------------------------------------- |
| `GOLDPRICEZ_API_KEY`        | Gold price API key (api.goldpricez.com)  | https://goldpricez.com — sign up, dashboard        | **Active** — used by all price workflows |
| `CONSUMER_KEY`              | X/Twitter OAuth 1.0a API Key             | X Developer Portal → App → Keys and Tokens         | **Active** — hourly posting              |
| `CONSUMER_SECRET`           | X/Twitter OAuth 1.0a API Secret          | X Developer Portal → App → Keys and Tokens         | **Active** — hourly posting              |
| `ACCESS_TOKEN`              | X/Twitter Access Token (Read+Write)      | X Developer Portal → Generate                      | **Active** — hourly posting              |
| `ACCESS_TOKEN_SECRET`       | X/Twitter Access Token Secret            | X Developer Portal → Generate                      | **Active** — hourly posting              |
| `SUPABASE_URL`              | Supabase project URL                     | Supabase Dashboard → Settings → API → URL          | **Active** — DB sync, Python workflows   |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (bypasses RLS) | Supabase Dashboard → Settings → API → service_role | **Active** — server-side only            |
| `TELEGRAM_BOT_TOKEN`        | Telegram Bot API token                   | @BotFather on Telegram                             | **Active** — alerts                      |
| `TELEGRAM_CHANNEL_ID`       | Telegram channel/group ID                | Channel username or numeric ID                     | **Active** — alerts                      |
| `DISCORD_WEBHOOK_URL`       | Discord webhook URL                      | Discord channel → Integrations → Webhooks          | **Active** — alerts                      |
| `SUPABASE_MCP_TOKEN`        | Supabase MCP bearer token (optional)     | Supabase Dashboard → Account → Access Tokens       | Optional                                 |

> **Important:** Twitter workflow YAML maps these secrets to env vars named `TWITTER_API_KEY`,
> `TWITTER_API_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_TOKEN_SECRET` internally. The GitHub
> secret names do NOT have the `TWITTER_` prefix.

### 2B. Local `.env` Variables (copy from `.env.example`)

#### Required for server startup / `npm test`

| Variable           | Purpose                            | Default      |
| ------------------ | ---------------------------------- | ------------ |
| `JWT_SECRET`       | Signs JWT admin tokens (32+ chars) | — (required) |
| `ADMIN_PASSWORD`   | Admin panel password               | — (required) |
| `ADMIN_ACCESS_PIN` | 6+ digit PIN gating admin login    | — (required) |

#### Gold Price Providers

| Variable                     | Purpose                           | Default                                                                          |
| ---------------------------- | --------------------------------- | -------------------------------------------------------------------------------- |
| `GOLD_PROVIDER_ORDER`        | Comma-separated provider priority | `metal_sentinel,finnhub_oanda,fmp_gcusd,goldapi_io,twelvedata_xauusd,goldpricez` |
| `AED_PEG`                    | USD→AED conversion rate           | `3.6725`                                                                         |
| `MAX_GOLD_FRESHNESS_SECONDS` | Max age before data is stale      | `900`                                                                            |
| `MIN_VALID_XAU_USD`          | Sanity floor for XAU/USD          | `500`                                                                            |
| `MAX_VALID_XAU_USD`          | Sanity ceiling for XAU/USD        | `10000`                                                                          |
| `GOLDPRICEZ_ENABLED`         | Enable GoldPriceZ provider        | `true`                                                                           |
| `GOLDPRICEZ_API_KEY`         | API key for goldpricez.com        | —                                                                                |
| `METAL_SENTINEL_ENABLED`     | Enable Metal Sentinel             | `false`                                                                          |
| `METAL_SENTINEL_API_KEY`     | API key                           | —                                                                                |
| `FINNHUB_ENABLED`            | Enable Finnhub                    | `false`                                                                          |
| `FINNHUB_API_KEY`            | API key                           | —                                                                                |
| `FMP_ENABLED`                | Enable Financial Modeling Prep    | `false`                                                                          |
| `FMP_API_KEY`                | API key                           | —                                                                                |
| `GOLDAPI_IO_ENABLED`         | Enable GoldAPI.io                 | `false`                                                                          |
| `GOLDAPI_IO_KEY`             | API key                           | —                                                                                |
| `TWELVEDATA_ENABLED`         | Enable Twelve Data                | `false`                                                                          |
| `TWELVEDATA_API_KEY`         | API key                           | —                                                                                |
| `GOLD_API_COM_ENABLED`       | Enable gold-api.com (legacy)      | `false`                                                                          |
| `GOLD_API_COM_KEY`           | API key                           | —                                                                                |

#### X/Twitter Posting

| Variable                      | Purpose                      | Default |
| ----------------------------- | ---------------------------- | ------- |
| `TWITTER_API_KEY`             | X App API Key                | —       |
| `TWITTER_API_SECRET`          | X App API Secret             | —       |
| `TWITTER_ACCESS_TOKEN`        | X Access Token               | —       |
| `TWITTER_ACCESS_TOKEN_SECRET` | X Access Token Secret        | —       |
| `SKIP_DUPLICATE_TWEETS`       | Prevent duplicate posts      | `true`  |
| `ALLOW_STALE_TWEET`           | Allow posting stale data     | `false` |
| `DRY_RUN_TWEET`               | Skip real X API call         | `false` |
| `MIN_TWEET_MOVE_USD`          | Min USD move to trigger post | `1.00`  |
| `MIN_TWEET_MOVE_PCT`          | Min % move to trigger post   | `0.03`  |
| `FORCE_SUMMARY_AFTER_MINUTES` | Force post after N minutes   | `60`    |

#### Supabase

| Variable                    | Purpose                             | Default |
| --------------------------- | ----------------------------------- | ------- |
| `SUPABASE_URL`              | Project URL                         | —       |
| `SUPABASE_ANON_KEY`         | Public/anon key (safe client-side)  | —       |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key (server-side ONLY) | —       |
| `STORAGE_BACKEND`           | `file` or `supabase`                | `file`  |

#### Express Server

| Variable       | Purpose                                | Default                 |
| -------------- | -------------------------------------- | ----------------------- |
| `NODE_ENV`     | Environment mode                       | `development`           |
| `PORT`         | Server port                            | `3000`                  |
| `SITE_URL`     | Base URL                               | `http://localhost:3000` |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | —                       |

#### Newsletter / Email (Resend)

| Variable             | Purpose                       | Default |
| -------------------- | ----------------------------- | ------- |
| `RESEND_API_KEY`     | Resend email API key          | —       |
| `RESEND_FROM_EMAIL`  | Sender email address          | —       |
| `NEWSLETTER_DRY_RUN` | Log emails instead of sending | `true`  |

#### Alerts v1

| Variable                   | Purpose                               | Default |
| -------------------------- | ------------------------------------- | ------- |
| `ALERT_EMAIL_DRY_RUN`      | Force dry-run mode                    | `true`  |
| `ALERTS_EXPOSE_DEV_TOKENS` | Expose verification tokens (dev only) | `true`  |
| `ALERT_JOB_TOKEN`          | Shared secret for alert job endpoint  | —       |

#### Stripe (Billing)

| Variable                   | Purpose                       | Default |
| -------------------------- | ----------------------------- | ------- |
| `STRIPE_PUBLISHABLE_KEY`   | Stripe public key             | —       |
| `STRIPE_SECRET_KEY`        | Stripe secret key             | —       |
| `STRIPE_WEBHOOK_SECRET`    | Stripe webhook signing secret | —       |
| `STRIPE_PRICE_PRO_MONTHLY` | Pro plan monthly price ID     | —       |
| `STRIPE_PRICE_API_MONTHLY` | API plan monthly price ID     | —       |
| `STRIPE_PRICE_PRO_YEARLY`  | Pro plan yearly price ID      | —       |
| `STRIPE_PRICE_API_YEARLY`  | API plan yearly price ID      | —       |
| `STRIPE_TRIAL_DAYS`        | Free trial duration           | `7`     |

### 2C. MCP Configuration

- **File:** `.cursor/mcp.json` (for Cursor) or `.vscode/mcp.json` (for VS Code/Copilot)
- **Template:** `.vscode/mcp.example.json` / `.cursor/mcp.json`
- **Replace:** `<SUPABASE_PROJECT_REF>` with your Supabase project reference ID
- **Access token:** Set `SUPABASE_ACCESS_TOKEN` in your shell environment
- **Manage tokens:** Supabase Dashboard → Account → Access Tokens

---

## 3. Development Setup

```bash
# 1. Clone
git clone https://github.com/vctb12/GoldTickerLive.git
cd GoldTickerLive

# 2. Node version (uses .nvmrc)
nvm use   # or ensure Node 24+

# 3. Install dependencies
npm install

# 4. Set required env vars (minimum for npm test to pass)
export JWT_SECRET="any-random-string-32-chars-or-more"
export ADMIN_PASSWORD="any-password"
export ADMIN_ACCESS_PIN="123456"

# 5. Copy env template for full development
cp .env.example .env
# Edit .env with your actual API keys

# 6. Run dev server
npm run dev

# 7. Run tests
rm -rf playwright-report/ test-results/   # avoid false positives
npm test

# 8. Run full validation
npm run validate

# 9. Build for production
npm run build

# 10. Preview production build
npm run preview

# 11. Start Express backend (separate from Vite)
npm start
```

---

## 4. Build / Test / Deploy Commands

### Primary Commands

| Command            | Purpose                        | When to use           |
| ------------------ | ------------------------------ | --------------------- |
| `npm run dev`      | Vite dev server with HMR       | Active development    |
| `npm run build`    | Full production build pipeline | Before deploy/preview |
| `npm run preview`  | Preview production bundle      | Verify build output   |
| `npm start`        | Express backend on :3000       | Backend development   |
| `npm test`         | All test suites (node:test)    | Every PR              |
| `npm run lint`     | ESLint (flat config)           | Every PR              |
| `npm run validate` | Full build integrity check     | Every PR              |
| `npm run quality`  | lint + prettier + stylelint    | Full code quality     |

### Validation Sub-Commands

| Command                        | Purpose                             |
| ------------------------------ | ----------------------------------- |
| `npm run check-unsafe-dom`     | DOM safety baseline enforcement     |
| `npm run check-freshness`      | Audit freshness metadata on pages   |
| `npm run check-shell-guard`    | Shared-shell constraint enforcement |
| `npm run seo:governance`       | SEO noindex policy check            |
| `npm run seo:governance:check` | Non-modifying governance audit      |
| `npm run analytics:inventory`  | Analytics event inventory           |

### Build Pipeline (what `npm run build` does)

1. `node scripts/node/extract-baseline.js` — Extract DOM-safety baseline
2. `node scripts/node/normalize-shops.js` — Normalize shops data
3. `node scripts/node/inject-schema.js` — Inject JSON-LD schema
4. `node build/generateSitemap.js` — Generate sitemap.xml
5. `vite build` — Bundle to `dist/`

### Other Useful Commands

| Command                   | Purpose                   |
| ------------------------- | ------------------------- |
| `npm run format`          | Prettier format all files |
| `npm run style`           | Stylelint CSS check       |
| `npm run seo-audit`       | Full SEO audit            |
| `npm run image-audit`     | Image optimization audit  |
| `npm run check-links`     | Internal link checker     |
| `npm run test:playwright` | E2E tests (Playwright)    |
| `npm run pre-deploy`      | Pre-deployment checks     |
| `npm run security`        | npm audit + outdated      |

---

## 5. GitHub Actions Inventory

### Production-Critical (breakage = public impact)

| Workflow               | Schedule                         | Purpose                        |
| ---------------------- | -------------------------------- | ------------------------------ |
| `post_gold.yml`        | Hourly (:09) during market hours | Post gold price to X/Twitter   |
| `gold-price-fetch.yml` | Hourly (:02) during market hours | Fetch & commit gold price      |
| `deploy.yml`           | On push to `main`                | Build & deploy to GitHub Pages |

### CI / Quality Gates

| Workflow                | Trigger                    | Purpose                  |
| ----------------------- | -------------------------- | ------------------------ |
| `ci.yml`                | Pull requests              | Tests, validation, build |
| `codeql.yml`            | Push + PR + weekly         | CodeQL security scanning |
| `pr-provider-smoke.yml` | PRs touching provider code | Smoke test providers     |

### Monitoring & Alerts

| Workflow             | Schedule     | Purpose                          |
| -------------------- | ------------ | -------------------------------- |
| `health_check.yml`   | Periodic     | Site + API health check          |
| `uptime-monitor.yml` | Every 30 min | Ping site, alert if down         |
| `spike_alert.yml`    | Hourly (:30) | Alert on >2% price spike         |
| `check-alerts.yml`   | Periodic     | Process user alert subscriptions |

### Data & Sync

| Workflow                     | Purpose                               |
| ---------------------------- | ------------------------------------- |
| `sync-db-to-git.yml`         | Sync Supabase shops → `data/shops.js` |
| `gold-provider-bakeoff.yml`  | Multi-hour provider comparison        |
| `gold-bakeoff-readiness.yml` | Bakeoff pre-merge gate                |
| `test-gold-providers.yml`    | Manual one-round provider test        |

### Content & Reporting

| Workflow                         | Purpose                      |
| -------------------------------- | ---------------------------- |
| `daily-newsletter.yml`           | Daily newsletter generation  |
| `weekly-newsletter.yml`          | Weekly newsletter generation |
| `lighthouse.yml`                 | Lighthouse performance audit |
| `perf-check.yml`                 | Performance regression check |
| `phase0-lighthouse-baseline.yml` | Baseline Lighthouse capture  |

---

## 6. AI Agent System Map

This repo has a full AI-agent operating system. Cursor can reference these files for domain-specific
tasks:

### Always-On Context (read every session)

- `AGENTS.md` — Canonical cross-agent charter
- `.cursorrules` — Cursor-specific fast-onboarding (this project)
- `CLAUDE.md` — Claude Code specific mechanics

### Path-Scoped Instructions (`.github/instructions/`)

| File                                    | Applies to                                        |
| --------------------------------------- | ------------------------------------------------- |
| `accessibility.instructions.md`         | `**/*.html`, `styles/**/*.css`, `src/**/*.js`     |
| `backend-supabase.instructions.md`      | `server/**`, `supabase/**`, `admin/**`            |
| `content-country-pages.instructions.md` | `countries/**`, `content/**`, `learn.html`        |
| `docs.instructions.md`                  | `docs/**`                                         |
| `frontend-mobile.instructions.md`       | `**/*.html`, `src/**/*.js`, `styles/**/*.css`     |
| `github-actions.instructions.md`        | `.github/workflows/**`, `scripts/**`              |
| `gold-pricing.instructions.md`          | `src/**`, `scripts/**`, `data/**`, `tracker.html` |
| `pwa-service-worker.instructions.md`    | `sw.js`, `manifest.*`, `vite.config.*`            |
| `security.instructions.md`              | `server/**`, `.github/workflows/**`, `.env*`      |
| `seo.instructions.md`                   | `index.html`, `countries/**`, `robots.txt`        |
| `testing-qa.instructions.md`            | `tests/**`, `.github/workflows/**`, `scripts/**`  |

### Skills (`.github/skills/`)

Multi-step task workflows with checklists:

- `backend-admin-supabase` — Backend/admin/DB tasks
- `frontend-design-system` — Design tokens, CSS, UI patterns
- `github-actions-debug` — CI/workflow debugging
- `gold-ticker-live-audit` — Broad site audit
- `mobile-ux-review` — Mobile/responsive review
- `pricing-data-integrity` — Pricing formula/provider checks
- `security-review` — Security audit
- `seo-governance` — SEO/sitemap/canonical checks

### Prompts (`.github/prompts/`)

Paste-ready task starters:

- `accessibility-audit.prompt.md`
- `backend-admin-supabase.prompt.md`
- `country-pages-expansion.prompt.md`
- `mobile-ux-audit.prompt.md`
- `pr-review.prompt.md`
- `pricing-data-audit.prompt.md`
- `provider-bakeoff.prompt.md`
- `release-readiness.prompt.md`
- `seo-noindex-governance.prompt.md`
- `shops-data-honesty.prompt.md`
- `tracker-flagship-revamp.prompt.md`
- `workflow-debug.prompt.md`
- `x-twitter-automation-review.prompt.md`

### Key Docs for AI Agents

- `docs/AI_AGENT_OPERATING_SYSTEM.md` — Master map
- `docs/AI_PROMPT_LIBRARY.md` — Pick a prompt
- `docs/AGENT_SKILL_LIBRARY.md` — Pick a skill
- `docs/AI_AGENT_REVIEW_CHECKLISTS.md` — Review checklists
- `docs/AI_RELEASE_READINESS_PLAYBOOK.md` — Ship gate

---

## 7. Key Conventions

### JavaScript

- Vanilla ES modules, no frameworks
- `camelCase` naming
- Narrow, focused modules under `src/lib/`
- Safe DOM: use `src/lib/safe-dom.js` helpers (`escape`, `safeHref`, `safeTel`, `el`, `clear`)
- Prefer `node.replaceChildren()` over `node.innerHTML = ''`

### CSS

- Canonical design tokens in `styles/global.css`
- Token families: `--color-*`, `--surface-*`, `--space-*`, `--text-*`, `--radius-*`, `--shadow-*`,
  `--ease-*`, `--duration-*`
- Never hand-pick hex or raw rem where a token exists
- Mobile-first, premium dark/gold financial dashboard identity
- Touch targets ≥ 44×44 px
- `prefers-reduced-motion: reduce` respected globally

### Translations

- All UI text in `src/config/translations.js`
- EN + AR parity enforced by tests
- Numbers use locale-aware formatters (`src/lib/formatter.js`)

### Python

- Scripts in `scripts/python/`
- Add `scripts/python/` to `sys.path` in entrypoints
- Relative-import `utils.*` via that path
- Provider registry: `scripts/python/gold_providers/registry.py`

### Git / PR Workflow

- PR-only to `main` (protected branch)
- No force-push
- PR body format: What / Why / How / Proof / Risks
- Plan files: `docs/plans/YYYY-MM-DD_<slug>.md`

---

## 8. Production Services

| Service                | Purpose               | Dashboard                      |
| ---------------------- | --------------------- | ------------------------------ |
| **GitHub Pages**       | Static site hosting   | Repo → Settings → Pages        |
| **GitHub Actions**     | CI/CD + automation    | Repo → Actions                 |
| **Supabase**           | Database + Auth + RLS | https://supabase.com/dashboard |
| **X Developer Portal** | Twitter/X API access  | https://developer.twitter.com  |
| **GoldPriceZ**         | Gold spot price API   | https://goldpricez.com         |
| **Telegram**           | Bot alerts            | @BotFather                     |
| **Discord**            | Webhook alerts        | Server Settings → Integrations |
| **Resend**             | Transactional email   | https://resend.com             |
| **Stripe**             | Billing (optional)    | https://dashboard.stripe.com   |
| **Google Analytics**   | Site analytics (GA4)  | https://analytics.google.com   |

### Domain Configuration

- **Canonical domain:** `goldtickerlive.com`
- **CNAME file:** Points GitHub Pages to the custom domain
- **Legacy path:** `/Gold-Prices/` — redirect surface, don't duplicate

---

## 9. Known State (as of 2026-05)

### Test Baseline

- `npm run lint` — ✅ passes
- `npm run validate` — ✅ passes
- `npm run build` — ✅ passes
- `npm test` — 744/745 passing (1 pre-existing failure in `tests/analytics.test.js` — navigator
  getter TypeError, not blocking)

### Active Gold Price Provider

- **Production:** GoldPriceZ (via `gold-price-fetch.yml`)
- **Bakeoff candidates:** Metal Sentinel, Finnhub, FMP, GoldAPI.io, Twelve Data
- **Provider order configured in:** `gold-price-fetch.yml` and `.env.example`

### Client Polling

- Home + Tracker: 5s active / 20s hidden cadence (from `src/lib/realtime-config.js`)
- Server-side fetch: Hourly at :02 via GitHub Actions

### Freshness Labels (canonical vocabulary)

- `live` / `delayed` / `cached` / `stale` / `fallback` / `closed` / `unavailable`
- Arabic: مباشر / متأخر قليلاً / مخزن مؤقتاً / قديم / بديل احتياطي / مغلق / غير متاح

---

## 10. File Map (directory ownership)

```
GoldTickerLive/
├── .cursor/              → Cursor MCP config
├── .github/
│   ├── instructions/     → Path-scoped AI instructions (11 files)
│   ├── prompts/          → Paste-ready AI task prompts (14 files)
│   ├── skills/           → Multi-step AI skill workflows (8 skills)
│   ├── agents/           → Specialist agent definitions
│   └── workflows/        → GitHub Actions (20 workflows)
├── admin/                → Admin panel (Supabase OAuth)
├── assets/               → Static assets (images, icons)
├── build/                → Build scripts (generateSitemap.js)
├── config/               → App configuration files
├── content/              → Guide/tool/social pages
├── countries/            → Generated country/city/karat pages
├── data/                 → Runtime state (gold_price.json, shops, tweets)
├── docs/                 → All documentation (40+ files)
│   ├── plans/            → Proposal intake (YYYY-MM-DD_slug.md)
│   └── audits/           → Audit reports
├── reports/              → Generated reports (SEO inventory, etc.)
├── scripts/
│   ├── node/             → Build/validation/audit scripts
│   └── python/           → Automation (poster, providers, bakeoff)
├── server/               → Express backend
│   ├── lib/              → Auth, API key, utilities
│   ├── middleware/       → Rate limiting, etc.
│   ├── repositories/     → Data access layer
│   └── routes/           → API routes (v1, admin, developer)
├── src/
│   ├── components/       → Shared UI (nav, footer, ticker, chart)
│   ├── config/           → Constants, countries, karats, translations
│   ├── lib/              → Core utilities (api, cache, formatter, safe-dom)
│   ├── pages/            → Page entry scripts (home, tracker-pro, etc.)
│   ├── search/           → Search functionality
│   └── tracker/          → Tracker modules (modes, ui-shell, etc.)
├── styles/
│   ├── global.css        → Design tokens + primitives
│   └── pages/            → Page-specific CSS
├── supabase/             → Schema, seeds, verification SQL
├── tests/                → node:test suites (745 tests)
├── .cursorrules          → Cursor AI instructions (this project)
├── .env.example          → Environment variable template
├── AGENTS.md             → Canonical cross-agent charter
├── CLAUDE.md             → Claude Code specific notes
├── CNAME                 → Custom domain for GitHub Pages
├── package.json          → Dependencies + scripts
├── vite.config.js        → Vite build configuration
├── server.js             → Express app entry point
├── sw.js                 → Service worker
└── robots.txt            → Search engine directives
```

---

## 11. Quick Reference: What to Tell Cursor

When starting a new Cursor session on this project, use these @-mentions for context:

- **General work:** `@AGENTS.md` + `@.cursorrules`
- **Pricing/tracker:** `@.github/instructions/gold-pricing.instructions.md`
- **Frontend/mobile:** `@.github/instructions/frontend-mobile.instructions.md`
- **Backend/Supabase:** `@.github/instructions/backend-supabase.instructions.md`
- **CI/Actions:** `@.github/instructions/github-actions.instructions.md`
- **SEO:** `@.github/instructions/seo.instructions.md`
- **Security:** `@.github/instructions/security.instructions.md`
- **Full handover:** `@docs/CURSOR_HANDOVER.md`

---

## 12. Security Reminders

- **This is a PUBLIC repo.** Never commit real secrets.
- `.env.example` has variable **names only** — never real values.
- `.env` is gitignored. Your local secrets stay local.
- Supabase service-role key: server-side only, never in browser code.
- GitHub Secrets: the only place production credentials live.
- Admin auth: JWT + bcrypt + Helmet + rate limiting (don't bypass).
- MCP config (`.cursor/mcp.json`): uses env var references, not hardcoded tokens.

---

## 13. Migrating from Copilot to Cursor

### What carries over automatically

- `AGENTS.md` — Cursor reads this via the AGENTS.md convention
- `.cursorrules` — Cursor's native instruction file (created for this handover)
- `.cursor/mcp.json` — MCP server configuration
- All `.github/instructions/` — reference these with @-mentions in Cursor
- All documentation in `docs/` — reference as needed

### What you need to set up in Cursor

1. **MCP servers:** Edit `.cursor/mcp.json` — replace `<SUPABASE_PROJECT_REF>` with your actual
   project ref. Set `SUPABASE_ACCESS_TOKEN` in your environment.
2. **Rules:** `.cursorrules` is auto-loaded by Cursor at project root.
3. **Context:** For complex tasks, @-mention the relevant instruction files or `AGENTS.md`.
4. **Composer:** For multi-file changes, reference the Autonomy Contract (AGENTS.md §4).

### What stays in GitHub (not in Cursor)

- All secrets remain in GitHub Actions Secrets
- Local dev secrets remain in your `.env` file (gitignored)
- CI/CD workflows continue running via GitHub Actions
- Deploy remains via GitHub Pages

---

_Last updated: 2026-05-25_
