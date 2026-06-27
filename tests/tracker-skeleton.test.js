'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

// Guards clearSkeleton(): when real content arrives, the loading placeholder
// must be fully removed — aria-busy + the self-applied `skeleton-inline` shimmer
// and `shell-skeleton-*` size classes — while unrelated classes are preserved.
// Without this, the shimmer sits behind the value and pins the element's size.
// See src/components/skeleton.js + src/tracker/hero.js.

async function load() {
  const url = new URL(
    'file://' + path.resolve(__dirname, '..', 'src', 'components', 'skeleton.js')
  );
  return import(url.href);
}

function makeEl(classes) {
  const set = new Set(classes);
  return {
    attrs: { 'aria-busy': 'true' },
    classList: {
      [Symbol.iterator]() {
        return set[Symbol.iterator]();
      },
      remove(c) {
        set.delete(c);
      },
      contains(c) {
        return set.has(c);
      },
      get length() {
        return set.size;
      },
    },
    removeAttribute(name) {
      delete this.attrs[name];
    },
  };
}

test('clearSkeleton: removes skeleton-inline + shell-skeleton-* and aria-busy', async () => {
  const { clearSkeleton } = await load();
  const el = makeEl(['skeleton-inline', 'shell-skeleton-price-lg', 'tracker-badge']);
  clearSkeleton(el);
  assert.equal(el.classList.contains('skeleton-inline'), false);
  assert.equal(el.classList.contains('shell-skeleton-price-lg'), false);
  assert.equal(el.classList.contains('tracker-badge'), true, 'unrelated class preserved');
  assert.equal(el.attrs['aria-busy'], undefined, 'aria-busy removed');
});

test('clearSkeleton: preserves layout/state classes on mobile readouts', async () => {
  const { clearSkeleton } = await load();
  const el = makeEl([
    'mobile-command-card__metric-value',
    'skeleton-inline',
    'shell-skeleton-karat',
  ]);
  clearSkeleton(el);
  assert.equal(el.classList.contains('mobile-command-card__metric-value'), true);
  assert.equal(el.classList.contains('skeleton-inline'), false);
  assert.equal(el.classList.contains('shell-skeleton-karat'), false);
});

test('clearSkeleton: idempotent and null-safe', async () => {
  const { clearSkeleton } = await load();
  assert.doesNotThrow(() => clearSkeleton(null));
  assert.doesNotThrow(() => clearSkeleton(undefined));
  const el = makeEl(['skeleton-inline', 'trust-chip']);
  clearSkeleton(el);
  clearSkeleton(el); // second call is a no-op
  assert.equal(el.classList.contains('skeleton-inline'), false);
  assert.equal(el.classList.contains('trust-chip'), true);
});
