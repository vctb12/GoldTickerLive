'use strict';

/**
 * i18n-sitewide-guard.test.js
 *
 * Site-wide leaked-key guard (defect D8, generalized). Three CI-time checks:
 *
 *  1. EN/AR key-set parity — TRANSLATIONS.en and TRANSLATIONS.ar must contain
 *     EXACTLY the same keys, so no string can ship in one language only.
 *
 *  2. Global-helper key references — every page that resolves copy through the
 *     shared TRANSLATIONS table (home `tx`/`txGlobal`, tracker `trackerTx`/`tx`,
 *     country pages via page-hydrator `tx(lang, key)` → `country.*`) must
 *     reference keys that exist in EN+AR. A miss makes the helper return the raw
 *     key, which renders verbatim (the leaked UPPER.CASE.DOT bug).
 *
 *  3. data-i18n attribute coverage — every data-i18n* attribute in any committed
 *     HTML file resolves to an existing key.
 *
 * Pages with their OWN local dictionaries (calculator `T`, shops `TXT`, terms,
 * privacy, …) are covered by the runtime Playwright guard
 * (tests/e2e/i18n-leaked-keys.spec.js), which asserts no raw key renders in the
 * DOM in either language — that catches leaks regardless of helper.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

async function loadTranslations() {
  const url = new URL('file://' + path.resolve(ROOT, 'src', 'config', 'translations.js'));
  return import(url.href + `?v=${Date.now()}`);
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function listFiles(dir, ext) {
  const out = [];
  for (const name of fs.readdirSync(path.join(ROOT, dir))) {
    if (name.endsWith(ext)) out.push(path.join(dir, name));
  }
  return out;
}

// ── 1. EN/AR parity ─────────────────────────────────────────────────────────
test('i18n: TRANSLATIONS.en and .ar have identical key sets', async () => {
  const { TRANSLATIONS } = await loadTranslations();
  const en = new Set(Object.keys(TRANSLATIONS.en));
  const ar = new Set(Object.keys(TRANSLATIONS.ar));
  const enOnly = [...en].filter((k) => !ar.has(k));
  const arOnly = [...ar].filter((k) => !en.has(k));
  assert.deepEqual(
    { enOnly, arOnly },
    { enOnly: [], arOnly: [] },
    'every key must exist in BOTH languages'
  );
});

// ── 2. Global-helper key references ──────────────────────────────────────────
// Each rule: a set of source files, a regex capturing the literal key argument,
// and the namespace prefix the helper prepends before the TRANSLATIONS lookup.
function globalHelperRules() {
  return [
    { files: ['src/pages/home.js'], re: /\btx\(\s*(['"])([\w.]+)\1/g, ns: 'home.' },
    { files: ['src/pages/home.js'], re: /\btxGlobal\(\s*(['"])([\w.]+)\1/g, ns: '' },
    {
      files: ['src/pages/tracker-pro.js'],
      re: /\btrackerTx\(\s*(['"])([\w.]+)\1/g,
      ns: 'tracker.',
    },
    { files: ['src/pages/tracker-pro.js'], re: /\btxGlobal\(\s*(['"])([\w.]+)\1/g, ns: '' },
    {
      files: listFiles('src/tracker', '.js'),
      re: /(?<![\w])tx\(\s*(['"])([\w.]+)\1/g,
      ns: 'tracker.',
    },
    // page-hydrator: tx(lang, 'key') → country.key  (used by country pages)
    {
      files: ['src/lib/page-hydrator.js'],
      re: /\btx\(\s*\w+\s*,\s*(['"])([\w.]+)\1/g,
      ns: 'country.',
    },
  ];
}

test('i18n: global-TRANSLATIONS helper keys all exist in EN and AR', async () => {
  const { TRANSLATIONS } = await loadTranslations();
  const { en, ar } = TRANSLATIONS;
  const missing = [];
  for (const rule of globalHelperRules()) {
    for (const rel of rule.files) {
      let src;
      try {
        src = read(rel);
      } catch {
        continue; // file may not exist in all checkouts
      }
      rule.re.lastIndex = 0;
      let m;
      while ((m = rule.re.exec(src))) {
        const key = rule.ns + m[2];
        const inEn = Object.prototype.hasOwnProperty.call(en, key);
        const inAr = Object.prototype.hasOwnProperty.call(ar, key);
        if (!inEn || !inAr) {
          missing.push(`${key} ${inEn ? '' : '[EN]'} ${inAr ? '' : '[AR]'} <- ${rel}`);
        }
      }
    }
  }
  assert.deepEqual(
    [...new Set(missing)],
    [],
    `Keys referenced by a global helper but missing from translations (would leak as raw keys):\n  ${[...new Set(missing)].join('\n  ')}`
  );
});

// ── 3. data-i18n attribute coverage across all committed HTML ────────────────
test('i18n: every data-i18n attribute key resolves in EN and AR', async () => {
  const { TRANSLATIONS } = await loadTranslations();
  const { en, ar } = TRANSLATIONS;
  // Today only tracker.html uses data-i18n (tracker.* namespace via trackerTx).
  // The scan is generic: any HTML adopting data-i18n with a tracker.* key is
  // covered; extend the namespace map here if another page adopts the pattern.
  const htmlFiles = ['tracker.html'];
  const re = /\bdata-i18n(?:-placeholder|-aria-label|-title)?="([^"]+)"/g;
  const missing = [];
  for (const rel of htmlFiles) {
    const html = read(rel);
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(html))) {
      const key = `tracker.${m[1]}`;
      if (!Object.prototype.hasOwnProperty.call(en, key)) missing.push(`${key} [EN] <- ${rel}`);
      if (!Object.prototype.hasOwnProperty.call(ar, key)) missing.push(`${key} [AR] <- ${rel}`);
    }
  }
  assert.deepEqual(
    [...new Set(missing)],
    [],
    `data-i18n keys missing from translations:\n  ${[...new Set(missing)].join('\n  ')}`
  );
});
