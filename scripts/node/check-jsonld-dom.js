#!/usr/bin/env node
/*
 * JSON-LD / DOM consistency guard.
 *
 * This complements inject-schema.js: schema can only describe content or
 * capabilities that are visible in the page markup.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..', '..');
const SKIP_PREFIXES = [
  'node_modules/',
  'dist/',
  '.git/',
  'admin/',
  'docs/',
  'server/',
  'tests/',
  'src/',
  'styles/',
  'playwright-report/',
  'test-results/',
];

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      if (!SKIP_PREFIXES.some((prefix) => `${rel}/`.startsWith(prefix))) walk(full, acc);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      acc.push(rel);
    }
  }
  return acc;
}

function parseSchemas(html, rel, errors) {
  const schemas = [];
  const blocks = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );
  for (const match of blocks) {
    try {
      const parsed = JSON.parse(match[1].trim());
      const entries = Array.isArray(parsed) ? parsed : [parsed];
      for (const entry of entries) {
        if (entry && Array.isArray(entry['@graph'])) schemas.push(...entry['@graph']);
        else schemas.push(entry);
      }
    } catch (err) {
      errors.push(`${rel}: invalid JSON-LD (${err.message})`);
    }
  }
  return schemas.filter(Boolean);
}

function schemaTypes(schema) {
  const raw = schema['@type'];
  return (Array.isArray(raw) ? raw : [raw]).filter(Boolean);
}

function checkSchema(rel, html, schema, errors) {
  const types = schemaTypes(schema);

  if (types.includes('FAQPage') && !/FAQPage|faq-list|<details\b|أسئلة|الأسئلة/i.test(html)) {
    errors.push(`${rel}: FAQPage schema exists without visible FAQ markup`);
  }

  if (types.includes('WebSite') && !/content\/search|nav-search|type=["']search["']/i.test(html)) {
    errors.push(`${rel}: WebSite SearchAction schema exists without visible search affordance`);
  }

  if (types.includes('WebApplication') && !/tracker|calculator|حاسبة|تتبع/i.test(html)) {
    errors.push(`${rel}: WebApplication schema exists without visible app/tool affordance`);
  }

  if (types.includes('Article') && !/<h1\b[^>]*>[\s\S]*?<\/h1>/i.test(html)) {
    errors.push(`${rel}: Article schema exists without a visible h1`);
  }

  if (types.includes('Product')) {
    if (!/gold|ذهب/i.test(html)) {
      errors.push(`${rel}: Product schema exists on a page without visible gold context`);
    }
    if (!/reference|spot|retail|price|prices|rate|rates|سعر|أسعار|الفوري/i.test(html)) {
      errors.push(`${rel}: Product schema lacks visible price/trust context`);
    }
  }
}

function main() {
  const errors = [];
  let checked = 0;
  for (const rel of walk(ROOT)) {
    const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    if (/name=["']robots["'][^>]*noindex/i.test(html)) continue;
    const schemas = parseSchemas(html, rel, errors);
    if (!schemas.length) continue;
    checked += 1;
    for (const schema of schemas) checkSchema(rel, html, schema, errors);
  }

  if (errors.length) {
    console.error(
      `JSON-LD DOM check failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):`
    );
    for (const error of errors.slice(0, 50)) console.error(`  - ${error}`);
    if (errors.length > 50) console.error(`  ... and ${errors.length - 50} more`);
    process.exit(1);
  }

  console.log(`JSON-LD DOM check passed (${checked} pages with JSON-LD scanned).`);
}

main();
