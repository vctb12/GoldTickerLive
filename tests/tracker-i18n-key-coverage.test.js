'use strict';

/**
 * tracker-i18n-key-coverage.test.js
 *
 * Guards against leaked i18n keys in the tracker (defect D8): the tracker
 * resolves copy with trackerTx('x') / tx('x'), and when a key is absent from
 * translations.js the resolver returns the raw dotted key (e.g.
 * "tracker.commandMeta.heading"), which then renders verbatim in the DOM —
 * shown in production as the leaked UPPER.CASE.DOT string.
 *
 * This test statically scans the tracker source for *literal* trackerTx / tx
 * keys and asserts each one exists in BOTH the EN and AR translation tables.
 * It fails the build if a future edit references a key that was never added.
 *
 * Note: template-literal keys (e.g. trackerTx(`controls.unit${k}`)) are
 * computed at runtime and cannot be resolved statically, so they are skipped
 * here — their variants are covered by the dedicated control/unit tests.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

function trackerSourceFiles() {
  const files = [path.join('src', 'pages', 'tracker-pro.js')];
  const dir = path.join('src', 'tracker');
  for (const name of fs.readdirSync(path.join(ROOT, dir))) {
    if (name.endsWith('.js')) files.push(path.join(dir, name));
  }
  return files;
}

// Match trackerTx('key' | "key") and tx('key' | "key") with a *literal*
// (single/double-quoted) first argument. Template literals are intentionally
// excluded — see the header note.
const RE_TRACKER_TX = /trackerTx\(\s*(['"])([A-Za-z0-9_.]+)\1/g;
const RE_TX = /(?<![A-Za-z0-9_])tx\(\s*(['"])([A-Za-z0-9_.]+)\1/g;

function collectLiteralKeys() {
  const keys = new Map(); // fullKey -> Set(files)
  for (const rel of trackerSourceFiles()) {
    const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    for (const re of [RE_TRACKER_TX, RE_TX]) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(src))) {
        const fullKey = `tracker.${m[2]}`;
        if (!keys.has(fullKey)) keys.set(fullKey, new Set());
        keys.get(fullKey).add(rel);
      }
    }
  }
  return keys;
}

async function loadTranslations() {
  const url = new URL('file://' + path.resolve(ROOT, 'src', 'config', 'translations.js'));
  return import(url.href + `?v=${Date.now()}`);
}

test('tracker: every literal trackerTx/tx key exists in EN and AR (no leaked keys)', async () => {
  const { TRANSLATIONS } = await loadTranslations();
  const en = TRANSLATIONS.en;
  const ar = TRANSLATIONS.ar;
  const keys = collectLiteralKeys();
  assert.ok(keys.size > 0, 'expected to find at least some literal tracker keys');

  const missing = [];
  for (const [fullKey, files] of keys) {
    const inEn = Object.prototype.hasOwnProperty.call(en, fullKey);
    const inAr = Object.prototype.hasOwnProperty.call(ar, fullKey);
    if (!inEn || !inAr) {
      missing.push(
        `${fullKey} ${inEn ? '' : '[EN missing]'} ${inAr ? '' : '[AR missing]'} <- ${[...files].join(', ')}`
      );
    }
  }

  assert.deepEqual(
    missing,
    [],
    `These tracker keys are referenced in code but absent from translations (they would leak as raw keys in the DOM):\n  ${missing.join('\n  ')}`
  );
});
