'use strict';

/**
 * Regression coverage for src/lib/media-governance.js.
 *
 * Ensures post-paint injected images/iframes get lazy-loading defaults, while
 * fetchpriority=high LCP images are left alone, and title-less iframes get an
 * accessible title fallback.
 */

const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

function makeNode(attrs = {}) {
  const store = new Map(Object.entries(attrs));
  const node = {
    loading: undefined,
    getAttribute(name) {
      return store.has(name) ? store.get(name) : null;
    },
    setAttribute(name, value) {
      store.set(name, String(value));
    },
  };
  return node;
}

function installRoot({ images = [], iframes = [] } = {}) {
  const root = {
    querySelectorAll(sel) {
      if (sel.startsWith('img')) return images;
      if (sel.startsWith('iframe')) return iframes;
      return [];
    },
  };
  return root;
}

async function load() {
  const url = new URL(
    'file://' + path.resolve(__dirname, '..', 'src', 'lib', 'media-governance.js')
  );
  return import(url.href + `?v=${Date.now()}`);
}

afterEach(() => {
  delete global.document;
});

test('ensureLazyMedia sets loading=lazy on images without loading attr', async () => {
  const img = makeNode();
  const root = installRoot({ images: [img] });
  const { ensureLazyMedia } = await load();
  ensureLazyMedia(root);
  assert.equal(img.loading, 'lazy');
});

test('ensureLazyMedia skips fetchpriority=high images (LCP path)', async () => {
  const img = makeNode({ fetchpriority: 'high' });
  const root = installRoot({ images: [img] });
  const { ensureLazyMedia } = await load();
  ensureLazyMedia(root);
  assert.equal(img.loading, undefined);
});

test('ensureLazyMedia lazy-loads iframes and adds title when missing', async () => {
  const iframe = makeNode();
  const root = installRoot({ iframes: [iframe] });
  const { ensureLazyMedia } = await load();
  ensureLazyMedia(root);
  assert.equal(iframe.loading, 'lazy');
  assert.equal(iframe.getAttribute('title'), 'Embedded content');
});

test('ensureLazyMedia preserves existing iframe title / aria-label', async () => {
  const titled = makeNode({ title: 'Map' });
  const labelled = makeNode({ 'aria-label': 'Video' });
  const root = installRoot({ iframes: [titled, labelled] });
  const { ensureLazyMedia } = await load();
  ensureLazyMedia(root);
  assert.equal(titled.getAttribute('title'), 'Map');
  assert.equal(labelled.getAttribute('aria-label'), 'Video');
  assert.equal(labelled.getAttribute('title'), null);
});
