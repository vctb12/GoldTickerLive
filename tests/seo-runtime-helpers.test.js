/**
 * Unit tests for the runtime SEO helpers:
 *   - src/seo/canonical.js  (normalizePathname, buildCanonicalUrl, enforceCanonicalOnDocument)
 *   - src/seo/hreflang.js   (buildHreflangAlternates, enforceHreflangAlternates)
 *   - src/seo/faq-schema.js (buildMethodologyFaqSchema, injectFaqSchema)
 *
 * These modules were previously validated only indirectly through built-HTML
 * guard tests (tests/seo-*.test.js); this file exercises the functions
 * directly with a minimal document stub — no jsdom dependency required.
 */

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

function loadModule(rel) {
  const url = new URL('file://' + path.resolve(__dirname, '..', rel));
  return import(url.href);
}

// ── Minimal DOM stub ─────────────────────────────────────────────────────────

function makeElement(tag) {
  return {
    tagName: tag.toUpperCase(),
    attributes: {},
    textContent: '',
    type: '',
    id: '',
    parent: null,
    setAttribute(name, value) {
      this.attributes[name] = String(value);
    },
    getAttribute(name) {
      return Object.prototype.hasOwnProperty.call(this.attributes, name)
        ? this.attributes[name]
        : null;
    },
    remove() {
      if (this.parent) {
        const i = this.parent.children.indexOf(this);
        if (i !== -1) this.parent.children.splice(i, 1);
        this.parent = null;
      }
    },
  };
}

function makeDocument() {
  const head = {
    children: [],
    appendChild(node) {
      node.parent = head;
      head.children.push(node);
      return node;
    },
  };
  return {
    head,
    createElement: (tag) => makeElement(tag),
    getElementById(id) {
      return head.children.find((n) => n.id === id) || null;
    },
    querySelector(selector) {
      if (selector === 'link[rel="canonical"]') {
        return head.children.find((n) => n.getAttribute && n.getAttribute('rel') === 'canonical');
      }
      return null;
    },
    querySelectorAll(selector) {
      if (selector === 'link[rel="alternate"][hreflang]') {
        return head.children.filter(
          (n) =>
            n.getAttribute &&
            n.getAttribute('rel') === 'alternate' &&
            n.getAttribute('hreflang') !== null
        );
      }
      return [];
    },
  };
}

// ── canonical.js ─────────────────────────────────────────────────────────────

describe('src/seo/canonical.js', () => {
  test('normalizePathname handles root, missing slash, and legacy prefix', async () => {
    const { normalizePathname } = await loadModule('src/seo/canonical.js');
    assert.equal(normalizePathname(), '/');
    assert.equal(normalizePathname(''), '/');
    assert.equal(normalizePathname('tracker.html'), '/tracker.html');
    assert.equal(normalizePathname('/Gold-Prices'), '/');
    assert.equal(normalizePathname('/Gold-Prices/chart/'), '/chart/');
    assert.equal(normalizePathname('/countries/uae/'), '/countries/uae/');
  });

  test('buildCanonicalUrl returns absolute canonical URLs', async () => {
    const { buildCanonicalUrl, CANONICAL_BASE } = await loadModule('src/seo/canonical.js');
    assert.equal(buildCanonicalUrl('/'), `${CANONICAL_BASE}/`);
    assert.equal(buildCanonicalUrl('calculator.html'), `${CANONICAL_BASE}/calculator.html`);
    assert.equal(buildCanonicalUrl('/Gold-Prices/tracker.html'), `${CANONICAL_BASE}/tracker.html`);
  });

  test('enforceCanonicalOnDocument creates the link tag when absent', async () => {
    const { enforceCanonicalOnDocument, CANONICAL_BASE } = await loadModule('src/seo/canonical.js');
    const doc = makeDocument();
    const url = enforceCanonicalOnDocument(doc, '/chart/');
    assert.equal(url, `${CANONICAL_BASE}/chart/`);
    const tag = doc.querySelector('link[rel="canonical"]');
    assert.ok(tag, 'canonical link must be appended to head');
    assert.equal(tag.getAttribute('href'), url);
  });

  test('enforceCanonicalOnDocument updates an existing tag instead of duplicating', async () => {
    const { enforceCanonicalOnDocument, CANONICAL_BASE } = await loadModule('src/seo/canonical.js');
    const doc = makeDocument();
    enforceCanonicalOnDocument(doc, '/a.html');
    enforceCanonicalOnDocument(doc, '/b.html');
    const tags = doc.head.children.filter((n) => n.getAttribute('rel') === 'canonical');
    assert.equal(tags.length, 1, 'must not duplicate the canonical tag');
    assert.equal(tags[0].getAttribute('href'), `${CANONICAL_BASE}/b.html`);
  });
});

