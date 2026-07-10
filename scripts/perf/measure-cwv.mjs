#!/usr/bin/env node
/**
 * measure-cwv.mjs — repeatable, offline Core Web Vitals + resource-budget runner.
 *
 * Loads each key page in headless Chromium and records LCP, CLS, and per-type resource weights
 * (script / stylesheet / image / font / total), then checks them against `budget.json`. Runs fully
 * locally against the built `dist/` — no Lighthouse-CI upload, no external network — so it works in a
 * no-egress sandbox where the pages' live data fetches are blocked (those don't affect the metrics
 * this measures).
 *
 * INP is interaction-driven and not reliably measurable in a headless lab run without a scripted
 * interaction model; it is reported as "n/a (needs field/interaction data)" rather than faked.
 *
 * Usage:
 *   npm run build
 *   cp -r assets/. dist/assets/ && cp -r data/. dist/data/ && cp -f favicon.svg manifest.json dist/
 *   node scripts/perf/measure-cwv.mjs --serve dist --stamp <label>   # writes to reports/perf/
 *
 * Security: paths never derive from untrusted input — `--serve` is an allowlist, the output dir is a
 * constant, `--stamp` is charset-restricted, and the local server resolves requests against an
 * in-memory file map (req.url only indexes the map; it never reaches a filesystem call).
 */
import { chromium } from 'playwright';
import http from 'node:http';
import {
  createReadStream,
  existsSync,
  readdirSync,
  statSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
} from 'node:fs';
import { extname, join, resolve, sep, relative } from 'node:path';

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const SERVE_ARG = arg('serve', 'dist');
const SERVE_DIR = ['dist', 'public'].includes(SERVE_ARG) ? SERVE_ARG : 'dist';
const OUT_DIR = 'reports/perf';
const STAMP = String(arg('stamp', 'latest')).replace(/[^A-Za-z0-9_-]/g, '_');
const PORT = Number(arg('port', '8291'));
const SETTLE_MS = Number(arg('settle', '2500'));

// Pages to profile (name → path). Country sample = dubai-gold-price.
const PAGES = [
  ['home', 'index.html'],
  ['tracker', 'tracker.html'],
  ['calculator', 'calculator.html'],
  ['compare', 'compare.html'],
  ['country', 'dubai-gold-price.html'],
];

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
  return undefined;
}

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
    const file = tree.get(urlPath);
    if (!file) {
      res.writeHead(404);
      res.end('not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
    createReadStream(file).pipe(res);
  });
  return new Promise((r) => server.listen(PORT, () => r(server)));
}

// Budget lookup: global defaults + per-path overrides from budget.json.
function loadBudgets() {
  try {
    const b = JSON.parse(readFileSync(resolve('budget.json'), 'utf8'));
    const byPath = {};
    for (const entry of b) {
      const sizes = {};
      for (const rs of entry.resourceSizes || []) sizes[rs.resourceType] = rs.budget;
      byPath[entry.path] = sizes;
    }
    return byPath;
  } catch {
    return {};
  }
}

function budgetFor(budgets, pagePath) {
  const global = budgets['/*'] || {};
  const override = budgets['/' + pagePath] || {};
  return { ...global, ...override };
}

