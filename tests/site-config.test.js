/**
 * Tests for src/config/site.js — central site identity.
 *
 * Also acts as a drift guard: the build-time schema injector
 * (scripts/node/inject-schema.js) is a CommonJS script that keeps its own
 * literal copies of the site name / URL / description. If either side
 * changes without the other, this test fails.
 */

'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

async function loadSite() {
  const url = new URL('file://' + path.resolve(__dirname, '..', 'src', 'config', 'site.js'));
  return import(url.href);
}

async function loadCanonical() {
  const url = new URL('file://' + path.resolve(__dirname, '..', 'src', 'seo', 'canonical.js'));
  return import(url.href);
}

test('SITE is frozen and exposes the expected identity fields', async () => {
  const { SITE } = await loadSite();
  assert.ok(Object.isFrozen(SITE), 'SITE must be frozen');
  assert.equal(SITE.name, 'Gold Ticker Live');
  assert.match(SITE.url, /^https:\/\/[a-z0-9.-]+$/, 'url must be a bare https origin (no slash)');
  assert.ok(!SITE.url.endsWith('/'), 'url must not end with a trailing slash');
  assert.ok(SITE.description.length > 20, 'description must be meaningful');
  assert.ok(SITE.logoPath.startsWith('/'), 'logoPath must be root-relative');
  assert.ok(Array.isArray(SITE.sameAs) && SITE.sameAs.length > 0);
  assert.deepEqual([...SITE.languages], ['en', 'ar']);
});

test('SITE.logoPath points at a real committed asset', async () => {
  const { SITE } = await loadSite();
  const asset = path.resolve(__dirname, '..', '.' + SITE.logoPath);
  assert.ok(fs.existsSync(asset), `expected asset at ${SITE.logoPath}`);
});

test('CANONICAL_BASE derives from SITE.url (no duplicated origin literal)', async () => {
  const { SITE } = await loadSite();
  const { CANONICAL_BASE, buildCanonicalUrl } = await loadCanonical();
  assert.equal(CANONICAL_BASE, SITE.url);
  assert.equal(buildCanonicalUrl('/tracker.html'), `${SITE.url}/tracker.html`);
});

test('inject-schema.js build-time constants match SITE (drift guard)', async () => {
  const { SITE } = await loadSite();
  const script = fs.readFileSync(
    path.resolve(__dirname, '..', 'scripts', 'node', 'inject-schema.js'),
    'utf8'
  );

  const urlMatch = script.match(/const SITE_URL = '([^']+)';/);
  const nameMatch = script.match(/const SITE_NAME = '([^']+)';/);
  const descMatch = script.match(/const SITE_DESCRIPTION =\s*'([^']+)';/);

  assert.ok(urlMatch, 'SITE_URL literal not found in inject-schema.js');
  assert.ok(nameMatch, 'SITE_NAME literal not found in inject-schema.js');
  assert.ok(descMatch, 'SITE_DESCRIPTION literal not found in inject-schema.js');

  assert.equal(urlMatch[1], SITE.url, 'inject-schema SITE_URL drifted from src/config/site.js');
  assert.equal(nameMatch[1], SITE.name, 'inject-schema SITE_NAME drifted from src/config/site.js');
  assert.equal(
    descMatch[1],
    SITE.description,
    'inject-schema SITE_DESCRIPTION drifted from src/config/site.js'
  );

  // The Organization logo in the injector must stay aligned with SITE.logoPath.
  assert.ok(
    script.includes('`${SITE_URL}' + SITE.logoPath + '`'),
    'inject-schema Organization logo path drifted from SITE.logoPath'
  );
});
