/**
 * Tests for src/components/chart-summary.js — the accessible series summary
 * derived from the exact points a Lightweight Charts canvas renders.
 *
 * Follows the tests/formatter-locale.test.js pattern: CJS test file loading
 * the real ESM module via dynamic import, and assertions that check structure
 * and digits rather than pinning volatile ICU output.
 */

'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

async function loadChartSummary() {
  const url = new URL(
    'file://' + path.resolve(__dirname, '..', 'src', 'components', 'chart-summary.js')
  );
  // Per-locale dictionary split: chart-summary reads the runtime table, which
  // starts EN-only. Production boots graft AR via ensureLocale() before any
  // chart renders; mirror that so the Arabic assertions see real Arabic.
  const runtimeUrl = new URL(
    'file://' + path.resolve(__dirname, '..', 'src', 'config', 'translations-runtime.js')
  );
  const { ensureLocale } = await import(runtimeUrl.href);
  await ensureLocale('ar');
  return import(url.href);
}

const SERIES = [
  { time: '2026-01-01', value: 2000 },
  { time: '2026-02-01', value: 2100 },
  { time: '2026-03-01', value: 1950 },
  { time: '2026-04-01', value: 2050 },
];

describe('computeSeriesSummary()', () => {
  test('returns null for non-arrays and series shorter than 2 valid points', async () => {
    const { computeSeriesSummary } = await loadChartSummary();
    assert.equal(computeSeriesSummary(null), null);
    assert.equal(computeSeriesSummary(undefined), null);
    assert.equal(computeSeriesSummary([]), null);
    assert.equal(computeSeriesSummary([{ time: '2026-01-01', value: 2000 }]), null);
    // Two points but only one valid → still null
    assert.equal(
      computeSeriesSummary([
        { time: '2026-01-01', value: 2000 },
        { time: '2026-01-02', value: 0 },
      ]),
      null
    );
  });

  test('computes change, percentage, high and low from first→last valid points', async () => {
    const { computeSeriesSummary } = await loadChartSummary();
    const s = computeSeriesSummary(SERIES);
    assert.ok(s);
    assert.equal(s.points, 4);
    assert.equal(s.firstValue, 2000);
    assert.equal(s.lastValue, 2050);
    assert.equal(s.change, 50);
    assert.ok(Math.abs(s.pctChange - 2.5) < 1e-9);
    assert.equal(s.high, 2100);
    assert.equal(s.low, 1950);
    assert.equal(s.firstDate.toISOString().slice(0, 10), '2026-01-01');
    assert.equal(s.lastDate.toISOString().slice(0, 10), '2026-04-01');
  });

  test('accepts unix-second times (short-range snapshot format)', async () => {
    const { computeSeriesSummary } = await loadChartSummary();
    const t0 = Math.floor(Date.UTC(2026, 0, 1) / 1000);
    const s = computeSeriesSummary([
      { time: t0, value: 2400 },
      { time: t0 + 90, value: 2410 },
      { time: t0 + 180, value: 2405 },
    ]);
    assert.ok(s);
    assert.equal(s.points, 3);
    assert.equal(s.change, 5);
    assert.equal(s.high, 2410);
    assert.equal(s.firstDate.getTime(), t0 * 1000);
  });

  test('filters out invalid points instead of corrupting the stats', async () => {
    const { computeSeriesSummary } = await loadChartSummary();
    const s = computeSeriesSummary([
      { time: '2026-01-01', value: 2000 },
      { time: 'not-a-date', value: 5000 }, // bad time → dropped
      { time: '2026-01-02', value: NaN }, // NaN → dropped
      { time: '2026-01-03', value: -10 }, // non-positive → dropped
      null, // junk entry → dropped
      { time: '2026-01-04', value: 2020 },
    ]);
    assert.ok(s);
    assert.equal(s.points, 2);
    assert.equal(s.change, 20);
    assert.equal(s.high, 2020);
    assert.equal(s.low, 2000);
  });

  test('negative movement produces negative change and pctChange', async () => {
    const { computeSeriesSummary } = await loadChartSummary();
    const s = computeSeriesSummary([
      { time: '2026-01-01', value: 2000 },
      { time: '2026-01-02', value: 1900 },
    ]);
    assert.ok(s);
    assert.equal(s.change, -100);
    assert.ok(s.pctChange < 0);
  });

  test('flags intraday when endpoint times are numeric, not for date strings', async () => {
    const { computeSeriesSummary } = await loadChartSummary();
    const t0 = Math.floor(Date.UTC(2026, 0, 1) / 1000);
    assert.equal(
      computeSeriesSummary([
        { time: t0, value: 2400 },
        { time: t0 + 90, value: 2410 },
      ]).intraday,
      true
    );
    assert.equal(computeSeriesSummary(SERIES).intraday, false);
  });
});

