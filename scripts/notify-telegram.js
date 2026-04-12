#!/usr/bin/env node
/**
 * scripts/notify-telegram.js
 *
 * Fetches the live XAU/USD spot price and posts a formatted message
 * to a Telegram channel/group using the Bot API.
 *
 * Required GitHub Secrets:
 *   GOLD_API_KEY         – api.gold-api.com key
 *   TELEGRAM_BOT_TOKEN   – from @BotFather on Telegram
 *   TELEGRAM_CHANNEL_ID  – e.g. "@goldprices_channel" or "-100123456789"
 *
 * Setup:
 *   1. Create a bot via @BotFather → copy the token
 *   2. Create a channel, add the bot as Admin
 *   3. Get the channel ID (use @userinfobot or the Bot API getUpdates endpoint)
 *
 * See docs/AUTOMATIONS.md for full setup instructions.
 */

'use strict';

const https = require('https');

const SITE_URL     = 'https://vctb12.github.io/Gold-Prices/';
const GOLD_API_URL = 'https://api.gold-api.com/price/XAU';
const AED_PEG      = 3.6725;
const TROY_OZ      = 31.1035;

const GOLD_API_KEY        = process.env.GOLD_API_KEY        || '';
const TELEGRAM_BOT_TOKEN  = process.env.TELEGRAM_BOT_TOKEN  || '';
const TELEGRAM_CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || '';

function fmt(n, decimals = 2) {
  if (n == null || isNaN(n)) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

function calcAedPerGram(spotUsdPerOz, purity) {
  return (spotUsdPerOz / TROY_OZ) * purity * AED_PEG;
}

function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, res => {
      let body = '';
      res.on('data', c => { body += c; });
      res.on('end', () => {
        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
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
      hostname: u.hostname, path: u.pathname + u.search, method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body), ...headers },
    };
    const req = https.request(opts, res => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        let parsed; try { parsed = JSON.parse(data); } catch { parsed = data; }
        if (res.statusCode >= 400) return reject(new Error(`HTTP ${res.statusCode}: ${JSON.stringify(parsed)}`));
        resolve(parsed);
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => req.destroy(new Error('Timeout')));
    req.write(body);
    req.end();
  });
}

async function main() {
  const missing = [
    ['GOLD_API_KEY', GOLD_API_KEY],
    ['TELEGRAM_BOT_TOKEN', TELEGRAM_BOT_TOKEN],
    ['TELEGRAM_CHANNEL_ID', TELEGRAM_CHANNEL_ID],
  ].filter(([, v]) => !v).map(([k]) => k);

  if (missing.length) {
    console.log('⚠️  Missing env vars:', missing.join(', '));
    console.log('   Skipping Telegram post — configure secrets in repo Settings → Secrets → Actions.');
    process.exit(0);
  }

  console.log('📡 Fetching gold price…');
  let goldData;
  try {
    goldData = await httpsGet(GOLD_API_URL, { 'x-access-token': GOLD_API_KEY });
  } catch (err) {
    console.error('❌ Gold API error:', err.message);
    process.exit(1);
  }

  const spot = goldData.price;
  if (typeof spot !== 'number' || spot <= 0) {
    console.error('❌ Invalid price:', goldData);
    process.exit(1);
  }

  const open      = goldData.prev_close_price || goldData.open_price || null;
  const change    = open ? spot - open : null;
  const changePct = open ? ((spot - open) / open) * 100 : null;
  const sign      = change != null && change >= 0 ? '+' : '';
  const trend     = changePct == null ? '➡️' : changePct > 1 ? '🚀' : changePct > 0 ? '📈' : changePct < -1 ? '📉' : changePct < 0 ? '🔻' : '➡️';

  const now  = new Date();
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Dubai', hour12: true });
  const date = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const k24 = calcAedPerGram(spot, 1.0);
  const k22 = calcAedPerGram(spot, 22 / 24);
  const k21 = calcAedPerGram(spot, 21 / 24);
  const k18 = calcAedPerGram(spot, 18 / 24);

  // Telegram uses HTML parse mode — keep it clean
  const lines = [
    `🥇 <b>Gold Prices</b> — ${date} (${time} UAE) ${trend}`,
    ``,
    `📌 Spot: <b>$${fmt(spot)}/oz</b>${change != null ? `  ${sign}${fmt(changePct)}%` : ''}`,
    ``,
    `🇦🇪 UAE (AED/g):`,
    `24K: <b>${fmt(k24)}</b>  |  22K: <b>${fmt(k22)}</b>`,
    `21K: <b>${fmt(k21)}</b>  |  18K: <b>${fmt(k18)}</b>`,
    ``,
    `📊 <a href="${SITE_URL}">Track live on GoldPrices</a>`,
    `#GoldPrice #Gold #UAE #Dubai #GCC`,
  ];

  const text = lines.join('\n');
  console.log(`\n--- Message preview ---\n${text}\n---\n`);

  const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
  try {
    const res = await httpsPost(telegramUrl, {
      chat_id:    TELEGRAM_CHANNEL_ID,
      text,
      parse_mode: 'HTML',
      disable_web_page_preview: false,
    });
    if (res.ok) {
      console.log(`✅ Telegram message sent! message_id=${res.result.message_id}`);
    } else {
      console.error('❌ Telegram API error:', JSON.stringify(res));
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Failed to send Telegram message:', err.message);
    process.exit(1);
  }
}

main().catch(err => { console.error('❌ Unhandled error:', err.message); process.exit(1); });
