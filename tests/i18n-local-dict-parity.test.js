'use strict';

/**
 * i18n-local-dict-parity.test.js
 *
 * Site-wide EN/AR parity guard for pages that localize through their OWN local
 * dictionary instead of the global `src/config/translations.js` table.
 *
 * The existing `tests/i18n-sitewide-guard.test.js` proves EN/AR key parity for
 * the GLOBAL TRANSLATIONS table (home/tracker/country) and that every global
 * helper / data-i18n key resolves. It explicitly does NOT cover pages with a
 * local `const T = { en, ar }` / `const TXT = { en, ar }` dict — those were
 * left to a runtime Playwright scan that does not run in CI. This test closes
 * that gap statically: every local i18n dict must define the EXACT same key set
 * in `en` and `ar`, so no string can ship in one language only (the silent
 * EN-in-AR parity bug). A miss fails CI with the offending key + file.
 *
 * Keys are read from the real parse tree (acorn, already present via eslint),
 * so template-literal values, `{token}` placeholders, and nested objects in
 * values never confuse the extraction.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const acorn = require('acorn');

const ROOT = path.resolve(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// (file, dict variable) pairs — every page that owns a local en/ar dictionary.
const LOCAL_DICTS = [
  ['src/pages/calculator.js', 'T'],
  ['src/pages/shops.js', 'TXT'],
  ['src/pages/methodology.js', 'T'],
  ['src/pages/compare.js', 'T'],
  ['src/pages/invest.js', 'I18N'],
  ['src/pages/heatmap.js', 'T'],
  ['src/pages/portfolio.js', 'T'],
  ['src/pages/glossary.js', 'T'],
  ['src/pages/market.js', 'T'],
  ['src/pages/dubai-gold-price.js', 'T'],
];

const propKey = (p) => (p.key.type === 'Identifier' ? p.key.name : p.key.value);

function findObjectDecl(ast, varName) {
  for (const node of ast.body) {
    if (node.type !== 'VariableDeclaration') continue;
    for (const d of node.declarations) {
      if (
        d.id.type === 'Identifier' &&
        d.id.name === varName &&
        d.init &&
        d.init.type === 'ObjectExpression'
      ) {
        return d.init;
      }
    }
  }
  return null;
}

function localDictKeys(rel, varName) {
  const ast = acorn.parse(read(rel), { ecmaVersion: 'latest', sourceType: 'module' });
  const obj = findObjectDecl(ast, varName);
  assert.ok(obj, `${varName} object literal not found in ${rel}`);
  const out = {};
  for (const lang of ['en', 'ar']) {
    const prop = obj.properties.find(
      (p) => p.type === 'Property' && !p.computed && propKey(p) === lang
    );
    assert.ok(
      prop && prop.value.type === 'ObjectExpression',
      `${rel}: ${varName}.${lang} sub-object not found`
    );
    out[lang] = prop.value.properties
      .filter((p) => p.type === 'Property' && !p.computed)
      .map(propKey);
  }
  return out;
}

for (const [rel, varName] of LOCAL_DICTS) {
  test(`i18n local dict: ${rel} (${varName}) has identical EN/AR key sets`, () => {
    const { en, ar } = localDictKeys(rel, varName);
    assert.ok(en.length > 3, `${rel}: parsed only ${en.length} en keys — extraction likely wrong`);
    assert.ok(ar.length > 3, `${rel}: parsed only ${ar.length} ar keys — extraction likely wrong`);
    assert.equal(new Set(en).size, en.length, `${rel}: duplicate key in ${varName}.en`);
    assert.equal(new Set(ar).size, ar.length, `${rel}: duplicate key in ${varName}.ar`);
    const enSet = new Set(en);
    const arSet = new Set(ar);
    const enOnly = en.filter((k) => !arSet.has(k));
    const arOnly = ar.filter((k) => !enSet.has(k));
    assert.deepEqual(
      { enOnly, arOnly },
      { enOnly: [], arOnly: [] },
      `${rel}: ${varName} en/ar key sets diverge — every key must exist in BOTH languages`
    );
  });
}
