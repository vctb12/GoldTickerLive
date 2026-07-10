#!/usr/bin/env node
/**
 * capture-console-baseline.mjs — repeatable runtime-console capture across pages × locales.
 *
 * Loads each page (EN default + AR via ?lang=ar) in headless Chromium and records:
 *   - console errors + warnings
 *   - uncaught page errors (pageerror)
 *   - failed network responses (>=400) and request failures
 *
 * Serves a local directory (default: dist/, i.e. the production build) so results reflect the
 * shipped bundle, not raw source. Writes JSON + a Markdown summary under reports/qa/.
 *
 * Usage:
 *   node scripts/qa/capture-console-baseline.mjs                       # serve dist/, all pages EN+AR
 *   node scripts/qa/capture-console-baseline.mjs --serve public --stamp foo
 *   node scripts/qa/capture-console-baseline.mjs --base https://goldtickerlive.com --pages index.html
 *
 * Security: filesystem paths never derive from untrusted input. `--serve` is an allowlist, the
 * output dir is a constant, `--stamp` is charset-restricted, and the local server resolves requests
 * against an in-memory file map built from a fixed-root walk (req.url only indexes the map, it never
 * reaches a filesystem call). Chromium is resolved from PLAYWRIGHT_CHROMIUM_EXECUTABLE, then
 * /opt/pw-browsers, then the Playwright default.
 */
import { chromium } from 'playwright';
import http from 'node:http';
import {
  createReadStream,
  existsSync,
  statSync,
  readdirSync,
  mkdirSync,
  writeFileSync,
} from 'node:fs';
import { extname, join, resolve, sep, relative } from 'node:path';

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

// --serve is restricted to an allowlist so the served root is always a constant string literal
// (never tainted). Output dir is constant; the stamp is charset-restricted before use in a path.
const SERVE_ARG = arg('serve', 'dist');
const SERVE_DIR = ['dist', 'public'].includes(SERVE_ARG) ? SERVE_ARG : 'dist';
const OUT_DIR = 'reports/qa';
const STAMP = String(arg('stamp', 'baseline')).replace(/[^A-Za-z0-9_-]/g, '_');
const PORT = Number(arg('port', '8199'));
const EXTERNAL_BASE = arg('base', '');
const SETTLE_MS = Number(arg('settle', '1500'));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.xml': 'application/xml',
  '.txt': 'text/plain',
  '.map': 'application/json',
  '.webmanifest': 'application/manifest+json',
};

function resolveChromium() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE) return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  const root = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  try {
    const dir = readdirSync(root).find((d) => d.startsWith('chromium-'));
    if (dir) {
      const p = join(root, dir, 'chrome-linux', 'chrome');
      if (existsSync(p)) return p;
    }
  } catch {
    /* fall through */
  }
  return undefined; // let Playwright resolve its default
}

// Walk a fixed root once and map each URL path -> absolute file path. Request handling then only
// does a Map lookup on req.url, so untrusted request data never flows into a filesystem call.
function loadTree(dir) {
  const root = resolve(dir);
  const map = new Map();
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const full = join(d, name);
      if (statSync(full).isDirectory()) walk(full);
      else map.set('/' + relative(root, full).split(sep).join('/'), full);
    }
  };
  walk(root);
  return map;
}

function startServer(tree) {
  const server = http.createServer((req, res) => {
    let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    if (urlPath.endsWith('/')) urlPath += 'index.html';
    const file = tree.get(urlPath); // req.url only indexes the prebuilt map — no fs call on user data
    if (!file) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    createReadStream(file).pipe(res);
  });
  return new Promise((res) => server.listen(PORT, () => res(server)));
}

function listPages(tree) {
  return [...tree.keys()]
    .filter((k) => /^\/[^/]+\.html$/.test(k))
    .map((k) => k.slice(1))
    .sort();
}

