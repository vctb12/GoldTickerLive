#!/usr/bin/env node
// scripts/node/image-audit.js
// Reads data/asset-report.json and writes data/image-audit.json with suggestions

const fs = require('fs');
const path = require('path');

const REPORT = path.resolve(__dirname, '../../data/asset-report.json');
const OUT = path.resolve(__dirname, '../../data/image-audit.json');

function human(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(2) + ' MB';
}

if (!fs.existsSync(REPORT)) {
  console.error('Asset report not found:', REPORT);
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(REPORT, 'utf8'));
const images = (report.assets || []).filter((a) => /\.(png|jpg|jpeg)$/i.test(a.path || a.name));

const threshold = 200 * 1024; // 200 KB
const heavy = images
  .filter((i) => (i.size || 0) >= threshold)
  .map((i) => ({
    path: i.path || i.name,
    size: i.size || 0,
    humanSize: human(i.size || 0),
    suggestion: 'convert to AVIF/WebP and resize to target display size',
  }));

const out = { generatedAt: new Date().toISOString(), threshold, heavy };
fs.writeFileSync(OUT, JSON.stringify(out, null, 2), 'utf8');
console.log('Wrote image audit to', OUT);
if (heavy.length) {
  console.log('Large images:');
  heavy.forEach((h) => console.log('-', h.path, h.humanSize));
}
