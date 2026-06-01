const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const CHECK_SCRIPT = path.join(ROOT, 'scripts/node/check-basic-a11y.js');

describe('basic a11y gate', () => {
  it('check-basic-a11y.js exits 0 on the current tree', () => {
    const result = spawnSync(process.execPath, [CHECK_SCRIPT], {
      cwd: ROOT,
      encoding: 'utf8',
    });
    assert.equal(
      result.status,
      0,
      `check-basic-a11y failed:\n${result.stdout}\n${result.stderr}`
    );
  });
});
