#!/usr/bin/env node
/**
 * scripts/node/flatten-css.js
 *
 * Inline (flatten) the top-level `@import url('./partials/x.css');` chain in a CSS
 * file into a single file, eliminating the render-blocking @import waterfall.
 *
 * WHY: leaf pages (countries/, content/) are served as-is and load
 * styles/global.css directly, where 9 nested @imports load serially (each
 * discovered only after its parent downloads). Vite already bundles CSS for the
 * root HTML entries, but not for the copied-as-is leaf pages. This script is run
 * by the deploy workflow against the dist/ copy so the SOURCE keeps its readable
 * @import structure for development while production serves one flattened file.
 *
 * SAFE BY DESIGN: it only inlines @import rules whose target file exists and
 * resolves under the input file's directory; any unresolved @import is left
 * untouched (never corrupts the cascade). Order is preserved exactly, so the
 * flattened output is byte-equivalent in cascade to the original @import chain.
 *
 * Usage:
 *   node scripts/node/flatten-css.js <input.css> [output.css]
 *   (output defaults to input — in-place)
 */

'use strict';

const fs = require('fs');
const path = require('path');

const IMPORT_RE = /@import\s+url\(\s*(['"])([^'"]+)\1\s*\)\s*;/g;

function flatten(inputPath, outputPath, { depth = 0 } = {}) {
  const dir = path.dirname(inputPath);
  const css = fs.readFileSync(inputPath, 'utf8');
  let inlined = 0;
  let skipped = 0;

  const out = css.replace(IMPORT_RE, (match, _q, ref) => {
    // Only inline local, relative partial imports — never remote (http) imports.
    if (/^https?:/i.test(ref) || ref.startsWith('//')) {
      skipped++;
      return match;
    }
    const target = path.resolve(dir, ref);
    if (!target.startsWith(path.resolve(dir)) || !fs.existsSync(target)) {
      skipped++;
      return match; // leave untouched — do not corrupt the cascade
    }
    inlined++;
    const partial = fs.readFileSync(target, 'utf8').trim();
    return `/* ── inlined: ${ref} ── */\n${partial}\n/* ── end: ${ref} ── */`;
  });

  fs.writeFileSync(outputPath, out, 'utf8');
  return { inlined, skipped, depth };
}

if (require.main === module) {
  const input = process.argv[2];
  const output = process.argv[3] || input;
  if (!input) {
    console.error('Usage: node scripts/node/flatten-css.js <input.css> [output.css]');
    process.exit(1);
  }
  if (!fs.existsSync(input)) {
    console.error(`[flatten-css] input not found: ${input}`);
    process.exit(1);
  }
  const { inlined, skipped } = flatten(input, output);
  console.log(`[flatten-css] ${input} → ${output}: inlined ${inlined}, left ${skipped} untouched`);
  if (skipped > 0) {
    console.warn(
      '[flatten-css] note: some @import rules were left in place (remote or unresolved).'
    );
  }
}

module.exports = { flatten };
