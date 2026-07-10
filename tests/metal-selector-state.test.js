'use strict';

/**
 * Metal + grade selection state / URL model (Phase 59, Theme B). Proves every selection is validated
 * against the metals registry (gold default; per-metal default grade fallback), URLs round-trip and
 * omit defaults, and switching metals reconciles the grade — so a stale/hand-edited URL can never
 * select a metal or grade that doesn't exist.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const MOD = new URL('../src/lib/metal-selector-state.js', `file://${__filename}`).href;

test('selector: normalize defaults to gold at its default grade', async () => {
  const { normalizeMetalSelection } = await import(MOD);
  assert.deepEqual(normalizeMetalSelection(), { metal: 'gold', grade: '24' });
  assert.deepEqual(normalizeMetalSelection({}), { metal: 'gold', grade: '24' });
});

test('selector: unknown metal → gold; invalid grade → the metal default', async () => {
  const { normalizeMetalSelection } = await import(MOD);
  assert.deepEqual(normalizeMetalSelection({ metal: 'unobtainium' }), {
    metal: 'gold',
    grade: '24',
  });
  // '999' is not a gold karat → gold default '24'.
  assert.deepEqual(normalizeMetalSelection({ metal: 'gold', grade: '999' }), {
    metal: 'gold',
    grade: '24',
  });
  // '22' is not a silver fineness → silver default '999'.
  assert.deepEqual(normalizeMetalSelection({ metal: 'silver', grade: '22' }), {
    metal: 'silver',
    grade: '999',
  });
});

test('selector: valid non-gold selections are kept', async () => {
  const { normalizeMetalSelection } = await import(MOD);
  assert.deepEqual(normalizeMetalSelection({ metal: 'silver', grade: '925' }), {
    metal: 'silver',
    grade: '925',
  });
  assert.deepEqual(normalizeMetalSelection({ metal: 'platinum', grade: '950' }), {
    metal: 'platinum',
    grade: '950',
  });
});

test('selector: serialize omits defaults (clean gold URL) and encodes non-defaults', async () => {
  const { serializeMetalSelection } = await import(MOD);
  assert.equal(serializeMetalSelection({ metal: 'gold', grade: '24' }), ''); // default → clean
  assert.equal(serializeMetalSelection({ metal: 'gold', grade: '22' }), '?grade=22');
  assert.equal(serializeMetalSelection({ metal: 'silver', grade: '999' }), '?metal=silver'); // default grade omitted
  assert.equal(
    serializeMetalSelection({ metal: 'silver', grade: '925' }),
    '?metal=silver&grade=925'
  );
});

test('selector: parse validates and round-trips with serialize', async () => {
  const { serializeMetalSelection, parseMetalSelection, normalizeMetalSelection } = await import(
    MOD
  );
  for (const sel of [
    { metal: 'gold', grade: '24' },
    { metal: 'gold', grade: '18' },
    { metal: 'silver', grade: '925' },
    { metal: 'platinum', grade: '950' },
    { metal: 'palladium', grade: '999' },
  ]) {
    const norm = normalizeMetalSelection(sel);
    assert.deepEqual(parseMetalSelection(serializeMetalSelection(sel)), norm);
  }
  // A hand-edited/garbage query degrades to the gold default.
  assert.deepEqual(parseMetalSelection('?metal=foo&grade=bar'), { metal: 'gold', grade: '24' });
  assert.deepEqual(parseMetalSelection(''), { metal: 'gold', grade: '24' });
});

test('selector: reconcileGradeForMetal keeps a shared grade, else falls to the new default', async () => {
  const { reconcileGradeForMetal } = await import(MOD);
  // gold '22' → silver has no '22' → silver default '999'.
  assert.equal(reconcileGradeForMetal('silver', '22'), '999');
  // silver '999' → platinum also offers '999' → kept.
  assert.equal(reconcileGradeForMetal('platinum', '999'), '999');
  // switching to gold with a gold grade keeps it.
  assert.equal(reconcileGradeForMetal('gold', '18'), '18');
  // unknown metal → gold default grade.
  assert.equal(reconcileGradeForMetal('foo', '925'), '24');
});
