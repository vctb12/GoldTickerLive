#!/usr/bin/env node
/**
 * scripts/generate-rss.js
 *
 * Generates feed.xml — an RSS 2.0 feed for gold price updates.
 *
 * The feed contains one item per day. When data/gold_price.json is present
 * (written every 6 min by gold-price-fetch.yml from goldpricez.com), we
 * include a live-price item for today. Otherwise the feed falls back to
 * the static "about" item only.
 *
 * Output: feed.xml (in repo root, copied to dist/ by deploy.yml)
 *
 * Usage:
 *   node scripts/generate-rss.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const OUT_FILE = path.join(ROOT, 'feed.xml');
const GOLD_PRICE_FILE = path.join(ROOT, 'data', 'gold_price.json');
const SITE_URL = 'https://goldtickerlive.com';
const AED_PEG = 3.6725;
const TROY_OZ = 31.1035;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function fmt(n, d = 2) {
  if (n == null || isNaN(n)) return '—';
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
}

function xmlEscape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function rfc822(date) {
  return new Date(date).toUTCString();
}

function readLocalGoldPrice() {
  try {
    if (!fs.existsSync(GOLD_PRICE_FILE)) return null;
    const raw = fs.readFileSync(GOLD_PRICE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    const price = parsed?.gold?.ounce_usd;
    if (typeof price !== 'number' || price <= 0) return null;
    return price;
  } catch (e) {
    console.warn('⚠️  Could not read data/gold_price.json:', e.message);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Build RSS items
// ---------------------------------------------------------------------------
async function buildItems() {
  const items = [];
  const now = new Date();

  // Try to read today's live price from the canonical data file
  // (written every 6 min by gold-price-fetch.yml from goldpricez.com).
  const liveSpot = readLocalGoldPrice();

  if (liveSpot) {
    const k24 = (liveSpot / TROY_OZ) * AED_PEG;
    const k22 = (liveSpot / TROY_OZ) * (22 / 24) * AED_PEG;
    const dateStr = now.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    items.push({
      title: `Gold Prices Today — ${dateStr}`,
      link: `${SITE_URL}/`,
      guid: `${SITE_URL}/gold-price-${now.toISOString().slice(0, 10)}`,
      pubDate: rfc822(now),
      description: `Live gold spot price: $${fmt(liveSpot)}/oz. UAE prices: 24K AED ${fmt(k24)}/g, 22K AED ${fmt(k22)}/g. Track all karats and 24+ countries at GoldPrices.`,
      category: 'Gold Price Update',
    });
  }

  // Always include a static "about" item so the feed is never empty
  items.push({
    title: 'Track Live Gold Prices — GCC & Arab World',
    link: `${SITE_URL}/`,
    guid: `${SITE_URL}/gold-prices-tracker`,
    pubDate: rfc822(now),
    description:
      'GoldPrices tracks live XAU/USD spot price and converts to 24+ currencies across the GCC and Arab world. 7 karats (24K to 14K), updated every 90 seconds. Free, bilingual English/Arabic.',
    category: 'Gold Tracker',
  });

  items.push({
    title: 'Free Gold Calculator — Value, Scrap, Zakat & Buying Power',
    link: `${SITE_URL}/calculator.html`,
    guid: `${SITE_URL}/calculator`,
    pubDate: rfc822(new Date(now.getTime() - 86400000)),
    description:
      'Calculate the value of your gold by weight and karat, estimate scrap gold prices, compute Zakat on gold holdings, and find your buying power at live spot rates.',
    category: 'Gold Tools',
  });

  items.push({
    title: 'Gold Shops Directory — GCC & Arab World',
    link: `${SITE_URL}/shops.html`,
    guid: `${SITE_URL}/shops`,
    pubDate: rfc822(new Date(now.getTime() - 2 * 86400000)),
    description:
      'Browse a curated directory of gold shops and souqs across UAE, Saudi Arabia, Kuwait, Qatar, Bahrain, Oman, Egypt and more. Filter by region, country, city, and specialty.',
    category: 'Gold Shops',
  });

  return items;
}

// ---------------------------------------------------------------------------
// Render RSS 2.0 XML
// ---------------------------------------------------------------------------
function renderRss(items) {
  const now = new Date();
  const itemXml = items
    .map(
      (item) => `
    <item>
      <title>${xmlEscape(item.title)}</title>
      <link>${xmlEscape(item.link)}</link>
      <guid isPermaLink="false">${xmlEscape(item.guid)}</guid>
      <pubDate>${item.pubDate}</pubDate>
      <description>${xmlEscape(item.description)}</description>
      <category>${xmlEscape(item.category)}</category>
    </item>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>GoldPrices — Live Gold Price Updates</title>
    <link>${SITE_URL}/</link>
    <description>Live gold prices for UAE, GCC and the Arab world. 24K, 22K, 21K, 18K per gram and per ounce. Updated every 90 seconds.</description>
    <language>en-us</language>
    <lastBuildDate>${rfc822(now)}</lastBuildDate>
    <ttl>90</ttl>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${SITE_URL}/assets/favicon-192x192.png</url>
      <title>GoldPrices</title>
      <link>${SITE_URL}/</link>
    </image>${itemXml}
  </channel>
</rss>
`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('📰 Generating RSS feed…');
  const items = await buildItems();
  const xml = renderRss(items);

  fs.writeFileSync(OUT_FILE, xml, 'utf8');
  console.log(`✅ feed.xml written (${items.length} items) → ${OUT_FILE}`);
}

main().catch((err) => {
  console.error('❌ RSS generation failed:', err.message);
  process.exit(1);
});
