/**
 * Regression: historical gold refresh bot commit must detect staged new/modified files.
 * The original bootstrap used `git diff --quiet` which missed untracked production files.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const os = require('node:os');

const DATA_REL = 'data/historical/xau-usd-daily.json';

function runGit(cwd, args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

test('staged diff detects untracked production dataset (bot commit path)', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hist-bot-commit-'));
  try {
    runGit(tmp, ['init', '-q']);
    runGit(tmp, ['config', 'user.email', 'bot@example.com']);
    runGit(tmp, ['config', 'user.name', 'bot']);
    fs.mkdirSync(path.join(tmp, 'data/historical'), { recursive: true });
    const filePath = path.join(tmp, DATA_REL);
    fs.writeFileSync(
      filePath,
      JSON.stringify({
        dataOrigin: 'live-provider',
        records: [{ date: '2025-06-25', avgUsdOz: 3330 }],
      }),
      'utf8'
    );

    // Old broken check: unstaged diff misses untracked file
    let oldWouldSkip = true;
    try {
      execFileSync('git', ['diff', '--quiet', '--', DATA_REL], { cwd: tmp, stdio: 'pipe' });
      oldWouldSkip = true;
    } catch {
      oldWouldSkip = false;
    }
    assert.equal(
      oldWouldSkip,
      true,
      'unstaged diff incorrectly reports no changes for untracked file'
    );

    runGit(tmp, ['add', DATA_REL]);
    let stagedHasChanges = false;
    try {
      execFileSync('git', ['diff', '--cached', '--quiet', '--', DATA_REL], {
        cwd: tmp,
        stdio: 'pipe',
      });
    } catch {
      stagedHasChanges = true;
    }
    assert.equal(stagedHasChanges, true, 'staged diff must detect new production file');

    runGit(tmp, ['commit', '-m', 'test bot commit']);
    const log = runGit(tmp, ['log', '-1', '--oneline']);
    assert.match(log, /test bot commit/);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
