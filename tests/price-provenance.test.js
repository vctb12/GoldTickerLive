'use strict';

/**
 * Unit tests for the shared "About this price" provenance control.
 * Uses the same lightweight DOM stub pattern as safe-dom.test.js so el() runs
 * under node:test without jsdom.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

function importModule(relPath) {
  const url = new URL('file://' + path.resolve(__dirname, '..', relPath));
  return import(url.href + `?v=${Date.now()}`);
}

function installMockDocument() {
  const originalDocument = global.document;
  const originalNode = global.Node;
  const doc = {
    createElement(tag) {
      return {
        tagName: String(tag).toUpperCase(),
        nodeType: 1,
        ownerDocument: doc,
        attrs: {},
        dataset: {},
        style: { setProperty() {} },
        children: [],
        appendChild(child) {
          this.children.push(child);
          return child;
        },
        append(...vals) {
          for (const value of vals) {
            if (value && typeof value === 'object' && typeof value.nodeType === 'number') {
              this.children.push(value);
            } else {
              this.children.push(doc.createTextNode(value));
            }
          }
        },
        setAttribute(name, value) {
          this.attrs[name] = String(value);
        },
        addEventListener() {},
      };
    },
    createTextNode(value) {
      return { nodeType: 3, ownerDocument: doc, textContent: String(value) };
    },
  };
  global.Node = class Node {};
  global.document = doc;
  return {
    restore() {
      global.document = originalDocument;
      global.Node = originalNode;
    },
  };
}

// Recursively collect all text in a rendered node tree.
function allText(node) {
  if (!node) return '';
  if (node.nodeType === 3) return node.textContent || '';
  let s = typeof node.textContent === 'string' && !node.children?.length ? node.textContent : '';
  for (const c of node.children || []) s += ' ' + allText(c);
  return s;
}
// Collect all values of an attribute across the tree.
function collectAttr(node, attr, out = []) {
  if (!node || node.nodeType !== 1) return out;
  if (node.attrs && node.attrs[attr] != null) out.push(node.attrs[attr]);
  for (const c of node.children || []) collectAttr(c, attr, out);
  return out;
}

const UPDATED = '2026-07-11T08:00:00Z';

test('provenance: EN render exposes summary, source, basis, spot-vs-retail, methodology', async () => {
  const dom = installMockDocument();
  try {
    const { renderPriceProvenance } = await importModule('src/components/priceProvenance.js');
    const node = renderPriceProvenance({ lang: 'en', depth: 0, updatedAt: UPDATED, hasLiveFailure: false });
    assert.equal(node.tagName, 'DETAILS');
    const text = allText(node);
    assert.match(text, /About this price/);
    assert.match(text, /Gold-API\.com/);
    assert.match(text, /3\.6725/, 'AED peg basis stated');
    assert.match(text, /31\.1035/, 'troy-oz basis stated');
    assert.match(text, /not a shop retail quote/i, 'spot-vs-retail disclosed');
    assert.match(text, /Full methodology/);
    // methodology link is depth-0 relative
    const hrefs = collectAttr(node, 'href');
    assert.ok(hrefs.some((h) => h === './methodology.html'), `expected ./methodology.html in ${hrefs}`);
  } finally {
    dom.restore();
  }
});

test('provenance: AR render uses natural Arabic copy', async () => {
  const dom = installMockDocument();
  try {
    const { renderPriceProvenance } = await importModule('src/components/priceProvenance.js');
    const node = renderPriceProvenance({ lang: 'ar', depth: 0, updatedAt: UPDATED });
    const text = allText(node);
    assert.match(text, /عن هذا السعر/, 'AR summary');
    assert.match(text, /المنهجية الكاملة/, 'AR methodology label');
    assert.match(text, /3\.6725/, 'peg still stated in AR');
  } finally {
    dom.restore();
  }
});

test('provenance: depth adjusts the methodology href', async () => {
  const dom = installMockDocument();
  try {
    const { renderPriceProvenance } = await importModule('src/components/priceProvenance.js');
    const node = renderPriceProvenance({ lang: 'en', depth: 2, updatedAt: UPDATED });
    const hrefs = collectAttr(node, 'href');
    assert.ok(hrefs.some((h) => h === '../../methodology.html'), `expected ../../methodology.html in ${hrefs}`);
  } finally {
    dom.restore();
  }
});

test('provenance: a fallback snapshot never renders a live state', async () => {
  const dom = installMockDocument();
  try {
    const { renderPriceProvenance } = await importModule('src/components/priceProvenance.js');
    const node = renderPriceProvenance({ lang: 'en', updatedAt: UPDATED, isFallback: true });
    assert.notEqual(node.attrs['data-freshness'], 'live', 'fallback input must not read live');
  } finally {
    dom.restore();
  }
});

test('provenance: missing timestamp still renders (no Updated row, no crash)', async () => {
  const dom = installMockDocument();
  try {
    const { renderPriceProvenance } = await importModule('src/components/priceProvenance.js');
    const node = renderPriceProvenance({ lang: 'en' });
    assert.equal(node.tagName, 'DETAILS');
    assert.match(allText(node), /About this price/);
  } finally {
    dom.restore();
  }
});
