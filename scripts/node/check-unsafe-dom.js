#!/usr/bin/env node
/**
 * Regression guard against unsafe DOM sinks.
 *
 * Fails if any tracked source file uses `.innerHTML =`, `.outerHTML =`,
 * `document.write`, `insertAdjacentHTML`, or similar, outside of the
 * allowlist below.
 *
 * The allowlist exists because some pages still render large innerHTML
 * blocks that have been manually audited and are wrapped by project-local
 * escaping helpers (`esc()` / `safeUrl()` / `escape()` from
 * `src/lib/safe-dom.js`). Removing those is tracked as follow-up work; the
 * purpose of this guard is to make sure the *count* only goes down, never up.
 *
 * Usage:
 *   node scripts/node/check-unsafe-dom.js
 *
 * Exit code 0 = no new regressions. Exit code 1 = new sink added.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');

// File globs we scan. Admin HTML and legacy pages are not yet converted to
// the safe-DOM helpers — they are tracked via the allowlist below.
const SCAN_DIRS = ['src', 'admin', 'scripts/node'];
const SCAN_EXTS = ['.js', '.mjs', '.html'];

// Directories or files to skip entirely (build output, third-party, tests).
const SKIP = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  'src/lib/safe-dom.js', // the one canonical place innerHTML is allowed
  'scripts/node/check-unsafe-dom.js', // matches itself — skip
];

// Per-file ceiling. If a file has this many or fewer matches, it passes.
// Adding a new sink to an already-listed file requires bumping its number
// and explaining why in the PR description — that review friction is the
// regression barrier.
//
// Baselined on 2026-04-22. Tightened after `innerHTML = ''` → `replaceChildren()`
// migration (no behavior change; removes HTML-parser invocation on empty
// clears). To refresh: run `node scripts/node/check-unsafe-dom.js --print`.
const BASELINE = {
  'admin/access/index.html': 1,
  'admin/analytics/index.html': 3,
  'admin/content/index.html': 4,
  'admin/index.html': 7,
  'admin/orders/index.html': 3,
  'admin/pricing/index.html': 8,
  'admin/shared/admin-shell.js': 5,
  'admin/shared/admin-utils.js': 6,
  'admin/shops/index.html': 7,
  'admin/social/index.html': 4,
  'src/components/breadcrumbs.js': 2,
  'src/components/footer.js': 2,
  'src/components/nav.js': 2,
  'src/components/spotBar.js': 1,
  'src/components/ticker.js': 1,
  'src/lib/cache.js': 1,
  'src/lib/page-hydrator.js': 3,
  'src/pages/home.js': 2,
  'src/pages/shops.js': 13,
  'src/pages/shops/filters.js': 4, // Extracted from shops.js: safe <option> building with esc()
  'src/pages/tracker-pro.js': 4,
  'src/tracker/events.js': 2,
  'src/tracker/render.js': 18,
  'src/tracker/wire.js': 3,
};

// Patterns considered "unsafe DOM sinks" for this check.
const SINK_PATTERNS = [
  /\.innerHTML\s*=/g,
  /\.outerHTML\s*=/g,
  /\.insertAdjacentHTML\s*\(/g,
  /document\.write\s*\(/g,
];

function walk(dir, acc) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full).split(path.sep).join('/');
    if (SKIP.some((s) => rel === s || rel.startsWith(s + '/'))) continue;
    if (entry.isDirectory()) {
      walk(full, acc);
    } else if (SCAN_EXTS.includes(path.extname(entry.name))) {
      acc.push(rel);
    }
  }
  return acc;
}

function countSinks(file) {
  const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
  let total = 0;
  for (const rx of SINK_PATTERNS) {
    const matches = text.match(rx);
    if (matches) total += matches.length;
  }
  return total;
}

function main() {
  const files = [];
  for (const d of SCAN_DIRS) walk(path.join(ROOT, d), files);

  const counts = {};
  for (const f of files) {
    const n = countSinks(f);
    if (n > 0) counts[f] = n;
  }

  if (process.argv.includes('--print')) {
    for (const f of Object.keys(counts).sort()) {
      process.stdout.write(`  '${f}': ${counts[f]},\n`);
    }
    return 0;
  }

  const regressions = [];
  for (const [file, count] of Object.entries(counts)) {
    const allowed = BASELINE[file] ?? 0;
    if (count > allowed) {
      regressions.push({ file, count, allowed });
    }
  }

  // Also warn when a file drops below its baseline — that is great, but the
  // baseline should be tightened so further regressions are caught.
  const tighten = [];
  for (const [file, allowed] of Object.entries(BASELINE)) {
    const actual = counts[file] ?? 0;
    if (actual < allowed) tighten.push({ file, actual, allowed });
  }

  if (regressions.length > 0) {
    console.error('\n❌ Unsafe DOM sink regression detected:\n');
    for (const r of regressions) {
      console.error(`   ${r.file}: ${r.count} sinks (allowed: ${r.allowed})`);
    }
    console.error(
      '\nEither remove the new sink or, if it is provably safe (e.g. built from' +
        ' escape()-wrapped fragments), bump the baseline in' +
        ' scripts/node/check-unsafe-dom.js and justify the bump in the PR.\n'
    );
    process.exit(1);
  }

  if (tighten.length > 0) {
    console.log('✅ No new unsafe DOM sinks.');
    console.log(
      '\nHeads up: the following files have *fewer* sinks than their baseline.' +
        ' Please tighten the BASELINE map in scripts/node/check-unsafe-dom.js' +
        ' so the improvement is locked in:\n'
    );
    for (const t of tighten) {
      console.log(`   ${t.file}: now ${t.actual}, baseline ${t.allowed}`);
    }
  } else {
    console.log('✅ No new unsafe DOM sinks, baseline is tight.');
  }
}

main();
