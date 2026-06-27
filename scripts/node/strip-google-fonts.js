#!/usr/bin/env node
/**
 * strip-google-fonts.js
 *
 * Removes duplicate Google Fonts preconnect/stylesheet tags from HTML shells.
 * Self-hosted fonts load via styles/partials/fonts.css in global.css.
 *
 * Run: node scripts/node/strip-google-fonts.js
 * Dry-run: node scripts/node/strip-google-fonts.js --dry-run
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const dryRun = process.argv.includes('--dry-run');
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'playwright-report', 'test-results']);

function walkHtml(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(full, acc);
    else if (entry.name.endsWith('.html')) acc.push(full);
  }
  return acc;
}

function stripGoogleFonts(html) {
  let next = html;
  const patterns = [
    /\s*<link[^>]*href="https:\/\/fonts\.googleapis\.com[^"]*"[^>]*>\s*/gi,
    /\s*<link[^>]*rel="preconnect"[^>]*href="https:\/\/fonts\.googleapis\.com"[^>]*>\s*/gi,
    /\s*<link[^>]*rel="preconnect"[^>]*href="https:\/\/fonts\.gstatic\.com"[^>]*crossorigin[^>]*>\s*/gi,
    /\s*<link[^>]*rel="preload"[^>]*href="https:\/\/fonts\.googleapis\.com[^"]*"[^>]*>\s*/gi,
  ];
  for (const re of patterns) next = next.replace(re, '\n');
  return next.replace(/\n{3,}/g, '\n\n');
}

const files = walkHtml(ROOT);
let changed = 0;

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  if (!original.includes('fonts.googleapis.com') && !original.includes('fonts.gstatic.com')) continue;
  const stripped = stripGoogleFonts(original);
  if (stripped === original) continue;
  changed += 1;
  const rel = path.relative(ROOT, file);
  if (dryRun) console.log(`[dry-run] would strip fonts from ${rel}`);
  else {
    fs.writeFileSync(file, stripped, 'utf8');
    console.log(`stripped fonts from ${rel}`);
  }
}

console.log(`${dryRun ? 'Would update' : 'Updated'} ${changed} HTML file(s).`);
