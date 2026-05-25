'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const mod = require(path.resolve(__dirname, '..', 'scripts', 'generate-sitemap.js'));

test('sitemap generator output is valid XML envelope', () => {
  const xml = mod.generateSitemapXml(mod.urls, '2026-05-25');
  assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>/);
  assert.match(xml, /<urlset[\s\S]*<\/urlset>/);
});

test('sitemap generator contains all 18 expected URLs', () => {
  const xml = mod.generateSitemapXml(mod.urls, '2026-05-25');
  const count = (xml.match(/<loc>/g) || []).length;
  assert.equal(count, 18);
});

test('each URL includes hreflang alternate pairs', () => {
  const xml = mod.generateSitemapXml(mod.urls, '2026-05-25');
  const urlBlocks = xml.match(/<url>[\s\S]*?<\/url>/g) || [];
  assert.ok(urlBlocks.length > 0);
  urlBlocks.forEach((block) => {
    assert.match(block, /hreflang="x-default"/);
    assert.match(block, /hreflang="en"/);
    assert.match(block, /hreflang="ar"/);
  });
});

test('priority values are between 0.0 and 1.0', () => {
  mod.urls.forEach((entry) => {
    assert.ok(entry.priority >= 0.0 && entry.priority <= 1.0);
  });
});

test('lastmod uses today ISO date', () => {
  const today = new Date().toISOString().slice(0, 10);
  const xml = mod.generateSitemapXml(mod.urls, today);
  assert.match(xml, new RegExp(`<lastmod>${today}</lastmod>`));
});
