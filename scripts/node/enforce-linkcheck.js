#!/usr/bin/env node
/*
 * phx/22: CI enforcement for link-check.
 * Reads a linkinator JSON report and exits non-zero if any internal link is
 * BROKEN. External links are already skipped by the npm script regex, so any
 * failure here is a repo-level bug that must block merge.
 *
 * Usage: node scripts/node/enforce-linkcheck.js [path/to/report.json]
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const reportPath = process.argv[2] || path.resolve('reports/links-dist.json');

if (!fs.existsSync(reportPath)) {
  console.error(`[enforce-linkcheck] report not found: ${reportPath}`);
  process.exit(2);
}

let data;
try {
  data = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
} catch (err) {
  console.error(`[enforce-linkcheck] failed to parse report: ${err.message}`);
  process.exit(2);
}

const links = Array.isArray(data.links) ? data.links : [];
const broken = links.filter((l) => l && l.state === 'BROKEN');

if (broken.length === 0) {
  console.log(
    `[enforce-linkcheck] OK — ${links.length} links scanned, 0 broken (report: ${reportPath}).`
  );
  process.exit(0);
}

console.error(`[enforce-linkcheck] FAIL — ${broken.length} broken link(s):`);
for (const l of broken.slice(0, 50)) {
  console.error(`  - ${l.status || '???'} ${l.url}${l.parent ? ' (from ' + l.parent + ')' : ''}`);
}
if (broken.length > 50) console.error(`  ... and ${broken.length - 50} more`);
process.exit(1);
