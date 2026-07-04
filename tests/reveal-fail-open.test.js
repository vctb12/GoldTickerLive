'use strict';

/**
 * Guards the [data-reveal] "fail-open" invariant.
 *
 * Background: `[data-reveal]{opacity:0}` hides sections until JS adds
 * `.is-in-view`. If JS is disabled, never boots, or a hashed chunk 404s, that
 * hide must NOT strand content invisible — this is the exact class of bug that
 * blanked the Learn hub ("Read 0 of 9 featured guides" over an empty grid) and
 * threatened the homepage hero. These tests fail loudly if the fail-open path
 * is ever removed.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

const utilities = read('styles/partials/utilities.css');

test('utilities.css keeps the [data-reveal] hidden resting state (animation intact)', () => {
  assert.match(utilities, /\[data-reveal\]\s*\{[^}]*opacity:\s*0/);
});

test('utilities.css fails open: :root:not(.js) [data-reveal] is visible', () => {
  // Without the `.js` class (JS disabled / never ran) reveal content must render.
  assert.match(
    utilities,
    /:root:not\(\.js\)\s+\[data-reveal\]\s*\{[^}]*opacity:\s*1/,
    'Missing the :root:not(.js) [data-reveal] fail-open rule — JS-disabled visitors would see blank sections.'
  );
});

// Pages that actually use the reveal animation must carry the preinit that arms
// the hide (`.js`) AND the chunk-independent inline reveal fail-safe.
for (const page of ['index.html', 'tracker.html', 'learn.html']) {
  test(`${page}: theme-preinit arms .js and ships the reveal fail-safe`, () => {
    const html = read(page);
    assert.ok(html.includes('gtl-theme-preinit'), `${page} missing the theme-preinit block`);
    assert.match(html, /classList\.add\('js'\)/, `${page} preinit does not add the .js class`);
    // The inline fail-safe reveals on-screen [data-reveal] nodes if the module dies.
    assert.match(
      html,
      /\[data-reveal\]:not\(\.is-in-view\)/,
      `${page} preinit is missing the inline reveal fail-safe`
    );
  });
}
