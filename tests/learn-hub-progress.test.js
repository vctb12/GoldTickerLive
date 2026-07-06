'use strict';

const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

/**
* Regression coverage for the learn.html "Read 0 of 9 featured guides" bug.
* Root cause: read-progress was keyed by (a stripped form of) each guide's
* href, but two guides intentionally share an href and the stored key never
* matched the compared key, so the counter stayed at 0 forever. The fix keys
* progress by a stable, unique `id` per guide instead - these tests exercise
* src/config/learn-hub-catalog.js directly (no DOM needed).
*/

function installMockLocalStorage() {
  const store = new Map();
  global.localStorage = {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
  return store;
}

async function loadCatalog() {
  const url = new URL(
    'file://' + path.resolve(__dirname, '..', 'src', 'config', 'learn-hub-catalog.js')
    );
  return import(url.href);
}

beforeEach(() => {
  installMockLocalStorage();
});

test('LEARN_GUIDE_CATEGORIES has exactly 9 guides with unique ids', async () => {
  const { countTotalGuides, getAllGuides } = await loadCatalog();
  assert.equal(countTotalGuides(), 9);
  const all = getAllGuides();
  assert.equal(all.length, 9);
  const ids = all.map((g) => g.id);
  assert.equal(new Set(ids).size, 9, 'every guide id must be unique');
  const pricingGuides = all.filter((g) => g.href === '/learn.html#pricing');
  assert.equal(pricingGuides.length, 2);
  assert.notEqual(pricingGuides[0].id, pricingGuides[1].id);
});

test('getLearnProgress starts empty and markGuideRead records by id', async () => {
  const { getLearnProgress, markGuideRead } = await loadCatalog();
  assert.deepEqual(getLearnProgress(), []);
  markGuideRead('karats');
  assert.deepEqual(getLearnProgress(), ['karats']);
});

test('markGuideRead does not double-count a re-visited guide', async () => {
  const { getLearnProgress, markGuideRead } = await loadCatalog();
  markGuideRead('karats');
  markGuideRead('karats');
  markGuideRead('karats');
  assert.deepEqual(getLearnProgress(), ['karats']);
});

test('countReadGuides reflects all 9 once every guide is visited, and cannot exceed 9', async () => {
  const { markGuideRead, countReadGuides, getAllGuides } = await loadCatalog();
  const all = getAllGuides();
  for (const guide of all) markGuideRead(guide.id);
  for (const guide of all) markGuideRead(guide.id);
  assert.equal(countReadGuides(), 9);
});

test('countReadGuides ignores stale/unknown ids from old localStorage state', async () => {
  const { markGuideRead, countReadGuides } = await loadCatalog();
  markGuideRead('karats');
  markGuideRead('some-retired-guide-id');
  assert.equal(countReadGuides(), 1);
});

test('this exact bug: an href-shaped key never matches any known guide id', async () => {
  const { markGuideRead, countReadGuides, getAllGuides } = await loadCatalog();
  markGuideRead('/learn.html#karats');
  markGuideRead('learn.html#karats');
  assert.equal(countReadGuides(), 0);
  const karats = getAllGuides().find((g) => g.id === 'karats');
  assert.ok(karats, 'catalog must expose a "karats" id distinct from its href');
});

test('getLearnProgress and markGuideRead degrade gracefully with no storage', async () => {
  const { getLearnProgress, markGuideRead } = await loadCatalog();
  const original = global.localStorage;
  global.localStorage = undefined;
  assert.doesNotThrow(() => markGuideRead('karats'));
  assert.deepEqual(getLearnProgress(), []);
  global.localStorage = original;
});

test('markGuideRead ignores empty/falsy ids', async () => {
  const { getLearnProgress, markGuideRead } = await loadCatalog();
  markGuideRead('');
  markGuideRead(null);
  markGuideRead(undefined);
  assert.deepEqual(getLearnProgress(), []);
});
