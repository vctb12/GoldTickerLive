#!/usr/bin/env node
/**
 * scripts/node/post-deploy-smoke.js
 *
 * Post-deploy smoke test for the live GitHub Pages site. Runs AFTER
 * `deploy.yml` finishes and answers one question the deploy job itself cannot:
 * "is the new commit actually live and healthy, or is the site silently serving
 * a stale build?"
 *
 * Motivation: on 2026-07-11 a broken `npm run validate` made every deploy fail
 * for hours (PR #641), but nothing alerted — the old build kept serving. The
 * mantra is **merged ≠ deployed until verified live**. This script is the
 * verification, and it fails LOUDLY (non-zero exit + optional Telegram/Discord
 * alert) so a silent deploy failure can't hide again.
 *
 * Hard gates (any failure → exit 1):
 *   1. Representative EN + AR routes return 200 and carry an expected marker
 *      (a 200 that serves a blank/error page is caught by the marker check).
 *   2. `/data/gold_price.json` parses and carries a sane `xau_usd_per_oz`.
 *   3. When a build-info marker + EXPECTED_SHA are both available, the deployed
 *      commit must match — this is the definitive "the new build is live" proof.
 *
 * Soft signals (reported, never fail the run — avoids weekend/3rd-party noise):
 *   - Snapshot age (the fetch cron pauses on weekends, so a large age is normal).
 *   - Service worker presence.
 *
 * No new dependencies: uses Node's global `fetch` (Node 24). The pure helpers
 * are exported and unit-tested; `fetchImpl`/`now` are injectable.
 *
 * Env:
 *   SITE_URL             default https://goldtickerlive.com
 *   EXPECTED_SHA         commit that should be live (CI passes the deploy head)
 *   SNAPSHOT_WARN_AGE_MS default 50h (a full weekend market close + margin)
 *   TELEGRAM_BOT_TOKEN / TELEGRAM_CHANNEL_ID / DISCORD_WEBHOOK_URL  optional
 */

'use strict';

const DEFAULT_SITE = 'https://goldtickerlive.com';
const DEFAULT_WARN_AGE_MS = 50 * 60 * 60 * 1000; // ~one weekend market close + margin

/**
 * Representative routes. Each has a `marker` substring that must appear in the
 * served HTML — proves the page rendered its real content, not a 200'd error
 * shell. `ar` runs the same path with `?lang=ar`.
 */
const DEFAULT_ROUTES = [
  { path: '/', marker: '<title', langs: ['en', 'ar'] },
  { path: '/tracker.html', marker: '<title', langs: ['en'] },
  { path: '/calculator.html', marker: '<title', langs: ['en', 'ar'] },
  { path: '/market.html', marker: '<title', langs: ['en'] },
  { path: '/methodology.html', marker: '<title', langs: ['en'] },
];

// ── Pure helpers (unit-tested) ────────────────────────────────────────────────

/** A 200 whose body contains the marker passes. */
function classifyRoute({ status, body, marker }) {
  if (status !== 200) return { ok: false, reason: `HTTP ${status}` };
  if (marker && !(body || '').includes(marker)) {
    return { ok: false, reason: `marker "${marker}" missing (blank/error shell?)` };
  }
  return { ok: true, reason: 'ok' };
}

/** Validate the snapshot JSON. Hard-fails only on invalid/insane data. */
function evaluateSnapshot(json, { now = Date.now(), warnAgeMs = DEFAULT_WARN_AGE_MS } = {}) {
  if (!json || typeof json !== 'object') {
    return { ok: false, reason: 'gold_price.json did not parse as an object', spot: null };
  }
  const spot = Number(json.xau_usd_per_oz);
  if (!Number.isFinite(spot) || spot <= 0) {
    return { ok: false, reason: `insane xau_usd_per_oz: ${json.xau_usd_per_oz}`, spot: null };
  }
  const stamp = json.fetched_at_utc || json.timestamp_utc || null;
  const t = stamp ? Date.parse(stamp) : NaN;
  const ageMs = Number.isFinite(t) ? Math.max(0, now - t) : null;
  const warnings = [];
  if (ageMs == null) warnings.push('snapshot timestamp missing/unparseable');
  else if (ageMs > warnAgeMs) {
    warnings.push(`snapshot age ${(ageMs / 3.6e6).toFixed(1)}h exceeds ${(warnAgeMs / 3.6e6).toFixed(0)}h`);
  }
  return { ok: true, reason: 'ok', spot, ageMs, warnings };
}

/**
 * Compare the deployed commit to what CI expected.
 * Absent marker or absent expectedSha → skipped (soft), never a hard failure.
 */
function checkCommitMatch(buildInfo, expectedSha) {
  if (!expectedSha) return { ok: true, skipped: true, reason: 'no EXPECTED_SHA provided' };
  if (!buildInfo || !buildInfo.commit) {
    return { ok: true, skipped: true, reason: 'no build-info marker on site (older build?)' };
  }
  const live = String(buildInfo.commit);
  const want = String(expectedSha);
  // Accept short/long SHA either direction.
  const match = live === want || live.startsWith(want) || want.startsWith(live);
  return match
    ? { ok: true, skipped: false, reason: `commit ${live.slice(0, 8)} live` }
    : {
        ok: false,
        skipped: false,
        reason: `deployed commit ${live.slice(0, 8)} != expected ${want.slice(0, 8)} — STALE DEPLOY`,
      };
}

