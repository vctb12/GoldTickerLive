/**
 * Unit tests for the glossary structured-data helper:
 *   src/seo/glossary-schema.js
 *     - collectGlossaryTerms       (active-locale DOM read, no cross-contamination)
 *     - buildGlossaryTermSetSchema (DefinedTermSet + DefinedTerm, both languages)
 *     - injectGlossarySchema       (idempotent by id, no-op on empty)
 *     - syncGlossarySchema         (collect → build → inject)
 *
 * Exercised directly against a minimal document stub — no jsdom dependency —
 * matching the approach in tests/seo-runtime-helpers.test.js.
 */

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

function loadModule(rel) {
  const url = new URL('file://' + path.resolve(__dirname, '..', rel));
  return import(url.href);
}

// ── Minimal DOM stubs ────────────────────────────────────────────────────────

function makeHeadElement(tag) {
  return {
    tagName: tag.toUpperCase(),
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

/**
 * Build a document stub whose `[data-lang-block="<locale>"] .gloss-term`
 * queries resolve to the supplied localized term fixtures, and whose head
 * supports createElement/appendChild/getElementById/remove.
 *
 * @param {{en?: Array, ar?: Array}} fixtures  each term: {name, def, id?}
 */
function makeGlossaryDocument(fixtures = {}) {
  const head = {
    children: [],
    appendChild(node) {
      node.parent = head;
      head.children.push(node);
      return node;
    },
  };

  function makeTermNode(term) {
    return {
      id: term.id || '',
      getAttribute(name) {
        return name === 'id' ? term.id || null : null;
      },
      querySelector(sel) {
        if (sel === '.gloss-term-name') return { textContent: term.name };
        if (sel === '.gloss-term-def') return { textContent: term.def };
        return null;
      },
    };
  }

  const byLocale = {
    en: (fixtures.en || []).map(makeTermNode),
    ar: (fixtures.ar || []).map(makeTermNode),
  };

  return {
    head,
    createElement: (tag) => makeHeadElement(tag),
    getElementById(id) {
      return head.children.find((n) => n.id === id) || null;
    },
    querySelectorAll(selector) {
      const m = selector.match(/^\[data-lang-block="(en|ar)"\] \.gloss-term$/);
      if (m) return byLocale[m[1]];
      return [];
    },
  };
}

const EN_FIXTURE = [
  {
    id: 'term-spot-price',
    name: 'Spot price',
    def: 'The current global market price for one troy ounce of gold, quoted in XAU/USD. Prices shown here are spot-linked reference values, not live dealer quotes.',
  },
  {
    id: 'term-making-charge',
    name: 'Making charge',
    def: 'The fee added for crafting jewellery — labour, design and manufacturing — charged on top of the metal value.',
  },
];

const AR_FIXTURE = [
  {
    name: 'السعر الفوري',
    def: 'السعر العالمي الحالي للأونصة التروية من الذهب، ويُسعَّر بالدولار الأمريكي (XAU/USD). والأسعار المعروضة هنا قيم مرجعية، وليست عروضاً حية من التجار.',
  },
  {
    name: 'أجور الصياغة',
    def: 'الرسوم المضافة مقابل تصنيع المجوهرات من عمالة وتصميم وتصنيع، وتُحتسب فوق قيمة الذهب المعدنية.',
  },
];

// ── collectGlossaryTerms ─────────────────────────────────────────────────────

describe('collectGlossaryTerms', () => {
  test('reads only the requested locale block (no cross-contamination)', async () => {
    const { collectGlossaryTerms } = await loadModule('src/seo/glossary-schema.js');
    const doc = makeGlossaryDocument({ en: EN_FIXTURE, ar: AR_FIXTURE });

    const en = collectGlossaryTerms(doc, 'en');
    assert.equal(en.length, 2);
    assert.equal(en[0].name, 'Spot price');
    assert.equal(en[0].id, 'term-spot-price');
    assert.match(en[0].description, /reference values/);

    const ar = collectGlossaryTerms(doc, 'ar');
    assert.equal(ar.length, 2);
    assert.equal(ar[0].name, 'السعر الفوري');
    // AR blocks carry no ids to reuse.
    assert.equal(ar[0].id, undefined);
    // AR definitions must not leak English.
    assert.doesNotMatch(ar[0].description, /reference values/);
  });

  test('normalizes whitespace and skips terms missing name or definition', async () => {
    const { collectGlossaryTerms } = await loadModule('src/seo/glossary-schema.js');
    const doc = makeGlossaryDocument({
      en: [
        {
          id: 'term-a',
          name: '  Spread \n (bid/ask) ',
          def: '  The\n  difference   between bid and ask. ',
        },
        { id: 'term-empty', name: '', def: 'orphan definition' },
        { id: 'term-noname', name: 'No def', def: '   ' },
      ],
    });
    const en = collectGlossaryTerms(doc, 'en');
    assert.equal(en.length, 1, 'terms without a name or definition are dropped');
    assert.equal(en[0].name, 'Spread (bid/ask)');
    assert.equal(en[0].description, 'The difference between bid and ask.');
  });

  test('returns [] for a document without querySelectorAll', async () => {
    const { collectGlossaryTerms } = await loadModule('src/seo/glossary-schema.js');
    assert.deepEqual(collectGlossaryTerms({}, 'en'), []);
    assert.deepEqual(collectGlossaryTerms(null, 'en'), []);
  });
});

// ── buildGlossaryTermSetSchema ───────────────────────────────────────────────

describe('buildGlossaryTermSetSchema', () => {
  test('produces a valid DefinedTermSet with each term as a DefinedTerm (EN + AR)', async () => {
    const { buildGlossaryTermSetSchema } = await loadModule('src/seo/glossary-schema.js');

    const cases = [
      { lang: 'en', terms: [{ name: 'Spot price', description: 'X', id: 'term-spot-price' }] },
      { lang: 'ar', terms: [{ name: 'السعر الفوري', description: 'ص' }] },
    ];

    for (const { lang, terms } of cases) {
      const schema = buildGlossaryTermSetSchema(terms, lang);
      assert.equal(schema['@context'], 'https://schema.org');
      assert.equal(schema['@type'], 'DefinedTermSet');
      assert.equal(schema.inLanguage, lang);
      assert.ok(schema['@id'].includes(`definedtermset-${lang}`));
      assert.ok(schema.name.length > 0);
      assert.ok(schema.description.length > 0);
      assert.ok(Array.isArray(schema.hasDefinedTerm) && schema.hasDefinedTerm.length === 1);

      const term = schema.hasDefinedTerm[0];
      assert.equal(term['@type'], 'DefinedTerm');
      assert.ok(term.name.length > 0);
      assert.ok(term.description.length > 0);
      assert.equal(term.inDefinedTermSet, schema['@id']);
    }
  });

  test('EN set url is bare; AR set url and term urls carry ?lang=ar', async () => {
    const { buildGlossaryTermSetSchema } = await loadModule('src/seo/glossary-schema.js');

    const en = buildGlossaryTermSetSchema(
      [{ name: 'Spot price', description: 'x', id: 'term-spot-price' }],
      'en'
    );
    assert.equal(en.url, 'https://goldtickerlive.com/glossary.html');
    assert.equal(
      en.hasDefinedTerm[0].url,
      'https://goldtickerlive.com/glossary.html#term-spot-price'
    );

    const ar = buildGlossaryTermSetSchema(
      [{ name: 'السعر الفوري', description: 'ص', id: 'term-spot-price' }],
      'ar'
    );
    assert.equal(ar.url, 'https://goldtickerlive.com/glossary.html?lang=ar');
    assert.equal(
      ar.hasDefinedTerm[0].url,
      'https://goldtickerlive.com/glossary.html?lang=ar#term-spot-price'
    );
  });

  test('omits per-term url when the term has no anchor id, and drops incomplete terms', async () => {
    const { buildGlossaryTermSetSchema } = await loadModule('src/seo/glossary-schema.js');
    const schema = buildGlossaryTermSetSchema(
      [
        { name: 'No anchor', description: 'valid' },
        { name: '', description: 'dropped: no name' },
        { name: 'dropped: no def', description: '' },
      ],
      'en'
    );
    assert.equal(schema.hasDefinedTerm.length, 1);
    assert.equal(schema.hasDefinedTerm[0].url, undefined);
  });

  test('caller-supplied localized meta overrides the default set label', async () => {
    const { buildGlossaryTermSetSchema } = await loadModule('src/seo/glossary-schema.js');
    const schema = buildGlossaryTermSetSchema([{ name: 'مصطلح', description: 'تعريف' }], 'ar', {
      name: 'مسرد مصطلحات الذهب',
      description: 'تعريفات مبسّطة',
    });
    assert.equal(schema.name, 'مسرد مصطلحات الذهب');
    assert.equal(schema.description, 'تعريفات مبسّطة');
  });

  test('the JSON-LD serializes and round-trips cleanly', async () => {
    const { buildGlossaryTermSetSchema } = await loadModule('src/seo/glossary-schema.js');
    const schema = buildGlossaryTermSetSchema(
      [{ name: 'Spot price', description: 'x', id: 'term-spot-price' }],
      'en'
    );
    const json = JSON.stringify(schema);
    assert.deepEqual(JSON.parse(json), schema);
  });
});

// ── injectGlossarySchema ─────────────────────────────────────────────────────

describe('injectGlossarySchema', () => {
  test('appends a JSON-LD script and is idempotent by id', async () => {
    const { buildGlossaryTermSetSchema, injectGlossarySchema, GLOSSARY_SCHEMA_ID } =
      await loadModule('src/seo/glossary-schema.js');
    const doc = makeGlossaryDocument();
    const schema = buildGlossaryTermSetSchema(
      [{ name: 'Spot price', description: 'x', id: 'term-spot-price' }],
      'en'
    );

    const first = injectGlossarySchema(doc, schema);
    assert.equal(first.type, 'application/ld+json');
    assert.equal(first.id, GLOSSARY_SCHEMA_ID);
    assert.deepEqual(JSON.parse(first.textContent), schema);

    injectGlossarySchema(doc, schema);
    const scripts = doc.head.children.filter((n) => n.type === 'application/ld+json');
    assert.equal(scripts.length, 1, 'must replace the existing script, not stack duplicates');
  });

  test('is a no-op for null or termless schema', async () => {
    const { injectGlossarySchema } = await loadModule('src/seo/glossary-schema.js');
    const doc = makeGlossaryDocument();
    assert.equal(injectGlossarySchema(doc, null), null);
    assert.equal(injectGlossarySchema(doc, { hasDefinedTerm: [] }), null);
    assert.equal(doc.head.children.length, 0);
  });
});

// ── syncGlossarySchema (end to end) ──────────────────────────────────────────

describe('syncGlossarySchema', () => {
  test('EN and AR each emit a localized DefinedTermSet from the DOM', async () => {
    const { syncGlossarySchema } = await loadModule('src/seo/glossary-schema.js');
    const doc = makeGlossaryDocument({ en: EN_FIXTURE, ar: AR_FIXTURE });

    const enNode = syncGlossarySchema(doc, 'en', {
      name: 'Gold Glossary',
      description: 'EN sub',
    });
    const enSchema = JSON.parse(enNode.textContent);
    assert.equal(enSchema.inLanguage, 'en');
    assert.equal(enSchema.name, 'Gold Glossary');
    assert.equal(enSchema.hasDefinedTerm.length, EN_FIXTURE.length);
    assert.equal(enSchema.hasDefinedTerm[0].name, 'Spot price');

    // Toggling to AR replaces (not stacks) the schema, localized to Arabic.
    const arNode = syncGlossarySchema(doc, 'ar', {
      name: 'مسرد مصطلحات الذهب',
      description: 'AR sub',
    });
    const arSchema = JSON.parse(arNode.textContent);
    assert.equal(arSchema.inLanguage, 'ar');
    assert.equal(arSchema.name, 'مسرد مصطلحات الذهب');
    assert.equal(arSchema.hasDefinedTerm[0].name, 'السعر الفوري');

    const scripts = doc.head.children.filter((n) => n.type === 'application/ld+json');
    assert.equal(scripts.length, 1, 'language toggle swaps schema, never accumulates');
  });

  test('returns null when the DOM has no terms', async () => {
    const { syncGlossarySchema } = await loadModule('src/seo/glossary-schema.js');
    const doc = makeGlossaryDocument({});
    assert.equal(syncGlossarySchema(doc, 'en'), null);
    assert.equal(doc.head.children.length, 0);
  });
});
