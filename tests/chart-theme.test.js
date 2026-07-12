/**
 * Tests for src/lib/chart-theme.js — the shared, container-scoped chart theme
 * reader used by the GoldChart canvas (src/components/chart.js) and the
 * tracker's SVG first-paint fallback (src/tracker/chart.js).
 *
 * The contract under test: colors resolve from the CONTAINER's computed
 * style when a container element is given (so the tracker's always-dark
 * terminal can pin dark-legible tokens in both site themes), fall back to
 * the document root when no container is passed, and fall back to the
 * hardcoded light-theme defaults when a token is empty.
 *
 * DOM faking follows the repo's plain-object pattern (see
 * tests/sw-update-toast.test.js): assign `global.window` / `global.document`
 * before calling into the module — the reader only touches
 * `window.getComputedStyle` and `document.documentElement` at call time.
 */

'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function load() {
  const url = new URL('file://' + path.resolve(__dirname, '..', 'src', 'lib', 'chart-theme.js'));
  return import(url.href);
}

/**
 * Install fake window/document where computed style is a per-element token
 * map. Returns the fake root and a container element carrying its own tokens.
 */
function installFakeDom({ rootTokens = {}, containerTokens = {} } = {}) {
  const rootEl = { nodeType: 1, tokens: rootTokens };
  const containerEl = { nodeType: 1, tokens: containerTokens };
  global.document = { documentElement: rootEl };
  global.window = {
    getComputedStyle: (el) => ({
      getPropertyValue: (token) => (el.tokens && el.tokens[token]) || '',
    }),
  };
  return { rootEl, containerEl };
}

function cleanupFakeDom() {
  delete global.document;
  delete global.window;
}

const DARK_PANEL_TOKENS = {
  '--text-secondary': '#a09890',
  '--border-subtle': '#211f1b',
  '--border-default': '#2e2b24',
  '--color-gold': '#ddb040',
  '--color-gold-glow': 'rgb(221 176 64 / 18%)',
  '--font-main': "'Cairo', sans-serif",
};

const LIGHT_ROOT_TOKENS = {
  '--text-secondary': '#6a5c48',
  '--border-subtle': '#ece5d2',
  '--border-default': '#d9cfb6',
  '--color-gold': '#b07d1f',
  '--color-gold-glow': 'rgb(196 144 46 / 16%)',
  '--font-main': "'Source Sans 3', sans-serif",
};

test('readChartTheme(container) resolves tokens from the container, not the root', async (t) => {
  t.after(cleanupFakeDom);
  const { readChartTheme } = await load();
  const { containerEl } = installFakeDom({
    rootTokens: LIGHT_ROOT_TOKENS,
    containerTokens: DARK_PANEL_TOKENS,
  });

  const theme = readChartTheme(containerEl);
  // The always-dark tracker terminal scenario: the site theme is light at the
  // root, but the container pins dark-legible values — those must win.
  assert.equal(theme.text, '#a09890');
  assert.equal(theme.grid, '#211f1b');
  assert.equal(theme.border, '#2e2b24');
  assert.equal(theme.line, '#ddb040');
  assert.equal(theme.areaTop, 'rgb(221 176 64 / 18%)');
  assert.equal(theme.fontFamily, "'Cairo', sans-serif");
});

test('readChartTheme() without a container falls back to the document root', async (t) => {
  t.after(cleanupFakeDom);
  const { readChartTheme } = await load();
  installFakeDom({ rootTokens: LIGHT_ROOT_TOKENS });

  const theme = readChartTheme();
  assert.equal(theme.text, '#6a5c48');
  assert.equal(theme.line, '#b07d1f');
  assert.equal(theme.grid, '#ece5d2');
});

test('readChartTheme(nonElement) falls back to the document root', async (t) => {
  t.after(cleanupFakeDom);
  const { readChartTheme } = await load();
  installFakeDom({ rootTokens: LIGHT_ROOT_TOKENS });

  for (const bogus of [null, undefined, {}, { nodeType: 3 }]) {
    const theme = readChartTheme(bogus);
    assert.equal(theme.text, '#6a5c48', `container=${JSON.stringify(bogus)} must use root`);
  }
});

test('readChartTheme() falls back to hardcoded defaults when tokens are empty', async (t) => {
  t.after(cleanupFakeDom);
  const { readChartTheme } = await load();
  const { containerEl } = installFakeDom({ rootTokens: {}, containerTokens: {} });

  const theme = readChartTheme(containerEl);
  assert.equal(theme.text, '#6a6050');
  assert.equal(theme.grid, 'rgba(230,224,208,0.5)');
  assert.equal(theme.border, 'rgba(230,224,208,0.8)');
  assert.equal(theme.line, '#c4902e');
  assert.equal(theme.areaTop, 'rgba(196,144,46,0.22)');
  assert.equal(theme.fontFamily, "'Source Sans 3', system-ui, sans-serif");
});

test('readChartTheme() always returns the fixed transparent area bottom', async (t) => {
  t.after(cleanupFakeDom);
  const { readChartTheme } = await load();
  const { containerEl } = installFakeDom({ containerTokens: DARK_PANEL_TOKENS });

  assert.equal(readChartTheme(containerEl).areaBottom, 'rgba(196,144,46,0.02)');
  assert.equal(readChartTheme().areaBottom, 'rgba(196,144,46,0.02)');
});

test('readChartTheme() trims token whitespace', async (t) => {
  t.after(cleanupFakeDom);
  const { readChartTheme } = await load();
  const { containerEl } = installFakeDom({
    containerTokens: { '--color-gold': '  #ddb040  ' },
  });

  assert.equal(readChartTheme(containerEl).line, '#ddb040');
});
