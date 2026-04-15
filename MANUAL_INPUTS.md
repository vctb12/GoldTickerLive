# MANUAL_INPUTS.md

Things the repo owner must fill in before the site is fully operational.
Each item says what it is, where to get it, which file to edit, and what breaks without it.

---

## 1. GOLD_API_KEY — REQUIRED (~5 min)

- **What:** API key for fetching live gold spot prices in server-side scripts (tweet bots, alerts).
- **Where to get it:** Sign up at https://gold-api.com — the free tier gives 500 requests/month.
- **Where to set it:** Add as a GitHub repository secret: Settings → Secrets → Actions → `GOLD_API_KEY`.
- **What breaks without it:** The automated Twitter/Telegram/Discord posting scripts will fail to fetch prices. The client-side homepage uses the public endpoint and does not need this key.

## 2. ADSENSE_PUBLISHER_ID and AD_SLOTS — OPTIONAL (~30 min after approval)

- **What:** Your Google AdSense publisher ID and individual ad unit slot IDs.
- **Where to get it:** Apply at https://adsense.google.com — approval can take days/weeks.
- **Where to set it:** Edit `src/config/constants.js`, find the `AD_CONFIG` object near the top. Set `ADSENSE_PUBLISHER_ID` to your publisher ID (e.g. `ca-pub-1234567890`) and fill in each key in `AD_SLOTS` with the corresponding ad unit ID from your AdSense dashboard.
- **What breaks without it:** Nothing breaks — all ad slots silently render nothing when the publisher ID is empty.

## 3. FORMSPREE_ENDPOINT — OPTIONAL (~5 min)

- **What:** Endpoint URL for the newsletter signup form in the site footer.
- **Where to get it:** Sign up at https://formspree.io, create a new form, copy the endpoint URL.
- **Where to set it:** Edit `src/config/constants.js`, find the `FORMSPREE_ENDPOINT` line near the bottom and paste your endpoint URL (e.g. `https://formspree.io/f/xyzabc`).
- **What breaks without it:** The newsletter signup form will not appear in the footer. No errors.

## 4. Twitter/X API Credentials — REQUIRED for social posting (~15 min)

- **What:** API keys for posting gold price updates to X/Twitter.
- **Where to get it:** Apply at https://developer.twitter.com for a developer account. Create an app with read-write permissions. Get your Consumer Key, Consumer Secret, Access Token, and Access Token Secret.
- **Where to set it:** Add these as GitHub repository secrets:
  - `CONSUMER_KEY` — your API Key (Consumer Key)
  - `CONSUMER_SECRET` — your API Key Secret
  - `ACCESS_TOKEN` — your Access Token
  - `ACCESS_TOKEN_SECRET` — your Access Token Secret
- **What breaks without it:** The hourly gold price tweets and spike alerts to X/Twitter will not work.

## 5. TELEGRAM_BOT_TOKEN and TELEGRAM_CHANNEL_ID — OPTIONAL (~10 min)

- **What:** Telegram bot credentials for posting gold price updates to a Telegram channel.
- **Where to get it:** Open Telegram, search for @BotFather, send `/newbot`, follow the steps. Create a channel, add the bot as admin, get the channel ID.
- **Where to set it:** Add as GitHub secrets: `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHANNEL_ID`.
- **What breaks without it:** Telegram notifications will not be sent. Everything else works fine.

## 6. DISCORD_WEBHOOK_URL — OPTIONAL (~5 min)

- **What:** Discord webhook URL for posting gold prices to a Discord channel.
- **Where to get it:** In your Discord server: Server Settings → Integrations → Webhooks → New Webhook → Copy URL.
- **Where to set it:** Add as GitHub secret: `DISCORD_WEBHOOK_URL`.
- **What breaks without it:** Discord notifications will not be sent.

## 7. Google Analytics GA4 Measurement ID — ALREADY SET

- **What:** GA4 tracking ID. Currently set to `G-M14N2GP8ZQ` in all HTML pages.
- **Where to change it:** If you need a different measurement ID, search-and-replace `G-M14N2GP8ZQ` across all HTML files.
- **What breaks without it:** Analytics tracking stops.

## 8. Custom Domain CNAME — OPTIONAL (~10 min)

- **What:** A custom domain name instead of `vctb12.github.io/Gold-Prices/`.
- **Where to get it:** Purchase a domain, then configure DNS to point to GitHub Pages.
- **Where to set it:** Create a file called `CNAME` in the repo root containing your domain (e.g. `goldprices.ae`). Then in your domain registrar, add a CNAME record pointing to `vctb12.github.io`.
- **What breaks without it:** The site continues to work on the GitHub Pages URL.

## 9. Deactivate Duplicate Twitter Bot System — REQUIRED (~2 min)

- **What:** Two Twitter posting systems exist and will cause duplicate tweets if both are active.
- **Recommendation:** Keep the Python system (more capable). Disable the Node.js system.
- **How to do it:** Go to GitHub → Actions tab → find `gold-price-tweet.yml` → click the `…` menu → Disable workflow.
- **What breaks without it:** You'll get duplicate tweets every hour.

## 10. Affiliate Partner Links — OPTIONAL (time varies)

- **What:** Affiliate links for UAE gold brokers or ETF platforms.
- **Where to set them:** Search for `AFFILIATE_PLACEHOLDER` in `invest.html` and `content/guides/buying-guide.html`. Replace the comment with your actual affiliate link HTML.
- **What breaks without it:** The affiliate disclosure section shows but has no active links.

## 11. node_modules Tracked in Git — REQUIRED ONE-TIME FIX (~2 min)

- **What:** The `node_modules/` directory is currently tracked in the git repository. This adds unnecessary size.
- **How to fix:** Run these commands in your local clone:
  ```
  git rm -r --cached node_modules
  git commit -m "Remove tracked node_modules"
  git push
  ```
- **What breaks without it:** The repo is bloated but still works.

## 12. Dead JS Files — OPTIONAL CLEANUP

- **What:** The following JS files in `src/` are not imported by any active code and can be safely deleted:
  - `src/routes/routeRegistry.js`
  - `src/seo/metadataGenerator.js`
  - `src/lib/search.js`
  - `src/search/searchIndex.js`
- **How to fix:** Delete each file and commit.
- **What breaks without it:** Nothing — these are unused code.
