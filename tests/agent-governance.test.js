'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const CHECK_SCRIPT = path.join(__dirname, '..', 'scripts', 'node', 'check-agent-governance.js');

test('check-agent-governance.js passes on current repo', () => {
  const result = spawnSync(process.execPath, [CHECK_SCRIPT], {
    encoding: 'utf8',
    cwd: path.join(__dirname, '..'),
  });
  if (result.status !== 0) {
    console.error(result.stdout);
    console.error(result.stderr);
  }
  assert.equal(result.status, 0, 'agent governance check should pass');
  assert.match(result.stdout, /Agent governance check passed/);
});
