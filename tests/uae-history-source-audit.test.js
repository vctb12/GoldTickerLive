/**
 * Tests for UAE history source audit script.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const AUDIT_SCRIPT = path.join(__dirname, '../scripts/node/audit-uae-history-source.js');
const REPORT_JSON = path.join(__dirname, '../reports/uae-history-source-audit-2026-07-29.json');

describe('audit-uae-history-source', () => {
  test('audit script runs and writes JSON report', () => {
    const result = spawnSync('node', [AUDIT_SCRIPT], {
      encoding: 'utf8',
      timeout: 30000,
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.ok(fs.existsSync(REPORT_JSON), 'expected JSON report file');

    const report = JSON.parse(fs.readFileSync(REPORT_JSON, 'utf8'));
    assert.ok(report.auditTimestampUtc);
    assert.equal(report.endpoint, 'https://freegoldapi.com/data/latest.json');
    assert.equal(report.httpStatus, 200);
    assert.ok(report.rawRecordCount > 0);
    assert.ok(report.unifiedLatest);
    assert.ok(
      ['current', 'delayed', 'stale', 'unavailable'].includes(report.freshnessClassification)
    );
    assert.ok(report.baseline.provenanceNote.includes('not documented'));
  });
});