// ── Orchestrator ──────────────────────────────────────────────────────────────

function routeUrl(siteUrl, path, lang) {
  const u = new URL(path, siteUrl);
  if (lang === 'ar') u.searchParams.set('lang', 'ar');
  u.searchParams.set('cb', String(Date.now()));
  return u.toString();
}

async function runSmoke({
  siteUrl = DEFAULT_SITE,
  routes = DEFAULT_ROUTES,
  expectedSha = '',
  fetchImpl = fetch,
  now = Date.now(),
  warnAgeMs = DEFAULT_WARN_AGE_MS,
} = {}) {
  const results = [];
  const warnings = [];
  const fail = (name, reason) => results.push({ name, ok: false, reason });
  const pass = (name, reason) => results.push({ name, ok: true, reason });

  // 1. Routes
  for (const route of routes) {
    for (const lang of route.langs) {
      const url = routeUrl(siteUrl, route.path, lang);
      const name = `route ${route.path} [${lang}]`;
      try {
        const res = await fetchImpl(url, { redirect: 'follow' });
        const body = await res.text();
        const verdict = classifyRoute({ status: res.status, body, marker: route.marker });
        verdict.ok ? pass(name, verdict.reason) : fail(name, verdict.reason);
      } catch (e) {
        fail(name, `fetch error: ${e.message}`);
      }
    }
  }

  // 2. Snapshot
  try {
    const res = await fetchImpl(`${siteUrl.replace(/\/$/, '')}/data/gold_price.json?cb=${Date.now()}`);
    const json = await res.json().catch(() => null);
    const snap = evaluateSnapshot(json, { now, warnAgeMs });
    snap.ok ? pass('snapshot', `spot=${snap.spot}`) : fail('snapshot', snap.reason);
    (snap.warnings || []).forEach((w) => warnings.push(`snapshot: ${w}`));
  } catch (e) {
    fail('snapshot', `fetch error: ${e.message}`);
  }

  // 3. Commit match (build-info marker)
  try {
    const res = await fetchImpl(`${siteUrl.replace(/\/$/, '')}/build-info.json?cb=${Date.now()}`);
    const info = res.status === 200 ? await res.json().catch(() => null) : null;
    const verdict = checkCommitMatch(info, expectedSha);
    if (verdict.skipped) warnings.push(`commit-match skipped: ${verdict.reason}`);
    else verdict.ok ? pass('commit-match', verdict.reason) : fail('commit-match', verdict.reason);
  } catch (e) {
    warnings.push(`commit-match skipped: ${e.message}`);
  }

  // Soft: service worker present
  try {
    const res = await fetchImpl(`${siteUrl.replace(/\/$/, '')}/sw.js?cb=${Date.now()}`);
    if (res.status !== 200) warnings.push(`sw.js returned HTTP ${res.status}`);
  } catch (e) {
    warnings.push(`sw.js check skipped: ${e.message}`);
  }

  const ok = results.every((r) => r.ok);
  return { ok, results, warnings };
}

// ── Alerting + CLI ────────────────────────────────────────────────────────────

async function sendAlert(text) {
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChan = process.env.TELEGRAM_CHANNEL_ID;
  const discord = process.env.DISCORD_WEBHOOK_URL;
  const jobs = [];
  if (tgToken && tgChan) {
    jobs.push(
      fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: tgChan, text, disable_web_page_preview: true }),
      }).catch(() => {})
    );
  }
  if (discord) {
    jobs.push(
      fetch(discord, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      }).catch(() => {})
    );
  }
  await Promise.allSettled(jobs);
}

async function main() {
  const siteUrl = process.env.SITE_URL || DEFAULT_SITE;
  const expectedSha = process.env.EXPECTED_SHA || '';
  const warnAgeMs = Number(process.env.SNAPSHOT_WARN_AGE_MS) || DEFAULT_WARN_AGE_MS;

  console.log(`Post-deploy smoke → ${siteUrl}${expectedSha ? ` (expect ${expectedSha.slice(0, 8)})` : ''}`);
  const { ok, results, warnings } = await runSmoke({ siteUrl, expectedSha, warnAgeMs });

  for (const r of results) console.log(`  ${r.ok ? '✓' : '✗'} ${r.name} — ${r.reason}`);
  for (const w of warnings) console.log(`  ⚠ ${w}`);

  if (ok) {
    console.log('\n✅ Post-deploy smoke passed.');
    return 0;
  }
  const failed = results.filter((r) => !r.ok).map((r) => `${r.name}: ${r.reason}`);
  const msg = `🚨 GoldTickerLive post-deploy smoke FAILED for ${siteUrl}\n` + failed.map((f) => `• ${f}`).join('\n');
  console.error('\n' + msg);
  await sendAlert(msg);
  return 1;
}

module.exports = { classifyRoute, evaluateSnapshot, checkCommitMatch, runSmoke, routeUrl };

if (require.main === module) {
  main()
    .then((code) => process.exit(code))
    .catch((e) => {
      console.error('post-deploy-smoke crashed:', e);
      process.exit(1);
    });
}
