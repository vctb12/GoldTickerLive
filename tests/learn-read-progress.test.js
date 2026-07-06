'use strict';

/**
 * Learn hub read-progress tracking.
 *
 * Regression guard for the "Read 0 of 9 featured guides" counter that never
 * incremented: the featured guide cards deep-link to in-page anchors
 * (e.g. /learn.html#karats), and the click handler used to persist a
 * slash-stripped id ("learn.html#karats") that never matched the catalog's
 * canonical href ("/learn.html#karats"), so the counter was permanently stuck at
 * zero. These tests lock the canonical-id round-trip, the card-based tally
 * (reaches "of 9", capped, deduped), and the source-level fixes in the hub UI and
 * the sitewide view-transition boot (InvalidStateError swallow + same-doc skip).
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// --- localStorage mock (Node has none) ------------------------------------
const storage = {};
globalThis.localStorage = {
  getItem: (k) => storage[k] ?? null,
  setItem: (k, v) => {
    storage[k] = String(v);
  },
  removeItem: (k) => {
    delete storage[k];
  },
  clear: () => {
    for (const k of Object.keys(storage)) delete storage[k];
  },
};

async function loadCatalog() {
  return import('../src/config/learn-hub-catalog.js');
}

// --- storage round-trip (the actual bug) ----------------------------------

test('getLearnProgress starts empty and markGuideRead persists the canonical href', async () => {
  localStorage.clear();
  const cat = await loadCatalog();
  assert.deepEqual(cat.getLearnProgress(), []);

  cat.markGuideRead('/learn.html#karats');
  assert.deepEqual(cat.getLearnProgress(), ['/learn.html#karats']);
});

test('markGuideRead does not double-count a re-visited guide', async () => {
  localStorage.clear();
  const cat = await loadCatalog();
  cat.markGuideRead('/learn.html#karats');
  cat.markGuideRead('/learn.html#karats');
  assert.deepEqual(cat.getLearnProgress(), ['/learn.html#karats']);
});

test('a stored canonical id counts toward read progress (0 -> 1)', async () => {
  localStorage.clear();
  const cat = await loadCatalog();
  cat.markGuideRead('/learn.html#karats');
  assert.equal(cat.countReadGuides(cat.getLearnProgress()), 1);
});

// --- countReadGuides semantics --------------------------------------------

test('countReadGuides: empty -> 0, unknown ids ignored', async () => {
  const cat = await loadCatalog();
  assert.equal(cat.countReadGuides([]), 0);
  assert.equal(cat.countReadGuides(null), 0);
  assert.equal(cat.countReadGuides(['/learn.html#does-not-exist']), 0);
});

test('countReadGuides: a shared anchor counts both cards that use it', async () => {
  const cat = await loadCatalog();
  // Two featured cards (Spot vs retail, Making charges) both deep-link to #pricing.
  assert.equal(cat.countReadGuides(['/learn.html#pricing']), 2);
});

test('countReadGuides: reaches the "of 9" total and never exceeds it', async () => {
  const cat = await loadCatalog();
  const total = cat.countTotalGuides();
  assert.equal(total, 9);

  const uniqueHrefs = [
    ...new Set(cat.LEARN_GUIDE_CATEGORIES.flatMap((c) => c.guides.map((g) => g.href))),
  ];
  assert.equal(cat.countReadGuides(uniqueHrefs), total, 'all guides read should read 9 of 9');

  // Extra/duplicate/unknown ids cannot push it above the total.
  assert.equal(cat.countReadGuides([...uniqueHrefs, ...uniqueHrefs, '/learn.html#nope']), total);
});

// --- guideHrefForHash (deep links / back-forward) -------------------------

test('guideHrefForHash resolves known anchors and rejects the rest', async () => {
  const cat = await loadCatalog();
  assert.equal(cat.guideHrefForHash('#karats'), '/learn.html#karats');
  assert.equal(cat.guideHrefForHash('#pricing'), '/learn.html#pricing');
  assert.equal(cat.guideHrefForHash('#not-a-guide'), null);
  assert.equal(cat.guideHrefForHash('#'), null);
  assert.equal(cat.guideHrefForHash(''), null);
  assert.equal(cat.guideHrefForHash(undefined), null);
});

// --- source-level guards for the wiring that DOM stubs cannot exercise -----

test('learn-hub-ui.js no longer slash-strips the stored id, and tracks via canonical href + hash', () => {
  const ui = read('src/pages/learn-hub-ui.js');
  assert.doesNotMatch(
    ui,
    /replace\(\/\^\\\//,
    'the slash-stripping id normalisation must stay removed — it is the counter bug'
  );
  assert.match(ui, /data-guide-href/, 'cards must carry the canonical read-tracking id');
  assert.match(ui, /countReadGuides/, 'the counter must use the shared card-based tally');
  assert.match(ui, /addEventListener\('hashchange'/, 'deep links / back-forward must mark reads');
});

test('learn-hub "related tools" links use safeHref-safe root-relative hrefs (not dead links)', () => {
  const ui = read('src/pages/learn-hub-ui.js');
  // Bare-relative hrefs are dropped by safe-dom safeHref() -> href-less dead links.
  for (const bare of ['calculator.html', 'glossary.html', 'market.html', 'methodology.html']) {
    assert.doesNotMatch(
      ui,
      new RegExp(`href:\\s*'${bare.replace('.', '\\.')}'`),
      `related-tool link "${bare}" must be root-relative ("/${bare}") to survive safeHref`
    );
    assert.match(ui, new RegExp(`href:\\s*'/${bare.replace('.', '\\.')}'`));
  }
});

test('motion-boot.js swallows the aborted view-transition and skips same-document nav', () => {
  const boot = read('src/lib/motion-boot.js');
  // Aborted-transition promises are handled (no uncaught InvalidStateError).
  assert.match(boot, /transition\.ready\?\.catch/, 'must swallow the aborted transition promise');
  // In-page hash navigation is not routed through a cross-document transition.
  assert.match(
    boot,
    /url\.pathname === location\.pathname/,
    'same-document navigation must bypass the view transition'
  );
});
