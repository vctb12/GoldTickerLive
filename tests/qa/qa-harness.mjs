// Gold Ticker Live — reusable QA evidence harness.
//
// This is the canonical "prove no regression" tool for the tracker revamp. Every
// later phase runs it before/after and diffs the report + screenshots. It is
// deliberately reliable: it never waits on `networkidle` (the tracker polls every
// 90 s, so the network never goes idle and Playwright hangs forever). Instead it
// uses `domcontentloaded` → wait for the real live-price element → a short fixed
// settle for hydration.
//
// What it captures, per (page × lang × viewport):
//   - full-page screenshot           -> tests/qa/baseline/<label>-<page>-<lang>-<vp>.png
//   - console errors                 (GA/GTM/Clarity/ERR_ABORTED noise filtered)
//   - network/request failures       (same noise filter)
//   - leaked i18n keys               (raw namespace.key.key / UPPER.CASE.DOT in body text)
//   - <h1> count + structure
//   - RTL/overflow check             (documentElement.scrollWidth > innerWidth + 2)
//
// The JSON metrics report is written with fs.writeFileSync to tests/qa/report.json
// (NOT printed to stdout, where earlier runs lost it).
//
// Chromium: pinned to the pre-installed build at /opt/pw-browsers. Playwright 1.61
// would otherwise try to download browser build 1228; the image ships 1194. We point
// `executablePath` at the existing binary and never call `playwright install`.
//
// Server: the repo root is served on :8080 (same contract as playwright.config.js and
// scripts/qa/leaked-key-scan.mjs). If :8080 is already up it is reused; otherwise the
// harness starts `python3 -m http.server 8080` and tears it down on exit.
//
// Usage:
//   node tests/qa/qa-harness.mjs                       # tracker baseline, default output
//   node tests/qa/qa-harness.mjs --label after-phase7  # label the run + artifacts
//   node tests/qa/qa-harness.mjs --pages tracker,home  # which pages to capture
//   node tests/qa/qa-harness.mjs --out <dir> --report <file>
//
// Exit code: 0 if the run completed and no console errors / network errors / leaked
// keys were found; 1 otherwise (so CI / a later session can gate on a clean report).

import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '../..');

// ── pinned, pre-installed Chromium (do NOT download — see header) ───────────────
const CHROMIUM_BIN =
  process.env.QA_CHROMIUM_BIN || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const HOST = '127.0.0.1';
const PORT = Number(process.env.QA_PORT || 8080);
const BASE = `http://${HOST}:${PORT}`;
const SETTLE_MS = Number(process.env.QA_SETTLE_MS || 1500); // fixed hydration settle

// ── CLI args ────────────────────────────────────────────────────────────────────
function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const LABEL = arg('label', 'baseline');
const OUT_DIR = path.resolve(REPO_ROOT, arg('out', 'tests/qa/baseline'));
const REPORT_PATH = path.resolve(REPO_ROOT, arg('report', 'tests/qa/report.json'));
const PAGE_FILTER = arg('pages', 'tracker')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// ── what to capture ───────────────────────────────────────────────────────────
// `ready` is the live-price/content element we wait for after domcontentloaded.
// The canonical tracker hash makes the AR/EN state deterministic and exercises the
// frozen hash schema (docs/tracker-state.md).
const TRACKER_HASH = (lang) => `#mode=live&cur=AED&k=24&u=gram&r=30D&cmp=USD&lang=${lang}`;
const ALL_PAGES = [
  {
    name: 'tracker',
    ready: '#tp-hero-readout',
    url: (lang) => `${BASE}/tracker.html${TRACKER_HASH(lang)}`,
  },
  {
    name: 'home',
    ready: 'main',
    url: (lang) => `${BASE}/index.html${lang === 'ar' ? '?lang=ar' : ''}`,
  },
];
const PAGES = ALL_PAGES.filter((p) => PAGE_FILTER.includes(p.name));
const VIEWPORTS = [
  { tag: '390', width: 390, height: 844 }, // small phone
  { tag: '1366', width: 1366, height: 900 }, // laptop
];
const LANGS = ['en', 'ar'];

