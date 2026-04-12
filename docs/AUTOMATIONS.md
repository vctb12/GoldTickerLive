# GoldPrices — Automation Setup Guide

All automation runs via GitHub Actions and requires only GitHub Secrets — no paid hosting.

---

## Secrets required

Go to **Settings → Secrets and variables → Actions → New repository secret** for each:

| Secret | Used by | How to get it |
|---|---|---|
| `GOLD_API_KEY` | All price scripts | Sign up at https://gold-api.com |
| `TWITTER_API_KEY` | X/Twitter posts | X Developer Portal: API Key |
| `TWITTER_API_SECRET` | X/Twitter posts | X Developer Portal: API Key Secret |
| `TWITTER_ACCESS_TOKEN` | X/Twitter posts | X Developer Portal: Access Token (read-write) |
| `TWITTER_ACCESS_TOKEN_SECRET` | X/Twitter posts | X Developer Portal: Access Token Secret |
| `TELEGRAM_BOT_TOKEN` | Telegram posts & alerts | @BotFather on Telegram |
| `TELEGRAM_CHANNEL_ID` | Telegram posts & alerts | Channel username e.g. `@mygoldchannel` or numeric ID |
| `DISCORD_WEBHOOK_URL` | Discord posts & alerts | Discord channel → Integrations → Webhooks |

---

## Workflows

### 1. Hourly X/Twitter posts — `gold-price-tweet.yml`
Posts every hour. Rotates 10 templates by Dubai time.
- See `docs/TWITTER_AUTOMATION.md` for detailed setup.

### 2. Telegram posts — `gold-price-telegram.yml`
Posts at **07:00, 12:00, 18:00 UTC** (11:00, 16:00, 22:00 Dubai).
- Script: `scripts/notify-telegram.js`
- Secrets needed: `GOLD_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHANNEL_ID`

**Telegram setup:**
1. Open Telegram → search `@BotFather`
2. Send `/newbot` → follow steps → copy token
3. Create a channel/group, add your bot as admin
4. Get channel ID via `@userinfobot` or the [getUpdates API](https://core.telegram.org/bots/api#getupdates)
5. Add as GitHub Secrets

### 3. Discord posts — `gold-price-discord.yml`
Posts a rich embed daily at **08:00 UTC** (noon Dubai).
- Script: `scripts/notify-discord.js`
- Secrets needed: `GOLD_API_KEY`, `DISCORD_WEBHOOK_URL`

**Discord setup:**
1. In Discord server: Server Settings → Integrations → Webhooks → New Webhook
2. Pick channel → copy webhook URL
3. Add as `DISCORD_WEBHOOK_URL` GitHub Secret

### 4. Price spike alerts — `gold-price-spike.yml`
Checks every hour (`:30`). Fires to all configured channels when gold moves >2% from open.
- Script: `scripts/price-spike-alert.js`
- Threshold: change `SPIKE_THRESHOLD_PCT` secret (default `2.0`)
- Alerts: Telegram + Discord + X (all optional, uses whichever secrets are present)

### 5. Auto-sitemap + RSS on deploy — `deploy.yml`
Both `sitemap.xml` and `feed.xml` are regenerated on every deploy:
- `node scripts/generate-sitemap.js` — updates `sitemap.xml`
- `node scripts/generate-rss.js` — generates `feed.xml`
- Both are copied to `dist/` automatically

The RSS feed is live at: `https://vctb12.github.io/Gold-Prices/feed.xml`

### 6. Weekly dead-link checker — `weekly-link-check.yml`
Runs every **Monday at 06:00 UTC**. Builds the site and checks all internal links.
Fails the GitHub Action if broken links are found.

### 7. Uptime monitor — `uptime-monitor.yml`
Pings the site every **30 minutes**. Alerts via Telegram and/or Discord if site is down.
- Script: `scripts/uptime-check.js`

---

## Testing a workflow manually

1. Go to **Actions** tab in your repo
2. Select the workflow
3. Click **Run workflow** → **Run workflow**

This triggers it immediately without waiting for the cron schedule.

---

## Reducing X post frequency (Free tier)

X Free tier allows ~17 posts per 24 hours. To post every 2 hours instead of every hour,
change the cron in `gold-price-tweet.yml`:

```yaml
# Every 2 hours instead of every hour
- cron: '0 */2 * * *'
```

---

## Adding WhatsApp alerts

WhatsApp Business API is not free but can be added similarly:
1. Sign up for [Meta Cloud API](https://developers.facebook.com/docs/whatsapp/cloud-api)
2. Add `WHATSAPP_PHONE_ID` and `WHATSAPP_TOKEN` secrets
3. Create `scripts/notify-whatsapp.js` modelled after `notify-telegram.js`
4. Add a new workflow calling the script

---

## Email digest

Use [Resend](https://resend.com) (free: 100 emails/day):
1. Sign up → get API key
2. Add `RESEND_API_KEY` and `DIGEST_EMAIL_TO` secrets
3. Create `scripts/send-digest.js` using the Resend REST API
4. Schedule via GitHub Actions cron
