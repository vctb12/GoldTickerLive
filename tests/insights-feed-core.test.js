'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

// insights-feed-core is an ES module; load it dynamically.
let core;
async function load() {
  if (!core) core = await import('../src/lib/insights-feed-core.js');
  return core;
}

const CATEGORIES = [
  { id: 'all', en: 'All', ar: 'الكل' },
  { id: 'price-analysis', en: 'Price Analysis', ar: 'تحليل الأسعار' },
  { id: 'buying-guides', en: 'Buying Guides', ar: 'أدلة الشراء' },
  { id: 'zakat', en: 'Zakat', ar: 'الزكاة' },
];

const INSIGHTS = [
  {
    id: 'a',
    category: 'price-analysis',
    dateIso: '2026-04-18',
    words: 760,
    featured: true,
    title: { en: 'Spot vs Retail Gold', ar: 'الفوري مقابل التجزئة' },
    excerpt: { en: 'Why Dubai prices differ from spot', ar: 'لماذا تختلف أسعار دبي' },
  },
  {
    id: 'b',
    category: 'buying-guides',
    dateIso: '2026-03-08',
    words: 400,
    title: { en: '24K vs 22K karat', ar: 'عيار 24 مقابل 22' },
    excerpt: { en: 'Which karat to buy', ar: 'أي عيار تشتري' },
  },
  {
    id: 'c',
    category: 'zakat',
    dateIso: '2026-02-10',
    words: 700,
    title: { en: 'Zakat on gold guide', ar: 'دليل زكاة الذهب' },
    excerpt: { en: 'Nisab and 2.5 percent', ar: 'النصاب و2.5 بالمئة' },
  },
];

const CONSTS = { aedPeg: 3.6725, troyGrams: 31.1034768, karat22Purity: 22 / 24 };

test('wordCount counts whitespace-separated words', async () => {
  const { wordCount } = await load();
  assert.equal(wordCount('one two three'), 3);
  assert.equal(wordCount('  spaced   out  words '), 3);
  assert.equal(wordCount(''), 0);
  assert.equal(wordCount(null), 0);
});

test('estimateReadMinutes uses 200 wpm and floors at 1', async () => {
  const { estimateReadMinutes } = await load();
  assert.equal(estimateReadMinutes(200), 1);
  assert.equal(estimateReadMinutes(400), 2);
  assert.equal(estimateReadMinutes(760), 4);
  assert.equal(estimateReadMinutes(10), 1, 'short articles still read as 1 min');
  assert.equal(estimateReadMinutes(0), 1);
  assert.equal(estimateReadMinutes(-5), 1);
});

test('formatReadTime is bilingual', async () => {
  const { formatReadTime } = await load();
  assert.equal(formatReadTime(4, 'en'), '4 min read');
  assert.equal(formatReadTime(4, 'ar'), 'قراءة 4 دقائق');
});

test('sortByDateDesc returns newest first without mutating input', async () => {
  const { sortByDateDesc } = await load();
  const input = [...INSIGHTS];
  const sorted = sortByDateDesc(input);
  assert.deepEqual(
    sorted.map((i) => i.id),
    ['a', 'b', 'c']
  );
  assert.equal(input[0].id, 'a', 'original array order preserved');
});

test('getFeatured prefers the flagged insight', async () => {
  const { getFeatured } = await load();
  assert.equal(getFeatured(INSIGHTS).id, 'a');
  assert.equal(getFeatured([]), null);
});

test('getFeatured falls back to newest when none flagged', async () => {
  const { getFeatured } = await load();
  const unflagged = INSIGHTS.map((i) => ({ ...i, featured: false }));
  assert.equal(getFeatured(unflagged).id, 'a');
});

test('filterInsights filters by category', async () => {
  const { filterInsights } = await load();
  assert.equal(filterInsights(INSIGHTS, { category: 'all' }).length, 3);
  const z = filterInsights(INSIGHTS, { category: 'zakat' });
  assert.equal(z.length, 1);
  assert.equal(z[0].id, 'c');
});

test('filterInsights searches title and excerpt, case-insensitive', async () => {
  const { filterInsights } = await load();
  assert.equal(filterInsights(INSIGHTS, { query: 'karat' })[0].id, 'b');
  assert.equal(filterInsights(INSIGHTS, { query: 'NISAB' })[0].id, 'c');
  assert.equal(filterInsights(INSIGHTS, { query: 'nomatchxyz' }).length, 0);
});

