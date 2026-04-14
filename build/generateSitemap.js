#!/usr/bin/env node
/**
 * build/generateSitemap.js
 * Generates sitemap.xml from all known route combinations.
 * Run: node build/generateSitemap.js
 */

const fs   = require('fs');
const path = require('path');

const ROOT     = path.resolve(__dirname, '..');
const SITE_URL = 'https://vctb12.github.io/Gold-Prices';
const TODAY    = new Date().toISOString().slice(0, 10);

const { COUNTRIES } = (() => {
  const raw = fs.readFileSync(path.join(ROOT, 'src/config/countries.js'), 'utf8');
  const match = raw.match(/export const COUNTRIES\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) throw new Error('Could not parse COUNTRIES');
   
  return { COUNTRIES: new Function('return ' + match[1])() };
})();

const { KARATS } = (() => {
  const raw = fs.readFileSync(path.join(ROOT, 'src/config/karats.js'), 'utf8');
  const match = raw.match(/export const KARATS\s*=\s*(\[[\s\S]*?\]);/);
  if (!match) throw new Error('Could not parse KARATS');
   
  return { KARATS: new Function('return ' + match[1])() };
})();

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

// Static pages (from existing sitemap)
const staticPages = [
  { loc: `${SITE_URL}/`,                  changefreq: 'hourly',  priority: '1.0' },
  { loc: `${SITE_URL}/tracker.html`,      changefreq: 'always',  priority: '0.95' },
  { loc: `${SITE_URL}/shops.html`,        changefreq: 'weekly',  priority: '0.85' },
  { loc: `${SITE_URL}/calculator.html`,   changefreq: 'monthly', priority: '0.75' },
  { loc: `${SITE_URL}/learn.html`,        changefreq: 'monthly', priority: '0.65' },
  { loc: `${SITE_URL}/insights.html`,     changefreq: 'daily',   priority: '0.75' },
  { loc: `${SITE_URL}/methodology.html`,  changefreq: 'monthly', priority: '0.55' },
  { loc: `${SITE_URL}/invest.html`,       changefreq: 'monthly', priority: '0.60' },
  { loc: `${SITE_URL}/content/guides/buying-guide.html`, changefreq: 'monthly', priority: '0.65' },
  { loc: `${SITE_URL}/gold-price-history/`, changefreq: 'daily', priority: '0.80' },
  { loc: `${SITE_URL}/order-gold/`,       changefreq: 'hourly',  priority: '0.85' },
  { loc: `${SITE_URL}/social/x-post-generator.html`, changefreq: 'monthly', priority: '0.40' },
  { loc: `${SITE_URL}/countries/index.html`, changefreq: 'monthly', priority: '0.60' },
];

for (const p of staticPages) {
  urls.push(url(p.loc, p.changefreq, p.priority));
}

// Old country pages (kept for backlinks)
for (const country of COUNTRIES) {
  if (!country.slug) continue;
  const htmlPath = path.join(ROOT, 'countries', country.slug, 'index.html');
  if (fs.existsSync(htmlPath)) {
    const oldUrl = `${SITE_URL}/countries/${country.slug}/`;
    urls.push(url(oldUrl, 'monthly', '0.40'));
  }
}

// Generated: country landing
for (const country of COUNTRIES) {
  if (!country.slug) continue;
  urls.push(url(`${SITE_URL}/${country.slug}/gold-price/`, 'hourly', '0.90'));

  for (const city of (country.cities || [])) {
    urls.push(url(`${SITE_URL}/${country.slug}/${city.slug}/gold-prices/`, 'hourly', '0.85'));
    urls.push(url(`${SITE_URL}/${country.slug}/${city.slug}/gold-shops/`,  'weekly', '0.70'));

    for (const karat of KARATS.filter(k => ['24', '22', '21', '18'].includes(k.code))) {
      urls.push(url(`${SITE_URL}/${country.slug}/${city.slug}/gold-rate/${karat.code}-karat/`, 'hourly', '0.75'));
    }
  }
}

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('')}
</urlset>`;

const outPath = path.join(ROOT, 'sitemap.xml');
fs.writeFileSync(outPath, xml, 'utf8');
console.log(`✅ sitemap.xml written with ${urls.length} URLs`);
