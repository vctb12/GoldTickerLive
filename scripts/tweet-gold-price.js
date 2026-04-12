#!/usr/bin/env node
/**
 * scripts/tweet-gold-price.js
 *
 * Fetches the live XAU/USD spot price from gold-api.com and posts a
 * formatted tweet via the X / Twitter API v2.
 *
 * Runs from .github/workflows/gold-price-tweet.yml on a hourly schedule.
 *
 * Required GitHub Secrets (set in Settings → Secrets → Actions):
 *   GOLD_API_KEY                – api.gold-api.com key
 *   TWITTER_API_KEY             – X Developer Portal: API Key (Consumer Key)
 *   TWITTER_API_SECRET          – X Developer Portal: API Key Secret
 *   TWITTER_ACCESS_TOKEN        – X Developer Portal: Access Token (read-write)
 *   TWITTER_ACCESS_TOKEN_SECRET – X Developer Portal: Access Token Secret
 *
 * The script rotates across 7 distinct templates depending on the hour (UTC+4 Dubai):
 *   06:00 → morning     12:00 → midday (hourly)    20:00 → evening
 *   08:00 → arabic      00:00 → daily              Fri/Sat → weekend
 *   Other hours → hourly snapshot
 *
 * See docs/TWITTER_AUTOMATION.md for full setup instructions.
 */

'use strict';

const https  = require('https');
const crypto = require('crypto');
const url    = require('url');

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const SITE_URL     = 'https://vctb12.github.io/Gold-Prices/';
const GOLD_API_URL = 'https://api.gold-api.com/price/XAU';
const TWEET_URL    = 'https://api.twitter.com/2/tweets';
const AED_PEG      = 3.6725;
const TROY_OZ      = 31.1035;

