'use strict';
/**
 * no-emoji-ui-guard.test.js — V1-VISUAL acceptance guard.
 *
 * Emoji are banned as UI iconography (docs/design-language.md §5): they render
 * inconsistently across OS/browser (flag emoji fall back to "AE" letter pairs
 * on Windows) and break the financial-desk register. UI icons come from the
 * SVG sprite (src/components/icon-sprite.js).
 *
 * This guard scans the swept surfaces for pictographic codepoints. Typographic
 * characters (arrows →/←/↓, ·, ×, ⇧, ▲▼ direction glyphs) are outside the
 * banned ranges on purpose — they are typography, not icons.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');

// U+1F300–1FAFF (pictographs), U+2600–27BF (misc symbols/dingbats),
// U+1F1E6–1F1FF (regional indicators / flag emoji), U+2B00–2BFF (⬇ etc.),
// U+2139 (ℹ), U+FE0F (variation selector — only ever follows an emoji).
const EMOJI_RE =
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{2B00}-\u{2BFF}\u{2139}\u{FE0F}]/u;

/** Surfaces already swept clean — extend as the sweep covers more files. */
const SWEPT = [
  'tracker.html',
  'index.html',
  'src/pages/tracker-pro.js',
  'src/config/translations.js',
  'src/components/icon-sprite.js',
  'src/components/footer.js',
  'src/components/nav.js',
  'src/components/nav-data.js',
  'src/components/breadcrumbs.js',
  'src/components/price-fetch-error.js',
  'src/lib/page-hydrator.js',
  'src/lib/sw-update-toast.js',
  'src/lib/alert-engine.js',
  'src/lib/safe-dom.js',
  'src/components/alert-manager.js',
  'learn.html',
  'scripts/node/render-learn-static-fallback.mjs',
  ...fs
    .readdirSync(path.join(ROOT, 'src', 'learn-hub'))
    .filter((f) => f.endsWith('.js'))
    .map((f) => `src/learn-hub/${f}`),
  ...fs
    .readdirSync(path.join(ROOT, 'src', 'tracker'))
    .filter((f) => f.endsWith('.js'))
    .map((f) => `src/tracker/${f}`),
];

for (const rel of SWEPT) {
  test(`no-emoji-ui: ${rel} carries no emoji-as-UI`, () => {
    const text = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    const lines = text.split('\n');
    const hits = [];
    lines.forEach((line, i) => {
      if (EMOJI_RE.test(line)) hits.push(`${rel}:${i + 1}: ${line.trim().slice(0, 80)}`);
    });
    assert.deepEqual(hits, [], `emoji-as-UI found:\n  ${hits.join('\n  ')}`);
  });
}
