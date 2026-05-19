'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function read(relPath) {
  return fs.readFileSync(path.resolve(__dirname, '..', relPath), 'utf8');
}

test('homepage contains additive methodology and location guide mounts', () => {
  const html = read('index.html');
  assert.match(html, /id="methodology"/);
  assert.match(html, /id="home-methodology-mount"/);
  assert.match(html, /id="location-guides"/);
  assert.match(html, /id="home-location-guides-mount"/);
});

test('tracker and calculator contain additive trust addon mount slots', () => {
  const trackerHtml = read('tracker.html');
  const calculatorHtml = read('calculator.html');

  assert.match(trackerHtml, /id="tp-freshness-badge-slot"/);
  assert.match(trackerHtml, /id="tp-market-status-slot"/);
  assert.match(trackerHtml, /id="tp-quick-presets-slot"/);
  assert.match(trackerHtml, /id="tp-compare-hints-slot"/);
  assert.match(trackerHtml, /id="tp-export-help-slot"/);
  assert.match(trackerHtml, /id="tp-alerts-help-slot"/);

  assert.match(calculatorHtml, /id="calc-freshness-badge-slot"/);
  assert.match(calculatorHtml, /id="calc-market-status-slot"/);
});

test('new location guides data ships bilingual fields for RTL rendering', () => {
  const json = JSON.parse(read('src/data/location-guides.json'));
  assert.ok(Array.isArray(json) && json.length > 0);
  json.forEach((item) => {
    assert.ok(item.city && item.cityAr, `Missing bilingual city for ${item.slug}`);
    assert.ok(
      item.buyingHabitsEn && item.buyingHabitsAr,
      `Missing bilingual context for ${item.slug}`
    );
    assert.ok(Array.isArray(item.checklistEn) && item.checklistEn.length > 0);
    assert.ok(Array.isArray(item.checklistAr) && item.checklistAr.length > 0);
  });
});