async function measurePage(browser, url) {
  const page = await browser.newPage();
  // Install LCP + CLS observers before any page script runs.
  await page.addInitScript(() => {
    window.__cwv = { lcp: 0, cls: 0 };
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) window.__cwv.lcp = e.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          if (!e.hadRecentInput) window.__cwv.cls += e.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
    } catch {
      /* metrics unavailable */
    }
  });
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 25000 });
  } catch {
    /* record what we have */
  }
  await page.waitForTimeout(SETTLE_MS);
  const data = await page.evaluate(() => {
    const res = performance.getEntriesByType('resource');
    const buckets = { script: 0, stylesheet: 0, image: 0, font: 0, other: 0 };
    const sizeOf = (e) => e.transferSize || e.encodedBodySize || e.decodedBodySize || 0;
    for (const e of res) {
      const u = e.name.split('?')[0];
      if (/\.m?js$/.test(u)) buckets.script += sizeOf(e);
      else if (/\.css$/.test(u)) buckets.stylesheet += sizeOf(e);
      else if (/\.(png|jpe?g|webp|gif|svg|avif|ico)$/.test(u)) buckets.image += sizeOf(e);
      else if (/\.(woff2?|ttf|otf)$/.test(u)) buckets.font += sizeOf(e);
      else buckets.other += sizeOf(e);
    }
    const total = Object.values(buckets).reduce((a, b) => a + b, 0);
    return { buckets, total, cwv: window.__cwv || { lcp: 0, cls: 0 } };
  });
  await page.close();
  return data;
}

async function main() {
  if (!existsSync(SERVE_DIR)) {
    console.error(`serve dir not found: ${SERVE_DIR} (run npm run build first)`);
    process.exit(2);
  }
  const budgets = loadBudgets();
  const tree = loadTree(SERVE_DIR);
  const server = await startServer(tree);
  const browser = await chromium.launch({
    executablePath: resolveChromium(),
    args: ['--no-sandbox'],
  });

  const kb = (n) => Math.round((n / 1024) * 10) / 10;
  const results = [];
  for (const [name, path] of PAGES) {
    const d = await measurePage(browser, `http://localhost:${PORT}/${path}`);
    const bud = budgetFor(budgets, path);
    const checks = {};
    for (const type of ['script', 'stylesheet', 'image', 'font', 'total']) {
      const usedKb = type === 'total' ? kb(d.total) : kb(d.buckets[type] || 0);
      const limit = bud[type];
      checks[type] = {
        usedKb,
        limitKb: limit ?? null,
        over: limit != null ? usedKb > limit : null,
      };
    }
    results.push({
      name,
      path,
      lcpMs: Math.round(d.cwv.lcp),
      cls: Math.round(d.cwv.cls * 1000) / 1000,
      checks,
    });
    process.stdout.write('.');
  }
  process.stdout.write('\n');
  await browser.close();
  server.close();

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(join(OUT_DIR, `cwv-${STAMP}.json`), JSON.stringify(results, null, 2));

  const lines = [
    '# Core Web Vitals + resource budgets',
    '',
    'Local lab run against the built `dist/` (no external upload). LCP/CLS from PerformanceObserver; sizes vs `budget.json`. INP: n/a (needs interaction/field data).',
    '',
  ];
  lines.push(
    '| Page | LCP (ms) | CLS | script KB | style KB | image KB | total KB | over budget |'
  );
  lines.push(
    '| ---- | -------: | --: | --------: | -------: | -------: | -------: | ----------- |'
  );
  for (const r of results) {
    const over = Object.entries(r.checks)
      .filter(([, c]) => c.over)
      .map(([t]) => t);
    lines.push(
      `| ${r.name} | ${r.lcpMs} | ${r.cls} | ${r.checks.script.usedKb} | ${r.checks.stylesheet.usedKb} | ${r.checks.image.usedKb} | ${r.checks.total.usedKb} | ${over.length ? '⚠ ' + over.join(', ') : '✅ none'} |`
    );
  }
  lines.push(
    '',
    'Budgets (KB): global script 600 / style 400 / image 500 / font 200 / total 1800; tracker script 800 / style 500 / total 2000.',
    ''
  );
  const anyOver = results.some((r) => Object.values(r.checks).some((c) => c.over));
  lines.push(
    anyOver
      ? '**Result: one or more pages exceed a resource budget — see ⚠ above.**'
      : '**Result: all measured pages are within their resource budgets.**'
  );
  writeFileSync(join(OUT_DIR, `cwv-${STAMP}.md`), lines.join('\n'));
  console.log(`Wrote ${join(OUT_DIR, `cwv-${STAMP}.json`)} and .md`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
