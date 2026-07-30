/**
 * Homepage UAE historical chart — integration smoke tests.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

describe('home UAE historical chart', () => {
  test('index.html contains UAE historical chart section', () => {
    const html = fs.readFileSync('index.html', 'utf8');
    assert.match(html, /UAE Historical Gold Rate Chart/);
    assert.match(html, /uae-hist-chart-root/);
    assert.match(html, /home-chart-section/);
    assert.doesNotMatch(html, /home-chart-container/);
  });

  test('home.js wires UaeHistoricalKaratChart lazy import', () => {
    const src = fs.readFileSync('src/pages/home.js', 'utf8');
    assert.match(src, /UaeHistoricalKaratChart/);
    assert.match(src, /uae-hist-chart-root/);
    assert.doesNotMatch(src, /new GoldChart\('home-chart-container'/);
  });

  test('EN translations include UAE hist keys', () => {
    const en = fs.readFileSync('src/config/translations.en.js', 'utf8');
    assert.match(en, /home\.uaeHistTitle/);
    assert.match(en, /home\.uaeHist\.range1M/);
    assert.match(en, /home\.uaeHist\.dataCoverage/);
    assert.match(en, /home\.uaeHist\.freshness\.stale/);
    assert.match(en, /home\.uaeHist\.summaryLatest/);
  });

  test('AR translations include UAE hist keys', () => {
    const ar = fs.readFileSync('src/config/translations.ar.js', 'utf8');
    assert.match(ar, /home\.uaeHistTitle/);
    assert.match(ar, /home\.uaeHist\.range1M/);
    assert.match(ar, /home\.uaeHist\.dataCoverage/);
    assert.match(ar, /home\.uaeHist\.freshness\.stale/);
    assert.match(ar, /home\.uaeHist\.summaryLatest/);
  });

  test('component file exports UaeHistoricalKaratChart class', () => {
    const src = fs.readFileSync('src/components/UaeHistoricalKaratChart.js', 'utf8');
    assert.match(src, /export class UaeHistoricalKaratChart/);
    assert.match(src, /destroy\(\)/);
  });
});
