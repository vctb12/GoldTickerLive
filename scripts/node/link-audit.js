#!/usr/bin/env node
/**
 * scripts/node/link-audit.js
 * Scans repository HTML files for internal href/src targets and reports missing files.
 * Usage: node scripts/node/link-audit.js --root ./ --out data/link-audit.json
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const rootArg = (() => {
  const i = args.indexOf('--root');
  return i >= 0 ? path.resolve(args[i+1]) : path.resolve(__dirname, '../');
})();
const outArg = (() => {
  const i = args.indexOf('--out');
  return i >= 0 ? path.resolve(args[i+1]) : path.join(rootArg, 'data', 'link-audit.json');
})();

function walk(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.git', 'dist'].includes(entry.name)) continue;
      walk(full, results);
    } else if (entry.name.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

function extractLinks(html) {
  const re = /<(?:a|link)[^>]+href=["']([^"']+)["']|<(?:img|script)[^>]+src=["']([^"']+)["']/g;
  const links = [];
  let m;
  while ((m = re.exec(html))) {
    const href = m[1] || m[2];
    if (!href) continue;
    links.push(href);
  }
  return links;
}

const files = walk(rootArg);
const report = { scanned: files.length, checkedAt: new Date().toISOString(), issues: [] };

for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  const links = extractLinks(html);
  for (const l of links) {
    // skip absolute external URLs
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(l)) continue;
    // skip mailto, tel
    if (/^(mailto:|tel:)/.test(l)) continue;
    // resolve path relative to rootArg when link starts with '/'
    let resolved;
    if (l.startsWith('/')) {
      resolved = path.join(rootArg, l.replace(/^\//, ''));
    } else {
      resolved = path.resolve(path.dirname(f), l.split('#')[0].split('?')[0]);
    }
    // Normalize: if link points to a directory, check for index.html
    let exists = fs.existsSync(resolved);
    if (!exists) {
      if (fs.existsSync(resolved + '.html')) exists = true;
      else if (fs.existsSync(path.join(resolved, 'index.html'))) exists = true;
    }
    if (!exists) {
      report.issues.push({
        file: path.relative(rootArg, f),
        link: l,
        resolved: path.relative(rootArg, resolved),
      });
    }
  }
}

fs.mkdirSync(path.dirname(outArg), { recursive: true });
fs.writeFileSync(outArg, JSON.stringify(report, null, 2), 'utf8');
console.log(`Wrote ${outArg} (scanned ${report.scanned}, issues ${report.issues.length})`);
