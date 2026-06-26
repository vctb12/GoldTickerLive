#!/usr/bin/env node

/**
 * scripts/node/inject-theme-preinit.js
 *
 * Injects a tiny render-blocking inline <head> script into every public HTML
 * page so the chosen theme is applied to <html> BEFORE first paint. Without it,
 * `data-theme` is only set later by the deferred nav.js module, so every user
 * whose saved/OS theme is dark sees a white theme-flash (FOUC) on each page.
 *
 * The injected script mirrors nav.js exactly (localStorage key `user_prefs.theme`,
 * values auto|light|dark; "auto" resolves via prefers-color-scheme) so nav.js
 * later sets the identical attributes with no second repaint.
 *
 * Idempotent: pages already containing the THEME_MARKER are skipped.
 *
 * Usage:
 *   node scripts/node/inject-theme-preinit.js          # write into pages
 *   node scripts/node/inject-theme-preinit.js --check  # CI: fail if any page is missing it
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const CHECK = process.argv.includes('--check');

const THEME_MARKER = 'gtl-theme-preinit';

// 4-space indented to match the existing <head> child indentation in these pages.
const SNIPPET = [
  '    <!-- gtl-theme-preinit: set theme before first paint to avoid a flash (mirrors src/components/nav.js) -->',
  '    <script>',
  '      (function () {',
  '        try {',
  "          var p = JSON.parse(localStorage.getItem('user_prefs') || '{}');",
  "          var mode = p.theme === 'light' || p.theme === 'dark' || p.theme === 'auto' ? p.theme : 'auto';",
  '          var resolved =',
  "            mode === 'light' || mode === 'dark'",
  '              ? mode',
  "              : window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches",
  "                ? 'dark'",
  "                : 'light';",
  '          var el = document.documentElement;',
  "          el.setAttribute('data-theme', resolved);",
  "          el.setAttribute('data-theme-mode', mode);",
  '        } catch (e) {}',
  '      })();',
  '    </script>',
].join('\n');

// Directories whose HTML should NOT get the public-site theme preinit.
const EXCLUDE_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  'playwright-report',
  'test-results',
  'reports',
  '.git',
  'admin', // separate internal app with its own shell
]);
// Sub-path fragments to skip (embeds are rendered inside third-party pages).
const EXCLUDE_FRAGMENTS = ['content/embed/'];

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.has(entry.name)) continue;
      walk(path.join(dir, entry.name), acc);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      acc.push(path.join(dir, entry.name));
    }
  }
  return acc;
}

/** Insert the snippet right after the <meta charset> tag, else after <head>. */
function inject(html) {
  const charset = html.match(/^[ \t]*<meta\s+charset=[^>]*>\s*$/im);
  if (charset) {
    const idx = html.indexOf(charset[0]) + charset[0].length;
    return html.slice(0, idx) + '\n' + SNIPPET + html.slice(idx);
  }
  const head = html.match(/<head[^>]*>/i);
  if (head) {
    const idx = html.indexOf(head[0]) + head[0].length;
    return html.slice(0, idx) + '\n' + SNIPPET + html.slice(idx);
  }
  return null; // no <head> — skip (fragment / partial)
}

const files = walk(ROOT).filter((f) => {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  return !EXCLUDE_FRAGMENTS.some((frag) => rel.includes(frag));
});

let changed = 0;
let already = 0;
let skipped = 0;
const missing = [];

for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  if (!/<head[^>]*>/i.test(html)) {
    skipped += 1;
    continue; // not a full document
  }
  if (html.includes(THEME_MARKER)) {
    already += 1;
    continue;
  }
  if (CHECK) {
    missing.push(path.relative(ROOT, file));
    continue;
  }
  const out = inject(html);
  if (out == null) {
    skipped += 1;
    continue;
  }
  fs.writeFileSync(file, out);
  changed += 1;
}

if (CHECK) {
  if (missing.length) {
    console.error(`  ❌  ${missing.length} HTML page(s) missing the theme preinit script:`);
    for (const m of missing.slice(0, 25)) console.error(`        ${m}`);
    if (missing.length > 25) console.error(`        … and ${missing.length - 25} more`);
    console.error('      Run: node scripts/node/inject-theme-preinit.js');
    process.exit(1);
  }
  console.log(`  ✅  All ${already} document(s) have the theme preinit script.`);
  process.exit(0);
}

console.log(
  `  ✅  theme preinit: ${changed} injected, ${already} already present, ${skipped} skipped (no <head>).`
);
