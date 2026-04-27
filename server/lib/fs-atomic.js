/**
 * server/lib/fs-atomic.js
 *
 * POSIX-safe atomic JSON write helper (W-4).
 *
 * Writes JSON to a temporary file in the same directory as the target, then
 * renames it over the target. On Linux/macOS, `fs.renameSync` is a single
 * syscall and is atomic — a reader can never observe a partially-written file.
 * On Windows, rename-over-existing succeeds too (Node >= 12 uses MoveFileEx
 * MOVEFILE_REPLACE_EXISTING).
 *
 * Usage:
 *   const { atomicWriteJSON } = require('./fs-atomic.js');
 *   atomicWriteJSON('/data/users.json', users, { mode: 0o600 });
 */

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Serialize `data` to indented JSON and write it atomically to `targetPath`.
 *
 * @param {string}   targetPath  Absolute path to the destination file.
 * @param {unknown}  data        Value to serialize (must be JSON-serializable).
 * @param {{ mode?: number, spaces?: number }} [options]
 *   - `mode`: file permission bits for the destination (default: 0o644).
 *   - `spaces`: JSON.stringify indent depth (default: 2).
 */
function atomicWriteJSON(targetPath, data, { mode = 0o644, spaces = 2 } = {}) {
  const dir = path.dirname(targetPath);
  const tmpPath = path.join(
    dir,
    `.${path.basename(targetPath)}.${crypto.randomBytes(6).toString('hex')}.tmp`
  );

  try {
    const content = JSON.stringify(data, null, spaces);
    // Write to temp file with the desired mode
    fs.writeFileSync(tmpPath, content, { mode });
    // Rename atomically over the target
    fs.renameSync(tmpPath, targetPath);
    // Ensure final mode is correct (rename may inherit the tmp inode on some FSes)
    try {
      fs.chmodSync(targetPath, mode);
    } catch {
      // Best-effort — chmod failure is non-fatal
    }
  } catch (err) {
    // Clean up temp file on failure
    try {
      fs.unlinkSync(tmpPath);
    } catch {
      // Ignore cleanup errors
    }
    throw err;
  }
}

module.exports = { atomicWriteJSON };
