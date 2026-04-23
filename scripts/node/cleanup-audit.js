#!/usr/bin/env node
/**
 * Phase 1 audit — repo cleanup.
 * Read-only. Produces:
 *   /tmp/audit/inventory.json       — every tracked file with size + last-touched
 *   /tmp/audit/reachability.json    — live-set from the union reachability graph
 *   /tmp/audit/candidates.json      — Bucket A/B/C
 *   /tmp/audit/dupes.json           — byte-identical binary duplicates
 *
 * Conservative: a file is LIVE if ANY signal marks it live.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..', '..');
process.chdir(ROOT);

// Ensure tmp output dir exists
fs.mkdirSync('/tmp/audit', { recursive: true });

// ---- helpers ---------------------------------------------------------------

function sh(cmd, opts = {}) {
  return execSync(cmd, { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024, ...opts });
}

function lsFiles() {
  return sh('git ls-files').split('\n').filter(Boolean);
}

function safeRead(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return null;
  }
}

function safeReadBuf(p) {
  try {
    return fs.readFileSync(p);
  } catch {
    return null;
  }
}

function normPath(p) {
  return p.replace(/\\/g, '/');
}

// ---- 1. inventory ----------------------------------------------------------

const files = lsFiles().map(normPath);
console.error(`[audit] ${files.length} tracked files`);

// Batch git log per file is slow for 1000 files; use a streaming approach.
// We'll use `git log --name-only --format=%H%x09%aI` once.
const lastTouched = new Map();
{
  const raw = sh('git log --name-only --format=__COMMIT__%h%x09%aI');
  let cur = '';
  for (const line of raw.split('\n')) {
    if (line.startsWith('__COMMIT__')) {
      cur = line.slice('__COMMIT__'.length);
    } else if (line) {
      const k = normPath(line);
      if (!lastTouched.has(k)) lastTouched.set(k, cur);
    }
  }
}

const inventory = [];
for (const f of files) {
  let size = 0;
  try {
    size = fs.statSync(f).size;
  } catch {
    /* gone */
  }
  inventory.push({
    path: f,
    size,
    lastTouched: lastTouched.get(f) || '',
  });
}
fs.writeFileSync('/tmp/audit/inventory.json', JSON.stringify(inventory, null, 2));

// Extension breakdown
const extCounts = new Map();
for (const { path: p } of inventory) {
  const ext = path.extname(p).toLowerCase() || '(noext)';
  extCounts.set(ext, (extCounts.get(ext) || 0) + 1);
}
const extSummary = [...extCounts.entries()].sort((a, b) => b[1] - a[1]);
fs.writeFileSync(
  '/tmp/audit/ext-breakdown.json',
  JSON.stringify(Object.fromEntries(extSummary), null, 2)
);

// ---- 2. reachability graph -------------------------------------------------

const live = new Set();
const liveReason = new Map(); // path -> first reason
function mark(p, reason) {
  if (!p) return;
  const n = normPath(p);
  if (!live.has(n)) {
    live.add(n);
    liveReason.set(n, reason);
  }
}

// Keep-list pass 1: blanket keeps
const KEEP_DIRS = ['docs/', 'supabase/', '.github/', '.husky/'];
const KEEP_DOTFILE_RE =
  /^(\.editorconfig|\.gitignore|\.prettierignore|\.nvmrc|\.nojekyll|\.replit|\.prettierrc\.json|\.stylelintrc\.json|\.pa11yci\.js|\.htaccess|_headers|_redirects|CNAME|\.env\.example)$/;
const KEEP_META_RE =
  /^(LICENSE|README\.md|CHANGELOG\.md|CONTRIBUTING\.md|AGENTS\.md|CLAUDE\.md|favicon\.svg|manifest\.json|robots\.txt|sitemap\.xml|sw\.js|404\.html|offline\.html|package\.json|package-lock\.json|pyproject\.toml|server\.js|eslint\.config\.mjs|vite\.config\.js|playwright\.config\.js)$/;

for (const { path: p } of inventory) {
  // Under blanket-keep dir?
  if (KEEP_DIRS.some((d) => p.startsWith(d)))
    mark(p, 'keep: under ' + KEEP_DIRS.find((d) => p.startsWith(d)));
  // Governance / dotfile at root?
  const base = path.basename(p);
  if (p === base) {
    if (KEEP_DOTFILE_RE.test(base)) mark(p, 'keep: root dotfile');
    if (KEEP_META_RE.test(base)) mark(p, 'keep: root meta');
  }
  // Public HTML: all **/*.html under countries/, content/, or repo root
  if (p.endsWith('.html')) {
    if (
      p.startsWith('countries/') ||
      p.startsWith('content/') ||
      !p.includes('/') // root-level html
    ) {
      mark(p, 'keep: public HTML');
    }
    // admin/**/*.html is not a public URL, but is a live server-rendered surface
    if (p.startsWith('admin/')) mark(p, 'keep: admin HTML');
  }
}

