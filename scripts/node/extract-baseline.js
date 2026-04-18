#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', '..', 'src', 'lib', 'historical-data.js');
const OUT_DIR = path.join(__dirname, '..', '..', 'src', 'data');
const OUT = path.join(OUT_DIR, 'historical-baseline.json');

function extract() {
  const src = fs.readFileSync(SRC, 'utf8');
  const re = /export\s+const\s+MONTHLY_BASELINE\s*=\s*(\[[\s\S]*?\]);/m;
  const m = src.match(re);
  if (!m) {
    console.error('MONTHLY_BASELINE not found in', SRC);
    process.exit(2);
  }
  const arrCode = m[1];
  // Remove single-line comments and block comments to make it safe for eval
  const cleaned = arrCode.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  let arr;
  try {
    arr = Function('return ' + cleaned)();
  } catch (e) {
    console.error('Failed to evaluate MONTHLY_BASELINE array:', e.message);
    process.exit(3);
  }

  if (!Array.isArray(arr)) {
    console.error('Extracted content is not an array');
    process.exit(4);
  }

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(arr, null, 2), 'utf8');
  console.log('Wrote', OUT);
}

extract();