async function capturePage(browser, url) {
  const page = await browser.newPage();
  const rec = {
    url,
    consoleErrors: [],
    consoleWarnings: [],
    pageErrors: [],
    failedResponses: [],
    requestFailures: [],
  };
  page.on('console', (m) => {
    const t = m.type();
    if (t === 'error') rec.consoleErrors.push(m.text());
    else if (t === 'warning') rec.consoleWarnings.push(m.text());
  });
  page.on('pageerror', (e) => rec.pageErrors.push(e.message.split('\n')[0]));
  page.on('response', (r) => {
    if (r.status() >= 400) rec.failedResponses.push(`${r.status()} ${r.url()}`);
  });
  page.on('requestfailed', (r) =>
    rec.requestFailures.push(`${r.failure()?.errorText || 'failed'} ${r.url()}`)
  );
  try {
    // 'load' (not 'networkidle') so blocked external fetches (gold-API / FX / Supabase in a
    // no-egress sandbox) don't stall the crawl waiting for an idle that never comes.
    await page.goto(url, { waitUntil: 'load', timeout: 20000 });
  } catch (e) {
    rec.pageErrors.push(`navigation: ${e.message.split('\n')[0]}`);
  }
  await page.waitForTimeout(SETTLE_MS);
  await page.close();
  return rec;
}

async function main() {
  const base = EXTERNAL_BASE || `http://localhost:${PORT}`;
  let server = null;
  let pages;
  if (EXTERNAL_BASE) {
    pages = arg('pages', 'index.html').split(',');
  } else {
    if (!existsSync(SERVE_DIR)) {
      console.error(`serve dir not found: ${SERVE_DIR} (run npm run build first)`);
      process.exit(2);
    }
    const tree = loadTree(SERVE_DIR);
    server = await startServer(tree);
    pages = listPages(tree);
  }
  const execPath = resolveChromium();
  const browser = await chromium.launch({ executablePath: execPath, args: ['--no-sandbox'] });

  const results = [];
  for (const p of pages) {
    for (const [locale, suffix] of [
      ['en', ''],
      ['ar', '?lang=ar'],
    ]) {
      const url = `${base}/${p}${suffix}`;
      const rec = await capturePage(browser, url);
      rec.page = p;
      rec.locale = locale;
      results.push(rec);
      const n = rec.consoleErrors.length + rec.pageErrors.length;
      process.stdout.write(`${n ? 'x' : '.'}`);
    }
  }
  process.stdout.write('\n');
  await browser.close();
  if (server) server.close();

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, `console-${STAMP}.json`), JSON.stringify(results, null, 2));

  // Markdown summary
  const lines = ['# Runtime console capture', '', `Base: \`${base}\` · pages × {en, ar}`, ''];
  lines.push('| Page | Locale | console.error | pageerror | failed req (>=400) |');
  lines.push('| ---- | ------ | ------------: | --------: | -----------------: |');
  let totalErr = 0;
  for (const r of results) {
    const failed = r.failedResponses.length + r.requestFailures.length;
    totalErr += r.consoleErrors.length + r.pageErrors.length;
    lines.push(
      `| ${r.page} | ${r.locale} | ${r.consoleErrors.length} | ${r.pageErrors.length} | ${failed} |`
    );
  }
  lines.push('', `**Total console.error + pageerror across all pages/locales: ${totalErr}**`, '');
  const dirty = results.filter(
    (r) =>
      r.consoleErrors.length ||
      r.pageErrors.length ||
      r.failedResponses.length ||
      r.requestFailures.length
  );
  if (dirty.length) {
    lines.push('## Details (non-clean pages)', '');
    for (const r of dirty) {
      lines.push(`### ${r.page} · ${r.locale}`);
      for (const e of r.consoleErrors) lines.push(`- console.error: ${e}`);
      for (const e of r.pageErrors) lines.push(`- pageerror: ${e}`);
      for (const e of r.failedResponses) lines.push(`- failed: ${e}`);
      for (const e of r.requestFailures) lines.push(`- reqfail: ${e}`);
      lines.push('');
    }
  }
  writeFileSync(join(OUT_DIR, `console-${STAMP}.md`), lines.join('\n'));
  console.log(
    `Wrote ${join(OUT_DIR, `console-${STAMP}.json`)} and .md · total errors: ${totalErr}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
