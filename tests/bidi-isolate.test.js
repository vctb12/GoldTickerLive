'use strict';

// bidiIsolate() — audit E: RTL bidi reordering of signed deltas.
// A leading +/− before Latin digits is a bidi-neutral character; in an RTL
// (Arabic) paragraph the Unicode bidi algorithm displaces it to the far side
// of the digits ("+12.3%" renders as "12.3%+"). bidiIsolate() wraps the final
// display string in LRI (U+2066) … PDI (U+2069) so its internal order is
// pinned left-to-right while remaining an isolate in the surrounding flow.

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const LRI = '\u2066';
const PDI = '\u2069';

async function loadFormatter() {
  const url = new URL('file://' + path.resolve(__dirname, '..', 'src', 'lib', 'formatter.js'));
  return import(url.href);
}

describe('bidiIsolate', () => {
  test('wraps a signed percent in LRI…PDI', async () => {
    const { bidiIsolate } = await loadFormatter();
    assert.equal(bidiIsolate('+12.3%'), `${LRI}+12.3%${PDI}`);
  });

  test('wraps a minus-signed amount in LRI…PDI', async () => {
    const { bidiIsolate } = await loadFormatter();
    assert.equal(bidiIsolate('−36.30'), `${LRI}−36.30${PDI}`);
    assert.equal(bidiIsolate('−$36.30'), `${LRI}−$36.30${PDI}`);
  });

  test('wraps glyph-prefixed deltas (▲/▼ are bidi-neutral like signs)', async () => {
    const { bidiIsolate } = await loadFormatter();
    assert.equal(bidiIsolate('▼1.25%'), `${LRI}▼1.25%${PDI}`);
  });

  test('passes null, undefined, and empty string through unchanged', async () => {
    const { bidiIsolate } = await loadFormatter();
    assert.equal(bidiIsolate(null), null);
    assert.equal(bidiIsolate(undefined), undefined);
    assert.equal(bidiIsolate(''), '');
  });

  test('wraps placeholder strings too (harmless for neutral text)', async () => {
    const { bidiIsolate } = await loadFormatter();
    assert.equal(bidiIsolate('—'), `${LRI}—${PDI}`);
  });

  test('output contains exactly one LRI and one PDI, balanced', async () => {
    const { bidiIsolate } = await loadFormatter();
    const out = bidiIsolate('+0.89%');
    assert.equal(out.at(0), LRI);
    assert.equal(out.at(-1), PDI);
    assert.equal([...out].filter((c) => c === LRI).length, 1);
    assert.equal([...out].filter((c) => c === PDI).length, 1);
  });
});
