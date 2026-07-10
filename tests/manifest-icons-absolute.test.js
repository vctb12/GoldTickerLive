'use strict';

/**
 * Manifest icon resolution (Phase 46) — the built manifest lives at /assets/manifest-*.json, so any
 * relative icon `src` resolves to /assets/... and 404s. This guards that every manifest icon (and
 * shortcut icon) uses an absolute path AND that the referenced file actually exists in public/ (served
 * verbatim at the site root), so the icons can't silently 404 again.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));

function allIconSrcs(m) {
  const srcs = (m.icons || []).map((i) => i.src);
  for (const sc of m.shortcuts || []) for (const ic of sc.icons || []) srcs.push(ic.src);
  return srcs;
}

test('manifest: every icon src is an absolute path', () => {
  for (const src of allIconSrcs(manifest)) {
    assert.ok(src.startsWith('/'), `icon src must be absolute, got ${JSON.stringify(src)}`);
  }
});

test('manifest: every icon file is served from public/ (exists at that root path)', () => {
  for (const src of allIconSrcs(manifest)) {
    const filePath = path.join(ROOT, 'public', src.replace(/^\//, ''));
    assert.ok(fs.existsSync(filePath), `manifest icon ${src} must exist at public${src}`);
  }
});

test('manifest: still installable — has 192 and 512 raster icons + a maskable one', () => {
  const raster = (manifest.icons || []).filter((i) => i.type === 'image/png');
  const sizes = raster.map((i) => i.sizes);
  assert.ok(sizes.includes('192x192'), 'needs a 192 icon');
  assert.ok(sizes.includes('512x512'), 'needs a 512 icon');
  assert.ok(
    (manifest.icons || []).some((i) => String(i.purpose || '').includes('maskable')),
    'needs a maskable icon'
  );
});
