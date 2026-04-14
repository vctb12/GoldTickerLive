#!/usr/bin/env node
/**
 * scripts/uptime-check.js
 *
 * Pings the site and alerts via Telegram and/or Discord if it is down
 * (non-200 response or timeout). Used by .github/workflows/uptime-monitor.yml.
 *
 * Required env vars:
 *   SITE_URL             – URL to ping (default: https://vctb12.github.io/Gold-Prices/)
 *   TELEGRAM_BOT_TOKEN   – optional
 *   TELEGRAM_CHANNEL_ID  – optional
 *   DISCORD_WEBHOOK_URL  – optional
 */

'use strict';

const https = require('https');

const SITE_URL = process.env.SITE_URL || 'https://vctb12.github.io/Gold-Prices/';
const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHANNEL = process.env.TELEGRAM_CHANNEL_ID || '';
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL || '';

const TIMEOUT_MS = 10000;

function ping(url) {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = https.get(
      url,
      { headers: { 'User-Agent': 'GoldPrices-UptimeMonitor/1.0' } },
      (res) => {
        const latency = Date.now() - start;
        res.resume(); // drain
        resolve({
          ok: res.statusCode >= 200 && res.statusCode < 400,
          statusCode: res.statusCode,
          latency,
        });
      }
    );
    req.on('error', (err) =>
      resolve({ ok: false, statusCode: 0, latency: Date.now() - start, error: err.message })
    );
    req.setTimeout(TIMEOUT_MS, () => {
      req.destroy();
      resolve({ ok: false, statusCode: 0, latency: TIMEOUT_MS, error: 'Request timed out' });
    });
  });
}

function httpsPost(url, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const u = new (require('url').URL)(url);
    const opts = {
      hostname: u.hostname,
      path: u.pathname + u.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    };
    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', (c) => {
        data += c;
      });
      res.on('end', () => resolve({ statusCode: res.statusCode }));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => req.destroy(new Error('Timeout')));
    req.write(body);
    req.end();
  });
}

async function alertTelegram(msg) {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHANNEL) return;
  await httpsPost(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    chat_id: TELEGRAM_CHANNEL,
    text: msg,
    parse_mode: 'HTML',
  }).catch((e) => console.error('Telegram error:', e.message));
}

async function alertDiscord(msg, isDown) {
  if (!DISCORD_WEBHOOK) return;
  await httpsPost(DISCORD_WEBHOOK, {
    username: 'GoldPrices Uptime',
    embeds: [
      {
        title: isDown ? '🔴 Site Down Alert' : '🟢 Site Recovered',
        description: msg,
        color: isDown ? 0xef4444 : 0x10b981,
        timestamp: new Date().toISOString(),
        footer: { text: SITE_URL },
      },
    ],
  }).catch((e) => console.error('Discord error:', e.message));
}

async function main() {
  console.log(`🔍 Pinging ${SITE_URL}…`);
  const result = await ping(SITE_URL);

  if (result.ok) {
    console.log(`✅ Site is UP  (HTTP ${result.statusCode}, ${result.latency}ms)`);
    process.exit(0);
  }

  const msg = result.error
    ? `GoldPrices site is unreachable!\n\nURL: ${SITE_URL}\nError: ${result.error}`
    : `GoldPrices site returned HTTP ${result.statusCode}!\n\nURL: ${SITE_URL}`;

  console.error(`❌ Site is DOWN: ${msg}`);

  if (!TELEGRAM_TOKEN && !DISCORD_WEBHOOK) {
    console.warn(
      '⚠️  No notification channels configured. Add TELEGRAM_BOT_TOKEN/TELEGRAM_CHANNEL_ID or DISCORD_WEBHOOK_URL secrets.'
    );
  }

  await Promise.allSettled([
    alertTelegram(
      `🔴 <b>GoldPrices site is down!</b>\n\n${result.error ? result.error : `HTTP ${result.statusCode}`}\n\n${SITE_URL}`
    ),
    alertDiscord(msg, true),
  ]);

  process.exit(1);
}

main().catch((err) => {
  console.error('❌ Unhandled error:', err.message);
  process.exit(1);
});
