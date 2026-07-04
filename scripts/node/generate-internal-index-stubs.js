#!/usr/bin/env node

/**
 * scripts/node/generate-internal-index-stubs.js
 *
 * Phase 2 of docs/plans/2026-07-01_20-phase-design-functionality-page-cleanup-revamp.md:
 * 30 internal directories (config/, data/, docs/, scripts/, server/, src/,
 * styles/, supabase/) each carried a hand-duplicated, byte-for-byte
 * "Not a public page" `index.html` — a `noindex,nofollow` landing so a bare
 * visit to e.g. /server/ gets a friendly message instead of a raw 404. None
 * of these are product pages; they only differ by their canonical URL.
 *
 * This generator replaces the 30 committed duplicates with one template.
 * The stubs are (re)written to disk on demand — wired into `predev`,
 * `build`, and `validate` — and are gitignored, so they no longer count
 * against the repo's tracked HTML total.
 *
 * Usage:
 *   node scripts/node/generate-internal-index-stubs.js          # (re)write all stubs
 *   node scripts/node/generate-internal-index-stubs.js --check  # CI: fail if any is missing/stale
 */

'use strict';

const fs = require('fs');
const path = require('path');

const { SNIPPET: THEME_PREINIT } = require('./inject-theme-preinit.js');

const ROOT = path.resolve(__dirname, '../..');
const CHECK = process.argv.includes('--check');

// Directories that need a friendly noindex index.html guard. Keep in sync
// with reports/baseline-2026-07/html-count-summary.md "Phantom stub paths".
const STUB_DIRS = [
  'config',
  'config/twitter_bot',
  'data',
  'docs',
  'scripts',
  'scripts/node',
  'scripts/python',
  'scripts/python/utils',
  'server',
  'server/data',
  'server/lib',
  'server/lib/admin',
  'server/repositories',
  'server/routes',
  'server/routes/admin',
  'server/services',
  'src',
  'src/components',
  'src/config',
  'src/lib',
  'src/pages',
  'src/routes',
  'src/search',
  'src/seo',
  'src/social',
  'src/tracker',
  'src/utils',
  'styles',
  'styles/pages',
  'supabase',
];

function renderStub(dir) {
  const url = `https://goldtickerlive.com/${dir}/`;
  return `<!doctype html>
<html lang="en" dir="ltr">
  <head>
    <meta charset="UTF-8" />
${THEME_PREINIT}
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-Content-Type-Options" content="nosniff" />
    <meta name="referrer" content="strict-origin-when-cross-origin" />
    <meta name="robots" content="noindex,nofollow" />
    <title>Not a public page — Gold Ticker Live</title>
    <meta name="description" content="This path is an internal directory index and is not intended for end users." />
    <link rel="canonical" href="${url}" />

    <meta property="og:title" content="Not a public page — Gold Ticker Live" />
    <meta property="og:description" content="This path is an internal directory index and is not intended for end users." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${url}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="Not a public page — Gold Ticker Live" />
    <meta name="twitter:description" content="This path is an internal directory index and is not intended for end users." />

    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
             max-width: 720px; margin: 2rem auto; padding: 0 1rem; line-height: 1.55; color: #1a1a1a; }
      h1 { font-size: 1.6rem; margin: 0.6rem 0 1rem; }
      .stub-breadcrumbs { font-size: 0.9rem; color: #555; margin-bottom: 0.5rem; }
      .stub-breadcrumbs a { color: #555; text-decoration: none; }
      .stub-breadcrumbs a:hover { text-decoration: underline; }
      .stub-lead { margin: 0 0 1.25rem; }
      .stub-links { list-style: none; padding: 0; }
      .stub-links li { margin-bottom: 0.9rem; }
      .stub-links a { display: block; padding: 0.85rem 1rem; background: #f7f6f1; color: #1a1a1a;
                      border: 1px solid #e4dfcf; border-radius: 10px; text-decoration: none; }
      .stub-links a:hover, .stub-links a:focus { background: #efe9d4; border-color: #c9b26c; }
      .stub-related, .stub-lang { font-size: 0.9rem; color: #555; margin-top: 1.2rem; }
      a { color: #7a5a00; }
    </style>
  </head>
  <body>
<main>
      <h1>Not a public page</h1>
      <p>This URL is an internal directory listing and has no public content.
        Continue to the <a href="/">Gold Ticker Live home page</a> instead.</p>
    </main>
  </body>
</html>
`;
}

let stale = 0;
let written = 0;

for (const dir of STUB_DIRS) {
  const outPath = path.join(ROOT, dir, 'index.html');
  const expected = renderStub(dir);
  const existing = fs.existsSync(outPath) ? fs.readFileSync(outPath, 'utf8') : null;

  if (existing === expected) continue;

  if (CHECK) {
    console.error(`✖ ${dir}/index.html is missing or out of date.`);
    stale++;
    continue;
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, expected);
  written++;
}

if (CHECK) {
  if (stale > 0) {
    console.error(
      `\n${stale} internal stub page(s) out of date. Run: node scripts/node/generate-internal-index-stubs.js`
    );
    process.exit(1);
  }
  console.log(`✓ All ${STUB_DIRS.length} internal stub pages are up to date.`);
} else {
  console.log(
    `✓ Generated ${STUB_DIRS.length} internal stub pages (${written} written, ${STUB_DIRS.length - written} already current).`
  );
}
