const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const ROOT = path.resolve(__dirname, '..');
const ADMIN_DIR = path.join(ROOT, 'admin');

function read(file) {
  return fs.readFileSync(file, 'utf8');
}

function resolveImport(fromFile, specifier) {
  return path.resolve(path.dirname(fromFile), specifier);
}

test('admin module imports resolve to files in the repo', () => {
  const htmlFiles = fs
    .readdirSync(ADMIN_DIR, { recursive: true })
    .filter((file) => file.endsWith('.html'))
    .map((file) => path.join(ADMIN_DIR, file));

  const jsFiles = fs
    .readdirSync(ADMIN_DIR, { recursive: true })
    .filter((file) => file.endsWith('.js'))
    .map((file) => path.join(ADMIN_DIR, file));

  const files = [...htmlFiles, ...jsFiles];
  const missing = [];
  const importRe = /import\s+(?:[^'"]+\s+from\s+)?['"](\.{1,2}\/[^'"]+)['"]/g;

  for (const file of files) {
    const source = read(file);
    for (const match of source.matchAll(importRe)) {
      const resolved = resolveImport(file, match[1]);
      if (!fs.existsSync(resolved)) {
        missing.push(`${path.relative(ROOT, file)} -> ${match[1]}`);
      }
    }
  }

  assert.deepEqual(missing, []);
});

test('admin shell nav items point at existing admin pages', () => {
  const shellFile = path.join(ADMIN_DIR, 'shared/admin-shell.js');
  const source = read(shellFile);
  const slugs = [...source.matchAll(/slug:\s*'([^']*)'/g)].map((match) => match[1]);
  assert.ok(slugs.includes(''), 'dashboard slug is present');

  const missing = slugs
    .filter((slug, index) => slugs.indexOf(slug) === index)
    .filter((slug) => {
      const target = slug
        ? path.join(ADMIN_DIR, slug, 'index.html')
        : path.join(ADMIN_DIR, 'index.html');
      return !fs.existsSync(target);
    });

  assert.deepEqual(missing, []);
});
