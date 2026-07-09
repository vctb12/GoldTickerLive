/**
 * Unit tests for the runtime learn-hub structured-data helper
 * (src/seo/learn-schema.js):
 *   - buildLearnArticleSchema  → per-language Article JSON-LD from the shared model
 *   - injectLearnArticleSchema → atomic replace (no duplicate Article) in the head
 *
 * Uses the REAL LEARN_ARTICLE model + resolveLearnHubText so the EN/AR parity
 * assertions exercise the same data source that renders the guide. A minimal
 * document stub avoids a jsdom dependency (same approach as seo-runtime-helpers).
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

function makeScript() {
  return {
    tagName: 'SCRIPT',
    type: '',
    id: '',
    textContent: '',
    parent: null,
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
    createElement: () => makeScript(),
    // Seed a pre-existing JSON-LD block (e.g. the build-time injector output).
    _seedScript(obj, id = '') {
      const s = makeScript();
      s.type = 'application/ld+json';
      s.id = id;
      s.textContent = JSON.stringify(obj);
      s.parent = head;
      head.children.push(s);
      return s;
    },
    querySelectorAll(selector) {
      if (selector === 'script[type="application/ld+json"]') {
        return head.children.filter((n) => n.type === 'application/ld+json');
      }
      return [];
    },
  };
}

async function loadFixtures() {
  const model = await loadModule('src/learn-hub/content-model.js');
  const schema = await loadModule('src/seo/learn-schema.js');
  return {
    LEARN_ARTICLE: model.LEARN_ARTICLE,
    resolveLearnHubText: model.resolveLearnHubText,
    ...schema,
  };
}

// ── buildLearnArticleSchema ──────────────────────────────────────────────────

describe('buildLearnArticleSchema', () => {
  test('produces a valid Article in both languages, built from the model', async () => {
    const { LEARN_ARTICLE, resolveLearnHubText, buildLearnArticleSchema } = await loadFixtures();
    for (const lang of ['en', 'ar']) {
      const schema = buildLearnArticleSchema({
        article: LEARN_ARTICLE,
        lang,
        resolveText: resolveLearnHubText,
      });
      assert.equal(schema['@context'], 'https://schema.org');
      assert.equal(schema['@type'], 'Article');
      assert.equal(schema.inLanguage, lang);
      assert.ok(schema.headline && schema.headline.length > 0, `${lang}: headline required`);
      assert.ok(
        schema.description && schema.description.length > 0,
        `${lang}: description required`
      );
      assert.match(schema.url, /\/learn\.html$/);
      assert.equal(schema.author['@type'], 'Organization');
      assert.equal(schema.publisher['@type'], 'Organization');
      assert.equal(schema.publisher.logo['@type'], 'ImageObject');
      // datePublished must not post-date dateModified (valid Article dates).
      assert.ok(schema.datePublished <= schema.dateModified, `${lang}: published <= modified`);
    }
  });

  test('EN and AR headline/description differ — Arabic is not hardcoded English', async () => {
    const { LEARN_ARTICLE, resolveLearnHubText, buildLearnArticleSchema } = await loadFixtures();
    const en = buildLearnArticleSchema({
      article: LEARN_ARTICLE,
      lang: 'en',
      resolveText: resolveLearnHubText,
    });
    const ar = buildLearnArticleSchema({
      article: LEARN_ARTICLE,
      lang: 'ar',
      resolveText: resolveLearnHubText,
    });
    assert.notEqual(en.headline, ar.headline, 'headline must be localized');
    assert.notEqual(en.description, ar.description, 'description must be localized');
    // Arabic strings must actually contain Arabic script.
    assert.match(ar.headline, /[؀-ۿ]/, 'AR headline must contain Arabic characters');
    assert.match(ar.description, /[؀-ۿ]/, 'AR description must contain Arabic characters');
  });

  test('description carries the reference-vs-retail trust promise in both languages', async () => {
    const { LEARN_ARTICLE, resolveLearnHubText, buildLearnArticleSchema } = await loadFixtures();
    const en = buildLearnArticleSchema({
      article: LEARN_ARTICLE,
      lang: 'en',
      resolveText: resolveLearnHubText,
    });
    const ar = buildLearnArticleSchema({
      article: LEARN_ARTICLE,
      lang: 'ar',
      resolveText: resolveLearnHubText,
    });
    assert.match(en.description, /reference/i, 'EN description must state reference estimates');
    assert.match(ar.description, /مرجعية/, 'AR description must state reference estimates');
  });

  test('returns null when article or resolver is missing', async () => {
    const { LEARN_ARTICLE, resolveLearnHubText, buildLearnArticleSchema } = await loadFixtures();
    assert.equal(buildLearnArticleSchema({ lang: 'en', resolveText: resolveLearnHubText }), null);
    assert.equal(buildLearnArticleSchema({ article: LEARN_ARTICLE, lang: 'en' }), null);
    assert.equal(buildLearnArticleSchema(), null);
  });
});

// ── injectLearnArticleSchema ─────────────────────────────────────────────────

describe('injectLearnArticleSchema', () => {
  test('appends the Article script and is idempotent by id', async () => {
    const {
      LEARN_ARTICLE,
      resolveLearnHubText,
      buildLearnArticleSchema,
      injectLearnArticleSchema,
    } = await loadFixtures();
    const doc = makeDocument();
    const schema = buildLearnArticleSchema({
      article: LEARN_ARTICLE,
      lang: 'en',
      resolveText: resolveLearnHubText,
    });

    const first = injectLearnArticleSchema(doc, schema);
    assert.equal(first.type, 'application/ld+json');
    assert.deepEqual(JSON.parse(first.textContent), schema);

    injectLearnArticleSchema(doc, schema);
    const scripts = doc.head.children.filter((n) => n.type === 'application/ld+json');
    assert.equal(scripts.length, 1, 'must replace, not stack, the Article schema');
  });

  test('replaces a pre-existing build-time Article and preserves BreadcrumbList', async () => {
    const {
      LEARN_ARTICLE,
      resolveLearnHubText,
      buildLearnArticleSchema,
      injectLearnArticleSchema,
    } = await loadFixtures();
    const doc = makeDocument();
    // Simulate the build-injected head: BreadcrumbList + an id-less English Article.
    doc._seedScript({ '@context': 'https://schema.org', '@type': 'BreadcrumbList' });
    doc._seedScript({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: 'English only',
      inLanguage: 'en',
    });

    const arSchema = buildLearnArticleSchema({
      article: LEARN_ARTICLE,
      lang: 'ar',
      resolveText: resolveLearnHubText,
    });
    injectLearnArticleSchema(doc, arSchema);

    const objs = doc.head.children
      .filter((n) => n.type === 'application/ld+json')
      .map((n) => JSON.parse(n.textContent));
    const articles = objs.filter((o) => o['@type'] === 'Article');
    const breadcrumbs = objs.filter((o) => o['@type'] === 'BreadcrumbList');
    assert.equal(articles.length, 1, 'exactly one Article schema must remain (no duplicate)');
    assert.equal(articles[0].inLanguage, 'ar', 'the surviving Article must be the AR one');
    assert.equal(breadcrumbs.length, 1, 'BreadcrumbList must be preserved');
  });

  test('null schema is a no-op', async () => {
    const { injectLearnArticleSchema } = await loadFixtures();
    const doc = makeDocument();
    assert.equal(injectLearnArticleSchema(doc, null), null);
    assert.equal(doc.head.children.length, 0);
  });
});
