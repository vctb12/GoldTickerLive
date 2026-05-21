#!/usr/bin/env node
/**
 * scripts/node/generate-baseline-inventory.js
 *
 * Phase 0 baseline capture for the Full Site Revamp.
 *
 * Produces:
 *   reports/baseline-2026-05/page-inventory.json
 *   reports/baseline-2026-05/click-inventory.json
 *
 * page-inventory.json  — public HTML surfaces in this repo (excludes
 *                        server/admin/docs/tests/build artifacts): path,
 *                        bytes, lastCommitSha, inboundLinkCount, inSitemap
 * click-inventory.json — every <a>, <button>, <form>, [role="button"],
 *                        [data-action] across all scanned public pages:
 *                        page, selector, textEN, textAR, hrefOrAction,
 *                        firesAnalyticsEvent
 *
 * Usage: node scripts/node/generate-baseline-inventory.js
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const OUT_DIR = path.join(ROOT, 'reports', 'baseline-2026-05');

const SKIP_DIRS = new Set([
  'dist',
  'node_modules',
  '.git',
  'server',
  'tests',
  'docs',
  'supabase',
  'build',
  'scripts',
  'config',
  'data',
  'assets',
  '.github',
  '.vscode',
  '.husky',
  'admin',
]);

// ─── helpers ────────────────────────────────────────────────────────────────

function walkHtml(dir, results = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return results;
  }
  for (const e of entries) {
    if (e.name.startsWith('.') || SKIP_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walkHtml(full, results);
    else if (e.name.endsWith('.html')) results.push(full);
  }
  return results;
}

function getLastCommitSha(filePath) {
  try {
    const rel = path.relative(ROOT, filePath);
    return execSync(`git -C "${ROOT}" log -1 --format="%H" -- "${rel}"`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return null;
  }
}

function parseSitemapUrls(sitemapPath) {
  const urls = new Set();
  if (!fs.existsSync(sitemapPath)) return urls;
  const xml = fs.readFileSync(sitemapPath, 'utf8');
  const re = /<loc>(.*?)<\/loc>/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    urls.add(m[1].trim());
  }
  return urls;
}

// Build a map: relPath -> inbound link count
function buildInboundLinkMap(htmlFiles) {
  const counts = {};
  for (const f of htmlFiles) counts[path.relative(ROOT, f)] = 0;

  const hrefRe = /href=["']([^"'#?]+)/g;
  for (const f of htmlFiles) {
    let html;
    try {
      html = fs.readFileSync(f, 'utf8');
    } catch {
      continue;
    }
    let m;
    while ((m = hrefRe.exec(html)) !== null) {
      const raw = m[1];
      // normalise to a relative path that might match a file
      const candidates = [];
      if (raw.startsWith('/')) {
        // e.g. /tracker/ → tracker/index.html or tracker.html
        const stripped = raw.replace(/^\//, '').replace(/\/$/, '');
        candidates.push(stripped + '.html');
        candidates.push(stripped + '/index.html');
        candidates.push(stripped);
      } else {
        candidates.push(raw);
      }
      for (const c of candidates) {
        if (c in counts) counts[c]++;
      }
    }
  }
  return counts;
}

// Naively extract visible text from an element's opening tag region
// (extractText kept for future phases that may need it)

// Detect if an element fires an analytics event:
// - has data-gtm-event, data-event, data-analytics, data-action
// - or calls gtag / gtmEvent in nearby inline handlers
function detectsAnalytics(attrBlock) {
  return (
    /data-(gtm-event|event|analytics|action|track)=/i.test(attrBlock) ||
    /onclick=["'][^"']*(?:gtag|ga\(|dataLayer|trackEvent|analytics)/i.test(attrBlock)
  );
}

function getAttribute(attrBlock, attrName) {
  const re = new RegExp(`${attrName}=["']([^"']*)["']`, 'i');
  const m = attrBlock.match(re);
  return m ? m[1] : null;
}

function extractInteractiveElements(filePath, relPath) {
  let html;
  try {
    html = fs.readFileSync(filePath, 'utf8');
  } catch {
    return [];
  }

  const elements = [];

  // Patterns: opening tags for interactive elements
  const patterns = [{ tag: 'a' }, { tag: 'button' }, { tag: 'form' }];

  // Also [role="button"] and [data-action] — handled via regex on all tags
  const roleButtonRe = /<([a-z][a-z0-9]*)[^>]*role=["']button["'][^>]*>/gi;
  const dataActionRe = /<([a-z][a-z0-9]*)[^>]*data-action=["'][^"']*["'][^>]*>/gi;

  function pushElement(tag, attrBlock, position, extraType) {
    const href = getAttribute(attrBlock, 'href') || getAttribute(attrBlock, 'action') || null;
    const dataAction = getAttribute(attrBlock, 'data-action');
    const hrefOrAction = href || dataAction || null;

    // Extract some visible text (rough heuristic: chars after the tag close up to </tag>)
    const tagCloseIdx = html.indexOf('>', position);
    const closeTag = `</${tag}>`;
    const closeIdx = html.indexOf(closeTag, tagCloseIdx);
    const innerHtml = closeIdx > -1 ? html.slice(tagCloseIdx + 1, closeIdx) : '';
    const visibleText = innerHtml
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120);

    // Split EN/AR heuristically: Arabic characters
    const arabicRe = /[\u0600-\u06FF]/;
    const hasArabic = arabicRe.test(visibleText);
    const textEN = hasArabic ? '' : visibleText;
    const textAR = hasArabic ? visibleText : '';

    const firesAnalytics = detectsAnalytics(attrBlock);

    const selector = getAttribute(attrBlock, 'id')
      ? `${tag}#${getAttribute(attrBlock, 'id')}`
      : getAttribute(attrBlock, 'data-testid')
        ? `${tag}[data-testid="${getAttribute(attrBlock, 'data-testid')}"]`
        : getAttribute(attrBlock, 'class')
          ? `${tag}.${getAttribute(attrBlock, 'class').split(/\s+/)[0]}`
          : extraType
            ? `${tag}[${extraType}]`
            : tag;

    elements.push({
      page: relPath,
      selector,
      textEN,
      textAR,
      hrefOrAction,
      firesAnalyticsEvent: firesAnalytics,
    });
  }

  // Standard interactive tags
  for (const { tag } of patterns) {
    const tagRe = new RegExp(`<${tag}([^>]*)>`, 'gi');
    let m;
    while ((m = tagRe.exec(html)) !== null) {
      pushElement(tag, m[1] || '', m.index, null);
    }
  }

  // [role="button"] on non-button tags
  let m;
  while ((m = roleButtonRe.exec(html)) !== null) {
    const tag = m[1].toLowerCase();
    if (tag !== 'button') {
      pushElement(tag, m[0], m.index, 'role=button');
    }
  }

  // [data-action] on non-button/a/form tags
  while ((m = dataActionRe.exec(html)) !== null) {
    const tag = m[1].toLowerCase();
    if (!['button', 'a', 'form'].includes(tag)) {
      pushElement(tag, m[0], m.index, 'data-action');
    }
  }

  return elements;
}

// ─── main ────────────────────────────────────────────────────────────────────

fs.mkdirSync(OUT_DIR, { recursive: true });

const htmlFiles = walkHtml(ROOT);
console.log(`Found ${htmlFiles.length} HTML files.`);

// Generate sitemap if needed
const sitemapSrc = path.join(ROOT, 'sitemap.xml');
if (!fs.existsSync(sitemapSrc)) {
  console.log('Generating sitemap.xml ...');
  try {
    execSync(`node "${path.join(ROOT, 'build', 'generateSitemap.js')}"`, {
      cwd: ROOT,
      encoding: 'utf8',
    });
  } catch (e) {
    console.warn('Could not generate sitemap.xml:', e.message);
  }
}

const sitemapUrls = parseSitemapUrls(sitemapSrc);
console.log(`Sitemap has ${sitemapUrls.size} URLs.`);

const inboundMap = buildInboundLinkMap(htmlFiles);
const BASE_URL = 'https://goldtickerlive.com/';

// ─── page-inventory.json ────────────────────────────────────────────────────

const pageInventory = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  phase: 'Phase 0 — baseline lock 2026-05',
  totalHtmlFiles: htmlFiles.length,
  records: [],
};

for (const filePath of htmlFiles) {
  const relPath = path.relative(ROOT, filePath);
  const stat = fs.statSync(filePath);
  const lastCommitSha = getLastCommitSha(filePath);

  // Determine the canonical URL for this file
  let canonicalUrl;
  if (relPath === 'index.html') {
    canonicalUrl = BASE_URL;
  } else if (relPath.endsWith('/index.html')) {
    canonicalUrl = BASE_URL + relPath.replace(/\/index\.html$/, '/');
  } else {
    canonicalUrl = BASE_URL + relPath;
  }

  const inSitemap =
    sitemapUrls.has(canonicalUrl) || sitemapUrls.has(canonicalUrl.replace(/\/$/, ''));

  pageInventory.records.push({
    path: relPath,
    bytes: stat.size,
    lastCommitSha,
    inboundLinkCount: inboundMap[relPath] || 0,
    inSitemap,
    canonicalUrl,
  });
}

// Sort by path for stable output
pageInventory.records.sort((a, b) => a.path.localeCompare(b.path));

const pageInventoryPath = path.join(OUT_DIR, 'page-inventory.json');
fs.writeFileSync(pageInventoryPath, JSON.stringify(pageInventory, null, 2));
console.log(`✅ page-inventory.json written (${pageInventory.records.length} pages)`);

// ─── click-inventory.json ───────────────────────────────────────────────────

const clickInventory = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  phase: 'Phase 0 — baseline lock 2026-05',
  totalElements: 0,
  totalWithAnalytics: 0,
  totalWithoutAnalytics: 0,
  records: [],
};

for (const filePath of htmlFiles) {
  const relPath = path.relative(ROOT, filePath);
  const elements = extractInteractiveElements(filePath, relPath);
  clickInventory.records.push(...elements);
}

clickInventory.totalElements = clickInventory.records.length;
clickInventory.totalWithAnalytics = clickInventory.records.filter(
  (r) => r.firesAnalyticsEvent
).length;
clickInventory.totalWithoutAnalytics =
  clickInventory.totalElements - clickInventory.totalWithAnalytics;

const clickInventoryPath = path.join(OUT_DIR, 'click-inventory.json');
fs.writeFileSync(clickInventoryPath, JSON.stringify(clickInventory, null, 2));
console.log(
  `✅ click-inventory.json written (${clickInventory.totalElements} elements, ` +
    `${clickInventory.totalWithAnalytics} with analytics)`
);
