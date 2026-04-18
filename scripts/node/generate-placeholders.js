#!/usr/bin/env node
/**
 * scripts/node/generate-placeholders.js
 * Create minimal index.html placeholders for directories that lack one.
 * Usage: node scripts/node/generate-placeholders.js [--root <path>]
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const rootArg = args.indexOf('--root');
const root = rootArg >= 0 ? path.resolve(args[rootArg + 1]) : path.resolve(__dirname, '../');

function walkDirs(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(full);
      walkDirs(full, results);
    }
  }
  return results;
}

function ensurePlaceholder(dir) {
  const idx = path.join(dir, 'index.html');
  if (fs.existsSync(idx)) return false;
  const title = path.relative(root, dir) || '/';
  const content = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} — Gold Prices</title></head><body><h1>Placeholder for ${title}</h1><p>This page was auto-generated as a placeholder. Please replace with real content.</p><p><a href="/index.html">Home</a></p></body></html>`;
  try {
    fs.writeFileSync(idx, content, { flag: 'wx' });
    return true;
  } catch (e) {
    return false;
  }
}

const dirs = walkDirs(root);
let created = 0;
for (const d of dirs) {
  // Skip node_modules, .git, dist
  if (/(node_modules|\.git|dist|assets|build|tests)/.test(d)) continue;
  if (ensurePlaceholder(d)) created++;
}

console.log(`Generated ${created} placeholder index.html files under ${root}`);
