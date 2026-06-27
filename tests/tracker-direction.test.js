'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// Locks the "don't default up = green" contract: a change that rounds to zero
// must classify as `flat` (a neutral, non-green state), and up/down must carry
// a distinct non-colour glyph so direction is legible without colour alone.
// See src/tracker/_ctx.js (classifyDelta / DIRECTION_GLYPH).

async function load() {
  const url = new URL('file://' + path.resolve(__dirname, '..', 'src', 'tracker', '_ctx.js'));
  return import(url.href);
}

test('classifyDelta: exact zero is flat, never up', async () => {
  const { classifyDelta } = await load();
  assert.equal(classifyDelta(0), 'flat');
});

test('classifyDelta: sub-epsilon magnitudes (round to 0.00) are flat', async () => {
  const { classifyDelta } = await load();
  assert.equal(classifyDelta(0.004), 'flat');
  assert.equal(classifyDelta(-0.004), 'flat');
});

test('classifyDelta: clear positive is up, clear negative is down', async () => {
  const { classifyDelta } = await load();
  assert.equal(classifyDelta(0.01), 'up');
  assert.equal(classifyDelta(12.34), 'up');
  assert.equal(classifyDelta(-0.01), 'down');
  assert.equal(classifyDelta(-12.34), 'down');
});

test('classifyDelta: non-finite input is flat (safe default)', async () => {
  const { classifyDelta } = await load();
  assert.equal(classifyDelta(NaN), 'flat');
  assert.equal(classifyDelta(Infinity), 'flat'); // non-finite → safe neutral default
  assert.equal(classifyDelta(undefined), 'flat');
});

test('classifyDelta: epsilon is overridable for amount vs percent call sites', async () => {
  const { classifyDelta } = await load();
  // a $0.30 move is a real up-move when measured as an amount...
  assert.equal(classifyDelta(0.3), 'up');
  // ...but flat when measured as a percent that rounds to 0.00 with a wider band
  assert.equal(classifyDelta(0.3, 0.5), 'flat');
});

test('cross-surface basis: strip/hero-stat/karat all classify on percent and agree', async () => {
  const { classifyDelta } = await load();
  // A sub-0.01% move (e.g. +$0.10 on ~$4090 spot) must read the SAME on every
  // day-change surface. All three now classify on the spot percent, so a move
  // that rounds to 0.00% is `flat` everywhere — no green ▲ in the strip next to
  // a neutral • in the stat row. (Classifying the strip on the dollar amount
  // used to return 'up' here, which is the divergence this guards against.)
  const spot = 4090.6;
  const dayOpen = spot - 0.1; // +$0.10 move
  const pct = ((spot - dayOpen) / dayOpen) * 100; // ≈ 0.00244%
  assert.equal(classifyDelta(pct), 'flat', 'percent basis → flat');
  assert.equal(classifyDelta(spot - dayOpen), 'up', 'amount basis would have diverged (up)');
});

test('DIRECTION_GLYPH: distinct non-colour cue per direction; flat is not an up arrow', async () => {
  const { DIRECTION_GLYPH } = await load();
  assert.equal(DIRECTION_GLYPH.up, '▲');
  assert.equal(DIRECTION_GLYPH.down, '▼');
  assert.ok(DIRECTION_GLYPH.flat && DIRECTION_GLYPH.flat !== DIRECTION_GLYPH.up);
  assert.notEqual(DIRECTION_GLYPH.flat, DIRECTION_GLYPH.down);
});
