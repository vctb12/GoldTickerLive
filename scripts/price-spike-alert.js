#!/usr/bin/env node
/**
 * scripts/price-spike-alert.js
 *
 * Checks if the current gold price has moved more than SPIKE_THRESHOLD_PCT
 * from the opening price. If so, fires alerts to Telegram, Discord, and X.
 *
 * Runs hourly via .github/workflows/gold-price-spike.yml.
 *
 * Required GitHub Secrets:
 *   GOLD_API_KEY                 – api.gold-api.com key
 *   TELEGRAM_BOT_TOKEN           – (optional) for Telegram alerts
 *   TELEGRAM_CHANNEL_ID          – (optional) for Telegram alerts
 *   DISCORD_WEBHOOK_URL          – (optional) for Discord alerts
 *   TWITTER_API_KEY              – (optional) for X / Twitter alerts
 *   TWITTER_API_SECRET           – (optional)
 *   TWITTER_ACCESS_TOKEN         – (optional)
 *   TWITTER_ACCESS_TOKEN_SECRET  – (optional)
 *   SPIKE_THRESHOLD_PCT          – default "2.0" (2%)
 *
 * At least one notification channel must be configured.
 */

'use strict';

const https = require('https');
const crypto = require('crypto');

const SITE_URL = 'https://vctb12.github.io/Gold-Prices/';
const GOLD_API_URL = 'https://api.gold-api.com/price/XAU';
const AED_PEG = 3.6725;
const TROY_OZ = 31.1035;
const TWEET_URL = 'https://api.twitter.com/2/tweets';

const GOLD_API_KEY = process.env.GOLD_API_KEY || '';
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '';
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL || '';
const TWITTER_API_KEY = process.env.TWITTER_API_KEY || '';
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET || '';
const TWITTER_ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN || '';
const TWITTER_ACCESS_TOKEN_SECRET = process.env.TWITTER_ACCESS_TOKEN_SECRET || '';
const THRESHOLD = parseFloat(process.env.SPIKE_THRESHOLD_PCT || '2.0');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmt(n, d = 2) {
  if (n == null || isNaN(n)) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let body = '';
      res.on('data', (c) => {
        body += c;
      });
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => req.destroy(new Error('Timeout')));
  });
}

function httpsPost(url, payload, headers = {}) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const u = new (require('url').URL)(url);
    const opts = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        ...headers,
      },
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => {
        data += c;
      });
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        if (res.statusCode >= 400 && res.statusCode !== 204) {
          return reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
        }
        resolve(parsed || { ok: true });
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => req.destroy(new Error('Timeout')));
    req.write(body);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// OAuth 1.0a (same as tweet-gold-price.js, RFC 5849)
// ---------------------------------------------------------------------------
function percentEncode(s) {
  return encodeURIComponent(String(s))
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

function buildOAuthHeader(method, endpointUrl, ck, cs, at, ts) {
  const nonce = crypto.randomBytes(16).toString('hex');
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const params = {
    oauth_consumer_key: ck,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_token: at,
    oauth_version: '1.0',
  };
  const sortedParams = Object.keys(params)
    .sort()
    .map((k) => `${percentEncode(k)}=${percentEncode(params[k])}`)
    .join('&');
  const sigBase = [
    method.toUpperCase(),
    percentEncode(endpointUrl),
    percentEncode(sortedParams),
  ].join('&');
  const signingKey = `${percentEncode(cs)}&${percentEncode(ts)}`;
  // OAuth 1.0a (RFC 5849 §3.4.2) mandates HMAC-SHA1 for the request signature.
  // This is a message authentication code, not a password hash.
  const signature = crypto.createHmac('sha1', signingKey).update(sigBase).digest('base64');
  params.oauth_signature = signature;
  return {
    Authorization:
      'OAuth ' +
      Object.keys(params)
        .sort()
        .map((k) => `${percentEncode(k)}="${percentEncode(params[k])}"`)
        .join(', '),
  };
}

// ---------------------------------------------------------------------------
// Alert senders
// ---------------------------------------------------------------------------
async function sendTelegram(text) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHANNEL_ID) return;
  await httpsPost(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    chat_id: TELEGRAM_CHANNEL_ID,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: false,
  });
  console.log('✅ Telegram spike alert sent');
}

