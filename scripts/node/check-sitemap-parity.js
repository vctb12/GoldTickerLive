#!/usr/bin/env node
/**
 * Phase 6 — Sitemap ↔ indexable HTML parity check.
 * Indexable pages (no noindex) should appear in repo-root sitemap.xml unless exempt.
 *
 * Canonical sitemap: `sitemap.xml` at repo root (build output + robots.txt).
 * `public/sitemap.xml` is a stale auxiliary copy — do not use for parity.
 *
 * Usage: node scripts/node/check-sitemap-parity.js [--fail-on-error]
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const FAIL = process.argv.includes('--fail-on-error');
const SITEMAP = path.join(ROOT, 'sitemap.xml');
const BASE = 'https://goldtickerlive.com/';

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'tests',
  'server',
  'supabase',
  'admin',
  'docs',
  'scripts',
  'build',
  'reports',
]);

/** Paths intentionally excluded from sitemap (utility, auth, generated stubs). */
const EXEMPT = [
  /^404\.html$/,
  /^offline\.html$/,
  /^dashboard\.html$/,
  /^developer\.html$/,
  /^embed\.html$/,
  /^pricing\.html$/,
  /^account\.html$/,
  /^countries\/[^/]+\/[^/]+\/index\.html$/, // city nav stubs — noindex
  /^gold-price\/[^/]+\/index\.html$/, // stub karat hubs — canonical elsewhere
  /^ar\/gold-price\/[^/]+\/index\.html$/,
  /^ar\/.*\.html$/, // AR mirrors use ?lang=ar on EN canonical URLs
  /^ar\/.*\/index\.html$/,
  /^chart\/index\.html$/,
  /^ar\/chart\/index\.html$/,
  /^content\/search\/index\.html$/,
  /^content\/markets\/index\.html$/,
  /^content\/tools\/.*\.html$/,
  /^countries\/index\.html$/,
  /^countries\/[^/]+\/cities\/[^/]+\.html$/, // legacy city HTML — hubs are indexable
  /^countries\/[^/]+\/markets\/[^/]+\.html$/,
  /^methodology\/index\.html$/, // canonical is methodology.html
  /^ar\/methodology\/index\.html$/,
];

function walkHtml(dir, base = '', out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || SKIP_DIRS.has(entry.name)) continue;
    const rel = base ? `${base}/${entry.name}` : entry.name;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(abs, rel, out);
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(rel);
  }
  return out;
}

function parseSitemap() {
  if (!fs.existsSync(SITEMAP)) return new Set();
  const xml = fs.readFileSync(SITEMAP, 'utf8');
  const urls = new Set();
  let m;
  const re = /<loc>(.*?)<\/loc>/g;
  while ((m = re.exec(xml)) !== null) urls.add(m[1].trim());
  return urls;
}

/** Sitemap URL → repo HTML file when loc shape differs from on-disk path. */
const SITEMAP_ALIASES = {
  'https://goldtickerlive.com/': 'index.html',
  'https://goldtickerlive.com/calculator/': 'calculator.html',
  'https://goldtickerlive.com/shops/': 'shops.html',
  'https://goldtickerlive.com/methodology/': 'methodology.html',
  'https://goldtickerlive.com/methodology.html': 'methodology.html',
};

function sitemapUrlToFile(url) {
  if (SITEMAP_ALIASES[url]) return SITEMAP_ALIASES[url];
  const rel = url.replace(BASE, '').replace(/\/$/, '') || 'index.html';
  if (rel.endsWith('.html')) return rel;
  return `${rel}/index.html`;
}

function toCanonicalUrl(relPath) {
  if (relPath === 'index.html') return BASE;
  if (relPath.endsWith('/index.html')) {
    return BASE + relPath.replace(/\/index\.html$/, '/');
  }
  return BASE + relPath;
}

function isNoindex(relPath) {
  const html = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  return /<meta[^>]+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html);
}

function isExempt(relPath) {
  return EXEMPT.some((re) => re.test(relPath));
}

/** Reverse map: file → sitemap directory URL */
const FILE_TO_SITEMAP_URL = Object.fromEntries(
  Object.entries(SITEMAP_ALIASES).map(([url, file]) => [file, url])
);

function isInSitemap(relPath, sitemap) {
  const url = toCanonicalUrl(relPath);
  const alt = url.replace(/\/$/, '');
  if (sitemap.has(url) || sitemap.has(alt)) return true;
  const alias = FILE_TO_SITEMAP_URL[relPath];
  return alias ? sitemap.has(alias) : false;
}

function main() {
  const sitemap = parseSitemap();
  const htmlFiles = walkHtml(ROOT);
  const missing = [];
  const orphanUrls = [];

  for (const rel of htmlFiles) {
    if (isNoindex(rel) || isExempt(rel)) continue;
    if (!isInSitemap(rel, sitemap)) {
      missing.push(rel);
    }
  }

  for (const url of sitemap) {
    const file = sitemapUrlToFile(url);
    const abs = path.join(ROOT, file);
    if (!fs.existsSync(abs)) orphanUrls.push(url);
  }

  const problems = missing.length + orphanUrls.length;
  if (problems) {
    const parts = [];
    if (missing.length) {
      parts.push(
        `Indexable HTML missing from sitemap (${missing.length}):\n${missing
          .slice(0, 30)
          .map((p) => `  - ${p}`)
          .join('\n')}${missing.length > 30 ? '\n  …' : ''}`
      );
    }
    if (orphanUrls.length) {
      parts.push(
        `Sitemap URLs with no HTML file (${orphanUrls.length}):\n${orphanUrls
          .slice(0, 20)
          .map((u) => `  - ${u}`)
          .join('\n')}`
      );
    }
    const msg = `[sitemap-parity] ${parts.join('\n\n')}`;
    if (FAIL) {
      console.error(msg);
      process.exit(1);
    }
    console.warn(msg);
    return;
  }
  console.log(`[sitemap-parity] ok (${htmlFiles.length} HTML files, ${sitemap.size} sitemap URLs)`);
}

main();

module.exports = { toCanonicalUrl, isExempt, isInSitemap, EXEMPT };
