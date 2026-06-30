#!/usr/bin/env node
/**
 * sync-icon-sprite.js — keep the homepage's inline icon sprite byte-identical to
 * the canonical sprite in `src/components/icon-sprite.js`.
 *
 * The shared nav injects the sprite on the other ~389 pages, but `index.html`
 * carries an inline copy so its static `<use>` markup (trust strip, tool cards)
 * renders FOUC-free before JS runs. This script is the single-source guarantee:
 *
 *   • (default) rewrites index.html's `<svg class="ti-sprite">` block from the
 *     canonical symbol set.
 *   • `--check` verifies they match and exits non-zero otherwise (wired into
 *     `npm run validate`).
 *
 * It edits index.html in place — it does NOT re-run the page generators (repo
 * rule: the committed pages have diverged from their templates).
 *
 * `icon-sprite.js` is an ESM browser module and the repo is CommonJS-default, so
 * we can't `require()`/`import` it here. Instead we parse its `SYMBOLS` literal
 * directly (the module has no imports; symbol bodies use only double-quotes, so
 * single-quote delimiting is unambiguous) and rebuild the same markup string.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const MODULE = path.resolve(ROOT, 'src/components/icon-sprite.js');
const INDEX = path.resolve(ROOT, 'index.html');

const SPRITE_ID = 'gtl-icon-sprite';
// The inline sprite is the single hidden `<svg class="ti-sprite">…</svg>`; no
// nested <svg>, so a non-greedy match to the first closing tag is exact.
const SPRITE_RE = /<svg\b[^>]*class="ti-sprite"[^>]*>[\s\S]*?<\/svg>/;

/** Build the canonical sprite markup from icon-sprite.js's SYMBOLS literal. */
function canonicalMarkup() {
  const src = fs.readFileSync(MODULE, 'utf8');
  const start = src.indexOf('const SYMBOLS = [');
  if (start === -1) throw new Error('SYMBOLS array not found in icon-sprite.js');
  const end = src.indexOf('\n];', start);
  if (end === -1) throw new Error('SYMBOLS array terminator not found in icon-sprite.js');
  const block = src.slice(start, end);

  const entryRe = /\[\s*'([a-z0-9-]+)'\s*,\s*'([\s\S]*?)'\s*,?\s*\]/g;
  const symbols = [];
  let m;
  while ((m = entryRe.exec(block)) !== null) symbols.push([m[1], m[2]]);
  if (symbols.length < 20) {
    throw new Error(`Parsed only ${symbols.length} symbols — refusing to write a partial sprite.`);
  }

  return (
    `<svg id="${SPRITE_ID}" width="0" height="0" class="ti-sprite" aria-hidden="true" focusable="false" style="position: absolute">` +
    '<defs>' +
    symbols
      .map(([id, body]) => `<symbol id="${id}" viewBox="0 0 24 24">${body}</symbol>`)
      .join('') +
    '</defs></svg>'
  );
}

function main() {
  const check = process.argv.includes('--check');
  const canonical = canonicalMarkup();
  const html = fs.readFileSync(INDEX, 'utf8');
  const match = html.match(SPRITE_RE);
  if (!match) {
    console.error(
      '[sync-icon-sprite] Could not find the inline <svg class="ti-sprite"> block in index.html'
    );
    process.exit(1);
  }

  if (match[0] === canonical) {
    if (!check) console.log('[sync-icon-sprite] index.html sprite already in sync.');
    return;
  }

  if (check) {
    console.error(
      '[sync-icon-sprite] index.html inline sprite is OUT OF SYNC with src/components/icon-sprite.js.\n' +
        '  Fix: node scripts/node/sync-icon-sprite.js'
    );
    process.exit(1);
  }

  fs.writeFileSync(
    INDEX,
    html.replace(SPRITE_RE, () => canonical),
    'utf8'
  );
  console.log('[sync-icon-sprite] index.html sprite updated from canonical module.');
}

main();
