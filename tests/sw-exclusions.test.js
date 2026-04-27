'use strict';

/**
 * Service worker exclusion tests — Batch 7 (security fix).
 *
 * Verifies that /api/* and /admin/* paths are excluded from SW caching
 * and go straight to the network, preventing sensitive pages or API
 * responses from being served from cache.
 *
 * These tests parse the sw.js source and confirm the bypass logic is present
 * and correctly placed (before the navigate handler).
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const SW_PATH = path.resolve(__dirname, '..', 'sw.js');

test('sw.js exists', () => {
  assert.ok(fs.existsSync(SW_PATH), 'sw.js not found at repo root');
});

test('sw.js bypasses /admin/* paths without caching', () => {
  const src = fs.readFileSync(SW_PATH, 'utf8');
  assert.ok(
    src.includes("url.pathname.startsWith('/admin/')"),
    "sw.js must bypass /admin/* — missing startsWith('/admin/') check"
  );
});

test('sw.js bypasses /api/* paths without caching', () => {
  const src = fs.readFileSync(SW_PATH, 'utf8');
  assert.ok(
    src.includes("url.pathname.startsWith('/api/')"),
    "sw.js must bypass /api/* — missing startsWith('/api/') check"
  );
});

test('sw.js admin/api bypass comes before the navigate handler', () => {
  const src = fs.readFileSync(SW_PATH, 'utf8');
  const adminBypassPos = src.indexOf("url.pathname.startsWith('/admin/')");
  const navigatePos = src.indexOf("request.mode === 'navigate'");
  assert.ok(adminBypassPos !== -1, 'admin bypass not found');
  assert.ok(navigatePos !== -1, 'navigate handler not found');
  assert.ok(
    adminBypassPos < navigatePos,
    'admin/api bypass must appear before the navigate handler so it takes priority'
  );
});

test('sw.js admin/api bypass uses network fetch (not cache)', () => {
  const src = fs.readFileSync(SW_PATH, 'utf8');
  // The bypass block should call fetch(request) directly
  const bypassBlock = src.slice(
    src.indexOf("url.pathname.startsWith('/admin/')"),
    src.indexOf("request.mode === 'navigate'")
  );
  assert.ok(
    bypassBlock.includes('fetch(request)'),
    'admin/api bypass must call fetch(request) directly to skip caching'
  );
});