async function sendDiscord(spot, changePct, changeAbs, sign) {
  if (!DISCORD_WEBHOOK) return;
  const color = changeAbs >= 0 ? 0x10b981 : 0xef4444;
  const arrow = changeAbs >= 0 ? '⬆️' : '⬇️';
  const k24aed = (spot / TROY_OZ) * AED_PEG;
  await httpsPost(DISCORD_WEBHOOK, {
    username: 'GoldPrices Alert',
    avatar_url: 'https://vctb12.github.io/Gold-Prices/assets/favicon-192x192.png',
    embeds: [
      {
        title: `🚨 Gold Price Spike Alert ${arrow}`,
        url: SITE_URL,
        color,
        description: `Gold moved **${sign}${fmt(changePct)}%** from today's open.`,
        fields: [
          { name: 'Current Price', value: `$${fmt(spot)}/oz`, inline: true },
          {
            name: 'Change',
            value: `${sign}$${fmt(changeAbs)} (${sign}${fmt(changePct)}%)`,
            inline: true,
          },
          { name: '24K Dubai', value: `AED ${fmt(k24aed)}/g`, inline: true },
        ],
        footer: { text: `GoldPrices Alert  •  Threshold: ±${THRESHOLD}%` },
        timestamp: new Date().toISOString(),
      },
    ],
  });
  console.log('✅ Discord spike alert sent');
}

async function sendTweet(spot, changePct, changeAbs, sign) {
  if (
    !TWITTER_API_KEY ||
    !TWITTER_API_SECRET ||
    !TWITTER_ACCESS_TOKEN ||
    !TWITTER_ACCESS_TOKEN_SECRET
  )
    return;
  const direction = changeAbs >= 0 ? '⬆️' : '⬇️';
  const absPct = Math.abs(changePct).toFixed(2);
  const k24aed = (spot / TROY_OZ) * AED_PEG;
  const text = [
    `🚨 Gold ${direction} ${absPct}% today!`,
    `Now: $${fmt(spot)}/oz`,
    `Change: ${sign}$${fmt(changeAbs)} (${sign}${fmt(changePct)}%)`,
    `🇦🇪 24K Dubai: AED ${fmt(k24aed)}/g`,
    `📊 Track live → ${SITE_URL}`,
    '#GoldPrice #Alert #Gold',
  ].join('\n');

  const authHeaders = buildOAuthHeader(
    'POST',
    TWEET_URL,
    TWITTER_API_KEY,
    TWITTER_API_SECRET,
    TWITTER_ACCESS_TOKEN,
    TWITTER_ACCESS_TOKEN_SECRET
  );
  await httpsPost(TWEET_URL, { text }, authHeaders);
  console.log('✅ X / Twitter spike alert tweeted');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  if (!GOLD_API_KEY) {
    console.log(
      '⚠️  GOLD_API_KEY not set — skipping spike check (configure in repo Settings → Secrets).'
    );
    process.exit(0);
  }

  console.log(`📡 Fetching gold price (spike threshold: ±${THRESHOLD}%)…`);
  let goldData;
  try {
    goldData = await httpsGet(GOLD_API_URL, { 'x-access-token': GOLD_API_KEY });
  } catch (err) {
    console.error('❌ Gold API error:', err.message);
    process.exit(1);
  }

  const spot = goldData.price;
  const open = goldData.prev_close_price || goldData.open_price || null;

  if (typeof spot !== 'number' || spot <= 0) {
    console.error('❌ Invalid price:', goldData);
    process.exit(1);
  }

  if (!open) {
    console.log('ℹ️  No open price available — cannot compute day change. Skipping.');
    process.exit(0);
  }

  const changeAbs = spot - open;
  const changePct = ((spot - open) / open) * 100;
  const sign = changeAbs >= 0 ? '+' : '';

  console.log(
    `✅ Spot: $${fmt(spot)}/oz  Open: $${fmt(open)}/oz  Change: ${sign}${fmt(changePct)}%`
  );

  if (Math.abs(changePct) < THRESHOLD) {
    console.log(
      `ℹ️  Change (${fmt(changePct)}%) is below threshold (${THRESHOLD}%). No alert needed.`
    );
    process.exit(0);
  }

  console.log(`🚨 Spike detected! ${sign}${fmt(changePct)}% — firing alerts…`);

  const alertText = [
    `🚨 <b>Gold Price Alert</b> ${changeAbs >= 0 ? '⬆️' : '⬇️'}`,
    '',
    `Gold moved <b>${sign}${fmt(changePct)}%</b> from today's open!`,
    '',
    `Now:   <b>$${fmt(spot)}/oz</b>`,
    `Open:  $${fmt(open)}/oz`,
    `Change: ${sign}$${fmt(changeAbs)} (${sign}${fmt(changePct)}%)`,
    '',
    `📊 <a href="${SITE_URL}">Track live → GoldPrices</a>`,
    '#GoldAlert #GoldPrice #XAU',
  ].join('\n');

  await Promise.allSettled([
    sendTelegram(alertText),
    sendDiscord(spot, changePct, changeAbs, sign),
    sendTweet(spot, changePct, changeAbs, sign),
  ]);

  console.log('✅ All configured channels alerted.');
}

main().catch((err) => {
  console.error('❌ Unhandled error:', err.message);
  process.exit(1);
});
