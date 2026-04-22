/**
 * Tests for src/lib/safe-dom.js — these are pure functions (no DOM API
 * required for `escape`, `safeHref`, `safeTel`) so they run fine under
 * `node --test`.
 */

'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// The module is authored as ESM; load it via dynamic import.
async function load() {
  const url = new URL('file://' + path.resolve(__dirname, '..', 'src', 'lib', 'safe-dom.js'));
  return import(url.href);
}

test('escape() neutralises XSS payloads in text', async () => {
  const { escape } = await load();
  assert.equal(escape('<script>alert(1)</script>'), '&lt;script&gt;alert(1)&lt;/script&gt;');
  assert.equal(escape('" onerror="x"'), '&quot; onerror=&quot;x&quot;');
  assert.equal(escape("it's"), 'it&#39;s');
  assert.equal(escape('a&b'), 'a&amp;b');
  assert.equal(escape(null), '');
  assert.equal(escape(undefined), '');
  assert.equal(escape(0), '0'); // preserve falsy non-null values
});

test('escape() is idempotent enough to not double-encode predictably', async () => {
  const { escape } = await load();
  const once = escape('<a>');
  const twice = escape(once);
  // Intentionally different — double-escape is the expected safe default when
  // callers pipe pre-escaped strings back through. This guards against the
  // common mistake of assuming idempotence.
  assert.notEqual(once, twice);
  assert.ok(twice.startsWith('&amp;'));
});

test('safeHref() rejects javascript: and data: URLs', async () => {
  const { safeHref } = await load();
  assert.equal(safeHref('javascript:alert(1)'), '');
  assert.equal(safeHref('JAVASCRIPT:alert(1)'), '');
  assert.equal(safeHref('  javascript:alert(1)'), '');
  assert.equal(safeHref('data:text/html,<script>alert(1)</script>'), '');
  assert.equal(safeHref('vbscript:msgbox(1)'), '');
  assert.equal(safeHref('file:///etc/passwd'), '');
});

test('safeHref() allows http/https/relative/fragment', async () => {
  const { safeHref } = await load();
  assert.equal(safeHref('https://example.com/x'), 'https://example.com/x');
  assert.equal(safeHref('http://example.com'), 'http://example.com');
  assert.equal(safeHref('/internal/path'), '/internal/path');
  assert.equal(safeHref('./rel'), './rel');
  assert.equal(safeHref('#section'), '#section');
});

test('safeHref() returns empty string for null/undefined/non-string', async () => {
  const { safeHref } = await load();
  assert.equal(safeHref(null), '');
  assert.equal(safeHref(undefined), '');
  assert.equal(safeHref(123), '');
  assert.equal(safeHref({}), '');
});

test('safeTel() strips non-phone characters', async () => {
  const { safeTel } = await load();
  assert.equal(safeTel('+971-50-123-4567'), '+971-50-123-4567');
  assert.equal(safeTel('+971 50 <script>'), '+97150');
  assert.equal(safeTel('tel:+97150'), '+97150');
  assert.equal(safeTel(null), '');
});
