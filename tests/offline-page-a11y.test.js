const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const ROOT = path.join(__dirname, '..');
const OFFLINE = path.join(ROOT, 'offline.html');

function read() {
  return fs.readFileSync(OFFLINE, 'utf8');
}

test('offline.html has exactly one <main> landmark', () => {
  const html = read();
  const mainTags = html.match(/<main[\s\S]*?<\/main>/gi) || [];
  assert.equal(mainTags.length, 1, 'offline.html must contain exactly one <main> element');
});

test('offline.html <main> encloses the offline card', () => {
  const html = read();
  const mainMatch = html.match(/<main[\s\S]*?<\/main>/i);
  assert.ok(mainMatch, 'offline.html must contain a <main> element');
  assert.ok(
    mainMatch[0].includes('id="offline-card"'),
    'The <main> element must enclose the offline card (#offline-card)'
  );
});
