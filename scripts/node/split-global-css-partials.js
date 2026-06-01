#!/usr/bin/env node
/**
 * One-time maintainer utility: split styles/global.css body into partials.
 * global.css keeps @import chain only (plus existing shell/skeleton/ticker imports).
 *
 * Run: node scripts/node/split-global-css-partials.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const GLOBAL = path.join(ROOT, 'styles/global.css');
const PARTIALS_DIR = path.join(ROOT, 'styles/partials');

/** 1-based inclusive line ranges for the main body (after the 3 feature partial imports). */
const SLICES = [
  { file: 'tokens.css', start: 5, end: 279 },
  { file: 'base.css', start: 281, end: 978 },
  { file: 'layout.css', start: 979, end: 1226 },
  { file: 'components.css', start: 1227, end: 5140 },
  { file: 'utilities.css', start: 5141, end: Infinity },
];

const EXISTING_IMPORTS = [
  "@import url('./partials/shell.css');",
  "@import url('./partials/skeleton.css');",
  "@import url('./partials/market-summary-ticker.css');",
];

const NEW_IMPORTS = [
  "@import url('./partials/tokens.css');",
  "@import url('./partials/base.css');",
  "@import url('./partials/layout.css');",
  "@import url('./partials/components.css');",
  "@import url('./partials/utilities.css');",
];

function main() {
  const raw = fs.readFileSync(GLOBAL, 'utf8');
  const lines = raw.split('\n');

  for (const slice of SLICES) {
    const startIdx = slice.start - 1;
    const endIdx = slice.end === Infinity ? lines.length : slice.end;
    const chunk = lines.slice(startIdx, endIdx).join('\n').trimEnd();
    const outPath = path.join(PARTIALS_DIR, slice.file);
    fs.writeFileSync(outPath, `${chunk}\n`, 'utf8');
    console.log(`Wrote ${path.relative(ROOT, outPath)} (${endIdx - startIdx} lines)`);
  }

  const globalOut = [...EXISTING_IMPORTS, '', ...NEW_IMPORTS, ''].join('\n');
  fs.writeFileSync(GLOBAL, globalOut, 'utf8');
  console.log(`Rewrote ${path.relative(ROOT, GLOBAL)} (${NEW_IMPORTS.length + EXISTING_IMPORTS.length} imports)`);
}

main();
