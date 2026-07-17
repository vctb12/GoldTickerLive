'use strict';

/**
 * Operation Midas phase 12 — CSP / security-header inventory tooling.
 *
 * Two layers of coverage:
 *   1. Unit tests for scripts/node/csp-inventory.js — the parsing + hashing
 *      primitives, exercised on fixed fixture HTML so a browser-equivalent CSP
 *      hash and the origin/style extraction are pinned.
 *   2. A drift-LOCK test: it re-derives every runtime fetch origin from the real
 *      src/ tree and asserts each one is enumerated in the connect-src directive
 *      of docs/plans/midas/SECURITY_HEADERS.md. If anyone adds a client fetch to
 *      a new host without adding it to the policy, this fails.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.join(__dirname, '..');
const SCRIPT = path.join(ROOT, 'scripts', 'node', 'csp-inventory.js');
const SRC_DIR = path.join(ROOT, 'src');

const {
  cspHash,
  extractInlineScripts,
  isThemePreinit,
  extractHtmlResourceOrigins,
  extractHtmlAbsoluteOrigins,
  extractInlineStyleSurface,
  collectFetchOrigins,
  parsePolicyHashes,
  parseConnectSrc,
  hostCoveredBy,
  POLICY_DOC,
} = require(SCRIPT);

// ── cspHash ──────────────────────────────────────────────────────────────────

test('cspHash: matches a browser-equivalent sha256 of the exact bytes', () => {
  assert.equal(cspHash('console.log(1);'), 'sha256-NcFG924SlHfGQGG8hFEeEJDz1NgFlxPmZj3Us1sfdkI=');
});

test('cspHash: deterministic and sensitive to a single-byte change', () => {
  assert.equal(cspHash('a'), cspHash('a'));
  assert.notEqual(cspHash('a'), cspHash('a '));
  assert.match(cspHash('anything'), /^sha256-[A-Za-z0-9+/]+=*$/);
});

test('cspHash: hashes exact bytes, not trimmed content', () => {
  const body = '\n  alert(1);\n';
  const expected = `sha256-${crypto.createHash('sha256').update(body, 'utf8').digest('base64')}`;
  assert.equal(cspHash(body), expected);
  assert.notEqual(cspHash(body), cspHash(body.trim()));
});

// ── extractInlineScripts ─────────────────────────────────────────────────────

const FIXTURE = `<!doctype html>
<html>
  <head>
    <script>console.log(1);</script>
    <script type="application/ld+json">{"@context":"https://schema.org"}</script>
    <script src="/assets/app.js"></script>
    <style>.x{color:red}</style>
    <link rel="stylesheet" href="/assets/site.css" />
    <link rel="preload" as="font" href="/assets/cairo.woff2" />
  </head>
  <body style="margin:0">
    <img src="/assets/logo.png" />
    <a href="https://example.com/page">nav</a>
    <script type="module">import './m.js';</script>
    <script>if ('serviceWorker' in navigator) {}</script>
  </body>
</html>`;

test('extractInlineScripts: captures inline executable scripts, skips src + JSON-LD', () => {
  const bodies = extractInlineScripts(FIXTURE);
  // console.log, the inline module, and the SW snippet — NOT the ld+json, NOT the src script.
  assert.equal(bodies.length, 3);
  assert.ok(bodies.includes('console.log(1);'));
  assert.ok(bodies.some((b) => b.includes("import './m.js';")));
  assert.ok(bodies.some((b) => b.includes('serviceWorker')));
  assert.ok(!bodies.some((b) => b.includes('schema.org')), 'JSON-LD must be excluded');
});

test('isThemePreinit: recognizes the theme-preinit marker only', () => {
  const themeBody = "el.classList.add('js'); el.setAttribute('data-theme-mode', mode);";
  assert.equal(isThemePreinit(themeBody), true);
  assert.equal(isThemePreinit('console.log(1);'), false);
});

// ── resource / absolute origins ──────────────────────────────────────────────

test('extractHtmlResourceOrigins: same-origin refs yield no external origins', () => {
  const res = extractHtmlResourceOrigins(FIXTURE);
  assert.deepEqual(res.script, []);
  assert.deepEqual(res.style, []);
  assert.deepEqual(res.img, []);
  assert.deepEqual(res.font, []);
});

test('extractHtmlResourceOrigins: buckets external resource loads by type', () => {
  const html = `
    <script src="https://cdn.example.com/a.js"></script>
    <link rel="stylesheet" href="https://styles.example.com/s.css">
    <link rel="preload" as="font" href="https://fonts.example.com/f.woff2">
    <img src="https://img.example.com/p.png">
    <a href="https://nav.example.com">x</a>`;
  const res = extractHtmlResourceOrigins(html);
  assert.deepEqual(res.script, ['https://cdn.example.com']);
  assert.deepEqual(res.style, ['https://styles.example.com']);
  assert.deepEqual(res.font, ['https://fonts.example.com']);
  assert.deepEqual(res.img, ['https://img.example.com']);
});

test('extractHtmlAbsoluteOrigins: collects <a href> navigation origins too', () => {
  const origins = extractHtmlAbsoluteOrigins(FIXTURE);
  assert.deepEqual(origins, ['https://example.com']);
});

// ── inline style surface ─────────────────────────────────────────────────────

test('extractInlineStyleSurface: counts <style> blocks and detects style= attr', () => {
  const s = extractInlineStyleSurface(FIXTURE);
  assert.equal(s.styleTags, 1);
  assert.equal(s.hasStyleAttr, true);
  const clean = extractInlineStyleSurface('<div>no styles</div>');
  assert.equal(clean.styleTags, 0);
  assert.equal(clean.hasStyleAttr, false);
});

// ── policy-doc parsing ───────────────────────────────────────────────────────

test('parsePolicyHashes: pulls sha256 tokens out of the policy doc', () => {
  const md = fs.readFileSync(POLICY_DOC, 'utf8');
  const hashes = parsePolicyHashes(md);
  assert.ok(hashes.size >= 3, 'policy doc must enumerate at least the 3 inline hashes');
  for (const h of hashes) assert.match(h, /^sha256-[A-Za-z0-9+/]+=*$/);
});

test('parseConnectSrc: parses connect-src tokens (scheme-stripped, no self)', () => {
  const md = "x connect-src 'self' https://a.com https://*.b.com; y";
  const tokens = parseConnectSrc(md);
  assert.deepEqual(tokens, ['a.com', '*.b.com']);
});

test('hostCoveredBy: exact + wildcard matching', () => {
  assert.equal(hostCoveredBy('a.com', 'a.com'), true);
  assert.equal(hostCoveredBy('a.com', 'b.com'), false);
  assert.equal(hostCoveredBy('proj.supabase.co', '*.supabase.co'), true);
  assert.equal(hostCoveredBy('supabase.co', '*.supabase.co'), true);
  assert.equal(hostCoveredBy('evilsupabase.co', '*.supabase.co'), false);
  assert.equal(hostCoveredBy('a.com', 'https://a.com'), true);
});

// ── DRIFT LOCK: every src/ fetch origin must be in the doc's connect-src ──────

test('drift-lock: every runtime fetch origin in src/ is enumerated in connect-src', () => {
  const fetchOrigins = collectFetchOrigins(SRC_DIR);
  assert.ok(fetchOrigins.length > 0, 'expected to discover runtime fetch origins in src/');

  const md = fs.readFileSync(POLICY_DOC, 'utf8');
  const connectTokens = parseConnectSrc(md);
  assert.ok(connectTokens.length > 0, 'policy doc must contain a connect-src directive');

  const uncovered = fetchOrigins
    .map((o) => o.host)
    .filter((host) => !connectTokens.some((tok) => hostCoveredBy(host, tok)));

  assert.deepEqual(
    uncovered,
    [],
    `These src/ fetch origins are missing from connect-src in ${path.relative(ROOT, POLICY_DOC)}: ${uncovered.join(', ')}`
  );
});

test('drift-lock: the seven known first-party fetch origins are all present', () => {
  const hosts = collectFetchOrigins(SRC_DIR).map((o) => o.host);
  for (const expected of [
    'api.gold-api.com',
    'mintedmetal.com',
    'open.er-api.com',
    'freegoldapi.com',
    'api.gdeltproject.org',
    'nominatim.openstreetmap.org',
    'nebdpxjazlnsrfmlpgeq.supabase.co',
  ]) {
    assert.ok(hosts.includes(expected), `expected src/ to still fetch ${expected}`);
  }
});
