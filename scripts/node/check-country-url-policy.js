#!/usr/bin/env node
/**
 * Phase 3 — Country URL policy enforcement.
 * City hubs must be noindex,follow; gold-rate/ and gold-shops/ are indexable commercial URLs.
 *
 * Usage: node scripts/node/check-country-url-policy.js [--fail-on-error]
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const FAIL = process.argv.includes('--fail-on-error');
const COUNTRIES = path.join(ROOT, 'countries');

const CITY_HUB_RE = /^countries\/[^/]+\/[^/]+\/index\.html$/;
const GOLD_RATE_RE = /\/gold-rate\/index\.html$/;
const GOLD_SHOPS_RE = /\/gold-shops\/index\.html$/;

function walkHtml(dir, base = '', out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) walkHtml(abs, rel, out);
    else if (entry.isFile() && entry.name.endsWith('.html')) out.push(rel);
  }
  return out;
}

function robotsContent(relPath) {
  const html = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  const m = html.match(/<meta[^>]+name=["']robots["'][^>]*content=["']([^"']*)["']/i);
  return (m?.[1] || '').toLowerCase();
}

function main() {
  // 2026-07-04 IA reset: the countries/ tree was removed. Keep the script (and
  // its validate-chain slot) as a guard in case country pages ever return.
  if (!fs.existsSync(COUNTRIES)) {
    console.log('[country-url-policy] countries/ not present — nothing to check.');
    return;
  }
  const files = walkHtml(COUNTRIES, 'countries');
  const violations = [];

  for (const rel of files) {
    const robots = robotsContent(rel);
    if (CITY_HUB_RE.test(rel)) {
      if (!robots.includes('noindex') || !robots.includes('follow')) {
        violations.push(`${rel}: city hub must be noindex,follow (got: ${robots || 'missing'})`);
      }
    } else if (GOLD_RATE_RE.test(rel) || GOLD_SHOPS_RE.test(rel)) {
      if (robots.includes('noindex')) {
        violations.push(`${rel}: gold-rate/gold-shops must not be noindex`);
      }
    }
  }

  if (violations.length) {
    const msg = `[country-url-policy] ${violations.length} violation(s):\n${violations.map((v) => `  - ${v}`).join('\n')}`;
    if (FAIL) {
      console.error(msg);
      process.exit(1);
    }
    console.warn(msg);
    return;
  }
  console.log(`[country-url-policy] ok (${files.length} country HTML files checked)`);
}

main();
