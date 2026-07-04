#!/usr/bin/env node
/**
 * build/generateSitemap.js
 * Generates sitemap.xml from the surviving public page set.
 * Run: node build/generateSitemap.js
 *
 * 2026-07-04 radical page reduction: the countries/ and content/ trees (and the
 * insights/invest root pages) were removed, so this list is now just the kept
 * public surfaces. 404.html and offline.html are intentionally excluded, as
 * before. The canonical filesystem-walk generator is
 * scripts/node/generate-sitemap.js; this hardcoded list feeds `npm run build`.
 */

const fs   = require('fs');
const path = require('path');

const ROOT     = path.resolve(__dirname, '..');
const SITE_URL = 'https://goldtickerlive.com';
const TODAY    = new Date().toISOString().slice(0, 10);

function isNoindexFile(filePath) {
  try {
    const html = fs.readFileSync(filePath, 'utf8');
    return /<meta[^>]+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html);
  } catch {
    return false;
  }
}

function sitemapUrlToFilePath(loc) {
  const pathname = new URL(loc).pathname;
  if (pathname === '/') return path.join(ROOT, 'index.html');
  const rel = pathname.replace(/^\/+/, '');
  if (rel.endsWith('.html')) return path.join(ROOT, rel);
  return path.join(ROOT, rel, 'index.html');
}

function url(loc, changefreq, priority) {
  return `
  <url>
    <loc>${loc}</loc>
    <lastmod>${TODAY}</lastmod>
    <xhtml:link rel="alternate" hreflang="x-default" href="${loc}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${loc}"/>
    <xhtml:link rel="alternate" hreflang="ar" href="${loc}?lang=ar"/>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

const urls = [];

// Kept public pages (the 2026-07-04 reduction survivors). 404.html and
// offline.html are excluded by convention.
const staticPages = [
  { loc: `${SITE_URL}/`,                  changefreq: 'hourly',  priority: '1.0' },
  { loc: `${SITE_URL}/tracker.html`,      changefreq: 'always',  priority: '0.95' },
  { loc: `${SITE_URL}/compare.html`,      changefreq: 'always',  priority: '0.80' },
  { loc: `${SITE_URL}/heatmap.html`,      changefreq: 'daily',   priority: '0.70' },
  { loc: `${SITE_URL}/shops.html`,        changefreq: 'weekly',  priority: '0.85' },
  { loc: `${SITE_URL}/calculator.html`,   changefreq: 'monthly', priority: '0.75' },
  { loc: `${SITE_URL}/portfolio.html`,    changefreq: 'weekly',  priority: '0.60' },
  { loc: `${SITE_URL}/learn.html`,        changefreq: 'monthly', priority: '0.65' },
  { loc: `${SITE_URL}/methodology.html`,  changefreq: 'monthly', priority: '0.55' },
  { loc: `${SITE_URL}/privacy.html`,      changefreq: 'yearly',  priority: '0.30' },
  { loc: `${SITE_URL}/terms.html`,        changefreq: 'yearly',  priority: '0.30' },
];

for (const p of staticPages) {
  const filePath = sitemapUrlToFilePath(p.loc);
  if (fs.existsSync(filePath) && isNoindexFile(filePath)) continue;
  urls.push(url(p.loc, p.changefreq, p.priority));
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('')}
</urlset>`;

const outPath = path.join(ROOT, 'sitemap.xml');
fs.writeFileSync(outPath, xml, 'utf8');
console.log(`✅ sitemap.xml written with ${urls.length} URLs`);
