'use strict';

/**
 * Tests for lib/audit-log.js
 * Run with:  npm test
 */

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

// Backup/restore the real audit-logs.json around tests
const AUDIT_LOG_FILE = path.join(__dirname, '../data/audit-logs.json');
let _backup;

before(() => {
  if (fs.existsSync(AUDIT_LOG_FILE)) {
    _backup = fs.readFileSync(AUDIT_LOG_FILE);
  }
  fs.mkdirSync(path.dirname(AUDIT_LOG_FILE), { recursive: true });
  fs.writeFileSync(AUDIT_LOG_FILE, JSON.stringify([]));
});

after(() => {
  if (_backup) {
    fs.writeFileSync(AUDIT_LOG_FILE, _backup);
  } else if (fs.existsSync(AUDIT_LOG_FILE)) {
    fs.unlinkSync(AUDIT_LOG_FILE);
  }
});

const auditLog = require('../lib/audit-log');

describe('logAction', () => {
  test('creates a log entry with required fields', () => {
    const entry = auditLog.logAction('admin@example.com', 'create', 'shop', 'shop_1', {
      name: 'Test Shop',
    });
    assert.ok(entry.id);
    assert.ok(entry.timestamp);
    assert.equal(entry.actor, 'admin@example.com');
    assert.equal(entry.action, 'create');
    assert.equal(entry.entityType, 'shop');
    assert.equal(entry.entityId, 'shop_1');
  });

  test('assigns a unique id to each log entry', () => {
    const a = auditLog.logAction('u1@x.com', 'update', 'shop', 's1', {});
    const b = auditLog.logAction('u1@x.com', 'update', 'shop', 's2', {});
    assert.notEqual(a.id, b.id);
  });
});

describe('getAuditLogs', () => {
  test('returns an array', () => {
    const logs = auditLog.getAuditLogs();
    assert.ok(Array.isArray(logs));
  });
});

describe('getFilteredLogs', () => {
  before(() => {
    auditLog.logAction('alice@x.com', 'create', 'shop', 's10', {});
    auditLog.logAction('bob@x.com', 'delete', 'shop', 's11', {});
    auditLog.logAction('alice@x.com', 'login', 'user', 'alice@x.com', {});
  });

  test('filters by action', () => {
    const result = auditLog.getFilteredLogs({ action: 'delete' });
    assert.ok(result.logs.every((l) => l.action === 'delete'));
  });

  test('filters by actor', () => {
    const result = auditLog.getFilteredLogs({ actor: 'alice@x.com' });
    assert.ok(result.logs.every((l) => l.actor === 'alice@x.com'));
  });

  test('filters by entityType', () => {
    const result = auditLog.getFilteredLogs({ entityType: 'user' });
    assert.ok(result.logs.every((l) => l.entityType === 'user'));
  });

  test('returns correct total count', () => {
    const all = auditLog.getFilteredLogs({});
    assert.ok(all.total >= 3);
  });

  test('paginates correctly', () => {
    const page1 = auditLog.getFilteredLogs({ page: 1, limit: 2 });
    assert.equal(page1.logs.length, Math.min(2, page1.total));
    assert.equal(page1.page, 1);
    assert.equal(page1.limit, 2);
  });

  test('sorts descending by timestamp', () => {
    const result = auditLog.getFilteredLogs({});
    const timestamps = result.logs.map((l) => new Date(l.timestamp).getTime());
    for (let i = 1; i < timestamps.length; i++) {
      assert.ok(timestamps[i - 1] >= timestamps[i], 'should be sorted newest first');
    }
  });
});

describe('exportToCSV', () => {
  test('returns a non-empty string', () => {
    auditLog.logAction('csv@x.com', 'create', 'shop', 's_csv', {});
    const csv = auditLog.exportToCSV();
    assert.ok(typeof csv === 'string' && csv.length > 0);
  });

  test('CSV header row is present', () => {
    const csv = auditLog.exportToCSV();
    const firstLine = csv.split('\n')[0];
    assert.ok(firstLine.includes('Timestamp'));
    assert.ok(firstLine.includes('Action'));
  });

  test('all fields are quoted', () => {
    const csv = auditLog.exportToCSV();
    const lines = csv.split('\n');
    // Every data line should start and end with a quote
    lines.forEach((line) => {
      if (line.trim()) {
        assert.ok(line.startsWith('"'), `Line should start with quote: ${line}`);
      }
    });
  });

  test('neutralises formula injection in actor field', () => {
    // Log a potentially dangerous actor value
    auditLog.logAction('=CMD|"/c calc"!A0', 'create', 'shop', 's_inject', {});
    const csv = auditLog.exportToCSV();
    // The dangerous value should be prefixed with a tab inside the quoted field
    assert.ok(!csv.includes('"=CMD'), 'raw formula should not appear unescaped');
    assert.ok(csv.includes('"\t=CMD'), 'formula should be prefixed with tab');
  });
});

describe('clearOldLogs', () => {
  test('removes entries older than the cutoff', () => {
    const logs = auditLog.getAuditLogs();
    // Manually inject an old log entry
    const oldEntry = {
      id: 'log_old_test',
      timestamp: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(), // 100 days ago
      actor: 'old@x.com',
      action: 'delete',
      entityType: 'shop',
      entityId: 'old_shop',
      changes: {},
    };
    logs.push(oldEntry);
    fs.writeFileSync(AUDIT_LOG_FILE, JSON.stringify(logs));

    const removed = auditLog.clearOldLogs(90); // keep 90 days
    assert.ok(removed >= 1, 'should have removed at least the injected old entry');
    const remaining = auditLog.getAuditLogs();
    assert.ok(!remaining.some((l) => l.id === 'log_old_test'));
  });
});
