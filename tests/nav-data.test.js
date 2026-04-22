/**
 * Integrity tests for src/components/nav-data.js.
 *
 * These guard the nav information-architecture revamp against silent drift:
 *   - both locales must expose the same group keys in the same order
 *   - every href must be a non-empty string
 *   - primary solo links (home, shops) must exist in both locales
 *   - no duplicate hrefs inside a single group (would suggest a copy-paste
 *     bug that fragments analytics and a11y)
 *   - labels must be non-empty strings (prevents blank nav items)
 */

'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function loadNav() {
  const url = new URL(
    'file://' + path.resolve(__dirname, '..', 'src', 'components', 'nav-data.js')
  );
  return import(url.href);
}

test('NAV_DATA exposes both en and ar locales', async () => {
  const { NAV_DATA } = await loadNav();
  assert.ok(NAV_DATA.en, 'NAV_DATA.en missing');
  assert.ok(NAV_DATA.ar, 'NAV_DATA.ar missing');
});

test('NAV_DATA solo links exist in both locales', async () => {
  const { NAV_DATA } = await loadNav();
  for (const lang of ['en', 'ar']) {
    assert.ok(NAV_DATA[lang].home?.href, `${lang}.home.href missing`);
    assert.ok(NAV_DATA[lang].home?.label, `${lang}.home.label missing`);
    assert.ok(NAV_DATA[lang].shops?.href, `${lang}.shops.href missing`);
    assert.ok(NAV_DATA[lang].shops?.label, `${lang}.shops.label missing`);
  }
});

test('NAV_DATA group keys match between locales', async () => {
  const { NAV_DATA } = await loadNav();
  const enKeys = NAV_DATA.en.groups.map((g) => g.key);
  const arKeys = NAV_DATA.ar.groups.map((g) => g.key);
  assert.deepEqual(
    enKeys,
    arKeys,
    `EN/AR group keys diverged. en=${enKeys.join(',')} ar=${arKeys.join(',')}`
  );
});

test('NAV_DATA groups each have the same item count across locales', async () => {
  const { NAV_DATA } = await loadNav();
  for (let i = 0; i < NAV_DATA.en.groups.length; i += 1) {
    const en = NAV_DATA.en.groups[i];
    const ar = NAV_DATA.ar.groups[i];
    assert.equal(
      en.items.length,
      ar.items.length,
      `Group "${en.key}" has ${en.items.length} EN items vs ${ar.items.length} AR items`
    );
  }
});

test('NAV_DATA items all have non-empty href and label', async () => {
  const { NAV_DATA } = await loadNav();
  for (const lang of ['en', 'ar']) {
    for (const group of NAV_DATA[lang].groups) {
      assert.ok(group.key, `${lang} group missing key`);
      assert.ok(group.label, `${lang} group ${group.key} missing label`);
      for (const item of group.items) {
        assert.ok(
          typeof item.href === 'string' && item.href.length > 0,
          `${lang} ${group.key} item has empty href: ${JSON.stringify(item)}`
        );
        assert.ok(
          typeof item.label === 'string' && item.label.length > 0,
          `${lang} ${group.key} item has empty label: ${JSON.stringify(item)}`
        );
      }
    }
  }
});

test('NAV_DATA groups contain no duplicate hrefs within a group', async () => {
  const { NAV_DATA } = await loadNav();
  for (const lang of ['en', 'ar']) {
    for (const group of NAV_DATA[lang].groups) {
      const seen = new Set();
      for (const item of group.items) {
        assert.ok(!seen.has(item.href), `Duplicate href in ${lang}.${group.key}: ${item.href}`);
        seen.add(item.href);
      }
    }
  }
});

test('NAV_DATA labels are present (langToggle, openMenu, closeMenu, mainNav)', async () => {
  const { NAV_DATA } = await loadNav();
  for (const lang of ['en', 'ar']) {
    assert.ok(NAV_DATA[lang].langToggle, `${lang}.langToggle missing`);
    assert.ok(NAV_DATA[lang].openMenu, `${lang}.openMenu missing`);
    assert.ok(NAV_DATA[lang].closeMenu, `${lang}.closeMenu missing`);
    assert.ok(NAV_DATA[lang].mainNav, `${lang}.mainNav missing`);
  }
});
