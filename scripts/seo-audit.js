#!/usr/bin/env node
/**
 * SEO Audit Script — validates metadata, canonicals, hreflang, and structured data
 * across all public HTML pages in the Gold-Prices repository.
 *
 * Usage:  node scripts/seo-audit.js
 * Output: Markdown-formatted audit report to stdout.
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const BASE_URL = 'https://vctb12.github.io/Gold-Prices/';

// ─────────────────────────────────────────────────────────────────────
// Discover all public HTML files (skip admin, node_modules, dist, tests)
// ─────────────────────────────────────────────────────────────────────

function findHtmlFiles(dir, base = '') {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = path.join(base, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'dist', 'tests', 'server', 'supabase', 'repositories', '.github'].includes(entry.name)) continue;
      results.push(...findHtmlFiles(path.join(dir, entry.name), rel));
    } else if (entry.name.endsWith('.html') && entry.name !== 'admin.html') {
      results.push(rel);
    }
  }
  return results;
}

// ─────────────────────────────────────────────────────────────────────
// Extract metadata from HTML content
// ─────────────────────────────────────────────────────────────────────

function extract(html, file) {
  const title = (html.match(/<title>(.*?)<\/title>/s) || [])[1] || '❌ MISSING';
  const desc = (html.match(/<meta\s+name="description"\s+content="([^"]*)"/s) || [])[1] || '❌ MISSING';
  const canonical = (html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/s) || [])[1] || '❌ MISSING';
  const hreflangCount = (html.match(/hreflang=/g) || []).length;
  // Detect noindex — skip full SEO checks for private/utility pages
  const isNoindex = /<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html);
  const ogTitle = (html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/s) || [])[1] || '—';
  const twitterCard = (html.match(/<meta\s+name="twitter:card"\s+content="([^"]*)"/s) || [])[1] || '—';

  // JSON-LD schemas
  const schemas = [];
  const jsonLdMatches = html.matchAll(/<script\s+type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g);
  for (const m of jsonLdMatches) {
    try {
      const obj = JSON.parse(m[1]);
      schemas.push(obj['@type'] || 'unknown');
    } catch {
      schemas.push('⚠ invalid JSON');
    }
  }

  // Expected canonical
  // For index.html files in subdirectories, canonical is the directory URL (no index.html).
  let expectedCanonical;
  if (file === 'index.html') {
    expectedCanonical = BASE_URL;
  } else if (file.endsWith('/index.html')) {
    // directory page: canonical is the directory URL
    expectedCanonical = BASE_URL + file.slice(0, -'index.html'.length);
  } else {
    expectedCanonical = BASE_URL + file;
  }

  const issues = [];
  // Skip detailed SEO checks for noindex pages (admin, offline, embed, etc.)
  if (!isNoindex) {
    if (title === '❌ MISSING') issues.push('Missing title');
    if (desc === '❌ MISSING') issues.push('Missing meta description');
    if (canonical === '❌ MISSING') issues.push('Missing canonical');
    if (canonical !== '❌ MISSING' && canonical !== expectedCanonical) {
      issues.push(`Canonical mismatch: got "${canonical}", expected "${expectedCanonical}"`);
    }
    if (hreflangCount === 0) issues.push('No hreflang tags in HTML');
    if (hreflangCount > 0 && hreflangCount < 3) issues.push(`Only ${hreflangCount} hreflang tags (expected 3: x-default, en, ar)`);
    if (schemas.length === 0) issues.push('No JSON-LD structured data');
  }

  return { file, title, desc, canonical, hreflangCount, ogTitle, twitterCard, schemas, issues, isNoindex };
}

// ─────────────────────────────────────────────────────────────────────
// Sitemap validation
// ─────────────────────────────────────────────────────────────────────

function validateSitemap(htmlFiles) {
  const sitemapPath = path.join(REPO_ROOT, 'sitemap.xml');
  if (!fs.existsSync(sitemapPath)) return ['❌ sitemap.xml not found'];

  const sitemap = fs.readFileSync(sitemapPath, 'utf-8');
  const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
  const sitemapUrlSet = new Set(sitemapUrls);
  const issues = [];

  // Check if all HTML pages are in sitemap (skip noindex pages)
  for (const file of htmlFiles) {
    const content = fs.readFileSync(path.join(REPO_ROOT, file), 'utf-8');
    if (/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(content)) continue;
    // Build canonical URL for the file (same logic as extract())
    let url;
    if (file === 'index.html') {
      url = BASE_URL;
    } else if (file.endsWith('/index.html')) {
      url = BASE_URL + file.slice(0, -'index.html'.length); // directory URL with trailing slash
    } else {
      url = BASE_URL + file;
    }
    if (!sitemapUrlSet.has(url)) {
      issues.push(`Page NOT in sitemap: ${file}`);
    }
  }

  // Check for sitemap URLs that don't have matching files
  for (const url of sitemapUrls) {
    if (!url.startsWith(BASE_URL)) {
      issues.push(`Sitemap URL has unexpected origin: ${url}`);
      continue;
    }
    const relPath = url.slice(BASE_URL.length);
    // Handle trailing-slash directory URLs → look for index.html
    let filePath;
    if (relPath === '') {
      filePath = 'index.html';
    } else if (relPath.endsWith('/')) {
      filePath = relPath + 'index.html';
    } else {
      filePath = relPath;
    }
    if (!htmlFiles.includes(filePath)) {
      issues.push(`Sitemap URL has no file: ${url}`);
    }
  }

  return issues;
}

// ─────────────────────────────────────────────────────────────────────
// robots.txt validation
// ─────────────────────────────────────────────────────────────────────

function validateRobots() {
  const robotsPath = path.join(REPO_ROOT, 'robots.txt');
  if (!fs.existsSync(robotsPath)) return ['❌ robots.txt not found'];

  const robots = fs.readFileSync(robotsPath, 'utf-8');
  const issues = [];

  if (!robots.includes('Sitemap:')) issues.push('robots.txt missing Sitemap directive');
  if (!robots.includes(BASE_URL + 'sitemap.xml')) issues.push('robots.txt sitemap URL mismatch');

  return issues;
}

// ─────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────

const htmlFiles = findHtmlFiles(REPO_ROOT);
const results = htmlFiles.map(file => {
  const content = fs.readFileSync(path.join(REPO_ROOT, file), 'utf-8');
  return extract(content, file);
});

// ── Report ──

console.log('# SEO Audit Report');
console.log(`Generated: ${new Date().toISOString()}\n`);

console.log('## Summary');
console.log(`- **Total pages:** ${results.length}`);
console.log(`- **Pages with issues:** ${results.filter(r => r.issues.length > 0).length}`);
console.log(`- **Pages with all metadata:** ${results.filter(r => r.issues.length === 0).length}\n`);

// Page table
console.log('## Page Metadata');
console.log('| File | Title | Canonical | Hreflang | OG | Schemas | Issues |');
console.log('|------|-------|-----------|----------|-----|---------|--------|');
for (const r of results) {
  const titleOk = r.title !== '❌ MISSING' ? '✅' : '❌';
  const canonOk = r.canonical !== '❌ MISSING' ? '✅' : '❌';
  const hrefOk = r.hreflangCount >= 3 ? '✅' : (r.hreflangCount > 0 ? '⚠' : '❌');
  const ogOk = r.ogTitle !== '—' ? '✅' : '—';
  const schemaList = r.schemas.length > 0 ? r.schemas.join(', ') : '—';
  const issueCount = r.issues.length > 0 ? `⚠ ${r.issues.length}` : '✅';
  console.log(`| ${r.file} | ${titleOk} | ${canonOk} | ${hrefOk} | ${ogOk} | ${schemaList} | ${issueCount} |`);
}

// Issues
const allIssues = results.filter(r => r.issues.length > 0);
if (allIssues.length > 0) {
  console.log('\n## Issues Found');
  for (const r of allIssues) {
    console.log(`\n### ${r.file}`);
    for (const issue of r.issues) {
      console.log(`- ${issue}`);
    }
  }
}

// Sitemap
console.log('\n## Sitemap Validation');
const sitemapIssues = validateSitemap(htmlFiles);
if (sitemapIssues.length === 0) {
  console.log('✅ All pages found in sitemap, all sitemap URLs have matching files.');
} else {
  for (const issue of sitemapIssues) {
    console.log(`- ${issue}`);
  }
}

// Robots
console.log('\n## robots.txt Validation');
const robotsIssues = validateRobots();
if (robotsIssues.length === 0) {
  console.log('✅ robots.txt is valid and references the correct sitemap.');
} else {
  for (const issue of robotsIssues) {
    console.log(`- ${issue}`);
  }
}

// Exit code
const totalIssues = allIssues.reduce((sum, r) => sum + r.issues.length, 0) + sitemapIssues.length + robotsIssues.length;
if (totalIssues > 0) {
  console.log(`\n⚠ Total issues: ${totalIssues}`);
}
process.exit(totalIssues > 0 ? 1 : 0);
