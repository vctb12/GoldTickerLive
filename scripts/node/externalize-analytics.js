#!/usr/bin/env node
/**
 * scripts/node/externalize-analytics.js
 *
 * Codemod — replaces inline Google Analytics (gtag.js) and Microsoft Clarity
 * <script> blocks with a single external `<script src="/assets/analytics.js"
 * defer></script>` tag. Idempotent.
 *
 * This allows `server.js` to drop `'unsafe-inline'` from `script-src` in CSP.
 *
 * Usage:
 *   node scripts/node/externalize-analytics.js           # rewrite in place
 *   node scripts/node/externalize-analytics.js --check   # exit 1 if rewrite needed
 *
 * The script walks every `.html` file under the repo root (excluding
 * node_modules, dist, .git) and:
 *
 *   1. Removes the inline <script> block that defines `window.dataLayer` and
 *      calls `gtag(...)`.
 *   2. Removes the inline Microsoft Clarity loader IIFE.
 *   3. Removes the gtag.js remote <script async src="...gtag/js?id=..."> tag
 *      (analytics.js injects it dynamically instead).
 *   4. Inserts a single `<script src="ROOT/assets/analytics.js" defer></script>`
 *      tag near the top of <head> (right after <meta charset> if possible).
 *
 * If `<script src=".../assets/analytics.js"` is already present, the file is
 * considered up to date and the inline blocks are still removed as cleanup.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const CHECK_ONLY = process.argv.includes('--check');
const VERBOSE = process.argv.includes('--verbose') || process.argv.includes('-v');

const EXCLUDED_DIRS = new Set([
  'node_modules',
  'dist',
  '.git',
  'coverage',
  'playwright-report',
  'test-results',
]);

// ── Patterns to strip ───────────────────────────────────────────────────────
// We match broadly across whitespace variations used across 500+ hand-written
// and generated HTML files in this repo.

// Helper: body of an inline <script> that doesn't contain a closing </script>.
// Using `(?:(?!<\/script>)[\s\S])*?` prevents greedy / lazy regex from
// jumping across an adjacent unrelated <script> block (e.g. JSON-LD).
const SCRIPT_BODY = "(?:(?!<\\/script>)[\\s\\S])*?";

// 1. Google tag remote loader tag:
//    <script async src="https://www.googletagmanager.com/gtag/js?id=..."></script>
//    (optionally preceded by "<!-- Google tag (gtag.js) -->")
const REMOTE_GTAG_LOADER_RE = new RegExp(
  "[ \\t]*(?:<!--\\s*Google tag[^>]*?-->[\\t ]*\\r?\\n[ \\t]*)?" +
    "<script[^>]*\\bsrc\\s*=\\s*[\"']https:\\/\\/www\\.googletagmanager\\.com\\/gtag\\/js\\?id=[^\"']+[\"'][^>]*>" +
    "\\s*<\\/script>[\\t ]*\\r?\\n?",
  'gi',
);

// 2. Inline gtag init:
//    <script>window.dataLayer = window.dataLayer || [];function gtag(){...}...
const INLINE_GTAG_RE = new RegExp(
  "[ \\t]*<script(?![^>]*\\bsrc\\b)[^>]*>\\s*window\\.dataLayer\\s*=" +
    SCRIPT_BODY +
    "<\\/script>[\\t ]*\\r?\\n?",
  'gi',
);

// 3. Inline Clarity loader IIFE (both `type="text/javascript"` and no-attr forms).
//    Must contain the literal `'clarity'` argument string; `SCRIPT_BODY` stops
//    at the first `</script>` so JSON-LD blocks nearby are never consumed.
const INLINE_CLARITY_RE = new RegExp(
  "[ \\t]*<script(?![^>]*\\bsrc\\b)[^>]*>\\s*\\(function\\s*\\(c,\\s*l,\\s*a,\\s*r,\\s*i" +
    SCRIPT_BODY +
    "'clarity'" +
    SCRIPT_BODY +
    "<\\/script>[\\t ]*\\r?\\n?",
  'gi',
);

// 4. If we already inserted the external tag, match it so we don't insert twice.
const EXTERNAL_ANALYTICS_RE =
  /<script[^>]*\bsrc\s*=\s*["'][^"']*assets\/analytics\.js["'][^>]*>\s*<\/script>/i;

/**
 * Compute the relative href from a given HTML file to `assets/analytics.js`
 * at the repo root. Example: `countries/uae/dubai/index.html` → `../../../assets/analytics.js`.
 */
