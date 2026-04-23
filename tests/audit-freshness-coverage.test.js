'use strict';

/**
 * Unit tests for scripts/node/audit-freshness-coverage.js.
 *
 * Locks detection heuristics so the advisory report's meaning does not
 * drift silently.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');

const {
  classifyKind,
  detectLiveStatusUsage,
  detectFreshnessKeys,
  looksLikePriceRender,
  detectLabelHeuristics,
  summarize,
} = require('../scripts/node/audit-freshness-coverage.js');

test('classifyKind routes paths to expected buckets', () => {
  assert.equal(classifyKind('src/lib/live-status.js'), 'live-status-module');
  assert.equal(classifyKind('src/pages/home.js'), 'page-module');
  assert.equal(classifyKind('src/tracker/render.js'), 'tracker-module');
  assert.equal(classifyKind('src/components/nav.js'), 'component');
  assert.equal(classifyKind('src/lib/formatter.js'), 'lib');
  assert.equal(classifyKind('src/search/searchIndex.js'), 'search');
  assert.equal(classifyKind('src/config/countries.js'), 'config');
});

test('detectLiveStatusUsage recognizes direct import and symbol references', () => {
  const withImport = `import { getLiveFreshness } from '../lib/live-status.js';`;
  const byReference = `if (x.key === 'live') formatRelativeAge(ageMs);`;
  const neither = `const foo = 1;`;

  const a = detectLiveStatusUsage(withImport);
  assert.equal(a.imports, true);
  assert.equal(a.symbols.getLiveFreshness, true);
  assert.equal(a.any, true);

  const b = detectLiveStatusUsage(byReference);
  assert.equal(b.imports, false);
  assert.equal(b.symbols.formatRelativeAge, true);
  assert.equal(b.any, true);

  const c = detectLiveStatusUsage(neither);
  assert.equal(c.any, false);
});

test('detectFreshnessKeys finds exactly the literal keys present', () => {
  const source = `const key = ageMs > X ? 'stale' : failure ? "cached" : \`live\`;`;
  assert.deepEqual(detectFreshnessKeys(source).sort(), ['cached', 'live', 'stale']);
  assert.deepEqual(detectFreshnessKeys(`'stale' only`), ['stale']);
  assert.deepEqual(detectFreshnessKeys(`no keys here`), []);
});

test('looksLikePriceRender requires at least two distinct price tokens', () => {
  assert.equal(looksLikePriceRender(`const price = \`\${value} USD / gram\`;`), true);
  assert.equal(looksLikePriceRender(`"USD only"`), false);
  assert.equal(looksLikePriceRender(`"spot price per ounce"`), true);
  assert.equal(looksLikePriceRender(`const x = 42;`), false);
});

test('detectLabelHeuristics sees source and timestamp labels', () => {
  const source = `const el = renderChip({ source: 'goldapi', updatedAt: Date.now() });`;
  const result = detectLabelHeuristics(source);
  assert.equal(result.hasSourceLabel, true);
  assert.equal(result.hasTimestampLabel, true);

  const minimal = `const foo = 1;`;
  const empty = detectLabelHeuristics(minimal);
  assert.equal(empty.hasSourceLabel, false);
  assert.equal(empty.hasTimestampLabel, false);
});

test('detectLabelHeuristics flags formatRelativeAge as a timestamp signal', () => {
  const source = `const text = formatRelativeAge(ageMs, lang);`;
  const result = detectLabelHeuristics(source);
  assert.equal(result.hasTimestampLabel, true);
});

test('summarize counts full coverage, missing branches, and orphan renderers', () => {
  const records = [
    {
      kind: 'page-module',
      importsLiveStatus: true,
      usedSymbols: ['getLiveFreshness'],
      rendersPriceLike: true,
      freshnessKeysMatched: ['live', 'cached', 'stale'],
    },
    {
      kind: 'page-module',
      importsLiveStatus: true,
      usedSymbols: ['getLiveFreshness'],
      rendersPriceLike: true,
      freshnessKeysMatched: ['live', 'cached'],
    },
    {
      kind: 'component',
      importsLiveStatus: false,
      usedSymbols: [],
      rendersPriceLike: true,
      freshnessKeysMatched: [],
    },
  ];
  const s = summarize(records);
  assert.equal(s.totalSurfaces, 3);
  assert.equal(s.consumersWithAllThreeBranches, 1);
  assert.equal(s.consumersMissingStale, 1);
  assert.equal(s.consumersMissingCached, 0);
  assert.equal(s.priceRenderersWithoutLiveStatus, 1);
});
