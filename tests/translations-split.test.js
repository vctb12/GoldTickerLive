'use strict';

/**
 * translations-split.test.js — guards for the per-locale dictionary split.
 *
 * The bilingual TRANSLATIONS table is split into `translations.en.js` (eager)
 * and `translations.ar.js` (loaded on demand by `translations-runtime.js`),
 * with `translations.js` re-composing both for Node scripts, tests, and the
 * lazy search index. These tests pin the three contracts that keep English
 * visitors from ever downloading the Arabic half again:
 *
 *  1. Module contract — the re-composed table is exactly {en: EN, ar: AR};
 *     the runtime table starts EN-only and `ensureLocale('ar')` grafts the
 *     full Arabic dictionary onto the same (mutable) object.
 *  2. Import-graph guard — no browser page/component may statically import
 *     the combined `translations.js` or `translations.ar.js`; the only
 *     allowed static consumers are the re-composer itself and the search
 *     index (which is only reachable through the on-demand search chunk).
 *  3. Built-output assertion (runs when `dist/` exists) — the eager `utils`
 *     chunk must not contain a distinctive AR-only string, and the Arabic
 *     dictionary must exist as its own discrete chunk.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

// AR value of 'newsletter.subtitle' — appears nowhere else in the codebase,
// so its presence in a chunk proves the Arabic dictionary is inside it.
const AR_PROBE = 'احصل على تحديثات أسعار الذهب الأسبوعية في صندوق بريدك';

const importFresh = (rel) => import('file://' + path.resolve(ROOT, rel) + `?v=${Date.now()}`);

test('re-composed TRANSLATIONS is exactly {en: EN, ar: AR} with full parity', async () => {
  const { TRANSLATIONS } = await importFresh('src/config/translations.js');
  const { EN } = await importFresh('src/config/translations.en.js');
  const { AR } = await importFresh('src/config/translations.ar.js');

  assert.deepEqual(Object.keys(TRANSLATIONS), ['en', 'ar']);
  assert.deepEqual(TRANSLATIONS.en, EN);
  assert.deepEqual(TRANSLATIONS.ar, AR);
  assert.deepEqual(
    Object.keys(EN),
    Object.keys(AR),
    'EN/AR must define the exact same key set (order included — the split is mechanical)'
  );
  assert.equal(AR['newsletter.subtitle'], AR_PROBE, 'the build probe string must stay stable');
});

test('runtime table starts EN-only and ensureLocale grafts AR onto the same object', async () => {
  const { TRANSLATIONS, ensureLocale } = await importFresh('src/config/translations-runtime.js');
  const { AR } = await importFresh('src/config/translations.ar.js');

  assert.deepEqual(Object.keys(TRANSLATIONS), ['en'], 'no AR before ensureLocale');
  await ensureLocale('en'); // must be a no-op
  await ensureLocale('xx'); // unknown locales resolve immediately (EN fallback)
  assert.deepEqual(Object.keys(TRANSLATIONS), ['en']);

  await ensureLocale('ar');
  assert.deepEqual(Object.keys(TRANSLATIONS), ['en', 'ar']);
  assert.deepEqual(TRANSLATIONS.ar, AR, 'grafted dictionary is the full Arabic table');
});

test('import-graph: no eager module re-imports the combined or Arabic dictionary', () => {
  // Real import statements only (not comment mentions).
  const IMPORT_RE = /^\s*import\s[^;]*?from\s+['"]([^'"]+)['"]/gm;
  const offendersCombined = [];
  const offendersArabic = [];

  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith('.js')) {
        const rel = path.relative(ROOT, full).replace(/\\/g, '/');
        const text = fs.readFileSync(full, 'utf8');
        for (const m of text.matchAll(IMPORT_RE)) {
          const spec = m[1];
          if (/(^|\/)translations\.js$/.test(spec)) offendersCombined.push(rel);
          if (/(^|\/)translations\.ar\.js$/.test(spec)) offendersArabic.push(rel);
        }
      }
    }
  };
  walk(path.join(ROOT, 'src'));

  assert.deepEqual(
    offendersCombined.sort(),
    ['src/search/searchIndex.js'],
    'only the (already lazy) search index may import the combined translations.js — ' +
      'anything else ships the Arabic half to every visitor again'
  );
  assert.deepEqual(
    offendersArabic.sort(),
    ['src/config/translations.js'],
    'only the re-composer may statically import translations.ar.js — ' +
      'page code must go through translations-runtime.js/ensureLocale()'
  );
});

test('built output: utils chunk is AR-free and the AR dictionary is a discrete chunk', (t) => {
  const assetsDir = path.join(ROOT, 'dist', 'assets');
  if (!fs.existsSync(assetsDir)) {
    t.skip('dist/assets not present — run `npm run build` to exercise this assertion');
    return;
  }
  const assets = fs.readdirSync(assetsDir).filter((f) => f.endsWith('.js'));

  const utils = assets.filter((f) => /^utils-/.test(f));
  assert.ok(utils.length >= 1, 'expected a utils-*.js chunk in dist/assets');
  for (const f of utils) {
    const text = fs.readFileSync(path.join(assetsDir, f), 'utf8');
    assert.ok(
      !text.includes(AR_PROBE),
      `${f} must not contain the Arabic dictionary (per-locale split regressed)`
    );
  }

  const arChunks = assets.filter((f) => /translations\.ar/.test(f));
  assert.equal(
    arChunks.length,
    1,
    `expected exactly one discrete translations.ar chunk, got: ${arChunks.join(', ') || 'none'}`
  );
  const arText = fs.readFileSync(path.join(assetsDir, arChunks[0]), 'utf8');
  assert.ok(arText.includes(AR_PROBE), 'the AR chunk must contain the Arabic dictionary');

  // The probe may live ONLY in the AR dictionary chunk — any other chunk
  // containing it has bundled the Arabic table (eagerly or duplicated).
  const leaks = assets.filter(
    (f) => f !== arChunks[0] && fs.readFileSync(path.join(assetsDir, f), 'utf8').includes(AR_PROBE)
  );
  assert.deepEqual(leaks, [], `Arabic dictionary duplicated into: ${leaks.join(', ')}`);
});
