'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

test('tracker language selector reapplies document locale and static copy', () => {
  const eventsSource = fs.readFileSync(path.join(ROOT, 'src/tracker/events.js'), 'utf8');
  const pageSource = fs.readFileSync(path.join(ROOT, 'src/pages/tracker-pro.js'), 'utf8');

  assert.match(
    eventsSource,
    /await ensureLocale\(_state\.lang\);\s*_cb\.localizeStaticTrackerCopy\?\.\(\);/,
    'the select change path must update html lang/dir before rerendering'
  );
  assert.match(
    pageSource,
    /initEvents\(\{[\s\S]*?localizeStaticTrackerCopy,[\s\S]*?populateSelects,/,
    'tracker-pro must provide the shared locale synchronizer to the event module'
  );
});
