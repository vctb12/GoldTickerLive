#!/usr/bin/env node
/**
 * Remove eager <script async src="...adsbygoogle.js..."> tags from HTML.
 * Ad loading is handled lazily by src/components/adSlot.js when configured.
 *
 * Run: node scripts/node/strip-adsense-head-scripts.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');

const AD_SCRIPT_RE =
  /\s*<script(?:\s+[^>]*)?\s+src="https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=[^"]+"(?:\s+[^>]*)?>\s*<\/script>\s*/gi;

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        ['node_modules', 'dist', '.git', 'playwright-report', 'test-results'].includes(entry.name)
      ) {
        continue;
      }
      walk(full, acc);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      acc.push(full);
    }
  }
  return acc;
}

let changed = 0;
for (const file of walk(ROOT)) {
  const before = fs.readFileSync(file, 'utf8');
  const after = before.replace(AD_SCRIPT_RE, '\n');
  if (after !== before) {
    fs.writeFileSync(file, after, 'utf8');
    changed += 1;
    console.log('stripped', path.relative(ROOT, file));
  }
}
console.log(`Done. Updated ${changed} HTML file(s).`);
