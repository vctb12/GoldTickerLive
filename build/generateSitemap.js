#!/usr/bin/env node
/**
 * build/generateSitemap.js
 * Thin delegator to the canonical filesystem-walk sitemap generator
 * (scripts/node/generate-sitemap.js — the same one deploy.yml regenerates with).
 *
 * Kept as a path-stable shim because `npm run build` (package.json) and
 * scripts/node/generate-baseline-inventory.js invoke this file by path. It used
 * to hold a hardcoded staticPages list that drifted from the site (it omitted
 * dubai-gold-price.html, glossary.html, market.html — three real indexable
 * pages). Do NOT re-add a page list here — the walk generator derives URLs from
 * the HTML on disk and skips noindex, so it can never miss a shipped page.
 */

'use strict';

const { execFileSync } = require('node:child_process');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const CANONICAL_GENERATOR = path.join(ROOT, 'scripts', 'node', 'generate-sitemap.js');

execFileSync(process.execPath, [CANONICAL_GENERATOR, ...process.argv.slice(2)], {
  cwd: ROOT,
  stdio: 'inherit',
});
