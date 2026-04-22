#!/usr/bin/env node
/*
 * Sitemap coverage regression guard.
 *
 * Runs after `npm run build` and the sitemap regeneration step in CI. Exits 1
 * if any public HTML page is missing from sitemap.xml, or if sitemap.xml lists
 * a URL whose underlying file does not exist. The full SEO audit in
 * `scripts/node/seo-audit.js` already contains this logic as a report — this
 * script extracts it as a hard gate so regressions block the PR.
 *
 * Usage:
 *   node scripts/node/check-sitemap-coverage.js           # repo-root (post-build)
 *   node scripts/node/check-sitemap-coverage.js --dir dist
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const args = process.argv.slice(2);
const dirIdx = args.indexOf('--dir');
const ROOT_DIR =
  dirIdx >= 0 && args[dirIdx + 1]
    ? path.resolve(args[dirIdx + 1])
    : path.resolve(__dirname, '..', '..');

const BASE_URL = 'https://goldtickerlive.com/';

// Directories the sitemap generator skips. Keep in sync with
// scripts/node/generate-sitemap.js and scripts/node/seo-audit.js.
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.github',
  'dist',
  'tests',
  'test-results',
  'playwright-report',
  'server',
  'supabase',
  'repositories',
  'admin',
  'scripts',
  'src',
  'styles',
  'docs',
  'build',
  'data',
  'config',
]);

function findHtmlFiles(dir, base = '') {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      out.push(...findHtmlFiles(path.join(dir, entry.name), rel));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      out.push(rel);
    }
  }
  return out;
}

function urlForFile(file) {
  if (file === 'index.html') return BASE_URL;
  if (file.endsWith('/index.html')) return BASE_URL + file.slice(0, -'index.html'.length);
  return BASE_URL + file;
}

function main() {
  const sitemapPath = path.join(ROOT_DIR, 'sitemap.xml');
  if (!fs.existsSync(sitemapPath)) {
    console.error(`check-sitemap-coverage: sitemap.xml not found at ${sitemapPath}`);
    console.error('Run `node scripts/node/generate-sitemap.js` first.');
    process.exit(1);
  }

  const sitemap = fs.readFileSync(sitemapPath, 'utf8');
  const sitemapUrls = new Set([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]));

  const htmlFiles = findHtmlFiles(ROOT_DIR);
  const issues = [];

  for (const file of htmlFiles) {
    const abs = path.join(ROOT_DIR, file);
    const html = fs.readFileSync(abs, 'utf8');
    if (/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html)) continue;
    if (/<meta\s+http-equiv=["']refresh["'][^>]*>/i.test(html)) continue;
    const url = urlForFile(file);
    if (!sitemapUrls.has(url)) {
      issues.push(`Missing from sitemap: ${file}  →  ${url}`);
    }
  }

  for (const url of sitemapUrls) {
    if (!url.startsWith(BASE_URL)) {
      issues.push(`Sitemap URL has unexpected origin: ${url}`);
      continue;
    }
    const rel = url.slice(BASE_URL.length);
    let filePath;
    if (rel === '') filePath = 'index.html';
    else if (rel.endsWith('/')) filePath = rel + 'index.html';
    else filePath = rel;
    if (!fs.existsSync(path.join(ROOT_DIR, filePath))) {
      issues.push(`Sitemap URL has no underlying file: ${url}  →  ${filePath}`);
    }
  }

  if (issues.length) {
    console.error(
      `check-sitemap-coverage: ${issues.length} issue${issues.length === 1 ? '' : 's'} found`
    );
    for (const i of issues.slice(0, 50)) console.error('  - ' + i);
    if (issues.length > 50) console.error(`  ... and ${issues.length - 50} more`);
    process.exit(1);
  }

  console.log(
    `check-sitemap-coverage: ${sitemapUrls.size} sitemap URLs ↔ ${htmlFiles.length} HTML files, all aligned.`
  );
}

main();
