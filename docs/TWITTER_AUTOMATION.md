# Twitter / X Automation — Setup Guide

Automated hourly gold price tweets via GitHub Actions.

---

## How it works

1. The workflow (`.github/workflows/gold-price-tweet.yml`) runs on a cron **every hour at :00**.
2. It executes `scripts/tweet-gold-price.js`, which:
   - Fetches the live XAU/USD spot from **gold-api.com**.
   - Picks a template based on the hour (Dubai time / UTC+4).
   - Signs the request with **OAuth 1.0a** and posts to the X API v2.

### Template rotation

| Dubai time       | Template used                 |
| ---------------- | ----------------------------- |
| 00:00            | Daily full karat breakdown    |
| 06:00            | Morning market-open edition   |
| 08:00            | Arabic edition (GCC audience) |
| 20:00            | Evening close / end-of-day    |
| 12:00 on Fri/Sat | Weekend wrap-up               |
| All other hours  | Compact hourly snapshot       |

---

## Step 1 — Get a Gold API key

1. Sign up at **https://gold-api.com** (free tier available).
2. Copy your API key from the dashboard.

---

## Step 2 — Create an X Developer account and app

1. Go to **https://developer.twitter.com** and apply for a developer account (select "Free" tier).
2. Create a project and app.
3. In the app settings, set **App permissions** to **Read and Write**.
4. Generate the following four credentials from the "Keys and tokens" tab:
   - **API Key** (also called Consumer Key)
   - **API Key Secret** (also called Consumer Secret)
   - **Access Token** — must be generated with _your own account_ to post as you
   - **Access Token Secret**

> ⚠️ Access Tokens generated under "Read and Write" permission are required. Tokens generated under
> "Read only" cannot post tweets.

---

## Step 3 — Add GitHub Secrets

In your repository on GitHub:

1. Go to **Settings → Secrets and variables → Actions**.
2. Add each of the following secrets:

| Secret name                   | Value                        |
| ----------------------------- | ---------------------------- |
| `GOLD_API_KEY`                | Your gold-api.com API key    |
| `TWITTER_API_KEY`             | X App API Key (Consumer Key) |
| `TWITTER_API_SECRET`          | X App API Key Secret         |
| `TWITTER_ACCESS_TOKEN`        | X Access Token (read-write)  |
| `TWITTER_ACCESS_TOKEN_SECRET` | X Access Token Secret        |

---

## Step 4 — Test the workflow

1. Go to **Actions → "Hourly Gold Price Tweet"** in your repository.
2. Click **"Run workflow"** → **"Run workflow"** to trigger it manually.
3. Check the logs — a successful run ends with:
   ```
   ✅ Tweet posted! https://twitter.com/i/web/status/...
   ```

---

## Customising templates

Templates are defined in two places:

| File                          | Purpose                                                                                                   |
| ----------------------------- | --------------------------------------------------------------------------------------------------------- |
| `scripts/tweet-gold-price.js` | **Automation** — self-contained templates used by the GitHub Action                                       |
| `social/postTemplates.js`     | **Manual generator** — templates used by the in-browser post generator at `/social/x-post-generator.html` |

Both sets share the same design language. If you change one, mirror the changes in the other.

### Available template IDs

| ID           | Description                                |
| ------------ | ------------------------------------------ |
| `hourly`     | Compact snapshot — spot price + AED karats |
| `daily`      | Full karat breakdown + day change          |
| `morning`    | Good-morning market open                   |
| `evening`    | End-of-day close recap                     |
| `arabic`     | Arabic language for GCC audience           |
| `investment` | Investment framing with 52-week context    |
| `milestone`  | For ATH or round-number events             |
| `weekend`    | Friday/Saturday weekly wrap                |
| `alert`      | Urgent post for big price moves            |
| `weekly`     | Week-in-review with high/low               |

---

## Troubleshooting

### "Missing environment variables"

Make sure all 5 secrets are added in GitHub Settings → Secrets → Actions.

### "HTTP 401 Unauthorized"

- Verify your Access Token has **Read + Write** permissions.
- Regenerate the Access Token and Secret in the X Developer Portal and update the GitHub secrets.

### "HTTP 403 Forbidden"

- You may be on the X Free tier which restricts posting to 17 tweets per 24 hours.
- Reduce frequency by changing `cron: '0 * * * *'` to e.g. `cron: '0 */3 * * *'` (every 3 hours).

### Tweet > 280 characters

The script warns but still attempts to post. Shorten the template in `buildTweetText()` inside
`scripts/tweet-gold-price.js`.

---

## Monetisation context

This automation is designed to drive traffic to **https://vctb12.github.io/Gold-Prices/** where
Google AdSense ads serve on the main pages. More frequent, relevant tweets → more organic clicks →
more ad impressions.

Recommended posting frequency by X plan:

| X Plan        | Safe posting rate                        |
| ------------- | ---------------------------------------- |
| Free          | Max 17/day → post every ~2 h             |
| Basic ($3/mo) | 100/month → hourly for ~4 days then slow |
| Pro / higher  | Hourly with no restriction               |
