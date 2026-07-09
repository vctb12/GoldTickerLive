'use strict';

/**
 * Accessible HTML render for the multi-metal comparison (Phase 60). Proves it mounts nothing while
 * the pilot is off, shows real prices only for `ok` rows (pending/disabled → "awaiting data", never a
 * fabricated number), escapes all interpolated values, and localises to Arabic (RTL).
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const MOD = new URL('../src/lib/metal-comparison-render.js', `file://${__filename}`).href;

const model = ({
  pilotEnabled = true,
  rows,
  disclaimer = 'Reference estimate — not financial advice.',
}) => ({
  pilotEnabled,
  rows,
  disclaimer,
});

const goldRow = {
  key: 'gold',
  name: 'Gold',
  symbol: 'XAU',
  gradeCode: '24',
  gradeLabel: '24K',
  state: 'ok',
  usdPerGram: 130.3294,
  aedPerGram: 478.6347,
};
const pendingSilver = {
  key: 'silver',
  name: 'Silver',
  symbol: 'XAG',
  gradeCode: '999',
  gradeLabel: 'Fine silver (.999)',
  state: 'pending-data',
  usdPerGram: null,
  aedPerGram: null,
};

test('render: returns "" when the pilot is off / no rows / bad model', async () => {
  const { renderMetalComparisonTableHtml } = await import(MOD);
  assert.equal(renderMetalComparisonTableHtml(model({ pilotEnabled: false, rows: [goldRow] })), '');
  assert.equal(renderMetalComparisonTableHtml(model({ rows: [] })), '');
  assert.equal(renderMetalComparisonTableHtml(null), '');
  assert.equal(renderMetalComparisonTableHtml({}), '');
});

test('render: ok row shows the price; pending row shows "awaiting data" (no fabricated number)', async () => {
  const { renderMetalComparisonTableHtml } = await import(MOD);
  const html = renderMetalComparisonTableHtml(model({ rows: [goldRow, pendingSilver] }));
  assert.match(html, /<table class="metal-comparison"/);
  assert.match(html, /Gold/);
  assert.match(html, /130\.3294 USD · 478\.6347 AED/);
  // Silver has no feed → awaiting data, and none of gold's numbers leak into its row.
  assert.match(html, /Awaiting data/);
  assert.match(html, /data-metal="silver" data-state="pending-data"/);
  assert.match(html, /class="metal-comparison__disclaimer">Reference estimate/);
});

test('render: freshness badge only on ok rows', async () => {
  const { renderMetalComparisonTableHtml } = await import(MOD);
  const html = renderMetalComparisonTableHtml(model({ rows: [goldRow, pendingSilver] }), {
    freshnessByMetal: { gold: { state: 'live' }, silver: { state: 'unavailable' } },
  });
  assert.match(html, /metal-badge metal-badge--live">live<\/span>/);
  // Pending silver row shows the em-dash, not a badge.
  assert.doesNotMatch(html, /metal-badge--unavailable/);
});

test('render: escapes all interpolated values (no XSS via model text)', async () => {
  const { renderMetalComparisonTableHtml } = await import(MOD);
  const evil = { ...goldRow, name: '<script>alert(1)</script>', gradeLabel: '"><img>' };
  const html = renderMetalComparisonTableHtml(model({ rows: [evil], disclaimer: '<b>x</b>' }));
  assert.doesNotMatch(html, /<script>/);
  assert.doesNotMatch(html, /<img>/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /&lt;b&gt;x&lt;\/b&gt;/);
});

test('render: Arabic localisation + RTL', async () => {
  const { renderMetalComparisonTableHtml } = await import(MOD);
  const html = renderMetalComparisonTableHtml(model({ rows: [goldRow] }), { lang: 'ar' });
  assert.match(html, /lang="ar" dir="rtl"/);
  assert.match(html, /المعادن الثمينة/); // caption
  assert.match(html, /المعدن/); // "Metal" header
  const pending = renderMetalComparisonTableHtml(model({ rows: [pendingSilver] }), { lang: 'ar' });
  assert.match(pending, /بانتظار البيانات/); // "awaiting data"
});
