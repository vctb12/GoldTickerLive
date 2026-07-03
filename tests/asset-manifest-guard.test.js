'use strict';

/**
 * asset-manifest-guard.test.js
 *
 * Turns two promises from the V1-VISUAL asset programme into CI guarantees:
 *
 *  1. LICENSE REGISTER COVERAGE — assets/MANIFEST.md declares "Adding an asset
 *     without a manifest entry is a review blocker" (design language §6).
 *     This test enforces it: every file under assets/images/ must be matched
 *     by a manifest row's asset pattern (rows use brace expansion, e.g.
 *     `markets/dubai-gold-souk-{480,768,960}.{avif,webp,jpg}`).
 *
 *  2. WEIGHT BUDGET — every shipped content photograph must weigh ≤ 120 KB
 *     (the session hero-image budget). Because `_headers` freezes image URLs
 *     in caches for a year, an oversized file is effectively permanent — so
 *     it must never land.
 *
 * If this test fails on a new asset: add a manifest row with source, author
 * and license (see assets/MANIFEST.md), and re-encode within budget via
 * scripts/images/build-images.py (per-shot `quality` overrides).
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'assets', 'images');
const MANIFEST = path.join(ROOT, 'assets', 'MANIFEST.md');

const BUDGET_KB = 120;

function listImageFiles(dir, prefix = '') {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...listImageFiles(path.join(dir, entry.name), rel));
    else out.push(rel);
  }
  return out;
}

// Expand one level of `{a,b,c}` groups (manifest rows nest two groups at most).
function expandBraces(pattern) {
  const m = pattern.match(/\{([^{}]+)\}/);
  if (!m) return [pattern];
  return m[1].split(',').flatMap((option) => expandBraces(pattern.replace(m[0], option.trim())));
}

function manifestAssetPatterns() {
  const text = fs.readFileSync(MANIFEST, 'utf8');
  // Asset cell of each photography table row: first backtick span on lines
  // that look like `| `markets/…` | …`.
  const patterns = [];
  for (const line of text.split('\n')) {
    const m = line.match(/^\|\s*`([^`]+)`/);
    if (m) patterns.push(m[1]);
  }
  return patterns;
}

test('assets: every shipped image is registered in assets/MANIFEST.md', () => {
  const files = listImageFiles(IMAGES_DIR);
  assert.ok(files.length > 0, 'expected committed images under assets/images/');

  const covered = new Set(
    manifestAssetPatterns().flatMap((p) => expandBraces(p.replace(/\s/g, '')))
  );
  const unregistered = files.filter((f) => !covered.has(f));
  assert.deepEqual(
    unregistered,
    [],
    `assets/images/ files with no assets/MANIFEST.md row (license register is a review blocker):\n  ${unregistered.join('\n  ')}`
  );
});

test('assets: manifest photography rows do not reference missing files', () => {
  const files = new Set(listImageFiles(IMAGES_DIR));
  const stale = manifestAssetPatterns()
    .flatMap((p) => expandBraces(p.replace(/\s/g, '')))
    .filter((f) => f.startsWith('markets/') && !files.has(f));
  assert.deepEqual(
    stale,
    [],
    `assets/MANIFEST.md rows referencing files that do not exist:\n  ${stale.join('\n  ')}`
  );
});

test(`assets: every shipped image holds the ${BUDGET_KB} KB budget`, () => {
  const over = [];
  for (const rel of listImageFiles(IMAGES_DIR)) {
    const kb = fs.statSync(path.join(IMAGES_DIR, rel)).size / 1024;
    if (kb > BUDGET_KB) over.push(`${rel} (${kb.toFixed(1)} KB)`);
  }
  assert.deepEqual(
    over,
    [],
    `images above the ${BUDGET_KB} KB budget (cache-frozen for a year — re-encode via build-images.py):\n  ${over.join('\n  ')}`
  );
});
