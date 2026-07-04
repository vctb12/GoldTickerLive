/**
 * Tests for src/lib/error-reporter.js — global error → analytics bridge.
 *
 * The reporter forwards through analytics.track(), which needs a browser-ish
 * global environment (window.gtag, location, storage). We stub the minimum
 * globals, capture gtag calls, and drive the listeners directly through a
 * fake window object.
 */

'use strict';

const { test, describe, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const gtagCalls = [];

// analytics.js reads these globals inside track(); provide safe stubs.
// Some (navigator) are getter-only in Node 22+, so redefine via descriptors
// and restore the originals afterwards.
const stubs = {
  window: {
    gtag: (...args) => {
      gtagCalls.push(args);
    },
  },
  location: { pathname: '/test-page.html', search: '', hostname: 'example.com' },
  navigator: {},
  sessionStorage: {
    getItem: () => 'test-session',
    setItem: () => {},
  },
  localStorage: {
    getItem: () => null,
  },
};
const savedDescriptors = {};
for (const [key, value] of Object.entries(stubs)) {
  savedDescriptors[key] = Object.getOwnPropertyDescriptor(globalThis, key);
  Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
}

after(() => {
  for (const [key, descriptor] of Object.entries(savedDescriptors)) {
    if (descriptor === undefined) delete globalThis[key];
    else Object.defineProperty(globalThis, key, descriptor);
  }
});

async function loadReporter() {
  const url = new URL('file://' + path.resolve(__dirname, '..', 'src', 'lib', 'error-reporter.js'));
  return import(url.href);
}

function makeFakeWindow() {
  const listeners = {};
  return {
    listeners,
    addEventListener(type, handler) {
      (listeners[type] = listeners[type] || []).push(handler);
    },
    dispatch(type, event) {
      (listeners[type] || []).forEach((handler) => handler(event));
    },
  };
}

describe('sourceBucket()', () => {
  test('reduces a script URL to pathname:line', async () => {
    const { sourceBucket } = await loadReporter();
    assert.equal(
      sourceBucket('https://goldtickerlive.com/src/pages/tracker-pro.js?v=2#x', 42),
      '/src/pages/tracker-pro.js:42'
    );
  });

  test('falls back to the current page path when the source is unknown', async () => {
    const { sourceBucket } = await loadReporter();
    assert.equal(sourceBucket(undefined, undefined), '/test-page.html');
    assert.equal(sourceBucket('', 0), '/test-page.html');
  });

  test('caps bucket length at 100 chars (GA4 param limit)', async () => {
    const { sourceBucket } = await loadReporter();
    const long = 'https://goldtickerlive.com/' + 'a/'.repeat(120) + 'x.js';
    assert.ok(sourceBucket(long, 7).length <= 100);
  });
});

describe('installErrorReporter()', () => {
  beforeEach(async () => {
    const { _resetForTests } = await loadReporter();
    _resetForTests();
    gtagCalls.length = 0;
  });

  test('installs once and is idempotent', async () => {
    const { installErrorReporter } = await loadReporter();
    const win = makeFakeWindow();
    assert.equal(installErrorReporter(win), true);
    assert.equal(installErrorReporter(win), false, 'second install must be a no-op');
    assert.equal(win.listeners.error.length, 1);
    assert.equal(win.listeners.unhandledrejection.length, 1);
  });

  test('returns false without a window (SSG/Node safety)', async () => {
    const { installErrorReporter } = await loadReporter();
    assert.equal(installErrorReporter(null), false);
  });

  test('forwards uncaught errors to the governed analytics error event', async () => {
    const { installErrorReporter } = await loadReporter();
    const win = makeFakeWindow();
    installErrorReporter(win);
    win.dispatch('error', {
      error: new Error('boom'),
      filename: 'https://goldtickerlive.com/src/lib/api.js',
      lineno: 12,
    });
    assert.equal(gtagCalls.length, 1);
    const [verb, name, params] = gtagCalls[0];
    assert.equal(verb, 'event');
    assert.equal(name, 'error');
    assert.deepEqual(params, { type: 'uncaught', where: '/src/lib/api.js:12' });
  });

  test('forwards unhandled rejections with page-path bucket only', async () => {
    const { installErrorReporter } = await loadReporter();
    const win = makeFakeWindow();
    installErrorReporter(win);
    win.dispatch('unhandledrejection', { reason: new Error('secret user data') });
    assert.equal(gtagCalls.length, 1);
    const [, name, params] = gtagCalls[0];
    assert.equal(name, 'error');
    assert.deepEqual(params, { type: 'unhandledrejection', where: '/test-page.html' });
  });

  test('ignores resource-load error events (target !== window, no error object)', async () => {
    const { installErrorReporter } = await loadReporter();
    const win = makeFakeWindow();
    installErrorReporter(win);
    win.dispatch('error', { target: { tagName: 'IMG' } });
    assert.equal(gtagCalls.length, 0);
  });

  test('dedupes identical errors and caps reports per page load', async () => {
    const { installErrorReporter } = await loadReporter();
    const win = makeFakeWindow();
    installErrorReporter(win);

    // Same source twice → one report.
    for (let i = 0; i < 2; i++) {
      win.dispatch('error', { error: new Error('x'), filename: '/a.js', lineno: 1 });
    }
    assert.equal(gtagCalls.length, 1, 'identical errors must be deduped');

    // Distinct sources beyond the cap → at most 5 total reports.
    for (let line = 2; line <= 20; line++) {
      win.dispatch('error', { error: new Error('x'), filename: '/a.js', lineno: line });
    }
    assert.equal(gtagCalls.length, 5, 'reports must be capped per page load');
  });
});
