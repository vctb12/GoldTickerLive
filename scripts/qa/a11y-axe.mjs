#!/usr/bin/env node
/**
 * a11y-axe.mjs — offline axe-core accessibility checks across key pages × {light, dark}.
 *
 * Loads each page in headless Chromium against the built `dist/`, injects axe-core, and runs the
 * WCAG 2.0/2.1 A + AA rule set in both light and dark themes (contrast is theme-dependent). Reports
 * violations grouped by rule + impact. Fully local — no external network. Writes JSON + a Markdown
 * summary under `reports/a11y/`.
 *
 * Usage:
 *   npm run build && cp -r assets/. dist/assets/ && cp -f favicon.svg manifest.json dist/
 *   node scripts/qa/a11y-axe.mjs --stamp <label>
 *
 * Security: `--serve` is an allowlist, the out dir is constant, `--stamp` is charset-restricted, and
 * the local server resolves requests against an in-memory file map (req.url never reaches an fs call).
 */
import { chromium } from 'playwright';
import http from 'node:http';
import { createReadStream, existsSync, readdirSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { extname, join, resolve, sep, relative } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const AXE_PATH = require.resolve('axe-core/axe.min.js');

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
const SERVE_ARG = arg('serve', 'dist');
const SERVE_DIR = ['dist', 'public'].includes(SERVE_ARG) ? SERVE_ARG : 'dist';
const OUT_DIR = 'reports/a11y';
const STAMP = String(arg('stamp', 'latest')).replace(/[^A-Za-z0-9_-]/g, '_');
const PORT = Number(arg('port', '8301'));

const PAGES = [
  ['home', 'index.html'], ['tracker', 'tracker.html'], ['calculator', 'calculator.html'],
  ['shops', 'shops.html'], ['compare', 'compare.html'], ['heatmap', 'heatmap.html'],
  ['portfolio', 'portfolio.html'], ['methodology', 'methodology.html'], ['learn', 'learn.html'],
  ['country', 'dubai-gold-price.html'],
];

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
    if (dir) { const p = join(root, dir, 'chrome-linux', 'chrome'); if (existsSync(p)) return p; }
  } catch { /* default */ }
  return undefined;
}
function loadTree(dir) {
  const root = resolve(dir); const map = new Map();
  const walk = (d) => { for (const n of readdirSync(d)) { const f = join(d, n); if (statSync(f).isDirectory()) walk(f); else map.set('/' + relative(root, f).split(sep).join('/'), f); } };
  walk(root); return map;
}
function startServer(tree) {
  const server = http.createServer((req, res) => {
    let u = decodeURIComponent((req.url || '/').split('?')[0]);
    if (u.endsWith('/')) u += 'index.html';
    const f = tree.get(u);
    if (!f) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[extname(f)] || 'application/octet-stream' });
    createReadStream(f).pipe(res);
  });
  return new Promise((r) => server.listen(PORT, () => r(server)));
}

async function auditPage(browser, url, theme) {
  const page = await browser.newPage({ colorScheme: theme });
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 25000 });
  } catch { /* audit what rendered */ }
  await page.evaluate((t) => {
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.setAttribute('data-theme-mode', t);
  }, theme);
  await page.waitForTimeout(1200);
  await page.addScriptTag({ path: AXE_PATH });
  const result = await page.evaluate(async () => {
    const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } });
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length }));
  });
  await page.close();
  return result;
}

async function main() {
  if (!existsSync(SERVE_DIR)) { console.error(`serve dir not found: ${SERVE_DIR}`); process.exit(2); }
  const tree = loadTree(SERVE_DIR);
  const server = await startServer(tree);
  const browser = await chromium.launch({ executablePath: resolveChromium(), args: ['--no-sandbox'] });

  const rows = [];
  for (const [name, path] of PAGES) {
    for (const theme of ['light', 'dark']) {
      const violations = await auditPage(browser, `http://localhost:${PORT}/${path}`, theme);
      rows.push({ page: name, theme, violations });
      process.stdout.write(violations.length ? 'x' : '.');
    }
  }
  process.stdout.write('\n');
  await browser.close(); server.close();

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, `axe-${STAMP}.json`), JSON.stringify(rows, null, 2));

  const lines = ['# axe-core accessibility report', '', 'WCAG 2.0/2.1 A + AA, key pages × {light, dark}, built `dist/`.', ''];
  lines.push('| Page | Theme | Violations (rule × nodes) |');
  lines.push('| ---- | ----- | ------------------------- |');
  let total = 0;
  for (const r of rows) {
    total += r.violations.reduce((a, v) => a + v.nodes, 0);
    const summary = r.violations.length ? r.violations.map((v) => `${v.id}[${v.impact}]×${v.nodes}`).join(', ') : '✅ none';
    lines.push(`| ${r.page} | ${r.theme} | ${summary} |`);
  }
  lines.push('', `**Total violation nodes across all page×theme runs: ${total}**`, '');
  writeFileSync(join(OUT_DIR, `axe-${STAMP}.md`), lines.join('\n'));
  console.log(`Wrote ${join(OUT_DIR, `axe-${STAMP}.{json,md}`)} · total violation nodes: ${total}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
