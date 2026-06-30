#!/usr/bin/env node
/**
 * apply-section-og.js — point generated pages at their per-section social card.
 *
 * The hand-authored top-level pages already carry bespoke og:image cards. This
 * script does the same for the GENERATED trees, which otherwise all share the
 * homepage card:
 *   - countries/<slug>/**        -> assets/og/countries/<slug>.png
 *   - countries/index.html       -> assets/og/countries-hub.png
 *   - content/**                 -> assets/og/guides.png
 *
 * It edits the committed HTML in place (the deployed source of truth) rather than
 * re-running the page generators, which have diverged from their templates and
 * would regress the richer committed heads. It is idempotent: it only rewrites an
 * og:image / twitter:image that still points at the homepage card, so re-running
 * (or running after a future generation that re-emits the homepage card) is safe.
 *
 *   node scripts/node/apply-section-og.js          # apply
 *   node scripts/node/apply-section-og.js --check  # exit 1 if any page is stale
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const SITE = 'https://goldtickerlive.com';
const HOME = `${SITE}/assets/og-image.png`;

const COUNTRIES = new Set([
  'algeria',
  'bahrain',
  'egypt',
  'india',
  'iraq',
  'jordan',
  'kuwait',
  'lebanon',
  'libya',
  'morocco',
  'oman',
  'pakistan',
  'palestine',
  'qatar',
  'saudi-arabia',
  'sudan',
  'syria',
  'tunisia',
  'turkey',
  'uae',
  'yemen',
]);

function walk(dir, acc) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.isFile() && entry.name.endsWith('.html')) acc.push(full);
  }
  return acc;
}

// Return the card URL a given repo-relative path should use, or null to skip.
function cardFor(rel) {
  if (rel === 'countries/index.html') return `${SITE}/assets/og/countries-hub.png`;
  if (rel.startsWith('countries/')) {
    const slug = rel.split('/')[1];
    if (COUNTRIES.has(slug)) return `${SITE}/assets/og/countries/${slug}.png`;
    return null;
  }
  if (rel.startsWith('content/')) return `${SITE}/assets/og/guides.png`;
  return null;
}

const check = process.argv.includes('--check');
const targets = [];
for (const base of ['countries', 'content']) {
  const dir = path.join(ROOT, base);
  if (fs.existsSync(dir)) walk(dir, targets);
}

let changed = 0;
const stale = [];
for (const file of targets) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  const card = cardFor(rel);
  if (!card) continue;
  const src = fs.readFileSync(file, 'utf8');
  if (!src.includes(HOME)) continue; // already mapped or no home ref
  if (check) {
    stale.push(rel);
    continue;
  }
  fs.writeFileSync(file, src.split(HOME).join(card));
  changed++;
}

if (check) {
  if (stale.length) {
    console.error(
      `[apply-section-og:check] ${stale.length} page(s) still on the homepage card. Run: node scripts/node/apply-section-og.js`
    );
    process.exit(1);
  }
  console.log('[apply-section-og:check] OK — all generated pages use their section card.');
} else {
  console.log(`[apply-section-og] updated ${changed} generated page(s) to per-section cards.`);
}