describe('formatChartSummaryText()', () => {
  test('English summary contains direction, values, and period dates', async () => {
    const { computeSeriesSummary, formatChartSummaryText } = await loadChartSummary();
    const text = formatChartSummaryText(computeSeriesSummary(SERIES), 'en', {
      unitKey: 'chart.summary.unitUsdOz',
    });
    assert.ok(text.startsWith('Chart data summary:'), text);
    assert.ok(text.includes(' up '), text);
    assert.ok(text.includes('2,050.00'), text); // latest, 2dp en grouping
    assert.ok(text.includes('2,100.00'), text); // high
    assert.ok(text.includes('1,950.00'), text); // low
    assert.ok(text.includes('2026'), text); // period dates present
    assert.ok(text.includes('%'), text);
    assert.ok(text.includes('troy ounce'), text); // unit disclosure
  });

  test('omits the unit sentence when no unitKey is given (custom series)', async () => {
    const { computeSeriesSummary, formatChartSummaryText } = await loadChartSummary();
    const text = formatChartSummaryText(computeSeriesSummary(SERIES), 'en');
    assert.ok(text.startsWith('Chart data summary:'), text);
    // A custom-injected series may be AED/gram etc. — the summary must not
    // claim a unit the module cannot verify.
    assert.ok(!text.includes('troy ounce'), text);
    assert.ok(!text.includes('USD per'), text);
  });

  test('downward series uses the "down" direction word', async () => {
    const { computeSeriesSummary, formatChartSummaryText } = await loadChartSummary();
    const text = formatChartSummaryText(
      computeSeriesSummary([
        { time: '2026-01-01', value: 2000 },
        { time: '2026-01-02', value: 1900 },
      ]),
      'en'
    );
    assert.ok(text.includes(' down '), text);
    assert.ok(!text.includes(' up '), text);
  });

  test('Arabic summary uses Arabic template and direction word', async () => {
    const { computeSeriesSummary, formatChartSummaryText } = await loadChartSummary();
    const text = formatChartSummaryText(computeSeriesSummary(SERIES), 'ar', {
      unitKey: 'chart.summary.unitUsdOz',
    });
    assert.ok(text.includes('ملخص بيانات الرسم البياني'), text);
    assert.ok(text.includes('صعوداً'), text);
    assert.ok(text.includes('أوقية تروي'), text); // repo's established troy-ounce term
  });

  test('a visually-flat series is announced as unchanged, not "up by 0.00"', async () => {
    const { computeSeriesSummary, formatChartSummaryText } = await loadChartSummary();
    const flat = computeSeriesSummary([
      { time: '2026-01-01', value: 2000 },
      { time: '2026-01-02', value: 2000.001 }, // displays as 0.00 change
    ]);
    const en = formatChartSummaryText(flat, 'en');
    assert.ok(en.includes('effectively unchanged'), en);
    assert.ok(!en.includes(' up '), en);
    const ar = formatChartSummaryText(flat, 'ar');
    assert.ok(ar.includes('دون تغيير'), ar);
    assert.ok(!ar.includes('صعوداً'), ar);
  });

  test('null summary yields the explicit no-data sentence in both languages', async () => {
    const { formatChartSummaryText } = await loadChartSummary();
    assert.equal(
      formatChartSummaryText(null, 'en'),
      'No chart data is available for this range yet.'
    );
    assert.equal(
      formatChartSummaryText(null, 'ar'),
      'لا تتوفر بيانات للرسم البياني في هذا النطاق بعد.'
    );
  });
});
