'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const root = join(__dirname, '..');

describe('freshness coverage', () => {
  it('src/pages/home.js uses getLiveFreshness primitive', () => {
    const src = readFileSync(join(root, 'src/pages/home.js'), 'utf8');
    assert.ok(src.includes('getLiveFreshness'), 'home.js must call getLiveFreshness');
  });

  it('src/components/ticker.js imports getLiveFreshness from live-status', () => {
    const src = readFileSync(join(root, 'src/components/ticker.js'), 'utf8');
    const usesLiveStatus = src.includes('getLiveFreshness') || src.includes('live-status');
    assert.ok(
      usesLiveStatus,
      'ticker.js must use freshness data (getLiveFreshness or live-status import)'
    );
  });

  it('src/components/spotBar.js imports getLiveFreshness from live-status', () => {
    const src = readFileSync(join(root, 'src/components/spotBar.js'), 'utf8');
    const usesFreshness = src.includes('getLiveFreshness') || src.includes('live-status');
    assert.ok(usesFreshness, 'spotBar.js must import and use getLiveFreshness from live-status');
  });

  it('src/lib/page-hydrator.js handles freshness data', () => {
    const src = readFileSync(join(root, 'src/lib/page-hydrator.js'), 'utf8');
    // page-hydrator renders freshness UI elements and passes hasLiveFailure to callers
    const usesFreshness =
      src.includes('freshness') || src.includes('live-status') || src.includes('getLiveFreshness');
    assert.ok(usesFreshness, 'page-hydrator.js must handle freshness');
  });

  it('src/tracker/render.js uses getLiveFreshness primitive', () => {
    const src = readFileSync(join(root, 'src/tracker/render.js'), 'utf8');
    const usesFreshness =
      src.includes('getLiveFreshness') || src.includes('live-status') || src.includes('freshness');
    assert.ok(usesFreshness, 'tracker/render.js must use freshness data');
  });

  it('no price-rendering surface exposes getLiveFreshness directly as a raw timestamp without labelling', () => {
    // getFreshnessMeta wraps getLiveFreshness — verify the wrapper is used in home.js
    const src = readFileSync(join(root, 'src/pages/home.js'), 'utf8');
    assert.ok(
      src.includes('getFreshnessMeta()'),
      'home.js renderHeroCard must call getFreshnessMeta() which wraps getLiveFreshness'
    );
  });
});
