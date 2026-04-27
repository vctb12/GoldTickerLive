/**
 * Tests for server/lib/fs-atomic.js (W-4 — atomic JSON writes)
 *
 * Covers: basic atomic write, mode bits, cleanup on error, temp-file absence
 * after successful write.
 */

'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const os = require('os');

const { atomicWriteJSON } = require('../server/lib/fs-atomic.js');

function makeTmpFile() {
  return path.join(
    os.tmpdir(),
    `fs-atomic-test-${Date.now()}-${Math.random().toString(36).slice(2)}.json`
  );
}

test('atomicWriteJSON writes valid JSON to target path', () => {
  const target = makeTmpFile();
  try {
    const data = { hello: 'world', n: 42, arr: [1, 2, 3] };
    atomicWriteJSON(target, data);
    const raw = fs.readFileSync(target, 'utf8');
    const parsed = JSON.parse(raw);
    assert.deepEqual(parsed, data);
  } finally {
    try {
      fs.unlinkSync(target);
    } catch {
      /* already gone */
    }
  }
});

test('atomicWriteJSON leaves no .tmp file after successful write', () => {
  const target = makeTmpFile();
  try {
    atomicWriteJSON(target, { ok: true });
    const dir = path.dirname(target);
    const base = path.basename(target);
    const tmpFiles = fs
      .readdirSync(dir)
      .filter((f) => f.startsWith(`.${base}`) && f.endsWith('.tmp'));
    assert.equal(tmpFiles.length, 0, 'no .tmp files should remain after successful write');
  } finally {
    try {
      fs.unlinkSync(target);
    } catch {
      /* already gone */
    }
  }
});

test('atomicWriteJSON overwrites an existing file atomically', () => {
  const target = makeTmpFile();
  try {
    // Write initial content
    atomicWriteJSON(target, { version: 1 });
    const before = JSON.parse(fs.readFileSync(target, 'utf8'));
    assert.equal(before.version, 1);

    // Overwrite
    atomicWriteJSON(target, { version: 2 });
    const after = JSON.parse(fs.readFileSync(target, 'utf8'));
    assert.equal(after.version, 2);
  } finally {
    try {
      fs.unlinkSync(target);
    } catch {
      /* already gone */
    }
  }
});

test('atomicWriteJSON respects the spaces option', () => {
  const target = makeTmpFile();
  try {
    atomicWriteJSON(target, { a: 1 }, { spaces: 4 });
    const raw = fs.readFileSync(target, 'utf8');
    // 4-space indent means "    " before key
    assert.ok(raw.includes('    "a"'), 'should use 4-space indent');
  } finally {
    try {
      fs.unlinkSync(target);
    } catch {
      /* already gone */
    }
  }
});

test('atomicWriteJSON throws and cleans up when JSON.stringify fails', () => {
  const target = makeTmpFile();
  // A value with a circular reference cannot be JSON-serialised
  const circular = {};
  circular.self = circular;

  assert.throws(() => atomicWriteJSON(target, circular), /circular|cycle|Converting/i);
  // Neither the target nor any .tmp file should be present
  assert.equal(fs.existsSync(target), false, 'target should not exist on error');
  const dir = path.dirname(target);
  const base = path.basename(target);
  const tmpFiles = fs
    .readdirSync(dir)
    .filter((f) => f.startsWith(`.${base}`) && f.endsWith('.tmp'));
  assert.equal(tmpFiles.length, 0, 'no .tmp file should remain after error');
});
