'use strict';

// Guards the learn corpus lazy-split (docs/AGENT_MASTER_TRACKER item 19 / audit F):
// the EN learn.html fast path must never pull the localized corpus
// (src/learn-hub/content-text.js) or the article renderer into its eager import
// graph, while the content-model barrel keeps the Node static-fallback contract
// (scripts/node/render-learn-static-fallback.mjs) fully intact.

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (rel) => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');

test('learn.js keeps the renderer + corpus out of the eager import graph', () => {
  const learn = read('src/pages/learn.js');
  assert.doesNotMatch(
    learn,
    /^import[^\n]*article-renderer\.js/m,
    'article-renderer.js must not be statically imported by learn.js'
  );
  assert.doesNotMatch(
    learn,
    /^import[^\n]*(content-text|content-model)\.js/m,
    'learn.js must not statically import the corpus or the content-model barrel'
  );
  assert.match(
    learn,
    /import\('\.\.\/learn-hub\/article-renderer\.js'\)/,
    'the article renderer must load via dynamic import'
  );
});

test('eager learn-hub modules never reach the text corpus', () => {
  for (const rel of [
    'src/learn-hub/toc-renderer.js',
    'src/learn-hub/content-registry.js',
    'src/learn-hub/content-structure.js',
  ]) {
    const src = read(rel);
    // Match import statements only — doc comments may legitimately reference
    // the corpus module by name when explaining the split.
    assert.doesNotMatch(
      src,
      /^import[^\n]*content-text\.js/m,
      `${rel} must not import content-text.js`
    );
    assert.doesNotMatch(
      src,
      /^import[^\n]*content-model\.js/m,
      `${rel} must not import the content-model barrel (it re-exports the corpus)`
    );
  }
});

test('content-model barrel preserves the Node static-fallback contract', async () => {
  const model = await import('../src/learn-hub/content-model.js');
  const text = await import('../src/learn-hub/content-text.js');
  const structure = await import('../src/learn-hub/content-structure.js');

  assert.equal(model.resolveLearnHubText, text.resolveLearnHubText);
  assert.equal(model.getLearnHubTranslations, text.getLearnHubTranslations);
  assert.equal(model.LEARN_HUB_TRANSLATIONS, text.LEARN_HUB_TRANSLATIONS);
  assert.equal(model.LEARN_ARTICLE, structure.LEARN_ARTICLE);
  assert.equal(model.LEARN_HUB_ARTICLES, structure.LEARN_HUB_ARTICLES);

  assert.equal(model.resolveLearnHubText('karats-h2', 'en'), 'Gold Karats Explained');
  assert.equal(model.resolveLearnHubText('karats-h2', 'ar'), 'شرح عيارات الذهب');
});

test('every translation key referenced by the article structure resolves in en + ar', async () => {
  const { LEARN_ARTICLE } = await import('../src/learn-hub/content-structure.js');
  const { resolveLearnHubText, LEARN_HUB_TRANSLATIONS } =
    await import('../src/learn-hub/content-text.js');

  const keys = new Set();
  (function collect(node) {
    if (Array.isArray(node)) {
      node.forEach(collect);
      return;
    }
    if (node && typeof node === 'object') {
      for (const [prop, value] of Object.entries(node)) {
        if (typeof value === 'string' && (prop === 'key' || /Key$/.test(prop))) keys.add(value);
        else collect(value);
      }
    }
  })(LEARN_ARTICLE);

  assert.ok(keys.size > 30, `expected a substantive key set, got ${keys.size}`);
  for (const key of keys) {
    for (const lang of ['en', 'ar']) {
      assert.ok(
        Object.prototype.hasOwnProperty.call(LEARN_HUB_TRANSLATIONS[lang], key),
        `missing ${lang} copy for structural key "${key}"`
      );
      assert.notEqual(
        resolveLearnHubText(key, lang),
        key,
        `structural key "${key}" must resolve to real ${lang} copy, not echo the key`
      );
    }
  }
});
