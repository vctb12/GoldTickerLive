#!/usr/bin/env node

/**
 * Legacy entry point kept for the daily `generate-sitemap.yml` workflow.
 *
 * Historically this file held a hand-maintained 18-URL list that drifted badly
 * from the site (it advertised noindexed karat stubs and two /ar/ URLs that do
 * not exist). Since 2026-07-04 it delegates to the canonical filesystem-walk
 * generator (`scripts/node/generate-sitemap.js` — the same one the deploy
 * workflow runs), then mirrors the result to `public/sitemap.xml`, which is the
 * committed auxiliary copy this workflow diffs and pushes.
 *
 * Do not add URLs here — the walk generator derives them from the HTML on disk
 * and skips anything carrying a robots noindex meta.
 */

'use strict';

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const CANONICAL_GENERATOR = path.join(ROOT, 'scripts', 'node', 'generate-sitemap.js');
const ROOT_SITEMAP = path.join(ROOT, 'sitemap.xml');
const PUBLIC_SITEMAP = path.join(ROOT, 'public', 'sitemap.xml');

function generateAndMirror() {
  execFileSync(process.execPath, [CANONICAL_GENERATOR], { cwd: ROOT, stdio: 'inherit' });
  fs.copyFileSync(ROOT_SITEMAP, PUBLIC_SITEMAP);
  return PUBLIC_SITEMAP;
}

if (require.main === module) {
  const out = generateAndMirror();
  console.log(`✅  Mirrored sitemap.xml → ${path.relative(ROOT, out)}`);
}

module.exports = { generateAndMirror, CANONICAL_GENERATOR, ROOT_SITEMAP, PUBLIC_SITEMAP };