test('filterInsights searches Arabic content when lang=ar', async () => {
  const { filterInsights } = await load();
  const res = filterInsights(INSIGHTS, { query: 'النصاب', lang: 'ar' });
  assert.equal(res.length, 1);
  assert.equal(res[0].id, 'c');
});

test('filterInsights combines category and query', async () => {
  const { filterInsights } = await load();
  assert.equal(filterInsights(INSIGHTS, { category: 'buying-guides', query: 'karat' }).length, 1);
  assert.equal(filterInsights(INSIGHTS, { category: 'zakat', query: 'karat' }).length, 0);
});

test('categoryCounts tallies each category and all', async () => {
  const { categoryCounts } = await load();
  const counts = categoryCounts(INSIGHTS, CATEGORIES);
  assert.equal(counts.all, 3);
  assert.equal(counts['price-analysis'], 1);
  assert.equal(counts['buying-guides'], 1);
  assert.equal(counts.zakat, 1);
});

test('aed22kPerGram converts spot to AED 22K per gram', async () => {
  const { aed22kPerGram } = await load();
  const v = aed22kPerGram(2400, CONSTS);
  // 2400/31.1034768 * (22/24) * 3.6725 ≈ 259.7
  assert.ok(v > 255 && v < 265, `expected ~259.7, got ${v}`);
  assert.equal(aed22kPerGram(0, CONSTS), 0);
  assert.equal(aed22kPerGram(-1, CONSTS), 0);
});

test('buildPriceContext flags an up move', async () => {
  const { buildPriceContext } = await load();
  const ctx = buildPriceContext({ currentUsd: 2424, weekAgoUsd: 2400 });
  assert.equal(ctx.direction, 'up');
  assert.equal(ctx.pct, 1);
  assert.match(ctx.headline, /up 1.00%/);
});

test('buildPriceContext flags a down move', async () => {
  const { buildPriceContext } = await load();
  const ctx = buildPriceContext({ currentUsd: 2376, weekAgoUsd: 2400 });
  assert.equal(ctx.direction, 'down');
  assert.equal(ctx.pct, -1);
});

test('buildPriceContext treats tiny moves as flat', async () => {
  const { buildPriceContext } = await load();
  const ctx = buildPriceContext({ currentUsd: 2400.5, weekAgoUsd: 2400 });
  assert.equal(ctx.direction, 'flat');
});

test('buildPriceContext is bilingual', async () => {
  const { buildPriceContext } = await load();
  const ar = buildPriceContext({ currentUsd: 2424, weekAgoUsd: 2400, lang: 'ar' });
  assert.match(ar.headline, /ارتفع/);
});

test('buildPriceContext returns null without enough data', async () => {
  const { buildPriceContext } = await load();
  assert.equal(buildPriceContext({ currentUsd: 0, weekAgoUsd: 2400 }), null);
  assert.equal(buildPriceContext({ currentUsd: 2400, weekAgoUsd: 0 }), null);
  assert.equal(buildPriceContext({}), null);
});

test('config data is internally consistent', async () => {
  const data = await import('../src/config/insights-data.js');
  const ids = new Set();
  const catIds = new Set(data.INSIGHT_CATEGORIES.map((c) => c.id));
  let featuredCount = 0;
  for (const insight of data.INSIGHTS) {
    assert.ok(!ids.has(insight.id), `duplicate id ${insight.id}`);
    ids.add(insight.id);
    assert.ok(catIds.has(insight.category), `unknown category ${insight.category}`);
    assert.notEqual(insight.category, 'all', 'insights must not use the synthetic all category');
    assert.ok(insight.title.en && insight.title.ar, `missing title for ${insight.id}`);
    assert.ok(insight.excerpt.en && insight.excerpt.ar, `missing excerpt for ${insight.id}`);
    assert.ok(insight.href && insight.href.length > 0, `missing href for ${insight.id}`);
    assert.ok(insight.words > 0, `missing words for ${insight.id}`);
    if (insight.featured) featuredCount += 1;
  }
  assert.equal(featuredCount, 1, 'exactly one featured insight expected');
});
