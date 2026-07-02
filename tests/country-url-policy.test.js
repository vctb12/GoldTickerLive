'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SAMPLE = 'countries/uae/dubai/index.html';

test('sample city hub has noindex,follow robots meta', () => {
  const html = fs.readFileSync(path.join(ROOT, SAMPLE), 'utf8');
  const m = html.match(/<meta[^>]+name=["']robots["'][^>]*content=["']([^"']*)["']/i);
  assert.ok(m, 'robots meta required');
  const content = m[1].toLowerCase();
  assert.ok(content.includes('noindex'), 'city hub must be noindex');
  assert.ok(content.includes('follow'), 'city hub must be follow');
});

test('sample gold-rate page is not noindex', () => {
  const ratePath = 'countries/uae/dubai/gold-rate/index.html';
  const html = fs.readFileSync(path.join(ROOT, ratePath), 'utf8');
  assert.ok(
    !/<meta[^>]+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html),
    'gold-rate must remain indexable'
  );
});
