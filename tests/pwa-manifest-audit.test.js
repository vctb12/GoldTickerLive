'use strict';

/**
 * PWA manifest auditor — proves it flags the real installability blockers, surfaces recommended
 * hardening as warnings, and confirms the committed manifest.json is installable.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const AUDIT = new URL('../src/pwa/manifest-audit.js', `file://${__filename}`).href;
const ROOT = path.resolve(__dirname, '..');

const GOOD = {
  id: '/',
  name: 'App',
  short_name: 'App',
  start_url: '/',
  display: 'standalone',
  theme_color: '#000',
  background_color: '#fff',
  categories: ['finance'],
  screenshots: [{ src: 's.png' }],
  icons: [
    { src: 'i192.png', sizes: '192x192', purpose: 'any' },
    { src: 'i512.png', sizes: '512x512', purpose: 'any' },
    { src: 'm.png', sizes: '512x512', purpose: 'maskable' },
  ],
};

test('manifest-audit: a complete manifest is installable with no warnings', async () => {
  const { auditManifest } = await import(AUDIT);
  const res = auditManifest(GOOD);
  assert.equal(res.installable, true);
  assert.deepEqual(res.errors, []);
  assert.deepEqual(res.warnings, []);
});

test('manifest-audit: missing icons / bad display block installability', async () => {
  const { auditManifest } = await import(AUDIT);
  const noIcons = auditManifest({ name: 'A', start_url: '/', display: 'standalone', icons: [] });
  assert.equal(noIcons.installable, false);
  assert.ok(noIcons.errors.some((e) => /192px/.test(e)));
  assert.ok(noIcons.errors.some((e) => /512px/.test(e)));

  const badDisplay = auditManifest({ ...GOOD, display: 'browser' });
  assert.equal(badDisplay.installable, false);
  assert.ok(badDisplay.errors.some((e) => /display must be/.test(e)));

  const noName = auditManifest({ ...GOOD, name: undefined, short_name: undefined });
  assert.equal(noName.installable, false);
  assert.ok(noName.errors.some((e) => /name/.test(e)));
});

test('manifest-audit: recommended fields surface as warnings, not errors', async () => {
  const { auditManifest } = await import(AUDIT);
  // Installable but sparse: no maskable, no theme_color, no id, no screenshots, no categories.
  const sparse = {
    name: 'A',
    start_url: '/',
    display: 'standalone',
    icons: [
      { src: 'i192.png', sizes: '192x192' },
      { src: 'i512.png', sizes: '512x512' },
    ],
  };
  const res = auditManifest(sparse);
  assert.equal(res.installable, true);
  assert.ok(res.warnings.some((w) => /maskable/.test(w)));
  assert.ok(res.warnings.some((w) => /theme_color/.test(w)));
  assert.ok(res.warnings.some((w) => /\bid\b/.test(w)));
  assert.ok(res.warnings.some((w) => /screenshots/.test(w)));
});

test('manifest-audit: an "any"-sized icon satisfies the size requirements', async () => {
  const { auditManifest } = await import(AUDIT);
  const svgOnly = {
    name: 'A',
    start_url: '/',
    display: 'standalone',
    icons: [{ src: 'i.svg', sizes: 'any', type: 'image/svg+xml' }],
  };
  assert.equal(auditManifest(svgOnly).installable, true);
});

test('manifest-audit: committed manifest.json is installable', async () => {
  const { auditManifest } = await import(AUDIT);
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
  const res = auditManifest(manifest);
  assert.equal(res.installable, true, `errors: ${res.errors.join('; ')}`);
  // Phase 42 hardening: id present, maskable icon present, theme_color present.
  assert.equal(manifest.id, '/');
  assert.ok(!res.warnings.some((w) => /maskable/.test(w)));
  assert.ok(!res.warnings.some((w) => /theme_color/.test(w)));
  assert.ok(!res.warnings.some((w) => /\bid\b/.test(w)));
});
