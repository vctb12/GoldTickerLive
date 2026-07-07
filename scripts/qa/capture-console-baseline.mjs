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
 *   node scripts/qa/capture-console-baseline.mjs                # serve dist/, capture all pages EN+AR
 *   node scripts/qa/capture-console-baseline.mjs --serve dist --port 8199 --out reports/qa
 *   node scripts/qa/capture-console-baseline.mjs --base https://goldtickerlive.com  # against a live URL
 *
 * Chromium is resolved from PLAYWRIGHT_CHROMIUM_EXECUTABLE, then /opt/pw-browsers, then the
 * Playwright default. Requires the `playwright` package (already a dev dependency).
 */
import { chromium } from 'playwright';
import http from 'node:http';
import { createReadStream, existsSync, statSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

// Contain any operator-supplied path inside the repo root, so a stray --serve/--out can't route a
// filesystem call outside the project (CodeQL js/path-injection treats argv as a taint source).
function containedPath(rel, base = process.cwd()) {
  const root = resolve(base);
  const p = resolve(root, rel);
  if (p !== root && !p.startsWith(root + sep)) {
    throw new Error(`path '${rel}' escapes ${root}`);
  }
  return p;
}

const SERVE_DIR = containedPath(arg('serve', 'dist'));
const PORT = Number(arg('port', '8199'));
const OUT_DIR = containedPath(arg('out', 'reports/qa'));
const EXTERNAL_BASE = arg('base', '');
const SETTLE_MS = Number(arg('settle', '1500'));
// Filename component from argv — restrict to a safe charset before it reaches a path.
const STAMP = String(arg('stamp', 'baseline')).replace(/[^A-Za-z0-9._-]/g, '_');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.xml': 'application/xml', '.txt': 'text/plain',
  '.map': 'application/json', '.webmanifest': 'application/manifest+json',
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
  } catch { /* fall through */ }
  return undefined; // let Playwright resolve its default
}

function startServer(dir) {
  const root = resolve(dir);
  const server = http.createServer((req, res) => {
    let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    if (urlPath.endsWith('/')) urlPath += 'index.html';
    // Contain the request path inside `root` before it reaches any filesystem call — resolve()
    // collapses `..`, and the prefix check rejects traversal (CodeQL js/path-injection).
    const filePath = resolve(root, '.' + (urlPath.startsWith('/') ? urlPath : '/' + urlPath));
    if (filePath !== root && !filePath.startsWith(root + sep)) {
      res.writeHead(403);
      res.end('forbidden');
      return;
    }
    let target = filePath;
    if (existsSync(target) && statSync(target).isDirectory()) target = join(target, 'index.html');
    if (target !== root && !target.startsWith(root + sep)) {
      res.writeHead(403);
      res.end('forbidden');
      return;
    }
    if (!existsSync(target)) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[extname(target)] || 'application/octet-stream' });
    createReadStream(target).pipe(res);
  });
  return new Promise((res) => server.listen(PORT, () => res(server)));
}

function listPages(dir) {
  return readdirSync(dir).filter((f) => f.endsWith('.html')).sort();
}

async function capturePage(browser, url) {
  const page = await browser.newPage();
  const rec = { url, consoleErrors: [], consoleWarnings: [], pageErrors: [], failedResponses: [], requestFailures: [] };
  page.on('console', (m) => {
    const t = m.type();
    if (t === 'error') rec.consoleErrors.push(m.text());
    else if (t === 'warning') rec.consoleWarnings.push(m.text());
  });
  page.on('pageerror', (e) => rec.pageErrors.push(e.message.split('\n')[0]));
  page.on('response', (r) => { if (r.status() >= 400) rec.failedResponses.push(`${r.status()} ${r.url()}`); });
  page.on('requestfailed', (r) => rec.requestFailures.push(`${r.failure()?.errorText || 'failed'} ${r.url()}`));
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
  if (!EXTERNAL_BASE) {
    if (!existsSync(SERVE_DIR)) {
      console.error(`serve dir not found: ${SERVE_DIR} (run npm run build first)`);
      process.exit(2);
    }
    server = await startServer(SERVE_DIR);
  }
  const pages = EXTERNAL_BASE ? (arg('pages', 'index.html').split(',')) : listPages(SERVE_DIR);
  const execPath = resolveChromium();
  const browser = await chromium.launch({ executablePath: execPath, args: ['--no-sandbox'] });

  const results = [];
  for (const p of pages) {
    for (const [locale, suffix] of [['en', ''], ['ar', '?lang=ar']]) {
      const url = `${base}/${p}${suffix}`;
      const rec = await capturePage(browser, url);
      rec.page = p; rec.locale = locale;
      results.push(rec);
      const n = rec.consoleErrors.length + rec.pageErrors.length;
      process.stdout.write(`${n ? 'x' : '.'}`);
    }
  }
  process.stdout.write('\n');
  await browser.close();
  if (server) server.close();

  mkdirSync(OUT_DIR, { recursive: true });
  const stamp = STAMP;
  writeFileSync(join(OUT_DIR, `console-${stamp}.json`), JSON.stringify(results, null, 2));

  // Markdown summary
  const lines = ['# Runtime console capture', '', `Base: \`${base}\` · pages × {en, ar}`, ''];
  lines.push('| Page | Locale | console.error | pageerror | failed req (>=400) |');
  lines.push('| ---- | ------ | ------------: | --------: | -----------------: |');
  let totalErr = 0;
  for (const r of results) {
    const failed = r.failedResponses.length + r.requestFailures.length;
    totalErr += r.consoleErrors.length + r.pageErrors.length;
    lines.push(`| ${r.page} | ${r.locale} | ${r.consoleErrors.length} | ${r.pageErrors.length} | ${failed} |`);
  }
  lines.push('', `**Total console.error + pageerror across all pages/locales: ${totalErr}**`, '');
  // Detail of any non-empty records
  const dirty = results.filter((r) => r.consoleErrors.length || r.pageErrors.length || r.failedResponses.length || r.requestFailures.length);
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
  writeFileSync(join(OUT_DIR, `console-${stamp}.md`), lines.join('\n'));
  console.log(`Wrote ${join(OUT_DIR, `console-${stamp}.json`)} and .md · total errors: ${totalErr}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