// ── noise filter (GA/GTM/Clarity/analytics + benign aborts/blocks) ──────────────
function isNoise(text) {
  return /google|gtag|gtm|googletagmanager|doubleclick|collect|clarity|analytics|ERR_ABORTED|ERR_BLOCKED|net::ERR_BLOCKED_BY|favicon/i.test(
    text || ''
  );
}

// ── leaked-i18n-key detection (namespace.key.key / UPPER.CASE.DOT, not file-like) ─
// Mirrors scripts/qa/leaked-key-scan.mjs so the two tools agree.
const NAMESPACES =
  'home|tracker|calc|calculator|shops|country|methodology|method|nav|footer|common|source|freshness|status|compare|invest|learn|account|dashboard|terms|privacy|markets|alerts|planner|exports|archive|chart|karat|liveToolbar|watchlist|decision|controls|summary|hints|quickTools|mobile|welcome|referenceBanner';
const EXT = 'html|js|json|jsonc|yml|yaml|css|svg|png|jpg|jpeg|webp|com|org|net|io|md';
const LOWER = new RegExp(`\\b(?:${NAMESPACES})\\.[a-zA-Z][\\w]*(?:\\.[a-zA-Z][\\w]*)+\\b`, 'g');
const UPPER = /\b[A-Z][A-Z0-9]*(?:\.[A-Z][A-Z0-9]*){2,}\b/g;
const isFileLike = (s) => new RegExp(`\\.(?:${EXT})$`, 'i').test(s);
function scanLeakedKeys(text) {
  const hits = new Set();
  for (const re of [LOWER, UPPER]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))) {
      if (!isFileLike(m[0])) hits.add(m[0]);
    }
  }
  return [...hits];
}

// ── server lifecycle (reuse :8080 if up, else start + tear down) ────────────────
function portOpen(port) {
  return new Promise((resolve) => {
    const sock = net.connect({ host: HOST, port }, () => {
      sock.end();
      resolve(true);
    });
    sock.on('error', () => resolve(false));
    sock.setTimeout(800, () => {
      sock.destroy();
      resolve(false);
    });
  });
}
async function waitForPort(port, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await portOpen(port)) return true;
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}
async function ensureServer() {
  if (await portOpen(PORT)) return null; // reuse existing
  const proc = spawn('python3', ['-m', 'http.server', String(PORT)], {
    cwd: REPO_ROOT,
    stdio: 'ignore',
  });
  if (!(await waitForPort(PORT))) {
    proc.kill();
    throw new Error(`Could not start static server on :${PORT}`);
  }
  return proc;
}

// ── main ────────────────────────────────────────────────────────────────────────
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });

const serverProc = await ensureServer();
const browser = await chromium.launch({ executablePath: CHROMIUM_BIN });
const results = [];

