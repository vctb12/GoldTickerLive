#!/usr/bin/env node
/**
 * scripts/node/fix-links.js
 * Simple utility to rewrite fragile `../` hrefs in HTML files to root-safe '/'
 * Usage: node scripts/node/fix-links.js [--dir <path>] [--dry]
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const dirArg = args.indexOf('--dir');
const root = dirArg >= 0 ? path.resolve(args[dirArg + 1]) : path.resolve(__dirname, '../');
const dry = args.includes('--dry');

function walkHtml(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'dist'].includes(entry.name)) continue;
      walkHtml(full, results);
    } else if (entry.name.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

const files = walkHtml(root);
let changed = 0;

for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const updated = src.replace(/href="\.\.\/(.*?)"/g, (m, p1) => {
    return `href="/${p1.replace(/"/g, '')}"`;
  });
  if (updated !== src) {
    changed++;
    if (!dry) fs.writeFileSync(f, updated, 'utf8');
  }
}

console.log(`Processed ${files.length} HTML files; updated ${changed}`);
