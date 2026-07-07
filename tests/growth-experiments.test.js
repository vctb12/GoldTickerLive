'use strict';

/**
 * Guard test for the client-side growth-experiment registry.
 *
 * The whole point of `src/config/growth-experiments.js` is "flags only" — nothing there may change
 * the live site until deliberately enabled. This test fails the build if any experiment's default
 * flips to `true`, drifts from its documented shape, or references a forbidden monetization surface,
 * so growth can never ship on by accident.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const MODULE = new URL('../src/config/growth-experiments.js', `file://${__filename}`).href;

test('growth-experiments: registry is a non-empty object', async () => {
  const { GROWTH_EXPERIMENTS } = await import(MODULE);
  assert.equal(typeof GROWTH_EXPERIMENTS, 'object');
  assert.ok(Object.keys(GROWTH_EXPERIMENTS).length > 0, 'expected at least one growth experiment');
});

test('growth-experiments: every experiment defaults to enabled:false (flags only)', async () => {
  const { GROWTH_EXPERIMENTS } = await import(MODULE);
  for (const [key, exp] of Object.entries(GROWTH_EXPERIMENTS)) {
    assert.equal(
      exp.enabled,
      false,
      `growth experiment "${key}" must default to enabled:false — nothing ships on by default`
    );
  }
});

test('growth-experiments: each experiment carries required documentation fields', async () => {
  const { GROWTH_EXPERIMENTS } = await import(MODULE);
  for (const [key, exp] of Object.entries(GROWTH_EXPERIMENTS)) {
    for (const field of ['summary', 'rationale', 'readiness']) {
      assert.equal(typeof exp[field], 'string', `growth experiment "${key}" missing "${field}"`);
      assert.ok(exp[field].length > 0, `growth experiment "${key}" has an empty "${field}"`);
    }
  }
});

test('growth-experiments: no forbidden monetization/cost surfaces are referenced', async () => {
  // Guardrail: additive growth here is $0 only — no newsletter automation, WhatsApp Business API, or
  // payments. Catch any experiment that tries to (re)introduce them by keyword.
  const { GROWTH_EXPERIMENTS } = await import(MODULE);
  const forbidden = /newsletter|whatsapp business|stripe|payment|subscription billing/i;
  for (const [key, exp] of Object.entries(GROWTH_EXPERIMENTS)) {
    const blob = `${exp.summary} ${exp.rationale} ${exp.readiness}`;
    assert.equal(
      forbidden.test(blob),
      false,
      `growth experiment "${key}" references a forbidden monetization/cost surface`
    );
  }
});

test('growth-experiments: isGrowthExperimentEnabled is false for all + unknown keys by default', async () => {
  const { GROWTH_EXPERIMENTS, isGrowthExperimentEnabled } = await import(MODULE);
  for (const key of Object.keys(GROWTH_EXPERIMENTS)) {
    assert.equal(
      isGrowthExperimentEnabled(key),
      false,
      `"${key}" must be off with no URL override`
    );
  }
  assert.equal(isGrowthExperimentEnabled('does-not-exist'), false);
});
