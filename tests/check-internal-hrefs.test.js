'use strict';

/**
 * Unit tests for the bare-relative URL-attribute guard
 * (`scripts/node/check-internal-hrefs.js`).
 *
 * Context: `el()` routes URL attributes through `safeHref()`, which rejects
 * bare-relative URLs like `tracker.html`. `el()` then skips `setAttribute`
 * entirely, so the anchor ships with NO href — unfocusable, keyboard-unreachable
 * and not announced as a link. Thirteen such anchors shipped before this guard
 * existed (audit 2026-09-21).
 *
 * These tests lock the guard's decision boundaries, including the two
 * static-analysis carve-outs it deliberately makes.
 */

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const {
  isAcceptedBySafeHref,
  looksLikeUrlPath,
  hasUndecidablePrefix,
} = require('../scripts/node/check-internal-hrefs.js');

describe('isAcceptedBySafeHref — mirrors the safeHref() allowlist', () => {
  test('accepts every form safeHref() allows', () => {
    for (const ok of [
      'https://example.com/x',
      'http://example.com',
      'mailto:hi@example.com',
      'tel:+971501234567',
      '/tracker.html',
      './rel.html',
      '../up.html',
      '#section',
      '', // explicit no-op
    ]) {
      assert.equal(isAcceptedBySafeHref(ok), true, `${ok} should be accepted`);
    }
  });

  test('rejects the bare-relative form that silently drops the attribute', () => {
    for (const bad of ['tracker.html', 'calculator.html', 'compare.html#k=22']) {
      assert.equal(isAcceptedBySafeHref(bad), false, `${bad} should be rejected`);
    }
  });
});

describe('looksLikeUrlPath — avoids flagging plain data objects', () => {
  test('a nav-item descriptor value is not treated as a URL', () => {
    // src/components/nav.js has `{ action: 'menu', icon, label, key }` — a data
    // object, not an el() attribute object. `action` is a real URL attribute
    // name, so only the value shape can tell these apart.
    assert.equal(looksLikeUrlPath('menu'), false);
    assert.equal(looksLikeUrlPath('submit'), false);
  });

  test('page-shaped values are treated as URLs', () => {
    assert.equal(looksLikeUrlPath('tracker.html'), true);
    assert.equal(looksLikeUrlPath('assets/x.png'), true);
    assert.equal(looksLikeUrlPath('#faq'), true);
    assert.equal(looksLikeUrlPath('?lang=ar'), true);
  });
});

describe('hasUndecidablePrefix — skips statically-unknowable template values', () => {
  test('a template literal starting with an interpolation is skipped', () => {
    // e.g. src/seo/hreflang.js `${canonical}?lang=ar`
    assert.equal(hasUndecidablePrefix('${canonical}?lang=ar', '`'), true);
    assert.equal(hasUndecidablePrefix('${baseUrl}${item.href}', '`'), true);
  });

  test('a template literal with a literal prefix is still checked', () => {
    // e.g. the heatmap compare link `compare.html#compare=ae,${code}`
    assert.equal(hasUndecidablePrefix('compare.html#compare=ae,${code}', '`'), false);
  });

  test('ordinary quoted strings are never skipped', () => {
    assert.equal(hasUndecidablePrefix('${notATemplate}', "'"), false);
    assert.equal(hasUndecidablePrefix('tracker.html', '"'), false);
  });
});
