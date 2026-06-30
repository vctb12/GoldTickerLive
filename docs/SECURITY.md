# Security — Secret Scanning & Push Protection

This document covers how to enable GitHub secret scanning and push protection for this repository,
which secrets are in use (by name only — never by value), and what to do if push protection blocks a
commit.

---

## Enabling Secret Scanning and Push Protection

GitHub's secret scanning detects credential patterns in commits and alerts maintainers. Push
protection extends this by blocking a push _before_ it lands in history.

**Steps (repository owner / admin required):**

1. Go to the repository on GitHub.
2. Navigate to **Settings → Code security** (left sidebar, "Security" section).
3. Under **Secret scanning**, click **Enable**.
4. Underneath that, under **Push protection**, click **Enable**.

Official documentation: <https://docs.github.com/en/code-security/secret-scanning>

> **Note:** Dependabot (dependency vulnerability alerts) and CodeQL (static code analysis) are
> already enabled for this repository — see `.github/dependabot.yml` and
> `.github/workflows/codeql.yml`.

---

## Repository Secret Names

The table below lists every secret _name_ used by this repository. **No values appear here.** Full
descriptions and how to obtain each credential are in
[`docs/environment-variables.md`](./environment-variables.md).

### GitHub Actions Secrets (Settings → Secrets → Actions)

| Secret Name                 | Purpose                                       |
| --------------------------- | --------------------------------------------- |
| `GOLD_API_COM_KEY`          | Primary gold spot API key (gold-api.com)      |
| `GOLDPRICEZ_API_KEY`        | Legacy gold price API key (optional fallback) |
| `CONSUMER_KEY`              | X/Twitter OAuth 1.0a API Key                  |
| `CONSUMER_SECRET`           | X/Twitter OAuth 1.0a API Secret               |
| `ACCESS_TOKEN`              | X/Twitter Access Token (read-write)           |
| `ACCESS_TOKEN_SECRET`       | X/Twitter Access Token Secret                 |
| `SUPABASE_URL`              | Supabase project URL                          |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (bypasses RLS)      |
| `TELEGRAM_BOT_TOKEN`        | Telegram Bot API token                        |
| `TELEGRAM_CHANNEL_ID`       | Telegram channel/group ID                     |
| `DISCORD_WEBHOOK_URL`       | Discord webhook URL                           |
| `SUPABASE_MCP_TOKEN`        | Supabase MCP bearer token (optional/legacy)   |

### Local `.env` Secrets (never committed — use `.env.example` as template)

| Variable Name                 | Purpose                                      |
| ----------------------------- | -------------------------------------------- |
| `SUPABASE_ANON_KEY`           | Supabase public/anon API key                 |
| `SUPABASE_SERVICE_ROLE_KEY`   | Supabase service-role key (server-side only) |
| `JWT_SECRET`                  | Signs JWT admin tokens (32+ chars required)  |
| `ADMIN_PASSWORD`              | Admin panel password                         |
| `ADMIN_ACCESS_PIN`            | 6+ digit numeric PIN for admin login         |
| `API_KEY_HASH_SALT`           | PBKDF2 salt for API key hashing              |
| `ALERT_JOB_TOKEN`             | Shared secret for alert job endpoint         |
| `RESEND_API_KEY`              | Resend transactional email API key           |
| `STRIPE_SECRET_KEY`           | Stripe secret key                            |
| `STRIPE_WEBHOOK_SECRET`       | Stripe webhook signing secret                |
| `TWITTER_API_KEY`             | X App API Key (local env mapping)            |
| `TWITTER_API_SECRET`          | X App API Secret (local env mapping)         |
| `TWITTER_ACCESS_TOKEN`        | X Access Token (local env mapping)           |
| `TWITTER_ACCESS_TOKEN_SECRET` | X Access Token Secret (local env mapping)    |
| `METAL_SENTINEL_API_KEY`      | Metal Sentinel provider API key              |
| `FINNHUB_API_KEY`             | Finnhub provider API key                     |
| `FMP_API_KEY`                 | Financial Modeling Prep API key              |
| `GOLDAPI_IO_KEY`              | GoldAPI.io provider API key                  |
| `TWELVEDATA_API_KEY`          | Twelve Data provider API key                 |

---

## What to Do If Push Protection Blocks a Commit

Push protection halts the push and displays which pattern was detected and in which file.

**Steps to resolve:**

1. **Confirm it is a real secret.** Review the flagged file and line. If the value is a genuine
   credential, remove it immediately from the file (and from any other files in the diff).
2. **Rewrite git history if the secret was committed.** Use `git rebase -i` or `git filter-branch` /
   the BFG Repo Cleaner to purge the value from all commits. Then force-push the cleaned branch
   (coordinating with the team to avoid disruption).
3. **Rotate the compromised credential immediately.** Assume any secret that touched a git commit is
   compromised, even briefly. Revoke and reissue it through the relevant service dashboard before
   pushing a clean branch.
4. **If it is a false positive** (e.g., a test fixture, an example value, or a placeholder), you may
   use GitHub's bypass option:
   - On the push protection block page, select **"It's used in tests"** or **"It's a false
     positive"** and click **Allow secret**.
   - Only bypass for values that carry zero access — never bypass for real credentials.
5. **Update `.env.example`** to use clearly fake placeholder values (e.g., `your-secret-here`) so
   future contributors do not accidentally commit examples.

> **Rule:** If in doubt, treat it as a real secret, rotate it, and clean history. The cost of a
> false alarm is low; the cost of an exposed credential is not.

---

## General Hygiene Reminders

- `.env` is gitignored. Never commit it.
- `.env.example` contains variable **names** only — no real values.
- Supabase service-role key must never appear in browser-side code.
- GitHub Secrets is the only authorised location for production credentials.
- MCP config (`.cursor/mcp.json`, `.vscode/mcp.json`) uses environment variable references — never
  hardcoded tokens.

---

_See also: [`docs/environment-variables.md`](./environment-variables.md) for the full variable
registry with descriptions and where to obtain each value._