// Build a set of all files (for containment checks later)
const fileSet = new Set(files);

// ---- HTML → asset graph ----------------------------------------------------

function resolveRef(fromFile, ref) {
  if (!ref) return null;
  // strip query/hash
  ref = ref.split('#')[0].split('?')[0];
  if (!ref) return null;
  // skip protocol-relative, absolute URLs, data:, mailto:, tel:, js:
  if (/^(https?:)?\/\//i.test(ref)) return null;
  if (/^(data|mailto|tel|javascript|blob):/i.test(ref)) return null;
  // Leading slash → repo root
  let target;
  if (ref.startsWith('/')) {
    target = ref.replace(/^\/+/, '');
  } else {
    target = path.posix.join(path.posix.dirname(normPath(fromFile)), ref);
  }
  // Collapse ..
  target = path.posix.normalize(target);
  if (target.startsWith('../')) return null;
  // Trailing slash → index.html
  if (target.endsWith('/')) target = target + 'index.html';
  if (fileSet.has(target)) return target;
  // Try .html extension
  if (fileSet.has(target + '.html')) return target + '.html';
  // Try directory index
  if (fileSet.has(target + '/index.html')) return target + '/index.html';
  return null;
}

const htmlFiles = files.filter((f) => f.endsWith('.html'));
const jsFiles = files.filter((f) => /\.(js|mjs|cjs)$/.test(f));
const pyFiles = files.filter((f) => f.endsWith('.py'));

// Parse HTML for refs — simple regex-based (conservative, catches both quoted forms)
const SRC_RE = /\b(?:src|href|data-src|poster)\s*=\s*["']([^"']+)["']/gi;
const SRCSET_RE = /\bsrcset\s*=\s*["']([^"']+)["']/gi;
const INLINE_URL_RE = /url\(\s*["']?([^)"']+)["']?\s*\)/gi;

for (const htmlFile of htmlFiles) {
  const text = safeRead(htmlFile);
  if (!text) continue;
  mark(htmlFile, liveReason.get(htmlFile) || 'keep: HTML entrypoint');
  for (const m of text.matchAll(SRC_RE)) {
    const r = resolveRef(htmlFile, m[1]);
    if (r) mark(r, `html-ref:${htmlFile}`);
  }
  for (const m of text.matchAll(SRCSET_RE)) {
    for (const part of m[1].split(',')) {
      const url = part.trim().split(/\s+/)[0];
      const r = resolveRef(htmlFile, url);
      if (r) mark(r, `html-srcset:${htmlFile}`);
    }
  }
  for (const m of text.matchAll(INLINE_URL_RE)) {
    const r = resolveRef(htmlFile, m[1]);
    if (r) mark(r, `html-inline-url:${htmlFile}`);
  }
}

// ---- JS import graph (static only) ----------------------------------------

const IMPORT_RE =
  /\b(?:import\s+(?:[^'"`;]+?\s+from\s+)?|export\s+(?:\*|\{[^}]*\})\s+from\s+|import\s*\()\s*["'`]([^"'`]+)["'`]/g;
const REQUIRE_RE = /\brequire\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/g;

function resolveJsImport(fromFile, spec) {
  if (!spec) return null;
  if (!spec.startsWith('.') && !spec.startsWith('/')) return null; // bare: node_modules
  let target;
  if (spec.startsWith('/')) {
    target = spec.replace(/^\/+/, '');
  } else {
    target = path.posix.join(path.posix.dirname(normPath(fromFile)), spec);
  }
  target = path.posix.normalize(target);
  // Try exact
  if (fileSet.has(target)) return target;
  // Try extensions
  for (const ext of ['.js', '.mjs', '.cjs', '.json']) {
    if (fileSet.has(target + ext)) return target + ext;
  }
  // Try index
  for (const ext of ['.js', '.mjs', '.cjs']) {
    if (fileSet.has(target + '/index' + ext)) return target + '/index' + ext;
  }
  return null;
}

// Walk JS deps transitively
{
  const queue = [];
  // Seed from HTML script refs (already marked), plus all currently-live JS files.
  for (const p of [...live]) {
    if (/\.(js|mjs|cjs)$/.test(p)) queue.push(p);
  }
  // Also seed server.js and its routes (server is a live surface)
  for (const f of jsFiles) {
    if (f === 'server.js' || f.startsWith('server/')) {
      mark(f, 'server-surface');
      queue.push(f);
    }
  }
  // Seed scripts referenced by package.json scripts + workflows (later step adds more)
  const visited = new Set();
  while (queue.length) {
    const cur = queue.shift();
    if (visited.has(cur)) continue;
    visited.add(cur);
    const text = safeRead(cur);
    if (!text) continue;
    for (const m of text.matchAll(IMPORT_RE)) {
      const r = resolveJsImport(cur, m[1]);
      if (r) {
        mark(r, `js-import:${cur}`);
        queue.push(r);
      }
    }
    for (const m of text.matchAll(REQUIRE_RE)) {
      const r = resolveJsImport(cur, m[1]);
      if (r) {
        mark(r, `js-require:${cur}`);
        queue.push(r);
      }
    }
    // dynamic string-grep: fetch("..."), new URL("..."), literal paths
    const STRING_PATH_RE =
      /["'`]([\w./-]+\.(?:js|mjs|cjs|css|html|json|svg|png|jpg|jpeg|webp|gif|ico|woff2?|ttf|otf|csv|xml|txt))["'`]/g;
    for (const m of text.matchAll(STRING_PATH_RE)) {
      const r = resolveJsImport(
        cur,
        m[1].startsWith('.') || m[1].startsWith('/') ? m[1] : './' + m[1]
      );
      if (r) mark(r, `js-stringref:${cur}`);
      // Also try root-relative
      if (fileSet.has(m[1])) mark(m[1], `js-stringref:${cur}`);
    }
  }
}

// ---- CSS @import / url() graph --------------------------------------------

{
  const CSS_IMPORT_RE = /@import\s+(?:url\()?\s*["']([^"')]+)["']\)?/g;
  const CSS_URL_RE = /url\(\s*["']?([^)"']+)["']?\s*\)/g;
  const queue = [...live].filter((p) => p.endsWith('.css'));
  const visited = new Set();
  while (queue.length) {
    const cur = queue.shift();
    if (visited.has(cur)) continue;
    visited.add(cur);
    const text = safeRead(cur);
    if (!text) continue;
    for (const m of text.matchAll(CSS_IMPORT_RE)) {
      const r = resolveRef(cur, m[1]);
      if (r) {
        mark(r, `css-import:${cur}`);
        if (r.endsWith('.css')) queue.push(r);
      }
    }
    for (const m of text.matchAll(CSS_URL_RE)) {
      const r = resolveRef(cur, m[1]);
      if (r) mark(r, `css-url:${cur}`);
    }
  }
}

// ---- Config / tooling refs -------------------------------------------------

// package.json scripts reference node scripts
{
  const pkg = JSON.parse(safeRead('package.json'));
  const scripts = Object.values(pkg.scripts || {}).join(' \n ');
  // Grab "node path/to/script.js" occurrences
  const NODE_INVOKE_RE = /\bnode\s+([A-Za-z0-9_./-]+\.(?:js|mjs|cjs))/g;
  for (const m of scripts.matchAll(NODE_INVOKE_RE)) {
    if (fileSet.has(m[1])) mark(m[1], 'package.json script');
  }
  // Entries like "vite", "prettier", etc are bare — skip.
}

// Workflow files reference scripts (node + python)
{
  const workflowDir = '.github/workflows';
  for (const f of files.filter((f) => f.startsWith(workflowDir + '/'))) {
    const text = safeRead(f);
    if (!text) continue;
    const RE = /([A-Za-z0-9_./-]+\.(?:js|mjs|cjs|py|sh))/g;
    for (const m of text.matchAll(RE)) {
      const p = m[1];
      if (fileSet.has(p)) mark(p, `workflow:${f}`);
    }
  }
}

// ---- Python import graph --------------------------------------------------

{
  // Rough Python resolver: "from utils.foo import X", "import utils.foo"
  const FROM_RE = /^\s*from\s+([\w.]+)\s+import\b/gm;
  const IMP_RE = /^\s*import\s+([\w.]+)/gm;
  // Seed: any .py file referenced by a workflow (already marked)
  const seed = pyFiles.filter((f) => live.has(f));
  const visited = new Set();
  const queue = [...seed];
  // Also seed every top-level entrypoint in scripts/python (sys.path root)
  const PY_ROOT = 'scripts/python';
  while (queue.length) {
    const cur = queue.shift();
    if (visited.has(cur)) continue;
    visited.add(cur);
    const text = safeRead(cur);
    if (!text) continue;
    const mods = new Set();
    for (const m of text.matchAll(FROM_RE)) mods.add(m[1]);
    for (const m of text.matchAll(IMP_RE)) mods.add(m[1]);
    for (const mod of mods) {
      const parts = mod.split('.');
      // Try scripts/python/<parts>.py or scripts/python/<parts>/__init__.py
      const candidates = [
        `${PY_ROOT}/${parts.join('/')}.py`,
        `${PY_ROOT}/${parts.join('/')}/__init__.py`,
      ];
      for (const c of candidates) {
        if (fileSet.has(c)) {
          mark(c, `py-import:${cur}`);
          queue.push(c);
        }
      }
    }
  }
}

// ---- Test refs: tests/** imports their modules (already caught by JS graph), --
// but tests themselves are live.
for (const f of files) {
  if (f.startsWith('tests/')) mark(f, 'test-surface');
}

// ---- Build/scripts themselves are live (they are invoked by package.json or workflows) ----
// The JS graph walk already covers them if referenced; just in case, anything matching
// /^scripts\/node\// explicitly referenced by package.json.
// (No blanket keep — we want to find actually-orphaned helpers.)

// ---- sitemap.xml listed URLs ----------------------------------------------

{
  const sitemap = safeRead('sitemap.xml') || '';
  const URL_RE = /<loc>\s*([^<]+)\s*<\/loc>/g;
  for (const m of sitemap.matchAll(URL_RE)) {
    let u = m[1].trim();
    try {
      u = new URL(u).pathname;
    } catch {
      /* skip */
    }
    const r = resolveRef('sitemap.xml', u);
    if (r) mark(r, 'sitemap.xml');
  }
}

// ---- robots.txt sitemap refs already caught; _redirects / _headers paths ---
for (const meta of ['_redirects', '_headers', '.htaccess', 'robots.txt', 'manifest.json']) {
  const text = safeRead(meta);
  if (!text) continue;
  // Grab anything that looks like a repo-relative path
  const RE =
    /([A-Za-z0-9_./-]+\.(?:html|js|css|json|svg|png|jpg|jpeg|webp|gif|ico|xml|txt|woff2?|ttf|otf))/g;
  for (const m of text.matchAll(RE)) {
    if (fileSet.has(m[1])) mark(m[1], `runtime:${meta}`);
    // Also try stripping leading slash
    const stripped = m[1].replace(/^\/+/, '');
    if (fileSet.has(stripped)) mark(stripped, `runtime:${meta}`);
  }
}

// ---- Vite config references ----------------------------------------------

{
  const viteCfg = safeRead('vite.config.js');
  if (viteCfg) {
    // Pull any input: { ... 'foo.html' ... } patterns
    const STR_RE = /["'`]([\w./-]+\.(?:html|js|css|mjs|cjs))["'`]/g;
    for (const m of viteCfg.matchAll(STR_RE)) {
      if (fileSet.has(m[1])) mark(m[1], 'vite.config.js');
    }
  }
}

// ---- Dynamic country/city loop — trust data files referenced by them ------
// src/config/countries.js provides the list of country codes; the JS graph
// already includes it. We conservatively mark every file under `data/`,
// `config/`, `content/tools/`, `assets/` that's referenced by a string.
// Extra conservative: mark all `data/*.json`, `config/*.json` files that are
// small reference tables.
for (const f of files) {
  if (
    (f.startsWith('data/') && /\.(json|csv|js)$/.test(f)) ||
    (f.startsWith('config/') && /\.(json|csv|js)$/.test(f))
  ) {
    // Heuristic keep — flag Bucket C if not otherwise reachable; don't mark
    // them live blindly here. We DO mark them live to stay conservative.
    mark(f, 'data/config source (conservative keep)');
  }
  if (f.startsWith('assets/')) mark(f, 'assets/ (conservative keep)');
  if (f.startsWith('reports/')) mark(f, 'reports/ (conservative keep, Bucket C)');
  if (f.startsWith('build/')) mark(f, 'build/ (conservative keep, Bucket C)');
}

// ---- emit reachability ---------------------------------------------------

fs.writeFileSync(
  '/tmp/audit/reachability.json',
  JSON.stringify(
    {
      total: files.length,
      live: live.size,
      reasonsSample: [...liveReason.entries()].slice(0, 30),
    },
    null,
    2
  )
);

// ---- 3. candidate list ---------------------------------------------------

const bucketA = [];
const bucketB = [];
const bucketC = [];

// Bucket A rules
const A_NAME_RE = /(^|\/)(\.DS_Store|Thumbs\.db)$/;
const A_SWAP_RE = /\.(swp|swo)$/;
const A_TILDE_RE = /~$/;
const A_BACKUP_RE = /(\.(bak|old)$|[-_]copy\.[^/]+$|-copy\.[^/]+$|^.* 2\.[^/]+$|\.orig$)/;
const A_MAP_RE = /\.map$/;

// Helper: does the file's basename stem appear anywhere else in the repo?
// Used to downgrade Bucket B → Bucket C when a stem appears in any other file
// (could be a dynamic / composed reference we can't resolve statically).
function stemAppearsElsewhere(filePath) {
  const base = path.basename(filePath);
  const stem = base.replace(/\.[^.]+$/, '');
  // Skip overly-common stems that would trigger false "keeps"
  if (stem.length < 4) return true; // conservative: keep
  try {
    const pathspecExcl = ':(exclude)reports/cleanup-audit/**';
    const hits = sh(
      `git grep -l -F -- ${JSON.stringify(base)} -- . '${pathspecExcl}' 2>/dev/null || true`
    )
      .split('\n')
      .filter(Boolean)
      .filter((h) => normPath(h) !== filePath);
    if (hits.length > 0) return true;
    // Also try just the stem for .js/.mjs/.cjs files where consumers may write
    // `import X from './foo'` without the extension.
    if (/\.(js|mjs|cjs)$/.test(filePath)) {
      const stemHits = sh(
        `git grep -l -F -- ${JSON.stringify("'" + stem + "'")} -- . '${pathspecExcl}' 2>/dev/null || true`
      )
        .split('\n')
        .filter(Boolean)
        .filter((h) => normPath(h) !== filePath);
      if (stemHits.length > 0) return true;
      const stemHits2 = sh(
        `git grep -l -F -- ${JSON.stringify('"' + stem + '"')} -- . '${pathspecExcl}' 2>/dev/null || true`
      )
        .split('\n')
        .filter(Boolean)
        .filter((h) => normPath(h) !== filePath);
      if (stemHits2.length > 0) return true;
    }
  } catch {
    return true; // conservative on error
  }
  return false;
}

for (const entry of inventory) {
  const p = entry.path;
  if (live.has(p)) continue;
  let reason = null;
  if (A_NAME_RE.test(p)) reason = 'OS junk';
  else if (A_SWAP_RE.test(p)) reason = 'editor swap';
  else if (A_TILDE_RE.test(p)) reason = 'editor backup (~)';
  else if (A_BACKUP_RE.test(p)) reason = 'obvious backup filename';
  else if (A_MAP_RE.test(p)) {
    const src = p.replace(/\.map$/, '');
    if (!live.has(src)) reason = 'orphan .map file';
  } else if (entry.size === 0) reason = 'zero-byte file';
  if (reason) {
    bucketA.push({ ...entry, reason });
    continue;
  }
  if (/\.(js|mjs|cjs|css|py)$/.test(p)) {
    // Downgrade to Bucket C if basename shows up anywhere else in the repo
    if (stemAppearsElsewhere(p)) {
      bucketC.push({
        ...entry,
        reason:
          'not statically reachable, but basename/stem is referenced elsewhere (dynamic ref likely)',
      });
    } else {
      bucketB.push({
        ...entry,
        reason: 'not reachable from any entrypoint; no grep hits for basename or stem',
      });
    }
    continue;
  }
  bucketC.push({ ...entry, reason: 'unreferenced (needs human review)' });
}

// ---- 4. byte-identical duplicates ---------------------------------------

const hashes = new Map();
for (const entry of inventory) {
  // Only consider non-text/binary-ish files to avoid flagging e.g. empty JS files
  const p = entry.path;
  if (entry.size === 0) continue;
  // Limit to assets, images, fonts
  if (!/\.(png|jpg|jpeg|webp|gif|ico|svg|woff2?|ttf|otf|pdf|zip)$/i.test(p)) continue;
  const buf = safeReadBuf(p);
  if (!buf) continue;
  const h = crypto.createHash('sha256').update(buf).digest('hex');
  if (!hashes.has(h)) hashes.set(h, []);
  hashes.get(h).push({ path: p, size: entry.size });
}
const dupes = [];
for (const [h, group] of hashes) {
  if (group.length > 1) dupes.push({ hash: h.slice(0, 12), files: group });
}
fs.writeFileSync('/tmp/audit/dupes.json', JSON.stringify(dupes, null, 2));

// ---- write outputs -------------------------------------------------------

fs.writeFileSync(
  '/tmp/audit/candidates.json',
  JSON.stringify({ bucketA, bucketB, bucketC, dupes }, null, 2)
);

console.error(
  `[audit] live=${live.size}/${files.length} | A=${bucketA.length} B=${bucketB.length} C=${bucketC.length} dupes=${dupes.length}`
);
