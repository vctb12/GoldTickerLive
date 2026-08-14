'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const learnHtml = fs.readFileSync(path.join(__dirname, '..', 'learn.html'), 'utf8');

test('learn.html ships substantive static body without JS', () => {
  assert.match(learnHtml, /data-static-fallback="true"/);
  assert.match(learnHtml, /id="karats"/);
  assert.match(learnHtml, /id="pricing"/);
  assert.match(learnHtml, /id="aed-peg"/);
  assert.match(learnHtml, /id="zakat"/);
  assert.match(learnHtml, /id="hallmark"/);
  assert.match(learnHtml, /id="faq"/);
  assert.match(learnHtml, /Gold Karats Explained/);
  assert.match(learnHtml, /learn-hub-toc-link[^>]+href="#karats"/);
  assert.match(learnHtml, /learn-guide-card/);
});

test('learn static fallback markers are present for build regeneration', () => {
  assert.match(learnHtml, /<!-- LEARN_STATIC_FALLBACK:START -->/);
  assert.match(learnHtml, /<!-- LEARN_STATIC_FALLBACK:END -->/);
});

test('learn static fallback does not contain a disabled filter input', () => {
  const fallbackMatch = learnHtml.match(
    /<!-- LEARN_STATIC_FALLBACK:START -->[\s\S]*?<!-- LEARN_STATIC_FALLBACK:END -->/
  );
  assert.ok(fallbackMatch, 'static fallback markers should be present');
  const fallbackBlock = fallbackMatch[0];
  assert.ok(
    !fallbackBlock.includes('learn-hub-filter'),
    'static fallback must not contain a disabled filter input'
  );
});
