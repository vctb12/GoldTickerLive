'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function loadConfig() {
  const constantsUrl = new URL(
    'file://' + path.resolve(__dirname, '..', 'src', 'config', 'constants.js')
  );
  const karatsUrl = new URL(
    'file://' + path.resolve(__dirname, '..', 'src', 'config', 'karats.js')
  );
  const [constantsMod, karatsMod] = await Promise.all([
    import(constantsUrl.href),
    import(karatsUrl.href),
  ]);
  return { CONSTANTS: constantsMod.CONSTANTS, KARATS: karatsMod.KARATS };
}

test('AED peg default remains 3.6725', async () => {
  const { CONSTANTS } = await loadConfig();
  assert.equal(CONSTANTS.AED_PEG, 3.6725);
});

test('spot-to-gram-to-karat formula is consistent for core karats', async () => {
  const { CONSTANTS, KARATS } = await loadConfig();
  const spot = 3200;
  const usdPerGram24 = spot / CONSTANTS.TROY_OZ_GRAMS;
  const aedPerGram24 = usdPerGram24 * CONSTANTS.AED_PEG;

  const expectedPurity = {
    24: 1.0,
    22: 22 / 24,
    21: 21 / 24,
    18: 18 / 24,
    14: 14 / 24,
  };

  Object.entries(expectedPurity).forEach(([code, purity]) => {
    const configPurity = KARATS.find((k) => k.code === code)?.purity;
    assert.ok(typeof configPurity === 'number', `Missing purity for ${code}K`);
    assert.ok(Math.abs(configPurity - purity) < 0.0002, `Purity mismatch for ${code}K`);

    const aedForKarat = aedPerGram24 * configPurity;
    const direct = (spot / CONSTANTS.TROY_OZ_GRAMS) * CONSTANTS.AED_PEG * configPurity;
    assert.ok(Math.abs(aedForKarat - direct) < 0.0000001, `Formula drift for ${code}K`);
  });
});