// Credentials from environment
const GOLD_API_KEY               = process.env.GOLD_API_KEY               || '';
const TWITTER_API_KEY            = process.env.TWITTER_API_KEY            || '';
const TWITTER_API_SECRET         = process.env.TWITTER_API_SECRET         || '';
const TWITTER_ACCESS_TOKEN       = process.env.TWITTER_ACCESS_TOKEN       || '';
const TWITTER_ACCESS_TOKEN_SECRET= process.env.TWITTER_ACCESS_TOKEN_SECRET|| '';

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
function fmt(n, decimals = 2) {
  if (n == null || isNaN(n)) return '—';
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function trendEmoji(pct) {
  if (pct == null || isNaN(pct)) return '➡️';
  if (pct > 1)  return '🚀';
  if (pct > 0)  return '📈';
  if (pct < -1) return '📉';
  if (pct < 0)  return '🔻';
  return '➡️';
}

function calcKarat(spotUsdPerOz, purity) {
  const usdPerGram = (spotUsdPerOz / TROY_OZ) * purity;
  const aedPerGram = usdPerGram * AED_PEG;
  return { usdPerGram, aedPerGram };
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------
function httpsGet(targetUrl, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(targetUrl, { headers }, res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} from ${targetUrl}: ${body}`));
        }
        try { resolve(JSON.parse(body)); }
        catch (e) { reject(new Error(`JSON parse error: ${e.message}`)); }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(new Error('Request timed out')); });
  });
}

function httpsPost(targetUrl, payload, headers = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const parsedUrl = new url.URL(targetUrl);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...headers,
      },
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let parsed;
        try { parsed = JSON.parse(data); } catch { parsed = data; }
        if (res.statusCode >= 400) {
          return reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
        }
        resolve(parsed);
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(new Error('Request timed out')); });
    req.write(body);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// OAuth 1.0a  (X API v2 uses OAuth 1.0a User Context for posting)
// ---------------------------------------------------------------------------
function percentEncode(s) {
  return encodeURIComponent(String(s))
    .replace(/!/g,  '%21')
    .replace(/'/g,  '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

function buildOAuthHeader(method, endpointUrl, consumerKey, consumerSecret, accessToken, tokenSecret) {
  const nonce     = crypto.randomBytes(16).toString('hex');
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const oauthParams = {
    oauth_consumer_key:     consumerKey,
    oauth_nonce:            nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp:        timestamp,
    oauth_token:            accessToken,
    oauth_version:          '1.0',
  };

  // Signature base string: method + URL + sorted encoded params
  const sortedParams = Object.keys(oauthParams)
    .sort()
    .map(k => `${percentEncode(k)}=${percentEncode(oauthParams[k])}`)
    .join('&');

  const signatureBase = [
    method.toUpperCase(),
    percentEncode(endpointUrl),
    percentEncode(sortedParams),
  ].join('&');

  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;
  // OAuth 1.0a (RFC 5849 §3.4.2) mandates HMAC-SHA1 for the request signature.
  // This is NOT a password hash — it is a message authentication code used to
  // verify the request has not been tampered with. The algorithm is specified by
  // the X/Twitter API and cannot be replaced with a stronger digest.
  const signature  = crypto
    .createHmac('sha1', signingKey)
    .update(signatureBase)
    .digest('base64');

  oauthParams.oauth_signature = signature;

  const headerValue = 'OAuth ' + Object.keys(oauthParams)
    .sort()
    .map(k => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
    .join(', ');

  return { Authorization: headerValue };
}

// ---------------------------------------------------------------------------
// Tweet templates (self-contained, no ES-module import needed)
// ---------------------------------------------------------------------------

/**
 * Pick a template ID based on the hour in Dubai time (UTC+4) and day of week.
 * @param {Date} now
 * @returns {string}
 */
function pickTemplate(now) {
  const dubaiHour = (now.getUTCHours() + 4) % 24;
  const dayOfWeek = new Date(now.getTime() + 4 * 3600 * 1000).getUTCDay(); // 0=Sun,5=Fri,6=Sat

  // Midnight: full daily breakdown
  if (dubaiHour === 0) return 'daily';
  // Morning market open
  if (dubaiHour === 6) return 'morning';
  // Arabic edition (08:00 Dubai = peak GCC engagement)
  if (dubaiHour === 8) return 'arabic';
  // Evening wrap-up
  if (dubaiHour === 20) return 'evening';
  // Weekend edition on Fridays at noon
  if ((dayOfWeek === 5 || dayOfWeek === 6) && dubaiHour === 12) return 'weekend';
  // Default: hourly snapshot
  return 'hourly';
}

function buildTweetText(templateId, data) {
  const { spotUsdPerOz, dayOpenUsdPerOz, generatedAt } = data;
  const change     = dayOpenUsdPerOz ? spotUsdPerOz - dayOpenUsdPerOz : null;
  const changePct  = dayOpenUsdPerOz ? ((spotUsdPerOz - dayOpenUsdPerOz) / dayOpenUsdPerOz) * 100 : null;
  const sign       = change != null && change >= 0 ? '+' : '';

  const k24 = calcKarat(spotUsdPerOz, 1.0);
  const k22 = calcKarat(spotUsdPerOz, 22 / 24);
  const k21 = calcKarat(spotUsdPerOz, 21 / 24);
  const k18 = calcKarat(spotUsdPerOz, 18 / 24);

  switch (templateId) {

    case 'hourly': {
      const time = new Date(generatedAt).toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dubai', hour12: true,
      });
      return [
        `🥇 Gold Now (${time} UAE) ${trendEmoji(changePct)}`,
        `Spot: $${fmt(spotUsdPerOz)}/oz` + (change != null ? ` ${sign}${fmt(changePct)}%` : ''),
        `24K: AED ${fmt(k24.aedPerGram)}/g`,
        `22K: AED ${fmt(k22.aedPerGram)}/g`,
        `21K: AED ${fmt(k21.aedPerGram)}/g`,
        `📊 ${SITE_URL}`,
        `#GoldPrice #Gold #UAE #Dubai`,
      ].join('\n');
    }

    case 'daily': {
      const date = new Date(generatedAt).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      });
      const changeStr = change != null ? ` (${sign}${fmt(changePct)}%)` : '';
      return [
        `🥇 Gold Prices Today — ${date}`,
        `24K: $${fmt(spotUsdPerOz)}/oz${changeStr}`,
        `🇦🇪 UAE (AED/g):`,
        `24K: ${fmt(k24.aedPerGram)} | 22K: ${fmt(k22.aedPerGram)}`,
        `21K: ${fmt(k21.aedPerGram)} | 18K: ${fmt(k18.aedPerGram)}`,
        `${trendEmoji(changePct)} ${SITE_URL}`,
        `#GoldPrice #Gold #UAE #Dubai`,
      ].join('\n');
    }

    case 'morning': {
      const date = new Date(generatedAt).toLocaleDateString('en-US', {
        weekday: 'long', month: 'short', day: 'numeric',
      });
      return [
        `☀️ Good Morning — Gold Opens ${date}`,
        `Spot: $${fmt(spotUsdPerOz)}/oz ${trendEmoji(changePct)}`,
        change != null ? `vs Yesterday: ${sign}$${fmt(change)} (${sign}${fmt(changePct)}%)` : null,
        `🇦🇪 24K UAE: AED ${fmt(k24.aedPerGram)}/g`,
        `🇦🇪 22K UAE: AED ${fmt(k22.aedPerGram)}/g`,
        `Track live → ${SITE_URL}`,
        `#GoldPrice #GoldMarket #Dubai #GCC`,
      ].filter(Boolean).join('\n');
    }

    case 'evening': {
      const date = new Date(generatedAt).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      });
      return [
        `🌙 Gold End of Day — ${date}`,
        `Close: $${fmt(spotUsdPerOz)}/oz ${trendEmoji(changePct)}`,
        dayOpenUsdPerOz ? `Open:  $${fmt(dayOpenUsdPerOz)}/oz` : null,
        change != null ? `Change: ${sign}$${fmt(change)} (${sign}${fmt(changePct)}%)` : null,
        `🇦🇪 24K Dubai: AED ${fmt(k24.aedPerGram)}/g`,
        `Charts → ${SITE_URL}`,
        `#GoldClose #GoldPrice #Dubai`,
      ].filter(Boolean).join('\n');
    }

    case 'arabic': {
      const date = new Date(generatedAt).toLocaleDateString('ar-AE', {
        month: 'short', day: 'numeric',
      });
      const trend = changePct == null ? '➡️' : changePct > 0 ? '📈' : changePct < 0 ? '📉' : '➡️';
      return [
        `🥇 أسعار الذهب اليوم — ${date} ${trend}`,
        `عيار 24: ${fmt(k24.aedPerGram)} درهم/جرام`,
        `عيار 22: ${fmt(k22.aedPerGram)} درهم/جرام`,
        `عيار 21: ${fmt(k21.aedPerGram)} درهم/جرام`,
        `عيار 18: ${fmt(k18.aedPerGram)} درهم/جرام`,
        change != null ? `التغيير: ${sign}$${fmt(change)} (${sign}${fmt(changePct)}%)` : null,
        `📊 ${SITE_URL}`,
        `#سعر_الذهب #ذهب #الإمارات #دبي`,
      ].filter(Boolean).join('\n');
    }

    case 'weekend': {
      return [
        `🌅 Weekend Gold Wrap-Up ${trendEmoji(changePct)}`,
        `Current: $${fmt(spotUsdPerOz)}/oz`,
        change != null ? `Today:   ${sign}$${fmt(change)} (${sign}${fmt(changePct)}%)` : null,
        `🇦🇪 24K: AED ${fmt(k24.aedPerGram)}/g | 22K: AED ${fmt(k22.aedPerGram)}/g`,
        `📊 ${SITE_URL}`,
        `#GoldWeekend #GoldPrice #GCC`,
      ].filter(Boolean).join('\n');
    }

    default:
      return buildTweetText('hourly', data);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  // Validate credentials
  const missing = [
    ['GOLD_API_KEY',               GOLD_API_KEY],
    ['TWITTER_API_KEY',            TWITTER_API_KEY],
    ['TWITTER_API_SECRET',         TWITTER_API_SECRET],
    ['TWITTER_ACCESS_TOKEN',       TWITTER_ACCESS_TOKEN],
    ['TWITTER_ACCESS_TOKEN_SECRET',TWITTER_ACCESS_TOKEN_SECRET],
  ].filter(([, v]) => !v).map(([k]) => k);

  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing.join(', '));
    console.error('   See docs/TWITTER_AUTOMATION.md for setup instructions.');
    process.exit(1);
  }

  // 1. Fetch gold price
  console.log('📡 Fetching gold price from gold-api.com…');
  let goldData;
  try {
    goldData = await httpsGet(GOLD_API_URL, { 'x-access-token': GOLD_API_KEY });
  } catch (err) {
    console.error('❌ Failed to fetch gold price:', err.message);
    process.exit(1);
  }

  const spotUsdPerOz = goldData.price;
  if (typeof spotUsdPerOz !== 'number' || spotUsdPerOz <= 0) {
    console.error('❌ Invalid price from gold-api.com:', goldData);
    process.exit(1);
  }

  const generatedAt     = new Date().toISOString();
  const dayOpenUsdPerOz = goldData.prev_close_price || goldData.open_price || null;

  console.log(`✅ Spot price: $${fmt(spotUsdPerOz)}/oz`);

  // 2. Pick template based on current time
  const now        = new Date(generatedAt);
  const templateId = pickTemplate(now);
  console.log(`📝 Using template: ${templateId}`);

  // 3. Build tweet text
  const tweetText = buildTweetText(templateId, {
    spotUsdPerOz,
    dayOpenUsdPerOz,
    generatedAt,
  });

  console.log(`\n--- Tweet preview (${[...tweetText].length} chars) ---`);
  console.log(tweetText);
  console.log('---\n');

  if ([...tweetText].length > 280) {
    console.warn('⚠️  Tweet exceeds 280 characters — it will be truncated by X.');
  }

  // 4. Build OAuth header and post to X API v2
  const authHeaders = buildOAuthHeader(
    'POST',
    TWEET_URL,
    TWITTER_API_KEY,
    TWITTER_API_SECRET,
    TWITTER_ACCESS_TOKEN,
    TWITTER_ACCESS_TOKEN_SECRET,
  );

  console.log('📤 Posting tweet…');
  let response;
  try {
    response = await httpsPost(TWEET_URL, { text: tweetText }, authHeaders);
  } catch (err) {
    console.error('❌ Failed to post tweet:', err.message);
    process.exit(1);
  }

  if (response && response.data && response.data.id) {
    const tweetId = response.data.id;
    console.log(`✅ Tweet posted! https://twitter.com/i/web/status/${tweetId}`);
  } else {
    console.error('❌ Unexpected response from X API:', JSON.stringify(response));
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ Unhandled error:', err.message);
  process.exit(1);
});
