'use strict';

/**
 * Guard: every in-page price freshness surface must apply the market-closed
 * overlay, so no surface can label a closed-market quote "Live" while the shared
 * ticker/spot-bar on the same page correctly reads "Closed"
 * (docs/freshness-contract.md — "If market is closed, state must be `closed`").
 *
 * These five pages plus the calculator note previously derived their pill from
 * the raw snapshot state / getLiveFreshness key WITHOUT the overlay (audit
 * 2026-07-11). This static guard locks the fix so the overlay can't be dropped
 * again silently. The overlay function itself is behaviourally tested in
 * freshness-badge-guard.test.js ("applyMarketClosedOverlay forces closed").
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(rel) {
  return fs.readFileSync(path.resolve(__dirname, '..', rel), 'utf8');
}

// Pages that derive an in-page freshness pill from the canonical snapshot and
// must route it through applyMarketClosedOverlay + carry a `closed` label.
const OVERLAY_SURFACES = [
  { file: 'src/pages/market.js', closedLabel: 'freshClosed' },
  { file: 'src/pages/dubai-gold-price.js', closedLabel: 'freshClosed' },
  { file: 'src/pages/shops.js', closedLabel: 'refClosed' },
  { file: 'src/pages/heatmap.js', closedLabel: null }, // uses shared freshness dict incl. `closed`
  { file: 'src/pages/invest.js', closedLabel: 'freshClosed' },
];

for (const { file, closedLabel } of OVERLAY_SURFACES) {
  test(`${file} applies applyMarketClosedOverlay to its freshness pill`, () => {
    const src = read(file);
    assert.match(
      src,
      /import\s*\{[^}]*applyMarketClosedOverlay[^}]*\}\s*from\s*['"][^'"]*live-status\.js['"]/,
      `${file} must import applyMarketClosedOverlay from live-status.js`
    );
    assert.match(
      src,
      /applyMarketClosedOverlay\s*\(/,
      `${file} must call applyMarketClosedOverlay() when deriving the pill state`
    );
    if (closedLabel) {
      assert.ok(
        src.includes(closedLabel),
        `${file} must define a "${closedLabel}" label so the overlaid closed state renders`
      );
    }
  });
}

test('calculator.js freshness note honors the market-closed overlay', () => {
  const src = read('src/pages/calculator.js');
  assert.match(
    src,
    /!\s*getMarketStatus\(\)\.isOpen/,
    'calculator note must branch on getMarketStatus().isOpen to show "Closed"'
  );
  // The note must show a Closed label in both languages.
  assert.ok(src.includes("'Closed'") && src.includes("'مغلق'"), 'note needs EN+AR closed label');
});

test('all overlaid surfaces still expose a bilingual closed label where they own one', () => {
  // AR "مغلق" must accompany EN "Closed" on the surfaces that own their label map.
  for (const file of ['src/pages/market.js', 'src/pages/dubai-gold-price.js', 'src/pages/shops.js', 'src/pages/invest.js']) {
    const src = read(file);
    assert.ok(src.includes("'Closed'"), `${file} missing EN closed label`);
    assert.ok(src.includes("'مغلق'"), `${file} missing AR closed label`);
  }
});
