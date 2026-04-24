'use strict';

/**
 * Unit tests for server/lib/site-url.js.
 *
 * Covers:
 *   - valid origins pass through
 *   - malformed / non-https strings are rejected in prod mode
 *   - off-allow-list origins are rejected in prod mode
 *   - dev mode falls back to http://localhost:3000
 *   - buildUrl() produces absolute URLs using WHATWG URL joining
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');

function freshLoad(envOverrides = {}) {
  // Reset module cache so NODE_ENV etc. take effect.
  delete require.cache[require.resolve('../server/lib/site-url')];
  const snapshot = {
    NODE_ENV: process.env.NODE_ENV,
    SITE_URL: process.env.SITE_URL,
  };
  for (const [k, v] of Object.entries(envOverrides)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  const mod = require('../server/lib/site-url');
  return {
    mod,
    restore() {
      for (const [k, v] of Object.entries(snapshot)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
      delete require.cache[require.resolve('../server/lib/site-url')];
    },
  };
}

test('site-url: production falls back to canonical origin when SITE_URL is missing', () => {
  // Silence the warning during this test.
  const origWarn = console.warn;
  console.warn = () => {};
  try {
    const { mod, restore } = freshLoad({ NODE_ENV: 'production', SITE_URL: undefined });
    try {
      assert.equal(mod.resolveSiteOrigin(), 'https://goldtickerlive.com');
      assert.equal(mod.buildUrl('/pricing'), 'https://goldtickerlive.com/pricing');
    } finally {
      restore();
    }
  } finally {
    console.warn = origWarn;
  }
});

test('site-url: production rejects off-allow-list origins', () => {
  const origWarn = console.warn;
  console.warn = () => {};
  try {
    const { mod, restore } = freshLoad({
      NODE_ENV: 'production',
      SITE_URL: 'https://evil.example.com',
    });
    try {
      assert.equal(mod.resolveSiteOrigin(), 'https://goldtickerlive.com');
    } finally {
      restore();
    }
  } finally {
    console.warn = origWarn;
  }
});

test('site-url: production accepts canonical allow-list origins', () => {
  const { mod, restore } = freshLoad({
    NODE_ENV: 'production',
    SITE_URL: 'https://goldtickerlive.com',
  });
  try {
    assert.equal(mod.resolveSiteOrigin(), 'https://goldtickerlive.com');
  } finally {
    restore();
  }
});

test('site-url: development accepts localhost', () => {
  const { mod, restore } = freshLoad({ NODE_ENV: 'development', SITE_URL: undefined });
  try {
    assert.equal(mod.resolveSiteOrigin(), 'http://localhost:3000');
    assert.equal(mod.buildUrl('/account'), 'http://localhost:3000/account');
  } finally {
    restore();
  }
});

test('site-url: buildUrl produces absolute URLs and handles tricky paths', () => {
  const { mod, restore } = freshLoad({
    NODE_ENV: 'production',
    SITE_URL: 'https://goldtickerlive.com',
  });
  try {
    // Trailing slash, query string, Stripe placeholder preserved literally.
    const url = mod.buildUrl('/subscription/success?session_id={CHECKOUT_SESSION_ID}');
    assert.ok(
      url.startsWith('https://goldtickerlive.com/subscription/success?session_id='),
      `unexpected url: ${url}`
    );
    // Stripe's placeholder must survive the URL round-trip so Stripe can
    // substitute it server-side. Either the literal form or the WHATWG-
    // percent-encoded form is acceptable for their SDK.
    assert.ok(
      url.endsWith('{CHECKOUT_SESSION_ID}') || url.endsWith('%7BCHECKOUT_SESSION_ID%7D'),
      `placeholder not preserved: ${url}`
    );
    // Missing leading slash is tolerated by WHATWG URL joining.
    assert.equal(mod.buildUrl('pricing').startsWith('https://goldtickerlive.com/'), true);
  } finally {
    restore();
  }
});

test('site-url: normaliseOrigin rejects javascript: and malformed values', () => {
  const { mod, restore } = freshLoad({ NODE_ENV: 'development' });
  try {
    assert.equal(mod.__normaliseOriginForTests('javascript:alert(1)'), null);
    assert.equal(mod.__normaliseOriginForTests(''), null);
    assert.equal(mod.__normaliseOriginForTests('not a url'), null);
    assert.equal(
      mod.__normaliseOriginForTests('https://goldtickerlive.com/pricing'),
      'https://goldtickerlive.com'
    );
  } finally {
    restore();
  }
});
