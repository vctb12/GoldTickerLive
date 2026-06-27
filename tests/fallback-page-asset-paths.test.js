/**
 * D2 regression guard — SW fallback pages must use root-absolute asset paths.
 *
 * `404.html` and `offline.html` are served by the host / service worker as the
 * fallback for *arbitrary* request URLs (a 404 at /countries/uae/something, or
 * the offline page for any failed navigation — see sw.js `caches.match('/offline.html')`).
 * When that happens the document's base URL is the requested path, so a RELATIVE
 * asset ref like `styles/critical.css` resolves against `/countries/uae/…` and
 * 404s — leaving an unstyled fallback with no analytics. Every asset ref on
 * these two pages must therefore be root-absolute (`/…`), an absolute URL
 * (`https://…`, `//…`), or a `data:` URI.
 */

'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.join(__dirname, '..');
const FALLBACK_PAGES = ['404.html', 'offline.html'];

// src=/href= asset references that point at a bundled file (by extension).
const ASSET_REF =
  /\b(?:src|href)="([^"]+\.(?:js|mjs|css|png|jpe?g|gif|webp|avif|svg|ico|json|woff2?|ttf))"/gi;

function isRootedOrAbsolute(url) {
  return (
    url.startsWith('/') || // root-absolute (incl. //host)
    /^https?:/i.test(url) ||
    url.startsWith('data:')
  );
}

for (const page of FALLBACK_PAGES) {
  test(`${page} uses only root-absolute asset paths (D2 regression guard)`, () => {
    const html = fs.readFileSync(path.join(REPO_ROOT, page), 'utf8');
    const bad = [];
    let m;
    while ((m = ASSET_REF.exec(html))) {
      if (!isRootedOrAbsolute(m[1])) bad.push(m[1]);
    }
    assert.deepEqual(
      bad,
      [],
      `${page} is served as a fallback for arbitrary URLs, so relative asset ` +
        `paths break. Make these root-absolute (prefix with "/"):\n  ${bad.join('\n  ')}`
    );
  });
}
