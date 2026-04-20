const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

test('shops-data.json has required fields', () => {
  const src = path.resolve(__dirname, '../data/shops-data.json');
  assert.ok(fs.existsSync(src), 'data/shops-data.json must exist');
  const shops = JSON.parse(fs.readFileSync(src, 'utf8'));
  assert.ok(Array.isArray(shops), 'shops file must be a JSON array');
  const problems = shops.filter((s) => !s.name || (!s.country && !s.location));
  assert.equal(problems.length, 0, `shops missing required fields: ${problems.length}`);
});