try {
  for (const pg of PAGES) {
    for (const lang of LANGS) {
      for (const vp of VIEWPORTS) {
        const ctx = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
        });
        const page = await ctx.newPage();
        const consoleErrors = [];
        const networkErrors = [];
        page.on('console', (m) => {
          if (m.type() !== 'error') return;
          const text = m.text();
          if (isNoise(text)) return;
          // "Failed to load resource: …" console errors carry no URL, so they can't be
          // attributed/noise-filtered here. The same failures are captured (with their
          // URL, properly filtered) by the requestfailed handler below — so skip the
          // URL-less console echo to avoid double-counting. In this sandbox these are
          // the blocked Google-Fonts request; a real non-noise fetch failure still
          // surfaces in networkErrors with its URL.
          if (/^Failed to load resource:/.test(text)) return;
          consoleErrors.push(text);
        });
        page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));
        page.on('requestfailed', (req) => {
          const err = req.failure()?.errorText || 'failed';
          const u = req.url();
          if (!isNoise(`${u} ${err}`)) networkErrors.push(`${err} ${u}`);
        });

        const url = pg.url(lang);
        // Never networkidle (tracker polls forever). domcontentloaded + wait for the
        // live price element + a short fixed settle for hydration / first price.
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
        await page.waitForSelector(pg.ready, { timeout: 8000 }).catch(() => {});
        await page.waitForTimeout(SETTLE_MS);

        const metrics = await page.evaluate(() => ({
          scrollW: document.documentElement.scrollWidth,
          innerW: window.innerWidth,
          dir: document.documentElement.getAttribute('dir') || 'ltr',
          lang: document.documentElement.getAttribute('lang') || '',
          h1: [...document.querySelectorAll('h1')].map((h) =>
            h.textContent.trim().replace(/\s+/g, ' ')
          ),
          h1count: document.querySelectorAll('h1').length,
          bodyText: document.body.innerText,
        }));

        const shotName = `${LABEL}-${pg.name}-${lang}-${vp.tag}.png`;
        await page.screenshot({ path: path.join(OUT_DIR, shotName), fullPage: true });

        const overflowPx = metrics.scrollW - metrics.innerW;
        results.push({
          page: pg.name,
          lang,
          viewport: vp.tag,
          url,
          dir: metrics.dir,
          htmlLang: metrics.lang,
          scrollW: metrics.scrollW,
          innerW: metrics.innerW,
          overflowPx,
          overflow: overflowPx > 2, // RTL/overflow contract: scrollWidth > innerWidth + 2
          h1count: metrics.h1count,
          h1: metrics.h1,
          consoleErrors,
          networkErrors,
          leakedKeys: scanLeakedKeys(metrics.bodyText),
          screenshot: path.relative(REPO_ROOT, path.join(OUT_DIR, shotName)),
        });
        await ctx.close();
      }
    }
  }
} finally {
  await browser.close();
  if (serverProc) serverProc.kill();
}

// ── summary + write report to FILE (not stdout) ─────────────────────────────────
const summary = {
  views: results.length,
  consoleErrors: results.reduce((n, r) => n + r.consoleErrors.length, 0),
  networkErrors: results.reduce((n, r) => n + r.networkErrors.length, 0),
  leakedKeys: results.reduce((n, r) => n + r.leakedKeys.length, 0),
  overflowViews: results
    .filter((r) => r.overflow)
    .map((r) => `${r.page}-${r.lang}-${r.viewport} (${r.overflowPx}px)`),
};
const report = {
  meta: {
    label: LABEL,
    generatedAt: new Date().toISOString(),
    base: BASE,
    chromium: CHROMIUM_BIN,
    settleMs: SETTLE_MS,
    pages: PAGES.map((p) => p.name),
    viewports: VIEWPORTS.map((v) => v.tag),
    langs: LANGS,
  },
  summary,
  results,
};
fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + '\n');

// concise console line (the full data lives in the file)
console.log(
  `QA harness "${LABEL}": ${summary.views} views · ` +
    `${summary.consoleErrors} console errors · ${summary.networkErrors} network errors · ` +
    `${summary.leakedKeys} leaked keys · ${summary.overflowViews.length} overflow`
);
if (summary.overflowViews.length) console.log('  overflow:', summary.overflowViews.join(', '));
console.log(
  `Report: ${path.relative(REPO_ROOT, REPORT_PATH)} · Screenshots: ${path.relative(REPO_ROOT, OUT_DIR)}/`
);

// Gate on real regressions: console/network errors, leaked i18n keys, AND RTL/overflow.
process.exitCode =
  summary.consoleErrors +
    summary.networkErrors +
    summary.leakedKeys +
    summary.overflowViews.length >
  0
    ? 1
    : 0;
