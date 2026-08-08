#!/usr/bin/env node
/**
 * Production pricing-plane monitor. It checks the static Pages snapshot and
 * the browser-live endpoint separately, because a delayed Actions commit must
 * not be mistaken for a dead browser-live path.
 */
'use strict';

const fs = require('node:fs/promises');

const SITE_URL = (process.env.SITE_URL || 'https://goldtickerlive.com/').replace(/\/$/, '');
const TIMEOUT_MS = 8000;
const MAX_STATIC_FALLBACK_AGE_SECONDS = 15 * 60;
const MAX_BROWSER_PROVIDER_AGE_SECONDS = 10 * 60;

async function fetchJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const startedAt = Date.now();
  try {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'GoldTickerLive-ProductionHealth/1.0' },
    });
    const text = await response.text();
    let body = null;
    try {
      body = JSON.parse(text);
    } catch {
      // The status check below reports malformed JSON without echoing a body.
    }
    return { ok: response.ok, status: response.status, body, latencyMs: Date.now() - startedAt };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      body: null,
      latencyMs: Date.now() - startedAt,
      error: error.name === 'AbortError' ? 'timeout' : 'network_error',
    };
  } finally {
    clearTimeout(timer);
  }
}

function timestampAgeSeconds(value, now = Date.now()) {
  const timestamp = new Date(value || 0).getTime();
  if (!Number.isFinite(timestamp) || timestamp <= 0) return null;
  return Math.max(0, Math.floor((now - timestamp) / 1000));
}

function finitePrice(value) {
  const price = Number(value);
  return Number.isFinite(price) && price >= 1000 && price <= 10000 ? price : null;
}

async function runHealthCheck() {
  const [site, staticSnapshot, browserProvider] = await Promise.all([
    fetchJson(`${SITE_URL}/`),
    fetchJson(`${SITE_URL}/data/gold_price.json?health=${Date.now()}`),
    fetchJson('https://api.gold-api.com/price/XAU'),
  ]);
  const now = Date.now();
  const staticPrice = finitePrice(
    staticSnapshot.body?.xau_usd_per_oz ?? staticSnapshot.body?.gold?.ounce_usd
  );
  const staticAgeSeconds = timestampAgeSeconds(
    staticSnapshot.body?.timestamp_utc ??
      staticSnapshot.body?.timestampUtc ??
      staticSnapshot.body?.fetched_at_utc,
    now
  );
  const browserPrice = finitePrice(browserProvider.body?.price);
  const browserAgeSeconds = timestampAgeSeconds(browserProvider.body?.updatedAt, now);
  const checks = {
    site: { ok: site.ok, status: site.status, latencyMs: site.latencyMs },
    staticSnapshot: {
      ok: staticSnapshot.ok && staticPrice !== null && staticAgeSeconds !== null,
      status: staticSnapshot.status,
      pricePresent: staticPrice !== null,
      ageSeconds: staticAgeSeconds,
      latencyMs: staticSnapshot.latencyMs,
    },
    browserLiveProvider: {
      ok:
        browserProvider.ok &&
        browserPrice !== null &&
        browserAgeSeconds !== null &&
        browserAgeSeconds <= MAX_BROWSER_PROVIDER_AGE_SECONDS,
      status: browserProvider.status,
      pricePresent: browserPrice !== null,
      ageSeconds: browserAgeSeconds,
      latencyMs: browserProvider.latencyMs,
    },
  };
  const critical = [];
  if (!checks.site.ok) critical.push('pages_unreachable');
  if (!checks.browserLiveProvider.ok) critical.push('browser_live_provider_unhealthy');
  if (
    !checks.staticSnapshot.ok ||
    (staticAgeSeconds !== null && staticAgeSeconds > MAX_STATIC_FALLBACK_AGE_SECONDS)
  ) {
    critical.push('actions_snapshot_stale_or_invalid');
  }
  return {
    schemaVersion: 1,
    checkedAtUtc: new Date(now).toISOString(),
    status: critical.length ? 'degraded' : 'healthy',
    critical,
    checks,
    thresholds: {
      maxStaticFallbackAgeSeconds: MAX_STATIC_FALLBACK_AGE_SECONDS,
      maxBrowserProviderAgeSeconds: MAX_BROWSER_PROVIDER_AGE_SECONDS,
    },
  };
}

async function main() {
  const report = await runHealthCheck();
  const outputPath = process.argv[process.argv.indexOf('--output') + 1];
  if (outputPath && outputPath !== '--output')
    await fs.writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.status === 'healthy' ? 0 : 1;
}

module.exports = { finitePrice, timestampAgeSeconds, runHealthCheck };

if (require.main === module)
  main().catch((error) => {
    console.error(`production health check failed: ${error.message}`);
    process.exitCode = 1;
  });
