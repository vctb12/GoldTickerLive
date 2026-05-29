#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const SITE = 'https://goldtickerlive.com';
const TODAY = new Date().toISOString().slice(0, 10);

const urls = [
  { path: '/', priority: 1.0, changefreq: 'always' },
  { path: '/ar/', priority: 1.0, changefreq: 'always' },
  { path: '/chart/', priority: 0.9, changefreq: 'daily' },
  { path: '/ar/chart/', priority: 0.9, changefreq: 'daily' },
  { path: '/calculator/', priority: 0.8, changefreq: 'weekly' },
  { path: '/ar/calculator/', priority: 0.8, changefreq: 'weekly' },
  { path: '/gold-price/24k/', priority: 0.9, changefreq: 'daily' },
  { path: '/gold-price/22k/', priority: 0.9, changefreq: 'daily' },
  { path: '/gold-price/21k/', priority: 0.9, changefreq: 'daily' },
  { path: '/gold-price/18k/', priority: 0.9, changefreq: 'daily' },
  { path: '/ar/gold-price/24k/', priority: 0.9, changefreq: 'daily' },
  { path: '/ar/gold-price/22k/', priority: 0.9, changefreq: 'daily' },
  { path: '/ar/gold-price/21k/', priority: 0.9, changefreq: 'daily' },
  { path: '/ar/gold-price/18k/', priority: 0.9, changefreq: 'daily' },
  { path: '/shops/', priority: 0.7, changefreq: 'weekly' },
  { path: '/ar/shops/', priority: 0.7, changefreq: 'weekly' },
  { path: '/methodology/', priority: 0.5, changefreq: 'monthly' },
  { path: '/ar/methodology/', priority: 0.5, changefreq: 'monthly' },
];

function pairFor(pathname) {
  if (pathname.startsWith('/ar/')) {
    return {
      en: pathname.replace(/^\/ar/, ''),
      ar: pathname,
      xDefault: pathname.replace(/^\/ar/, ''),
    };
  }
  return {
    en: pathname,
    ar: `/ar${pathname === '/' ? '/' : pathname}`,
    xDefault: pathname,
  };
}

function generateSitemapXml(entries = urls, today = TODAY) {
  const body = entries
    .map((entry) => {
      const pair = pairFor(entry.path);
      const loc = `${SITE}${entry.path}`;
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${entry.changefreq}</changefreq>\n    <priority>${entry.priority.toFixed(1)}</priority>\n    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE}${pair.xDefault}"/>\n    <xhtml:link rel="alternate" hreflang="en" href="${SITE}${pair.en}"/>\n    <xhtml:link rel="alternate" hreflang="ar" href="${SITE}${pair.ar}"/>\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${body}\n</urlset>\n`;
}

function writeSitemap(xml, outputPath) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, xml, 'utf8');
}

if (require.main === module) {
  const root = path.resolve(__dirname, '..');
  const output = path.join(root, 'public', 'sitemap.xml');
  const xml = generateSitemapXml(urls, TODAY);
  writeSitemap(xml, output);
  console.log(`Generated ${output} with ${urls.length} URLs`);
}

module.exports = {
  urls,
  generateSitemapXml,
  writeSitemap,
  pairFor,
};
