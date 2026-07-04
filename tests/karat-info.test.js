'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// The karat landing page (src/pages/karat-page.js) and its /gold-price/<karat>/
// route were removed in the 2026-07-04 radical page reduction. The purity data
// still lives in the kept config module, so this guard now locks that config.
async function loadConfig() {
  const karatsUrl = new URL(
    'file://' + path.resolve(__dirname, '..', 'src', 'config', 'karats.js')
  );
  const karats = await import(karatsUrl.href);
  return { karats };
}

test('karat purity values match expected fractions', async () => {
  const { karats } = await loadConfig();
  const map = Object.fromEntries(karats.KARATS.map((k) => [k.code, k.purity]));
  assert.equal(map['24'], 1.0);
  assert.equal(map['22'], 22 / 24);
  assert.equal(map['21'], 21 / 24);
  assert.equal(map['18'], 18 / 24);
  assert.equal(map['14'], 14 / 24);
  assert.equal(map['20'], 20 / 24);
  assert.equal(map['16'], 16 / 24);
});