function analyticsHref(htmlFile) {
  const relDir = path.relative(ROOT, path.dirname(htmlFile));
  if (!relDir) return 'assets/analytics.js';
  const depth = relDir.split(path.sep).length;
  return '../'.repeat(depth) + 'assets/analytics.js';
}

/** Walk all *.html under ROOT, skipping EXCLUDED_DIRS. */
function walk(dir, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (EXCLUDED_DIRS.has(e.name)) continue;
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) {
      walk(abs, out);
    } else if (e.isFile() && e.name.endsWith('.html')) {
      out.push(abs);
    }
  }
}

function processFile(file) {
  const original = fs.readFileSync(file, 'utf8');

  // Short-circuit: if no gtag/clarity references AND no existing external
  // analytics tag, the file is untouched.
  if (
    !/googletagmanager\.com\/gtag\/js/i.test(original) &&
    !/window\.dataLayer/i.test(original) &&
    !/clarity\.ms/i.test(original) &&
    !EXTERNAL_ANALYTICS_RE.test(original)
  ) {
    return { file, changed: false, reason: 'no-analytics' };
  }

  let out = original;

  // Strip all three legacy blocks.
  out = out.replace(REMOTE_GTAG_LOADER_RE, '');
  out = out.replace(INLINE_GTAG_RE, '');
  out = out.replace(INLINE_CLARITY_RE, '');

  // Insert the external tag if not already present.
  if (!EXTERNAL_ANALYTICS_RE.test(out)) {
    const href = analyticsHref(file);
    const tag = `    <script src="${href}" defer></script>\n`;

    // Preferred insertion point: right after the first <meta charset ...>.
    // Use `[\t ]*\r?\n?` so we don't accidentally consume the next line's
    // leading indentation — `\s*` would eat spaces on the following line.
    const metaCharsetMatch = out.match(/<meta[^>]*charset=[^>]*>[\t ]*\r?\n?/i);
    if (metaCharsetMatch) {
      const idx = metaCharsetMatch.index + metaCharsetMatch[0].length;
      out = out.slice(0, idx) + tag + out.slice(idx);
    } else {
      // Fallback: insert right after <head>.
      const headMatch = out.match(/<head[^>]*>[\t ]*\r?\n?/i);
      if (headMatch) {
        const idx = headMatch.index + headMatch[0].length;
        out = out.slice(0, idx) + tag + out.slice(idx);
      } else {
        return { file, changed: false, reason: 'no-head-tag' };
      }
    }
  } else if (/googletagmanager\.com\/gtag\/js/i.test(out) || /clarity\.ms/i.test(out)) {
    // External tag already present but legacy blocks also remained — fall
    // through: removal above already cleaned them, so `out` differs from
    // `original`.
  }

  // Collapse runs of blank lines introduced by the removals.
  out = out.replace(/\n{3,}/g, '\n\n');

  if (out === original) {
    return { file, changed: false, reason: 'already-clean' };
  }
  return { file, changed: true, content: out };
}

function main() {
  const files = [];
  walk(ROOT, files);

  let changed = 0;
  let untouched = 0;
  let skipped = 0;
  const wouldRewrite = [];

  for (const f of files) {
    const res = processFile(f);
    if (res.changed) {
      changed++;
      wouldRewrite.push(f);
      if (!CHECK_ONLY) {
        fs.writeFileSync(f, res.content, 'utf8');
      }
      if (VERBOSE) {
        console.log(`  ${CHECK_ONLY ? 'would rewrite' : 'rewrote'}: ${path.relative(ROOT, f)}`);
      }
    } else if (res.reason === 'no-analytics') {
      skipped++;
    } else {
      untouched++;
    }
  }

  const total = files.length;
  if (CHECK_ONLY) {
    console.log(
      `[externalize-analytics:check] html=${total} needsRewrite=${changed} clean=${untouched} noAnalytics=${skipped}`,
    );
    if (changed > 0) {
      console.error(
        `\n❌ ${changed} HTML file(s) still contain inline analytics. Run:\n   node scripts/node/externalize-analytics.js\n`,
      );
      if (VERBOSE || wouldRewrite.length <= 10) {
        for (const p of wouldRewrite) console.error('   - ' + path.relative(ROOT, p));
      }
      process.exit(1);
    }
    console.log('✅  No inline analytics found. CSP can drop \'unsafe-inline\'.');
    return;
  }

  console.log(
    `[externalize-analytics] html=${total} rewrote=${changed} alreadyClean=${untouched} noAnalytics=${skipped}`,
  );
}

main();
