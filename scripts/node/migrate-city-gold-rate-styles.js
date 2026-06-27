#!/usr/bin/env node
/**
 * migrate-city-gold-rate-styles.js
 *
 * Conservative migration: strip inline styles, add design-system classes.
 * Run: node scripts/node/migrate-city-gold-rate-styles.js [--dry-run]
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const dryRun = process.argv.includes('--dry-run');

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.name === 'index.html' && full.includes(`${path.sep}gold-rate${path.sep}`)) acc.push(full);
  }
  return acc;
}

function ensureClass(openTag, className) {
  if (new RegExp(`class="[^"]*\\b${className}\\b`).test(openTag)) return openTag;
  if (/class="/i.test(openTag)) {
    return openTag.replace(/class="([^"]*)"/, `class="$1 ${className}"`);
  }
  return openTag.replace(/<(\w+)/, `<$1 class="${className}"`);
}

function anchorClass(attrs, href) {
  if (href.includes('gold-shops')) return 'cgr-chip cgr-chip--gold';
  if (attrs.includes('#fde68a') && /font-weight:\s*500/.test(attrs)) return 'cgr-chip cgr-chip--accent';
  return 'cgr-chip';
}

function migrateAnchors(html) {
  return html.replace(/<a\b([\s\S]*?)>/gi, (full, attrs) => {
    if (!/style="/i.test(attrs)) return full;
    const href = attrs.match(/href="([^"]+)"/i)?.[1];
    if (!href) return full;
    const cls = anchorClass(attrs, href);
    let clean = attrs.replace(/\s+style="[\s\S]*?"/i, '').trim();
    if (/class="/i.test(clean)) {
      clean = clean.replace(/class="([^"]*)"/, `class="${cls} $1"`);
    } else {
      clean = `class="${cls}" ${clean}`;
    }
    return `<a ${clean}>`;
  });
}

function migrateHtml(html) {
  let next = html;

  next = next.replace(/<style>\s*\.city-faq[\s\S]*?<\/style>\s*/i, '');
  next = next.replace(/\s*<link[^>]*fonts\.googleapis\.com[^>]*>\s*/gi, '\n');
  next = next.replace(/\s*<link[^>]*fonts\.gstatic\.com[^>]*>\s*/gi, '\n');

  next = next.replace(/<main\b[\s\S]*?>/i, (tag) => {
    let t = tag.replace(/\s+style="[\s\S]*?"/i, '');
    t = ensureClass(t, 'cgr-page');
    return t;
  });

  next = next.replace(/<h1\b[\s\S]*?>/i, (tag) =>
    ensureClass(tag.replace(/\s+style="[\s\S]*?"/i, ''), 'cgr-page__title')
  );
  next = next.replace(/<p\b[\s\S]*?>\s*Current /i, (tag) =>
    ensureClass(tag.replace(/\s+style="[\s\S]*?"/i, ''), 'cgr-page__intro')
  );

  next = next.replace(/<div\s+id="price-display"[\s\S]*?>/i, '<div id="price-display">');
  next = next.replace(/<div\s+id="freshness-badge"[\s\S]*?>/i, '<div id="freshness-badge">');
  next = next.replace(/<div\s+id="karat-cards"[\s\S]*?>/i, '<div id="karat-cards">');
  next = next.replace(/<div\s+id="price-loading"[\s\S]*?>/i, '<div id="price-loading">');

  next = next.replace(
    /<section\b[\s\S]*?background:\s*#fef9c3[\s\S]*?>/i,
    '<section class="cgr-resources">'
  );
  next = next.replace(/<h2\b[\s\S]*?>\s*📖/i, (tag) =>
    ensureClass(tag.replace(/\s+style="[\s\S]*?"/i, ''), 'cgr-resources__title')
  );

  next = next.replace(
    /<section\b[\s\S]*?margin-top:\s*2rem[\s\S]*?>/i,
    '<section class="cgr-related">'
  );
  next = next.replace(/<h2\b[\s\S]*?>\s*Related Pages/i, (tag) =>
    ensureClass(tag.replace(/\s+style="[\s\S]*?"/i, ''), 'cgr-related__title')
  );

  next = next.replace(
    /<div\s+style="[\s\S]*?display:\s*flex[\s\S]*?flex-wrap:\s*wrap[\s\S]*?>/gi,
    '<div class="cgr-link-row">'
  );
  next = next.replace(
    /<section class="cgr-resources">([\s\S]*?)<\/section>/i,
    (_, body) => `<section class="cgr-resources">${body.replace(/cgr-link-row/g, 'cgr-resources__links')}</section>`
  );
  next = next.replace(
    /<section class="cgr-related">([\s\S]*?)<\/section>/i,
    (_, body) => `<section class="cgr-related">${body.replace(/cgr-link-row/g, 'cgr-related__links')}</section>`
  );

  next = migrateAnchors(next);

  return next;
}

const files = walk(path.join(ROOT, 'countries'));
let changed = 0;

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  const migrated = migrateHtml(original);
  if (migrated !== original) {
    changed += 1;
    if (dryRun) console.log(`[dry-run] ${path.relative(ROOT, file)}`);
    else {
      fs.writeFileSync(file, migrated, 'utf8');
      console.log(`updated ${path.relative(ROOT, file)}`);
    }
  }
}

console.log(`${dryRun ? 'Would update' : 'Updated'} ${changed} gold-rate page(s).`);
