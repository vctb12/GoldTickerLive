'use strict';

/**
 * The legacy scripts/generate-sitemap.js (hand-maintained 18-URL list) was
 * replaced 2026-07-04 by a wrapper that delegates to the canonical
 * filesystem-walk generator and mirrors the output to public/sitemap.xml
 * (the committed auxiliary copy the daily workflow pushes). These tests lock
 * the wrapper contract and that the mirrored sitemap no longer advertises
 * noindexed or non-existent URLs.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const mod = require(path.resolve(__dirname, '..', 'scripts', 'generate-sitemap.js'));

let mirrored;
function ensureMirrored() {
  if (!mirrored) {
    mod.generateAndMirror();
    mirrored = fs.readFileSync(mod.PUBLIC_SITEMAP, 'utf8');
  }
  return mirrored;
}

test('wrapper delegates to the canonical walk generator and mirrors to public/', () => {
  const xml = ensureMirrored();
  const rootXml = fs.readFileSync(mod.ROOT_SITEMAP, 'utf8');
  assert.equal(xml, rootXml, 'public/sitemap.xml must be a byte-identical mirror of sitemap.xml');
  assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>/);
  assert.match(xml, /<urlset[\s\S]*<\/urlset>/);
});

test('mirrored sitemap is derived from the filesystem walk, not a stale hardcoded list', () => {
  const xml = ensureMirrored();
  const count = (xml.match(/<loc>/g) || []).length;
  // Post-reduction the site is ~11 indexable public pages; the walk generator
  // derives them from disk. The old hardcoded list advertised 18 fixed URLs
  // (several noindexed / non-existent), so lock that the walk output covers the
  // surviving surfaces without reintroducing the drift.
  assert.ok(count >= 10, `expected the walk generator to emit the surviving pages, got ${count}`);
});

test('mirrored sitemap excludes noindexed and non-existent URLs', () => {
  const xml = ensureMirrored();
  const blocked = [
    // noindexed karat stubs (Phase 4, 2026-07-04)
    'https://goldtickerlive.com/gold-price/24k/',
    'https://goldtickerlive.com/ar/gold-price/24k/',
    // never existed as documents — the old hardcoded list advertised them
    'https://goldtickerlive.com/ar/calculator/',
    'https://goldtickerlive.com/ar/shops/',
    // merged into /learn.html (2026-07-04 knowledge-hub consolidation)
    'https://goldtickerlive.com/insights.html',
    'https://goldtickerlive.com/invest.html',
    // merged into /methodology.html
    'https://goldtickerlive.com/methodology/',
  ];
  for (const url of blocked) {
    assert.ok(!xml.includes(`<loc>${url}</loc>`), `sitemap must not advertise ${url}`);
  }
});

test('mirrored sitemap keeps the surviving core surfaces', () => {
  const xml = ensureMirrored();
  const core = [
    'https://goldtickerlive.com/',
    'https://goldtickerlive.com/tracker.html',
    'https://goldtickerlive.com/calculator.html',
    'https://goldtickerlive.com/compare.html',
    'https://goldtickerlive.com/learn.html',
    'https://goldtickerlive.com/methodology.html',
  ];
  for (const url of core) {
    assert.ok(xml.includes(`<loc>${url}</loc>`), `sitemap must include ${url}`);
  }
});
