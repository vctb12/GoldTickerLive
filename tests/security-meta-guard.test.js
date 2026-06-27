/**
 * Site-wide guard: no public HTML page may carry a dead security `<meta>` tag.
 *
 * `X-Frame-Options` is an HTTP *response header*. Browsers ignore it when it is
 * delivered as `<meta http-equiv="X-Frame-Options" content="...">` — the tag is
 * a no-op that gives a false sense of clickjacking protection. The real, working
 * protection is set as an actual response header in `_headers` (Netlify/CF) and
 * `.htaccess` (Apache):
 *
 *   _headers   →  X-Frame-Options: DENY
 *   .htaccess  →  Header always set X-Frame-Options "DENY"
 *
 * Defect D5: ~hundreds of pages historically shipped the dead meta. It has been
 * swept site-wide; this test locks that in so a generator or a copy-paste can't
 * silently reintroduce the no-op tag.
 */

'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..');

// Directories that are never shipped as public pages (mirrors seo-sitewide.test.js).
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'tests',
  'scripts',
  'server',
  'supabase',
  'repositories',
  '.github',
  'docs',
  'build',
]);

function findHtmlFiles(dir, base = '', out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    if (SKIP_DIRS.has(entry.name)) continue;
    const rel = base ? `${base}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) findHtmlFiles(full, rel, out);
    else if (entry.name.endsWith('.html')) out.push(rel);
  }
  return out;
}

// Matches `<meta ... http-equiv="X-Frame-Options" ...>` in any attribute order,
// single/double/unquoted, case-insensitive.
const DEAD_XFO_META = /<meta[^>]*http-equiv=["']?x-frame-options["']?[^>]*>/i;

const ALL_FILES = findHtmlFiles(REPO_ROOT);

test('public HTML carries no dead X-Frame-Options <meta> (D5 regression guard)', () => {
  assert.ok(
    ALL_FILES.length > 100,
    `expected to scan the full site, only found ${ALL_FILES.length} HTML files`
  );
  const offenders = ALL_FILES.filter((f) =>
    DEAD_XFO_META.test(fs.readFileSync(path.join(REPO_ROOT, f), 'utf8'))
  );
  assert.deepEqual(
    offenders,
    [],
    'X-Frame-Options as <meta http-equiv> is a no-op (browsers ignore it). ' +
      'Remove it from these files; clickjacking protection is the real HTTP header in ' +
      `_headers and .htaccess:\n  ${offenders.join('\n  ')}`
  );
});
