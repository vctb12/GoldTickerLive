#!/usr/bin/env node
/**
 * scripts/check-links.js
 * Crawls all HTML files under --dir and checks every internal HTML navigation
 * link for a corresponding file on disk.
 *
 * Usage:  node scripts/check-links.js [--dir <path>] [--fail-on-error]
 *         node scripts/check-links.js --dir dist --fail-on-error
 *
 * Exit 0 = all links resolved.
 * Exit 1 = broken links found (when --fail-on-error is set).
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ── CLI args ────────────────────────────────────────────────────────────────
const args      = process.argv.slice(2);
const dirArg    = args.indexOf('--dir');
const rootDir   = dirArg >= 0 ? path.resolve(args[dirArg + 1]) : path.resolve(__dirname, '..');
const failOnErr = args.includes('--fail-on-error');

// ── Asset extensions to skip (not navigational links) ───────────────────────
const ASSET_EXTENSIONS = [
  '.js', '.mjs', '.css', '.png', '.jpg', '.jpeg', '.gif',
  '.webp', '.svg', '.ico', '.json', '.xml', '.txt', '.pdf',
  '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.webm', '.mp3',
];

function isAsset(url) {
  const lower = url.toLowerCase().split('?')[0].split('#')[0];
  return ASSET_EXTENSIONS.some(ext => lower.endsWith(ext));
}

// ── Strip deployment base path so absolute links resolve under rootDir ───────
// Handles builds produced with base: '/Gold-Prices/' (GitHub Pages production).
const BASE_PATH_PREFIX = '/Gold-Prices/';

function normalizePath(url) {
  if (url.startsWith(BASE_PATH_PREFIX)) {
    return '/' + url.slice(BASE_PATH_PREFIX.length);
  }
  return url;
}

// ── Helpers ─────────────────────────────────────────────────────────────────
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

// Only extract href= values that look like HTML page navigation.
// Deliberately excludes <script src>, <link href> (assets), and inline styles.
const ANCHOR_HREF = /<a\s[^>]*\bhref="([^"#?][^"]*?)"/g;

function extractLinks(html) {
  const links = new Set();
  ANCHOR_HREF.lastIndex = 0;
  let m;
  while ((m = ANCHOR_HREF.exec(html)) !== null) {
    const href = m[1].split('#')[0].split('?')[0].trim();
    if (!href) continue;
    // Skip absolute URLs, data URIs, special protocols, and JS template expressions
    if (
      href.startsWith('http') || href.startsWith('//') ||
      href.startsWith('data:') || href.startsWith('mailto:') ||
      href.startsWith('tel:') || href.startsWith('javascript:') ||
      href.startsWith('vbscript:') ||
      href.includes('${')
    ) continue;
    // Skip asset files — these are not page-navigation links
    if (isAsset(href)) continue;
    links.add(href);
  }
  return [...links];
}

function resolveLink(fromFile, link) {
  const normalized = normalizePath(link);
  if (normalized.startsWith('/')) {
    // Absolute path — resolve from rootDir (the dist directory)
    return path.join(rootDir, normalized);
  }
  return path.resolve(path.dirname(fromFile), normalized);
}

function fileExists(p) {
  try {
    const stat = fs.statSync(p);
    if (stat.isFile()) return true;
    // Directory — look for index.html
    return fs.existsSync(path.join(p, 'index.html'));
  } catch { return false; }
}

// ── Main ─────────────────────────────────────────────────────────────────────
const htmlFiles = walkHtml(rootDir);
let broken = 0;
const report = [];

for (const file of htmlFiles) {
  const html    = fs.readFileSync(file, 'utf8');
  const links   = extractLinks(html);
  const relFile = path.relative(rootDir, file);

  for (const link of links) {
    const resolved = resolveLink(file, link);
    if (!fileExists(resolved)) {
      report.push({ file: relFile, link, resolved: path.relative(rootDir, resolved) });
      broken++;
    }
  }
}

console.log(`Checked ${htmlFiles.length} HTML files`);

if (broken === 0) {
  console.log(`✅  check-links: all internal links resolved.`);
  process.exit(0);
} else {
  console.error(`\n❌  check-links: ${broken} broken link(s) found:\n`);
  const byFile = {};
  for (const r of report) {
    if (!byFile[r.file]) byFile[r.file] = [];
    byFile[r.file].push(`  → ${r.link}  (expected: ${r.resolved})`);
  }
  for (const [f, issues] of Object.entries(byFile)) {
    console.error(`\n📄  ${f}`);
    for (const i of issues) console.error(i);
  }
  if (failOnErr) process.exit(1);
  else process.exit(0);
}
