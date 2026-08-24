'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

test('multi-metal pilot stays off in production and requires an explicit local preview', async () => {
  const url = new URL(
    'file://' + path.resolve(__dirname, '..', 'src', 'config', 'metals-flags.js')
  );
  const { METALS_PILOT_ENABLED, isMetalsPilotEnabled } = await import(url.href);
  assert.equal(METALS_PILOT_ENABLED, false);
  assert.equal(
    isMetalsPilotEnabled({ hostname: 'goldtickerlive.com', search: '?metals=preview' }),
    false
  );
  assert.equal(isMetalsPilotEnabled({ hostname: 'localhost', search: '' }), false);
  assert.equal(isMetalsPilotEnabled({ hostname: '127.0.0.1', search: '?metals=preview' }), true);
});
