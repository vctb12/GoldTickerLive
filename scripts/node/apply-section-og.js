#!/usr/bin/env node
/**
 * apply-section-og.js — point generated pages at their per-section social card
 * AND give each one a reference-safe og:image:alt.
 *
 * The hand-authored top-level pages already carry bespoke og:image cards + alts.
 * This script does the same for the GENERATED trees, which otherwise all share
 * the homepage card and frequently lack an og:image:alt entirely:
 *   - countries/<slug>/**        -> assets/og/countries/<slug>.png
 *   - countries/index.html       -> assets/og/countries-hub.png
 *   - content/**                 -> assets/og/guides.png
 *
 * For each mapped page it:
 *   1. rewrites og:image / twitter:image that still point at the homepage card, and
 *   2. ensures an og:image:alt: inserts a page-derived, reference-safe alt where it
 *      is missing, and replaces the legacy generic "live gold price tracker" alt.
 *      Existing reference-framed alts (e.g. country hubs) are left untouched.
 *
 * It edits the committed HTML in place (the deployed source of truth) rather than
 * re-running the diverged page generators, and is idempotent. `--check` exits 1 if
 * any mapped page still points at the homepage card, lacks an og:image:alt, or
 * keeps the legacy generic alt — wire it into `npm run validate` as a drift guard.
 *
 *   node scripts/node/apply-section-og.js          # apply
 *   node scripts/node/apply-section-og.js --check  # exit 1 if any mapped page is stale
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const SITE = 'https://goldtickerlive.com';
const HOME = `${SITE}/assets/og-image.png`;
const GENERIC_ALT = /live gold price tracker/i;

// slug -> [English name, currency]
const COUNTRIES = {
  algeria: ['Algeria', 'DZD'],
  bahrain: ['Bahrain', 'BHD'],
  egypt: ['Egypt', 'EGP'],
  india: ['India', 'INR'],
  iraq: ['Iraq', 'IQD'],
  jordan: ['Jordan', 'JOD'],
  kuwait: ['Kuwait', 'KWD'],
  lebanon: ['Lebanon', 'LBP'],
  libya: ['Libya', 'LYD'],
  morocco: ['Morocco', 'MAD'],
  oman: ['Oman', 'OMR'],
  pakistan: ['Pakistan', 'PKR'],
  palestine: ['Palestine', 'ILS'],
  qatar: ['Qatar', 'QAR'],
  'saudi-arabia': ['Saudi Arabia', 'SAR'],
  sudan: ['Sudan', 'SDG'],
  syria: ['Syria', 'SYP'],
  tunisia: ['Tunisia', 'TND'],
  turkey: ['Türkiye', 'TRY'],
  uae: ['United Arab Emirates', 'AED'],
  yemen: ['Yemen', 'YER'],
};
const PAGE_TYPES = new Set(['gold-price', 'gold-rate', 'gold-shops', 'cities']);

function titleCase(slug) {
  return slug
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

// Optional city/place label for a country sub-page, or null at country level.
function placeFor(parts) {
  const rest = parts.slice(2, -1); // segments between the country slug and the filename
  const file = parts[parts.length - 1];
  if (rest[0] === 'cities' && file.endsWith('.html') && file !== 'index.html') {
    return titleCase(file.replace(/\.html$/, ''));
  }
  if (rest[0] && !PAGE_TYPES.has(rest[0])) return titleCase(rest[0]);
  return null;
}

function clean(alt) {
  return alt.replace(/"/g, '').trim();
}

// Return { image, alt } for a repo-relative path, or null to skip.
function cardFor(rel, src) {
  const parts = rel.split('/');
  if (rel === 'countries/index.html') {
    return {
      image: `${SITE}/assets/og/countries-hub.png`,
      alt: 'Gold Ticker Live — reference gold prices by country for the GCC and Arab world',
    };
  }
  if (rel.startsWith('countries/')) {
    const slug = parts[1];
    const c = COUNTRIES[slug];
    if (!c) return null;
    const [name, ccy] = c;
    const place = placeFor(parts);
    const where = place ? `${place}, ${name}` : name;
    return {
      image: `${SITE}/assets/og/countries/${slug}.png`,
      alt: clean(`Gold Ticker Live — reference gold prices in ${where} (${ccy})`),
    };
  }
  if (rel.startsWith('content/')) {
    const m = src.match(/<title>([^<]*)<\/title>/);
    const core = m ? m[1].replace(/\s*\|\s*Gold Ticker Live\s*$/i, '').trim() : '';
    const alt = core ? `Gold Ticker Live — ${core}` : 'Gold Ticker Live — gold reference guide';
    return { image: `${SITE}/assets/og/guides.png`, alt: clean(alt) };
  }
  return null;
}

function walk(dir, acc) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.isFile() && entry.name.endsWith('.html')) acc.push(full);
  }
  return acc;
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
  const src = fs.readFileSync(file, 'utf8');
  if (!/<meta property="og:image"/.test(src)) continue;
  const card = cardFor(rel, src);
  if (!card) continue;

  const onHome = src.includes(HOME);
  const hasAlt = /<meta property="og:image:alt"/.test(src);
  const altGeneric = hasAlt && GENERIC_ALT.test(src);
  const needsAlt = !hasAlt || altGeneric;

  if (check) {
    if (onHome || needsAlt) stale.push(rel);
    continue;
  }

  let next = src;
  if (onHome) next = next.split(HOME).join(card.image);
  if (!hasAlt) {
    next = next.replace(
      /([ \t]*)<meta property="og:image" content="[^"]*" \/>/,
      (m, indent) => `${m}\n${indent}<meta property="og:image:alt" content="${card.alt}" />`
    );
  } else if (altGeneric) {
    next = next.replace(/(<meta property="og:image:alt" content=")[^"]*(" \/>)/, `$1${card.alt}$2`);
  }
  if (next !== src) {
    fs.writeFileSync(file, next);
    changed++;
  }
}

if (check) {
  if (stale.length) {
    console.error(
      `[apply-section-og:check] ${stale.length} mapped page(s) need the section card or a reference-safe og:image:alt. Run: node scripts/node/apply-section-og.js`
    );
    for (const s of stale.slice(0, 10)) console.error(`  - ${s}`);
    process.exit(1);
  }
  console.log(
    '[apply-section-og:check] OK — every mapped generated page has its section card + a reference-safe og:image:alt.'
  );
} else {
  console.log(
    `[apply-section-og] updated ${changed} generated page(s) (section card + og:image:alt).`
  );
}
