'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

test('api.js exports parallel fetchGoldAndFX', async () => {
  const src = fs.readFileSync(path.join(root, 'src/lib/api.js'), 'utf8');
  assert.match(src, /export async function fetchGoldAndFX/);
  assert.match(src, /Promise\.allSettled/);
});

test('skeleton component exposes mount helpers', async () => {
  const src = fs.readFileSync(path.join(root, 'src/components/skeleton.js'), 'utf8');
  assert.match(src, /export function mountSkeleton/);
  assert.match(src, /shell-skeleton-price-md/);
});

test('price-fetch-error uses translation keys', async () => {
  const src = fs.readFileSync(path.join(root, 'src/components/price-fetch-error.js'), 'utf8');
  assert.match(src, /status\.noData/);
  assert.match(src, /status\.retry/);
});

test('index.html avoids literal Loading freshness copy in hero', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.doesNotMatch(html, /id="hlc-updated"[^>]*>Loading/);
  assert.doesNotMatch(html, /id="karat-strip-updated"[^>]*>Loading freshness/);
  assert.match(html, /id="hlc-updated"[\s\S]*shell-skeleton-freshness-strip/);
});

test('tracker.html hero uses skeleton placeholders instead of Connecting', () => {
  const html = fs.readFileSync(path.join(root, 'tracker.html'), 'utf8');
  assert.doesNotMatch(html, /tracker-hero-s">Connecting/);
  assert.match(html, /id="tp-xauusd-value"[\s\S]*shell-skeleton-price-lg/);
});
