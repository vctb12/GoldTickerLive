#!/usr/bin/env node
/**
 * reference-language-sweep.js — align share/SERP metadata to the reference-not-retail
 * trust frame by rewriting the descriptive "live gold price/rate" phrasing to
 * "reference …" inside titles, the social/description meta cluster, JSON-LD, and
 * manifest.json. The BRAND NAME "Gold Ticker Live" is never touched (the patterns
 * only match "live" immediately followed by "gold price/rate"), and feature labels
 * like "Live spot data" / "Live Tracker" are intentionally left alone.
 *
 * Scope per HTML file: <title>, <meta name/property=description|og:title|
 * og:description|twitter:title|twitter:description> (multi-line tolerant), and
 * <script type=ld+json>. Body copy is deliberately out of scope. Also swaps the
 * Arabic "الذهب المباشرة" (live/direct gold) → "الذهب المرجعية" (reference) so AR
 * metadata keeps parity.
 *
 * Edits committed HTML/JSON in place (the page generators have diverged from their
 * templates — re-running them would regress the richer committed heads). Idempotent.
 * `--check` exits 1 if any in-scope value still uses the live phrasing.
 *
 *   node scripts/node/reference-language-sweep.js          # apply
 *   node scripts/node/reference-language-sweep.js --check  # exit 1 if any stale
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const TARGET_PROPS =
  /(?:property|name)="(?:description|og:title|og:description|twitter:title|twitter:description)"/;

// Rewrite the descriptive "live" over-claims on gold prices/rates to "reference …",
// preserving the case of "live". Deliberately PRESERVES accurate/unrelated uses:
// "live XAU/USD spot price" (the spot feed really is live), "live pages show
// freshness", "live budget plan", "live mini ticker", "rates live on the page",
// and the brand name "Gold Ticker Live". Unit-tested in the scratchpad harness.
function fix(s) {
  return (
    s
      // live {karat list}[ gold] rate(s)/price(s)  → reference …
      .replace(
        /\b(L)ive(\s+(?:\d+K\b[\s,]*)+(?:and\s+\d+K\b\s+)?(?:gold\s+)?(?:rate|price)s?)/gi,
        (m, L, rest) => (L === 'L' ? 'Reference' : 'reference') + rest
      )
      // live gold price(s)/rate(s) (adjacent)
      .replace(
        /\b(L)ive( gold (?:price|rate)s?)/gi,
        (m, L, rest) => (L === 'L' ? 'Reference' : 'reference') + rest
      )
      // "{CCY} Live Rates/Prices" / "{CCY} Live + Buying Guide" (Title Case city titles) and lowercase
      .replace(/\b([A-Z]{3}) Live (Rates|Prices)\b/g, '$1 Reference $2')
      .replace(/\b([A-Z]{3}) Live (\+ Buying Guide)\b/g, '$1 Reference $2')
      .replace(/\b([A-Z]{3}) live (rate|price)s\b/g, '$1 reference $2s')
      .replace(/\blive ([A-Z]{3}) (rate|price)s\b/g, 'reference $1 $2s')
      // a spot price is inherently current — drop the redundant "live"
      .replace(/\blive (gold spot price)/gi, '$1')
      // drop other redundant "live" qualifiers in metadata ("live reference prices",
      // "rates live on the gold-rate page")
      .replace(/\blive (reference (?:price|rate)s)\b/gi, '$1')
      .replace(/\b(rates) live (on the gold-rate page)/gi, '$1 $2')
      // city nav "to live {place} gold rate(s)"
      .replace(/\b([Tt])o live (.+?) gold rate/g, '$1o $2 reference gold rate')
      // Arabic live/direct → reference, for AR metadata parity
      .replace(/الذهب المباشرة/g, 'الذهب المرجعية')
  );
}
const isStale = (v) => fix(v) !== v;

function fixMetaTag(tag) {
  if (!TARGET_PROPS.test(tag)) return tag;
  return tag.replace(/content="([^"]*)"/, (m, v) => `content="${fix(v)}"`);
}

function transform(src) {
  return src
    .replace(/<title>([^<]*)<\/title>/g, (m, t) => `<title>${fix(t)}</title>`)
    .replace(/<meta\b[^>]*>/g, (m) => fixMetaTag(m))
    .replace(
      /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g,
      (m, j) => `<script type="application/ld+json">${fix(j)}</script>`
    );
}

// In-scope values for staleness checking.
function scopedValues(src) {
  const vals = [];
  const t = src.match(/<title>([^<]*)<\/title>/);
  if (t) vals.push(t[1]);
  for (const tag of src.match(/<meta\b[^>]*>/g) || []) {
    if (TARGET_PROPS.test(tag)) {
      const c = tag.match(/content="([^"]*)"/);
      if (c) vals.push(c[1]);
    }
  }
  for (const blk of src.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g) || [])
    vals.push(blk);
  return vals;
}

function walk(dir, acc) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.isFile() && entry.name.endsWith('.html')) acc.push(full);
  }
  return acc;
}

const check = process.argv.includes('--check');
const htmlFiles = [
  ...fs
    .readdirSync(ROOT)
    .filter((f) => f.endsWith('.html'))
    .map((f) => path.join(ROOT, f)),
  ...walk(path.join(ROOT, 'countries'), []),
  ...walk(path.join(ROOT, 'content'), []),
  ...walk(path.join(ROOT, 'ar'), []),
];

let changed = 0;
const stale = [];
for (const file of htmlFiles) {
  const src = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file);
  if (check) {
    if (scopedValues(src).some(isStale)) stale.push(rel);
    continue;
  }
  const out = transform(src);
  if (out !== src) {
    fs.writeFileSync(file, out);
    changed++;
  }
}

const manifestPath = path.join(ROOT, 'manifest.json');
if (fs.existsSync(manifestPath)) {
  const src = fs.readFileSync(manifestPath, 'utf8');
  if (check) {
    if (isStale(src)) stale.push('manifest.json');
  } else {
    const out = fix(src);
    if (out !== src) {
      fs.writeFileSync(manifestPath, out);
      changed++;
    }
  }
}

if (check) {
  if (stale.length) {
    console.error(
      `[reference-language-sweep:check] ${stale.length} file(s) still use live-price metadata. Run: node scripts/node/reference-language-sweep.js`
    );
    for (const s of stale.slice(0, 10)) console.error(`  - ${s}`);
    process.exit(1);
  }
  console.log('[reference-language-sweep:check] OK — share/SERP metadata is reference-framed.');
} else {
  console.log(
    `[reference-language-sweep] updated ${changed} file(s) to reference-framed metadata.`
  );
}
