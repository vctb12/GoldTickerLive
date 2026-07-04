#!/usr/bin/env node
/*
 * Stage deploy-only static assets into dist/ before auditing built links.
 *
 * Vite builds the root HTML entry points, while deploy.yml copies static
 * directories such as styles/ and src/ afterward. Link checks need the same
 * shape users receive from GitHub Pages. (The countries/ and content/ trees
 * were removed in the 2026-07-04 IA reset — both are now optional.)
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const DIST = path.join(ROOT, 'dist');

function fail(message) {
  console.error(`[stage-dist-statics] ${message}`);
  process.exit(1);
}

function copyFile(relativePath, { optional = false } = {}) {
  const source = path.join(ROOT, relativePath);
  if (!fs.existsSync(source)) {
    if (optional) return false;
    fail(`missing required file: ${relativePath}`);
  }
  fs.copyFileSync(source, path.join(DIST, relativePath));
  return true;
}

function copyDirectory(relativePath, { optional = false } = {}) {
  const source = path.join(ROOT, relativePath);
  if (!fs.existsSync(source)) {
    if (optional) return false;
    fail(`missing required directory: ${relativePath}`);
  }
  fs.cpSync(source, path.join(DIST, relativePath), { recursive: true });
  return true;
}

if (!fs.existsSync(path.join(DIST, 'index.html'))) {
  fail('dist/index.html not found; run npm run build before staging statics');
}

copyFile('sw.js');
copyDirectory('assets');
fs.closeSync(fs.openSync(path.join(DIST, '.nojekyll'), 'w'));
copyFile('robots.txt');
copyFile('.htaccess', { optional: true });
copyFile('CNAME', { optional: true });
copyFile('sitemap.xml', { optional: true });
copyFile('feed.xml', { optional: true });
copyDirectory('src');
copyDirectory('data');
copyFile('favicon.svg');
copyFile('manifest.json');
copyDirectory('styles');
copyDirectory('admin', { optional: true });
copyDirectory('countries', { optional: true });
copyDirectory('content', { optional: true });

console.log('[stage-dist-statics] staged deploy static assets into dist/');
