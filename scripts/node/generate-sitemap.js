#!/usr/bin/env node
/**
 * scripts/generate-sitemap.js
 * Auto-generates sitemap.xml from the filesystem.
 *
 * Walks all .html files and index.html dirs, assigns priority/changefreq
 * based on depth, and writes sitemap.xml.
 *
 * <lastmod> is the date the file's CONTENT last changed, taken from git commit
 * history — NOT filesystem mtime. The build (inject-schema, inject-theme-preinit,
 * vite) rewrites every HTML file on each run, which resets mtime to "now"; a
 * mtime-based sitemap therefore claimed every page changed today on every
 * rebuild, and running the test suite re-dirtied public/sitemap.xml every time.
 * Git commit dates only advance when the content is actually committed, so the
 * sitemap stays truthful and stops churning on no-op rebuilds. See resolveLastmod.
 *
 * Usage:  node scripts/generate-sitemap.js [--base <url>]
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const BASE_URL = (() => {
  const i = process.argv.indexOf('--base');
  return i >= 0 ? process.argv[i + 1] : 'https://goldtickerlive.com';
})();

// Directories/pages to exclude from the sitemap
const EXCLUDE = new Set([
  'offline.html',
  'dist',
  'node_modules',
  '.git',
  'server',
  'tests',
  'docs',
  'supabase',
  'build',
  'scripts',
  'src',
  'config',
  'data',
  'assets',
]);

// ── Walk filesystem ──────────────────────────────────────────────────────────
function isNoindex(filePath) {
  try {
    const head = fs.readFileSync(filePath, 'utf8');
    return /<meta\s+name=["']robots["']\s+content=["'][^"']*noindex/i.test(head);
  } catch {
    return false;
  }
}

function walk(dir, base = '', results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (EXCLUDE.has(entry.name) || entry.name.startsWith('.')) continue;

    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Duplicate country hub — canonical is /countries/{slug}/ not /gold-price/
      if (entry.name === 'gold-price' && base.startsWith('countries/')) {
        continue;
      }
      const idx = path.join(full, 'index.html');
      if (fs.existsSync(idx) && !isNoindex(idx)) {
        results.push({ urlPath: rel + '/', file: idx });
      }
      walk(full, rel, results);
    } else if (entry.name.endsWith('.html') && entry.name !== 'index.html') {
      if (!EXCLUDE.has(entry.name) && !isNoindex(full)) {
        results.push({ urlPath: rel, file: full });
      }
    }
  }
  return results;
}

// ── Priority heuristic ───────────────────────────────────────────────────────
function getPriority(urlPath) {
  const depth = urlPath.split('/').filter(Boolean).length;
  if (depth === 0 || urlPath === '') return '1.0';
  if (depth === 1) return '0.9';
  if (depth === 2) return '0.8';
  if (depth === 3) return '0.7';
  return '0.6';
}

function getChangefreq(urlPath) {
  if (urlPath.includes('gold-price') || urlPath.includes('gold-rate') || urlPath === '')
    return 'daily';
  if (urlPath.includes('countries') || urlPath.includes('cities') || urlPath.includes('markets'))
    return 'daily';
  if (urlPath.includes('tracker') || urlPath === 'tracker.html') return 'always';
  if (urlPath.includes('learn') || urlPath.includes('guides') || urlPath.includes('methodology'))
    return 'monthly';
  return 'weekly';
}

function formatDate(ms) {
  return new Date(ms).toISOString().split('T')[0];
}

// ── Honest lastmod (git commit date, not mtime) ──────────────────────────────
const TODAY = new Date().toISOString().split('T')[0];

// Number of reachable commits. A depth-1 (shallow CI) checkout collapses every
// file's `git log` date onto the single HEAD commit, which would make the
// sitemap claim every page changed on the deploy day. When history is that
// shallow we keep the lastmod already recorded in the committed sitemap instead.
function historyDepth() {
  try {
    const n = parseInt(
      execFileSync('git', ['rev-list', '--count', 'HEAD'], {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim(),
      10
    );
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}

// Date (YYYY-MM-DD) of the last commit that touched the file, or null when the
// path is untracked / git is unavailable.
function gitLastmod(file) {
  try {
    const rel = path.relative(ROOT, file);
    const out = execFileSync('git', ['log', '-1', '--format=%cs', '--', rel], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(out) ? out : null;
  } catch {
    return null;
  }
}

// loc → lastmod already committed in sitemap.xml. These dates were captured when
// the sitemap was last generated with real history, so they are the honest
// fallback for a shallow rebuild or an untracked/generated page — using them
// prevents fabricating a fresh date. Read once, before we overwrite sitemap.xml.
function readPriorLastmod() {
  const map = new Map();
  try {
    const xml = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
    const re = /<loc>([^<]+)<\/loc>\s*<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/g;
    let m;
    while ((m = re.exec(xml)) !== null) map.set(m[1].trim(), m[2]);
  } catch {
    /* first run — no prior sitemap on disk */
  }
  return map;
}

const HISTORY_OK = historyDepth() > 1;
const PRIOR_LASTMOD = readPriorLastmod();