// ── hreflang.js ──────────────────────────────────────────────────────────────

describe('src/seo/hreflang.js', () => {
  test('buildHreflangAlternates returns x-default, en, and ar entries', async () => {
    const { buildHreflangAlternates } = await loadModule('src/seo/hreflang.js');
    const { CANONICAL_BASE } = await loadModule('src/seo/canonical.js');
    const alternates = buildHreflangAlternates('/calculator.html');
    assert.deepEqual(
      alternates.map((a) => a.hreflang),
      ['x-default', 'en', 'ar']
    );
    const canonical = `${CANONICAL_BASE}/calculator.html`;
    assert.equal(alternates[0].href, canonical);
    assert.equal(alternates[1].href, canonical);
    assert.equal(alternates[2].href, `${canonical}?lang=ar`);
  });

  test('enforceHreflangAlternates replaces stale alternates atomically', async () => {
    const { enforceHreflangAlternates } = await loadModule('src/seo/hreflang.js');
    const doc = makeDocument();
    enforceHreflangAlternates(doc, '/old.html');
    enforceHreflangAlternates(doc, '/new.html');
    const links = doc.querySelectorAll('link[rel="alternate"][hreflang]');
    assert.equal(links.length, 3, 'stale alternates must be removed, not accumulated');
    links.forEach((link) => {
      assert.match(link.getAttribute('href'), /\/new\.html/);
    });
  });
});

// ── faq-schema.js ────────────────────────────────────────────────────────────

describe('src/seo/faq-schema.js', () => {
  test('buildMethodologyFaqSchema produces valid FAQPage JSON-LD in both languages', async () => {
    const { buildMethodologyFaqSchema } = await loadModule('src/seo/faq-schema.js');
    for (const lang of ['en', 'ar']) {
      const schema = buildMethodologyFaqSchema(lang);
      assert.equal(schema['@context'], 'https://schema.org');
      assert.equal(schema['@type'], 'FAQPage');
      assert.equal(schema.inLanguage, lang);
      assert.ok(schema.mainEntity.length >= 3);
      for (const q of schema.mainEntity) {
        assert.equal(q['@type'], 'Question');
        assert.ok(q.name.length > 0);
        assert.equal(q.acceptedAnswer['@type'], 'Answer');
        assert.ok(q.acceptedAnswer.text.length > 0);
      }
    }
  });

  test('FAQ copy keeps the reference-vs-retail trust promise in both languages', async () => {
    const { buildMethodologyFaqSchema } = await loadModule('src/seo/faq-schema.js');
    const en = buildMethodologyFaqSchema('en');
    const answers = en.mainEntity.map((q) => q.acceptedAnswer.text).join(' ');
    assert.match(answers, /reference estimates/i, 'EN copy must state prices are references');
    const ar = buildMethodologyFaqSchema('ar');
    const arAnswers = ar.mainEntity.map((q) => q.acceptedAnswer.text).join(' ');
    assert.match(arAnswers, /مرجعية/, 'AR copy must state prices are references');
  });

  test('injectFaqSchema appends a JSON-LD script and is idempotent by id', async () => {
    const { buildMethodologyFaqSchema, injectFaqSchema } =
      await loadModule('src/seo/faq-schema.js');
    const doc = makeDocument();
    const schema = buildMethodologyFaqSchema('en');

    const first = injectFaqSchema(doc, schema);
    assert.equal(first.type, 'application/ld+json');
    assert.deepEqual(JSON.parse(first.textContent), schema);

    injectFaqSchema(doc, schema);
    const scripts = doc.head.children.filter((n) => n.type === 'application/ld+json');
    assert.equal(scripts.length, 1, 'must replace the existing script, not stack duplicates');

    assert.equal(injectFaqSchema(doc, null), null, 'null schema must be a no-op');
  });
});
