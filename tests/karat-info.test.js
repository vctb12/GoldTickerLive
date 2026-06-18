'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function loadKaratModule() {
  const url = new URL('file://' + path.resolve(__dirname, '..', 'src', 'pages', 'karat-page.js'));
  return import(url.href);
}

async function loadConfig() {
  const constantsUrl = new URL(
    'file://' + path.resolve(__dirname, '..', 'src', 'config', 'constants.js')
  );
  const karatsUrl = new URL(
    'file://' + path.resolve(__dirname, '..', 'src', 'config', 'karats.js')
  );
  const [constants, karats] = await Promise.all([
    import(constantsUrl.href),
    import(karatsUrl.href),
  ]);
  return { constants, karats };
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

test('calculateKaratPricePerGram matches canonical formula', async () => {
  const mod = await loadKaratModule();
  const { constants } = await loadConfig();
  const spot = 3200;
  const computed = mod.calculateKaratPricePerGram(spot, '22', 'AED');
  const expected =
    (spot / constants.CONSTANTS.TROY_OZ_GRAMS) * (22 / 24) * constants.CONSTANTS.AED_PEG;
  assert.ok(Math.abs(computed - expected) < 1e-8);
});

test('karat descriptions are non-empty strings for supported karats', async () => {
  const mod = await loadKaratModule();
  ['24', '22', '21', '18'].forEach((code) => {
    assert.equal(typeof mod.KARAT_INFO[code].en, 'string');
    assert.equal(typeof mod.KARAT_INFO[code].ar, 'string');
    assert.ok(mod.KARAT_INFO[code].en.trim().length > 0);
    assert.ok(mod.KARAT_INFO[code].ar.trim().length > 0);
  });
});
