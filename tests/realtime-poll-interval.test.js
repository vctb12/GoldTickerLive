'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function loadModule() {
  const url = new URL(
    'file://' + path.resolve(__dirname, '..', 'src', 'lib', 'realtime-poll-interval.js')
  );
  return import(url.href + `?v=${Date.now()}`);
}

test('resolveProviderPollMs uses 1s for gold-api.com when tab visible', async () => {
  const { resolveProviderPollMs } = await loadModule();
  assert.equal(resolveProviderPollMs('gold_api_com', { livePollMs: 1000, visible: true }), 1000);
});

test('resolveProviderPollMs slows static JSON providers to 30s', async () => {
  const { resolveProviderPollMs } = await loadModule();
  assert.equal(
    resolveProviderPollMs('primary-provider', { staticPollMs: 30_000, visible: true }),
    30_000
  );
  assert.equal(
    resolveProviderPollMs('minted_metal', { staticPollMs: 30_000, visible: true }),
    30_000
  );
});

test('resolveProviderPollMs slows cache fallback to 60s', async () => {
  const { resolveProviderPollMs } = await loadModule();
  assert.equal(
    resolveProviderPollMs('secondary-provider-cache', { fallbackPollMs: 60_000, visible: true }),
    60_000
  );
});

test('resolveProviderPollMs uses hiddenPollMs when tab is hidden', async () => {
  const { resolveProviderPollMs } = await loadModule();
  assert.equal(
    resolveProviderPollMs('gold_api_com', {
      livePollMs: 1000,
      hiddenPollMs: 20_000,
      visible: false,
    }),
    20_000
  );
});

test('resolveProviderPollMs defaults to activePollMs before first quote', async () => {
  const { resolveProviderPollMs } = await loadModule();
  assert.equal(resolveProviderPollMs(null, { activePollMs: 1000, visible: true }), 1000);
});
