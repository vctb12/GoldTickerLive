'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function loadModule() {
  const url = new URL(
    'file://' + path.resolve(__dirname, '..', 'src', 'pages', 'calculator', 'url-state.js')
  );
  return import(url.href);
}

test('serializeCalculatorUrlState serializes expected params', async () => {
  const mod = await loadModule();
  const query = mod.serializeCalculatorUrlState({
    weight: 50,
    karat: '21',
    currency: 'AED',
    mode: 'value',
  });
  assert.equal(query, '?w=50&k=21&c=AED&mode=value');
});

test('parseCalculatorUrlState parses URL and restores inputs', async () => {
  const mod = await loadModule();
  const parsed = mod.parseCalculatorUrlState('?w=50&k=21&c=AED&mode=value');
  assert.deepEqual(parsed, {
    weight: '50',
    amount: '',
    karat: '21',
    currency: 'AED',
    mode: 'value',
    valueMode: 'weight',
  });
});

test('serializeCalculatorUrlState preserves AED to weight mode', async () => {
  const mod = await loadModule();
  const query = mod.serializeCalculatorUrlState({
    amount: 5000,
    karat: '22',
    currency: 'AED',
    mode: 'value',
    valueMode: 'aed',
  });
  assert.equal(query, '?a=5000&valueMode=aed&k=22&c=AED&mode=value');
});

test('parseCalculatorUrlState restores AED to weight mode', async () => {
  const mod = await loadModule();
  const parsed = mod.parseCalculatorUrlState('?a=5000&valueMode=aed&k=22&c=AED&mode=value');
  assert.deepEqual(parsed, {
    weight: '',
    amount: '5000',
    karat: '22',
    currency: 'AED',
    mode: 'value',
    valueMode: 'aed',
  });
});

test('parseCalculatorUrlState falls back to defaults for invalid params', async () => {
  const mod = await loadModule();
  const parsed = mod.parseCalculatorUrlState('?w=-7&k=3&c=XYZ&mode=buy');
  assert.deepEqual(parsed, {
    weight: '',
    amount: '',
    karat: '22',
    currency: 'AED',
    mode: 'value',
    valueMode: 'weight',
  });
});
