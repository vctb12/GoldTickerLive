#!/usr/bin/env node
/**
 * scripts/check-links.js
 * Crawls all HTML files in the repo and checks every internal href/src
 * for a corresponding file on disk.
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

const INTERNAL_HREF  = /href="([^"#?]+(?:\.html|\.js|\.css|\/)[^"#?]*)"/g;
const INTERNAL_SRC   = /src="([^"]+)"/g;
const LINK_HREF      = /<link[^>]+href="([^"]+)"/g;

function extractLinks(html) {
  const links = new Set();
  for (const re of [INTERNAL_HREF, INTERNAL_SRC, LINK_HREF]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(html)) !== null) {
      const href = m[1];
      // Skip absolute URLs, data URIs, mailto, tel, anchors
      if (href.startsWith('http') || href.startsWith('//') ||
          href.startsWith('data:') || href.startsWith('mailto:') ||
          href.startsWith('tel:') || href === '#') continue;
      links.add(href.split('#')[0].split('?')[0]);
    }
  }
  return [...links].filter(Boolean);
}

function resolveLink(fromFile, link) {
  if (link.startsWith('/')) {
    // Absolute path — resolve from rootDir
    return path.join(rootDir, link);
  }
  return path.resolve(path.dirname(fromFile), link);
}

function fileExists(p) {
  try {
    const stat = fs.statSync(p);
    if (stat.isFile()) return true;
    // Directory — look for index.html
    const idx = path.join(p, 'index.html');
    return fs.existsSync(idx);
  } catch { return false; }
}

// ── Main ─────────────────────────────────────────────────────────────────────
const htmlFiles = walkHtml(rootDir);
let broken = 0;
const report = [];

for (const file of htmlFiles) {
  const html  = fs.readFileSync(file, 'utf8');
  const links = extractLinks(html);
  const relFile = path.relative(rootDir, file);

  for (const link of links) {
    const resolved = resolveLink(file, link);
    if (!fileExists(resolved)) {
      report.push({ file: relFile, link, resolved: path.relative(rootDir, resolved) });
      broken++;
    }
  }
}

if (broken === 0) {
  console.log(`✅  check-links: all internal links resolved in ${htmlFiles.length} HTML files.`);
  process.exit(0);
} else {
  console.error(`❌  check-links: ${broken} broken link(s) found in ${htmlFiles.length} HTML files:\n`);
  const byFile = {};
  for (const r of report) {
    if (!byFile[r.file]) byFile[r.file] = [];
    byFile[r.file].push(`  → ${r.link}  (expected: ${r.resolved})`);
  }
  for (const [f, issues] of Object.entries(byFile)) {
    console.error(`📄  ${f}`);
    for (const i of issues) console.error(i);
  }
  if (failOnErr) process.exit(1);
  else process.exit(0);
}