// Resolve the truthful lastmod for a page. With real history, the git commit
// date wins. With a collapsed (depth-1) checkout, the previously-committed date
// wins so unchanged pages are not re-stamped. A future date is never emitted.
function resolveLastmod(loc, file, stat) {
  const prior = PRIOR_LASTMOD.get(loc);
  let d;
  if (HISTORY_OK) {
    d = gitLastmod(file) || prior || formatDate(stat.mtimeMs);
  } else {
    d = prior || gitLastmod(file) || formatDate(stat.mtimeMs);
  }
  return d > TODAY ? TODAY : d;
}

// ── Real AR mirror resolution (2026-07-04) ──────────────────────────────────
// Pages with a dedicated /ar/ document must declare a correct reciprocal pair
// instead of the runtime `?lang=ar` fallback (which is nonsense for /ar/ URLs:
// it made the sitemap say hreflang=en points at the Arabic document). Mirrors
// are resolved against the filesystem — never hardcoded. Site-wide `?lang=ar`
// strategy changes beyond this stay owner-gated (OWNER_REVIEW.md Phase 43).
function urlPathExists(urlPath) {
  if (urlPath === '' || urlPath === '/') return fs.existsSync(path.join(ROOT, 'index.html'));
  const rel = urlPath.replace(/^\//, '');
  if (rel.endsWith('.html')) return fs.existsSync(path.join(ROOT, rel));
  return fs.existsSync(path.join(ROOT, rel, 'index.html'));
}

// EN url-path (no leading slash, '' = root) → AR mirror url-path or null.
function arMirrorFor(urlPath) {
  const candidates = [];
  if (urlPath === '') candidates.push('ar/');
  else if (urlPath === 'methodology.html') candidates.push('ar/methodology/');
  else if (urlPath.startsWith('content/guides/')) {
    candidates.push(urlPath.replace('content/guides/', 'content/guides/ar/'));
  } else if (urlPath.startsWith('content/tools/')) {
    candidates.push(urlPath.replace('content/tools/', 'content/tools/ar/'));
  } else {
    candidates.push(`ar/${urlPath}`);
  }
  for (const c of candidates) if (urlPathExists(c)) return c;
  return null;
}

// AR url-path → EN counterpart url-path or null.
function enCounterpartFor(urlPath) {
  let candidates = [];
  if (urlPath === 'ar/') candidates = [''];
  else if (urlPath === 'ar/methodology/') candidates = ['methodology.html', 'methodology/'];
  else if (urlPath.startsWith('content/guides/ar/')) {
    candidates = [urlPath.replace('content/guides/ar/', 'content/guides/')];
  } else if (urlPath.startsWith('content/tools/ar/')) {
    candidates = [urlPath.replace('content/tools/ar/', 'content/tools/')];
  } else if (urlPath.startsWith('ar/')) {
    candidates = [urlPath.slice(3)];
  }
  for (const c of candidates) if (urlPathExists(c)) return c;
  return null;
}

function toLoc(urlPath) {
  return urlPath ? `${BASE_URL}/${urlPath}` : `${BASE_URL}/`;
}

// ── Build entries ────────────────────────────────────────────────────────────
const pages = walk(ROOT);

// Always add root
const rootEntry = { urlPath: '', file: path.join(ROOT, 'index.html') };

const allEntries = [rootEntry, ...pages].sort((a, b) => {
  const da = a.urlPath.split('/').filter(Boolean).length;
  const db = b.urlPath.split('/').filter(Boolean).length;
  return da - db || a.urlPath.localeCompare(b.urlPath);
});

// ── Generate XML ─────────────────────────────────────────────────────────────
const urls = allEntries
  .map(({ urlPath, file }) => {
    const loc = urlPath ? `${BASE_URL}/${urlPath}` : `${BASE_URL}/`;
    const stat = fs.statSync(file);
    const lastmod = resolveLastmod(loc, file, stat);
    const priority = getPriority(urlPath);
    const changefreq = getChangefreq(urlPath);

    // Hreflang alternates: use real /ar/ document mirrors when they exist on
    // disk; otherwise keep the runtime `?lang=ar` pair for EN pages.
    const isArPage = urlPath === 'ar/' || urlPath.startsWith('ar/') || urlPath.includes('/ar/');
    let enUrl = loc;
    let arUrl;
    if (isArPage) {
      const en = enCounterpartFor(urlPath);
      enUrl = en === null ? loc : toLoc(en);
      arUrl = loc;
    } else {
      const mirror = arMirrorFor(urlPath);
      arUrl = mirror ? toLoc(mirror) : loc.includes('?') ? loc + '&lang=ar' : loc + '?lang=ar';
    }

    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
    <xhtml:link rel="alternate" hreflang="x-default" href="${enUrl}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${enUrl}"/>
    <xhtml:link rel="alternate" hreflang="ar" href="${arUrl}"/>
  </url>`;
  })
  .join('\n\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">

${urls}

</urlset>
`;

const outPath = path.join(ROOT, 'sitemap.xml');
fs.writeFileSync(outPath, xml, 'utf8');
console.log(`✅  Generated sitemap.xml with ${allEntries.length} URLs → ${outPath}`);
